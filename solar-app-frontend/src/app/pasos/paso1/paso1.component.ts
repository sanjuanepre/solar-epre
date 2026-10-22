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
  instructionText: string = 'Busque la ubicación prevista y luego elija una herramienta de selección (Polígono, Rectángulo o Área 1 clic) para delimitar el área de la instalación.';
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

    if (this.mapService.hasExistingDrawing()) {
      this.areaMarked = true;
      this.heatmapAvailable = true;
      this.drawingState = 'CLOSED';
      this.updateInstructionText('CLOSED');
      this.mapService.restoreExistingDrawing();
      this.updateInstalledPower();
      this.updateAreaAndPanelCount();
    } else {
      this.areaMarked = false;
      this.heatmapAvailable = false;
      this.showHeatmap = false;
      this.drawingState = 'INACTIVE';
      this.updateInstructionText('INACTIVE');
    }
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
            if (this.areaMarked || this.mapService.hasExistingDrawing()) {
              this.mapService.restoreExistingDrawing();
              this.areaMarked = true;
              this.heatmapAvailable = true;
              this.updateInstalledPower();
              this.updateAreaAndPanelCount();
              setTimeout(() => {
                this.mapService.recenterMapToVisibleArea();
              }, 150);
            } else if (!this.tutorialShown) {
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
    await google.maps.importLibrary('marker');
    this.map = this.mapService.getMap();
    if (!this.map) {
      throw new Error('El mapa no está inicializado.');
    }
    const currentCenter = this.map.getCenter();
    if (!currentCenter || !this.locationService.isWithinSanJuan(currentCenter.lat(), currentCenter.lng())) {
      this.map.setCenter(this.mapService.defaultCenter);
      this.map.setZoom(this.mapService.defaultZoom);
    }
  }

  /** Devuelve el ancestro con scroll vertical real más cercano al elemento. */
  private getScrollParent(el: HTMLElement): HTMLElement | null {
    let node: HTMLElement | null = el.parentElement;
    while (node && node !== document.body) {
      const oy = getComputedStyle(node).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight + 1) {
        return node;
      }
      node = node.parentElement;
    }
    return null;
  }

  /**
   * Posiciona el scroll del panel lateral para que el elemento del paso quede
   * completamente visible, de forma instantánea (sin smooth) y determinista.
   * Para las herramientas se ancla al inicio de la tarjeta completa (con su título).
   */
  private scrollElementIntoContainer(targetEl?: Element | null): void {
    const target = targetEl as HTMLElement | null;
    if (!target) return;
    const container = this.getScrollParent(target);
    if (!container) return;

    container.style.scrollBehavior = 'auto';

    let anchor: HTMLElement = target;
    if (target.id === 'herramientas-superficie') {
      anchor = (target.closest('.info-inicio') as HTMLElement) || target;
    }

    const cRect = container.getBoundingClientRect();
    const aRect = anchor.getBoundingClientRect();
    const topInContainer = aRect.top - cRect.top + container.scrollTop;

    const visibleHeight = target.id === 'herramientas-superficie'
      ? (target.getBoundingClientRect().bottom - aRect.top)
      : aRect.height;
    let desired: number;
    if (visibleHeight > container.clientHeight * 0.4) {
      desired = topInContainer - 8;
    } else {
      desired = topInContainer - (container.clientHeight - aRect.height) / 2;
    }
    const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
    container.scrollTop = Math.max(0, Math.min(desired, maxScroll));
  }

  private refreshSpotlight(driverObj: ReturnType<typeof driver>, element?: Element): void {
    // Reaplica el scroll (el navegador/driver pudo reubicarlo) y recalcula el foco
    [0, 60, 180, 400].forEach((ms) =>
      setTimeout(() => {
        try {
          if (!driverObj.isActive()) return;
          if (element) this.scrollElementIntoContainer(element);
          driverObj.refresh();
        } catch (_) {}
      }, ms)
    );
  }

  showTutorial() {
    if (this.isSidebarCollapsed && window.innerWidth >= 768) {
      this.sharedService.setSidebarCollapsed(false);
    }

    const isMobile = window.innerWidth < 768;
    const defaultSide: 'bottom' | 'left' = isMobile ? 'bottom' : 'left';

    const driverObj = driver({
      showProgress: false,
      animate: false,
      smoothScroll: false,
      stagePadding: 8,
      stageRadius: 8,
      allowClose: true,
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Finalizar',
      onHighlightStarted: (element) => {
        if (element) {
          this.scrollElementIntoContainer(element);
        }
      },
      onHighlighted: (element) => {
        if (element) {
          this.refreshSpotlight(driverObj, element);
        }
      },
      steps: [
        {
          element: '#sub-titulo',
          popover: {
            title: 'Información importante',
            description:
              'Lugar donde se instalarían los módulos fotovoltaicos. Seleccione en el mapa el sitio donde proyecta la instalación.',
            side: defaultSide,
            align: 'start',
          },
        },
        {
          element: '#pac-input',
          popover: {
            title: 'Búsqueda de ubicación',
            description:
              'Indique la dirección exacta o coordenadas geográficas del lugar y presione Buscar, o navegue manualmente por el mapa satelital.',
            side: defaultSide,
            align: 'start',
          },
        },
        {
          element: '#herramientas-superficie',
          popover: {
            title: 'Herramientas de selección',
            description:
              'Puede utilizar una de las siguientes herramientas para definir el área donde se instalarían los paneles fotovoltaicos.',
            side: defaultSide,
            align: 'start',
          },
        },
        {
          element: '#herramienta-poligono',
          popover: {
            title: 'Polígono Libre',
            description:
              'Marque los vértices de la superficie haciendo clics sobre el mapa y presione «Cerrar Área» o toque el punto inicial para completar la figura.',
            side: defaultSide,
            align: 'start',
          },
        },
        {
          element: '#herramienta-rectangulo',
          popover: {
            title: 'Rectángulo Rápido',
            description:
              'Haga clic y arrastre sobre el mapa para marcar dos vértices opuestos en superficies regulares simples.',
            side: defaultSide,
            align: 'start',
          },
        },
        {
          element: '#herramienta-area-1clic',
          popover: {
            title: 'Área 1 clic',
            description:
              'Toque la herramienta y luego presione directamente sobre el mapa para posicionar un área prediseñada.',
            side: defaultSide,
            align: 'start',
          },
        },
        {
          element: '#herramienta-mover-rotar',
          popover: {
            title: 'Mover / Rotar',
            description:
              'Desplace o rote la superficie definida en el mapa. Para editar los vértices haga doble clic sobre el perímetro.',
            side: defaultSide,
            align: 'start',
          },
        },
        {
          element: '#borrar',
          popover: {
            title: 'Borrar dibujo',
            description:
              'Presione para borrar la selección actual del mapa y realizar una nueva delimitación.',
            side: defaultSide,
            align: 'start',
          },
        },
        {
          element: '#seccion-mapa-calor',
          popover: {
            title: 'Mapa de calor solar',
            description:
              'Permite visualizar la radiación solar anual en la superficie y sus alrededores para evaluar la mejor ubicación para los paneles fotovoltaicos.',
            side: defaultSide,
            align: 'start',
          },
        },
        {
          element: '#seccion-estructura-montaje',
          popover: {
            title: 'Estructura de montaje',
            description:
              'Elija entre montaje "Coplanar" o "Ángulo óptimo (30º al norte)".',
            side: defaultSide,
            align: 'start',
          },
        },
        {
          element: '#boton-siguiente',
          popover: {
            title: 'Siguiente paso',
            description:
              'Una vez delimitada la superficie de instalación, presione este botón para avanzar al análisis de consumo y tarifas.',
            side: defaultSide,
            align: 'start',
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
    if (polygons.length > 0) {
      polygons[0].setEditable(false);
    }
    this.mapService.disableDrawingMode();

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
      if (place && place.formatted_address) {
        input.value = place.formatted_address;
      }
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
    const panelsSelectCount = this.sharedService.getPanelsSelected();
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
      this.instructionText = 'Analizando radiación solar sobre la superficie de instalación... Por favor, espere.';
      return;
    }

    if (state === 'CLOSED' && this.areaMarked) {
      this.instructionText = '¡Superficie de instalación delimitada con éxito! Puede mover/rotar el área, activar el mapa de calor solar o presionar Siguiente.';
      return;
    }

    switch (this.activeMode) {
      case 'polygon':
        this.instructionText = 'Continúe marcando los vértices de la superficie. Haga doble clic en el punto inicial para cerrar.';
        break;

      case 'rectangle':
        this.instructionText = 'Haga clic y arrastre sobre el mapa para trazar una superficie rectangular';
        break;

      case 'select':
        if (this.areaMarked) {
          this.instructionText = 'Arrastre la figura para moverla o use los botones de rotación (-15°, +15°, 90°) para orientarla.';
        } else {
          this.instructionText = 'Elija una herramienta de selección (Polígono, Rectángulo o Área 1 clic) para delimitar primero la superficie de instalación.';
        }
        break;

      case 'static':
      default:
        this.instructionText = 'Busque la ubicación prevista y luego elija una herramienta de selección (Polígono, Rectángulo o Área 1 clic) para delimitar el área de la instalación.';
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
const response = await this.solarApiService.getDataLayers(lat, lng, radiusMeters);
      
      if (response && response.annualFluxUrl) {
        this.zone.run(() => {
          this.annualFluxUrl = response.annualFluxUrl;
          this.heatmapAvailable = true;
          this.showHeatmap = true;
});
        const polygons = this.mapService.getPolygons();
        if (polygons.length > 0) {
          await this.mapService.fetchAndRenderSolarHeatmap(this.annualFluxUrl, polygons[0]);
        }
      } else {
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
      }
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
    if (!this.areaMarked) {
      this.snackBar.open(
        'Debe delimitar una superficie en el mapa para activar el mapa de calor.',
        'Entendido',
        { duration: 4000 }
      );
      this.showHeatmap = false;
      return;
    }
    if (this.showHeatmap) {
      if (!this.annualFluxUrl) {
        await this.loadSolarHeatmap();
      } else {
        const polygons = this.mapService.getPolygons();
        if (polygons.length > 0) {
          await this.mapService.fetchAndRenderSolarHeatmap(this.annualFluxUrl, polygons[0]);
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
    if (this.isSidebarCollapsed || window.innerWidth < 768) {
      this.ingresarAlMapa();
    }
  }

  createQuickRoof() {
    this.mapService.createQuickRoof();
    if (this.isSidebarCollapsed || window.innerWidth < 768) {
      this.ingresarAlMapa();
    }
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

  async ingresarAlMapa(): Promise<void> {
    const inputVal = this.pacInput?.nativeElement?.value?.trim();
    if (inputVal && !this.marker?.position && this.mapService.getPolygons().length === 0) {
      await this.buscarUbicacion(inputVal);
    }
    this.sharedService.setSidebarCollapsed(true);
    setTimeout(() => {
      this.mapService.recenterMapToVisibleArea();
    }, 300);
  }
}
