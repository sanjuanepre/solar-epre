import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { MapService } from 'src/app/services/map.service';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-superficie',
  templateUrl: './superficie.component.html',
  styleUrls: ['./superficie.component.css']
})
export class SuperficieComponent implements OnInit, OnDestroy {
  selectedAreaM2!: number;
  areaPanelsSelected!: number;
  private subscriptions: Subscription = new Subscription(); 
  
  constructor(private mapService: MapService, private sharedService: SharedService, private cdr: ChangeDetectorRef) {
  }
  
  ngOnInit() {
    this.subscriptions.add(
      this.mapService.area$.subscribe({
        next: (value) => {
          this.selectedAreaM2 = value;
          this.cdr.detectChanges();
        }
      })
    );

    this.subscriptions.add(
      this.sharedService.areaPanelsSelected$.subscribe({
        next: (area) => {
          this.areaPanelsSelected = area;
          this.cdr.detectChanges();
        }
      })
    );
  }

  ngOnDestroy() {
    // Desuscribirse de todas las suscripciones
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }
}