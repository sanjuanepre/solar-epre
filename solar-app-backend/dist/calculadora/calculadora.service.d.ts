import { SolarData } from 'src/interfaces/solar-data/solar-data.interface';
import { SolarCalculationDto } from 'src/solar/dto/solar-calculation.dto';
export declare class CalculadoraService {
    private datosTecnicos;
    private ecoFin;
    private resultadosFinancieros;
    constructor();
    calculateEnergySavings(solarData: SolarData, solarCalculationWithParameters?: SolarCalculationDto): any;
}
