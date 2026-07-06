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
exports.GoogleSheetsService = void 0;
const common_1 = require("@nestjs/common");
const googleapis_1 = require("googleapis");
const check_init_service_1 = require("./check-init/check-init.service");
const variables_online_service_1 = require("./variables-online/variables-online.service");
const calculadora_service_1 = require("../calculadora/calculadora.service");
let GoogleSheetsService = class GoogleSheetsService {
    constructor(checkInitService, variablesOnlineService, calculadoraService) {
        this.checkInitService = checkInitService;
        this.variablesOnlineService = variablesOnlineService;
        this.calculadoraService = calculadoraService;
    }
    async onModuleInit() {
        this.googleSheetClient = await this.getGoogleSheetClient();
    }
    async getGoogleSheetClient() {
        let auth;
        if (process.env.GOOGLE_CREDENTIALS) {
            const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
            auth = new googleapis_1.google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
        }
        else {
            auth = new googleapis_1.google.auth.GoogleAuth({
                keyFile: './src/config/credentials.json',
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
        }
        const authClient = await auth.getClient();
        if (!(authClient instanceof googleapis_1.google.auth.JWT)) {
            throw new Error('authClient must be an instance of google.auth.JWT');
        }
        return googleapis_1.google.sheets({
            version: 'v4',
            auth: authClient,
        });
    }
    async isCalculadoraOnline() {
        return await this.checkInitService.isCalculadoraOnline(this.googleSheetClient);
    }
    async addParametersToSolarCalculationDto(solarCalculationDto) {
        try {
            const caracteristicasSistema = await this.getCaracteristicasSistema().then((caracteristicas) => caracteristicas);
            const economicas = await this.getEconomicas();
            const inversionCostos = await this.getInversionYCostos(economicas, solarCalculationDto);
            const cuadroTarifarioActual = await this.getCuadroTarifario(economicas);
            const parametrosActuales = {
                caracteristicasSistema,
                inversionCostos,
                economicas,
                cuadroTarifarioActual,
            };
            const solarCalculationWithParameters = {
                ...solarCalculationDto,
                parametros: parametrosActuales,
            };
            return solarCalculationWithParameters;
        }
        catch (error) {
            console.error('Error calculating online:', error);
            throw error;
        }
    }
    async getCuadroTarifario(economicas) {
        try {
            return await this.variablesOnlineService.getCuadroTarifario(this.googleSheetClient, economicas);
        }
        catch (error) {
            console.error('Error al obtener los cuadros tarifarios:', error);
            throw new Error('No se pudieron obtener los cuadros tarifarios.');
        }
    }
    async getInversionYCostos(economicas, solarCalculationDto) {
        try {
            return await this.variablesOnlineService.getInversionYCostos(this.googleSheetClient, economicas, solarCalculationDto);
        }
        catch (error) {
            console.error('Error al obtener los datos de inversion y costos:', error);
            throw new Error('No se pudieron obtener los datos de inversion y costos.');
        }
    }
    async getEconomicas() {
        try {
            return await this.variablesOnlineService.getEconomicas(this.googleSheetClient);
        }
        catch (error) {
            console.error('Error al obtener la cotización:', error);
            throw new Error('No se pudo obtener la cotización.');
        }
    }
    async getCaracteristicasSistema() {
        try {
            return await this.variablesOnlineService.getCaracteristicasSistema(this.googleSheetClient);
        }
        catch (error) {
            console.error('Error al obtener las características del sistema:', error);
            throw new Error('No se pudieron obtener las características del sistema.');
        }
    }
};
exports.GoogleSheetsService = GoogleSheetsService;
exports.GoogleSheetsService = GoogleSheetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [check_init_service_1.CheckInitService,
        variables_online_service_1.VariablesOnlineService,
        calculadora_service_1.CalculadoraService])
], GoogleSheetsService);
//# sourceMappingURL=google-sheets.service.js.map