"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariablesOnlineService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let VariablesOnlineService = class VariablesOnlineService {
    constructor(configService) {
        this.configService = configService;
        this.spreadsheetId = this.configService.get('GOOGLE_SHEET_ID');
        this.rangeCaracteristicas = this.configService.get('GOOGLE_SHEET_RANGE_CARACTERISTICAS');
        this.rangeEconomicas = this.configService.get('GOOGLE_SHEET_RANGE_ECONOMICAS');
        this.rangeCostos = this.configService.get('GOOGLE_SHEET_RANGE_COSTOS');
        this.rangeCuadroTarifario = this.configService.get('GOOGLE_SHEET_RANGE_CUADRO_TARIFARIO');
        this.rangeImpuestos = this.configService.get('GOOGLE_SHEET_RANGE_IMPUESTOS');
    }
    async getCuadroTarifario(googleSheetClient, economicas) {
        try {
            const response = await googleSheetClient.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: this.rangeCuadroTarifario,
            });
            const rows = response.data.values;
            if (!rows || rows.length === 0) {
                throw new Error('No se encontraron datos en el rango especificado.');
            }
            const dataRows = rows.filter(row => row[0] && row[0].match(/^T[0-9]|^TRA/));
            const cuadroTarifario = dataRows.map((row, index) => {
                return {
                    nombre: row[0],
                    cargoVariableConsumoArsKWh: this.parseFloatWithFormat(row[1]),
                    cargoVariableInyeccionArsKWh: this.parseFloatWithFormat(row[2]),
                    tension: row[3],
                    impuestos: row[0].includes('T1-R')
                        ? economicas.impuestosYTasasProvinciales + economicas.IVA
                        : economicas.impuestosYTasasProvinciales,
                };
            });
            return cuadroTarifario;
        }
        catch (error) {
            throw new Error('No se pudieron obtener los cuadros tarifarios.');
        }
    }
    async getInversionYCostos(googleSheetClient, economicas, solarCalculationDto) {
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
            const inversionYCostos = {
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
        }
        catch (error) {
            console.error('Error in getInversionYCostos:', error);
            throw new Error('No se pudieron obtener los datos de inversion y costos.');
        }
    }
    async getCaracteristicasSistema(googleSheetClient) {
        try {
            const response = await googleSheetClient.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: this.rangeCaracteristicas,
            });
            const rows = response.data.values;
            if (!rows || rows.length === 0) {
                throw new Error('No se encontraron datos en el rango especificado.');
            }
            const caracteristicasSistema = {
                eficienciaInstalacion: this.parseFloatWithFormat(rows[0][1]) / 100,
                degradacionAnualPanel: this.parseFloatWithFormat(rows[1][1]) / 100,
                proporcionAutoconsumo: this.parseFloatWithFormat(rows[2][1]) / 100,
                proporcionInyeccion: (100 - this.parseFloatWithFormat(rows[2][1])) / 100,
            };
            return caracteristicasSistema;
        }
        catch (error) {
            console.error('Error in getCaracteristicasSistema:', error);
            throw new Error('No se pudieron obtener las características del sistema.');
        }
    }
    async getEconomicas(googleSheetClient) {
        try {
            const responseEconomicas = await googleSheetClient.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: this.rangeEconomicas,
            });
            const responseImpuestos = await googleSheetClient.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: this.rangeImpuestos,
            });
            const rowsEconomicas = responseEconomicas.data.values;
            const rowsImpuestos = responseImpuestos.data.values;
            if (!rowsEconomicas ||
                rowsEconomicas.length === 0 ||
                !rowsImpuestos ||
                rowsImpuestos.length === 0) {
                throw new Error('No se encontraron datos en el rango especificado.');
            }
            const economicas = {
                tipoCambioArs: this.parseFloatWithFormat(rowsEconomicas[0][1]),
                tasaInflacionUsd: this.parseFloatWithFormat(rowsEconomicas[1][1]) / 100,
                tasaDescuentoFlujoFondosUsd: this.parseFloatWithFormat(rowsEconomicas[2][1]) / 100,
                impuestosYTasasProvinciales: this.parseFloatWithFormat(rowsImpuestos[0][1]) / 100,
                IVA: this.parseFloatWithFormat(rowsImpuestos[1][1]) / 100,
            };
            return economicas;
        }
        catch (error) {
            throw new Error('No se pudieron obtener la cotizacion.');
        }
    }
    parseFloatWithFormat(value) {
        if (!value)
            return 0;
        let clean = value.replace('%', '').trim();
        if (clean.includes('.') && clean.includes(',')) {
            const lastDot = clean.lastIndexOf('.');
            const lastComma = clean.lastIndexOf(',');
            if (lastComma > lastDot) {
                clean = clean.replace(/\./g, '').replace(',', '.');
            }
            else {
                clean = clean.replace(/,/g, '');
            }
        }
        else if (clean.includes(',')) {
            clean = clean.replace(',', '.');
        }
        const parsed = parseFloat(clean);
        return isNaN(parsed) ? 0 : parsed;
    }
};
exports.VariablesOnlineService = VariablesOnlineService;
exports.VariablesOnlineService = VariablesOnlineService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], VariablesOnlineService);
//# sourceMappingURL=variables-online.service.js.map