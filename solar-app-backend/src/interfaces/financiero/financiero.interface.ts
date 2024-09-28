import { FlujoFinanciero } from "../flujo-financiero/flujo-financiero.interface";

export interface Financiero {
    flujoDeIngresos?: FlujoFinanciero[];
    flujoDeEgresos?: FlujoFinanciero[];
    inversiones?: FlujoFinanciero[];
    flujoDeFondos?: FlujoFinanciero[];
    flujoAcumulado?: FlujoFinanciero[];
}
