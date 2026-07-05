import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { LocationService } from './location.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SharedService } from './shared.service';

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

  private overlayCompleteSubject = new Subject<boolean>();
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
    private sharedService: SharedService
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
  }

  clearDrawing() {
    this.clearPolygons();
    this.clearPanels();
    this.clearDrawingState();
    this.disableDrawingMode();
  }

  getMap$() {
    this.mapSubject
  }
}
