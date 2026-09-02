import { Component, ElementRef, OnInit, OnDestroy, AfterViewInit, ViewChild, NgZone } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { driver } from 'driver.js';
import { LocationService } from 'src/app/services/location.service';
import { MapService, TerraDrawTheme, TerraDrawActiveMode } from 'src/app/services/map.service';
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
  
  // TerraDraw & UI Híbrida HUD State
  activeMode: TerraDrawActiveMode = 'polygon';
  activeTheme: TerraDrawTheme = 'solar';
  realtimeAreaM2: number = 0;
  estimatedPanelsCount: number = 0;
  canUndo: boolean = false;
  canRedo: boolean = false;

  // Variables del mapa de calor y banner dinámico
  heatmapAvailable: boolean = false;
  showHeatmap: boolean = false;
  showPanelsOnHeatmap: boolean = true;
  isHeatmapLoading: boolean = false;
  annualFluxUrl: string = '';
  heatmapOpacity: number = 65;
  drawingState: 'INACTIVE' | 'START' | 'DRAWING' | 'CLOSED' = 'INACTIVE';
  instructionText: string = 'Busque la ubicación prevista y luego elija una herramienta de selección (Polígono o Rectángulo) para delimitar el área de la instalación.';
  tipoEstructura: 'coplanar' | 'optimo' = 'coplanar';
  isSidebarCollapsed: boolean = false;

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
            this.heatmapAvailable = true;
            // Si el mapa de calor estaba activo, refrescarlo para la nueva geometría
            if (this.showHeatmap) {
              const polygons = this.mapService.getPolygons();
              if (polygons.length > 0) {
                if (this.annualFluxUrl) {
                  this.mapService.fetchAndRenderSolarHeatmap(this.annualFluxUrl, polygons[0]);
                } else {
                  this.loadSolarHeatmap();
                }
              }
            }
          } else {
            this.heatmapAvailable = false;
            this.showHeatmap = false;
            this.annualFluxUrl = '';
            this.mapService.clearHeatmap();
          }
        });
      });

    this.mapService.isHeatmapActive$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((active) => {
        this.zone.run(() => {
          if (!this.isHeatmapLoading) {
            this.showHeatmap = active;
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

    this.sharedService.sidebarCollapsed$
      .pipe(takeUntil(this.destroy$))
      .subscribe((collapsed) => {
        this.zone.run(() => {
          this.isSidebarCollapsed = collapsed;
        });
      });

    // Suscripciones a TerraDraw
    this.mapService.activeMode$.pipe(takeUntil(this.destroy$)).subscribe((mode) => {
      this.zone.run(() => (this.activeMode = mode));
    });

    this.mapService.activeTheme$.pipe(takeUntil(this.destroy$)).subscribe((theme) => {
      this.zone.run(() => (this.activeTheme = theme));
    });

    this.mapService.realtimeAreaM2$.pipe(takeUntil(this.destroy$)).subscribe((area) => {
      this.zone.run(() => (this.realtimeAreaM2 = area));
    });

    this.mapService.estimatedPanelsCount$.pipe(takeUntil(this.destroy$)).subscribe((count) => {
      this.zone.run(() => (this.estimatedPanelsCount = count));
    });

    this.mapService.canUndo$.pipe(takeUntil(this.destroy$)).subscribe((undo) => {
      this.zone.run(() => (this.canUndo = undo));
    });

    this.mapService.canRedo$.pipe(takeUntil(this.destroy$)).subscribe((redo) => {
      this.zone.run(() => (this.canRedo = redo));
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
    
    const sanJuanBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(-32.70, -70.70), // Suroeste
      new google.maps.LatLng(-28.20, -66.60)  // Noreste
    );

    // Crear el autocompletado restringido a Argentina, con prioridad territorial en San Juan
    const autocomplete = new google.maps.places.Autocomplete(input, {
      componentRestrictions: { country: 'ar' },
      bounds: sanJuanBounds,
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
          if (this.areaMarked) {
            this.clearDrawing();
          }
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
   * Actualiza el texto de instrucción del banner según el estado de dibujo y herramienta activa.
   */
  updateInstructionText(state: 'INACTIVE' | 'START' | 'DRAWING' | 'CLOSED') {
    if (this.isHeatmapLoading && this.showHeatmap) {
      this.instructionText = 'Analizando radiación solar sobre el techo... Por favor, espere.';
      return;
    }

    if (state === 'CLOSED') {
      this.instructionText = '¡Techo delimitado con éxito! Puede mover/rotar el área, activar el mapa de calor solar o presionar Siguiente.';
      return;
    }

    switch (this.activeMode) {
      case 'polygon':
        if (state === 'START') {
          this.instructionText = 'Haga clic en las esquinas del techo en el mapa para ir trazando el contorno del área.';
        } else {
          this.instructionText = 'Continúe marcando los vértices del techo. Haga doble clic o clic en el punto inicial para cerrar.';
        }
        break;

      case 'rectangle':
        this.instructionText = 'Haga clic y arrastre sobre el mapa para trazar una superficie rectangular sobre el techo.';
        break;

      case 'select':
        this.instructionText = 'Arrastre la figura para moverla o use los botones de rotación (-15°, +15°, 90°) para orientarla.';
        break;

      case 'static':
      default:
        this.instructionText = 'Busque la ubicación prevista y luego elija una herramienta de selección (Polígono o Rectángulo) para delimitar el área de la instalación.';
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

    // Calcular el centroide y radio aproximado del polígono
    let sumLat = 0;
    let sumLng = 0;
    coordinates.forEach(coord => {
      sumLat += coord.lat;
      sumLng += coord.lng;
    });
    const lat = sumLat / coordinates.length;
    const lng = sumLng / coordinates.length;

    let maxDist = 0;
    coordinates.forEach(coord => {
      const dLat = (coord.lat - lat) * 111320;
      const dLng = (coord.lng - lng) * 111320 * Math.cos(lat * Math.PI / 180);
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist > maxDist) maxDist = dist;
    });
    // Expandir el radio para cubrir holgadamente el polígono y su entorno (mínimo 50m, hasta 150m)
    const radiusMeters = Math.min(150, Math.max(50, Math.round(maxDist * 1.8)));

    this.zone.run(() => {
      this.isHeatmapLoading = true;
      this.showHeatmap = true;
    });

    try {
      console.log(`[Paso1Component] Consultando dataLayers para centroide: (${lat}, ${lng}) con radio ${radiusMeters}m`);
      const response = await this.solarApiService.getDataLayers(lat, lng, radiusMeters);
      
      this.zone.run(() => {
        if (response && response.annualFluxUrl) {
          this.annualFluxUrl = response.annualFluxUrl;
          this.heatmapAvailable = true;
          this.showHeatmap = true;
          console.log('[Paso1Component] Capas térmicas obtenidas y activadas.');
          const polygons = this.mapService.getPolygons();
          if (polygons.length > 0) {
            this.mapService.fetchAndRenderSolarHeatmap(this.annualFluxUrl, polygons[0]);
          }
        } else {
          console.log('[Paso1Component] Sin datos GeoTIFF de radiación detallada para esta zona.');
          this.annualFluxUrl = '';
          this.heatmapAvailable = false;
          this.showHeatmap = false;
          this.mapService.hideHeatmap();
          this.snackBar.open(
            'No hay datos de radiación solar detallados disponibles para esta zona específica.',
            'Entendido',
            { duration: 5000 }
          );
        }
      });
    } catch (error) {
      console.error('[Paso1Component] Error al obtener capas solares:', error);
      this.zone.run(() => {
        this.annualFluxUrl = '';
        this.heatmapAvailable = false;
        this.showHeatmap = false;
        this.mapService.hideHeatmap();
        this.snackBar.open(
          'No hay datos de radiación solar detallados disponibles para esta zona específica.',
          'Entendido',
          { duration: 5000 }
        );
      });
    } finally {
      this.zone.run(() => {
        this.isHeatmapLoading = false;
      });
    }
  }

  /**
   * Prende o apaga la visualización de la capa del mapa de calor solar.
   */
  async toggleHeatmap() {
    if (this.showHeatmap) {
      if (!this.annualFluxUrl) {
        await this.loadSolarHeatmap();
      } else {
        const polygons = this.mapService.getPolygons();
        if (polygons.length > 0) {
          this.mapService.fetchAndRenderSolarHeatmap(this.annualFluxUrl, polygons[0]);
        }
      }
    } else {
      this.mapService.hideHeatmap();
    }
  }

  /**
   * Alterna la visualización de los paneles en modo traslúcido sobre el mapa de calor.
   */
  togglePanelsOnHeatmap() {
    this.mapService.setShowPanelsOnHeatmap(this.showPanelsOnHeatmap);
  }

  /**
   * Actualiza la opacidad del mapa de calor solar en tiempo real.
   */
  onHeatmapOpacityChange(event: any) {
    const value = typeof event === 'number' ? event : Number(event.target?.value ?? this.heatmapOpacity);
    this.heatmapOpacity = value;
    this.mapService.setHeatmapOpacity(value / 100);
  }

  // --- Métodos de Control TerraDraw ---

  setTerraDrawMode(mode: TerraDrawActiveMode) {
    this.mapService.setTerraDrawMode(mode);
  }

  setTerraDrawTheme(theme: TerraDrawTheme) {
    this.mapService.setTerraDrawTheme(theme);
  }

  undoTerraDraw() {
    this.mapService.undoTerraDraw();
  }

  redoTerraDraw() {
    this.mapService.redoTerraDraw();
  }

  rotatePolygon(angleDegrees: number) {
    if (this.isHeatmapLoading) {
      return;
    }
    this.mapService.rotatePolygon(angleDegrees);
  }
}
