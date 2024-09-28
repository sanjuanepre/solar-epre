import { Injectable, Injector } from '@angular/core';
import { ResultadosFrontDTO } from '../interfaces/resultados-front-dto';
import { SolarDataFront } from '../interfaces/solar-data-front';
import { SharedService } from './shared.service';
import { ConsumoService } from './consumo.service';
import { NearbyLocation } from '../interfaces/nearby-location';
import { SolarApiService } from './solar-api.service';

@Injectable({
  providedIn: 'root',
})
export class NearbyLocationService {
  private location!: NearbyLocation;
  private readonly carbonOffsetFactorKgPerMWh: number = 0.397;
  private resultadosFrontNearbyLocation!: ResultadosFrontDTO;
  private panelWidthMeters = 1.045;
  private panelHeightMeters = 1.879;

  constructor(
    private sharedService: SharedService,
    private consumoService: ConsumoService,
    private solarService: SolarApiService
  ) {}

  async calculate(location: NearbyLocation): Promise<ResultadosFrontDTO> {
    this.location = location;
    const solarData: SolarDataFront = this.calculateSolarData();
    return await this.solarService.calculateWithNearby(solarData);
  }

  private calculateSolarData(): SolarDataFront {
    const solarDataFront = {
      annualConsumption: this.calculateAnnualConsumption(),
      carbonOffsetFactorKgPerMWh: this.calculateCarbonOffSet(),
      panels: {
        panelCapacityW: this.getPanelCapacityW(),
        panelSize: {
          height: this.panelHeightMeters,
          width: this.panelWidthMeters,
        },
        panelsCountApi: this.location.cantidadDePaneles,
        maxPanelsPerSuperface: this.sharedService.getMaxPanelsPerSuperface(),
      },
      tarifaCategory: this.sharedService.getTarifaContratada(),
      yearlyEnergyAcKwh: this.location.energiaGeneradaAnual,
    };
    return solarDataFront;
  }

  private getPanelCapacityW() {
    return this.location.potenciaInstalada * 1000 / this.location.cantidadDePaneles;
  }

  private calculateCarbonOffSet(): number {
    return this.carbonOffsetFactorKgPerMWh;
  }

  private calculateAnnualConsumption() {
    return this.consumoService.getTotalConsumo();
  }

  getResultadosFront(): ResultadosFrontDTO {
    return this.resultadosFrontNearbyLocation;
  }

}
