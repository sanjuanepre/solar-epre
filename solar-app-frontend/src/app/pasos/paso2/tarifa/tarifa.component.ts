import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
  LOCALE_ID,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Tarifa } from 'src/app/interfaces/tarifa';
import { ConsumoTarifaService } from 'src/app/services/consumo-tarifa.service';
import { MapService } from 'src/app/services/map.service';
import { SharedService } from 'src/app/services/shared.service';
import { TarifaDialogComponent } from './tarifa-dialog/tarifa-dialog.component';
import { DecimalPipe } from '@angular/common';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-tarifa',
  templateUrl: './tarifa.component.html',
  styleUrls: ['./tarifa.component.css'],
  providers: [DecimalPipe],
})
export class TarifaComponent implements OnInit, AfterViewInit {
  tarifaContratada: string = '';
  consumosMensuales: number[] = [];
  potenciaMaxAsignadakW!: number;
  inputPotenciaContratada: number | null = null;
  private isDialogOpen: boolean = false;

  @Output() isCategorySelected = new EventEmitter<boolean>(false);
  @ViewChild('tarifaSelect') tarifaSelect!: ElementRef;
  tarifas: Tarifa[] = [
    {
      value: 'T1-R',
      viewValue: 'Pequeña Demanda Residencial (T1-R1, T1-R2 o T1-R3)',
      potenciaMaxAsignadakW: 10,
    },
    {
      value: 'T1-G',
      viewValue: 'Pequeña Demanda General (T1-G1, T1-G2 o T1-G3)',
      potenciaMaxAsignadakW: 10,
    },
    {
      value: 'T2-SMP',
      viewValue: 'Mediana Demanda sin Medición de Potencia (T2-SMP)',
      potenciaMaxAsignadakW: 20,
    },
    {
      value: 'T2-CMP',
      viewValue: 'Mediana Demanda con Medición de Potencia (T2-CMP)',
      potenciaMaxSugerida: 25,
      potenciaMaxAsignadakW: 50,
      potenciaMaxMinima: 20,
      potenciaMaxMaxima: 50,
    },
    {
      value: 'T3-BT',
      viewValue: 'Grande Demanda en Baja Tensión (T3-BT)',
      potenciaMaxSugerida: 95,
      potenciaMaxAsignadakW: 95,
      potenciaMaxMinima: 50,
    },
   /*  {
      value: 'T3-MT 13.2R',
      viewValue: 'Grande Demanda en Media Tensión (T3-MT 13,2 kV, T3-MT 33 kV)',
      potenciaMaxSugerida: 155,
      potenciaMaxAsignadakW: 155,
      potenciaMaxMinima: 50,
    }, */
    {
      value: 'TRA-SD',
      viewValue: 'Riego Agrícola (TRA-SD)',
      potenciaMaxSugerida: 55,
      potenciaMaxAsignadakW: 35,
      potenciaMaxMinima: 10,
    },
  ];
  formattedValue: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private sharedService: SharedService,
    private consumoTarifaService: ConsumoTarifaService,
    private mapService: MapService,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private decimalPipe: DecimalPipe
  ) {}

  ngOnInit(): void {
    console.log('Iniciando ngOnInit en TarifaComponent');

    this.sharedService.tarifaContratada$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((tarifa) => {
        console.log('Nueva tarifa contratada recibida:', tarifa);
        this.tarifaContratada = tarifa;
        if (this.tarifaContratada && !this.isDialogOpen) {
          console.log(
            'Actualizando potencia máxima asignada y verificando potencia excedida'
          );
          this.updatePotenciaMaxAsignada();
          this.checkPotenciaExcedida();
        }
      });

    this.sharedService.potenciaMaxAsignadaW$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe({
        next: (newPotenciaMax) => {
          console.log(
            'Nueva potencia máxima asignada recibida (W):',
            newPotenciaMax
          );
          this.potenciaMaxAsignadakW = newPotenciaMax / 1000;
          console.log(
            'Potencia máxima asignada convertida a kW:',
            this.potenciaMaxAsignadakW
          );
          if (!this.isDialogOpen && this.tarifaContratada) {
            console.log('Verificando potencia excedida');
            this.checkPotenciaExcedida();
          }
        },
      });

    this.sharedService.potenciaInstalacionW$
      .pipe(takeUntil(this.destroy$))
      .subscribe((potencia) => {
        console.log('Nueva potencia instalada recibida:', potencia);
        if (!this.isDialogOpen) {
          console.log('Verificando potencia excedida');
          this.checkPotenciaExcedida();
        }
      });

    this.mapService.panelsRedrawn$
      .pipe(takeUntil(this.destroy$))
      .subscribe((panelesCantidad) => {
        console.log('Paneles redibujados, nueva cantidad:', panelesCantidad);
        this.sharedService.setPanelsCountSelected(panelesCantidad);
        /* 
        console.log('Actualizando consumos mensuales');
        this.updateConsumosMensuales(); */
      });

    this.sharedService.panelsCountSelected$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((count) => {
        console.log('Nuevo conteo de paneles recibido:', count);
        if (!this.isDialogOpen) {
          console.log('Verificando potencia excedida');
          this.checkPotenciaExcedida();
        }
      });

    console.log('Finalizando ngOnInit en TarifaComponent');
  }

  ngAfterViewInit(): void {}

  isOptionSelected(): boolean {
    return this.tarifaContratada !== '';
  }

  onTarifaChange(): void {
    console.log('Iniciando onTarifaChange');
    console.log('Tarifa contratada:', this.tarifaContratada);

    this.updatePotenciaMaxAsignada();
    console.log('Después de updatePotenciaMaxAsignada');

    const tarifaSeleccionada = this.tarifas.find(
      (tarifa) => tarifa.value === this.tarifaContratada
    );
    console.log('Tarifa seleccionada:', tarifaSeleccionada);

    if (tarifaSeleccionada) {
      this.potenciaMaxAsignadakW = tarifaSeleccionada.potenciaMaxAsignadakW;
      console.log('Potencia máxima asignada (kW):', this.potenciaMaxAsignadakW);

      this.sharedService.setPotenciaMaxAsignadaW(
        this.potenciaMaxAsignadakW * 1000
      );
      console.log(
        'Potencia máxima asignada (W):',
        this.potenciaMaxAsignadakW * 1000
      );

      this.sharedService.setTarifaContratada(this.tarifaContratada);
      console.log('Tarifa contratada actualizada en SharedService');

      const isSelected = this.isOptionSelected();
      console.log('¿Opción seleccionada?', isSelected);
      this.isCategorySelected.emit(isSelected);

      this.calcularMaxPanelsPerMaxPotencia();
      console.log('Después de calcularMaxPanelsPerMaxPotencia');

      this.updateConsumosMensuales();
      console.log('Después de updateConsumosMensuales');

      if (!this.isDialogOpen) {
        this.checkPotenciaExcedida();
      }
      console.log('Después de checkPotenciaExcedida');
    } else {
      console.log('No se encontró una tarifa seleccionada');
    }

    console.log('Finalizando onTarifaChange');
  }

  getMaxPotenciaPermitida(): number {
    if (['T3-BT', 'T3-MT 13.2R', 'TRA-SD'].includes(this.tarifaContratada)) {
      return 2000; // 2000 kW
    }
    return this.sharedService.getPotenciaMaxAsignadaValue();
  }

  openDialog(): void {
    this.isDialogOpen = true;
    console.log('isDialogOpen establecido a true');

    const potenciaInstalacion =
      this.sharedService.getPotenciaInstalacionW() / 1000;
    const potenciaMaxAsignada =
      this.sharedService.getPotenciaMaxAsignadaValue() / 1000;
    console.log('Potencia de instalación:', potenciaInstalacion, 'kWh');
    console.log('Potencia máxima asignada:', this.potenciaMaxAsignadakW, 'kW');

    const dialogRef = this.dialog.open(TarifaDialogComponent, {
      /* width: '30%',*/
      width: '400px',
      height: '',
      minWidth: '400px',
      maxWidth: '',
      minHeight: '',
      maxHeight: '',
      position: { top: '', bottom: '', left: '', right: '' },
      disableClose: true,
      hasBackdrop: true,
      panelClass: 'responsive-dialog', // Clase personalizada
      backdropClass: 'responsive-backdrop', // Clase personalizada
      autoFocus: true,
      closeOnNavigation: false,
      data: {
        potenciaInstalada: potenciaInstalacion,
        potenciaMaxAsignada: potenciaMaxAsignada,
        tarifaContratada: this.sharedService.getTarifaContratada(),
        buttonStyles: {
          confirm: 'botones-modal', // Clase para el botón de confirmar
          cancel: 'botones-modal', // Clase para el botón de cancelar
        },
      },
    });
    console.log('Diálogo abierto');

    dialogRef.afterClosed().subscribe((result) => {
      console.log('Diálogo cerrado, resultado:', result);

      if (result) {
        
        console.log('isDialogOpen establecido a false');
        this.calcularMaxPanelsPerMaxPotencia();
        console.log('Recalculando máximo de paneles');

        const panelsSelected = this.sharedService.getPanelsSelected();
        console.log('Redibujando paneles, cantidad:', panelsSelected);
        this.mapService.reDrawPanels(panelsSelected);
        this.isDialogOpen = false;
      } else {
        console.log('Reiniciando configuración');
        this.sharedService.setTarifaContratada('');
        this.sharedService.setTutorialShown(true);
        this.mapService.clearDrawing();
        this.isDialogOpen = false;
        this.sharedService.resetAll();
      }
    });
  }
  private calcularMaxPanelsPerMaxPotencia() {
    console.log('Iniciando calcularMaxPanelsPerMaxPotencia');

    const panelCapacity = this.sharedService.getPanelCapacityW();
    console.log('Capacidad del panel:', panelCapacity, 'W');

    const maxPotenciaContratada =
      this.sharedService.getPotenciaMaxAsignadaValue();
    console.log('Potencia máxima contratada:', maxPotenciaContratada, 'W');

    const maxPanelsPerMaxPotencia = maxPotenciaContratada / panelCapacity;
    console.log(
      'Máximo de paneles por potencia máxima:',
      maxPanelsPerMaxPotencia
    );

    const maxPanelsPerSurface = this.sharedService.getMaxPanelsPerSuperface();
    console.log('Máximo de paneles por superficie:', maxPanelsPerSurface);

    if (maxPanelsPerMaxPotencia >= maxPanelsPerSurface) {
      console.log(
        'Limitado por superficie. Estableciendo paneles a:',
        maxPanelsPerSurface
      );
      this.sharedService.setPanelsCountSelected(maxPanelsPerSurface);
    } else {
      console.log(
        'Limitado por potencia. Estableciendo paneles a:',
        Math.floor(maxPanelsPerMaxPotencia)
      );
      this.sharedService.setPanelsCountSelected(
        Math.floor(maxPanelsPerMaxPotencia)
      );
    }

    console.log('Finalizando calcularMaxPanelsPerMaxPotencia');
  }

  updateConsumosMensuales(): void {
    this.consumosMensuales = this.consumoTarifaService.getConsumoMensual(
      this.tarifaContratada
    );
  }

  isPotenciaMaxDisabled(): boolean {
    const tarifasDeshabilitadas = ['T1-R', 'T1-G', 'T2-SMP'];
    return tarifasDeshabilitadas.some((tarifa) =>
      this.tarifaContratada.includes(tarifa)
    );
  }

  onPotenciaInputChange(): void {
    console.log('Iniciando onPotenciaInputChange');
    console.log(
      'Valor inicial de potenciaMaxAsignadakW:',
      this.potenciaMaxAsignadakW
    );
    console.log('Tarifa contratada:', this.tarifaContratada);

    if (this.potenciaMaxAsignadakW < 0) {
      this.potenciaMaxAsignadakW = 0;
      console.log('Potencia ajustada a 0 por ser negativa');
    }

    if (this.tarifaContratada === 'T2-CMP') {
      this.potenciaMaxAsignadakW = Math.max(
        20,
        Math.min(this.potenciaMaxAsignadakW, 50)
      );
      console.log('Potencia ajustada para T2-CMP:', this.potenciaMaxAsignadakW);
    } else if (
      ['T3-BT', 'T3-MT 13.2R', 'TRA-SD'].includes(this.tarifaContratada)
    ) {
      console.log('Tarifa en grupo especial:', this.tarifaContratada);
      if (
        this.potenciaMaxAsignadakW < 50 &&
        this.tarifaContratada !== 'TRA-SD'
      ) {
        this.potenciaMaxAsignadakW = 50;
        console.log('Potencia ajustada a 50 para T3-BT o T3-MT 13.2R');
      } else if (
        this.tarifaContratada === 'TRA-SD' &&
        this.potenciaMaxAsignadakW < 10
      ) {
        this.potenciaMaxAsignadakW = 10;
        console.log('Potencia ajustada a 10 para TRA-SD');
      }
    }

    console.log('Potencia final en kW:', this.potenciaMaxAsignadakW);
    this.sharedService.setPotenciaMaxAsignadaW(
      this.potenciaMaxAsignadakW * 1000
    );
    console.log(
      'Potencia enviada al SharedService en W:',
      this.potenciaMaxAsignadakW * 1000
    );

    if (!this.isDialogOpen) {
      this.checkPotenciaExcedida();
    }
    console.log('Finalizado onPotenciaInputChange');
  }

  getRangoPotenciaMensaje(): string {
    switch (this.tarifaContratada) {
      case 'T2-CMP':
        return 'Ingrese un valor entre 20 kW y 50 kW';
      case 'T3-BT':
      case 'T3-MT 13.2R':
        return 'Ingrese un valor mayor a 50 kW';
      case 'TRA-SD':
        return 'Ingrese un valor mayor a 10 kW';
      default:
        return `Potencia Máxima asignada: ${this.potenciaMaxAsignadakW} kW`;
    }
  }

  getPotenciaMinimakW(): number {
    switch (this.tarifaContratada) {
      case 'T2-CMP':
        return 20;
      case 'T3-BT':
      case 'T3-MT 13.2R':
        return 50;
      case 'TRA-SD':
        return 10;
      default:
        return 0;
    }
  }

  getPotenciaMaximakW(): number | null {
    switch (this.tarifaContratada) {
      case 'T2-CMP':
        return 50;
      case 'T3-BT':
      case 'T3-MT 13.2R':
      case 'TRA-SD':
        return 2000;
      default:
        return null;
    }
  }

  onSliderChange(event: any): void {
    console.log('Iniciando onSliderChange');
    console.log('Evento recibido:', event);

    const value = event.target.value;
    console.log('Valor extraído del evento:', value);

    if (!isNaN(value)) {
      console.log('El valor es un número válido');

      this.potenciaMaxAsignadakW = Math.round(value);
      console.log(
        'Potencia máxima asignada (kW) redondeada:',
        this.potenciaMaxAsignadakW
      );

      this.onPotenciaInputChange();
      console.log('Después de llamar a onPotenciaInputChange()');

      this.sharedService.setPotenciaMaxAsignadaW(
        this.potenciaMaxAsignadakW * 1000
      );
      console.log(
        'Potencia máxima asignada (W) enviada al SharedService:',
        this.potenciaMaxAsignadakW * 1000
      );

      if (!this.isDialogOpen) {
        this.checkPotenciaExcedida();
      }
      console.log('Después de llamar a checkPotenciaExcedida()');

      this.cdr.detectChanges();
      console.log('Detección de cambios forzada');
    } else {
      console.log('El valor no es un número válido');
    }

    console.log('Finalizando onSliderChange');
  }

  formatLabel(value: number): string {
    return new Intl.NumberFormat('es-ES').format(value * 1000);
  }

  private updatePotenciaMaxAsignada(): void {
    console.log('Iniciando updatePotenciaMaxAsignada');
    console.log('Tarifa contratada:', this.tarifaContratada);

    const tarifaSeleccionada = this.tarifas.find(
      (t) => t.value === this.tarifaContratada
    );
    console.log('Tarifa seleccionada:', tarifaSeleccionada);

    if (tarifaSeleccionada) {
      console.log(
        'Potencia máxima asignada (kW) antes:',
        this.potenciaMaxAsignadakW
      );
      this.potenciaMaxAsignadakW = tarifaSeleccionada.potenciaMaxAsignadakW;
      console.log(
        'Potencia máxima asignada (kW) después:',
        this.potenciaMaxAsignadakW
      );

      const potenciaMaxAsignadaW = this.potenciaMaxAsignadakW * 1000;
      console.log('Potencia máxima asignada (W):', potenciaMaxAsignadaW);
      this.sharedService.setPotenciaMaxAsignadaW(potenciaMaxAsignadaW);
      console.log('Potencia máxima asignada actualizada en SharedService');
    } else {
      console.log('No se encontró una tarifa seleccionada');
    }

    console.log('Finalizando updatePotenciaMaxAsignada');
  }

  private checkPotenciaExcedida(): void {
    const panelsCount = this.sharedService.getPanelsSelected();
    const panelCapacity = this.sharedService.getPanelCapacityW();
    const potenciaInstalada = panelsCount * panelCapacity;
    const potenciaMaxAsignada = this.potenciaMaxAsignadakW * 1000;

    console.log('Verificando potencia excedida:');
    console.log('Cantidad de paneles:', panelsCount);
    console.log('Capacidad por panel:', panelCapacity);
    console.log('Potencia instalada:', potenciaInstalada);
    console.log('Potencia máxima asignada:', potenciaMaxAsignada);

    if (
      potenciaMaxAsignada > 0 &&
      potenciaInstalada > potenciaMaxAsignada &&
      !this.isDialogOpen
    ) {
      console.log('Abriendo diálogo de potencia excedida');
      if (!this.isDialogOpen) {
        this.isDialogOpen = true;
        this.openDialog();
      }
    } else {
      console.log('No se necesita abrir el diálogo');
      console.log(
        'Razón:',
        potenciaMaxAsignada <= 0
          ? 'Potencia máxima no asignada'
          : 'Potencia instalada no excede el máximo'
      );
    }
  }
}
