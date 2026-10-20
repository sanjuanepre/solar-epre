import { Injectable } from '@angular/core';
import { ResultadosFrontDTO } from '../interfaces/resultados-front-dto';
import { SharedService } from './shared.service';
import { FlujoIngresosMonetariosFront } from '../interfaces/flujo-ingresos-monetarios-front';

@Injectable({
  providedIn: 'root',
})
export class ResultadoService {
  private resultados!: ResultadosFrontDTO;
  constructor(
    private sharedService: SharedService
  ) {}

  generarResultados(response: any): ResultadosFrontDTO {
    
    const inversionInitial = response.parametros.inversionCostos.inversion;
this.sharedService.setInversionUsd(inversionInitial);
    const ahorroUsd = this.ahorrosUsdCalcular(
      response.periodoVeinteanalFlujoIngresosMonetarios
    );

    const resultados = {
      solarData: response.solarData,
      parametros: response.parametros,
      periodoVeinteanalGeneracionFotovoltaica:
        response.periodoVeinteanalGeneracionFotovoltaica,
      periodoVeinteanalFlujoEnergia: response.periodoVeinteanalFlujoEnergia,
      periodoVeinteanalFlujoIngresosMonetarios:
        response.periodoVeinteanalFlujoIngresosMonetarios,
      periodoVeinteanalCostoMantenimiento:
        response.periodoVeinteanalCostoMantenimiento,
      ahorroUsd: ahorroUsd,
      periodoVeinteanalEmisionesGEIEvitadas:
        response.periodoVeinteanalEmisionesGEIEvitadas,
      periodoVeinteanalProyeccionTarifas:
        response.periodoVeinteanalProyeccionTarifas,
      resultadosFinancieros: response.resultadosFinancieros,
      roofFactor: response.roofFactor,
    };

this.resultados = resultados;
    return this.resultados;
  }

  private ahorrosUsdCalcular(
    periodoVeinteanalFlujoIngresosMonetarios: FlujoIngresosMonetariosFront[]
  ) {


    const ahorroEnElectricidad = periodoVeinteanalFlujoIngresosMonetarios[0].ahorroEnElectricidadTotalUsd;
const ingresoPorInyeccion = periodoVeinteanalFlujoIngresosMonetarios[0].ingresoPorInyeccionElectricaUsd;
const sumaAhorros = ahorroEnElectricidad + ingresoPorInyeccion;
    this.sharedService.setAhorroAnualUsd(sumaAhorros);

return sumaAhorros;
  }
}
