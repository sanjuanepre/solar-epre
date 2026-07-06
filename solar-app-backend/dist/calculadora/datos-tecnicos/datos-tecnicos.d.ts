import { GeneracionFotovoltaica } from 'src/interfaces/generacion-fotovoltaica/generacion-fotovoltaica.interface';
import { EmisionesGeiEvitadas } from 'src/interfaces/emisiones-gei-evitadas/emisiones-gei-evitadas.interface';
import { IflujoEnergia } from 'src/interfaces/iflujo-energia/iflujo-energia.interface';
import { SolarCalculationDto } from 'src/solar/dto/solar-calculation.dto';
import { SolarData } from 'src/interfaces/solar-data/solar-data.interface';
export declare class DatosTecnicos {
    private readonly eficienciaInstalacion;
    private readonly degradacionAnualPaneles;
    private readonly factorEmisiontCO2perMWh;
    private proporcionAutoconsumo;
    private proporcionInyeccion;
    private readonly actualYear;
    private dto;
    private solarData;
    constructor(dto: SolarCalculationDto, solarData: SolarData);
    getGeneracionFotovoltaica(yearlyEnergyACkWh: number): GeneracionFotovoltaica[];
    getFlujoEnergia(annualConsumption: number, yearlyEnergyACkWh: number, periodoVeinteanalGeneracionFotovoltaica: GeneracionFotovoltaica[]): IflujoEnergia[];
    getEmisionesGEIEvitadas(periodoVeinteanalGeneracionFotovoltaica: GeneracionFotovoltaica[]): EmisionesGeiEvitadas[];
}
