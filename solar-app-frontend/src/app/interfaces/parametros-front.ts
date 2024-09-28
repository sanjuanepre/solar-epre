import { CaracteristicasSistemaFront } from "./caracteristicas-sistema-front";
import { CuadroTarifarioFront } from "./cuadro-tarifario-front";
import { EconomicasFront } from "./economicas-front";
import { InversionCostosFront } from "./inversion-costos-front";

export interface ParametrosFront {
    caracteristicasSistema: CaracteristicasSistemaFront,
    inversionCostos: InversionCostosFront,
    economicas: EconomicasFront,
    cuadroTarifarioActual: CuadroTarifarioFront[],
}
