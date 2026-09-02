import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { LocationService } from './location.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SharedService } from './shared.service';
import { EnvironmentService } from './environment.service';
import { fromArrayBuffer } from 'geotiff';
import { environment } from '../../environments/environments';
import {
  TerraDraw,
  TerraDrawPolygonMode,
  TerraDrawRectangleMode,
  TerraDrawSelectMode,
  HexColor,
} from 'terra-draw';
import { TerraDrawGoogleMapsAdapter } from 'terra-draw-google-maps-adapter';

export type TerraDrawTheme = 'solar' | 'epre' | 'neon';
export type TerraDrawActiveMode = 'polygon' | 'rectangle' | 'select' | 'static';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  private map!: google.maps.Map;
  private center: google.maps.LatLngLiteral = { lat: -31.5364, lng: -68.50639 };
  private zoomInicial = 13;
  zoom: number = this.zoomInicial;
  private mapSubject = new Subject<google.maps.Map>();
  
  private polygons: google.maps.Polygon[] = [];
  private panels: google.maps.Rectangle[] = [];
  private heatMapOverlay: google.maps.GroundOverlay | null = null;
  private heatMapLoadingSubject = new BehaviorSubject<boolean>(false);
  heatMapLoading$ = this.heatMapLoadingSubject.asObservable();
  private lastAnnualFluxUrl: string | null = null;
  private isHeatmapActiveState: boolean = false;
  private isHeatmapActiveSubject = new BehaviorSubject<boolean>(false);
  isHeatmapActive$ = this.isHeatmapActiveSubject.asObservable();

  private cachedSolarRaster: {
    url: string;
    values: Float32Array;
    width: number;
    height: number;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    zone: number;
    northernHemisphere: boolean;
    sw: { lat: number; lng: number };
    ne: { lat: number; lng: number };
  } | null = null;

  private showPanelsOnHeatmap: boolean = true;
  private heatmapOpacity: number = 0.65;

  setShowPanelsOnHeatmap(show: boolean) {
    this.showPanelsOnHeatmap = show;
    this.updatePanelsStyle();
  }

  getShowPanelsOnHeatmap(): boolean {
    return this.showPanelsOnHeatmap;
  }

  setHeatmapOpacity(opacity: number) {
    this.heatmapOpacity = Math.max(0, Math.min(1, opacity));
    if (this.heatMapOverlay) {
      this.heatMapOverlay.setOpacity(this.heatmapOpacity);
    }
  }

  getHeatmapOpacity(): number {
    return this.heatmapOpacity;
  }

  // --- TerraDraw State ---
  private terraDraw: TerraDraw | null = null;
  private activeModeSubject = new BehaviorSubject<TerraDrawActiveMode>('static');
  activeMode$ = this.activeModeSubject.asObservable();

  private activeThemeSubject = new BehaviorSubject<TerraDrawTheme>('solar');
  activeTheme$ = this.activeThemeSubject.asObservable();

  private realtimeAreaM2Subject = new BehaviorSubject<number>(0);
  realtimeAreaM2$ = this.realtimeAreaM2Subject.asObservable();

  private estimatedPanelsCountSubject = new BehaviorSubject<number>(0);
  estimatedPanelsCount$ = this.estimatedPanelsCountSubject.asObservable();

  private canUndoSubject = new BehaviorSubject<boolean>(false);
  private canRedoSubject = new BehaviorSubject<boolean>(false);
  
  canUndo$ = this.canUndoSubject.asObservable();
  canRedo$ = this.canRedoSubject.asObservable();

  private overlayCompleteSubject = new Subject<boolean>();
  private drawingStateSubject = new BehaviorSubject<'INACTIVE' | 'START' | 'DRAWING' | 'CLOSED'>('INACTIVE');
  drawingState$ = this.drawingStateSubject.asObservable();

  private areaSubject = new BehaviorSubject<number>(0);
  area$ = this.areaSubject.asObservable();
  private maxPanelsPerAreaSubject = new BehaviorSubject<number>(0);
  maxPanelsPerArea$ = this.maxPanelsPerAreaSubject.asObservable();
  private panelsRedrawn = new Subject<number>();
  panelsRedrawn$ = this.panelsRedrawn.asObservable();

  get panelWidthMeters(): number {
    return this.sharedService.getDimensionPanel().width;
  }
  get panelHeightMeters(): number {
    return this.sharedService.getDimensionPanel().height;
  }
  polygonAux!: google.maps.Polygon;

  // --- Estado para dibujo manual de polígonos ---
  private isDrawing = false;
  private drawingVertices: google.maps.LatLng[] = [];
  private vertexMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
  private drawingPolyline: google.maps.Polyline | null = null;
  private mapClickListener: google.maps.MapsEventListener | null = null;
  private mapDblClickListener: google.maps.MapsEventListener | null = null;
  private drawingInitialized = false;

  constructor(
    private locationService: LocationService,
    private snackBar: MatSnackBar,
    private sharedService: SharedService,
    private environmentService: EnvironmentService
  ) {}

  ngOnInit(): void {
    this.mapSubject.subscribe({
      next: map => this.map = map
    })
    
  }
  async initializeMap(mapElement: HTMLElement) {
    console.log('Iniciando inicialización del mapa');
    if (!window.google || !window.google.maps) {
      console.error('API de Google Maps no cargada');
      throw new Error('Google Maps API not loaded');
    }

    console.log('Configurando opciones del mapa');
    const mapOptions = {
      center: this.center,
      zoom: this.zoomInicial,
      disableDefaultUI: false,
      zoomControl: false,
      mapTypeId: 'hybrid',
      mapTypeControl: false,
      zoomControlOptions: {
        position: 6, // google.maps.ControlPosition.LEFT_BOTTOM
      },
      fullscreenControl: false,
      streetViewControl: false,
      rotateControl: false,
      gestureHandling: 'greedy',
      mapId: 'b822b45cb79aba09',
      restriction: {
        latLngBounds: {
          north: -28.20,
          south: -32.70,
          west: -70.70,
          east: -66.60,
        },
        strictBounds: false,
      },
    };
    console.log('Opciones del mapa:', mapOptions);

    console.log('Creando instancia del mapa');
    this.map = new google.maps.Map(mapElement, mapOptions);
    console.log('Mapa creado:', this.map);

    console.log('Emitiendo instancia del mapa');
    this.mapSubject.next(this.map);

    // Esperar a que el mapa esté en estado idle para garantizar que sus elementos DOM internos estén montados
    google.maps.event.addListenerOnce(this.map, 'idle', () => {
      console.log('Mapa listo en estado idle, inicializando TerraDraw');
      this.initTerraDraw();
    });
    console.log('Inicialización del mapa completada');
  }

  clearPolygons() {
    this.polygons.forEach((polygon) => polygon.setMap(null));
    this.polygons = [];
  }

  invalidateHeatmapCache() {
    if (this.heatMapOverlay) {
      this.heatMapOverlay.setMap(null);
      this.heatMapOverlay = null;
    }
  }

  clearPanels() {
    this.panels.forEach((panel) => panel.setMap(null));
    this.panels = [];
  }

  getMap() {
    return this.map;
  }

  setCenter(lat: number, lng: number) {
    this.center = { lat, lng };
    if (this.map) {
      this.map.setCenter(this.center);
    }
    this.recenterMapToVisibleArea();
  }

  recenterMapToVisibleArea() {
    const bounds = new google.maps.LatLngBounds();
    this.getPolygons().forEach((polygon) => {
      polygon.getPath().forEach((latLng) => bounds.extend(latLng));
    });

    const mapCenter = bounds.getCenter();

    // Calcular el nuevo centro considerando el ancho de pantalla y si está en móvil
    const screenWidth = window.innerWidth;
    const isMobile = screenWidth < 768;
    const isTablet = screenWidth >= 768 && screenWidth <= 1024;
    const offsetX = isMobile ? 0 : (isTablet ? screenWidth / 6 : screenWidth / 4);

    const zoom = this.map.getZoom() ?? 1;
    const scale = Math.pow(2, zoom);
    const worldCoordinateCenter = this.map
      .getProjection()
      ?.fromLatLngToPoint(mapCenter);

    if (worldCoordinateCenter) {
      const pixelOffset = offsetX / scale;
      const newCenter = this.map
        .getProjection()
        ?.fromPointToLatLng(
          new google.maps.Point(
            worldCoordinateCenter.x + pixelOffset,
            worldCoordinateCenter.y
          )
        );

      if (newCenter) {
        this.map.panTo(newCenter);
      } else {
        console.error('No se pudo calcular el nuevo centro del mapa.');
      }
    }
  }

  recenterMapAfterLocationSet(location: google.maps.LatLng) {
    const screenWidth = window.innerWidth;
    const isMobile = screenWidth < 768;
    const isTablet = screenWidth >= 768 && screenWidth <= 1024;
    const offsetX = isMobile ? 0 : (isTablet ? screenWidth / 6 : screenWidth / 4);
    const zoom = this.map.getZoom() ?? 1;
    const scale = Math.pow(2, zoom);
    const projection = this.map.getProjection();

    if (projection) {
      const worldCoordinateCenter = projection.fromLatLngToPoint(location);

      if (worldCoordinateCenter) {
        const pixelOffset = offsetX / scale;
        const newCenter = projection.fromPointToLatLng(
          new google.maps.Point(
            worldCoordinateCenter.x + pixelOffset,
            worldCoordinateCenter.y
          )
        );

      if (newCenter) {
        this.map.panTo(newCenter);
      } else {
        console.error('No se pudo calcular el nuevo centro del mapa.');
      }
    }
  }
  }

  setZoom(zoom: number) {
    this.zoom = zoom;
    if (this.map) {
      this.map.setZoom(this.zoom);
    }
  }

  // --- Integración TerraDraw ---

  private initTerraDraw() {
    if (!this.map || this.terraDraw) return;

    // Verificar que el div del mapa existe y está montado en el DOM
    const mapDiv = this.map.getDiv();
    if (!mapDiv) {
      console.warn('Contenedor del mapa no disponible aún para TerraDraw, reintentando...');
      setTimeout(() => this.initTerraDraw(), 100);
      return;
    }

    try {
      const currentTheme = this.activeThemeSubject.value;
      const styles = this.getPolygonStyles(currentTheme);

      this.terraDraw = new TerraDraw({
        adapter: new TerraDrawGoogleMapsAdapter({
          lib: google.maps,
          map: this.map,
          coordinatePrecision: 6,
        }),
        modes: [
          new TerraDrawPolygonMode({
            styles: styles,
          }),
          new TerraDrawRectangleMode({
            styles: styles,
          }),
          new TerraDrawSelectMode({
            flags: {
              polygon: {
                feature: {
                  draggable: true,
                  rotateable: true,
                  scaleable: true,
                  coordinates: {
                    midpoints: true,
                    draggable: true,
                    deletable: true,
                  },
                },
              },
              rectangle: {
                feature: {
                  draggable: true,
                  rotateable: true,
                  scaleable: true,
                  coordinates: {
                    midpoints: true,
                    draggable: true,
                    deletable: true,
                  },
                },
              },
            },
            styles: {
              selectedPolygonColor: styles.fillColor,
              selectedPolygonFillOpacity: () => (this.isHeatmapActive() ? 0.0 : 0.25),
              selectedPolygonOutlineColor: styles.outlineColor,
              selectedPolygonOutlineWidth: 3.5,
            },
          }),
        ],
      });

      this.terraDraw.start();
      this.setTerraDrawMode('static');

      // Escuchar eventos de dibujo finalizado o modificado
      this.terraDraw.on('finish', (id: any, context: any) => {
        this.updateUndoRedoStates();
        this.handleTerraDrawChange(true);
        this.setTerraDrawMode('select');
      });

      this.terraDraw.on('change', (ids: any[], type: any) => {
        this.updateUndoRedoStates();
        this.handleTerraDrawChange(false);
      });

      console.log('TerraDraw iniciado con éxito');
    } catch (error) {
      console.error('Error iniciando TerraDraw:', error);
    }
  }

  private getPolygonStyles(theme: TerraDrawTheme) {
    let mainColor: HexColor = '#ea580c';
    let fillColor: HexColor = '#f59e0b';
    let fillOpacity = 0.35;

    if (theme === 'epre') {
      mainColor = '#006241';
      fillColor = '#00875a';
      fillOpacity = 0.35;
    } else if (theme === 'neon') {
      mainColor = '#00ff88';
      fillColor = '#00ffaa';
      fillOpacity = 0.45;
    }

    return {
      fillColor: fillColor,
      fillOpacity: () => (this.isHeatmapActive() ? 0.0 : fillOpacity),
      outlineColor: mainColor,
      outlineWidth: 3.5,
    };
  }

  setTerraDrawMode(mode: TerraDrawActiveMode) {
    if (!this.terraDraw) return;
    try {
      if (mode === 'polygon' || mode === 'rectangle') {
        // Al seleccionar un nuevo modo de dibujo, limpiar dibujos anteriores para mantener una sola área
        this.clearDrawing();
      }
      this.terraDraw.setMode(mode);
      this.activeModeSubject.next(mode);
      if (mode === 'polygon' || mode === 'rectangle') {
        this.drawingStateSubject.next(mode === 'polygon' ? 'START' : 'DRAWING');
      } else if (mode === 'select') {
        this.drawingStateSubject.next('CLOSED');
      } else {
        this.drawingStateSubject.next('INACTIVE');
      }
    } catch (e) {
      console.warn('Error al cambiar modo TerraDraw:', e);
    }
  }

  setTerraDrawTheme(theme: TerraDrawTheme) {
    this.activeThemeSubject.next(theme);
    if (this.terraDraw) {
      this.terraDraw.stop();
      this.terraDraw = null;
      this.initTerraDraw();
      this.handleTerraDrawChange(true);
    }
  }

  /**
   * Rota la figura actual por el ángulo indicado en grados (positivo = sentido horario, negativo = antihorario)
   */
  rotatePolygon(angleDegrees: number) {
    if (!this.terraDraw) return;
    const snapshot = this.terraDraw.getSnapshot();
    if (!snapshot || snapshot.length === 0) return;

    const feature = JSON.parse(JSON.stringify(snapshot[snapshot.length - 1]));
    if (!feature.geometry || !feature.geometry.coordinates || !feature.geometry.coordinates[0]) return;

    const rawCoords: number[][] = feature.geometry.coordinates[0];
    if (rawCoords.length < 3) return;

    // Calcular centroide
    let latSum = 0;
    let lngSum = 0;
    const count = rawCoords.length;
    rawCoords.forEach((c) => {
      lngSum += c[0];
      latSum += c[1];
    });
    const centerLat = latSum / count;
    const centerLng = lngSum / count;

    const rad = (angleDegrees * Math.PI) / 180;
    const cosAngle = Math.cos(rad);
    const sinAngle = Math.sin(rad);
    const cosLat = Math.cos((centerLat * Math.PI) / 180);

    const rotatedCoords = rawCoords.map((c) => {
      const dLat = c[1] - centerLat;
      const dLng = (c[0] - centerLng) * cosLat;

      const newLat = centerLat + (dLat * cosAngle - dLng * sinAngle);
      const newLng = centerLng + (dLat * sinAngle + dLng * cosAngle) / cosLat;

      return [
        Math.round(newLng * 1000000) / 1000000,
        Math.round(newLat * 1000000) / 1000000,
      ];
    });

    feature.geometry.coordinates[0] = rotatedCoords;

    this.terraDraw.updateFeatureGeometry(feature.id as string, feature.geometry as any);
    this.handleTerraDrawChange(true);
  }

  private terraDrawChangeTimeout: any;

  private handleTerraDrawChange(isFinished: boolean = false) {
    if (this.terraDrawChangeTimeout) {
      clearTimeout(this.terraDrawChangeTimeout);
    }
    
    if (isFinished) {
      this._processTerraDrawChange(true);
    } else {
      this.terraDrawChangeTimeout = setTimeout(() => {
        this._processTerraDrawChange(false);
      }, 150);
    }
  }

  private _processTerraDrawChange(isFinished: boolean = false) {
    if (!this.terraDraw) return;
    const snapshot = this.terraDraw.getSnapshot();

    if (!snapshot || snapshot.length === 0) {
      this.clearPolygons();
      this.clearPanels();
      this.areaSubject.next(0);
      this.realtimeAreaM2Subject.next(0);
      this.estimatedPanelsCountSubject.next(0);
      this.overlayCompleteSubject.next(false);
      this.drawingStateSubject.next('INACTIVE');
      return;
    }

    const polygonFeatures = snapshot.filter(
      (f) => f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
    );

    if (polygonFeatures.length === 0) {
      return;
    }

    // Únicamente al finalizar un dibujo eliminamos polígonos anteriores si existieran múltiples
    if (isFinished && polygonFeatures.length > 1) {
      const idsToRemove = polygonFeatures.slice(0, polygonFeatures.length - 1).map(f => f.id as string);
      this.terraDraw.removeFeatures(idsToRemove);
    }

    const feature = polygonFeatures[polygonFeatures.length - 1];
    if (feature.geometry) {
      const rawCoords: any[] = feature.geometry.coordinates[0];
      if (!rawCoords || rawCoords.length < 3) {
        return;
      }

      const path: google.maps.LatLngLiteral[] = rawCoords.map((coord: number[]) => ({
        lat: coord[1],
        lng: coord[0],
      }));

      // Crear polígono interno de referencia en Google Maps
      this.clearPolygons();
      const polygon = new google.maps.Polygon({
        paths: path,
        visible: false,
        map: this.map,
      });
      this.polygons.push(polygon);

      const areaM2 = google.maps.geometry.spherical.computeArea(path);
      const areaReducida = areaM2 * 0.9;
      const panelArea = this.panelArea > 0 ? this.panelArea : 2.0;
      const estimatedPanels = Math.max(0, Math.floor(areaReducida / panelArea));

      this.realtimeAreaM2Subject.next(Math.round(areaM2));
      this.estimatedPanelsCountSubject.next(estimatedPanels);

      const isSelectMode = this.activeModeSubject.value === 'select';

      // Si está finalizada O se está moviendo/arrastrando en modo 'select', actualizar los paneles vectoriales
      if (isFinished || isSelectMode) {
        const isLocationValid = this.locationService.validatePolygonLocation(polygon, this.map, false);
        if (!isLocationValid) {
          this.snackBar.open(
            'La ubicación seleccionada se encuentra fuera de la Provincia de San Juan.',
            'Cerrar',
            {
              duration: 4000,
              panelClass: ['custom-snackbar'],
              horizontalPosition: 'center',
              verticalPosition: 'top',
            }
          );
          this.clearDrawing();
          return;
        }

        const minArea = this.sharedService.calculateAreaPanels(1) * 4;
        if (areaM2 >= minArea) {
          this.areaSubject.next(areaM2);
          this.drawPanels(polygon);
          this.overlayCompleteSubject.next(true);
          this.drawingStateSubject.next('CLOSED');
        } else {
          this.clearPanels();
          this.overlayCompleteSubject.next(false);
        }
      }
    }
  }

  // --- Manejo de Historial (Undo / Redo) ---

  undoTerraDraw() {
    if (this.terraDraw && this.terraDraw.canUndo()) {
      this.terraDraw.undo();
      this.handleTerraDrawChange(true);
      this.updateUndoRedoStates();
    }
  }

  redoTerraDraw() {
    if (this.terraDraw && this.terraDraw.canRedo()) {
      this.terraDraw.redo();
      this.handleTerraDrawChange(true);
      this.updateUndoRedoStates();
    }
  }

  private updateUndoRedoStates() {
    if (this.terraDraw) {
      this.canUndoSubject.next(this.terraDraw.canUndo());
      this.canRedoSubject.next(this.terraDraw.canRedo());
    }
  }

  initializeDrawingManager() {
    if (!this.terraDraw) {
      this.initTerraDraw();
    }
  }

  enableDrawingMode() {
    this.setTerraDrawMode('polygon');
  }

  /**
   * Limpia los marcadores y la polyline temporales del dibujo.
   */
  private clearTemporaryDrawingElements() {
    this.vertexMarkers.forEach(marker => {
      marker.map = null;
    });
    this.vertexMarkers = [];

    if (this.drawingPolyline) {
      this.drawingPolyline.setMap(null);
      this.drawingPolyline = null;
    }
  }

  /**
   * Remueve los listeners del mapa para el dibujo.
   */
  private removeMapListeners() {
    if (this.mapClickListener) {
      google.maps.event.removeListener(this.mapClickListener);
      this.mapClickListener = null;
    }
    if (this.mapDblClickListener) {
      google.maps.event.removeListener(this.mapDblClickListener);
      this.mapDblClickListener = null;
    }
  }

  /**
   * Limpia todo el estado de dibujo temporal (vértices, marcadores, polyline).
   */
  private clearDrawingState() {
    this.drawingVertices = [];
    this.clearTemporaryDrawingElements();
    this.drawingStateSubject.next('INACTIVE');
  }

  private validateArea(polygon: google.maps.Polygon): boolean {
    const area = this.getPolygonArea(polygon);
    const minArea = this.sharedService.calculateAreaPanels(1) * 5;
    // const maxArea = this.sharedService.calculateAreaPanels(1) * 300;

    if (area < minArea) {
      this.snackBar.open(
        'La selección es demasiado pequeña. El área seleccionada debe ser suficiente para al menos 4 paneles.',
        'Cerrar',
        {
          duration: 5000,
          panelClass: ['custom-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top',
        }
      );
      this.overlayCompleteSubject.next(false);
      this.clearPanels();
      return false;
    }
    return true;
  }

  /**
   * Establece el modo de dibujo. Compatible con las llamadas existentes
   * que usan setDrawingMode(null) para desactivar.
   */
  setDrawingMode(mode: any | null) {
    if (mode === null) {
      this.disableDrawingMode();
    }
    // Si mode no es null, no hacemos nada aquí — usar enableDrawingMode() directamente
  }

  overlayComplete$(): Observable<boolean> {
    return this.overlayCompleteSubject.asObservable();
  }

  private drawPanels(
    polygon: google.maps.Polygon,
    maxPanels: number = Infinity,
    isReDraw: boolean = false
  ) {
    const margin: number = 0.1;
    this.clearPanels();
    
    const bounds = new google.maps.LatLngBounds();
    polygon.getPath().forEach((latLng) => {
      bounds.extend(latLng);
    });

    const northEast = bounds.getNorthEast();
    const southWest = bounds.getSouthWest();

    const centerLat = (northEast.lat() + southWest.lat()) / 2;
    const centerLng = (northEast.lng() + southWest.lng()) / 2;
    const radiansLat = centerLat * (Math.PI / 180);

    const panelWidthDegrees =
      this.panelWidthMeters / (111320 * Math.cos(radiansLat));
    const panelHeightDegrees = this.panelHeightMeters / 110574;
    const boundsWidth = Math.abs(northEast.lng() - southWest.lng());
    const boundsHeight = Math.abs(northEast.lat() - southWest.lat());

    // Aplicar margen interno
    const adjustedBoundsWidth = boundsWidth * (1 - margin);
    const adjustedBoundsHeight = boundsHeight * (1 - margin);

    const numPanelsX = Math.round(adjustedBoundsWidth / panelWidthDegrees);
    const numPanelsY = Math.round(adjustedBoundsHeight / panelHeightDegrees);

    const offsetX = (boundsWidth - numPanelsX * panelWidthDegrees) / 2;
    const offsetY = (boundsHeight - numPanelsY * panelHeightDegrees) / 2;

    // 9% reducción de área
    const areaReducida = this.getPolygonArea(polygon) * 0.9;
    this.areaSubject.next(areaReducida);
    const maxPanelsEfectivos = Math.round(areaReducida / this.panelArea);

    let totalPanels = 0;
    const max = isReDraw ? maxPanels : maxPanelsEfectivos;

    for (let i = 0; i < numPanelsX && totalPanels < max; i++) {
      for (let j = 0; j < numPanelsY && totalPanels < max; j++) {
        const southWestCorner = new google.maps.LatLng(
          southWest.lat() + offsetY + j * panelHeightDegrees,
          southWest.lng() + offsetX + i * panelWidthDegrees
        );
        const northEastCorner = new google.maps.LatLng(
          southWest.lat() + offsetY + (j + 1) * panelHeightDegrees,
          southWest.lng() + offsetX + (i + 1) * panelWidthDegrees
        );

        // Verificar si las 4 esquinas del panel están dentro del polígono
        const corners = [
          southWestCorner,
          new google.maps.LatLng(southWestCorner.lat(), northEastCorner.lng()),
          northEastCorner,
          new google.maps.LatLng(northEastCorner.lat(), southWestCorner.lng()),
        ];

        const allCornersInside = corners.every((corner) =>
          google.maps.geometry.poly.containsLocation(corner, polygon)
        );

        if (allCornersInside) {
          const isHeatmap = this.isHeatmapActive();
          const panelRectangle = new google.maps.Rectangle({
            bounds: new google.maps.LatLngBounds(
              southWestCorner,
              northEastCorner
            ),
            fillColor: '#000000',
            fillOpacity: isHeatmap ? 0.18 : 0.7,
            strokeColor: '#FFFFFF',
            strokeWeight: isHeatmap ? 1.2 : 0.5,
            strokeOpacity: isHeatmap ? 0.95 : 1,
            zIndex: isHeatmap ? 20 : 5,
            map: (isHeatmap && !this.showPanelsOnHeatmap) ? null : this.map,
          });

          this.panels.push(panelRectangle);
          totalPanels++;
        }
      }
    }
    // let panelesMaximos = isReDraw ? maxPanels : totalPanels;
    this.sharedService.setMaxPanelsPerSuperface(maxPanelsEfectivos);
    this.sharedService.setPanelsCountSelected(totalPanels);
    this.sharedService.calculateAreaPanelsSelected(totalPanels);

    if (this.isHeatmapActive()) {
      this.updatePanelsStyle();
      this.setPolygonFillOpacity(0);
      if (this.cachedSolarRaster && this.polygons.length > 0) {
        this.renderHeatmapOverlayFromRaster(this.polygons[0]);
      } else if (this.lastAnnualFluxUrl && this.polygons.length > 0 && !this.heatMapOverlay) {
        this.fetchAndRenderSolarHeatmap(this.lastAnnualFluxUrl, this.polygons[0]);
      }
    }
  }

  reDrawPanels(panelesCantidad: number) {
    if (!this.validateArea(this.getPolygons()[0])) {
      this.clearDrawing();
      return;
    }
    this.redrawAux(this.getPolygons()[0], panelesCantidad);
    this.panelsRedrawn.next(panelesCantidad);
  }
  private redrawAux(
    polygon: google.maps.Polygon,
    maxPanels: number,
  ) {
    const margin: number = 0.1;
    this.clearPanels();
    
    const bounds = new google.maps.LatLngBounds();
    polygon.getPath().forEach((latLng) => {
      bounds.extend(latLng);
    });

    const northEast = bounds.getNorthEast();
    const southWest = bounds.getSouthWest();

    const centerLat = (northEast.lat() + southWest.lat()) / 2;
    const centerLng = (northEast.lng() + southWest.lng()) / 2;
    const radiansLat = centerLat * (Math.PI / 180);

    const panelWidthDegrees =
      this.panelWidthMeters / (111320 * Math.cos(radiansLat));
    const panelHeightDegrees = this.panelHeightMeters / 110574;
    const boundsWidth = Math.abs(northEast.lng() - southWest.lng());
    const boundsHeight = Math.abs(northEast.lat() - southWest.lat());

    // Aplicar margen interno
    const adjustedBoundsWidth = boundsWidth * (1 - margin);
    const adjustedBoundsHeight = boundsHeight * (1 - margin);

    const numPanelsX = Math.round(adjustedBoundsWidth / panelWidthDegrees);
    const numPanelsY = Math.round(adjustedBoundsHeight / panelHeightDegrees);

    const offsetX = (boundsWidth - numPanelsX * panelWidthDegrees) / 2;
    const offsetY = (boundsHeight - numPanelsY * panelHeightDegrees) / 2;

    // 9% reducción de área
    const areaReducida = this.getPolygonArea(polygon) * 0.9;
    this.areaSubject.next(areaReducida);
    const maxPanelsEfectivos = Math.round(areaReducida / this.panelArea);

    let totalPanels = 0;
    const max = maxPanels;
    let maxGridPanels = 0;

    for (let i = 0; i < numPanelsX; i++) {
      for (let j = 0; j < numPanelsY; j++) {
        const southWestCorner = new google.maps.LatLng(
          southWest.lat() + offsetY + j * panelHeightDegrees,
          southWest.lng() + offsetX + i * panelWidthDegrees
        );
        const northEastCorner = new google.maps.LatLng(
          southWest.lat() + offsetY + (j + 1) * panelHeightDegrees,
          southWest.lng() + offsetX + (i + 1) * panelWidthDegrees
        );

        // Verificar si las 4 esquinas del panel están dentro del polígono
        const corners = [
          southWestCorner,
          new google.maps.LatLng(southWestCorner.lat(), northEastCorner.lng()),
          northEastCorner,
          new google.maps.LatLng(northEastCorner.lat(), southWestCorner.lng()),
        ];

        const allCornersInside = corners.every((corner) =>
          google.maps.geometry.poly.containsLocation(corner, polygon)
        );

        if (allCornersInside) {
          maxGridPanels++;

          if (totalPanels < max) {
            const isHeatmap = this.isHeatmapActive();
            const panelRectangle = new google.maps.Rectangle({
              bounds: new google.maps.LatLngBounds(
                southWestCorner,
                northEastCorner
              ),
              fillColor: '#000000',
              fillOpacity: isHeatmap ? 0.18 : 0.7,
              strokeColor: '#FFFFFF',
              strokeWeight: isHeatmap ? 1.2 : 0.5,
              strokeOpacity: isHeatmap ? 0.95 : 1,
              zIndex: isHeatmap ? 20 : 5,
              map: (isHeatmap && !this.showPanelsOnHeatmap) ? null : this.map,
            });

            this.panels.push(panelRectangle);
            totalPanels++;
          }
        }
      }
    }
    this.sharedService.setMaxPanelsPerSuperface(maxGridPanels);
    this.sharedService.setPanelsCountSelected(totalPanels);
    this.sharedService.calculateAreaPanelsSelected(totalPanels);

    if (this.isHeatmapActive()) {
      this.updatePanelsStyle();
      this.setPolygonFillOpacity(0);
      if (this.cachedSolarRaster && this.polygons.length > 0) {
        this.renderHeatmapOverlayFromRaster(this.polygons[0]);
      } else if (this.lastAnnualFluxUrl && this.polygons.length > 0 && !this.heatMapOverlay) {
        this.fetchAndRenderSolarHeatmap(this.lastAnnualFluxUrl, this.polygons[0]);
      }
    }
  }

  getPolygons() {
    return this.polygons;
  }

  getPolygonCoordinates(): google.maps.LatLngLiteral[] | null {
    if (this.polygons.length > 0) {
      const path = this.polygons[0].getPath();
      const coordinates: google.maps.LatLngLiteral[] = [];
      path.forEach((latLng) => {
        coordinates.push({ lat: latLng.lat(), lng: latLng.lng() });
      });
      return coordinates;
    }
    return null;
  }

  getPolygonArea(polygon?: google.maps.Polygon): number {
    if (this.polygons.length > 0) {
      const path = polygon?.getPath() ?? this.getPolygons()[0].getPath();
      const area = google.maps.geometry.spherical.computeArea(path!);

      return area;
    }
    this.areaSubject.next(0);
    return 0;
  }

  get panelArea(): number {
    return this.panelWidthMeters * this.panelHeightMeters;
  }

  /**
   * Métodos de compatibilidad: hideDrawingControl y showDrawingControl
   * ya no necesitan hacer nada (no hay DrawingManager), pero se mantienen
   * para que los componentes que los llaman no rompan.
   */
  hideDrawingControl() {
    // No-op: ya no hay DrawingManager con controles visuales
  }

  showDrawingControl() {
    // No-op: ya no hay DrawingManager con controles visuales
  }

  disableDrawingMode() {
    this.isDrawing = false;
    this.removeMapListeners();
    if (this.map) {
      this.map.setOptions({ draggableCursor: '' });
    }
    if (this.polygons.length > 0) {
      this.drawingStateSubject.next('CLOSED');
    } else {
      this.drawingStateSubject.next('INACTIVE');
    }
  }

  clearDrawing() {
    this.clearPolygons();
    this.clearPanels();
    if (this.terraDraw) {
      try {
        this.terraDraw.clear();
      } catch (e) {}
    }
    this.canUndoSubject.next(false);
    this.canRedoSubject.next(false);
    this.realtimeAreaM2Subject.next(0);
    this.estimatedPanelsCountSubject.next(0);
    this.disableDrawingMode();
    this.clearHeatmap();
    this.overlayCompleteSubject.next(false);
    this.areaSubject.next(0);
  }

  /**
   * Actualiza el estilo y visibilidad de los paneles según si el mapa de calor está activo o no.
   */
  updatePanelsStyle() {
    if (!this.panels || this.panels.length === 0) return;
    const isHeatmap = this.isHeatmapActive();

    this.panels.forEach((panel) => {
      if (isHeatmap) {
        if (this.showPanelsOnHeatmap) {
          panel.setOptions({
            fillColor: '#000000',
            fillOpacity: 0.18,
            strokeColor: '#FFFFFF',
            strokeWeight: 1.2,
            strokeOpacity: 0.95,
            zIndex: 20,
          });
          panel.setMap(this.map);
        } else {
          panel.setMap(null);
        }
      } else {
        panel.setOptions({
          fillColor: '#000000',
          fillOpacity: 0.7,
          strokeColor: '#FFFFFF',
          strokeWeight: 0.5,
          strokeOpacity: 1,
          zIndex: 5,
        });
        panel.setMap(this.map);
      }
    });
  }

  /**
   * Modifica la visibilidad de los paneles vectoriales dibujados en el mapa.
   */
  setPanelsVisibility(visible: boolean) {
    if (this.panels && this.panels.length > 0) {
      if (!visible) {
        this.panels.forEach((panel) => panel.setMap(null));
      } else {
        this.updatePanelsStyle();
      }
    }
  }

  /**
   * Modifica la opacidad del relleno de los polígonos dibujados en el mapa (tanto de referencia como de TerraDraw).
   */
  setPolygonFillOpacity(opacity: number) {
    if (this.polygons && this.polygons.length > 0) {
      this.polygons.forEach((poly) => {
        poly.setOptions({ fillOpacity: opacity });
      });
    }
    this.applyTerraDrawDataLayerFillOpacity(opacity);
  }

  /**
   * Aplica directamente la opacidad de relleno a las geometrías poligonales de TerraDraw
   * en la capa de datos vectorial (google.maps.Data) de Google Maps.
   */
  private applyTerraDrawDataLayerFillOpacity(opacity: number) {
    if (!this.map || !this.map.data) return;

    const apply = () => {
      if (!this.map || !this.map.data) return;
      this.map.data.forEach((feature) => {
        const geom = feature.getGeometry();
        if (geom) {
          const type = geom.getType();
          if (type === 'Polygon' || type === 'MultiPolygon') {
            if (opacity <= 0) {
              this.map.data.overrideStyle(feature, {
                fillOpacity: 0,
              });
            } else {
              this.map.data.revertStyle(feature);
            }
          }
        }
      });
    };

    apply();
    // Re-aplicar en el siguiente frame para sincronizar tras posibles flushes asíncronos de TerraDraw
    requestAnimationFrame(() => apply());
  }

  /**
   * Convierte coordenadas de proyección UTM (WGS84) a LatLng (grados decimales, EPSG:4326).
   * Implementa las ecuaciones inversas de Redfearn.
   */
  private utmToLatLng(zone: number, easting: number, northing: number, northernHemisphere: boolean): { lat: number; lng: number } {
    let y = northing;
    if (!northernHemisphere) {
      y = 10000000 - northing;
    }

    const a = 6378137.0; // Radio ecuatorial WGS84
    const f = 1 / 298.257223563; // Achatamiento
    const k0 = 0.9996; // Factor de escala en el meridiano central

    const e = Math.sqrt(1 - Math.pow(1 - f, 2));
    const e1sq = (e * e) / (1 - e * e);
    const arc = y / k0;
    const mu = arc / (a * (1 - (e * e) / 4 - (3 * Math.pow(e, 4)) / 64 - (5 * Math.pow(e, 6)) / 256));

    const ei = (1 - Math.sqrt(1 - e * e)) / (1 + Math.sqrt(1 - e * e));
    
    const phi1 = mu + (3 * ei / 2 - 27 * Math.pow(ei, 3) / 32) * Math.sin(2 * mu) +
                 (21 * Math.pow(ei, 2) / 16 - 55 * Math.pow(ei, 4) / 32) * Math.sin(4 * mu) +
                 (151 * Math.pow(ei, 3) / 96) * Math.sin(6 * mu) +
                 (1097 * Math.pow(ei, 4) / 512) * Math.sin(8 * mu);

    const sinPhi1 = Math.sin(phi1);
    const cosPhi1 = Math.cos(phi1);
    const tanPhi1 = Math.tan(phi1);

    const n1 = a / Math.sqrt(1 - Math.pow(e * sinPhi1, 2));
    const t1 = tanPhi1 * tanPhi1;
    const c1 = e1sq * Math.pow(cosPhi1, 2);
    const r1 = a * (1 - e * e) / Math.pow(1 - Math.pow(e * sinPhi1, 2), 1.5);
    const d = (easting - 500000) / (n1 * k0);

    const lat = phi1 - (n1 * tanPhi1 / r1) * (d * d / 2 - (5 + 3 * t1 + 10 * c1 - 4 * c1 * c1 - 9 * e1sq) * Math.pow(d, 4) / 24 + (61 + 90 * t1 + 298 * c1 + 45 * t1 * t1 - 252 * e1sq - 3 * c1 * c1) * Math.pow(d, 6) / 720);
    const lng = (d - (1 + 2 * t1 + c1) * Math.pow(d, 3) / 6 + (5 - 2 * c1 + 28 * t1 - 3 * c1 * c1 + 8 * e1sq + 24 * t1 * t1) * Math.pow(d, 5) / 120) / cosPhi1;

    const lonOrigin = (zone - 1) * 6 - 180 + 3;

    let latResult = lat * (180 / Math.PI);
    if (!northernHemisphere) {
      latResult = -latResult;
    }

    return {
      lat: latResult,
      lng: lonOrigin + lng * (180 / Math.PI)
    };
  }

  /**
   * Convierte coordenadas LatLng (WGS84, EPSG:4326) a UTM (metros en proyección).
   * Implementa las ecuaciones directas de Redfearn.
   */
  private latLngToUtm(lat: number, lng: number): { easting: number; northing: number; zone: number; northernHemisphere: boolean } {
    const zone = Math.floor((lng + 180) / 6) + 1;
    const lonOrigin = (zone - 1) * 6 - 180 + 3;
    
    const latRad = lat * Math.PI / 180;
    const lngRad = lng * Math.PI / 180;
    const lonOriginRad = lonOrigin * Math.PI / 180;

    const a = 6378137.0; // Radio ecuatorial WGS84
    const f = 1 / 298.257223563;
    const k0 = 0.9996;

    const e = Math.sqrt(1 - Math.pow(1 - f, 2));
    const e1sq = (e * e) / (1 - e * e);
    
    const n = a / Math.sqrt(1 - Math.pow(e * Math.sin(latRad), 2));
    const t = Math.tan(latRad) * Math.tan(latRad);
    const c = e1sq * Math.pow(Math.cos(latRad), 2);
    const A = (lngRad - lonOriginRad) * Math.cos(latRad);

    const M = a * ((1 - e*e/4 - 3*Math.pow(e,4)/64 - 5*Math.pow(e,6)/256) * latRad
                - (3*e*e/8 + 3*Math.pow(e,4)/32 + 45*Math.pow(e,6)/1024) * Math.sin(2*latRad)
                + (15*Math.pow(e,4)/256 + 45*Math.pow(e,6)/1024) * Math.sin(4*latRad)
                - (35*Math.pow(e,6)/3072) * Math.sin(6*latRad));

    const easting = k0 * n * (A + (1 - t + c) * Math.pow(A, 3) / 6 + (5 - 18 * t + t * t + 72 * c - 58 * e1sq) * Math.pow(A, 5) / 120) + 500000;
    let northing = k0 * (M + n * Math.tan(latRad) * (A * A / 2 + (5 - t + 9 * c + 4 * c * c) * Math.pow(A, 4) / 24 + (61 - 58 * t + t * t + 600 * c - 330 * e1sq) * Math.pow(A, 6) / 720));

    const northernHemisphere = lat >= 0;
    if (!northernHemisphere) {
      northing += 10000000; // Ajuste para el Hemisferio Sur
    }
    return {
      easting,
      northing,
      zone,
      northernHemisphere
    };
  }

  isHeatmapActive(): boolean {
    return this.isHeatmapActiveSubject.value || this.isHeatmapActiveState || !!(this.heatMapOverlay && this.heatMapOverlay.getMap());
  }

  /**
   * Oculta el GroundOverlay del mapa de calor solar (manteniendo el cache ráster en memoria), restaurando paneles y opacidad.
   */
  hideHeatmap() {
    this.isHeatmapActiveState = false;
    this.isHeatmapActiveSubject.next(false);
    if (this.heatMapOverlay) {
      this.heatMapOverlay.setMap(null);
    }
    // Restaurar el estado visual original de los paneles y el polígono
    this.setPanelsVisibility(true);
    const themeOpacity = this.activeThemeSubject.value === 'neon' ? 0.45 : 0.35;
    this.setPolygonFillOpacity(themeOpacity);
  }

  /**
   * Limpia y remueve el GroundOverlay del mapa de calor solar y el cache ráster por completo.
   */
  clearHeatmap() {
    this.isHeatmapActiveState = false;
    this.isHeatmapActiveSubject.next(false);
    this.lastAnnualFluxUrl = null;
    this.cachedSolarRaster = null;
    if (this.heatMapOverlay) {
      this.heatMapOverlay.setMap(null);
      this.heatMapOverlay = null;
    }
    // Restaurar el estado visual original de los paneles y el polígono
    this.setPanelsVisibility(true);
    const themeOpacity = this.activeThemeSubject.value === 'neon' ? 0.45 : 0.35;
    this.setPolygonFillOpacity(themeOpacity);
  }

  /**
   * Dibuja el GroundOverlay térmico a partir del ráster en memoria y lo ajusta a la geometría actual del polígono.
   */
  private renderHeatmapOverlayFromRaster(polygon: google.maps.Polygon) {
    if (!this.cachedSolarRaster) return;

    const {
      values,
      width,
      height,
      minX,
      minY,
      maxX,
      maxY,
      sw,
      ne,
    } = this.cachedSolarRaster;

    // Calcular el centroide del polígono actual
    const bounds = new google.maps.LatLngBounds();
    polygon.getPath().forEach(p => bounds.extend(p));
    const center = bounds.getCenter();
    const centerLat = center.lat();
    const centerLng = center.lng();

    // Crear canvas para dibujar los píxeles
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No se pudo obtener el contexto 2D del canvas');
    }

    // Aplicar máscara circular ampliada sobre el GeoTIFF centrada en el polígono
    const utmCenter = this.latLngToUtm(centerLat, centerLng);
    const centerX = ((utmCenter.easting - minX) / (maxX - minX)) * width;
    const centerY = ((maxY - utmCenter.northing) / (maxY - minY)) * height;

    let maxPolyRadiusPx = 0;
    polygon.getPath().forEach((latLng) => {
      const utmPoint = this.latLngToUtm(latLng.lat(), latLng.lng());
      const px = ((utmPoint.easting - minX) / (maxX - minX)) * width;
      const py = ((maxY - utmPoint.northing) / (maxY - minY)) * height;
      const dist = Math.sqrt((px - centerX) ** 2 + (py - centerY) ** 2);
      if (dist > maxPolyRadiusPx) maxPolyRadiusPx = dist;
    });

    const circleRadiusPx = Math.min(
      Math.min(width, height) * 0.48,
      Math.max(maxPolyRadiusPx * 1.6, Math.min(width, height) * 0.35)
    );

    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadiusPx, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Dibujar los píxeles de irradiancia
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    const minFlux = 1000;
    const maxFlux = 2100;

    for (let i = 0; i < values.length; i++) {
      const flux = values[i];
      const pixelIndex = i * 4;

      if (flux === -9999 || isNaN(flux) || flux <= 0) {
        data[pixelIndex + 3] = 0; // Transparente
        continue;
      }

      const t = Math.max(0, Math.min(1, (flux - minFlux) / (maxFlux - minFlux)));
      let r = 0, g = 0, b = 0;
      if (t < 0.5) {
        const factor = t * 2;
        r = Math.round(48 + (230 - 48) * factor);
        g = Math.round(0 + (57 - 0) * factor);
        b = Math.round(102 + (0 - 102) * factor);
      } else {
        const factor = (t - 0.5) * 2;
        r = 230 + Math.round((255 - 230) * factor);
        g = 57 + Math.round((229 - 57) * factor);
        b = 0;
      }

      data[pixelIndex] = r;
      data[pixelIndex + 1] = g;
      data[pixelIndex + 2] = b;
      data[pixelIndex + 3] = 255;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(imageData, 0, 0);
      ctx.drawImage(tempCanvas, 0, 0);
    } else {
      ctx.putImageData(imageData, 0, 0);
    }

    // Remover overlay previo si existía
    if (this.heatMapOverlay) {
      this.heatMapOverlay.setMap(null);
      this.heatMapOverlay = null;
    }

    const overlayBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(sw.lat, sw.lng),
      new google.maps.LatLng(ne.lat, ne.lng)
    );

    this.heatMapOverlay = new google.maps.GroundOverlay(
      canvas.toDataURL(),
      overlayBounds,
      {
        opacity: this.heatmapOpacity,
        map: this.map,
      }
    );

    this.isHeatmapActiveState = true;
    this.isHeatmapActiveSubject.next(true);

    // Actualizar estilo de paneles según configuración (traslúcidos o invisibles) y polígono transparente
    this.updatePanelsStyle();
    this.setPolygonFillOpacity(0);
  }

  /**
   * Descarga la capa de flujo solar anual (GeoTIFF) o reutiliza el ráster cacheado en memoria,
   * recorta los límites según el polígono del usuario y dibuja un GroundOverlay térmico.
   */
  async fetchAndRenderSolarHeatmap(annualFluxUrl: string, polygon: google.maps.Polygon) {
    if (!annualFluxUrl) {
      console.warn('[MapService] No se proporcionó annualFluxUrl.');
      return;
    }

    this.lastAnnualFluxUrl = annualFluxUrl;
    this.isHeatmapActiveState = true;
    this.isHeatmapActiveSubject.next(true);

    // Ajustar paneles a modo comparativo (o según preferencia) y hacer transparente el polígono
    this.updatePanelsStyle();
    this.setPolygonFillOpacity(0);

    // Si ya tenemos el ráster cacheado para esta URL, renderizamos directamente sin fetch de red
    if (this.cachedSolarRaster && this.cachedSolarRaster.url === annualFluxUrl) {
      console.log('[MapService] Reutilizando ráster GeoTIFF cacheado en memoria.');
      this.renderHeatmapOverlayFromRaster(polygon);
      this.heatMapLoadingSubject.next(false);
      return;
    }

    this.heatMapLoadingSubject.next(true);

    try {
      // 1. Descargar el archivo GeoTIFF a través del proxy seguro del backend (sin exponer la Google API Key)
      let targetDownloadUrl = annualFluxUrl;
      if (targetDownloadUrl.includes('solar.googleapis.com')) {
        // En caso de recibir URL directa de Google, enrutar por el proxy del backend
        targetDownloadUrl = `${environment.apiUrl}/solar/geotiff?url=${encodeURIComponent(targetDownloadUrl)}`;
      } else if (targetDownloadUrl.startsWith('/')) {
        targetDownloadUrl = `${environment.apiUrl}${targetDownloadUrl}`;
      }

      const response = await fetch(targetDownloadUrl);
      if (!response.ok) {
        throw new Error(`Error HTTP descargando GeoTIFF: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();

      // 2. Parsear el GeoTIFF
      const tiff = await fromArrayBuffer(arrayBuffer);
      const image = await tiff.getImage();
      const rasters = await image.readRasters();
      const values = rasters[0] as Float32Array;
      const width = image.getWidth();
      const height = image.getHeight();

      // Obtener el Bounding Box
      const bbox = image.getBoundingBox(); // [minX, minY, maxX, maxY]
      const minX = bbox[0];
      const minY = bbox[1];
      const maxX = bbox[2];
      const maxY = bbox[3];

      // Determinar la zona UTM y el hemisferio dinámicamente a partir del centroide del polígono del usuario
      const bounds = new google.maps.LatLngBounds();
      polygon.getPath().forEach(p => bounds.extend(p));
      const center = bounds.getCenter();
      const centerLat = center.lat();
      const centerLng = center.lng();

      const zone = Math.floor((centerLng + 180) / 6) + 1;
      const northernHemisphere = centerLat >= 0;

      // Convertir límites proyectados UTM a grados decimales de Lat/Lng para Google Maps
      const sw = this.utmToLatLng(zone, minX, minY, northernHemisphere);
      const ne = this.utmToLatLng(zone, maxX, maxY, northernHemisphere);

      console.log(`[MapService] GeoTIFF Bounds (UTM): minX=${minX}, minY=${minY}, maxX=${maxX}, maxY=${maxY}, zone=${zone}, N=${northernHemisphere}`);
      console.log(`[MapService] GeoTIFF Bounds (LatLng): SW=(${sw.lat}, ${sw.lng}), NE=(${ne.lat}, ${ne.lng})`);

      // Analizar si el GeoTIFF contiene datos de radiación válidos (distintos de -9999)
      let validPixels = 0;
      let minVal = Infinity;
      let maxVal = -Infinity;
      for (let i = 0; i < values.length; i++) {
        const val = values[i];
        if (val !== -9999 && !isNaN(val) && val > 0) {
          validPixels++;
          if (val < minVal) minVal = val;
          if (val > maxVal) maxVal = val;
        }
      }

      console.log(`[MapService] GeoTIFF decodificado: total=${values.length}, validos=${validPixels}, min=${minVal}, max=${maxVal}`);

      if (validPixels === 0) {
        console.log('[MapService] Sin píxeles de radiación válidos en el GeoTIFF.');
        this.snackBar.open(
          'No hay datos de radiación solar detallados disponibles para esta zona específica.',
          'Entendido',
          { duration: 5000 }
        );
        this.hideHeatmap();
        return;
      }

      // Guardar en cache de memoria
      this.cachedSolarRaster = {
        url: annualFluxUrl,
        values,
        width,
        height,
        minX,
        minY,
        maxX,
        maxY,
        zone,
        northernHemisphere,
        sw,
        ne,
      };

      // Renderizar overlay
      this.renderHeatmapOverlayFromRaster(polygon);
      console.log('[MapService] Mapa de calor solar renderizado correctamente.');
    } catch (error) {
      console.error('[MapService] Error al renderizar el mapa de calor solar:', error);
      this.snackBar.open(
        'No hay datos de radiación solar detallados disponibles para esta zona específica.',
        'Entendido',
        { duration: 5000 }
      );
      this.hideHeatmap();
    } finally {
      this.heatMapLoadingSubject.next(false);
    }
  }

  getMap$() {
    this.mapSubject
  }
}
