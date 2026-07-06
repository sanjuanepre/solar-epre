"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlujoEnergia = void 0;
class FlujoEnergia {
    constructor(year, annualConsumption, generacionFotovoltaicaAnual, proporcionAutoconsumo, proporcionInyeccion) {
        this.year = year;
        this.annualConsumption = annualConsumption;
        this.generacionFotovoltaicaAnual = generacionFotovoltaicaAnual;
        this.proporcionAutoconsumo = proporcionAutoconsumo;
        this.proporcionInyeccion = proporcionInyeccion;
    }
    getEnergiaConsumida() {
        return this.annualConsumption;
    }
    getAutoconsumida() {
        if (this.getEnergiaConsumida() > (this.generacionFotovoltaicaAnual * this.proporcionAutoconsumo)) {
            return this.generacionFotovoltaicaAnual * this.proporcionAutoconsumo;
        }
        return this.getEnergiaConsumida();
    }
    getInyectada() {
        return this.generacionFotovoltaicaAnual - this.getAutoconsumida();
    }
    getYear() {
        return this.year;
    }
}
exports.FlujoEnergia = FlujoEnergia;
//# sourceMappingURL=flujo-energia.js.map