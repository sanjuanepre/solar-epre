import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, NgZone } from '@angular/core';
import { MapService, TerraDrawActiveMode } from '../services/map.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.css'],
})
export class MapaComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapElement') mapElement!: ElementRef<HTMLDivElement>;
  @ViewChild('rippleLayer') rippleLayer!: ElementRef<HTMLDivElement>;

  private activeMode: TerraDrawActiveMode = 'static';
  private drawingVertexCount: number = 0;
  private isQuickRoofActive: boolean = false;
  private lastTapTime: number = 0;
  private lastTapPos: { x: number; y: number } = { x: 0, y: 0 };
  private destroy$ = new Subject<void>();

  constructor(
    private mapService: MapService,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.mapService.activeMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((mode) => {
        this.activeMode = mode;
      });

    this.mapService.drawingVertexCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count) => {
        this.drawingVertexCount = count;
      });

    this.mapService.isQuickRoofActive$
      .pipe(takeUntil(this.destroy$))
      .subscribe((active) => {
        this.isQuickRoofActive = active;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async ngAfterViewInit(): Promise<void> {
    try {
      await this.mapService.initializeMap(this.mapElement.nativeElement);
      this.setupTouchRippleListeners();
    } catch (error) {
      console.error('Error initializing the map:', error);
    }
  }

  private setupTouchRippleListeners(): void {
    const el = this.mapElement?.nativeElement;
    if (!el) return;

    // Ejecutar fuera de Angular para máximo rendimiento de 60fps sin sobrecargar ChangeDetection
    this.zone.runOutsideAngular(() => {
      const handlePointer = (e: PointerEvent) => {
        // Disparar destello si el usuario está en modo de dibujo, edición o esperando ubicar el techo 1-tap
        if (
          this.activeMode === 'polygon' ||
          this.activeMode === 'rectangle' ||
          this.activeMode === 'select' ||
          this.isQuickRoofActive
        ) {
          this.triggerRipple(e.clientX, e.clientY);
        }
        this.checkDoubleTap(e.clientX, e.clientY);
      };

      el.addEventListener('pointerdown', handlePointer, { passive: true });
    });
  }

  private triggerRipple(clientX: number, clientY: number): void {
    if (!this.rippleLayer?.nativeElement || !this.mapElement?.nativeElement) return;
    const rect = this.mapElement.nativeElement.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const ripple = document.createElement('div');
    ripple.className = 'touch-ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    this.rippleLayer.nativeElement.appendChild(ripple);
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 450);
  }

  private checkDoubleTap(clientX: number, clientY: number): void {
    const now = Date.now();
    const delta = now - this.lastTapTime;
    const dist = Math.hypot(clientX - this.lastTapPos.x, clientY - this.lastTapPos.y);

    if (delta > 40 && delta < 350 && dist < 35) {
      // Doble toque detectado: si está en polígono con 3 o más vértices, cerrar
      if (this.activeMode === 'polygon' && this.drawingVertexCount >= 3) {
        this.zone.run(() => {
          this.mapService.closeCurrentPolygon();
        });
      }
    }

    this.lastTapTime = now;
    this.lastTapPos = { x: clientX, y: clientY };
  }
}
