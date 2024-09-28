import { Injectable } from '@nestjs/common';
import { SolarData } from 'src/interfaces/solar-data/solar-data.interface';
import { Tarifa } from 'src/tarifa-categoria/tarifa/tarifa';
import { DatosTecnicos } from './datos-tecnicos/datos-tecnicos';
import { EcoFin } from './eco-fin/eco-fin';
import { Resultados } from './resultados/resultados';
import { SolarCalculationDto } from 'src/solar/dto/solar-calculation.dto';
import { Parametros } from 'src/interfaces/sheets/parametros/parametros.interface';

@Injectable()
export class CalculadoraService {
  private datosTecnicos: DatosTecnicos;
  private ecoFin: EcoFin;
  private resultadosFinancieros: Resultados;
  constructor() {}
  // Método principal para calcular el ahorro energético
  calculateEnergySavings(solarData: SolarData, solarCalculationWithParameters?: SolarCalculationDto): any {
    // Obtener datos del API de Solar
    const yearlyEnergyACKwh: number = solarData.yearlyEnergyAcKwh * solarCalculationWithParameters.factorPotencia;
    const tarifaCategory: Tarifa = new Tarifa(
      solarData.tarifaCategory,
      solarCalculationWithParameters.potenciaMaxAsignada,
      solarCalculationWithParameters.parametros?.cuadroTarifarioActual,
    );
    const annualConsumption = solarData.annualConsumption;

    this.datosTecnicos = new DatosTecnicos(solarCalculationWithParameters, solarData);

    const periodoVeinteanalGeneracionFotovoltaica =
      this.datosTecnicos.getGeneracionFotovoltaica(yearlyEnergyACKwh);

    const periodoVeinteanalFlujoEnergia = this.datosTecnicos.getFlujoEnergia(
      annualConsumption,
      yearlyEnergyACKwh,
      periodoVeinteanalGeneracionFotovoltaica,
    );

    const periodoVeinteanalEmisionesGEIEvitadas =
      this.datosTecnicos.getEmisionesGEIEvitadas(
        periodoVeinteanalGeneracionFotovoltaica,
      );

    this.ecoFin = new EcoFin(solarCalculationWithParameters, solarData, tarifaCategory);

    const periodoVeinteanalProyeccionTarifas =
      this.ecoFin.getProyeccionDeTarifas(tarifaCategory);

    const periodoVeinteanalFlujoIngresosMonetarios =
      this.ecoFin.getFlujoIngresosMonetarios(
        periodoVeinteanalFlujoEnergia,
        periodoVeinteanalProyeccionTarifas
      );

      const periodoVeinteanalCostoMantenimiento =
      this.ecoFin.getCostoMantenimiento();

    this.resultadosFinancieros = new Resultados(
      periodoVeinteanalFlujoIngresosMonetarios,
      periodoVeinteanalEmisionesGEIEvitadas,
      periodoVeinteanalCostoMantenimiento,
      solarData,
      solarCalculationWithParameters,
    );
    const parametros: Parametros = solarCalculationWithParameters.parametros;
    parametros.inversionCostos.mantenimiento = periodoVeinteanalCostoMantenimiento[0].costoUsd;
    
    return {
      solarData,
      parametros,
      periodoVeinteanalGeneracionFotovoltaica,
      periodoVeinteanalFlujoEnergia,
      periodoVeinteanalFlujoIngresosMonetarios,
      periodoVeinteanalEmisionesGEIEvitadas,
      periodoVeinteanalProyeccionTarifas,
      periodoVeinteanalCostoMantenimiento,
      resultadosFinancieros: {
        casoConCapitalPropio: this.resultadosFinancieros.casoConCapitalPropio,
        indicadoresFinancieros:
          this.resultadosFinancieros.indicadoresFinancieros,
      },
    };
  }
}
