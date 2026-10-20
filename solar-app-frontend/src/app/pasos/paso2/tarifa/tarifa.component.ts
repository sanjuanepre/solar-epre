import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
  OnDestroy,
  HostListener,
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
export class TarifaComponent implements OnInit, AfterViewInit, OnDestroy {
  tarifaContratada: string = '';
  consumosMensuales: number[] = [];
  potenciaMaxAsignadakW!: number;
  inputPotenciaContratada: number | null = null;
  private isDialogOpen: boolean = false;
  private maxPanelsAllowed!: number;
  isDropdownOpen: boolean = false;

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
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-select')) {
      this.isDropdownOpen = false;
    }
  }

  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectTarifa(value: string, event: MouseEvent): void {
    event.stopPropagation();
    this.tarifaContratada = value;
    this.isDropdownOpen = false;
    this.onTarifaChange();
  }

  getSelectedLabel(): string {
    const found = this.tarifas.find(t => t.value === this.tarifaContratada);
    return found ? found.viewValue : '';
  }

  ngOnInit(): void {
this.maxPanelsAllowed = this.sharedService.getPanelsSelected();
    this.sharedService.tarifaContratada$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((tarifa) => {
        if (tarifa !== '') {
this.tarifaContratada = tarifa;
          if (this.tarifaContratada && !this.isDialogOpen) {
// this.updatePotenciaMaxAsignada();
            this.checkPotenciaExcedida();
          }
        }
      });

    this.sharedService.potenciaMaxAsignadaW$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe({
        next: (newPotenciaMaxW) => {
          if (newPotenciaMaxW > 0) {
this.potenciaMaxAsignadakW = newPotenciaMaxW / 1000;
/* if (!this.isDialogOpen && this.tarifaContratada) {
this.checkPotenciaExcedida();
            } */
          }
        },
      });

    this.sharedService.potenciaInstalacionW$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((potencia) => {
        if (potencia > 0) {
if (!this.isDialogOpen && this.potenciaMaxAsignadakW) {
this.checkPotenciaExcedida();
          }
        }
      });

    this.mapService.panelsRedrawn$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((panelesCantidad) => {
this.sharedService.setPanelsCountSelected(panelesCantidad);
      });

    this.sharedService.panelsCountSelected$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((count) => {
        if (count > 0 && this.potenciaMaxAsignadakW) {
}
      });

}

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isOptionSelected(): boolean {
    return this.tarifaContratada !== '';
  }

  onTarifaChange(): void {

    this.updatePotenciaMaxAsignada();
const tarifaSeleccionada = this.tarifas.find(
      (tarifa) => tarifa.value === this.tarifaContratada
    );
if (tarifaSeleccionada) {
      this.sharedService.setTarifaContratada(this.tarifaContratada);
const isSelected = this.isOptionSelected();
this.isCategorySelected.emit(isSelected);

      /* this.calcularMaxPanelsPerMaxPotencia();
*/

      this.updateConsumosMensuales();
/* if (!this.isDialogOpen) {
        this.checkPotenciaExcedida();
      }
*/
    } else {
} 

}

  getMaxPotenciaPermitida(): number {
    if (['T3-BT', 'T3-MT 13.2R', 'TRA-SD'].includes(this.tarifaContratada)) {
      return 2000; // 2000 kW
    }
    return this.sharedService.getPotenciaMaxAsignadaW();
  }

  openDialog(): void {
    this.isDialogOpen = true;
const potenciaInstalacionkW =
      this.sharedService.getPotenciaInstalacionW() / 1000;
    const potenciaMaxAsignadakW =
      this.sharedService.getPotenciaMaxAsignadaW() / 1000;

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
        potenciaInstalada: potenciaInstalacionkW,
        potenciaMaxAsignada: potenciaMaxAsignadakW,
        tarifaContratada: this.sharedService.getTarifaContratada(),
        buttonStyles: {
          confirm: 'botones-modal', // Clase para el botón de confirmar
          cancel: 'botones-modal', // Clase para el botón de cancelar
        },
      },
    });
