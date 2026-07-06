"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EcoFin = void 0;
class EcoFin {
    constructor(dto, solarData, tarifaCategory) {
        this.actualYear = new Date().getFullYear();
        this.dto = dto;
        this.solarData = solarData;
        this.tipoDeCambioArs = dto.parametros.economicas.tipoCambioArs;
        this.impuestosProvincialesYTasasMunicipales = tarifaCategory.impuestos;
        this.costoUsdWpAplicado = dto.parametros.inversionCostos.costoUsdWpAplicado;
        this.costoEquipoMedicionUsd =
            dto.parametros.inversionCostos.equipoDeMedicionUsdAplicado;
        this.inversionUsd = this.calculateInversion(dto, solarData);
        this.costoMantenimientoUsd = this.calculateCostoMantenimientoInicialUsd(this.inversionUsd);
    }
    calculateCostoMantenimientoInicialUsd(inversionUsd) {
        return inversionUsd * 0.01;
    }
    getFlujoIngresosMonetarios(periodoVeinteanalFlujoEnergia, periodoVeinteanalProyeccionTarifas) {
        const periodoVeinteanal = [];
        periodoVeinteanal.push({
            year: periodoVeinteanalFlujoEnergia[0].anio,
            ahorroEnElectricidadTotalUsd: periodoVeinteanalFlujoEnergia[0].energiaAutoconsumidakWhAnio *
                periodoVeinteanalProyeccionTarifas[1]?.cargoVariableConsumoUsdkWh *
                (1 + this.impuestosProvincialesYTasasMunicipales),
            ingresoPorInyeccionElectricaUsd: periodoVeinteanalFlujoEnergia[0].energiaInyectadakWhAnio *
                periodoVeinteanalProyeccionTarifas[1]?.cargoVariableInyeccionUsdKwh,
        });
        for (let i = 1; i < 20; i++) {
            const previousYearAutoconsumida = periodoVeinteanalFlujoEnergia[i].energiaAutoconsumidakWhAnio;
            const previousYearInyectada = periodoVeinteanalFlujoEnergia[i].energiaInyectadakWhAnio;
            const tarifa = periodoVeinteanalProyeccionTarifas[i + 1]
                ? periodoVeinteanalProyeccionTarifas[i + 1]
                : periodoVeinteanalProyeccionTarifas[periodoVeinteanalProyeccionTarifas.length - 1];
            periodoVeinteanal.push({
                year: periodoVeinteanalFlujoEnergia[i].anio,
                ahorroEnElectricidadTotalUsd: previousYearAutoconsumida *
                    tarifa.cargoVariableConsumoUsdkWh *
                    (1 + this.impuestosProvincialesYTasasMunicipales),
                ingresoPorInyeccionElectricaUsd: previousYearInyectada * tarifa.cargoVariableInyeccionUsdKwh,
            });
        }
        return periodoVeinteanal;
    }
    getProyeccionDeTarifas(tarifaCategory) {
        const periodoVeinteanal = [];
        periodoVeinteanal.push({
            year: this.actualYear,
            cargoVariableConsumoUsdkWh: tarifaCategory.tarifaConsumoEnergiaArs / this.tipoDeCambioArs,
            cargoVariableInyeccionUsdKwh: tarifaCategory.tarifaInyeccionEnergiaArs / this.tipoDeCambioArs,
            tasaAnualAumentoDeTarifas: this.dto.parametros.economicas.tasaInflacionUsd,
        });
        for (let i = 1; i < 20; i++) {
            const previousProyeccion = periodoVeinteanal[i - 1];
            periodoVeinteanal.push({
                year: previousProyeccion.year + 1,
                cargoVariableConsumoUsdkWh: previousProyeccion.cargoVariableConsumoUsdkWh *
                    (1 + this.dto.parametros.economicas.tasaInflacionUsd),
                cargoVariableInyeccionUsdKwh: previousProyeccion.cargoVariableInyeccionUsdKwh *
                    (1 + this.dto.parametros.economicas.tasaInflacionUsd),
                tasaAnualAumentoDeTarifas: this.dto.parametros.economicas.tasaInflacionUsd,
            });
        }
        return periodoVeinteanal;
    }
    getCostoMantenimiento() {
        const periodoVeinteanal = [];
        periodoVeinteanal.push({
            year: this.actualYear,
            costoUsd: this.costoMantenimientoUsd,
        });
        for (let i = 1; i < 20; i++) {
            const previousCosto = periodoVeinteanal[i - 1];
            periodoVeinteanal.push({
                year: previousCosto.year + 1,
                costoUsd: previousCosto.costoUsd *
                    (1 + this.dto.parametros.economicas.tasaInflacionUsd),
            });
        }
        return periodoVeinteanal;
    }
    calculateInversion(dto, solarData) {
        const panelsApi = solarData.panels.panelsCountApi;
        const panelsSelected = solarData.panels.panelsSelected ?? panelsApi;
        const costoUsdWp = dto.parametros.inversionCostos.costoUsdWpAplicado;
        const instalacionCapacityW = panelsSelected * solarData.panels.panelCapacityW;
        const costoEquipoMedicionUsd = dto.parametros.inversionCostos.equipoDeMedicionUsdAplicado;
        const inversionInicial = costoUsdWp * instalacionCapacityW + costoEquipoMedicionUsd;
        this.dto.parametros.inversionCostos.inversion = inversionInicial;
        this.dto.parametros.inversionCostos.costoDeMantenimientoInicialUsd = inversionInicial * 0.01;
        return inversionInicial;
    }
}
exports.EcoFin = EcoFin;
//# sourceMappingURL=eco-fin.js.map