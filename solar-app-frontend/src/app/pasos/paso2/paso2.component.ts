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
import {
  MatSlideToggle,
  MatSlideToggleChange,
} from '@angular/material/slide-toggle';
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
    this.mapService.hideDrawingControl();
    this.sharedService.tutorialShown$
      .pipe(takeUntil(this.destroy$))
      .subscribe((shown) => {
        this.tutorialShown = shown;
      });

    // Suscripciones a propiedades del SharedService con console.log para depuración
    this.sharedService.potenciaMaxAsignadaW$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged()
      )
      .subscribe((potenciaMax) => {
        if (potenciaMax > 0) {
          this.potenciaMaxAsignada = potenciaMax;
          console.log(
            `Paso 2 - Actualización de potencia máxima: Se ha asignado ${potenciaMax}W como la potencia máxima. Este valor se utiliza para calcular la capacidad máxima del sistema solar que se puede instalar.`
          );
        } else {
          console.log("Paso 2 - Potencia máxima pendiente: Aún no se ha establecido una potencia máxima. Este valor es crucial para determinar el tamaño del sistema solar y se calculará basándose en el consumo y la tarifa del usuario.");
        }
      });

    this.sharedService.panelsCountSelected$
      .pipe(takeUntil(this.destroy$))
      .subscribe((panels) => {
        this.panelsSelected = panels;
        console.log(
          `Paso 2 - Actualización de paneles seleccionados: Se han seleccionado ${panels} paneles. Esta cantidad afectará directamente la capacidad de generación del sistema solar y los cálculos de ahorro energético.`
        );
      });

    this.sharedService.potenciaInstalacionW$
      .pipe(takeUntil(this.destroy$))
      .subscribe((potenciaInstalacion) => {
        this.potenciaInstalacionW = potenciaInstalacion;
        console.log(
          `Paso 2 - Actualización de potencia de instalación: La potencia de instalación se ha establecido en ${potenciaInstalacion}W. Este valor representa la capacidad total del sistema solar y se utiliza para estimar la producción de energía.`
        );
      });

    this.sharedService.tarifaContratada$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((tarifa) => {
        this.tarifaContratada = tarifa;
        console.log(
          `Paso 2 - Actualización de tarifa contratada: Se ha seleccionado la tarifa ${tarifa}. Esta información es crucial para calcular los ahorros potenciales y determinar la viabilidad económica del sistema solar.`
        );
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
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        this.onManualToggleChange(event.checked);
        console.log(`Paso 2 - Cambio en modo de carga: La carga manual ha sido ${event.checked ? 'activada' : 'desactivada'}. Esto permite al usuario ${event.checked ? 'ingresar manualmente' : 'usar valores predeterminados para'} los consumos mensuales, afectando los cálculos posteriores del sistema solar.`);
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
    console.log('Paso 2 - Destrucción del componente: Se está limpiando y destruyendo el componente Paso2. Esto asegura que todas las suscripciones y recursos asociados sean liberados correctamente.');
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
      console.log('Paso 2 - Navegación a Paso 3: Se está avanzando al Paso 3 con los siguientes datos configurados:', {
        tarifaContratada: this.tarifaContratada,
        potenciaMaxAsignada: this.potenciaMaxAsignada,
        panelsSelected: this.panelsSelected,
        potenciaInstalacionW: this.potenciaInstalacionW,
      }, 'Estos datos serán utilizados para realizar cálculos más detallados sobre el sistema solar y sus beneficios.');
    } else {
      console.log('Paso 2 - Navegación a Paso 3 bloqueada: No se puede avanzar al Paso 3 porque faltan campos por completar. Es necesario que el usuario proporcione toda la información requerida para realizar cálculos precisos.');
    }
  }

  onAllFieldsCompleted(event: boolean): void {
    this.allFieldsFilled = event;
    console.log(`Paso 2 - Estado de campos: ${event ? 'Todos los campos han sido completados' : 'Aún hay campos pendientes por completar'}. Este estado determina si el usuario puede avanzar al siguiente paso y es crucial para asegurar que se tenga toda la información necesaria para los cálculos del sistema solar.`);
  }

  onCategorySelected(event: boolean): void {
    this.isCategorySelected = event;
    this.isFieldsDisabled = !event;
    console.log(`Paso 2 - Selección de categoría: ${event ? 'Se ha seleccionado una categoría' : 'No se ha seleccionado una categoría'}. La selección de categoría es importante para determinar la tarifa y los consumos predeterminados, afectando los cálculos posteriores.`);
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
