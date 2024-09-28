export interface CuadroTarifarioFront {
  nombre:
    | 'T1-R'
    | 'T1-G'
    | 'T2-SMP'
    | 'T2-CMP'
    | 'T3-BT'
    | 'T3-MT'
    | 'TRA-SD'
    | 'T3-MT 13.2R';
  cargoVariableConsumoArsKWh: number;
  cargoVariableInyeccionArsKWh: number;
  tension: 'baja' | 'media' | 'alta';
  impuestos: number;
}
