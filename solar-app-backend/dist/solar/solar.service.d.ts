import { SolarCalculationDto } from './dto/solar-calculation.dto';
import { CalculadoraService } from 'src/calculadora/calculadora.service';
import { SolarData } from 'src/interfaces/solar-data/solar-data.interface';
import { ResultadosDto } from 'src/interfaces/resultados-dto/resultados-dto.interface';
export declare class SolarService {
    private readonly calculadoraService;
    constructor(calculadoraService: CalculadoraService);
    getSolarData(latitude: number, longitude: number): Promise<any>;
    private getMockSolarData;
    calculateSolarSavings(dto: SolarCalculationDto): Promise<any>;
    private calculateCentroid;
    private calculatePanelConfig;
    private calculateYearlyEnergyDCkWh;
    private calculateLinearRegression;
    calculateSolarSavingsNearby(solarDataNearby: SolarData): Promise<ResultadosDto>;
}
