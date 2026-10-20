import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { GmailService } from 'src/app/services/gmail.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SolarApiService } from 'src/app/services/solar-api.service';
import { SharedService } from 'src/app/services/shared.service';
import { ResultadosFrontDTO } from '../../interfaces/resultados-front-dto';
import { DimensionPanel } from 'src/app/interfaces/dimension-panel';
import { MapService } from 'src/app/services/map.service';
import { ConsumoTarifaService } from 'src/app/services/consumo-tarifa.service';
import { ConsumoService } from 'src/app/services/consumo.service';
import { Paso2Component } from '../paso2/paso2.component';
import { PdfService } from 'src/app/services/pdf.service';
import { ParametrosFront } from 'src/app/interfaces/parametros-front';
import { distinctUntilChanged, Subject, takeUntil, Subscription } from 'rxjs';
import { EmisionesGeiEvitadasFront } from 'src/app/interfaces/emisiones-gei-evitadas-front';
import { GraficosComponent } from './graficos/graficos.component';

@Component({
  selector: 'app-paso3',
  templateUrl: './paso3.component.html',
  styleUrls: ['./paso3.component.css'],
})
export class Paso3Component implements OnInit, OnDestroy {
  @ViewChild(GraficosComponent) graficosComponent?: GraficosComponent;
  isModalOpen = false;
  isCalculating = false;
  email: string = '';
  costoInstalacion!: number;
  private destroy$ = new Subject<void>();
  timestamp: string = '';
  potenciaPanelHip!: number;
  eficienciaInstalacion!: number;
  degradacionAnualPanel!: number;
  proporcionInyectada!: number;
  costoEquipoMedicion!: number;
  costoMantenimiento!: number;
  tasaInflacionUsd!: number;
  fechaActual!: string;
  fechaMesAnio!: string;
  categoriaTarifa!: string;
  tipoEstructura: 'coplanar' | 'optimo' = 'coplanar';
  roofFactor: number = 1.0;
  items: any[] = [];
  currentStep: number = 3;
  mostrarModal: boolean = false;
  private resultadosFront!: ResultadosFrontDTO;
  panelesCantidad: number = 0;
  dimensionPanel: DimensionPanel = { height: 0, width: 0 };
  panelCapacityW: number = 0;
  carbonOffsetFactorTnPerMWh: number = 0;
  map: any;
  maxPanelsCount!: number;
  private polygons!: any[];
  isLoading!: boolean;
  instalacionPotencia: number = 0;
  yearlyEnergyAckWhDefault: number = 0;
  yearlyEnergyInitial!: number;
  proporcionAutoconsumo: number = 0;
  consumoTotalAnual: number = 0;
  paso2!: Paso2Component;
  isDownloading: boolean = false;
  periodoVeinteanalCasoConCapitalPropioInitial!: any[];
  potenciaContratadaHip!: number;
  isSendingMail: boolean = false;
  potenciaMaxAsignadaW!: number;
  potenciaInstalacionW!: number;
  isCategoriaTarifaT1: boolean = false;
  periodoVeinteanalEmisionesGEIEvitadasOriginal: EmisionesGeiEvitadasFront[] = [];
  isScrolledDown: boolean = false;
  showPanels: boolean = true;

  onScrollInformacion(event: Event) {
    const target = event.target as HTMLElement;
    if (target) {
      const scrolled = target.scrollTop > 70;
      if (this.isScrolledDown !== scrolled) {
        this.isScrolledDown = scrolled;
        this.cdr.detectChanges();
      }
    }
  }
  constructor(
    private router: Router,
    private readonly gmailService: GmailService,
    private snackBar: MatSnackBar,
    private solarService: SolarApiService,
    private sharedService: SharedService,
    private mapService: MapService,
    private consumoTarifaService: ConsumoTarifaService,
    private consumoService: ConsumoService,
    private pdfService: PdfService,
    private cdr: ChangeDetectorRef
  ) {
this.actualizarFecha();
}

