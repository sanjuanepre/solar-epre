"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resultados = void 0;
class Resultados {
    constructor(periodoVeinteanalFlujoIngresosMonetarios, periodoVeinteanalEmisionesGEIEvitadas, periodoVeinteanalCostoMantenimiento, solarData, dto) {
        this.tasaDescuento = 10 / 100;
        this.solarData = solarData;
        this.dto = dto;
        this.generarResultadosCapitalPropio(periodoVeinteanalFlujoIngresosMonetarios, periodoVeinteanalCostoMantenimiento);
        this.generarIndicadoresFinancieros();
        this.emisionesGEIEvitadas = periodoVeinteanalEmisionesGEIEvitadas;
    }
    generarResultadosCapitalPropio(periodoVeinteanalFlujoIngresosMonetarios, periodoVeinteanalCostoMantenimiento) {
        const periodoVeinteanal = [];
        periodoVeinteanal.push({
            year: new Date().getFullYear(),
            flujoIngresos: 0,
            flujoEgresos: 0,
            inversiones: this.dto.parametros.inversionCostos.inversion,
            flujoFondos: 0 - 0 - this.dto.parametros.inversionCostos.inversion,
            flujoAcumulado: 0 - 0 - this.dto.parametros.inversionCostos.inversion,
        });
        for (let i = 1; i < 20; i++) {
            const year = periodoVeinteanal[i - 1].year + 1;
            const currentFlujoIngresos = periodoVeinteanalFlujoIngresosMonetarios[i - 1]
                .ahorroEnElectricidadTotalUsd +
                periodoVeinteanalFlujoIngresosMonetarios[i - 1]
                    .ingresoPorInyeccionElectricaUsd;
            const currentFlujoEgresos = periodoVeinteanalCostoMantenimiento[i].costoUsd;
            const currentFlujoFondos = currentFlujoIngresos - currentFlujoEgresos;
            const currentFlujoAcumulado = periodoVeinteanal[i - 1].flujoAcumulado + currentFlujoFondos;
            periodoVeinteanal.push({
                year,
                flujoIngresos: currentFlujoIngresos,
                flujoEgresos: currentFlujoEgresos,
                flujoFondos: currentFlujoFondos,
                inversiones: 0,
                flujoAcumulado: currentFlujoAcumulado,
            });
        }
        this.casoConCapitalPropio = periodoVeinteanal;
    }
    generarIndicadoresFinancieros() {
        this.indicadoresFinancieros = {
            VAN: this.calcularNPV(),
            TIR: this.calcularTIR(),
            payBackMonths: this.calcularPlazoRetorno(),
        };
    }
    calcularNPV() {
        let npv = 0;
        for (let i = 0; i < this.casoConCapitalPropio.length; i++) {
            npv +=
                this.casoConCapitalPropio[i].flujoFondos /
                    Math.pow(1 + this.tasaDescuento, i + 1);
        }
        return npv;
    }
    calcularTIR() {
        const epsilon = 0.0001;
        let tasaMin = 0.0;
        let tasaMax = 1.0;
        let tir = (tasaMin + tasaMax) / 2;
        const npv = (tasa) => {
            let npvValue = 0;
            for (let i = 0; i < this.casoConCapitalPropio.length; i++) {
                npvValue +=
                    this.casoConCapitalPropio[i].flujoFondos / Math.pow(1 + tasa, i + 1);
            }
            return npvValue;
        };
        while (tasaMax - tasaMin > epsilon) {
            tir = (tasaMin + tasaMax) / 2;
            const npvValue = npv(tir);
            if (npvValue > 0) {
                tasaMin = tir;
            }
            else {
                tasaMax = tir;
            }
        }
        return tir * 100;
    }
    calcularPlazoRetorno() {
        for (let i = 1; i < this.casoConCapitalPropio.length; i++) {
            const flujoActual = this.casoConCapitalPropio[i].flujoAcumulado;
            const flujoAnterior = this.casoConCapitalPropio[i - 1].flujoAcumulado;
            if (flujoAnterior <= 0 && flujoActual > 0) {
                const fraccionAnual = flujoAnterior / (flujoAnterior - flujoActual);
                const meses = fraccionAnual * 12;
                return (i - 1) * 12 + meses;
            }
        }
        return -1;
    }
    get casoConCapitalPropio() {
        return this._casoConCapitalPropio;
    }
    set casoConCapitalPropio(value) {
        this._casoConCapitalPropio = value;
    }
    get indicadoresFinancieros() {
        return this._indicadoresFinancieros;
    }
    set indicadoresFinancieros(value) {
        this._indicadoresFinancieros = value;
    }
    get emisionesGEIEvitadas() {
        return this._emisionesGEIEvitadas;
    }
    set emisionesGEIEvitadas(value) {
        this._emisionesGEIEvitadas = value;
    }
}
exports.Resultados = Resultados;
//# sourceMappingURL=resultados.js.map