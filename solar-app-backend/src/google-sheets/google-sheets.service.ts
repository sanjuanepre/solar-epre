import { Injectable, OnModuleInit } from '@nestjs/common';
import { google, sheets_v4 } from 'googleapis';
import * as fs from 'fs';
import { SolarCalculationDto } from '../solar/dto/solar-calculation.dto';
import { CheckInitService } from './check-init/check-init.service';
import { CaracteristicasSistema } from '../interfaces/sheets/caracteristicas-sistema/caracteristicas-sistema.interface';
import { VariablesOnlineService } from './variables-online/variables-online.service';
import { InversionCostos } from '../interfaces/sheets/inversion-ycostos/inversion-costos.interface';
import { Economicas } from '../interfaces/sheets/cotizacion/economicas.interface';
import { CuadroTarifario } from '../interfaces/sheets/cuadro-tarifario/cuadro-tarifario.interface';
import { Parametros } from '../interfaces/sheets/parametros/parametros.interface';
import { CalculadoraService } from '../calculadora/calculadora.service';
import { TarifaCategoria } from '../tarifa-categoria/tarifa-categoria-enum';

@Injectable()
export class GoogleSheetsService implements OnModuleInit {
  private googleSheetClient: sheets_v4.Sheets;

  constructor(
    private checkInitService: CheckInitService,
    private variablesOnlineService: VariablesOnlineService,
    private calculadoraService: CalculadoraService,
  ) {}

  async onModuleInit() {
    try {
      this.googleSheetClient = await this.getGoogleSheetClient();
    } catch (error) {
      console.warn('[GoogleSheetsService] No se pudieron cargar las credenciales de Google Sheets:', error?.message || error);
    }
  }

  async getGoogleSheetClient(): Promise<sheets_v4.Sheets> {
    let auth: any;
    
    if (process.env.GOOGLE_CREDENTIALS) {
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } else if (process.env.GOOGLE_CLIENT_EMAIL && (process.env.GOOGLE_SERVICE_KEY || process.env.GOOGLE_PRIVATE_KEY)) {
      const client_email = process.env.GOOGLE_CLIENT_EMAIL;
      const private_key = (process.env.GOOGLE_SERVICE_KEY || process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email,
          private_key,
        },
        projectId: process.env.GOOGLE_PROJECTID,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } else {
      const localPaths = ['./src/config/credentials.json', './credentials.json', '../src/config/credentials.json'];
      const foundPath = localPaths.find(p => fs.existsSync(p));
      if (foundPath) {
        auth = new google.auth.GoogleAuth({
          keyFile: foundPath,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
      } else {
        console.warn('[GoogleSheetsService] No se encontraron credenciales en env ni archivo local. GoogleAuth no configurado.');
        return null as any;
      }
    }
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
      if (!this.googleSheetClient) {
        console.warn('[GoogleSheetsService] googleSheetClient es null. Usando parámetros por defecto.');
        return {
          ...solarCalculationDto,
          parametros: this.getFallbackParametros(solarCalculationDto),
        };
      }

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
      console.error('Error calculating online, usando fallback local:', error);
      return {
        ...solarCalculationDto,
        parametros: this.getFallbackParametros(solarCalculationDto),
      };
    }
  }

  private getFallbackParametros(solarCalculationDto: SolarCalculationDto): Parametros {
    return {
      caracteristicasSistema: {
        eficienciaInstalacion: 0.82,
        degradacionAnualPanel: 0.005,
        proporcionAutoconsumo: 0.70,
        proporcionInyeccion: 0.30,
      },
      inversionCostos: {
        costoInstalacionUsd: (solarCalculationDto.panelsSelected || 1) * 350,
        costoMantenimientoUsd: 50,
      },
      economicas: {
        tasaDescuento: { valor: 0.10, label: 'Tasa 10%' },
        usdToArs: 1200,
        tarifaIntercambioUsdKwh: 0.045,
      },
      cuadroTarifarioActual: [
        {
          categoriaTarifaria: solarCalculationDto.categoriaSeleccionada || 'T1-R',
          cargoFijoArs: 2500,
          cargoVariableArsKwh: 65.5,
          cargoPotenciaArsKw: 4500,
          costoGeneracionArsKwh: 45.0,
        },
      ],
    };
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
