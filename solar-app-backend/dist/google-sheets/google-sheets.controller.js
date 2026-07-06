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
exports.GoogleSheetsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const google_sheets_service_1 = require("./google-sheets.service");
let GoogleSheetsController = class GoogleSheetsController {
    constructor(googleSheetsService) {
        this.googleSheetsService = googleSheetsService;
    }
    async readValueCalculadora(tabName, range) {
    }
    async cargarConsumosAnualesEnCalculadora(meses) {
    }
    async getResultados() {
    }
};
exports.GoogleSheetsController = GoogleSheetsController;
__decorate([
    (0, common_1.Get)('read'),
    (0, swagger_1.ApiOperation)({
        summary: 'obtiene los datos de la celda apuntada, pasar nombre de la pestaña y coordenadas de la celda',
    }),
    __param(0, (0, common_1.Query)('tabName')),
    __param(1, (0, common_1.Query)('range')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GoogleSheetsController.prototype, "readValueCalculadora", null);
__decorate([
    (0, common_1.Post)('cargarConsumos'),
    (0, swagger_1.ApiOperation)({ summary: 'Carga los consumos anuales en la calculadora de Google Sheets' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], GoogleSheetsController.prototype, "cargarConsumosAnualesEnCalculadora", null);
__decorate([
    (0, common_1.Get)("resultados"),
    (0, swagger_1.ApiOperation)({ summary: 'Obtiene resultados de la calculadora solar' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GoogleSheetsController.prototype, "getResultados", null);
exports.GoogleSheetsController = GoogleSheetsController = __decorate([
    (0, swagger_1.ApiTags)('GoogleSheets'),
    (0, common_1.Controller)('google-sheets'),
    __metadata("design:paramtypes", [google_sheets_service_1.GoogleSheetsService])
], GoogleSheetsController);
//# sourceMappingURL=google-sheets.controller.js.map