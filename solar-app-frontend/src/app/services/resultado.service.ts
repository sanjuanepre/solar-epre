import { Injectable } from '@angular/core';
import { ResultadosFrontDTO } from '../interfaces/resultados-front-dto';
import { GmailService } from './gmail.service';
import { SharedService } from './shared.service';
import { FlujoIngresosMonetariosFront } from '../interfaces/flujo-ingresos-monetarios-front';

@Injectable({
  providedIn: 'root',
})
export class ResultadoService {
  private resultados!: ResultadosFrontDTO;
  constructor(
    private gmailService: GmailService,
    private sharedService: SharedService
  ) {}

  generarResultados(response: any): ResultadosFrontDTO {
    console.log('Iniciando generarResultados con response:', response);
    
    console.log('Verificando capacidad del panel:', response.solarData.panels.panelCapacityW);
    this.checkUpdatePanelCapacity(response.solarData.panels.panelCapacityW);
    
    const inversionInitial = response.parametros.inversionCostos.inversion;
    console.log('Inversión inicial:', inversionInitial);
    this.sharedService.setInversionUsd(inversionInitial);
    console.log('Inversión USD establecida en SharedService');

    console.log('Calculando ahorroUsd extrayendo los valores de periodoVeinteanalFlujoIngresosMonetarios...');
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
    };

    console.log('Resultados generados:', resultados);
    this.resultados = resultados;
    return this.resultados;
  }

  private ahorrosUsdCalcular(
    periodoVeinteanalFlujoIngresosMonetarios: FlujoIngresosMonetariosFront[]
  ) {
    console.log('Iniciando método ahorrosUsdCalcular en ResultadoService');
    console.log('Datos de entrada:', periodoVeinteanalFlujoIngresosMonetarios);

    console.log('Accediendo al primer elemento del array:');
    console.log('periodoVeinteanalFlujoIngresosMonetarios[0]:', periodoVeinteanalFlujoIngresosMonetarios[0]);

    const ahorroEnElectricidad = periodoVeinteanalFlujoIngresosMonetarios[0].ahorroEnElectricidadTotalUsd;
    console.log('Ahorro en electricidad:', ahorroEnElectricidad);

    const ingresoPorInyeccion = periodoVeinteanalFlujoIngresosMonetarios[0].ingresoPorInyeccionElectricaUsd;
    console.log('Ingreso por inyección eléctrica:', ingresoPorInyeccion);

    const sumaAhorros = ahorroEnElectricidad + ingresoPorInyeccion;
    console.log('Suma total de ahorros:', sumaAhorros);

    console.log('Estableciendo ahorro anual en USD en SharedService');
    this.sharedService.setAhorroAnualUsd(sumaAhorros);

    console.log('Finalizando método ahorrosUsdCalcular. Valor retornado:', sumaAhorros);
    return sumaAhorros;
  }

  private checkUpdatePanelCapacity(newPanelCapacityW: number): void {
    if (newPanelCapacityW !== 400) {
      this.gmailService.sendEmailChangeCapacityInApi(newPanelCapacityW);
    }
  }
}
