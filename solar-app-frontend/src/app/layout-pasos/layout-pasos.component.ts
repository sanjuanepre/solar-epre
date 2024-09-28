import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { MapService } from '../services/map.service';
import { SharedService } from '../services/shared.service';

@Component({
  selector: 'app-layout-pasos',
  templateUrl: './layout-pasos.component.html',
  styleUrls: ['./layout-pasos.component.css'],
  animations: [
    trigger('menuCollapsed', [
      state('expand', style({ width: '0', visibility: 'hidden' })),
      state('collapsed', style({ width: '100%', visibility: 'visible' })),
      transition('expand <=> collapsed', animate('200ms')),
    ]),
  ],
})
export class LayoutPasosComponent implements OnInit, AfterViewInit {
  currentStep: number = 0;
  isPaso3: boolean = false;
  isCollapsed = false;
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private mapService: MapService,
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {
    this.sharedService.isLoading$.subscribe({
      next: (value) => {
        if (this.isLoading && !value) {
          this.expandComponent();
        }
        this.isLoading = value;
      },
    });
    this.sharedService.setTutorialShown(false);
  }

  ngOnInit(): void {
    // this.cdr.detectChanges();
  }

  ngAfterViewInit(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const url = this.router.url;
        const lastSegment = url.split('/').pop();
        this.currentStep = Number.parseInt(lastSegment ?? '0', 10);
        this.isPaso3 = this.currentStep === 3;

        this.isCollapsed = false;
        if (this.isPaso3) {
          this.isCollapsed = true;
        }
        this.cdr.detectChanges();
      });
  }

  toggleCollapse() {
    // Permitir colapsar y expandir cualquier paso
    this.isCollapsed = !this.isCollapsed;
    // this.cdr.detectChanges();
    if (this.mapService.getPolygons().length > 0) {
      setTimeout(() => {
        this.mapService.recenterMapToVisibleArea();
      }, 300);
    }
  }

  expandComponent() {
    this.isCollapsed = false;
    this.cdr.detectChanges();
  }
}
