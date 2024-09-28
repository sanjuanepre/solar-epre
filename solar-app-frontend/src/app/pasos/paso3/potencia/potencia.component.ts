import { ChangeDetectorRef, Component, Input, OnInit, OnDestroy } from '@angular/core';
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
      console.log('Constructor de PotenciaComponent iniciado');
      this.panelCapacityW = this.sharedService.getPanelCapacityW();
      console.log('Capacidad inicial del panel:', this.panelCapacityW, 'W');
    } catch (error) {
      console.error('Error en el constructor de PotenciaComponent:', error);
    }
  }

  ngOnInit(): void {
    console.log('PotenciaComponent: Iniciando ngOnInit - Configurando suscripciones');

    try {
      this.sharedService.factorPotencia$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((newFactorPotencia: number) => {
        console.log('Nuevo valor de factorPotencia recibido:', newFactorPotencia);
        this.factorPotencia = newFactorPotencia;
      }); 
      // Suscripción para la potencia máxima asignada
      this.sharedService.potenciaMaxAsignadaW$
        .pipe(takeUntil(this.destroy$), distinctUntilChanged())
        .subscribe({
          next: (potenciaMaxW) => {
            console.log(`PotenciaComponent: Nueva potencia máxima asignada recibida: ${potenciaMaxW} W.`);

            // Validación: Verificar si potenciaMaxW es un número válido
            if (isNaN(potenciaMaxW) || potenciaMaxW <= 0) {
              console.warn('PotenciaComponent: potenciaMaxW no es válida:', potenciaMaxW);
              return;
            }

            this.potenciaMaxCategoriaSelectkW = potenciaMaxW / 1000;
            console.log(`Potencia máxima convertida a kW: ${this.potenciaMaxCategoriaSelectkW} kW.`);
            this.verificarYActualizarPaneles();
          },
          error: (err) => {
            console.error('Error al suscribirse a potenciaMaxAsignadaW$:', err);
          },
        });

      // Suscripción para el número de paneles seleccionados
      this.sharedService.panelsCountSelected$
        .pipe(takeUntil(this.destroy$), distinctUntilChanged())
        .subscribe({
          next: (value) => {
            console.log(`Nuevo número de paneles seleccionados recibido: ${value}`);

            // Validación: Verificar si el número de paneles seleccionados es válido
            if (isNaN(value) || value <= 0) {
              console.warn('Número de paneles seleccionados no es válido:', value);
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
        .pipe(takeUntil(this.destroy$), distinctUntilChanged())
        .subscribe({
          next: (value) => {
            console.log(`Nueva capacidad de panel recibida: ${value} W.`);

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

        this.instalacionPotenciakW = this.sharedService.getPanelCapacityW() * this.sharedService.getPanelsSelected() / 1000;
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error en ngOnInit de PotenciaComponent:', error);
    }

    console.log('PotenciaComponent: ngOnInit finalizado - Todas las suscripciones configuradas');
  }

  ngAfterViewInit(): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    this.instalacionPotenciakW = this.sharedService.getPanelCapacityW() * this.sharedService.getPanelsSelected() / 1000;
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    console.log('PotenciaComponent: ngOnDestroy ejecutado - Limpieza de suscripciones completada');
  }

  private updateInstalacionPotencia(): void {
    console.log('Iniciando actualización de la potencia de instalación');

    // Validación: Asegurarse de que tanto panelsCountSelected como panelCapacityW sean válidos
    if (!this.isValoresInicializados()) {
      console.warn('No se puede actualizar la potencia de instalación: valores no inicializados');
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
    console.log(
      `Potencia inicial calculada: ${potenciaKW} kW (${this.panelsCountSelected} paneles x ${this.panelCapacityW} W)`
    );
    return potenciaKW;
  }

  private ajustarPotencia(potenciaKW: number): number {
    if (potenciaKW > this.potenciaMaxCategoriaSelectkW) {
      console.log(
        `La potencia calculada (${potenciaKW} kW) excede el máximo permitido (${this.potenciaMaxCategoriaSelectkW} kW). Ajustando...`
      );
      return this.potenciaMaxCategoriaSelectkW;
    }
    return potenciaKW;
  }

  private actualizarSharedService(): void {
    const potenciaW = this.instalacionPotenciakW * 1000;
    this.sharedService.setPotenciaInstalacionW(potenciaW);
    console.log(`Potencia de instalación actualizada en SharedService: ${potenciaW} W`);
  }

  private actualizarVista(): void {
    this.cdr.detectChanges();
    console.log('Detección de cambios forzada para actualizar la vista');
  }

  private verificarYActualizarPaneles(): void {
    console.log('Iniciando verificación y actualización de paneles');

    // Validación: Asegurarse de que los valores necesarios estén inicializados
    if (!this.isValoresInicializados()) {
      console.warn('No se puede verificar los paneles: valores no inicializados');
      return;
    }

    const potenciaTotal = this.calcularPotenciaTotal();
    const potenciaMaximaPermitida = this.calcularPotenciaMaximaPermitida();

    if (this.excedePotenciaMaxima(potenciaTotal, potenciaMaximaPermitida)) {
      this.ajustarNumeroPaneles(potenciaMaximaPermitida);
      this.actualizarPanelesEnMapa();
    }

    this.updateInstalacionPotencia();
    console.log('Verificación y actualización de paneles completada');
  }

  private calcularPotenciaTotal(): number {
    const potenciaTotal = this.panelsCountSelected * this.panelCapacityW;
    console.log(`Potencia total actual: ${potenciaTotal} W (${this.panelsCountSelected} paneles x ${this.panelCapacityW} W)`);
    return potenciaTotal;
  }

  private calcularPotenciaMaximaPermitida(): number {
    return this.potenciaMaxCategoriaSelectkW * 1000;
  }

  private excedePotenciaMaxima(potenciaTotal: number, potenciaMaximaPermitida: number): boolean {
    const excede = potenciaTotal > potenciaMaximaPermitida;
    if (excede) {
      console.log(`La potencia total (${potenciaTotal} W) excede el máximo permitido (${potenciaMaximaPermitida} W).`);
    }
    return excede;
  }

  private ajustarNumeroPaneles(potenciaMaximaPermitida: number): void {
    const maxPanels = Math.round(potenciaMaximaPermitida / this.panelCapacityW);
    console.log(`Número máximo de paneles calculado: ${maxPanels}`);
    this.panelsCountSelected = maxPanels;
    this.sharedService.setPanelsCountSelected(this.panelsCountSelected);
    console.log(`Nuevo número de paneles establecido en SharedService: ${this.panelsCountSelected}`);
  }

  private actualizarPanelesEnMapa(): void {
    this.mapService.reDrawPanels(this.panelsCountSelected);
    console.log(`Solicitada redibujación de ${this.panelsCountSelected} paneles en el mapa`);
  }

  private isValoresInicializados(): boolean {
    return this.panelsCountSelected > 0 && this.panelCapacityW > 0 && this.potenciaMaxCategoriaSelectkW > 0;
  }
}
