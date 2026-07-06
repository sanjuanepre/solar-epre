import { GoogleSheetsService } from './google-sheets.service';
import { MesesConsumo } from 'src/interfaces/meses-consumo/meses-consumo.interface';
export declare class GoogleSheetsController {
    private readonly googleSheetsService;
    constructor(googleSheetsService: GoogleSheetsService);
    readValueCalculadora(tabName: string, range: string): Promise<void>;
    cargarConsumosAnualesEnCalculadora(meses: MesesConsumo[]): Promise<any>;
    getResultados(): Promise<void>;
}
