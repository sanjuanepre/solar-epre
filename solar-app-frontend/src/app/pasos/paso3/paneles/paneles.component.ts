import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSlider } from '@angular/material/slider';
import { Subject, Subscription } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { DimensionPanel } from 'src/app/interfaces/dimension-panel';
import { MapService } from 'src/app/services/map.service';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-paneles',
  templateUrl: './paneles.component.html',
  styleUrls: ['./paneles.component.css'],
})
export class PanelesComponent implements OnInit, OnDestroy {
  @Input() dimensionPanel!: DimensionPanel;
  @Input() panelCapacityW: number = 0; // Capacidad de paneles en Watts

  @ViewChild(MatSlider) slider!: MatSlider; // Referencia al slider

  // Control para el valor de la potencia de los paneles
  potenciaPanelesControl = new FormControl('');

  maxPanelsArea$: number = 0; // Máximo número de paneles basado en el área
  panelesSelectCount: number = 4; // Número de paneles seleccionados
  plazoRecuperoInversion!: number; // Plazo de recuperación de inversión
  private maxPanelsPerAreaSubscription!: Subscription;
  private plazoInversionSubscription!: Subscription;

  // Observable para gestionar la destrucción del componente
  private destroy$ = new Subject<void>();
  maxPanelsPerPotentiaMax!: number;

  constructor(
    private mapService: MapService,
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {
    console.log('PanelesComponent: Constructor iniciado');
  }

  ngOnInit(): void {
    console.log('PanelesComponent: ngOnInit iniciado');
    this.panelCapacityW = this.sharedService.getPanelCapacityW();
    this.panelesSelectCount = this.sharedService.getPanelsSelected();
    // Establecer valor inicial para la potencia de los paneles
    this.potenciaPanelesControl.setValue(
      this.panelCapacityW.toString() || '400'
    );

    // Subscripción para obtener el máximo número de paneles permitido por el área
    this.maxPanelsPerAreaSubscription =
      this.sharedService.maxPanelsPerSuperface$.subscribe((value) => {
        console.log(
          'PanelesComponent: Nuevo valor de maxPanelsPerSuperface:',
          value
        );
        this.maxPanelsArea$ = value;
        const maxPotenciaInstalacion = this.sharedService.getPotenciaMaxAsignadaValue();
        const maxAllowedPanels = Math.floor(maxPotenciaInstalacion / this.panelCapacityW);

        const maxPanelesPermitidos = Math.min(maxAllowedPanels, this.maxPanelsArea$);

        this.panelesSelectCount = Math.max(4, Math.min(this.panelesSelectCount, maxPanelesPermitidos))

        this.sharedService.setPanelsCountSelected(this.panelesSelectCount)

        if(this.slider) {
          this.slider.max = maxPanelesPermitidos;
        }
        // this.updateMaxPanels();
      });
    
      // Subscripción al plazo de recuperación de la inversión
    this.plazoInversionSubscription = this.sharedService.plazoInversion$
    .pipe(takeUntil(this.destroy$), distinctUntilChanged())
    .subscribe((plazo) => {
      console.log(
        'PanelesComponent: Nuevo plazo de recuperación de inversión:',
        plazo
      );
      this.plazoRecuperoInversion = plazo;
    });

    // Suscribirse al cambio de la capacidad de los paneles
    this.potenciaPanelesControl.valueChanges
    .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value: any) => {
        console.log(
          'PanelesComponent: Cambio en potenciaPanelesControl:',
          value
        );
        const panelCapacity = parseInt(value, 10);
        this.sharedService.setPanelCapacityW(panelCapacity);
        this.panelCapacityW = panelCapacity;

        const maxPotenciaInstalacion = this.sharedService.getPotenciaMaxAsignadaValue();
        const maxAllowedPanels = Math.floor(maxPotenciaInstalacion / panelCapacity);

        if (this.panelesSelectCount > maxAllowedPanels) {
          this.panelesSelectCount = maxAllowedPanels;
          this.sharedService.setPanelsCountSelected(this.panelesSelectCount);
        }

        this.mapService.reDrawPanels(this.panelesSelectCount);
        // Actualizar el máximo permitido y redibujar paneles
        // this.updateMaxPanels();
        // this.mapService.reDrawPanels(this.panelesSelectCount);
      });

