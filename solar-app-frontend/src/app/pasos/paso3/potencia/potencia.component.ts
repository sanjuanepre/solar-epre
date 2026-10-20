import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { MapService } from 'src/app/services/map.service';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-potencia',
  templateUrl: './potencia.component.html',
  styleUrls: ['./potencia.component.css'],
})
export class PotenciaComponent implements OnInit, OnDestroy {
  instalacionPotenciakW!: number;

  panelsCountSelected!: number;
  panelCapacityW!: number;
  potenciaMaxCategoriaSelectkW!: number;
  factorPotencia: number = 1;
  private destroy$ = new Subject<void>();

  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef,
    private mapService: MapService
  ) {
    try {
this.panelCapacityW = this.sharedService.getPanelCapacityW();
} catch (error) {
      console.error('Error en el constructor de PotenciaComponent:', error);
    }
  }

  ngOnInit(): void {
try {
      this.sharedService.factorPotencia$
        .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
        .subscribe((newFactorPotencia: number) => {
this.factorPotencia = newFactorPotencia;
        });
      // Suscripción para la potencia máxima asignada
      this.sharedService.potenciaMaxAsignadaW$
        .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
        .subscribe({
          next: (potenciaMaxW) => {
// Validación: Verificar si potenciaMaxW es un número válido
            if (isNaN(potenciaMaxW) || potenciaMaxW <= 0) {
              console.warn(
                'PotenciaComponent: potenciaMaxW no es válida:',
                potenciaMaxW
              );
              return;
            }

            this.potenciaMaxCategoriaSelectkW = potenciaMaxW / 1000;
this.verificarYActualizarPaneles();
          },
          error: (err) => {
            console.error('Error al suscribirse a potenciaMaxAsignadaW$:', err);
          },
        });

      // Suscripción para el número de paneles seleccionados
      this.sharedService.panelsCountSelected$
        .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
        .subscribe({
          next: (value) => {
// Validación: Verificar si el número de paneles seleccionados es válido
            if (isNaN(value) || value <= 0) {
              console.warn(
                'Número de paneles seleccionados no es válido:',
                value
              );
              return;
            }

            this.panelsCountSelected = value;
            this.updateInstalacionPotencia();
          },
          error: (err) => {
            console.error('Error al suscribirse a panelsCountSelected$:', err);
          },
        });

      // Suscripción para la capacidad de un panel en W
      this.sharedService.panelCapacityW$
        .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
        .subscribe({
          next: (value) => {
// Validación: Verificar si la capacidad del panel es válida
            if (isNaN(value) || value <= 0) {
              console.warn('Capacidad del panel no es válida:', value);
              return;
            }

            this.panelCapacityW = value;
            this.verificarYActualizarPaneles();
          },
          error: (err) => {
            console.error('Error al suscribirse a panelCapacityW$:', err);
          },
        });

      this.instalacionPotenciakW =
        (this.sharedService.getPanelCapacityW() *
          this.sharedService.getPanelsSelected()) /
        1000;
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error en ngOnInit de PotenciaComponent:', error);
    }

}

  ngAfterViewInit(): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    this.instalacionPotenciakW =
      (this.sharedService.getPanelCapacityW() *
        this.sharedService.getPanelsSelected()) /
      1000;
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
}

  private updateInstalacionPotencia(): void {
// Validación: Asegurarse de que tanto panelsCountSelected como panelCapacityW sean válidos
    if (!this.isValoresInicializados()) {
      console.warn(
        'No se puede actualizar la potencia de instalación: valores no inicializados'
      );
      return;
    }

    const potenciaCalculadaKW = this.calcularPotencia();
    this.instalacionPotenciakW = this.ajustarPotencia(potenciaCalculadaKW);

    this.actualizarSharedService();
    this.actualizarVista();
    this.cdr.detectChanges();
  }

  private calcularPotencia(): number {
    const potenciaKW = (this.panelsCountSelected * this.panelCapacityW) / 1000;
return potenciaKW;
  }

  private ajustarPotencia(potenciaKW: number): number {
    if (potenciaKW > this.potenciaMaxCategoriaSelectkW) {
return this.potenciaMaxCategoriaSelectkW;
    }
    return potenciaKW;
  }

  private actualizarSharedService(): void {
    const potenciaW = this.instalacionPotenciakW * 1000;
    this.sharedService.setPotenciaInstalacionW(potenciaW);
}

  private actualizarVista(): void {
    this.cdr.detectChanges();
}

  private verificarYActualizarPaneles(): void {
// Validación: Asegurarse de que los valores necesarios estén inicializados
    if (!this.isValoresInicializados()) {
      console.warn(
        'No se puede verificar los paneles: valores no inicializados'
      );
      return;
    }

    const potenciaTotal = this.calcularPotenciaTotal();
    const potenciaMaximaPermitida = this.calcularPotenciaMaximaPermitida();

    if (this.excedePotenciaMaxima(potenciaTotal, potenciaMaximaPermitida)) {
      this.ajustarNumeroPaneles(potenciaMaximaPermitida);
      this.actualizarPanelesEnMapa();
    }

    this.updateInstalacionPotencia();
}

  private calcularPotenciaTotal(): number {
    const potenciaTotal = this.panelsCountSelected * this.panelCapacityW;
return potenciaTotal;
  }

  private calcularPotenciaMaximaPermitida(): number {
    return this.potenciaMaxCategoriaSelectkW * 1000;
  }

  private excedePotenciaMaxima(
    potenciaTotal: number,
    potenciaMaximaPermitida: number
  ): boolean {
    const excede = potenciaTotal > potenciaMaximaPermitida;
    if (excede) {
}
    return excede;
  }

  private ajustarNumeroPaneles(potenciaMaximaPermitida: number): void {
    const maxPanels = Math.floor(potenciaMaximaPermitida / this.panelCapacityW);
this.panelsCountSelected = maxPanels;
    this.sharedService.setPanelsCountSelected(this.panelsCountSelected);
}

  private actualizarPanelesEnMapa(): void {
    this.mapService.reDrawPanels(this.panelsCountSelected);
}

  private isValoresInicializados(): boolean {
    return (
      this.panelsCountSelected > 0 &&
      this.panelCapacityW > 0 &&
      this.potenciaMaxCategoriaSelectkW > 0
    );
  }
}
