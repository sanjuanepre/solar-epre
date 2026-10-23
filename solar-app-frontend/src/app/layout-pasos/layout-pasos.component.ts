import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { PlatformLocation } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  NgZone,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { MapService, TerraDrawActiveMode } from '../services/map.service';
import { SharedService } from '../services/shared.service';

@Component({
  selector: 'app-layout-pasos',
  templateUrl: './layout-pasos.component.html',
  styleUrls: ['./layout-pasos.component.css'],
  animations: [
    trigger('menuCollapsed', [
      state('expand', style({ width: '0', height: '100%', visibility: 'hidden' })),
      state('collapsed', style({ width: '100%', height: '100%', visibility: 'visible' })),
      transition('expand <=> collapsed', animate('200ms')),
    ]),
  ],
})
export class LayoutPasosComponent implements OnInit, AfterViewInit, OnDestroy {
  currentStep: number = 0;
  isPaso3: boolean = false;
  isCollapsed = false;
  isLoading: boolean = false;
  isMobile: boolean = false;

  // Estado reactivo HUD Toolbar sobre el Mapa
  activeMode: TerraDrawActiveMode = 'polygon';
  drawingVertexCount: number = 0;
  isQuickRoofActive: boolean = false;
  realtimeAreaM2: number = 0;
  estimatedPanelsCount: number = 0;
  canUndo: boolean = false;
  canRedo: boolean = false;
  isHeatmapLoading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private mapService: MapService,
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private platformLocation: PlatformLocation
  ) {
    this.checkIsMobile();
    this.sharedService.isLoading$.subscribe({
      next: (value) => {
        if (this.isLoading && !value) {
          this.expandComponent();
        }
        this.isLoading = value;
      },
    });
    this.sharedService.sidebarCollapsed$.subscribe({
      next: (collapsed) => {
        this.isCollapsed = collapsed;
        this.cdr.detectChanges();
      },
    });
    this.sharedService.setTutorialShown(false);
  }

  ngOnInit(): void {
    this.checkIsMobile();
    this.updateCurrentStepFromUrl();
    this.isCollapsed = this.sharedService.getSidebarCollapsed();

    this.platformLocation.onPopState((event) => {
      this.handlePopState(event);
    });

    window.addEventListener('resize', () => {
      this.checkIsMobile();
      this.cdr.detectChanges();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const map = this.mapService.getMap();
        if (map && (window as any).google?.maps?.event) {
          (window as any).google.maps.event.trigger(map, 'resize');
          setTimeout(() => {
            this.mapService.recenterMapToVisibleArea();
          }, 200);
        }
      }
    });

    // Subscripciones para la barra de herramientas HUD sobre el Mapa
    this.mapService.activeMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((mode) => {
        this.activeMode = mode;
        this.cdr.detectChanges();
      });

    this.mapService.realtimeAreaM2$
      .pipe(takeUntil(this.destroy$))
      .subscribe((area) => {
        this.realtimeAreaM2 = area;
        this.cdr.detectChanges();
      });

    this.mapService.estimatedPanelsCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count) => {
        this.estimatedPanelsCount = count;
        this.cdr.detectChanges();
      });

    this.mapService.canUndo$
      .pipe(takeUntil(this.destroy$))
      .subscribe((can) => {
        this.canUndo = can;
        this.cdr.detectChanges();
      });

    this.mapService.canRedo$
      .pipe(takeUntil(this.destroy$))
      .subscribe((can) => {
        this.canRedo = can;
        this.cdr.detectChanges();
      });

    this.mapService.drawingVertexCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count) => {
        this.drawingVertexCount = count;
        this.cdr.detectChanges();
      });

    this.mapService.isQuickRoofActive$
      .pipe(takeUntil(this.destroy$))
      .subscribe((active) => {
        this.isQuickRoofActive = active;
        this.cdr.detectChanges();
      });

    this.mapService.heatMapLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading) => {
        this.isHeatmapLoading = loading;
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkIsMobile(): void {
    this.isMobile = window.innerWidth < 768;
  }

  private updateCurrentStepFromUrl(resetCollapsed: boolean = false): void {
    const url = this.router.url;
    const lastSegment = url.split('?')[0].split('/').pop();
    this.currentStep = Number.parseInt(lastSegment ?? '0', 10);
    this.isPaso3 = this.currentStep === 3;

    if (resetCollapsed) {
      this.isCollapsed = false;
      if (this.isPaso3) {
        this.isCollapsed = true;
      }
      this.sharedService.setSidebarCollapsed(this.isCollapsed);
    }
  }

  ngAfterViewInit(): void {
    this.updateCurrentStepFromUrl(false);
    this.pushHistorySentinel();
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateCurrentStepFromUrl(true);
        this.pushHistorySentinel();
        if (typeof window !== 'undefined') {
          window.scrollTo({ left: 0, top: 0, behavior: 'instant' as any });
          if (document.documentElement) document.documentElement.scrollLeft = 0;
          if (document.body) document.body.scrollLeft = 0;
          const containers = document.querySelectorAll(
            '.contenido-general, .content-total, .paso, .paso-router-outlet-wrapper, .content, .info-container, .informacion'
          );
          containers.forEach((el) => {
            if (el) (el as HTMLElement).scrollLeft = 0;
          });
        }
        this.cdr.detectChanges();
      });
  }

  private pushHistorySentinel(): void {
    if (typeof window !== 'undefined' && window.history) {
      const currentState = window.history.state;
      if (!currentState || currentState.solarStepSentinel !== this.currentStep) {
        window.history.pushState(
          { solarStepSentinel: this.currentStep },
          '',
          window.location.href
        );
      }
    }
  }

  private handlePopState(event: any): void {
    // Interceptar la navegación hacia atrás generada por gestos nativos o botón Atrás del celular
    if (this.currentStep === 3) {
      this.zone.run(() => {
        this.sharedService.setTutorialShown(true);
        this.router.navigate(['/pasos/2']);
      });
      return;
    }

    if (this.currentStep === 2) {
      this.zone.run(() => {
        this.sharedService.setTutorialShown(true);
        this.router.navigate(['/pasos/1']);
      });
      return;
    }

    if (this.currentStep === 1) {
      // Si en móvil el panel estaba colapsado viendo el mapa en pantalla completa,
      // el gesto de atrás vuelve a abrir el panel lateral con los datos antes de salir
      if (this.isMobile && this.isCollapsed) {
        this.zone.run(() => {
          this.expandComponent();
          this.pushHistorySentinel();
        });
        return;
      }
      this.zone.run(() => {
        this.sharedService.setTutorialShown(true);
        this.router.navigate(['/pasos/0']);
      });
      return;
    }

    if (this.currentStep === 0) {
      this.zone.run(() => {
        this.router.navigate(['/']);
      });
      return;
    }
  }

  toggleCollapse() {
    // Permitir colapsar y expandir cualquier paso
    this.isCollapsed = !this.isCollapsed;
    this.sharedService.setSidebarCollapsed(this.isCollapsed);
    if (this.mapService.getPolygons().length > 0) {
      setTimeout(() => {
        this.mapService.recenterMapToVisibleArea();
      }, 300);
    }
  }

  expandComponent() {
    this.isCollapsed = false;
    this.sharedService.setSidebarCollapsed(this.isCollapsed);
    this.cdr.detectChanges();
    // Recentrar tras la animación de apertura del panel (transition: 350ms)
    if (this.mapService.getPolygons().length > 0) {
      setTimeout(() => {
        this.mapService.recenterMapToVisibleArea();
      }, 380);
    }
  }

  // Métodos de interacción HUD Toolbar sobre el Mapa
  setTerraDrawMode(mode: TerraDrawActiveMode) {
    this.mapService.setTerraDrawMode(mode);
  }

  rotatePolygon(angleDegrees: number) {
    if (this.isHeatmapLoading) return;
    this.mapService.rotatePolygon(angleDegrees);
  }

  undoTerraDraw() {
    this.mapService.undoTerraDraw();
  }

  redoTerraDraw() {
    this.mapService.redoTerraDraw();
  }

  clearDrawing() {
    this.mapService.clearDrawing();
  }

  closePolygon() {
    this.mapService.closeCurrentPolygon();
  }

  createQuickRoof() {
    this.mapService.createQuickRoof();
  }

  cancelQuickRoof(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.mapService.cancelQuickRoofMode();
  }

  onHudToolbarWheel(event: WheelEvent) {
    const target = event.currentTarget as HTMLElement;
    if (target && (event.deltaY !== 0 || event.deltaX !== 0)) {
      event.preventDefault();
      target.scrollLeft += event.deltaY !== 0 ? event.deltaY : event.deltaX;
    }
  }
}
