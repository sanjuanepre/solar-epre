import axios from 'axios';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { SolarCalculationDto } from './dto/solar-calculation.dto';
import { CalculadoraService } from 'src/calculadora/calculadora.service';
import { SolarData } from 'src/interfaces/solar-data/solar-data.interface';
import { PanelConfig } from 'src/interfaces/panel-config/panel-config.interface';
import { ResultadosDto } from 'src/interfaces/resultados-dto/resultados-dto.interface';
import { YearlyAnualConfigurations } from 'src/interfaces/yearly-anual-configurations/yearly-anual-configurations.interface';

@Injectable()
export class SolarService {
  constructor(private readonly calculadoraService: CalculadoraService) {}

  /* async getSolarData(latitude: number, longitude: number): Promise<any> {
    if (isNaN(latitude) || isNaN(longitude)) {
      throw new HttpException(
        'Invalid coordinates received',
        HttpStatus.BAD_REQUEST,
      );
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${latitude}&location.longitude=${longitude}&key=${apiKey}`;

    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new HttpException(
          'Location out of coverage',
          HttpStatus.BAD_REQUEST,
        );
      } else {
        console.error('Error fetching data from API:', error.message);
        throw new HttpException(
          `An error occurred while fetching data: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  } */

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
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache',
          'Accept-Encoding': 'gzip, deflate, br' 
        }
      });

      // Verifica si la respuesta es exitosa
      if (!response.ok) {
        if (response.status === 404) {
          throw new HttpException(
            'Location out of coverage',
            HttpStatus.BAD_REQUEST,
          );
        } else {
          const errorContent = await response.json(); // Obtiene el contenido del error
          console.error('Error fetching data from API:', errorContent);
          throw new HttpException(
            `An error occurred while fetching data: ${errorContent.error.message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }
    
      // Si la respuesta es exitosa, convierte los datos a JSON
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching data from API:', error.message);
      throw new HttpException(
        `An error occurred: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async calculateSolarSavings(dto: SolarCalculationDto): Promise<any> {
    const { latitude, longitude } = this.calculateCentroid(
      dto.polygonCoordinates,
    );

    const solarDataApi = await this.getSolarData(latitude, longitude);

    const solarPanelConfig: PanelConfig = this.calculatePanelConfig(
      solarDataApi.solarPotential,
      dto.panelsSupported,
      dto.panelsSelected,
    );

    const yearlysAnualConfigurations = solarDataApi.solarPotential.solarPanelConfigs.map(
      (item: any) => {
        return {
          panelsCount: item.panelsCount,
          yearlyEnergyDcKwh: item.yearlyEnergyDcKwh,
        };
      },
    );
    
    const solarData: SolarData = {
      annualConsumption: dto.annualConsumption,
      yearlyEnergyAcKwh: solarPanelConfig.yearlyEnergyDcKwh * dto.parametros.caracteristicasSistema.eficienciaInstalacion,
      panels: {
        panelsCountApi: solarPanelConfig.panelsCount,
        maxPanelsPerSuperface: dto.panelsSupported,
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

    return await this.calculadoraService.calculateEnergySavings(solarData, dto);
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
    panelsSupported: number,
    panelsSelected?: number,
  ): PanelConfig {
    if (panelsSupported < 4) {
      panelsSupported = 4;
    }
    const configs = solarPotential.solarPanelConfigs;
    const panelsCount = panelsSelected ?? panelsSupported;
    const index = configs.findIndex(
      (element: PanelConfig) => element.panelsCount === panelsCount,
    );
    // Si no se encuentra ningún elemento que cumpla con la condición, devuelve null
    if (index === -1) {
      return configs[configs.length - 1];
    }

    if (index === 0) {
      return configs[0];
    }

    return configs[index];
  }

  async calculateSolarSavingsNearby(
    solarDataNearby: SolarData,
  ): Promise<ResultadosDto> {
    const {
      yearlyEnergyAcKwh,
      panels: { panelsCountApi, maxPanelsPerSuperface },
    } = solarDataNearby;
    // Calcular la proporción entre maxPanelsPerSuperface y panelsCountApi
    const proportion = maxPanelsPerSuperface / panelsCountApi;

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
}
