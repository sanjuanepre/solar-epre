import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { distinctUntilChanged, Subject, Subscription, takeUntil } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-costo',
  templateUrl: './costo.component.html',
  styleUrls: ['./costo.component.css'],
})
export class CostoComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();

  costoInstalacionInitial: number = 0;
  costoInstalacionUsd: number = 0;
  yarlyEnergykWhInitial!: number;
  yearlyEnergykWh!: number;
  factorPotencia!: number;
  tipoEstructura: 'coplanar' | 'optimo' = 'coplanar';

  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
this.sharedService.tipoEstructura$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((tipo) => {
        this.tipoEstructura = tipo || 'coplanar';
        this.cdr.detectChanges();
      });
    this.sharedService.factorPotencia$
    .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
    .subscribe((newFactorPotencia: number) => {
this.factorPotencia = newFactorPotencia;
    });
this.sharedService.costoInstalacion$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((newCostoInstalacion) => {
if (this.costoInstalacionInitial === 0) {
this.costoInstalacionInitial = newCostoInstalacion;
        }

this.costoInstalacionUsd = newCostoInstalacion;

// this.checkValuesAndUpdate();
      });

this.sharedService.yearlyEnergyAckWh$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((yearlyValue) => {
if (this.yarlyEnergykWhInitial === 0) {
this.yarlyEnergykWhInitial = yearlyValue ;
        }

this.yearlyEnergykWh = yearlyValue;

this.checkValuesAndUpdate();
      });

    this.cdr.detectChanges();
}

  ngAfterViewInit(): void {
if (!this.yarlyEnergykWhInitial) {
      this.yarlyEnergykWhInitial = this.sharedService.getYearlyEnergyAckWh();
}
    if (!this.costoInstalacionInitial) {
      this.costoInstalacionInitial = this.sharedService.getAhorroAnualUsd();
}

}

  ngOnDestroy(): void {
this.destroy$.next();
    this.destroy$.complete();
}

  private checkValuesAndUpdate(): void {
if (this.yarlyEnergykWhInitial > 0 && this.costoInstalacionInitial > 0) {
this.updateCostoInstalacion();
    } else {
}

}

  private updateCostoInstalacion() {
if (this.yarlyEnergykWhInitial > 0 && this.costoInstalacionInitial > 0) {
const costoUsdWp = this.sharedService.getCostoUsdWp();
const panelCapacityW = this.sharedService.getPanelCapacityW();
      const panelsSelected = this.sharedService.getPanelsSelected();

      const instalacionPotenciaW = panelCapacityW * panelsSelected;
const costoEquipoDeMedicionUsd =
        this.sharedService.getCostoEquipoDeMedicion();
this.costoInstalacionUsd =
        instalacionPotenciaW * costoUsdWp + costoEquipoDeMedicionUsd;
const costoInstalacionActual = this.sharedService.getCostoInstalacion();
if (this.costoInstalacionUsd !== costoInstalacionActual) {
this.sharedService.setCostoInstalacion(this.costoInstalacionUsd);
      } else {
}
    } else {
      console.error(
        'Error: No se pudo actualizar el costo de instalación. Valores indefinidos.'
      );
    }

}
}
