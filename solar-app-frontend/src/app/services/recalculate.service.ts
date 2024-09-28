import { EventEmitter, Injectable, Output } from '@angular/core';
import { SharedService } from './shared.service';
import { MapService } from './map.service';
import { SolarApiService } from './solar-api.service';

@Injectable({
  providedIn: 'root',
})
export class RecalculateService {
  @Output() recalculoIniciado: EventEmitter<boolean> = new EventEmitter<boolean>();
  constructor(private serviceShared: SharedService, private mapService: MapService, private solarApiService: SolarApiService) {
   
   }

  async recalculateyearlyEnergyACkWh(panels400WCount: number, factorPotencia: number): Promise<boolean> {
    return await this.solarApiService.recalculate(panels400WCount, factorPotencia);
  }

}
