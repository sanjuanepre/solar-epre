import axios from 'axios';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { SolarCalculationDto } from './dto/solar-calculation.dto';
import { CalculadoraService } from '../calculadora/calculadora.service';
import { SolarData } from '../interfaces/solar-data/solar-data.interface';
import { PanelConfig } from '../interfaces/panel-config/panel-config.interface';
import { ResultadosDto } from '../interfaces/resultados-dto/resultados-dto.interface';
import { SolarDataLayersResponse } from './dto/solar-data-layers.interface';

@Injectable()
export class SolarService {
  constructor(private readonly calculadoraService: CalculadoraService) {}

  async getSolarData(latitude: number, longitude: number): Promise<any> {
    // Verifica si las coordenadas son válidas
    if (isNaN(latitude) || isNaN(longitude)) {
      throw new HttpException(
        'Invalid coordinates received',
        HttpStatus.BAD_REQUEST,
      );
    }

    const apiKey = process.env.GOOGLE_API_KEY;

    // Prepara los parámetros de la consulta
    const args = {
      'location.latitude': latitude.toFixed(5), // Redondea a 5 decimales
      'location.longitude': longitude.toFixed(5),
    };

    // Crea los parámetros de la URL usando URLSearchParams
    const params = new URLSearchParams({ ...args, key: apiKey });

    const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?${params}`;

    try {
      // Realiza la petición utilizando fetch
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          Pragma: 'no-cache',
          'Cache-Control': 'no-cache',
          'Accept-Encoding': 'gzip, deflate, br',
        },
      });

      // Verifica si la respuesta es exitosa
      if (!response.ok) {
        let errorMsg = 'Unknown error';
        try {
          const errorContent = await response.json();
          errorMsg = errorContent.error ? errorContent.error.message : JSON.stringify(errorContent);
        } catch (e) {
          errorMsg = `HTTP status ${response.status}`;
        }
        console.warn(`[SolarService] Google Solar API call failed (${errorMsg}). Returning mock fallback data.`);
        return this.getMockSolarData();
      }

      // Si la respuesta es exitosa, convierte los datos a JSON
      const data = await response.json();
      return data;
    } catch (error) {
      console.warn(`[SolarService] Error calling Google Solar API (${error.message}). Returning mock fallback data.`);
      return this.getMockSolarData();
    }
  }

  private getMockSolarData(): any {
    return {
      solarPotential: {
        panelCapacityWatts: 400,
        panelHeightMeters: 1.65,
        panelWidthMeters: 0.99,
        carbonOffsetFactorKgPerMwh: 397,
        solarPanelConfigs: Array.from({ length: 50 }, (_, i) => {
          const panelsCount = (i + 1) * 4;
          return {
            panelsCount,
            yearlyEnergyDcKwh: panelsCount * 567.2,
          };
        }),
      },
    };
  }

  async calculateSolarSavings(dto: SolarCalculationDto): Promise<any> {
   /*  console.log('Iniciando cálculo de ahorro solar');
    console.log('Datos de entrada:', JSON.stringify(dto, null, 2)); */

    const { latitude, longitude } = this.calculateCentroid(
      dto.polygonCoordinates,
    );
   /*  console.log(
      `Centroide calculado: Latitud ${latitude}, Longitud ${longitude}`,
    ); */

    const solarDataApi = await this.getSolarData(latitude, longitude);
    // console.log('Datos solares obtenidos de la API:', solarDataApi);

    const solarPanelConfig: PanelConfig = this.calculatePanelConfig(
      solarDataApi.solarPotential,
      dto.panelsSelected,
    );

    // Si el tipo de estructura es 'optimo' (inclinación de 30° al Norte), aplicamos el factor de transposición
    if (dto.tipoEstructura === 'optimo') {
      const roofFactor = this.calculateRoofFactor(solarDataApi.solarPotential, dto.panelsSelected);
      solarPanelConfig.yearlyEnergyDcKwh = solarPanelConfig.yearlyEnergyDcKwh / roofFactor;
    }

   /*  console.log(
      'Configuración de paneles calculada:',
      JSON.stringify(solarPanelConfig, null, 2),
    ); */

    const yearlysAnualConfigurations =
      solarDataApi.solarPotential.solarPanelConfigs.map((item: any) => {
        let energyDc = item.yearlyEnergyDcKwh;
        if (dto.tipoEstructura === 'optimo') {
          const factor = this.calculateRoofFactor(solarDataApi.solarPotential, item.panelsCount);
          energyDc = energyDc / factor;
        }
        return {
          panelsCount: item.panelsCount,
          yearlyEnergyDcKwh: energyDc,
        };
      });
    // console.log('Configuraciones anuales:', JSON.stringify(yearlysAnualConfigurations, null, 2));

    const yearlyEnergyAcKwh =
      solarPanelConfig.yearlyEnergyDcKwh *
      dto.parametros.caracteristicasSistema.eficienciaInstalacion;
    // console.log(`Energía AC anual calculada: ${yearlyEnergyAcKwh} kWh`);

    const solarData: SolarData = {
      annualConsumption: dto.annualConsumption,
      yearlyEnergyAcKwh: yearlyEnergyAcKwh,
      panels: {
        panelsCountApi: solarPanelConfig.panelsCount,
        panelsSelected: dto.panelsSelected,
        panelCapacityW: solarDataApi.solarPotential.panelCapacityWatts,
        panelSize: {
          height: solarDataApi.solarPotential.panelHeightMeters,
          width: solarDataApi.solarPotential.panelWidthMeters,
        },
        yearlysAnualConfigurations,
      },
      carbonOffsetFactorKgPerMWh:
        solarDataApi.solarPotential.carbonOffsetFactorKgPerMwh,
      tarifaCategory: dto.categoriaSeleccionada,
    };
    // console.log('Datos solares preparados:', JSON.stringify(solarData, null, 2));

    // console.log('Calculando ahorros de energía...');
    const result = await this.calculadoraService.calculateEnergySavings(
      solarData,
      dto,
    );
    // console.log('Resultado del cálculo de ahorros:', JSON.stringify(result, null, 2));

    return result;
  }

  // Método para calcular el centroide de una superficie
  private calculateCentroid(coordenadas: any[]): {
    latitude: number;
    longitude: number;
  } {
    let sumLat = 0;
    let sumLng = 0;

    for (const coord of coordenadas) {
      const lat = parseFloat(coord.lat);
      const lng = parseFloat(coord.lng);

      if (!isNaN(lat) && !isNaN(lng)) {
        sumLat += lat;
        sumLng += lng;
      } else {
        console.error(
          `Invalid coordinate found: ${coord.latitude}, ${coord.longitude}`,
        );
      }
    }

    const centroidLat = sumLat / coordenadas.length;
    const centroidLng = sumLng / coordenadas.length;

    return { latitude: centroidLat, longitude: centroidLng };
  }

  private calculatePanelConfig(
    solarPotential: { solarPanelConfigs: any },
    panelsSelected: number,
  ): PanelConfig {
    // console.log('Iniciando cálculo de configuración de paneles');
    // console.log(`Número de paneles seleccionados: ${panelsSelected}`);

    if (panelsSelected < 4) {
      panelsSelected = 4;
      // console.log('Ajustando número de paneles a 4 (mínimo requerido)');
    }

    const configs = solarPotential.solarPanelConfigs;
    // console.log('Configuraciones disponibles:', JSON.stringify(configs));

    const panelsCount = panelsSelected;
    const index = configs.findIndex(
      (element: PanelConfig) => element.panelsCount === panelsCount,
    );
    console.log(`Índice de configuración encontrada: ${index}`);

    if (index === -1) {
      console.log(
        'Configuración exacta no encontrada, procediendo a interpolar',
      );
      
      const recalculatedConfig = {
        panelsCount: panelsSelected,
        yearlyEnergyDcKwh: this.calculateYearlyEnergyDCkWh(
          configs,
          panelsSelected,
        ),
      };
      console.log(
        'Configuración interpolada:',
        JSON.stringify(recalculatedConfig),
      );
      return recalculatedConfig;
    }

    if (index === 0) {
      console.log('Usando primera configuración disponible');
      return configs[0];
    }

    console.log(
      'Usando configuración encontrada:',
      JSON.stringify(configs[index]),
    );
    return configs[index];
  }
  private calculateYearlyEnergyDCkWh(
    panelConfigs: PanelConfig[],
    panelsSelected: number,
  ) {
    // console.log('Iniciando cálculo de energía anual DC');
    // console.log('Configuraciones de paneles:', panelConfigs);
    // console.log('Número de paneles seleccionados:', panelsSelected);

    const { slope, intercept } = this.calculateLinearRegression(panelConfigs);
    // console.log('Pendiente calculada:', slope);
    // console.log('Intersección calculada:', intercept);

    const result = slope * panelsSelected + intercept;
    // console.log('Energía anual DC calculada:', result);

    return result;
  }

  private calculateLinearRegression(panelConfigs: PanelConfig[]): {
    slope: number;
    intercept: number;
  } {
    // console.log('Iniciando cálculo de regresión lineal');
    // console.log('Configuraciones de paneles:', panelConfigs);

    const N = panelConfigs.length;
    // console.log('Número de configuraciones:', N);

    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0;

    // Calcular las sumas necesarias
    panelConfigs.forEach((point, index) => {
      // console.log(`Procesando punto ${index + 1}:`, point);
      sumX += point.panelsCount;
      sumY += point.yearlyEnergyDcKwh;
      sumXY += point.panelsCount * point.yearlyEnergyDcKwh;
      sumX2 += point.panelsCount * point.panelsCount;
    });

    // console.log('Suma de X:', sumX);
    // console.log('Suma de Y:', sumY);
    // console.log('Suma de XY:', sumXY);
    // console.log('Suma de X^2:', sumX2);

    // Calcular la pendiente (a)
    const slope = (N * sumXY - sumX * sumY) / (N * sumX2 - sumX * sumX);
    // console.log('Pendiente calculada:', slope);

    // Calcular la intersección (b)
    const intercept = (sumY - slope * sumX) / N;
    // console.log('Intersección calculada:', intercept);

    return { slope, intercept };
  }

  async calculateSolarSavingsNearby(
    solarDataNearby: SolarData,
  ): Promise<ResultadosDto> {
    const {
      yearlyEnergyAcKwh,
      panels: { panelsCountApi, panelsSelected },
    } = solarDataNearby;
    // Calcular la proporción entre panelsSelected y panelsCountApi
    const proportion = panelsSelected / panelsCountApi;

    // Ajustar el valor de yearlyEnergyAcKwh en función de la proporción
    const adjustedYearlyEnergyAcKwh = yearlyEnergyAcKwh * proportion;

    // Crear un nuevo objeto SolarData con el valor ajustado
    const adjustedSolarDataNearby = {
      ...solarDataNearby,
      yearlyEnergyAcKwh: adjustedYearlyEnergyAcKwh,
    };

    // Llamar al servicio con los datos ajustados
    return await this.calculadoraService.calculateEnergySavings(
      adjustedSolarDataNearby,
    );
  }

  /**
   * Obtiene las URLs de las capas de datos solares (GeoTIFFs) desde la Google Solar API.
   * Incluye: flujo anual, flujo mensual, máscara de edificio, DSM, etc.
   * Las URLs son temporalmente firmadas y deben utilizarse de inmediato o cachearse en backend.
   */
  async getSolarDataLayers(
    latitude: number,
    longitude: number,
    radiusMeters: number = 30,
  ): Promise<SolarDataLayersResponse> {
    if (isNaN(latitude) || isNaN(longitude)) {
      throw new HttpException(
        'Coordenadas inválidas',
        HttpStatus.BAD_REQUEST,
      );
    }

    const apiKey = process.env.GOOGLE_API_KEY;

    const params = new URLSearchParams({
      'location.latitude': latitude.toFixed(5),
      'location.longitude': longitude.toFixed(5),
      radiusMeters: radiusMeters.toString(),
      view: 'FULL_LAYERS',
      key: apiKey,
    });

    const url = `https://solar.googleapis.com/v1/dataLayers:get?${params}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          Pragma: 'no-cache',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        let errorMsg = 'Error desconocido';
        try {
          const errorContent = await response.json();
          errorMsg = errorContent.error?.message ?? JSON.stringify(errorContent);
        } catch {
          errorMsg = `HTTP ${response.status}`;
        }
        console.warn(`[SolarService] dataLayers:get falló (${errorMsg}). Retornando mock.`);
        return this.getMockDataLayers(latitude, longitude);
      }

