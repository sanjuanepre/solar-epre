import { ConfigService } from '@nestjs/config';
import { sheets_v4 } from 'googleapis';
import { CaracteristicasSistema } from 'src/interfaces/sheets/caracteristicas-sistema/caracteristicas-sistema.interface';
import { Economicas } from 'src/interfaces/sheets/cotizacion/economicas.interface';
import { CuadroTarifario } from 'src/interfaces/sheets/cuadro-tarifario/cuadro-tarifario.interface';
import { InversionCostos } from 'src/interfaces/sheets/inversion-ycostos/inversion-costos.interface';
import { SolarCalculationDto } from 'src/solar/dto/solar-calculation.dto';
export declare class VariablesOnlineService {
    private readonly configService;
    private readonly spreadsheetId;
    private readonly rangeCaracteristicas;
    private readonly rangeEconomicas;
    private readonly rangeCostos;
    private readonly rangeCuadroTarifario;
    private readonly rangeImpuestos;
    constructor(configService: ConfigService);
    getCuadroTarifario(googleSheetClient: sheets_v4.Sheets, economicas: Economicas): Promise<CuadroTarifario[]>;
    getInversionYCostos(googleSheetClient: sheets_v4.Sheets, economicas: Economicas, solarCalculationDto: SolarCalculationDto): Promise<InversionCostos>;
    getCaracteristicasSistema(googleSheetClient: sheets_v4.Sheets): Promise<CaracteristicasSistema>;
    getEconomicas(googleSheetClient: sheets_v4.Sheets): Promise<Economicas>;
    private parseFloatWithFormat;
}
