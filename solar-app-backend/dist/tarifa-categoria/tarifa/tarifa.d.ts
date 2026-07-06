import { CuadroTarifario } from 'src/interfaces/sheets/cuadro-tarifario/cuadro-tarifario.interface';
import { TarifaCategoria } from '../tarifa-categoria-enum';
export declare class Tarifa {
    categoria: TarifaCategoria;
    potenciaMaximaContratadakW?: number;
    tarifaConsumoEnergiaArs: number;
    tarifaInyeccionEnergiaArs: number;
    impuestos: number;
    private static readonly cargosPorCategoria;
    constructor(categoria: TarifaCategoria, potenciaMaximaContratadakW: number, tarifarioActual?: CuadroTarifario[]);
    private obtenerCargos;
}
