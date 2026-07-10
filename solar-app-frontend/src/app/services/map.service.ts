import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { LocationService } from './location.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SharedService } from './shared.service';
import { EnvironmentService } from './environment.service';
import { fromArrayBuffer } from 'geotiff';

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

  private overlayCompleteSubject = new Subject<boolean>();
  private drawingStateSubject = new BehaviorSubject<'INACTIVE' | 'START' | 'DRAWING' | 'CLOSED'>('INACTIVE');
  drawingState$ = this.drawingStateSubject.asObservable();

  private areaSubject = new BehaviorSubject<number>(0);
  area$ = this.areaSubject.asObservable();
  private maxPanelsPerAreaSubject = new BehaviorSubject<number>(0);
  maxPanelsPerArea$ = this.maxPanelsPerAreaSubject.asObservable();
  private panelsRedrawn = new Subject<number>();
  panelsRedrawn$ = this.panelsRedrawn.asObservable();

  private panelWidthMeters = 1.045;
  private panelHeightMeters = 1.879;
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
      mapTypeId: google.maps.MapTypeId.HYBRID,
      mapTypeControl: false,
      zoomControlOptions: {
        position: google.maps.ControlPosition.LEFT_BOTTOM,
      },
      fullscreenControl: false,
      streetViewControl: false,
      rotateControl: false,
      gestureHandling: 'cooperative',
      mapId: 'b822b45cb79aba09',
    };
    console.log('Opciones del mapa:', mapOptions);

    console.log('Creando instancia del mapa');
    this.map = new google.maps.Map(mapElement, mapOptions);
    console.log('Mapa creado:', this.map);

    console.log('Emitiendo instancia del mapa');
    this.mapSubject.next(this.map);
    console.log('Inicialización del mapa completada');
  }

  clearPolygons() {
    this.polygons.forEach((polygon) => polygon.setMap(null));
    this.polygons = [];
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

    // Calcular el nuevo centro considerando el desplazamiento hacia la izquierda de 1/4 del ancho de la pantalla
    const screenWidth = window.innerWidth; // Ancho de la pantalla en píxeles
    const offsetX = screenWidth / 4; // Desplazamiento de 1/4 del ancho de la pantalla

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
    const offsetX = window.innerWidth / 4; // Desplazamiento de 1/4 del ancho de la pantalla
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

  // --- Dibujo manual de polígonos (reemplaza DrawingManager) ---

  initializeDrawingManager() {
    console.log('Iniciando initializeDrawingManager (modo manual)');
    this.drawingInitialized = true;
    console.log('Dibujo manual inicializado correctamente');
  }

  /**
   * Activa el modo de dibujo: escucha clics en el mapa para agregar vértices.
   */
  enableDrawingMode() {
    if (!this.map) return;

    // Limpiar dibujo anterior
    this.clearDrawingState();

    this.isDrawing = true;
    this.drawingStateSubject.next('START');
    this.map.setOptions({ draggableCursor: 'crosshair' });

    // Listener de clic en el mapa para agregar vértices
    this.mapClickListener = this.map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (!this.isDrawing || !event.latLng) return;
      this.addVertex(event.latLng);
    });

    // Listener de doble-clic para cerrar el polígono
    this.mapDblClickListener = this.map.addListener('dblclick', (event: google.maps.MapMouseEvent) => {
      if (!this.isDrawing || this.drawingVertices.length < 3) return;
      // Prevenir que el doble clic agregue un vértice extra y haga zoom
      event.stop();
      this.closePolygon();
    });

    this.snackBar.open(
      'Haga clic en el mapa para marcar los vértices del área. Cierre el polígono haciendo clic en el primer punto o doble-clic.',
      '',
      {
        duration: 5000,
        panelClass: ['custom-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top',
      }
    );
  }

  /**
   * Agrega un vértice al polígono en construcción.
   */
  private async addVertex(latLng: google.maps.LatLng) {
    // Si hacemos clic cerca del primer vértice y ya hay al menos 3 puntos, cerrar el polígono
    if (this.drawingVertices.length >= 3) {
      const firstVertex = this.drawingVertices[0];
      const distance = google.maps.geometry.spherical.computeDistanceBetween(latLng, firstVertex);
      // Si está a menos de 5 metros del primer punto, cerrar
      if (distance < 5) {
        this.closePolygon();
        return;
      }
    }

    this.drawingVertices.push(latLng);
    if (this.drawingVertices.length >= 3) {
      this.drawingStateSubject.next('DRAWING');
    } else {
      this.drawingStateSubject.next('START');
    }

    // Crear marcador visual para el vértice
    const { AdvancedMarkerElement } = (await google.maps.importLibrary('marker')) as google.maps.MarkerLibrary;

    const pinElement = document.createElement('div');
    pinElement.style.width = '14px';
    pinElement.style.height = '14px';
    pinElement.style.borderRadius = '50%';
    pinElement.style.backgroundColor = this.drawingVertices.length === 1 ? '#00FF00' : '#FFFFFF';
    pinElement.style.border = '2px solid #00FF00';
    pinElement.style.cursor = 'pointer';
    pinElement.style.boxShadow = '0 0 4px rgba(0,0,0,0.5)';

    const marker = new AdvancedMarkerElement({
      position: latLng,
      map: this.map,
      content: pinElement,
      gmpClickable: true,
    });

    // Si es el primer vértice, agregar listener para cerrar al hacer clic
    if (this.drawingVertices.length === 1) {
      marker.addListener('gmp-click', () => {
        if (this.isDrawing && this.drawingVertices.length >= 3) {
          this.closePolygon();
        }
      });
    }

    this.vertexMarkers.push(marker);

    // Actualizar la polyline de previsualización
    this.updateDrawingPolyline();
  }

  /**
   * Actualiza la línea de previsualización que conecta los vértices.
   */
  private updateDrawingPolyline() {
    if (this.drawingPolyline) {
      this.drawingPolyline.setMap(null);
    }

    if (this.drawingVertices.length < 2) return;

    // Crear path incluyendo una línea de regreso al primer punto para previsualizar el cierre
    const path = [...this.drawingVertices];
    if (path.length >= 3) {
      path.push(path[0]); // Cerrar visualmente la previsualización
    }

    this.drawingPolyline = new google.maps.Polyline({
      path: path,
      strokeColor: '#00FF00',
      strokeWeight: 3,
      strokeOpacity: 0.8,
      map: this.map,
    });
  }

  /**
   * Cierra el polígono: crea el Polygon final y ejecuta toda la lógica de
   * validación, cálculo de paneles y emisión de eventos (equivalente al
   * antiguo handler overlaycomplete del DrawingManager).
   */
  private closePolygon() {
    if (this.drawingVertices.length < 3) return;

    // Limpiar elementos temporales de dibujo
    this.clearTemporaryDrawingElements();
    this.isDrawing = false;
    this.drawingStateSubject.next('CLOSED');
    this.removeMapListeners();
    this.map.setOptions({ draggableCursor: '' });

    // Limpiar polígonos y paneles anteriores
    this.clearPolygons();
    this.clearPanels();

    // Crear el polígono final con las mismas opciones visuales que antes
    const newPolygon = new google.maps.Polygon({
      paths: this.drawingVertices,
      fillColor: '#808080',
      fillOpacity: 0.5,
      strokeWeight: 3,
      strokeColor: '#00FF00',
      clickable: true,
      editable: true,
      zIndex: 1,
      geodesic: true,
      map: this.map,
    });

    console.log('Nuevo polígono creado:', newPolygon);
    this.polygons.push(newPolygon);

    // Validar el área inicial
    if (!this.validateArea(newPolygon)) {
      console.log('Área no válida, limpiando dibujo');
      this.clearDrawing();
      return;
    }

    const path = newPolygon.getPath();
    console.log('Path del polígono:', path.getArray());
    const isLocationValid = this.locationService.validatePolygonLocation(
      newPolygon,
      this.map
    );
    console.log('¿Ubicación válida?', isLocationValid);

    if (isLocationValid) {
      const area = google.maps.geometry.spherical.computeArea(path);
      console.log('Área calculada:', area);
      this.areaSubject.next(area);

      // Listener para el evento set_at en el polígono (cuando se edita)
      const updatePolygonAfterEdit = () => {
        console.log('Polígono editado, actualizando...');
        const updatedArea =
          google.maps.geometry.spherical.computeArea(path);
        console.log('Nueva área después de edición:', updatedArea);
        if (this.validateArea(newPolygon)) {
          console.log('Área válida después de edición');
          newPolygon.setMap(this.map);
          this.polygons[0] = newPolygon;
          this.drawPanels(newPolygon);
          this.overlayCompleteSubject.next(true);
          this.disableDrawingMode();
          return;
        } else {
          console.log('Área no válida después de edición');
        }
      };

      google.maps.event.addListener(
        path,
        'set_at',
        updatePolygonAfterEdit
      );
      google.maps.event.addListener(
        path,
        'insert_at',
        updatePolygonAfterEdit
      );

      // Dibuja los paneles
      console.log('Dibujando paneles');
      this.drawPanels(newPolygon);
      this.overlayCompleteSubject.next(true);
      this.disableDrawingMode();
      // Obtener el centro del polígono para recentrar el mapa
      const bounds = new google.maps.LatLngBounds();
      path.forEach((latLng) => bounds.extend(latLng));
      const polygonCenter = bounds.getCenter();
      console.log('Centro del polígono:', polygonCenter.toString());

      this.map.panTo(polygonCenter);
      console.log('Mapa centrado en el polígono');
      return;
    } else {
      console.log('Ubicación no válida, mostrando mensaje de error');
      this.snackBar.open(
        'La ubicación seleccionada se encuentra fuera de la Provincia de San Juan, no se puede procesar.',
        '',
        {
          duration: 5000,
          panelClass: ['custom-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top',
        }
      );
      this.map.panTo(this.center);
      this.map.setZoom(13);
      this.clearDrawing();
      this.areaSubject.next(0);
      this.overlayCompleteSubject.next(false);
    }

    // Limpiar los vértices temporales
    this.drawingVertices = [];
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
          const panelRectangle = new google.maps.Rectangle({
            bounds: new google.maps.LatLngBounds(
              southWestCorner,
              northEastCorner
            ),
            fillColor: '#000000',
            fillOpacity: 0.7,
            strokeColor: '#FFFFFF',
            strokeWeight: 0.5,
            map: this.map,
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
          const panelRectangle = new google.maps.Rectangle({
            bounds: new google.maps.LatLngBounds(
              southWestCorner,
              northEastCorner
            ),
            fillColor: '#000000',
            fillOpacity: 0.7,
            strokeColor: '#FFFFFF',
            strokeWeight: 0.5,
            map: this.map,
          });

          this.panels.push(panelRectangle);
          totalPanels++;
        }
      }
    }
    this.sharedService.setPanelsCountSelected(totalPanels);
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
    this.clearDrawingState();
    this.disableDrawingMode();
    this.clearHeatmap();
    this.overlayCompleteSubject.next(false);
    this.areaSubject.next(0);
  }

  /**
   * Modifica la visibilidad de los paneles vectoriales dibujados en el mapa.
   */
  setPanelsVisibility(visible: boolean) {
    if (this.panels && this.panels.length > 0) {
      this.panels.forEach((panel) => {
        panel.setMap(visible ? this.map : null);
      });
    }
  }

  /**
   * Modifica la opacidad del relleno de los polígonos dibujados en el mapa.
   */
  setPolygonFillOpacity(opacity: number) {
    if (this.polygons && this.polygons.length > 0) {
      this.polygons.forEach((poly) => {
        poly.setOptions({ fillOpacity: opacity });
      });
    }
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

  /**
   * Limpia y remueve el GroundOverlay del mapa de calor solar, restaurando paneles y opacidad.
   */
  clearHeatmap() {
    if (this.heatMapOverlay) {
      this.heatMapOverlay.setMap(null);
      this.heatMapOverlay = null;
    }
    // Restaurar el estado visual original de los paneles y el polígono
    this.setPanelsVisibility(true);
    this.setPolygonFillOpacity(0.5);
  }

  /**
   * Descarga la capa de flujo solar anual (GeoTIFF), la parsea en el navegador con geotiff.js,
   * recorta los límites según el polígono del usuario y dibuja un GroundOverlay térmico.
   */
  async fetchAndRenderSolarHeatmap(annualFluxUrl: string, polygon: google.maps.Polygon) {
    if (!annualFluxUrl) {
      console.warn('[MapService] No se proporcionó annualFluxUrl.');
      return;
    }

    this.heatMapLoadingSubject.next(true);
    
    // Ocultar temporalmente los paneles y hacer transparente el polígono para que no tapen el mapa de calor
    if (this.heatMapOverlay) {
      this.heatMapOverlay.setMap(null);
      this.heatMapOverlay = null;
    }
    this.setPanelsVisibility(false);
    this.setPolygonFillOpacity(0);

    try {
      // 1. Descargar el archivo GeoTIFF
      // Las URLs de la API de Solar para geoTiff:get requieren la API Key de Google
      const apiKey = this.environmentService.getGoogleMapsApiKey();
      const urlWithKey = annualFluxUrl.includes('?') 
        ? `${annualFluxUrl}&key=${apiKey}` 
        : `${annualFluxUrl}?key=${apiKey}`;

      const response = await fetch(urlWithKey);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();

      // 2. Parsear el GeoTIFF
      const tiff = await fromArrayBuffer(arrayBuffer);
      const image = await tiff.getImage();
      const rasters = await image.readRasters();
      const values = rasters[0] as Float32Array;
      const width = image.getWidth();
      const height = image.getHeight();

      // Obtener el Bounding Box (límites geográficos del GeoTIFF en metros de proyección UTM)
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

      // 3. Crear canvas para dibujar los píxeles
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('No se pudo obtener el contexto 2D del canvas');
      }

      // 4. Aplicar clipping con la geometría del polígono del usuario
      ctx.beginPath();
      const path = polygon.getPath();
      path.forEach((latLng, idx) => {
        const lat = latLng.lat();
        const lng = latLng.lng();
        
        // Convertir coordenadas del polígono (grados Lat/Lng) a UTM (metros)
        const utmPoint = this.latLngToUtm(lat, lng);
        
        // Transformar coordenadas UTM a coordenadas de píxeles del canvas
        const x = ((utmPoint.easting - minX) / (maxX - minX)) * width;
        const y = ((maxY - utmPoint.northing) / (maxY - minY)) * height;
        
        if (idx === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();
      ctx.clip(); // Limitar todo el dibujo subsiguiente al contorno del techo

      // 5. Analizar si el GeoTIFF contiene datos de radiación válidos (distintos de -9999)
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

      if (validPixels > 0) {
        // A. Dibujar el mapa de calor real con los datos de Google
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
        
        // Para que se aplique el clipping path del canvas principal (ya que putImageData copia en bruto e ignora el clip),
        // volcamos los datos en un canvas temporal y luego dibujamos ese lienzo sobre el principal usando drawImage().
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
      } else {
        // B. Fallback: Generar un mapa de calor simulado con orientación Norte-Sur (óptimo para Hemisferio Sur)
        console.log('[MapService] Sin píxeles de radiación válidos en el GeoTIFF. Usando simulación térmica orientada al Norte.');
        
        // Creamos un gradiente lineal de arriba (Norte) a abajo (Sur) en el canvas
        const gradient = ctx.createLinearGradient(width / 2, 0, width / 2, height);
        // Paleta térmica premium:
        gradient.addColorStop(0.0, '#FFE500'); // Norte (Máximo sol - Amarillo brillante)
        gradient.addColorStop(0.4, '#FF7A00'); // Naranja solar
        gradient.addColorStop(0.7, '#E63900'); // Naranja rojizo
        gradient.addColorStop(1.0, '#300066'); // Sur (Sombra/Mayor inclinación - Violeta/Morado profundo)
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      // 6. Configurar y añadir el GroundOverlay al mapa
      const overlayBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(sw.lat, sw.lng),
        new google.maps.LatLng(ne.lat, ne.lng)
      );

      this.heatMapOverlay = new google.maps.GroundOverlay(
        canvas.toDataURL(),
        overlayBounds,
        {
          opacity: 0.65, // Suficiente opacidad para visualizar el calor pero traslúcido para ver el satélite
          map: this.map,
        }
      );

      console.log('[MapService] Mapa de calor solar renderizado correctamente.');
    } catch (error) {
      console.error('[MapService] Error al renderizar el mapa de calor solar:', error);
      this.snackBar.open(
        'No se pudo cargar el mapa de calor solar detallado para esta zona.',
        'Cerrar',
        { duration: 4000 }
      );
    } finally {
      this.heatMapLoadingSubject.next(false);
    }
  }

  getMap$() {
    this.mapSubject
  }
}
