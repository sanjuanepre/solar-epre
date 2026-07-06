import { EmisionesGeiEvitadas } from 'src/interfaces/emisiones-gei-evitadas/emisiones-gei-evitadas.interface';
import { IndicadoresFinancieros } from 'src/interfaces/indicadores-financieros/indicadores-financieros.interface';
import { ResultadosCapitalPropio } from 'src/interfaces/resultados-capital-propio/resultados-capital-propio.interface';
import { FlujoIngresosMonetarios } from 'src/interfaces/flujo-ingresos-monetarios/flujo-ingresos-monetarios.interface';
import { SolarCalculationDto } from 'src/solar/dto/solar-calculation.dto';
import { CostoMantenimiento } from 'src/interfaces/costo-mantenimiento/costo-mantenimiento.interface';
import { SolarData } from 'src/interfaces/solar-data/solar-data.interface';
export declare class Resultados {
    private readonly tasaDescuento;
    private _casoConCapitalPropio;
    private _indicadoresFinancieros;
    private _emisionesGEIEvitadas;
    private dto;
    private solarData;
    constructor(periodoVeinteanalFlujoIngresosMonetarios: FlujoIngresosMonetarios[], periodoVeinteanalEmisionesGEIEvitadas: EmisionesGeiEvitadas[], periodoVeinteanalCostoMantenimiento: CostoMantenimiento[], solarData: SolarData, dto?: SolarCalculationDto);
    private generarResultadosCapitalPropio;
    private generarIndicadoresFinancieros;
    private calcularNPV;
    private calcularTIR;
    private calcularPlazoRetorno;
    get casoConCapitalPropio(): ResultadosCapitalPropio[];
    set casoConCapitalPropio(value: ResultadosCapitalPropio[]);
    get indicadoresFinancieros(): IndicadoresFinancieros;
    set indicadoresFinancieros(value: IndicadoresFinancieros);
    get emisionesGEIEvitadas(): EmisionesGeiEvitadas[];
    set emisionesGEIEvitadas(value: EmisionesGeiEvitadas[]);
}
