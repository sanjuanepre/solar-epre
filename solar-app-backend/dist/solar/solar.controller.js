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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolarController = void 0;
const common_1 = require("@nestjs/common");
const solar_service_1 = require("./solar.service");
const solar_calculation_dto_1 = require("./dto/solar-calculation.dto");
const swagger_1 = require("@nestjs/swagger");
const google_sheets_service_1 = require("../google-sheets/google-sheets.service");
let SolarController = class SolarController {
    constructor(solarService, sheetsService) {
        this.solarService = solarService;
        this.sheetsService = sheetsService;
    }
    async calculateSolarSavings(solarCalculationDto, request, res) {
        try {
            const isOnline = await this.sheetsService.isCalculadoraOnline();
            if (true) {
                const solarCalculationWithParameters = await this.sheetsService.addParametersToSolarCalculationDto(solarCalculationDto);
                const resultados = await this.solarService.calculateSolarSavings(solarCalculationWithParameters);
                res.status(200).json(resultados);
            }
            else {
                this.handleOfflineCase(res);
            }
        }
        catch (error) {
            console.error('Error al calcular el ahorro solar:', error);
            res.status(500).json({
                mensaje: 'No se pudo calcular el ahorro solar.',
            });
        }
    }
    handleOfflineCase(res) {
        res.status(503).json({
            mensaje: 'La calculadora no está disponible en este momento. Por favor, inténtelo más tarde.',
        });
    }
    async calculateSolarSavingsNearby(solarDataNearby) {
        return await this.solarService.calculateSolarSavingsNearby(solarDataNearby);
    }
    async getSolarData(latitude, longitude) {
        return this.solarService.getSolarData(latitude, longitude);
    }
    handleOptions() {
        return;
    }
};
exports.SolarController = SolarController;
__decorate([
    (0, common_1.Post)('calculate'),
    (0, swagger_1.ApiOperation)({
        summary: 'Realiza los cálculos para determinar el ahorro energético',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [solar_calculation_dto_1.SolarCalculationDto,
        Request, Object]),
    __metadata("design:returntype", Promise)
], SolarController.prototype, "calculateSolarSavings", null);
__decorate([
    (0, common_1.Post)('calculate-nearby'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SolarController.prototype, "calculateSolarSavingsNearby", null);
__decorate([
    (0, common_1.Get)('solarData'),
    __param(0, (0, common_1.Query)('latitude')),
    __param(1, (0, common_1.Query)('longitude')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], SolarController.prototype, "getSolarData", null);
__decorate([
    (0, common_1.Options)('calcular'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SolarController.prototype, "handleOptions", null);
exports.SolarController = SolarController = __decorate([
    (0, swagger_1.ApiTags)('solar'),
    (0, common_1.Controller)('solar'),
    __metadata("design:paramtypes", [solar_service_1.SolarService,
        google_sheets_service_1.GoogleSheetsService])
], SolarController);
//# sourceMappingURL=solar.controller.js.map