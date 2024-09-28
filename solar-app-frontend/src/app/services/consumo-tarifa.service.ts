import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SharedService } from './shared.service';

@Injectable({
  providedIn: 'root'
})
export class ConsumoTarifaService {

  private consumoMensualPorTarifa: { [key: string]: number[] } = {
    'T1-R': [900, 700, 600, 400, 400, 600, 900, 700, 500, 500, 700, 900],
    'T1-G': [1600, 1300, 1300, 1000, 1100, 1200, 1200, 1100, 1100, 1200, 1500, 1900],
    'T2-SMP': [2700, 2600, 2500, 1900, 2100, 2300, 2200, 2200, 1900, 2000, 2500, 2300],
    'T2-CMP': [2900, 4100, 4200, 3600, 4300, 4600, 4500, 5000, 6500, 6800, 7500, 7300],
    'T3-BT': [6000, 8500, 8900, 7800, 9400, 9800, 10000, 10700, 14600, 14900, 15200, 15500],
    'T3-MT 13.2R': [7900, 10800, 11400, 9600, 11700, 11500, 11900, 13100, 15600, 16300, 16900, 16700],
    'TRA-SD': [4400, 5300, 5100, 4300, 4300, 3400, 3800, 5700, 8600, 9700, 10700, 11300]
  };

  constructor(private sharedService: SharedService){}

  

  getConsumoMensual(tarifa: string): number[] {
    this.updateConsumosMensuales(this.consumoMensualPorTarifa[tarifa])
    return this.consumoMensualPorTarifa[tarifa] || [];
  }

  updateConsumosMensuales(consumos: number[]): void {
    this.sharedService.setConsumosMensuales(consumos);
  }
}
