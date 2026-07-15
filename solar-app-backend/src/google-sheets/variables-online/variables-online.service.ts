import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { iam_v1, sheets_v4 } from 'googleapis';
import { CaracteristicasSistema } from '../../interfaces/sheets/caracteristicas-sistema/caracteristicas-sistema.interface';
import { Economicas } from '../../interfaces/sheets/cotizacion/economicas.interface';
import { CuadroTarifario } from '../../interfaces/sheets/cuadro-tarifario/cuadro-tarifario.interface';
import { InversionCostos } from '../../interfaces/sheets/inversion-ycostos/inversion-costos.interface';
import { TasaDescuento } from '../../interfaces/sheets/tasa-descuento/tasa-descuento.interface';
import { SolarCalculationDto } from '../../solar/dto/solar-calculation.dto';
import { TarifaCategoria } from '../../tarifa-categoria/tarifa-categoria-enum';

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

      // Buscar valores por etiqueta, o usar los índices tradicionales como fallback
      const costoUsdWpConIvaStr = this.findValueByLabel(rows, 'Costo (USD/Wp) CON IVA') || rows[0]?.[1];
      const costoUsdWpConIva = this.parseFloatWithFormat(costoUsdWpConIvaStr);

      const equipoMedicionArsStr = this.findValueByLabel(rows, 'Equipo de medición ($AR) SIN IVA') || rows[2]?.[1];
      const equipoMedicionUsd = this.parseFloatWithFormat(equipoMedicionArsStr) / tipoCambioArs;

      const mantenimientoStr = this.findValueByLabel(rows, 'Mantenimiento (% inversión inicial)') || rows[5]?.[1];
      const mantenimientoUsd = this.parseFloatWithFormat(mantenimientoStr);

      const ivaEquipoMedicionStr = this.findValueByLabel(rows, 'IVA Equipo de medición') || rows[3]?.[1];
      const ivaEquipoMedicion = this.parseFloatWithFormat(ivaEquipoMedicionStr) / 100;

      const equipoDeMedicionUsdAplicado = categoriaSeleccionada.includes('T1-R')
        ? equipoMedicionUsd * (1 + ivaEquipoMedicion)
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

      const eficienciaStr = this.findValueByLabel(rows, 'Eficiencia instalacion') || rows[0]?.[1];
      const degradacionStr = this.findValueByLabel(rows, 'Degradación anual paneles') || rows[1]?.[1];
      const autoconsumoStr = this.findValueByLabel(rows, 'Proporción de autoconsumo') || rows[2]?.[1];

      const eficienciaInstalacion = this.parseFloatWithFormat(eficienciaStr) / 100;
      const degradacionAnualPanel = this.parseFloatWithFormat(degradacionStr) / 100;
      const proporcionAutoconsumo = this.parseFloatWithFormat(autoconsumoStr) / 100;
      const proporcionInyeccion = 1 - proporcionAutoconsumo;

      return {
        eficienciaInstalacion,
        degradacionAnualPanel,
        proporcionAutoconsumo,
        proporcionInyeccion,
      };
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

      const TCStr = this.findValueByLabel(rowsEconomicas, 'Tipo de cambio') || rowsEconomicas[0]?.[1];
      const inflacionStr = this.findValueByLabel(rowsEconomicas, 'Tasa inflación') || rowsEconomicas[1]?.[1];
      const descuentoStr = this.findValueByLabel(rowsEconomicas, 'Tasa de descuento') || rowsEconomicas[2]?.[1];

      const provStr = this.findValueByLabel(rowsImpuestos, 'Impuestos y tasas provinciales') || rowsImpuestos[1]?.[1];
      const ivaStr = this.findValueByLabel(rowsImpuestos, 'IVA') || rowsImpuestos[2]?.[1];

      const economicas: Economicas = {
        tipoCambioArs: this.parseFloatWithFormat(TCStr),
        tasaInflacionUsd: this.parseFloatWithFormat(inflacionStr) / 100,
        tasaDescuentoFlujoFondosUsd: this.parseFloatWithFormat(descuentoStr) / 100,
        impuestosYTasasProvinciales: this.parseFloatWithFormat(provStr) / 100,
        IVA: this.parseFloatWithFormat(ivaStr) / 100,
      };

      return economicas;
    } catch (error) {
      throw new Error('No se pudieron obtener la cotizacion.');
    }
  }

  private findValueByLabel(rows: any[][], label: string): string {
    if (!rows) return '';
    const row = rows.find(r => r && r[0] && r[0].toString().toLowerCase().includes(label.toLowerCase()));
    return row && row[1] !== undefined ? row[1].toString() : '';
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
