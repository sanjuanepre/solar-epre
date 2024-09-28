import { CostoMantenimientoFront } from "./costo-mantenimiento-front";
import { EmisionesGeiEvitadasFront } from "./emisiones-gei-evitadas-front";
import { FlujoEnergiaFront } from "./flujo-energia-front";
import { FlujoIngresosMonetariosFront } from "./flujo-ingresos-monetarios-front";
import { GeneracionFotovoltaicaFront } from "./generacion-fotovoltaica-front";
import { ParametrosFront } from "./parametros-front";
import { ProyeccionTarifasFront } from "./proyeccion-tarifas-front";
import { Resultados } from "./resultados";
import { SolarDataFront } from "./solar-data-front";

export interface ResultadosFrontDTO {
  solarData: SolarDataFront;
  parametros?: ParametrosFront,
  periodoVeinteanalGeneracionFotovoltaica: GeneracionFotovoltaicaFront[];
  periodoVeinteanalFlujoEnergia: FlujoEnergiaFront[];
  periodoVeinteanalFlujoIngresosMonetarios: FlujoIngresosMonetariosFront[];
  ahorroUsd: number;
  periodoVeinteanalEmisionesGEIEvitadas: EmisionesGeiEvitadasFront[];
  periodoVeinteanalProyeccionTarifas: ProyeccionTarifasFront[];
  periodoVeinteanalCostoMantenimiento: CostoMantenimientoFront[];
  resultadosFinancieros: {
    casoConCapitalPropio: any[],
    indicadoresFinancieros: any

  };
}
