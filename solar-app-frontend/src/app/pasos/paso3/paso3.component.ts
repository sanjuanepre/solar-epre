import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
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
import { NearbyLocationService } from 'src/app/services/nearby-location.service';
import { Paso2Component } from '../paso2/paso2.component';
import { PdfService } from 'src/app/services/pdf.service';
import { ParametrosFront } from 'src/app/interfaces/parametros-front';
import { distinctUntilChanged, Subject, takeUntil, Subscription } from 'rxjs';
import { EmisionesGeiEvitadasFront } from 'src/app/interfaces/emisiones-gei-evitadas-front';
@Component({
  selector: 'app-paso3',
  templateUrl: './paso3.component.html',
  styleUrls: ['./paso3.component.css'],
})
export class Paso3Component implements OnInit, OnDestroy {
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
  categoriaTarifa!: string;
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
  constructor(
    private router: Router,
    private readonly gmailService: GmailService,
    private snackBar: MatSnackBar,
    private solarService: SolarApiService,
    private sharedService: SharedService,
    private mapService: MapService,
    private consumoTarifaService: ConsumoTarifaService,
    private consumoService: ConsumoService,
    private nearbyService: NearbyLocationService,
    private pdfService: PdfService,
    private cdr: ChangeDetectorRef
  ) {
    console.log('Iniciando constructor de Paso3Component');
   
    this.actualizarFecha();
    console.log('Fecha actualizada:', this.fechaActual);
  }

