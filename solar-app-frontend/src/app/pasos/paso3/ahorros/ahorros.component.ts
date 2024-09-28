import {
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import { combineLatest, Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-ahorros',
  templateUrl: './ahorros.component.html',
  styleUrls: ['./ahorros.component.css'],
})
export class AhorrosComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ahorrosUsdInitial: number = 0;
  ahorrosUsd: number = 0;
  yearlyAnualInitial: number = 0;
  yearlyAnualkW!: number;
  factorPotencia: number = 1;

  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('ngOnInit: Iniciando componente AhorrosComponent');
    this.sharedService.factorPotencia$
    .pipe(takeUntil(this.destroy$), distinctUntilChanged())
    .subscribe((newFactorPotencia: number) => {
      console.log('Nuevo valor de factorPotencia recibido:', newFactorPotencia);
      this.factorPotencia = newFactorPotencia;
    });
    this.sharedService.ahorroAnualUsd$
      .pipe(takeUntil(this.destroy$))
      .subscribe((ahorro) => {
        this.ahorrosUsd = ahorro;
      });
      this.cdr.detectChanges()
      
  }

  ngAfterViewInit(): void {
   
  }

  ngOnDestroy(): void {
     console.log('ngOnDestroy: Destruyendo componente y limpiando suscripciones.');
    this.destroy$.next();
    this.destroy$.complete();
  }

}
