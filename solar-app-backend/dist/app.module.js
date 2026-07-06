"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const solar_module_1 = require("./solar/solar.module");
const auth_module_1 = require("./auth/auth.module");
const google_sheets_module_1 = require("./google-sheets/google-sheets.module");
const gmail_module_1 = require("./gmail/gmail.module");
const calculadora_module_1 = require("./calculadora/calculadora.module");
const tarifa_categoria_module_1 = require("./tarifa-categoria/tarifa-categoria.module");
const variables_online_service_1 = require("./google-sheets/variables-online/variables-online.service");
const health_controller_1 = require("./health/health.controller");
const ip_controller_1 = require("./ip/ip.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            solar_module_1.SolarModule,
            config_1.ConfigModule.forRoot({
                envFilePath: ['.env', '.env.sheets'],
                isGlobal: true,
            }),
            auth_module_1.AuthModule,
            google_sheets_module_1.GoogleSheetsModule,
            gmail_module_1.GmailModule,
            calculadora_module_1.CalculadoraModule,
            tarifa_categoria_module_1.TarifaCategoriaModule,
        ],
        controllers: [health_controller_1.HealthController, ip_controller_1.IpController],
        providers: [variables_online_service_1.VariablesOnlineService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map