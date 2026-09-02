import axios from 'axios';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { SolarCalculationDto } from './dto/solar-calculation.dto';
import { CalculadoraService } from '../calculadora/calculadora.service';
import { SolarData } from '../interfaces/solar-data/solar-data.interface';
import { PanelConfig } from '../interfaces/panel-config/panel-config.interface';
import { ResultadosDto } from '../interfaces/resultados-dto/resultados-dto.interface';
import { SolarDataLayersResponse } from './dto/solar-data-layers.interface';
import { Response } from 'express';

@Injectable()
export class SolarService {
  constructor(private readonly calculadoraService: CalculadoraService) {}

  // Polígono perimetral oficial simplificado de la Provincia de San Juan
  private static readonly SAN_JUAN_POLYGON: { lat: number; lng: number }[] = [
    { lat: -28.37, lng: -69.80 }, // Noroeste Iglesia / Límite Chile - La Rioja
    { lat: -28.30, lng: -69.25 }, // Norte Iglesia / La Rioja
    { lat: -28.45, lng: -68.80 }, // Norte Jáchal / La Rioja
    { lat: -28.95, lng: -68.45 }, // Huaco / La Rioja
    { lat: -30.00, lng: -67.25 }, // Ischigualasto / Valle Fértil Norte
    { lat: -30.50, lng: -67.15 }, // Valle Fértil Este
    { lat: -31.10, lng: -67.20 }, // Valle Fértil Sureste
    { lat: -31.60, lng: -66.85 }, // Bermejo / Caucete Este / La Rioja - San Luis
    { lat: -31.95, lng: -66.75 }, // El Encón / Desaguadero Sureste
    { lat: -32.25, lng: -67.40 }, // Límite Sur Caucete / 25 de Mayo / Mendoza
    { lat: -32.40, lng: -68.20 }, // Lagunas de Guanacache / 25 de Mayo Sur
    { lat: -32.65, lng: -68.70 }, // Sarmiento Sur / Media Agua / Mendoza
    { lat: -32.35, lng: -69.50 }, // Barreal Sur / Calingasta / Mendoza
    { lat: -32.20, lng: -70.40 }, // Paso de los Patos / Suroeste Calingasta / Chile
    { lat: -31.50, lng: -70.55 }, // Cordillera Central Calingasta / Chile
    { lat: -30.50, lng: -70.30 }, // Paso de Agua Negra / Iglesia / Chile
    { lat: -29.30, lng: -69.95 }, // Cordillera Norte Iglesia / Chile
  ];

