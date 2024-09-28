import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { distinctUntilChanged, Subject, Subscription, takeUntil } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-emisiones',
  templateUrl: './emisiones.component.html',
  styleUrls: ['./emisiones.component.css'],
})
export class EmisionesComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input()
  carbonOffsetFactorTnPerMWh!: number;
  yearlyEnergyAcKwh: number = 0;
  carbonOffset: number = 0;
  private subscription!: Subscription;
  factorPotencia: number = 1;
  private destroy$ = new Subject<void>();

  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {
    console.log('EmisionesComponent: Constructor iniciado');
  }

  ngOnInit(): void {
    console.log('EmisionesComponent: ngOnInit');
    console.log('carbonOffsetFactorTnPerMWh:', this.carbonOffsetFactorTnPerMWh);
    
    this.sharedService.factorPotencia$
    .pipe(takeUntil(this.destroy$), distinctUntilChanged())
    .subscribe((newFactorPotencia: number) => {
      console.log('Nuevo valor de factorPotencia recibido:', newFactorPotencia);
      this.factorPotencia = newFactorPotencia;
    });
  }

  ngAfterViewInit(): void {
    console.log('EmisionesComponent: ngAfterViewInit');
    this.subscription = this.sharedService.yearlyEnergyAckWh$.subscribe(
      (value) => {
        console.log('Nuevo valor de yearlyEnergyAcKwh recibido:', value);
        this.yearlyEnergyAcKwh = value;
        this.calculateCarbonOffset();
        this.cdr.detectChanges(); 
      }
    );
  }

  calculateCarbonOffset(): void {
    console.log('Calculando carbonOffset...');
    console.log('yearlyEnergyAcKwh:', this.yearlyEnergyAcKwh);
    console.log('carbonOffsetFactorTnPerMWh:', this.carbonOffsetFactorTnPerMWh);
    const result = this.yearlyEnergyAcKwh * this.carbonOffsetFactorTnPerMWh / 1000;
    this.carbonOffset = parseFloat(result.toFixed(2));
    console.log('Nuevo carbonOffset calculado:', this.carbonOffset);
    this.sharedService.setCarbonOffSetTnAnual(this.carbonOffset);
  }

  ngOnDestroy(): void {
    console.log('EmisionesComponent: ngOnDestroy');
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
