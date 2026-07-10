import { Component, ElementRef, OnInit, OnDestroy, AfterViewInit, ViewChild, NgZone } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { driver } from 'driver.js';
import { LocationService } from 'src/app/services/location.service';
import { MapService } from 'src/app/services/map.service';
import { SharedService } from 'src/app/services/shared.service';
import { SolarApiService } from 'src/app/services/solar-api.service';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-paso1',
  templateUrl: './paso1.component.html',
  styleUrls: ['./paso1.component.css'],
})
export class Paso1Component implements OnInit, OnDestroy, AfterViewInit {
  currentStep: number = 1;
  selectedArea: number = 0;
  tutorialShown: boolean = false;
  areaMarked: boolean = false;
  
  // Variables del mapa de calor y banner dinámico
  heatmapAvailable: boolean = false;
  showHeatmap: boolean = false;
  isHeatmapLoading: boolean = false;
  annualFluxUrl: string = '';
  drawingState: 'INACTIVE' | 'START' | 'DRAWING' | 'CLOSED' = 'INACTIVE';
  instructionText: string = 'Presiona "Marcar techo" para comenzar a dibujar el área de instalación.';
  tipoEstructura: 'coplanar' | 'optimo' = 'coplanar';

  @ViewChild('pacInput', { static: false }) pacInput!: ElementRef;
  private marker!: google.maps.marker.AdvancedMarkerElement | null;
  private map!: google.maps.Map;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private sharedService: SharedService,
    private mapService: MapService,
    private locationService: LocationService,
    private solarApiService: SolarApiService,
    private zone: NgZone
  ) {
    
  }

  ngOnInit(): void {
    this.sharedService.tutorialShown$
    .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((shown) => {
        this.tutorialShown = shown;
      });

    this.mapService.overlayComplete$()
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.zone.run(() => {
          this.areaMarked = value;
          if (value) {
            this.updateInstalledPower();
            this.updateAreaAndPanelCount();
            this.loadSolarHeatmap();
          } else {
            this.heatmapAvailable = false;
            this.showHeatmap = false;
            this.mapService.clearHeatmap();
          }
        });
      });

    this.mapService.drawingState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.zone.run(() => {
          this.drawingState = state;
          this.updateInstructionText(state);
        });
      });

    this.mapService.heatMapLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading) => {
        this.zone.run(() => {
          this.isHeatmapLoading = loading;
          this.updateInstructionText(this.drawingState);
        });
      });

    this.sharedService.tipoEstructura$
      .pipe(takeUntil(this.destroy$))
      .subscribe((tipo) => {
        this.zone.run(() => {
          this.tipoEstructura = tipo;
        });
      });

    this.mapService.clearDrawing();
    this.areaMarked = false;
    this.heatmapAvailable = false;
    this.showHeatmap = false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async ngAfterViewInit(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.mapService.getMap()) {
        this.initializeMap()
          .then(() => {
            this.initializeAutocomplete();
            this.mapService.initializeDrawingManager();
            if (!this.tutorialShown) {
              setTimeout(() => this.showTutorial(), 500);
            }
            resolve();
          })
          .catch((error) => {
            console.error('Error inicializando el mapa:', error);
            this.snackBar.open(
              'Error al cargar el mapa. Por favor, recargue la página.',
              'Cerrar',
              { duration: 5000 }
            );
            resolve();
          });
      } else {
        resolve();
      }
    });
  }

  async initializeMap(): Promise<void> {
    const { AdvancedMarkerElement } = (await google.maps.importLibrary(
      'marker'
    )) as google.maps.MarkerLibrary;
    this.map = this.mapService.getMap();
    if (!this.map) {
      throw new Error('El mapa no está inicializado.');
    }
    this.map.setZoom(22);
    this.marker = new AdvancedMarkerElement({ map: this.map });
  }

  showTutorial() {
    const driverObj = driver({
      showProgress: false,
      steps: [
        {
          element: '#sub-titulo',
          popover: {
            title: 'Información importante',
            description:
              'Lugar donde se instalaría los paneles fotovoltaicos. Seleccione el lugar donde estaría ubicada la instalación.',
            side: 'left',
            align: 'start',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            doneBtnText: 'Terminar',
          },
        },
        {
          element: '#pac-input',
          popover: {
            title: 'Ubicación',
            description:
              'Debe indicar el lugar donde instalaría los paneles fotovoltaicos. Puede buscar la dirección del lugar, o seleccionar en el mapa.',
            side: 'left',
            align: 'start',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            doneBtnText: 'Terminar',
          },
        },
        {
          element: '#marcar',
          popover: {
            title: 'Selección manual de la ubicación',
            description:
              'Presione para activar el selector de ubicación en el mapa. Puede marcar y ajustar los vértices del lugar donde se instalaría los paneles fotovoltaicos.',
            side: 'left',
            align: 'start',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            doneBtnText: 'Terminar',
          },
        },
        {
          element: '#borrar',
          popover: {
            title: 'Selección manual de la ubicación',
            description:
              'Presione para borrar la selección y realizar una nueva.',
            side: 'right',
            align: 'end',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            doneBtnText: 'Terminar',
          },
        },
        {
          element: '#boton-siguiente',
          popover: {
            title: 'Advertencia',
            description:
              'Para poder continuar al siguiente paso, debe tener seleccionada una zona de instalación.',
            side: 'left',
            align: 'start',
            prevBtnText: 'Anterior',
            doneBtnText: 'Terminar',
          },
        },
      ],
    });
    driverObj.drive();
  }

  showTooltip() {
    if (!this.areaMarked) {
      const snackbarRef = this.snackBar.open(
        'Debe seleccionar una zona de instalación para continuar.',
        '',
        {
          duration: 5000,
          panelClass: ['custom-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top',
        }
      );
    }
  }

  async buscarUbicacion(value: string) {
    const { AdvancedMarkerElement } = (await google.maps.importLibrary(
      'marker'
    )) as google.maps.MarkerLibrary;
    this.map = this.mapService.getMap();
    if (!this.marker) {
      this.marker = new AdvancedMarkerElement({
        map: this.map,
      });
    }
    try {
      console.log(value);

      const location = await this.locationService.validateLocation(
        value,
        this.map,
        this.marker
      );

      if (location) {
        // Si la ubicación es válida, actualiza o crea el marcador
        if (!this.marker) {
          // Si no existe un marcador, crea uno
          this.marker = new google.maps.marker.AdvancedMarkerElement({
            position: location,
            map: this.map,
          });
        } else {
          // Si ya existe un marcador, actualiza su posición
          this.marker.position = location;
          this.marker.map = this.map; // Asegura que el marcador esté en el mapa
        }

        this.areaMarked = true;
        this.map.panTo(location);
      } else {
        if (this.marker) {
          this.marker.map = null; // Elimina el marcador del mapa
        }

        this.areaMarked = false;
        console.error('La ubicación no es válida.');
      }
    } catch (error) {
      console.error(error);
    }
  }

  goBack() {
    this.router.navigate(['/pasos/0']);
  }

  goToPaso2() {
    if (!this.areaMarked) {
      this.showTooltip();
      return; // No avanzar si no hay área marcada
    }
    this.updateInstalledPower();
    this.updateAreaAndPanelCount();

    const polygons = this.mapService.getPolygons();
    polygons[0].setEditable(false);
    this.mapService.disableDrawingMode();

    this.sharedService.setTarifaContratada('');
    this.router.navigate(['/pasos/2']);
  }

  private async initializeAutocomplete() {
    const input = document.getElementById('pac-input') as HTMLInputElement;
    
    // Crear el autocompletado restringido a Argentina y solicitando solo los campos requeridos
    const autocomplete = new google.maps.places.Autocomplete(input, {
      componentRestrictions: { country: 'ar' },
      fields: ['geometry', 'formatted_address']
    });

    this.map.addListener('bounds_changed', () => {
      autocomplete.setBounds(this.map.getBounds() as google.maps.LatLngBounds);
    });

    const placeChangedListener = autocomplete.addListener('place_changed', async () => {
      const place = autocomplete.getPlace();

      if (place && place.geometry && place.geometry.location) {
        const { AdvancedMarkerElement } = (await google.maps.importLibrary(
          'marker'
        )) as google.maps.MarkerLibrary;
        this.map = this.mapService.getMap();
        if (!this.marker) {
          this.marker = new AdvancedMarkerElement({
            map: this.map,
          });
        }

        const location = await this.locationService.validateLocation(
          place.formatted_address || 'default',
          this.map,
          this.marker
        );
        if (location) {
          this.map.setCenter(location);
        } else {
          if (this.marker) {
            this.marker.map = null; // Elimina el marcador del mapa
            this.marker = null; // Limpia la referencia al marcador
          }

          this.areaMarked = false;
          console.error('La ubicación no es válida.');
        }
      }
      input.value = '';
    });

    // Asegurarse de eliminar el listener cuando el componente se destruya
    this.destroy$.subscribe(() => {
      google.maps.event.removeListener(placeChangedListener);
    });
    input.value = '';
  }

  enableDrawingMode() {
    this.mapService.enableDrawingMode();
  }

  clearDrawing() {
    this.mapService.clearDrawing();
    this.zone.run(() => {
      this.areaMarked = false;
      this.heatmapAvailable = false;
      this.showHeatmap = false;
      this.isHeatmapLoading = false;
      this.annualFluxUrl = '';
      this.sharedService.setTipoEstructura('coplanar');
      this.updateInstructionText(this.drawingState);
    });
  }

  selectTipoEstructura(tipo: 'coplanar' | 'optimo') {
    this.sharedService.setTipoEstructura(tipo);
  }

  private calculateInstalledPower(): number {
    const panelCapacityW = this.sharedService.getPanelCapacityW();
    console.log("panel capacityW en paso 1 ", panelCapacityW)
    const panelsSelectCount = this.sharedService.getPanelsSelected();
    console.log("numero de paneles seleccionados en paso 1 ", panelsSelectCount)
    return Math.round(panelCapacityW * panelsSelectCount);
  }

  private updateInstalledPower(): void {
      const installedPower = this.calculateInstalledPower();
      this.sharedService.setPotenciaInstalacionW(installedPower);
  }

  private updateAreaAndPanelCount(): void {
    const polygons = this.mapService.getPolygons();
    if (polygons.length > 0) {
      const panelArea =
        this.sharedService.getDimensionPanel().width *
        this.sharedService.getDimensionPanel().height;
      const panelsSelectCount = this.sharedService.getPanelsSelected();
      this.sharedService.setAreaPanelsSelected(panelArea * panelsSelectCount);
    }
  }

  /**
   * Actualiza el texto de instrucción del banner según el estado de dibujo.
   */
  updateInstructionText(state: 'INACTIVE' | 'START' | 'DRAWING' | 'CLOSED') {
    if (this.isHeatmapLoading) {
      this.instructionText = 'Analizando radiación solar sobre el techo... Por favor, espere.';
      return;
    }

    switch (state) {
      case 'START':
        this.instructionText = 'Haga clic en las esquinas del techo para ir trazando el contorno del área de instalación.';
        break;
      case 'DRAWING':
        this.instructionText = 'Haga clic en el primer punto verde o haga doble clic para cerrar y completar el techo.';
        break;
      case 'CLOSED':
        this.instructionText = '¡Techo delimitado con éxito! Puede activar el mapa de calor solar o continuar.';
        break;
      case 'INACTIVE':
      default:
        this.instructionText = 'Presione "Marcar" para comenzar a dibujar el área de instalación sobre el techo.';
        break;
    }
  }

  /**
   * Solicita al backend las capas de datos de la Google Solar API para el centroide del polígono.
   * Si están disponibles, activa la visualización del mapa de calor solar.
   */
  async loadSolarHeatmap() {
    const polygons = this.mapService.getPolygons();
    if (polygons.length === 0) return;

    const coordinates = this.mapService.getPolygonCoordinates();
    if (!coordinates || coordinates.length === 0) return;

    // Calcular el centroide del polígono
    let sumLat = 0;
    let sumLng = 0;
    coordinates.forEach(coord => {
      sumLat += coord.lat;
      sumLng += coord.lng;
    });
    const lat = sumLat / coordinates.length;
    const lng = sumLng / coordinates.length;

    this.zone.run(() => {
      this.isHeatmapLoading = true;
      this.heatmapAvailable = false;
      this.showHeatmap = false;
    });

    try {
      console.log(`[Paso1Component] Consultando dataLayers para centroide: (${lat}, ${lng})`);
      const response = await this.solarApiService.getDataLayers(lat, lng);
      
      this.zone.run(() => {
        if (response && response.annualFluxUrl) {
          this.annualFluxUrl = response.annualFluxUrl;
          this.heatmapAvailable = true;
          this.showHeatmap = true; // Por defecto lo mostramos al completar el dibujo
          console.log('[Paso1Component] Capas térmicas obtenidas. Cargando render...');
          this.toggleHeatmap();
        } else {
          console.warn('[Paso1Component] La API de Solar no retornó capa de flujo solar para esta ubicación.');
          this.snackBar.open(
            'No hay datos de radiación detallados disponibles para esta zona específica.',
            'Cerrar',
            { duration: 4000 }
          );
        }
      });
    } catch (error) {
      console.error('[Paso1Component] Error al obtener capas solares:', error);
    } finally {
      this.zone.run(() => {
        this.isHeatmapLoading = false;
      });
    }
  }

  /**
   * Prende o apaga la visualización de la capa del mapa de calor solar.
   */
  toggleHeatmap() {
    if (this.showHeatmap && this.annualFluxUrl) {
      const polygons = this.mapService.getPolygons();
      if (polygons.length > 0) {
        this.mapService.fetchAndRenderSolarHeatmap(this.annualFluxUrl, polygons[0]);
      }
    } else {
      this.mapService.clearHeatmap();
    }
  }
}
