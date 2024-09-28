import { FlujoEnergia } from 'src/calculadora/datos-tecnicos/flujo-energia/flujo-energia';
import { GeneracionFotovoltaica } from '../generacion-fotovoltaica/generacion-fotovoltaica.interface';
import { SolarData } from '../solar-data/solar-data.interface';
import { FlujoIngresosMonetarios } from '../flujo-ingresos-monetarios/flujo-ingresos-monetarios.interface';
import { EmisionesGeiEvitadas } from '../emisiones-gei-evitadas/emisiones-gei-evitadas.interface';
import { ProyeccionTarifas } from '../proyeccion-tarifas/proyeccion-tarifas.interface';
import { ResultadosCapitalPropio } from '../resultados-capital-propio/resultados-capital-propio.interface';
import { IndicadoresFinancieros } from '../indicadores-financieros/indicadores-financieros.interface';

export interface ResultadosDto {
  mensaje?: string;
  solarData: SolarData;
  periodoVeinteanalGeneracionFotovoltaica: GeneracionFotovoltaica[];
  periodoVeinteanalFlujoEnergia: FlujoEnergia[];
  periodoVeinteanalFlujoIngresosMonetarios: FlujoIngresosMonetarios[];
  periodoVeinteanalEmisionesGEIEvitadas: EmisionesGeiEvitadas[];
  periodoVeinteanalProyeccionTarifas: ProyeccionTarifas[];
  resultadosFinancieros: {
    casoConCapitalPropio: ResultadosCapitalPropio[],
    indicadoresFinancieros: IndicadoresFinancieros
  };
}
