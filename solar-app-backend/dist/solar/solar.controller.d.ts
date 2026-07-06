import { SolarService } from './solar.service';
import { SolarCalculationDto } from './dto/solar-calculation.dto';
import { ResultadosDto } from 'src/interfaces/resultados-dto/resultados-dto.interface';
import { SolarData } from 'src/interfaces/solar-data/solar-data.interface';
import { GoogleSheetsService } from 'src/google-sheets/google-sheets.service';
import { Response } from 'express';
export declare class SolarController {
    private readonly solarService;
    private readonly sheetsService;
    constructor(solarService: SolarService, sheetsService: GoogleSheetsService);
    calculateSolarSavings(solarCalculationDto: SolarCalculationDto, request: Request, res: Response): Promise<void>;
    private handleOfflineCase;
    calculateSolarSavingsNearby(solarDataNearby: SolarData): Promise<ResultadosDto>;
    getSolarData(latitude: number, longitude: number): Promise<any>;
    handleOptions(): void;
}
