import { TarifaCategoria } from "src/tarifa-categoria/tarifa-categoria-enum";
import { Parametros } from "src/interfaces/sheets/parametros/parametros.interface";
export declare class SolarCalculationDto {
    annualConsumption: number;
    polygonCoordinates: any[];
    categoriaSeleccionada: TarifaCategoria;
    polygonArea: number;
    panelsSelected?: number;
    potenciaMaxAsignada: number;
    parametros?: Parametros;
    factorPotencia?: number | 1;
}