dialogRef.afterClosed().subscribe((result) => {
if (result) {
this.calcularMaxPanelsPerMaxPotencia();
const panelsSelected = this.sharedService.getPanelsSelected();
        
this.mapService.reDrawPanels(panelsSelected);
        this.isDialogOpen = false;
      } else {
this.sharedService.setTarifaContratada('');
        this.sharedService.setTutorialShown(true);
        this.mapService.clearDrawing();
        this.isDialogOpen = false;
        this.sharedService.resetAll();
      }
    });
  }
  private calcularMaxPanelsPerMaxPotencia() {
let maxPanelsAllowed = 0;
    const panelCapacityW = this.sharedService.getPanelCapacityW();
const maxPotenciaContratadaW = this.sharedService.getPotenciaMaxAsignadaW();
const maxPanelsPerMaxPotencia = maxPotenciaContratadaW / panelCapacityW;
const maxPanelsPerSurface = this.sharedService.getMaxPanelsPerSuperface();
if (maxPanelsPerMaxPotencia >= maxPanelsPerSurface) {
maxPanelsAllowed = maxPanelsPerSurface;
this.sharedService.setPanelsCountSelected(maxPanelsAllowed);
    } else {
maxPanelsAllowed = Math.floor(maxPanelsPerMaxPotencia);
this.sharedService.setPanelsCountSelected(maxPanelsAllowed);
    }
    this.sharedService.setMaxPanelsPerMaxPotencia(
      Math.floor(maxPanelsPerMaxPotencia)
    );
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
if (this.potenciaMaxAsignadakW < 0) {
      this.potenciaMaxAsignadakW = 0;
}

    if (this.tarifaContratada === 'T2-CMP') {
      this.potenciaMaxAsignadakW = Math.max(
        20,
        Math.min(this.potenciaMaxAsignadakW, 50)
      );
} else if (
      ['T3-BT', 'T3-MT 13.2R', 'TRA-SD'].includes(this.tarifaContratada)
    ) {
if (
        this.potenciaMaxAsignadakW < 50 &&
        this.tarifaContratada !== 'TRA-SD'
      ) {
        this.potenciaMaxAsignadakW = 50;
} else if (
        this.tarifaContratada === 'TRA-SD' &&
        this.potenciaMaxAsignadakW < 10
      ) {
        this.potenciaMaxAsignadakW = 10;
}
    }

this.sharedService.setPotenciaMaxAsignadaW(
      this.potenciaMaxAsignadakW * 1000
    );
if (!this.isDialogOpen) {
      this.checkPotenciaExcedida();
    }
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

    const value = event.target.value;
if (!isNaN(value)) {
this.potenciaMaxAsignadakW = Math.round(value);
this.onPotenciaInputChange();
this.sharedService.setPotenciaMaxAsignadaW(
        this.potenciaMaxAsignadakW * 1000
      );
if (!this.isDialogOpen) {
        this.checkPotenciaExcedida();
      }
this.cdr.detectChanges();
} else {
}

}

  formatLabel(value: number): string {
    return new Intl.NumberFormat('es-ES').format(value * 1000);
  }

  private updatePotenciaMaxAsignada(): void {

    const tarifaSeleccionada = this.tarifas.find(
      (t) => t.value === this.tarifaContratada
    );
if (tarifaSeleccionada) {
this.potenciaMaxAsignadakW = tarifaSeleccionada.potenciaMaxAsignadakW;
const potenciaMaxAsignadaW = this.potenciaMaxAsignadakW * 1000;
this.sharedService.setPotenciaMaxAsignadaW(potenciaMaxAsignadaW);
} else {
}

}

  private checkPotenciaExcedida(): void {
    const panelsCount = this.sharedService.getPanelsSelected();
    const panelCapacity = this.sharedService.getPanelCapacityW();
    const potenciaInstalada = panelsCount * panelCapacity;
    const potenciaMaxAsignada = this.potenciaMaxAsignadakW * 1000;

if (
      potenciaMaxAsignada > 0 &&
      potenciaInstalada > potenciaMaxAsignada &&
      !this.isDialogOpen
    ) {
if (!this.isDialogOpen) {
        this.isDialogOpen = true;
        this.openDialog();
      }
    } else {
      const maxPanelsPerPotentiaMax = this.potenciaMaxAsignadakW / (this.sharedService.getPanelCapacityW() / 1000);
const maxPanelsPerSurface = this.maxPanelsAllowed;
this.mapService.reDrawPanels(
        Math.min(maxPanelsPerPotentiaMax, maxPanelsPerSurface)
      );
    }
  }
}
