import { Injectable } from '@angular/core';
import { SharedService } from './shared.service';
import { ResultadosFrontDTO } from '../interfaces/resultados-front-dto';

@Injectable({
  providedIn: 'root',
})
export class CalculatePredefinedCoordService {
  resultados!: ResultadosFrontDTO;

  constructor(private readonly sharedService: SharedService) {}

  calculateWithPredefinedCoord(): any {
    const nearbyLocation = this.sharedService.getNearbyLocation();
    try {
      return this.generarResultados(nearbyLocation);
    } catch (error) {
      console.log(
        'error al generar los resultados con las coordenadas definidas'
      );
    }
  }

  generarResultados(nearbyLocation: any): ResultadosFrontDTO {
    // console.log({response});

    // return (this.resultados = {
    //   solarData: response.solarData,
    //   periodoVeinteanalGeneracionFotovoltaica: response.periodoVeinteanalGeneracionFotovoltaica,
    //   periodoVeinteanalFlujoEnergia: response.periodoVeinteanalFlujoEnergia,
    //   periodoVeinteanalFlujoIngresosMonetarios:
    //     response.periodoVeinteanalFlujoIngresosMonetarios,
    //   periodoVeinteanalEmisionesGEIEvitadas: response.periodoVeinteanalEmisionesGEIEvitadas,
    //   periodoVeinteanalProyeccionTarifas: response.periodoVeinteanalProyeccionTarifas,
    //   resultadosFinancieros: response.resultadosFinancieros
    // });
    return this.resultados;
  }
}
