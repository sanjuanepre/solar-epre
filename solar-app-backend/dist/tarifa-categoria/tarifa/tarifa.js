"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tarifa = void 0;
const tarifa_categoria_enum_1 = require("../tarifa-categoria-enum");
class Tarifa {
    constructor(categoria, potenciaMaximaContratadakW, tarifarioActual) {
        this.categoria = categoria;
        this.potenciaMaximaContratadakW = potenciaMaximaContratadakW ?? 0;
        const cargos = this.obtenerCargos(tarifarioActual);
        this.tarifaConsumoEnergiaArs = cargos.consumo;
        this.tarifaInyeccionEnergiaArs = cargos.inyeccion;
        this.impuestos = cargos.impuestos;
    }
    obtenerCargos(tarifarioActual) {
        if (tarifarioActual) {
            const cuadro = tarifarioActual.find((tarifa) => {
                return tarifa.nombre == this.categoria;
            });
            if (cuadro) {
                return {
                    consumo: cuadro.cargoVariableConsumoArsKWh,
                    inyeccion: cuadro.cargoVariableInyeccionArsKWh,
                    impuestos: cuadro.impuestos,
                };
            }
        }
        console.warn(`No se encontró un cuadro tarifario para la categoría ${this.categoria}. Usando valores por defecto.`);
        const cargosPorDefecto = Tarifa.cargosPorCategoria[this.categoria];
        if (!cargosPorDefecto) {
            throw new Error(`No se encontraron cargos por defecto para la categoría ${this.categoria}.`);
        }
        return {
            consumo: cargosPorDefecto.consumo,
            inyeccion: cargosPorDefecto.inyeccion,
            impuestos: 0,
        };
    }
}
exports.Tarifa = Tarifa;
Tarifa.cargosPorCategoria = {
    [tarifa_categoria_enum_1.TarifaCategoria.T1_G1]: { consumo: 74.90652, inyeccion: 74.90652 },
    [tarifa_categoria_enum_1.TarifaCategoria.T1_G2]: { consumo: 74.90652, inyeccion: 74.90652 },
    [tarifa_categoria_enum_1.TarifaCategoria.T1_G3]: { consumo: 74.90652, inyeccion: 74.90652 },
    [tarifa_categoria_enum_1.TarifaCategoria.T1_R1]: { consumo: 74.86879, inyeccion: 74.86879 },
    [tarifa_categoria_enum_1.TarifaCategoria.T1_R2]: { consumo: 74.86879, inyeccion: 74.86879 },
    [tarifa_categoria_enum_1.TarifaCategoria.T1_R3]: { consumo: 74.86879, inyeccion: 74.86879 },
    [tarifa_categoria_enum_1.TarifaCategoria.T2_CMP]: { consumo: 74.85091, inyeccion: 74.85091 },
    [tarifa_categoria_enum_1.TarifaCategoria.T2_SMP]: { consumo: 74.85091, inyeccion: 74.85091 },
    [tarifa_categoria_enum_1.TarifaCategoria.T3_BT]: { consumo: 74.804549, inyeccion: 74.804549 },
    [tarifa_categoria_enum_1.TarifaCategoria.T3_MT_13_2_KV]: { consumo: 68.8040826, inyeccion: 68.8040826 },
    [tarifa_categoria_enum_1.TarifaCategoria.T3_MT_33_KV]: { consumo: 68.8040826, inyeccion: 68.8040826 },
    [tarifa_categoria_enum_1.TarifaCategoria.TRA_SD]: { consumo: 71.72011625, inyeccion: 71.72011625 },
};
//# sourceMappingURL=tarifa.js.map