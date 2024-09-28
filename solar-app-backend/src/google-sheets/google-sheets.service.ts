import { Injectable, OnModuleInit } from '@nestjs/common';
import { google, sheets_v4 } from 'googleapis';
import { SolarCalculationDto } from 'src/solar/dto/solar-calculation.dto';
import { CheckInitService } from './check-init/check-init.service';
import { CaracteristicasSistema } from 'src/interfaces/sheets/caracteristicas-sistema/caracteristicas-sistema.interface';
import { VariablesOnlineService } from './variables-online/variables-online.service';
import { InversionCostos } from 'src/interfaces/sheets/inversion-ycostos/inversion-costos.interface';
import { Economicas } from 'src/interfaces/sheets/cotizacion/economicas.interface';
import { CuadroTarifario } from 'src/interfaces/sheets/cuadro-tarifario/cuadro-tarifario.interface';
import { Parametros } from 'src/interfaces/sheets/parametros/parametros.interface';
import { CalculadoraService } from 'src/calculadora/calculadora.service';
import { TarifaCategoria } from 'src/tarifa-categoria/tarifa-categoria-enum';

@Injectable()
export class GoogleSheetsService implements OnModuleInit {
  private googleSheetClient: sheets_v4.Sheets;

  constructor(
    private checkInitService: CheckInitService,
    private variablesOnlineService: VariablesOnlineService,
    private calculadoraService: CalculadoraService,
  ) {}

  async onModuleInit() {
    this.googleSheetClient = await this.getGoogleSheetClient();
  }

  async getGoogleSheetClient(): Promise<sheets_v4.Sheets> {
    const auth = new google.auth.GoogleAuth({
      keyFile: './src/config/credentials.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const authClient = await auth.getClient();
    if (!(authClient instanceof google.auth.JWT)) {
      throw new Error('authClient must be an instance of google.auth.JWT');
    }
    return google.sheets({
      version: 'v4',
      auth: authClient,
    });
  }

  async isCalculadoraOnline(): Promise<any> {
    return await this.checkInitService.isCalculadoraOnline(
      this.googleSheetClient,
    );
  }

  async addParametersToSolarCalculationDto(
    solarCalculationDto: SolarCalculationDto,
  ): Promise<any> {
    try {
      const caracteristicasSistema =
        await this.getCaracteristicasSistema().then(
          (caracteristicas) => caracteristicas,
        );
      const economicas = await this.getEconomicas();
      const inversionCostos = await this.getInversionYCostos(economicas, solarCalculationDto);
      const cuadroTarifarioActual = await this.getCuadroTarifario(economicas);
      const parametrosActuales: Parametros = {
        caracteristicasSistema,
        inversionCostos,
        economicas,
        cuadroTarifarioActual,
      };
      
      const solarCalculationWithParameters: SolarCalculationDto = {
        ...solarCalculationDto,
        parametros: parametrosActuales,
      };

      return solarCalculationWithParameters;
    } catch (error) {
      console.error('Error calculating online:', error);
      throw error;
    }
  }

  private async getCuadroTarifario(economicas: Economicas): Promise<CuadroTarifario[]> {
    try {
      return await this.variablesOnlineService.getCuadroTarifario(
        this.googleSheetClient,
        economicas
      );
    } catch (error) {
      console.error('Error al obtener los cuadros tarifarios:', error);
      throw new Error('No se pudieron obtener los cuadros tarifarios.');
    }
  }

  private async getInversionYCostos(economicas: Economicas, solarCalculationDto: SolarCalculationDto): Promise<InversionCostos> {
    try {
      return await this.variablesOnlineService.getInversionYCostos(
        this.googleSheetClient, 
        economicas, solarCalculationDto
      );
    } catch (error) {
      console.error('Error al obtener los datos de inversion y costos:', error);
      throw new Error(
        'No se pudieron obtener los datos de inversion y costos.',
      );
    }
  }

  private async getEconomicas(): Promise<Economicas> {
    try {
      return await this.variablesOnlineService.getEconomicas(this.googleSheetClient);
    } catch (error) {
      console.error('Error al obtener la cotización:', error);
      throw new Error('No se pudo obtener la cotización.');
    }
  }

  private async getCaracteristicasSistema(): Promise<CaracteristicasSistema> {
    try {
      return await this.variablesOnlineService.getCaracteristicasSistema(
        this.googleSheetClient,
      );
    } catch (error) {
      console.error('Error al obtener las características del sistema:', error);
      throw new Error(
        'No se pudieron obtener las características del sistema.',
      );
    }
  }
}
