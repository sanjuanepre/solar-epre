import { CaracteristicasSistema } from "../caracteristicas-sistema/caracteristicas-sistema.interface";
import { Economicas } from "../cotizacion/economicas.interface";
import { CuadroTarifario } from "../cuadro-tarifario/cuadro-tarifario.interface";
import { InversionCostos } from "../inversion-ycostos/inversion-costos.interface";

export interface Parametros {
    caracteristicasSistema: CaracteristicasSistema,
    inversionCostos: InversionCostos,
    economicas: Economicas,
    cuadroTarifarioActual: CuadroTarifario[],
}
