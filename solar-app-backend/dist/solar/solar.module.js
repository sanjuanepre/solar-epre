"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolarModule = void 0;
const common_1 = require("@nestjs/common");
const solar_service_1 = require("./solar.service");
const solar_controller_1 = require("./solar.controller");
const axios_1 = require("@nestjs/axios");
const google_sheets_module_1 = require("../google-sheets/google-sheets.module");
const calculadora_module_1 = require("../calculadora/calculadora.module");
let SolarModule = class SolarModule {
};
exports.SolarModule = SolarModule;
exports.SolarModule = SolarModule = __decorate([
    (0, common_1.Module)({
        imports: [axios_1.HttpModule, google_sheets_module_1.GoogleSheetsModule, calculadora_module_1.CalculadoraModule],
        providers: [solar_service_1.SolarService],
        controllers: [solar_controller_1.SolarController]
    })
], SolarModule);
//# sourceMappingURL=solar.module.js.map