import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TarifaComponent } from './tarifa/tarifa.component';
import { MapService } from 'src/app/services/map.service';
import { InstruccionesComponent } from 'src/app/instrucciones/instrucciones.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { ConsumoComponent } from './consumo/consumo.component';
import { driver } from 'driver.js';
import { SharedService } from 'src/app/services/shared.service';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-paso2',
  templateUrl: './paso2.component.html',
  styleUrls: ['./paso2.component.css'],
})
export class Paso2Component implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  currentStep: number = 2;
  allFieldsFilled: boolean = false;
  tarifaContratada!: string;
  isCategorySelected: boolean = false;
  isFieldsDisabled: boolean = true;
  isEditable: boolean = false;
  driverObj: any;
  tutorialShown: boolean = false;
  showInstructionsModal: boolean = false;

  @ViewChild('botonSiguiente') botonSiguiente!: ElementRef;
  @ViewChild(TarifaComponent) tarifaComponent!: TarifaComponent;
  @ViewChild('manualToggle') manualToggle!: MatSlideToggle;
  @ViewChild(ConsumoComponent) consumoComponent!: ConsumoComponent;
  @ViewChild('consumoContainer') consumoContainer!: ElementRef;
  @ViewChild('categoriaSelect') categoriaSelect!: ElementRef;

  driverObjInit: any;
  driverObjConsumo: any;
  potenciaMaxAsignada!: number;
  panelsSelected!: number;
  potenciaInstalacionW!: number;
  consumoTotalkW!: number;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private mapService: MapService,
    public dialog: MatDialog,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.sharedService.tutorialShown$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((shown) => {
        this.tutorialShown = shown;
      });

    // Suscripciones a propiedades del SharedService con console.log para depuración
    this.sharedService.potenciaMaxAsignadaW$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((potenciaMax) => {
        if (potenciaMax > 0) {
          this.potenciaMaxAsignada = potenciaMax;
} else {
}
      });

    this.sharedService.panelsCountSelected$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((panels) => {
        this.panelsSelected = panels;
});

    this.sharedService.potenciaInstalacionW$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((potenciaInstalacion) => {
        this.potenciaInstalacionW = potenciaInstalacion;
});

    this.sharedService.tarifaContratada$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((tarifa) => {
        if (tarifa !== '') {
          this.tarifaContratada = tarifa;
} else {
}
      });
  }

  ngAfterViewInit(): void {
    const urlFromPaso1 =
      this.router.url === '/pasos/2' &&
      this.router
        .getCurrentNavigation()
        ?.previousNavigation?.finalUrl?.toString() === '/pasos/1';
    const urlFromPaso3 =
      this.router.url === '/pasos/2' &&
      this.router
        .getCurrentNavigation()
        ?.previousNavigation?.finalUrl?.toString() === '/pasos/3';
    if (urlFromPaso1) {
      this.consumoComponent?.resetMesesConsumo();
    } else if (urlFromPaso3) {
      this.allFieldsFilled = true;
      this.isCategorySelected = true;
    }

    this.driverObjInit = driver({
      showProgress: false,
      steps: [
        {
          element: '#titulo',
          popover: {
            title: 'Consumo',
            description: 'Aquí puede configurar su consumo energético.',
            side: 'left',
            align: 'start',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            doneBtnText: 'Terminar',
          },
        },
        {
          element: this.categoriaSelect.nativeElement,
          popover: {
            title: 'Aquí seleccione su tarifa contratada',
            description:
              'Al seleccionar su tarifa, se establecerán consumos mensuales predeterminados.',
            side: 'left',
            align: 'start',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            doneBtnText: 'Terminar',
          },
        },
        {
          element: this.consumoContainer.nativeElement,
          popover: {
            title: 'Cuadro de consumos mensuales',
            description:
              'Estos valores se encuentran predefinidos. Podrá modificarlos habilitando la carga manual.',
            side: 'left',
            align: 'start',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            doneBtnText: 'Terminar',
          },
        },
        {
          element: this.manualToggle._elementRef.nativeElement,
          popover: {
            title: 'Carga Manual',
            description:
              'Puede activar esta opción para ingresar manualmente su consumo mensual.',
            side: 'left',
            align: 'start',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            doneBtnText: 'Terminar',
          },
        },
        {
          element: this.botonSiguiente.nativeElement,
          popover: {
            title: 'Siguiente Paso',
            description:
              'Cuando haya completado todos los campos, presione este botón para continuar.',
            side: 'left',
            align: 'start',
            prevBtnText: 'Anterior',
            doneBtnText: 'Terminar',
          },
        },
      ],
    });

    // Escuchar cambios en el toggle de carga manual
    this.manualToggle.change
    .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((event) => {
        this.onManualToggleChange(event.checked);
});

    if (!this.tutorialShown) {
      setTimeout(() => {
        this.driverObjInit.drive();
        this.sharedService.setTutorialShown(true);
      }, 50);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
}

  onManualToggleChange(isManual: boolean): void {
    this.isEditable = isManual;
    if (this.isEditable) {
      this.consumoComponent.resetMesesConsumo();
    }
    this.isFieldsDisabled = !isManual;
    if (!isManual) {
      this.tarifaComponent.onTarifaChange();
    }
  }

  goBack() {
    this.sharedService.setPotenciaMaxAsignadaW(0);
    this.sharedService.setPanelsCountSelected(0);
    this.sharedService.setPotenciaInstalacionW(0);
    this.sharedService.setTarifaContratada('');
    this.sharedService.setTutorialShown(true);
    this.router.navigate(['pasos/1'], { replaceUrl: true });
  }

  goToPaso3() {
    if (this.allFieldsFilled && this.isCategorySelected) {
      this.router.navigate(['pasos/3']);
} else {
}
  }

  onAllFieldsCompleted(event: boolean): void {
    this.allFieldsFilled = event;
}

  onCategorySelected(event: boolean): void {
    this.isCategorySelected = event;
    this.isFieldsDisabled = !event;
}

  showInstructions() {
    this.showInstructionsModal = true;
  }

  handleInstructionsClosed() {
    this.showInstructionsModal = false;
  }

  showTooltip() {
    setTimeout(() => {
      if (!this.allFieldsFilled || !this.isCategorySelected) {
        this.snackBar.open(
          'Debe ingresar todos los meses para poder continuar.',
          '',
          {
            duration: 3000,
            panelClass: ['custom-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'top',
          }
        );
      }
    }, 700);
  }

  hideTooltip() {
    this.snackBar.dismiss();
  }

  openHelpModal(): void {
    this.dialog.open(InstruccionesComponent, {
      width: '500px',
    });
  }
}