  ngOnInit(): void {
    console.log('Iniciando ngOnInit de Paso3Component');
    this.sharedService.isLoading$
    .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
    .subscribe({
      next: (value) => {
        console.log('Valor de isLoading actualizado:', value);
        this.isLoading = value;
      },
    });
    this.subscribeToSharedServiceData();
    console.log('Suscripción a SharedService completada');

    this.sharedService.setIsLoading(true);
    console.log('IsLoading establecido a true');
    this.cdr.detectChanges();
    setTimeout(() => {
      console.log('Recentrando mapa a área visible');
      this.mapService.recenterMapToVisibleArea();
    }, 300);

    this.setTimestamp();
    console.log('Timestamp establecido:', this.timestamp);

    if (!this.sharedService.getNearbyLocation()) {
      console.log('No hay ubicación cercana, calculando...');
      this.solarService
        .calculate()
        .then((resultados) => {
          console.log('Resultados obtenidos:', resultados);
          this.resultadosFront = resultados;
        })
        .then(() => {
          console.log('Cargando campos iniciales');
          this.initialLoadFields();
          this.cdr.detectChanges();
        })
        .then(() => {
          console.log('Cálculo completado, estableciendo isLoading a false');
          this.sharedService.setIsLoading(false);
          this.cdr.detectChanges();
        })
        .catch((error) => {
          /* console.error('Error al calcular:', error);
          this.sharedService.setIsLoading(false);
          this.snackBar.open(
            'Hubo un problema al calcular los ahorros solares. Inténtelo más tarde.',
            'Cerrar',
            {
              duration: 5000,
              panelClass: ['error-snackbar'],
              horizontalPosition: 'center',
              verticalPosition: 'top',
            }
          ); */
          this.sharedService.resetAll();
        });
    } else {
      console.log('Usando ubicación cercana para cálculos');
      this.nearbyService
        .calculate(this.sharedService.getNearbyLocation())
        .then((resultado) => {
          console.log('Resultado de ubicación cercana:', resultado);
          this.resultadosFront = resultado;
        })
        .then(() => {
          console.log('Cargando campos iniciales');
          this.initialLoadFields();
        })
        .catch((error) => console.error('Error en cálculo cercano:', error));
      console.log(
        'Cálculo cercano completado, estableciendo isLoading a false'
      );
      this.sharedService.setIsLoading(false);
    }
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
    console.log('Iniciando initializeGeneralData');
    try {
      this.periodoVeinteanalEmisionesGEIEvitadasOriginal = this.resultadosFront.periodoVeinteanalEmisionesGEIEvitadas;
      this.isCategoriaTarifaT1 = this.sharedService.getTarifaContratada().includes('T1-R');
      // Obtener configuraciones anuales o usar un array vacío si no existen
      /* const yearlyAnualConfigurations =
        this.resultadosFront.solarData.panels.yearlysAnualConfigurations ?? [];
      console.log('Configuraciones anuales:', yearlyAnualConfigurations);
 */
      // Establecer resultados frontales en el servicio compartido
      this.sharedService.setResultadosFront(this.resultadosFront);
      console.log('Resultados frontales establecidos en sharedService');

      // Establecer configuraciones anuales si existen
      /* if ((yearlyAnualConfigurations as any[]).length > 0) {
        this.sharedService.setYearlysAnualConfigurations(
          yearlyAnualConfigurations
        );
        console.log('Configuraciones anuales establecidas en sharedService');
      } else {
        console.log('No se encontraron configuraciones anuales');
      } */

      // Calcular y establecer la energía anual predeterminada
      this.yearlyEnergyAckWhDefault = parseFloat(
        this.resultadosFront.solarData.yearlyEnergyAcKwh.toFixed(0)
      );
      console.log(
        'Energía anual predeterminada:',
        this.yearlyEnergyAckWhDefault
      );

      // Establecer la energía inicial igual a la predeterminada
      this.yearlyEnergyInitial = this.yearlyEnergyAckWhDefault;
      this.sharedService.setYearlyEnergyAckWh(this.yearlyEnergyInitial);
      console.log(
        'Energía anual inicial establecida:',
        this.yearlyEnergyInitial
      );
      this.sharedService.calculateAreaPanelsSelected(this.panelesCantidad);
    } catch (error) {
      console.error('Error en initializeGeneralData:', error);
      
      this.handleInitializationGeneralDataError(error);
    }
    console.log('Finalizado initializeGeneralData');
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
      console.log('Iniciando initializePanelData');

      this.panelesCantidad =
        this.resultadosFront.solarData.panels.panelsSelected ??
        this.resultadosFront.solarData.panels.panelsCountApi;
      console.log('Cantidad de paneles:', this.panelesCantidad);

      this.dimensionPanel = this.resultadosFront.solarData.panels.panelSize;
      console.log('Dimensiones del panel:', this.dimensionPanel);

      this.sharedService.setPanelsCountSelected(this.panelesCantidad);
      this.sharedService.setDimensionPanels(this.dimensionPanel);

      this.panelCapacityW =
        this.resultadosFront.solarData.panels.panelCapacityW;
      console.log('Capacidad del panel en W:', this.panelCapacityW);

      this.sharedService.setPanelCapacityW(this.panelCapacityW);

      const eficienciaInstalacion =
        this.resultadosFront.parametros?.caracteristicasSistema
          .eficienciaInstalacion || 0.95;
      console.log('Eficiencia de instalación:', eficienciaInstalacion);

      this.sharedService.setEficienciaInstalacion(eficienciaInstalacion);

      console.log('initializePanelData completado con éxito');
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
      console.log('Iniciando initializeFinancialData');

      this.costoInstalacion =
        this.resultadosFront.resultadosFinancieros.casoConCapitalPropio[0].inversiones;
      console.log('Costo de instalación:', this.costoInstalacion);

      this.sharedService.setCostoInstalacion(this.costoInstalacion);
      console.log('Costo de instalación establecido en sharedService');

      const plazoInversionInicial =
        this.resultadosFront.resultadosFinancieros.indicadoresFinancieros
          .payBackMonths;
      this.sharedService.setPlazoInversion(plazoInversionInicial);
      console.log('Plazo de inversión inicial establecido:', plazoInversionInicial);

      this.periodoVeinteanalCasoConCapitalPropioInitial =
        this.resultadosFront.resultadosFinancieros.casoConCapitalPropio;
      console.log(
        'Periodo veintenal caso con capital propio inicial establecido'
      );

      const cargos = this.resultadosFront.periodoVeinteanalProyeccionTarifas[0];
      const tarifaIntercambio = cargos.cargoVariableConsumoUsdkWh;
      this.sharedService.setTarifaIntercambioUsdkWh(tarifaIntercambio);
      console.log('Tarifa de intercambio establecida:', tarifaIntercambio);

      console.log('initializeFinancialData completado con éxito');
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
      console.log('Iniciando initializeSystemParameters');

      this.carbonOffsetFactorTnPerMWh = parseFloat(
        (
          this.resultadosFront.solarData.carbonOffsetFactorKgPerMWh / 1000
        ).toFixed(3)
      );
      console.log(
        'Factor de compensación de carbono:',
        this.carbonOffsetFactorTnPerMWh
      );

      const parametros: ParametrosFront = this.resultadosFront.parametros!;
      console.log('Parámetros obtenidos:', parametros);

      this.eficienciaInstalacion =
        parametros.caracteristicasSistema.eficienciaInstalacion || 0.95;
      console.log('Eficiencia de instalación:', this.eficienciaInstalacion);

      this.degradacionAnualPanel =
        parametros.caracteristicasSistema.degradacionAnualPanel;
      console.log('Degradación anual del panel:', this.degradacionAnualPanel);

      this.proporcionAutoconsumo =
        parametros.caracteristicasSistema.proporcionAutoconsumo;
      console.log('Proporción de autoconsumo:', this.proporcionAutoconsumo);

      this.proporcionInyectada =
        parametros.caracteristicasSistema.proporcionInyeccion;
      console.log('Proporción inyectada:', this.proporcionInyectada);

      this.costoEquipoMedicion = this.sharedService.getCostoEquipoDeMedicion()!;
      console.log('Costo del equipo de medición:', this.costoEquipoMedicion);

      this.costoMantenimiento =
        parametros.inversionCostos.costoDeMantenimientoInicialUsd;
      console.log('Costo de mantenimiento:', this.costoMantenimiento);

      this.tasaInflacionUsd = parametros.economicas.tasaInflacionUsd;
      console.log('Tasa de crecimiento tarifas y de descuento USD:', this.tasaInflacionUsd);

      this.potenciaContratadaHip =
        this.sharedService.getPotenciaMaxAsignadaValue();
      console.log(
        'Potencia contratada hipotética:',
        this.potenciaContratadaHip
      );

      console.log('initializeSystemParameters completado con éxito');
    } catch (error) {
      console.error('Error en initializeSystemParameters:', error);
      this.handleInitializationSystemParametersError(error);
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

  downloadPDF(): void {
    if (!this.isDownloading) {
      this.isDownloading = true;
      this.pdfService
        .generatePDF(true)
        .then(() => {})
        .catch(() => {})
        .finally(() => (this.isDownloading = false));
    }
  }

  sendEmail(): void {
    if (!this.isSendingMail) {
      if (this.email) {
        this.isSendingMail = true;
        this.gmailService.sendEmailWithResults(this.email).then(() => {
          this.isSendingMail = false;
          this.snackBar.open('El correo ha sido enviado exitosamente.', '', {
            duration: 5000,
            panelClass: ['custom-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
          this.closeModal();
        });
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

    this.mapService.hideDrawingControl();
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
    this.mapService.hideDrawingControl();

    this.sharedService.setTutorialShown(true);
    this.router.navigate(['pasos/2']);
  }

  getEmisionesGEIEvitadas() {
    try {
      if (this.resultadosFront) {
        return this.resultadosFront.periodoVeinteanalEmisionesGEIEvitadas;
      }
    } catch (error) {
      console.log('this.resultadosFront no disponible');
    }
    return [];
  }

  getFlujoEnergia() {
    try {
      if (this.resultadosFront) {
        return this.resultadosFront.periodoVeinteanalFlujoEnergia;
      }
    } catch (error) {
      console.log('this.resultadosFront no disponible');
    }
    return [];
  }

  getFlujoIngresosMonetarios() {
    try {
      if (this.resultadosFront) {
        return this.resultadosFront.periodoVeinteanalFlujoIngresosMonetarios;
      }
    } catch (error) {
      console.log('this.resultadosFront no disponible');
    }
    return [];
  }

  getGeneracionFotovoltaica() {
    try {
      if (this.resultadosFront) {
        return this.resultadosFront.periodoVeinteanalGeneracionFotovoltaica;
      }
    } catch (error) {
      console.log('this.resultadosFront no disponible');
    }
    return [];
  }

  getTIR() {
    try {
      if (this.resultadosFront) {
        return this.resultadosFront.resultadosFinancieros.indicadoresFinancieros.TIR.toFixed(
          2
        );
      }
    } catch {
      console.log('this.resultadosFront no disponible');
    }
  }

  enabledDrawing() {
    this.polygons = this.mapService.getPolygons();
    this.polygons[0].setEditable(true);
    this.mapService.setDrawingMode(null);

    // Mostrar el snackbar
    this.snackBar.open('Superficie editable', '', {
      duration: 5000,
      panelClass: ['custom-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
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
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  private subscribeToSharedServiceData() {
    console.log('Iniciando suscripciones en Paso 3');

    this.sharedService.tarifaContratada$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe({
        next: (tarifa) => {
          this.categoriaTarifa = tarifa;
          console.log('Paso 3: Tarifa contratada actualizada:', tarifa);
        },
      });

    this.sharedService.potenciaMaxAsignadaW$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((potencia) => {
        this.potenciaMaxAsignadaW = potencia;
        console.log('Paso 3: Potencia máxima asignada actualizada:', potencia);
      });

    this.sharedService.panelsCountSelected$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((panels) => {
        this.panelesCantidad = panels;
        console.log('Paso 3: Cantidad de paneles actualizada:', panels);
      });

    this.sharedService.potenciaInstalacionW$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((potencia) => {
        this.potenciaInstalacionW = potencia;
        console.log('Paso 3: Potencia de instalación actualizada:', potencia);
      });

    this.consumoService.totalConsumo$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe({
        next: (value) => {
          this.consumoTotalAnual = value;
          console.log('Paso 3: Consumo total anual actualizado:', value);
        },
      });

    this.sharedService.panelCapacityW$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe({
        next: (capacity) => (this.potenciaPanelHip = capacity),
      });


    console.log('Suscripciones en Paso 3 completadas');
  }

  onRecalculoIniciado(event: boolean): void {
    console.log('Recalculo iniciado, mostrando loader:', event);
    if(!this.isLoading){
      this.isCalculating = event; // Muestra el loader
    }
  }

  // Método que se ejecuta cuando el recalculo termina
  onRecalculoTerminado(event: boolean): void {
    console.log('Recalculo terminado, ocultando loader:', event);
    this.isCalculating = event; // Oculta el loader
  }
}