      const data: SolarDataLayersResponse = await response.json();
      return data;
    } catch (error) {
      console.warn(`[SolarService] Error en dataLayers:get (${error.message}). Retornando mock.`);
      return this.getMockDataLayers(latitude, longitude);
    }
  }

  /**
   * Datos de fallback para desarrollo local o cuando la API de Solar no está disponible.
   */
  private getMockDataLayers(latitude: number, longitude: number): SolarDataLayersResponse {
    return {
      imageryDate: { year: 2023, month: 6, day: 15 },
      imageryProcessedDate: { year: 2024, month: 1, day: 10 },
      dsmUrl: null,
      rgbUrl: null,
      maskUrl: null,
      annualFluxUrl: null,
      monthlyFluxUrl: null,
      hourlyShadeUrls: [],
      imageryQuality: 'LOW',
      isMock: true,
    };
  }

  /**
   * Calcula el factor de captación anual relativo del tejado (F_techo) a partir de los pitch y azimuth
   * de cada segmento de tejado en la configuración de paneles de referencia, para latitud -31.5° (San Juan).
   */
  private calculateRoofFactor(solarPotential: any, panelsSelected: number): number {
    if (!solarPotential || !solarPotential.solarPanelConfigs || solarPotential.solarPanelConfigs.length === 0) {
      return 1.0;
    }

    const configs = solarPotential.solarPanelConfigs;
    let closestConfig = configs[0];
    let minDiff = Math.abs(configs[0].panelsCount - panelsSelected);

    for (const config of configs) {
      const diff = Math.abs(config.panelsCount - panelsSelected);
      if (diff < minDiff) {
        minDiff = diff;
        closestConfig = config;
      }
    }

    if (!closestConfig || !closestConfig.roofSegmentSummaries || closestConfig.roofSegmentSummaries.length === 0) {
      return 1.0;
    }

    let totalPanels = 0;
    let weightedFactorSum = 0;

    closestConfig.roofSegmentSummaries.forEach((segment: any) => {
      const pitchRad = (segment.pitchDegrees || 0) * Math.PI / 180;
      const azimuthRad = (segment.azimuthDegrees || 0) * Math.PI / 180;

      // Inclinación óptima anual es 30° en San Juan
      const pitchOptRad = 30 * Math.PI / 180;

      // Pérdidas por desviación de inclinación y de orientación (azimuth)
      const loss = 1.2 * (1 - Math.cos(pitchRad - pitchOptRad)) + 
                   0.8 * Math.pow(Math.sin(pitchRad), 2) * (1 - Math.cos(azimuthRad));

      const segmentFactor = Math.max(0.5, 1 - loss);

      weightedFactorSum += segmentFactor * (segment.panelsCount || 0);
      totalPanels += (segment.panelsCount || 0);
    });

    return totalPanels > 0 ? (weightedFactorSum / totalPanels) : 1.0;
  }
}

