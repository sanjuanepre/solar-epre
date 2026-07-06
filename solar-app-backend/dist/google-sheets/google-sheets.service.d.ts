import { OnModuleInit } from '@nestjs/common';
import { sheets_v4 } from 'googleapis';
import { SolarCalculationDto } from 'src/solar/dto/solar-calculation.dto';
import { CheckInitService } from './check-init/check-init.service';
import { VariablesOnlineService } from './variables-online/variables-online.service';
import { CalculadoraService } from 'src/calculadora/calculadora.service';
export declare class GoogleSheetsService implements OnModuleInit {
    private checkInitService;
    private variablesOnlineService;
    private calculadoraService;
    private googleSheetClient;
    constructor(checkInitService: CheckInitService, variablesOnlineService: VariablesOnlineService, calculadoraService: CalculadoraService);
    onModuleInit(): Promise<void>;
    getGoogleSheetClient(): Promise<sheets_v4.Sheets>;
    isCalculadoraOnline(): Promise<any>;
    addParametersToSolarCalculationDto(solarCalculationDto: SolarCalculationDto): Promise<any>;
    private getCuadroTarifario;
    private getInversionYCostos;
    private getEconomicas;
    private getCaracteristicasSistema;
}
