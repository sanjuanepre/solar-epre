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
exports.CalculadoraService = void 0;
const common_1 = require("@nestjs/common");
const tarifa_1 = require("../tarifa-categoria/tarifa/tarifa");
const datos_tecnicos_1 = require("./datos-tecnicos/datos-tecnicos");
const eco_fin_1 = require("./eco-fin/eco-fin");
const resultados_1 = require("./resultados/resultados");
let CalculadoraService = class CalculadoraService {
    constructor() { }
    calculateEnergySavings(solarData, solarCalculationWithParameters) {
        const yearlyEnergyACKwh = solarData.yearlyEnergyAcKwh * solarCalculationWithParameters.factorPotencia;
        const tarifaCategory = new tarifa_1.Tarifa(solarData.tarifaCategory, solarCalculationWithParameters.potenciaMaxAsignada, solarCalculationWithParameters.parametros?.cuadroTarifarioActual);
        const annualConsumption = solarData.annualConsumption;
        this.datosTecnicos = new datos_tecnicos_1.DatosTecnicos(solarCalculationWithParameters, solarData);
        const periodoVeinteanalGeneracionFotovoltaica = this.datosTecnicos.getGeneracionFotovoltaica(yearlyEnergyACKwh);
        const periodoVeinteanalFlujoEnergia = this.datosTecnicos.getFlujoEnergia(annualConsumption, yearlyEnergyACKwh, periodoVeinteanalGeneracionFotovoltaica);
        const periodoVeinteanalEmisionesGEIEvitadas = this.datosTecnicos.getEmisionesGEIEvitadas(periodoVeinteanalGeneracionFotovoltaica);
        this.ecoFin = new eco_fin_1.EcoFin(solarCalculationWithParameters, solarData, tarifaCategory);
        const periodoVeinteanalProyeccionTarifas = this.ecoFin.getProyeccionDeTarifas(tarifaCategory);
        const periodoVeinteanalFlujoIngresosMonetarios = this.ecoFin.getFlujoIngresosMonetarios(periodoVeinteanalFlujoEnergia, periodoVeinteanalProyeccionTarifas);
        const periodoVeinteanalCostoMantenimiento = this.ecoFin.getCostoMantenimiento();
        this.resultadosFinancieros = new resultados_1.Resultados(periodoVeinteanalFlujoIngresosMonetarios, periodoVeinteanalEmisionesGEIEvitadas, periodoVeinteanalCostoMantenimiento, solarData, solarCalculationWithParameters);
        const parametros = solarCalculationWithParameters.parametros;
        parametros.inversionCostos.mantenimiento = periodoVeinteanalCostoMantenimiento[0].costoUsd;
        return {
            solarData,
            parametros,
            periodoVeinteanalGeneracionFotovoltaica,
            periodoVeinteanalFlujoEnergia,
            periodoVeinteanalFlujoIngresosMonetarios,
            periodoVeinteanalEmisionesGEIEvitadas,
            periodoVeinteanalProyeccionTarifas,
            periodoVeinteanalCostoMantenimiento,
            resultadosFinancieros: {
                casoConCapitalPropio: this.resultadosFinancieros.casoConCapitalPropio,
                indicadoresFinancieros: this.resultadosFinancieros.indicadoresFinancieros,
            },
        };
    }
};
exports.CalculadoraService = CalculadoraService;
exports.CalculadoraService = CalculadoraService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CalculadoraService);
//# sourceMappingURL=calculadora.service.js.map