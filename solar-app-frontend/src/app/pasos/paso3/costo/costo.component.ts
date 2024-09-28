import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { distinctUntilChanged, Subject, Subscription, takeUntil } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-costo',
  templateUrl: './costo.component.html',
  styleUrls: ['./costo.component.css'],
})
export class CostoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  costoInstalacionInitial: number = 0;
  costoInstalacionUsd: number = 0;
  yarlyEnergykWhInitial!: number;
  yearlyEnergykWh!: number;
  factorPotencia!: number;

  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('ngOnInit: Iniciando componente CostoComponent');
    this.sharedService.factorPotencia$
    .pipe(takeUntil(this.destroy$), distinctUntilChanged())
    .subscribe((newFactorPotencia: number) => {
      console.log(
        'Nuevo valor de factorPotencia recibido:',
        newFactorPotencia
      );
      this.factorPotencia = newFactorPotencia;
    });
    console.log('Suscribiéndose a costoInstalacion$');
    this.sharedService.costoInstalacion$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((newCostoInstalacion) => {
        console.log(
          'Nuevo valor de costoInstalacion recibido:',
          newCostoInstalacion
        );

        if (this.costoInstalacionInitial === 0) {
          console.log(
            'Estableciendo costoInstalacionInitial por primera vez:',
            newCostoInstalacion
          );
          this.costoInstalacionInitial = newCostoInstalacion;
        }

        console.log('Actualizando costoInstalacionUsd:', newCostoInstalacion);
        this.costoInstalacionUsd = newCostoInstalacion;

        console.log('Llamando a checkValuesAndUpdate()');
        
        // this.checkValuesAndUpdate();
      });

    console.log('Suscribiéndose a yearlyEnergyAckWh$');
    this.sharedService.yearlyEnergyAckWh$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((yearlyValue) => {
        console.log('Nuevo valor de yearlyEnergyAckWh recibido:', yearlyValue);

        if (this.yarlyEnergykWhInitial === 0) {
          console.log(
            'Estableciendo yarlyEnergykWhInitial por primera vez:',
            yearlyValue
          );
          this.yarlyEnergykWhInitial = yearlyValue ;
        }

        console.log('Actualizando yearlyEnergykWh:', yearlyValue);
        this.yearlyEnergykWh = yearlyValue;

        console.log('Llamando a checkValuesAndUpdate()');
        this.checkValuesAndUpdate();
      });

    this.cdr.detectChanges();
    console.log('ngOnInit completado');
  }

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit: Iniciando');
    console.log('yarlyEnergykWhInitial inicial:', this.yarlyEnergykWhInitial);
    console.log(
      'costoInstalacionInitial inicial:',
      this.costoInstalacionInitial
    );

    if (!this.yarlyEnergykWhInitial) {
      this.yarlyEnergykWhInitial = this.sharedService.getYearlyEnergyAckWh();
      console.log(
        'yarlyEnergykWhInitial actualizado:',
        this.yarlyEnergykWhInitial
      );
    }
    if (!this.costoInstalacionInitial) {
      this.costoInstalacionInitial = this.sharedService.getAhorroAnualUsd();
      console.log(
        'costoInstalacionInitial actualizado:',
        this.costoInstalacionInitial
      );
    }

    console.log('ngAfterViewInit: Finalizado');
  }

  ngOnDestroy(): void {
    console.log('ngOnDestroy: Iniciando destrucción del componente');
    this.destroy$.next();
    this.destroy$.complete();
    console.log('ngOnDestroy: Componente destruido');
  }

  private checkValuesAndUpdate(): void {
    console.log('checkValuesAndUpdate: Iniciando');
    console.log('yarlyEnergykWhInitial:', this.yarlyEnergykWhInitial);
    console.log('costoInstalacionInitial:', this.costoInstalacionInitial);

    if (this.yarlyEnergykWhInitial > 0 && this.costoInstalacionInitial > 0) {
      console.log('Condiciones cumplidas, llamando a updateCostoInstalacion');
      this.updateCostoInstalacion();
    } else {
      console.log(
        'No se cumplen las condiciones para actualizar el costo de instalación'
      );
    }

    console.log('checkValuesAndUpdate: Finalizado');
  }

  private updateCostoInstalacion() {
    console.log('Iniciando updateCostoInstalacion');
    console.log('yarlyEnergykWhInitial:', this.yarlyEnergykWhInitial);
    console.log('costoInstalacionInitial:', this.costoInstalacionInitial);

    if (this.yarlyEnergykWhInitial > 0 && this.costoInstalacionInitial > 0) {
      console.log('Condiciones iniciales cumplidas');

      const costoUsdWp = this.sharedService.getCostoUsdWp();
      console.log('costoUsdWp:', costoUsdWp);

      const panelCapacityW = this.sharedService.getPanelCapacityW();
      const panelsSelected = this.sharedService.getPanelsSelected();
      console.log('panelCapacityW:', panelCapacityW);
      console.log('panelsSelected:', panelsSelected);

      const instalacionPotenciaW = panelCapacityW * panelsSelected;
      console.log('instalacionPotenciaW:', instalacionPotenciaW);

      const costoEquipoDeMedicionUsd =
        this.sharedService.getCostoEquipoDeMedicion();
      console.log('costoEquipoDeMedicionUsd:', costoEquipoDeMedicionUsd);

      this.costoInstalacionUsd =
        instalacionPotenciaW * costoUsdWp + costoEquipoDeMedicionUsd;
      console.log('costoInstalacionUsd calculado:', this.costoInstalacionUsd);

      const costoInstalacionActual = this.sharedService.getCostoInstalacion();
      console.log('costoInstalacionActual:', costoInstalacionActual);

      if (this.costoInstalacionUsd !== costoInstalacionActual) {
        console.log('Actualizando costo de instalación en sharedService');
        this.sharedService.setCostoInstalacion(this.costoInstalacionUsd);
      } else {
        console.log('El costo de instalación no ha cambiado');
      }
    } else {
      console.error(
        'Error: No se pudo actualizar el costo de instalación. Valores indefinidos.'
      );
      console.log('yarlyEnergykWhInitial:', this.yarlyEnergykWhInitial);
      console.log('costoInstalacionInitial:', this.costoInstalacionInitial);
    }

    console.log('Finalizando updateCostoInstalacion');
  }
}
