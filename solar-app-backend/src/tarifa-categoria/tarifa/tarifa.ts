import { CuadroTarifario } from 'src/interfaces/sheets/cuadro-tarifario/cuadro-tarifario.interface';
import { TarifaCategoria } from '../tarifa-categoria-enum';

export class Tarifa {
  categoria: TarifaCategoria;
  potenciaMaximaContratadakW?: number;
  tarifaConsumoEnergiaArs: number;
  tarifaInyeccionEnergiaArs: number;
  impuestos: number;

  private static readonly cargosPorCategoria: {
    [key in TarifaCategoria]: { consumo: number; inyeccion: number };
  } = {
    [TarifaCategoria.T1_G1]: { consumo: 74.90652, inyeccion: 74.90652 },
    [TarifaCategoria.T1_G2]: { consumo: 74.90652, inyeccion: 74.90652 },
    [TarifaCategoria.T1_G3]: { consumo: 74.90652, inyeccion: 74.90652 },
    [TarifaCategoria.T1_R1]: { consumo: 74.86879, inyeccion: 74.86879 },
    [TarifaCategoria.T1_R2]: { consumo: 74.86879, inyeccion: 74.86879 },
    [TarifaCategoria.T1_R3]: { consumo: 74.86879, inyeccion: 74.86879 },
    [TarifaCategoria.T2_CMP]: { consumo: 74.85091, inyeccion: 74.85091 },
    [TarifaCategoria.T2_SMP]: { consumo: 74.85091, inyeccion: 74.85091 },
    [TarifaCategoria.T3_BT]: { consumo: 74.804549, inyeccion: 74.804549 },
    [TarifaCategoria.T3_MT_13_2_KV]: { consumo: 68.8040826, inyeccion: 68.8040826 },
    [TarifaCategoria.T3_MT_33_KV]: { consumo: 68.8040826, inyeccion: 68.8040826 },
    [TarifaCategoria.TRA_SD]: { consumo: 71.72011625, inyeccion: 71.72011625 },
  };

  constructor(
    categoria: TarifaCategoria,
    potenciaMaximaContratadakW: number,
    tarifarioActual?: CuadroTarifario[],
  ) {
    this.categoria = categoria;
    this.potenciaMaximaContratadakW = potenciaMaximaContratadakW ?? 0;

    const cargos = this.obtenerCargos(tarifarioActual);
    
    this.tarifaConsumoEnergiaArs = cargos.consumo;
    this.tarifaInyeccionEnergiaArs = cargos.inyeccion;
    this.impuestos = cargos.impuestos;
  }

  private obtenerCargos(tarifarioActual?: CuadroTarifario[]): {
    consumo: number;
    inyeccion: number;
    impuestos: number;
  } {

    if (tarifarioActual) {
      const cuadro = tarifarioActual.find((tarifa) => {
        return tarifa.nombre == this.categoria;
      });

      if (cuadro) {
        console.log("cuadro tarifario ", cuadro);
        
        return {
          consumo: cuadro.cargoVariableConsumoArsKWh,
          inyeccion: cuadro.cargoVariableInyeccionArsKWh,
          impuestos: cuadro.impuestos,
        };
      }
    }

    // Manejar el caso en el que no se encuentra un cuadro
    console.warn(
      `No se encontró un cuadro tarifario para la categoría ${this.categoria}. Usando valores por defecto.`,
    );
    const cargosPorDefecto = Tarifa.cargosPorCategoria[this.categoria];

    if (!cargosPorDefecto) {
      throw new Error(
        `No se encontraron cargos por defecto para la categoría ${this.categoria}.`,
      );
    }

    return {
      consumo: cargosPorDefecto.consumo,
      inyeccion: cargosPorDefecto.inyeccion,
      impuestos: 0,
    };
  }

}