    // Subscripción para obtener el máximo número de paneles permitido por el área
    this.maxPanelsPerAreaSubscription =
      this.sharedService.maxPanelsPerSuperface$
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        console.log(
          'PanelesComponent: Nuevo valor de maxPanelsPerSuperface:',
          value
        );
        this.maxPanelsArea$ = value;
        this.updateMaxPanels();
      });

    // Subscripción al plazo de recuperación de la inversión
    this.plazoInversionSubscription = this.sharedService.plazoInversion$
    .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((plazo) => {
        console.log(
          'PanelesComponent: Nuevo plazo de recuperación de inversión:',
          plazo
        );
        this.plazoRecuperoInversion = plazo;
      });
  }

  ngAfterViewInit(): void {
    console.log('PanelesComponent: ngAfterViewInit iniciado');
    // Redibujar paneles al inicializar la vista
    this.updateMaxPanels();
    // this.panelesSelectCount = this.slider.max;
  }

  ngOnDestroy(): void {
    console.log('PanelesComponent: ngOnDestroy iniciado');
    // Cancelar las suscripciones al destruir el componente
    this.maxPanelsPerAreaSubscription?.unsubscribe();
    this.plazoInversionSubscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSliderChange() {
    console.log('PanelesComponent: onSliderChange iniciado');
    // Actualizar el número de paneles seleccionados y redibujar
    const maxPotenciaInstalacion = this.sharedService.getPotenciaMaxAsignadaValue();
    const panelCapacity = this.panelCapacityW;

    const maxAllowedPanels = Math.floor(maxPotenciaInstalacion/panelCapacity);
    this.slider.max = Math.min(maxAllowedPanels, this.maxPanelsArea$);

    if ( this.panelesSelectCount > this.slider.max) {
      this.panelesSelectCount = this.slider.max;
    }

    this.panelesSelectCount = Math.max(4, Math.min(this.panelesSelectCount, this.slider.max));

    this.mapService.reDrawPanels(this.panelesSelectCount);
    this.sharedService.setPanelsCountSelected(this.panelesSelectCount);
    // this.updateMaxPanels();
  }

  updateMaxPanels() {
    console.debug('updateMaxPanels: Iniciando actualización de paneles');
    const maxPotenciaInstalacion = this.sharedService.getPotenciaInstalacionW();
    console.debug(
      'updateMaxPanels: Max potencia instalación W:',
      maxPotenciaInstalacion
    );

    const maxPanelsPerPotentiaMax = Math.floor(
      maxPotenciaInstalacion / this.sharedService.getPanelCapacityW()
    );
    console.debug(
      'updateMaxPanels: Max paneles por potencia:',
      maxPanelsPerPotentiaMax
    );

    const maxPanelsArea = this.sharedService.getMaxPanelsPerSuperface();
    console.debug('updateMaxPanels: Max paneles por área:', maxPanelsArea);

    const maxAllowedPanels = Math.min(maxPanelsPerPotentiaMax, maxPanelsArea);
    console.debug('updateMaxPanels: Max paneles permitidos:', maxAllowedPanels);

    if (this.slider && this.slider.max !== maxAllowedPanels) {
      console.debug(
        'updateMaxPanels: Actualizando max del slider:',
        this.slider.max,
        '->',
        maxAllowedPanels
      );
      if (this.panelesSelectCount >= maxAllowedPanels) {
        this.panelesSelectCount = maxAllowedPanels;
      }
    }

    const newPanelCount = Math.min(
      maxAllowedPanels,
      this.panelesSelectCount || maxAllowedPanels
    );
    console.debug('updateMaxPanels: Nuevo conteo de paneles:', newPanelCount);

    if (this.panelesSelectCount !== newPanelCount) {
      console.debug(
        'updateMaxPanels: Actualizando cantidad de paneles seleccionados:',
        this.panelesSelectCount,
        '->',
        newPanelCount
      );
      this.panelesSelectCount = newPanelCount;
      this.sharedService.setPanelsCountSelected(this.panelesSelectCount);
    }

    this.cdr.detectChanges();
    console.debug('updateMaxPanels: Cambio detectado y aplicado');
  }
  
  formatLabel(value: number): string {
    // Formatear etiquetas del slider
    const formattedValue =
      value >= 1000 ? Math.round(value / 1000) + 'k' : `${value}`;
    console.log('PanelesComponent: Etiqueta formateada:', formattedValue);
    return formattedValue;
  }
}
