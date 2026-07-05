import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { iam_v1, sheets_v4 } from 'googleapis';
import { CaracteristicasSistema } from 'src/interfaces/sheets/caracteristicas-sistema/caracteristicas-sistema.interface';
import { Economicas } from 'src/interfaces/sheets/cotizacion/economicas.interface';
import { CuadroTarifario } from 'src/interfaces/sheets/cuadro-tarifario/cuadro-tarifario.interface';
import { InversionCostos } from 'src/interfaces/sheets/inversion-ycostos/inversion-costos.interface';
import { TasaDescuento } from 'src/interfaces/sheets/tasa-descuento/tasa-descuento.interface';
import { SolarCalculationDto } from 'src/solar/dto/solar-calculation.dto';
import { TarifaCategoria } from 'src/tarifa-categoria/tarifa-categoria-enum';

@Injectable()
export class VariablesOnlineService {
  private readonly spreadsheetId: string;
  private readonly rangeCaracteristicas: string;
  private readonly rangeEconomicas: string;
  private readonly rangeCostos: string;
  private readonly rangeCuadroTarifario: string;
  private readonly rangeImpuestos: string;

  constructor(private readonly configService: ConfigService) {
    this.spreadsheetId = this.configService.get<string>('GOOGLE_SHEET_ID');

    this.rangeCaracteristicas = this.configService.get<string>(
      'GOOGLE_SHEET_RANGE_CARACTERISTICAS',
    );
    this.rangeEconomicas = this.configService.get<string>(
      'GOOGLE_SHEET_RANGE_ECONOMICAS',
    );
    this.rangeCostos = this.configService.get<string>(
      'GOOGLE_SHEET_RANGE_COSTOS',
    );
    this.rangeCuadroTarifario = this.configService.get<string>(
      'GOOGLE_SHEET_RANGE_CUADRO_TARIFARIO',
    );
    this.rangeImpuestos = this.configService.get<string>(
      'GOOGLE_SHEET_RANGE_IMPUESTOS',
    );
  }

  async getCuadroTarifario(
    googleSheetClient: sheets_v4.Sheets,
    economicas: Economicas,
  ): Promise<CuadroTarifario[]> {
    try {
      const response = await googleSheetClient.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: this.rangeCuadroTarifario,
      });

      const rows = response.data.values;

      if (!rows || rows.length === 0) {
        throw new Error('No se encontraron datos en el rango especificado.');
      }

      // Filter rows that have a valid tariff name (skip empty rows and header rows)
      const dataRows = rows.filter(row => row[0] && row[0].match(/^T[0-9]|^TRA/));

      const cuadroTarifario: CuadroTarifario[] = dataRows.map((row, index) => {
        return {
          nombre: row[0] as CuadroTarifario['nombre'],
          cargoVariableConsumoArsKWh: this.parseFloatWithFormat(row[1]),
          cargoVariableInyeccionArsKWh: this.parseFloatWithFormat(row[2]),
          tension: row[3] as CuadroTarifario['tension'],
          impuestos: row[0].includes('T1-R')
            ? economicas.impuestosYTasasProvinciales + economicas.IVA
            : economicas.impuestosYTasasProvinciales,
        };
      });
      