  ngOnInit(): void {
this.showPanels = !this.mapService.isHeatmapActive();
    this.sharedService.isLoading$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe({
        next: (value) => {
this.isLoading = value;
        },
      });
    this.subscribeToSharedServiceData();
this.sharedService.setIsLoading(true);
this.cdr.detectChanges();
    setTimeout(() => {
this.mapService.recenterMapToVisibleArea();
    }, 300);

    this.setTimestamp();
    this.solarService
      .calculate()
      .then((resultados) => {
this.resultadosFront = resultados;
      })
      .then(() => {
this.initialLoadFields();
        this.cdr.detectChanges();
      })
      .then(() => {
this.sharedService.setIsLoading(false);
        this.cdr.detectChanges();
      })
      .catch((error) => {
        console.error('Error al calcular resultados solares:', error);
        this.sharedService.setIsLoading(false);
        this.sharedService.resetAll();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initialLoadFields(): void {
    try {
      this.initializeGeneralData();
      this.initializePanelData();
      this.initializeFinancialData();
      this.initializeSystemParameters();
    } catch (error) {
      console.error('Error al inicializar los campos:', error);
      // Manejar el error apropiadamente
    }
  }

  private initializeGeneralData(): void {
try {
      this.periodoVeinteanalEmisionesGEIEvitadasOriginal = this.resultadosFront.periodoVeinteanalEmisionesGEIEvitadas;
      this.isCategoriaTarifaT1 = this.sharedService.getTarifaContratada().includes('T1-R');
      // Obtener configuraciones anuales o usar un array vacío si no existen
      /* const yearlyAnualConfigurations =
        this.resultadosFront.solarData.panels.yearlysAnualConfigurations ?? [];
*/
      // Establecer resultados frontales en el servicio compartido
      this.sharedService.setResultadosFront(this.resultadosFront);
// Establecer configuraciones anuales si existen
      /* if ((yearlyAnualConfigurations as any[]).length > 0) {
        this.sharedService.setYearlysAnualConfigurations(
          yearlyAnualConfigurations
        );
} else {
} */

      // Calcular y establecer la energía anual predeterminada
      this.yearlyEnergyAckWhDefault = parseFloat(
        this.resultadosFront.solarData.yearlyEnergyAcKwh.toFixed(0)
      );
// Establecer la energía inicial igual a la predeterminada
      this.yearlyEnergyInitial = this.yearlyEnergyAckWhDefault;
      this.sharedService.setYearlyEnergyAckWh(this.yearlyEnergyInitial);
this.sharedService.calculateAreaPanelsSelected(this.panelesCantidad);
    } catch (error) {
      console.error('Error en initializeGeneralData:', error);

      this.handleInitializationGeneralDataError(error);
    }
}


  private handleInitializationGeneralDataError(error: unknown): void {
    if (error instanceof Error) {
      // Loguear el error para depuración
      console.error('Error detallado:', error.message);
      // Mostrar un mensaje de error al usuario
      /* this.snackBar.open(
        'Hubo un problema al inicializar los datos. Por favor, intente nuevamente.',
        'Cerrar',
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
        }
      ); */
      this.sharedService.resetAll();
    } else {
      console.error(
        'Se produjo un error desconocido durante la inicialización'
      );
    }
  }

  private initializePanelData(): void {
    try {
this.panelesCantidad =
        this.resultadosFront.solarData.panels.panelsSelected ??
        this.resultadosFront.solarData.panels.panelsCountApi;
// Usar la capacidad elegida en sharedService (por defecto 600 W)
      this.panelCapacityW = this.sharedService.getPanelCapacityW() || 600;
      this.dimensionPanel = this.sharedService.getDimensionByCapacity(this.panelCapacityW);

      this.sharedService.setPanelsCountSelected(this.panelesCantidad);
      this.sharedService.setDimensionPanels(this.dimensionPanel);
      this.sharedService.setPanelCapacityW(this.panelCapacityW);

      const eficienciaInstalacion =
        this.resultadosFront.parametros?.caracteristicasSistema
          .eficienciaInstalacion || 0.95;
this.sharedService.setEficienciaInstalacion(eficienciaInstalacion);

} catch (error) {
      console.error('Error en initializePanelData:', error);
      // Aquí puedes agregar lógica adicional para manejar el error, como mostrar un mensaje al usuario
      this.handleInitializationPanelDataError(error);
    }
  }

  private handleInitializationPanelDataError(error: unknown): void {
    if (error instanceof Error) {
      console.error('Error detallado:', error.message);
      // Mostrar un mensaje de error al usuario
      /* this.snackBar.open(
        'Hubo un problema al inicializar los datos del panel. Por favor, intente nuevamente.',
        'Cerrar',
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
        }
      ); */
    } else {
      console.error(
        'Se produjo un error desconocido durante la inicialización de los datos del panel'
      );
    }
  }

  private initializeFinancialData(): void {
    try {
this.costoInstalacion =
        this.resultadosFront.resultadosFinancieros.casoConCapitalPropio[0].inversiones;
this.sharedService.setCostoInstalacion(this.costoInstalacion);
const plazoInversionInicial =
        this.resultadosFront.resultadosFinancieros.indicadoresFinancieros
          .payBackMonths;
      this.sharedService.setPlazoInversion(plazoInversionInicial);
this.periodoVeinteanalCasoConCapitalPropioInitial =
        this.resultadosFront.resultadosFinancieros.casoConCapitalPropio;
const cargos = this.resultadosFront.periodoVeinteanalProyeccionTarifas[0];
      const tarifaIntercambio = cargos.cargoVariableConsumoUsdkWh;
      this.sharedService.setTarifaIntercambioUsdkWh(tarifaIntercambio);
    } catch (error) {
      console.error('Error en initializeFinancialData:', error);
      this.handleInitializationFinancialDataError(error);
    }
  }

  private handleInitializationFinancialDataError(error: unknown): void {
    if (error instanceof Error) {
      console.error('Error detallado:', error.message);
      // Mostrar un mensaje de error al usuario
      /* this.snackBar.open(
        'Hubo un problema al inicializar los datos financieros. Por favor, intente nuevamente.',
        'Cerrar',
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
        }
      ); */
    } else {
      console.error(
        'Se produjo un error desconocido durante la inicialización de los datos financieros'
      );
    }
  }

  private initializeSystemParameters(): void {
    try {
this.carbonOffsetFactorTnPerMWh = parseFloat(
        (
          this.resultadosFront.solarData.carbonOffsetFactorKgPerMWh / 1000
        ).toFixed(3)
      );
const parametros: ParametrosFront = this.resultadosFront.parametros!;
this.tipoEstructura = this.sharedService.getTipoEstructura();
this.roofFactor = this.resultadosFront.roofFactor || 1.0;
this.eficienciaInstalacion =
        parametros.caracteristicasSistema.eficienciaInstalacion || 0.95;
this.degradacionAnualPanel =
        parametros.caracteristicasSistema.degradacionAnualPanel;
this.proporcionAutoconsumo =
        parametros.caracteristicasSistema.proporcionAutoconsumo;
this.proporcionInyectada =
        parametros.caracteristicasSistema.proporcionInyeccion;
this.costoEquipoMedicion = this.sharedService.getCostoEquipoDeMedicion()!;
this.costoMantenimiento =
        parametros.inversionCostos.costoDeMantenimientoInicialUsd;
this.tasaInflacionUsd = parametros.economicas.tasaInflacionUsd;
this.potenciaContratadaHip =
        this.sharedService.getPotenciaMaxAsignadaW();
    } catch (error) {
      console.error('Error en initializeSystemParameters:', error);
      this.handleInitializationSystemParametersError(error);
    }
  }

  async cambiarEstructura(tipo: 'coplanar' | 'optimo'): Promise<void> {
    if (this.tipoEstructura === tipo || this.isCalculating) {
      return;
    }
this.isCalculating = true;
    this.sharedService.setIsLoading(true);
    this.sharedService.setTipoEstructura(tipo);
    this.tipoEstructura = tipo;

    try {
      const resultados = await this.solarService.calculate();
this.resultadosFront = resultados;
      this.sharedService.setResultadosFront(resultados);
      
      // Volver a inicializar los datos en base a los nuevos resultados
      this.initialLoadFields();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('[Paso3Component] Error al recalcular por cambio de estructura:', error);
      this.snackBar.open(
        'Error al recalcular los ahorros energéticos. Por favor intente de nuevo.',
        'Cerrar',
        { duration: 5000 }
      );
    } finally {
      this.isCalculating = false;
      this.sharedService.setIsLoading(false);
      this.cdr.detectChanges();
    }
  }

  private handleInitializationSystemParametersError(error: unknown): void {
    if (error instanceof Error) {
      console.error('Error detallado:', error.message);
      // Mostrar un mensaje de error al usuario
      /* this.snackBar.open(
        'Hubo un problema al inicializar los parámetros del sistema. Por favor, intente nuevamente.',
        'Cerrar',
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
        }
      ); */
    } else {
      console.error(
        'Se produjo un error desconocido durante la inicialización de los parámetros del sistema'
      );
    }
  }

  async buildPdfPayload() {
    const resultados = this.sharedService.getResultadosFront();
    const ahorroUsd = this.sharedService.getAhorroAnualUsd() ||
      resultados?.periodoVeinteanalFlujoIngresosMonetarios?.[0]?.ahorroEnElectricidadTotalUsd ||
      resultados?.resultadosFinancieros?.casoConCapitalPropio?.[0]?.ahorrosEnPesos || 0;
    
    const rawProp = this.proporcionAutoconsumo;
    const propRatio = (rawProp != null && rawProp > 0)
      ? (rawProp > 1 ? rawProp / 100 : rawProp)
      : 0.8;
    const propPct = Math.round(propRatio * 100);

    const generacionAnual = this.sharedService.getYearlyEnergyAckWh() || this.yearlyEnergyAckWhDefault || 0;
    const panelesCant = this.sharedService.getPanelsSelected() || this.panelesCantidad || 0;
    const panelCapW = this.sharedService.getPanelCapacityW() || this.panelCapacityW || 600;
    const costoInst = this.sharedService.getCostoInstalacion() || this.costoInstalacion || 0;
    const emisionesTn = this.sharedService.getCarbonOffSetTnAnual() ||
      ((generacionAnual * this.carbonOffsetFactorTnPerMWh) / 1000);

    let ahorroPorcentaje = resultados?.resultadosFinancieros?.casoConCapitalPropio?.[0]?.porcentajeAhorro || 0;
    if (!ahorroPorcentaje && this.consumoTotalAnual && generacionAnual) {
      ahorroPorcentaje = Math.min(100, Math.round(((generacionAnual * propRatio) / this.consumoTotalAnual) * 100));
    }

    const paybackMeses = this.sharedService.getPlazoInversionValue() ||
      resultados?.resultadosFinancieros?.indicadoresFinancieros?.payBackMonths || 0;

    let chartImages = undefined;
    if (this.graficosComponent) {
      try {
        chartImages = await this.graficosComponent.getChartsImages();
      } catch (e) {
        console.warn('No se pudieron capturar las imágenes de los gráficos:', e);
      }
    }

    return {
      uniqueID: this.pdfService.uniqueID || this.pdfService.generateShortUUID(),
      categoriaTarifa: this.categoriaTarifa || this.sharedService.getTarifaContratada(),
      tipoEstructura: this.tipoEstructura,
      roofFactor: this.roofFactor,
      potenciaContratada: this.potenciaContratadaHip || 0,
      panelesCantidad: panelesCant,
      panelCapacityW: panelCapW,
      costoInstalacion: costoInst,
      ahorroEstimadoPesosAnual: ahorroUsd,
      ahorroPorcentajeAnual: ahorroPorcentaje,
      periodoRecuperoAnios: paybackMeses > 0 ? parseFloat((paybackMeses / 12).toFixed(1)) : 0,
      potenciaPicoKw: (panelesCant * panelCapW) / 1000,
      generacionAnualKwh: generacionAnual,
      superficieTechoM2: this.sharedService.getAreaPanelsSelected() || 0,
      emisionesGEIEvitadasTnAnual: emisionesTn,
      proporcionAutoconsumo: propPct,
      proporcionInyectada: (100 - propPct),
      textoArboles: this.graficosComponent?.textoArboles,
      chartImages,
    };
  }

  async downloadPDF(): Promise<void> {
    if (!this.isDownloading) {
      this.isDownloading = true;
      try {
        const payload = await this.buildPdfPayload();
        this.pdfService
          .downloadPdfBlob(payload)
          .subscribe({
            next: (blob) => {
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `resultado-id-${payload.uniqueID}.pdf`;
              a.click();
              window.URL.revokeObjectURL(url);
              this.isDownloading = false;
            },
            error: (err) => {
              console.error('Error al descargar el PDF:', err);
              this.snackBar.open(
                'No se pudo generar la descarga del PDF. Intente nuevamente.',
                'Cerrar',
                { duration: 4000 }
              );
              this.isDownloading = false;
            },
          });
      } catch (e) {
        console.error('Error preparando payload de PDF:', e);
        this.isDownloading = false;
      }
    }
  }

  async sendEmail(): Promise<void> {
    if (!this.isSendingMail && this.email) {
      this.isSendingMail = true;
      try {
        const payload = await this.buildPdfPayload();
        this.gmailService
          .sendEmailWithResults(this.email, payload)
          .then(() => {
          this.isSendingMail = false;
          this.snackBar.open('El correo ha sido enviado exitosamente.', '', {
            duration: 5000,
            panelClass: ['custom-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
          this.closeModal();
        })
        .catch((err) => {
          console.error('Error al enviar el email:', err);
          this.isSendingMail = false;
          this.snackBar.open(
            'Hubo un problema al enviar el correo. Intente más tarde.',
            'Cerrar',
            { duration: 4000 }
          );
        });
      } catch (e) {
        console.error('Error al preparar payload para email:', e);
        this.isSendingMail = false;
      }
    }
  }

  mostrarAdvertencia(): void {
    this.mostrarModal = true;
  }

  cancelarSalir(): void {
    this.mostrarModal = false;
  }

  confirmarSalir(): void {
    this.mostrarModal = false;

    this.mapService.clearDrawing();
    this.consumoTarifaService.updateConsumosMensuales([]);
    this.consumoService.setTotalConsumo(0);
    this.sharedService.setTutorialShown(true);
    this.sharedService.setPotenciaInstalacionW(0);
    this.sharedService.setCostoInstalacion(0);
    this.sharedService.setPlazoInversion(0);
    this.sharedService.setAhorroAnualUsd(0);

    // Reiniciar variables adicionales
    this.sharedService.resetAll();

    // Reiniciar variables locales
    this.yearlyEnergyAckWhDefault = 0;
    this.yearlyEnergyInitial = 0;
    this.panelesCantidad = 0;
    this.dimensionPanel = { height: 0, width: 0 };
    this.panelCapacityW = 0;
    this.costoInstalacion = 0;
    this.potenciaPanelHip = 0;
    this.eficienciaInstalacion = 0;
    this.degradacionAnualPanel = 0;
    this.proporcionInyectada = 0;
    this.costoEquipoMedicion = 0;
    this.costoMantenimiento = 0;
    this.tasaInflacionUsd = 0;
    this.potenciaContratadaHip = 0;
    this.consumoTotalAnual = 0;

    this.router.navigate(['/pasos/1'], { replaceUrl: true });
  }

  goBack() {
    this.sharedService.setTutorialShown(true);
    this.router.navigate(['pasos/2']);
  }

  private readonly emptyArray: any[] = [];

  getEmisionesGEIEvitadas() {
    return this.resultadosFront?.periodoVeinteanalEmisionesGEIEvitadas || this.emptyArray;
  }

  getFlujoEnergia() {
    return this.resultadosFront?.periodoVeinteanalFlujoEnergia || this.emptyArray;
  }

  getFlujoIngresosMonetarios() {
    return this.resultadosFront?.periodoVeinteanalFlujoIngresosMonetarios || this.emptyArray;
  }

  getGeneracionFotovoltaica() {
    return this.resultadosFront?.periodoVeinteanalGeneracionFotovoltaica || this.emptyArray;
  }

  getTIR() {
    try {
      if (this.resultadosFront) {
        return this.resultadosFront.resultadosFinancieros.indicadoresFinancieros.TIR.toFixed(
          2
        );
      }
    } catch {
}
  }

  togglePanelsVisibility() {
    this.showPanels = !this.showPanels;
    this.mapService.setPanelsVisibility(this.showPanels);
  }

  // Método para establecer el timestamp
  private setTimestamp() {
    const date = new Date();
    const userAgent = navigator.userAgent;
    const browserVersion = this.getBrowserVersion(userAgent);

    this.timestamp = `${date.toLocaleDateString()} ${date.toLocaleTimeString()} - Navegador: ${browserVersion}`;
  }

  // Método auxiliar para obtener la versión del navegador
  private getBrowserVersion(userAgent: string): string {
    if (userAgent.indexOf('Firefox') > -1) {
      return 'Firefox ' + userAgent.split('Firefox/')[1];
    } else if (userAgent.indexOf('Chrome') > -1) {
      return 'Chrome ' + userAgent.split('Chrome/')[1].split(' ')[0];
    } else if (
      userAgent.indexOf('Safari') > -1 &&
      userAgent.indexOf('Chrome') === -1
    ) {
      return 'Safari ' + userAgent.split('Version/')[1].split(' ')[0];
    } else if (userAgent.indexOf('Edg') > -1) {
      return 'Edge ' + userAgent.split('Edg/')[1];
    } else {
      return 'Navegador desconocido';
    }
  }

  private actualizarFecha() {
    const now = new Date();
    const meses = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ];

    const mes = meses[now.getMonth()];
    const anio = now.getFullYear();

    this.fechaActual = `${mes} de ${anio}`;
    const mesCap = mes.charAt(0).toUpperCase() + mes.slice(1);
    this.fechaMesAnio = `${mesCap} ${anio}`;
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  private subscribeToSharedServiceData() {
this.sharedService.tarifaContratada$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe({
        next: (tarifa) => {
          this.categoriaTarifa = tarifa;
},
      });

    this.sharedService.potenciaMaxAsignadaW$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((potencia) => {
        this.potenciaMaxAsignadaW = potencia;
});

    this.sharedService.panelsCountSelected$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((panels) => {
        this.panelesCantidad = panels;
});

    this.sharedService.potenciaInstalacionW$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((potencia) => {
        this.potenciaInstalacionW = potencia;
});

    this.consumoService.totalConsumo$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe({
        next: (value) => {
          this.consumoTotalAnual = value;
},
      });

    this.sharedService.panelCapacityW$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe({
        next: (capacity) => {
          this.potenciaPanelHip = capacity;
          this.panelCapacityW = capacity;
this.cdr.detectChanges();
        },
      });

    this.sharedService.dimensionPanel$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe({
        next: (dimension) => {
          this.dimensionPanel = dimension;
this.cdr.detectChanges();
        },
      });


}

  onRecalculoIniciado(event: boolean): void {
if (!this.isLoading) {
      this.isCalculating = event; // Muestra el loader
    }
  }

  // Método que se ejecuta cuando el recalculo termina
  onRecalculoTerminado(event: boolean): void {
this.isCalculating = event; // Oculta el loader
  }
}