  public isWithinSanJuan(lat: number, lng: number): boolean {
    if (lat < -32.70 || lat > -28.25 || lng < -70.70 || lng > -66.70) {
      return false;
    }

    const polygon = SolarService.SAN_JUAN_POLYGON;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng, yi = polygon[i].lat;
      const xj = polygon[j].lng, yj = polygon[j].lat;

      const intersect = ((yi > lat) !== (yj > lat))
          && (lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  }

  async getSolarData(latitude: number, longitude: number): Promise<any> {
    // Verifica si las coordenadas son válidas
    if (isNaN(latitude) || isNaN(longitude)) {
      throw new HttpException(
        'Invalid coordinates received',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!this.isWithinSanJuan(latitude, longitude)) {
      throw new HttpException(
        'La ubicación se encuentra fuera del territorio de la Provincia de San Juan.',
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

    // Factor de estructura e inclinación: +12% directo para 'optimo' (30° al Norte) respecto a 'coplanar'
    const factorEstructura = dto.tipoEstructura === 'optimo' ? 1.12 : 1.0;
    solarPanelConfig.yearlyEnergyDcKwh = (solarPanelConfig.yearlyEnergyDcKwh || 0) * factorEstructura;

    const yearlysAnualConfigurations =
      solarDataApi.solarPotential.solarPanelConfigs.map((item: any) => {
        const energyDc = (item.yearlyEnergyDcKwh || 0) * factorEstructura;
        return {
          panelsCount: item.panelsCount,
          yearlyEnergyDcKwh: energyDc,
        };
      });

    const yearlyEnergyAcKwh =
      solarPanelConfig.yearlyEnergyDcKwh *
      dto.parametros.caracteristicasSistema.eficienciaInstalacion;

    const solarData: SolarData = {
      annualConsumption: dto.annualConsumption,
      yearlyEnergyAcKwh: yearlyEnergyAcKwh,
      panels: {
        panelsCountApi: solarPanelConfig.panelsCount,
        panelsSelected: dto.panelsSelected,
        panelCapacityW: solarDataApi.solarPotential.panelCapacityWatts || 400,
        panelSize: {
          height: solarDataApi.solarPotential.panelHeightMeters || 1.65,
          width: solarDataApi.solarPotential.panelWidthMeters || 0.99,
        },
        yearlysAnualConfigurations,
      },
      carbonOffsetFactorKgPerMWh:
        solarDataApi.solarPotential.carbonOffsetFactorKgPerMwh || 397,
      tarifaCategory: dto.categoriaSeleccionada,
    };

    const result = await this.calculadoraService.calculateEnergySavings(
      solarData,
      dto,
    );

    result.roofFactor = dto.tipoEstructura === 'optimo' ? (1 / 1.12) : 1.0;

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
    solarCalculationWithParameters: SolarCalculationDto
  ): Promise<ResultadosDto> {
    const yearlyEnergyAcKwh = solarDataNearby?.yearlyEnergyAcKwh ?? 0;
    const panelsCountApi = solarDataNearby?.panels?.panelsCountApi ?? 1;
    const panelsSelected = solarDataNearby?.panels?.panelsSelected ?? 1;
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
      solarCalculationWithParameters
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-cache',
        signal: controller.signal,
        headers: {
          Pragma: 'no-cache',
          'Cache-Control': 'no-cache',
        },
      });
      clearTimeout(timeoutId);

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
      return {
        ...data,
        annualFluxUrl: this.transformToProxyUrl(data.annualFluxUrl),
        monthlyFluxUrl: this.transformToProxyUrl(data.monthlyFluxUrl),
        maskUrl: this.transformToProxyUrl(data.maskUrl),
        dsmUrl: this.transformToProxyUrl(data.dsmUrl),
        rgbUrl: this.transformToProxyUrl(data.rgbUrl),
        hourlyShadeUrls: Array.isArray(data.hourlyShadeUrls)
          ? (data.hourlyShadeUrls.map((u) => this.transformToProxyUrl(u)).filter(Boolean) as string[])
          : [],
      };
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn(`[SolarService] Error en dataLayers:get (${error.message}). Retornando mock.`);
      return this.getMockDataLayers(latitude, longitude);
    }
  }

  /**
   * Transforma una URL directa de Google Solar GeoTIFF a una ruta relativa de proxy seguro
   * sin exponer la Google API Key al cliente.
   */
  private transformToProxyUrl(googleGeoTiffUrl: string | null): string | null {
    if (!googleGeoTiffUrl) return null;
    try {
      const parsedUrl = new URL(googleGeoTiffUrl);
      const id = parsedUrl.searchParams.get('id');
      if (id) {
        return `/solar/geotiff?id=${encodeURIComponent(id)}`;
      }
      return `/solar/geotiff?url=${encodeURIComponent(googleGeoTiffUrl)}`;
    } catch {
      return `/solar/geotiff?url=${encodeURIComponent(googleGeoTiffUrl)}`;
    }
  }

  /**
   * Proxy de descarga seguro para archivos ráster GeoTIFF de Google Solar API.
   * Valida estrictamente la procedencia para prevenir SSRF e inyecta la API Key del servidor.
   */
  async proxyGeoTiff(
    params: { id?: string; url?: string },
    res: Response,
  ): Promise<void> {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new HttpException(
        'GOOGLE_API_KEY no configurada en las variables de entorno del servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    let targetUrl: string;

    if (params.id) {
      const safeId = params.id.trim();
      if (!/^[a-zA-Z0-9_\-\.\:\/+=]+$/.test(safeId)) {
        throw new HttpException(
          'El parámetro "id" de GeoTIFF contiene caracteres inválidos',
          HttpStatus.BAD_REQUEST,
        );
      }
      targetUrl = `https://solar.googleapis.com/v1/geoTiff:get?id=${encodeURIComponent(safeId)}&key=${apiKey}`;
    } else if (params.url) {
      try {
        const parsedUrl = new URL(params.url);
        // Reglas estrictas de validación Anti-SSRF: solo HTTPS y dominio oficial solar.googleapis.com
        if (
          parsedUrl.protocol !== 'https:' ||
          parsedUrl.hostname !== 'solar.googleapis.com' ||
          !parsedUrl.pathname.startsWith('/v1/geoTiff:get')
        ) {
          throw new HttpException(
            'La URL especificada no pertenece al servicio autorizado de Google Solar',
            HttpStatus.FORBIDDEN,
          );
        }
        parsedUrl.searchParams.set('key', apiKey);
        targetUrl = parsedUrl.toString();
      } catch (err: any) {
        if (err instanceof HttpException) throw err;
        throw new HttpException(
          'URL de GeoTIFF malformada',
          HttpStatus.BAD_REQUEST,
        );
      }
    } else {
      throw new HttpException(
        'Debe proveer el parámetro "id" o "url"',
        HttpStatus.BAD_REQUEST,
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errDetails = `HTTP ${response.status}`;
        try {
          const errJson = await response.json();
          errDetails = errJson.error?.message || JSON.stringify(errJson);
        } catch {}
        console.warn(`[SolarService] Error en Google Solar geoTiff:get (${errDetails})`);
        res.status(response.status).json({
          mensaje: 'Error retornado por Google Solar API al consultar el GeoTIFF',
          detalle: errDetails,
        });
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader('Content-Type', 'image/tiff');
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
      res.status(HttpStatus.OK).send(buffer);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('[SolarService] Error de conexión al descargar GeoTIFF:', err);
      res.status(HttpStatus.BAD_GATEWAY).json({
        mensaje: 'Error de conexión al obtener el archivo ráster GeoTIFF desde Google Solar',
        error: err?.message || String(err),
      });
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
    let minDiff = Math.abs((configs[0].panelsCount || 0) - (panelsSelected || 0));

    for (const config of configs) {
      const diff = Math.abs((config.panelsCount || 0) - (panelsSelected || 0));
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

    const factor = totalPanels > 0 ? (weightedFactorSum / totalPanels) : 1.0;
    return isNaN(factor) || factor <= 0 ? 1.0 : factor;
  }
}