      return cuadroTarifario;
    } catch (error) {
      throw new Error('No se pudieron obtener los cuadros tarifarios.');
    }
  }

  async getInversionYCostos(
    googleSheetClient: sheets_v4.Sheets,
    economicas: Economicas,
    solarCalculationDto: SolarCalculationDto,
  ): Promise<InversionCostos> {
    try {
      const response = await googleSheetClient.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: this.rangeCostos,
      });

      const rows = response.data.values;

      if (!rows || rows.length === 0) {
        throw new Error('No se encontraron datos en el rango especificado.');
      }
      const categoriaSeleccionada = solarCalculationDto.categoriaSeleccionada;
      const tipoCambioArs = economicas.tipoCambioArs;

      const costoUsdWpConIva = this.parseFloatWithFormat(rows[0][1]);
      const equipoMedicionUsd = this.parseFloatWithFormat(rows[2][1]);
      const mantenimientoUsd = this.parseFloatWithFormat(rows[5][1]);

      const equipoDeMedicionUsdAplicado = categoriaSeleccionada.includes('T1-R')
        ? equipoMedicionUsd * (1 + economicas.IVA)
        : equipoMedicionUsd;

      const inversionYCostos: InversionCostos = {
        costoUsdWpConIva,
        costoUsdWpAplicado: categoriaSeleccionada.includes('T1-R')
          ? costoUsdWpConIva
          : costoUsdWpConIva / (1 + economicas.IVA),
        equipoDeMedicionArsSinIva: equipoMedicionUsd * tipoCambioArs,
        equipoDeMedicionUsdAplicado,
        mantenimiento: mantenimientoUsd,
        costoDeMantenimientoInicialUsd: 0,
        inversion: 0,
      };

      return inversionYCostos;
    } catch (error) {
      console.error('Error in getInversionYCostos:', error);
      throw new Error(
        'No se pudieron obtener los datos de inversion y costos.',
      );
    }
  }

  async getCaracteristicasSistema(
    googleSheetClient: sheets_v4.Sheets,
  ): Promise<CaracteristicasSistema> {
    try {
      const response = await googleSheetClient.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: this.rangeCaracteristicas,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        throw new Error('No se encontraron datos en el rango especificado.');
      }

      const caracteristicasSistema: CaracteristicasSistema = {
        eficienciaInstalacion: this.parseFloatWithFormat(rows[0][1]) / 100,
        degradacionAnualPanel: this.parseFloatWithFormat(rows[1][1]) / 100,
        proporcionAutoconsumo: this.parseFloatWithFormat(rows[2][1]) / 100,
        proporcionInyeccion:
          (100 - this.parseFloatWithFormat(rows[2][1])) / 100,
      };

      return caracteristicasSistema;
    } catch (error) {
      console.error('Error in getCaracteristicasSistema:', error);
      throw new Error(
        'No se pudieron obtener las características del sistema.',
      );
    }
  }

  async getEconomicas(
    googleSheetClient: sheets_v4.Sheets,
  ): Promise<Economicas> {
    try {
      const responseEconomicas =
        await googleSheetClient.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: this.rangeEconomicas,
        });
      const responseImpuestos = await googleSheetClient.spreadsheets.values.get(
        {
          spreadsheetId: this.spreadsheetId,
          range: this.rangeImpuestos,
        },
      );

      const rowsEconomicas = responseEconomicas.data.values;
      const rowsImpuestos = responseImpuestos.data.values;

      if (
        !rowsEconomicas ||
        rowsEconomicas.length === 0 ||
        !rowsImpuestos ||
        rowsImpuestos.length === 0
      ) {
        throw new Error('No se encontraron datos en el rango especificado.');
      }

      const economicas: Economicas = {
        tipoCambioArs: this.parseFloatWithFormat(rowsEconomicas[0][1]),
        tasaInflacionUsd: this.parseFloatWithFormat(rowsEconomicas[1][1]) / 100,
        tasaDescuentoFlujoFondosUsd:
          this.parseFloatWithFormat(rowsEconomicas[2][1]) / 100,
        impuestosYTasasProvinciales:
          this.parseFloatWithFormat(rowsImpuestos[0][1]) / 100,
        IVA: this.parseFloatWithFormat(rowsImpuestos[1][1]) / 100,
      };

      return economicas;
    } catch (error) {
      throw new Error('No se pudieron obtener la cotizacion.');
    }
  }

  private parseFloatWithFormat(value: string): number {
    if (!value) return 0;
    let clean = value.replace('%', '').trim();
    if (clean.includes('.') && clean.includes(',')) {
      const lastDot = clean.lastIndexOf('.');
      const lastComma = clean.lastIndexOf(',');
      if (lastComma > lastDot) {
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else {
        clean = clean.replace(/,/g, '');
      }
    } else if (clean.includes(',')) {
      clean = clean.replace(',', '.');
    }
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  }
}
