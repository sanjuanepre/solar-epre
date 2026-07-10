import { Injectable, Injector, OnDestroy } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
} from '@angular/common/http';
import { lastValueFrom, Subject } from 'rxjs';
import { ResultadoService } from './resultado.service';
import { ResultadosFrontDTO } from '../interfaces/resultados-front-dto';
import { ConsumoService } from './consumo.service';
import { MapService } from './map.service';
import { SharedService } from './shared.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SolarDataFront } from '../interfaces/solar-data-front';
import { Router } from '@angular/router';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class SolarApiService implements OnDestroy {
  private readonly apiUrl: string = environment.apiUrl;
  private _resultados!: ResultadosFrontDTO;
  annualConsumption: number = 0;
  private mapService!: MapService;
  potenciaMaxAsignadaW!: number;
  private destroy$ = new Subject<void>(); // Subject para destruir observables

  constructor(
    private http: HttpClient,
    private injector: Injector,
    private readonly resultadoService: ResultadoService,
    private consumoService: ConsumoService,
    private sharedService: SharedService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getMapService(): MapService {
    if (!this.mapService) {
      this.mapService = this.injector.get(MapService);
    }
    return this.mapService;
  }

  resetApplication() {
    console.log('Reiniciando la aplicación');
    // Reiniciar servicios
    this.sharedService.resetAll();
  }

  async calculate(panels400WCount?: number, factorPotencia?: number): Promise<any> {
    console.log(
      'Iniciando cálculo solar - Método calculate en SolarApiService'
    );
    const mapService = this.getMapService();

    try {
      console.log('Recopilando datos para el cálculo solar...');
      const polygonCoordinates = mapService.getPolygonCoordinates();
      console.log('Coordenadas del polígono obtenidas:', polygonCoordinates);

      const polygonArea = mapService.getPolygonArea();
      console.log('Área del polígono calculada:', polygonArea);

      const categoriaSeleccionada = this.sharedService.getTarifaContratada();
      console.log('Categoría tarifaria seleccionada:', categoriaSeleccionada);

      this.annualConsumption = this.consumoService.getTotalConsumo();
      console.log('Consumo anual obtenido:', this.annualConsumption, 'kWh');

      this.potenciaMaxAsignadaW =
        this.sharedService.getPotenciaMaxAsignadaW();
      console.log(
        'Potencia máxima asignada obtenida:',
        this.potenciaMaxAsignadaW,
        'W'
      );

      console.log('Verificando campos faltantes');
      const missingFields = [];
      if (!this.annualConsumption) missingFields.push('Consumo anual');
      if (!polygonCoordinates) missingFields.push('Coordenadas del polígono');
      if (!polygonArea) missingFields.push('Área del polígono');
      if (!categoriaSeleccionada) missingFields.push('Categoría seleccionada');
      if (!this.potenciaMaxAsignadaW)
        missingFields.push('Potencia máxima asignada');

      try {
        if (missingFields.length > 0) {
          /* console.log('Campos faltantes detectados:', missingFields);
          this.snackBar.open(
            `Faltan los siguientes datos: ${missingFields.join(', ')}`,
            'Cerrar',
            {
              duration: 5000,
              panelClass: ['error-snackbar'],
              horizontalPosition: 'center',
              verticalPosition: 'top',
            }
          ); */

          setTimeout(() => {
            console.log('Reiniciando la aplicación debido a campos faltantes');
            this.resetApplication();
          }, 2000);
          return;
        }
      } catch (error) {
        console.error('Error en el método calculate:', error);
        this.sharedService.setIsLoading(false);
        this.resetApplication(); //
      }

      const datosCalculo = {
        annualConsumption: this.annualConsumption,
        polygonCoordinates,
        categoriaSeleccionada,
        polygonArea,
        panelsSelected: this.sharedService.getPanelsSelected(),
        potenciaMaxAsignada: this.potenciaMaxAsignadaW,
        factorPotencia: factorPotencia ?? 1,
      };
      console.log('Datos que se envían al endpoint:', datosCalculo);

      try {
        console.log('Iniciando solicitud al servidor');
        const userAgent = navigator.userAgent;
        const clientIp = await this.getClientIp();

        const response = await fetch(`${this.apiUrl}/solar/calculate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': userAgent,
            'X-Client-IP': clientIp,
          },
          body: JSON.stringify(datosCalculo),
          cache: 'no-store',
        });

        if (!response.ok) {
          console.error('Error en la respuesta del servidor:', response.status);
          if (response.status === 503) {
            this.router.navigate(['/503']);
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const resultados = await response.json();
        this._resultados = resultados;

        console.log('Respuesta del servidor recibida:', this._resultados);
      } catch (error) {
        console.error('Error durante el cálculo solar:', error);
        // Manejo de errores más específico
        let mensajeError = 'Error al calcular los resultados solares';

        if (error instanceof HttpErrorResponse) {
          if (error.status === 0) {
            mensajeError =
              'No se pudo conectar al servidor. Por favor, verifica tu conexión a internet.';
          } else {
            mensajeError = `Error del servidor: ${error.status} - ${error.message}`;
          }
        }

        // Resetear la aplicación después de un breve retraso
        setTimeout(() => {
          console.log('Reiniciando la aplicación debido a un error crítico');
          this.resetApplication();
        }, 3000);

        /* throw error; */
      }

      console.log('Procesando resultados');
      this._resultados = this.resultadoService.generarResultados(
        this._resultados
      );
      this.sharedService.setIsLoading(false);
      return this.getResultados;
    } catch (error) {
      console.error('Error en el método calculate:', error);
      this.sharedService.setIsLoading(false);
    }
  }

  get getResultados(): ResultadosFrontDTO {
    return this._resultados;
  }

  async getClientIp(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error al obtener la IP del cliente:', error);
      return 'unknown';
    }
  }

  async calculateWithNearby(
    solarData: SolarDataFront
  ): Promise<ResultadosFrontDTO> {
    try {
      const response = await lastValueFrom(
        this.http.post<any>(`${this.apiUrl}/solar/calculate-nearby`, solarData)
      );
      // console.log("Response devuelta ", response);

      this._resultados = this.resultadoService.generarResultados(response);
      /*  console.log('NEARBY RESULTADOS FRONT ', this._resultados); */
      return this.getResultados;
    } catch (error) {
      console.error('Error en el cálculo con nearby:', error);
      throw error;
    }
  }

  async recalculate(panels400WCount: number, factorPotencia: number): Promise<boolean> {
    return await this.calculate(panels400WCount, factorPotencia)
      .then(() => {
        const resultadosProcesados = this.resultadoService.generarResultados(this._resultados);
        this.sharedService.setYearlyEnergyAckWh(resultadosProcesados.periodoVeinteanalGeneracionFotovoltaica[0].generacionFotovoltaicaKWh);
        this.sharedService.setAhorroAnualUsd(resultadosProcesados.ahorroUsd);
        const plazoInversionInicial =
          resultadosProcesados.resultadosFinancieros.indicadoresFinancieros
            .payBackMonths;
        this.sharedService.setPlazoInversion(plazoInversionInicial);
        this.sharedService.calculateAreaPanelsSelected(panels400WCount);
        console.log('Plazo de inversión inicial establecido:', plazoInversionInicial);
        return true;
      })
      .catch(() => {
        return false;
      });
  }

  async getDataLayers(latitude: number, longitude: number, radiusMeters: number = 30): Promise<any> {
    try {
      const response = await fetch(
        `${this.apiUrl}/solar/dataLayers?latitude=${latitude}&longitude=${longitude}&radiusMeters=${radiusMeters}`
      );
      if (!response.ok) {
        throw new Error(`Error en la llamada a dataLayers: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al obtener dataLayers:', error);
      throw error;
    }
  }
}

