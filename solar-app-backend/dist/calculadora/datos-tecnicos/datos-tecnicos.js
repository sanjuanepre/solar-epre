"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatosTecnicos = void 0;
class DatosTecnicos {
    constructor(dto, solarData) {
        this.actualYear = new Date().getFullYear();
        this.dto = dto;
        this.solarData = solarData;
        this.eficienciaInstalacion =
            dto.parametros.caracteristicasSistema.eficienciaInstalacion;
        this.degradacionAnualPaneles =
            dto.parametros.caracteristicasSistema.degradacionAnualPanel;
        this.factorEmisiontCO2perMWh = solarData.carbonOffsetFactorKgPerMWh / 1000;
        this.proporcionAutoconsumo =
            dto.parametros.caracteristicasSistema.proporcionAutoconsumo;
        this.proporcionInyeccion =
            dto.parametros.caracteristicasSistema.proporcionInyeccion;
    }
    getGeneracionFotovoltaica(yearlyEnergyACkWh) {
        const periodoVeinteanal = [];
        periodoVeinteanal.push({
            anio: this.actualYear + 1,
            generacionFotovoltaicaKWh: yearlyEnergyACkWh,
        });
        for (let i = 1; i < 20; i++) {
            const previousYearGeneration = periodoVeinteanal[i - 1].generacionFotovoltaicaKWh;
            const degradedGeneration = previousYearGeneration * (1 - this.degradacionAnualPaneles);
            periodoVeinteanal.push({
                anio: periodoVeinteanal[i - 1].anio + 1,
                generacionFotovoltaicaKWh: degradedGeneration,
            });
        }
        return periodoVeinteanal;
    }
    getFlujoEnergia(annualConsumption, yearlyEnergyACkWh, periodoVeinteanalGeneracionFotovoltaica) {
        const periodoVeinteanal = [];
        periodoVeinteanal.push({
            anio: this.actualYear + 1,
            energiaAutoconsumidakWhAnio: annualConsumption >
                periodoVeinteanalGeneracionFotovoltaica[0].generacionFotovoltaicaKWh *
                    this.proporcionAutoconsumo
                ? periodoVeinteanalGeneracionFotovoltaica[0]
                    .generacionFotovoltaicaKWh * this.proporcionAutoconsumo
                : annualConsumption,
            energiaInyectadakWhAnio: periodoVeinteanalGeneracionFotovoltaica[0].generacionFotovoltaicaKWh -
                (annualConsumption >
                    periodoVeinteanalGeneracionFotovoltaica[0].generacionFotovoltaicaKWh *
                        this.proporcionAutoconsumo
                    ? periodoVeinteanalGeneracionFotovoltaica[0]
                        .generacionFotovoltaicaKWh * this.proporcionAutoconsumo
                    : annualConsumption),
        });
        for (let i = 1; i < 20; i++) {
            const currentYear = periodoVeinteanalGeneracionFotovoltaica[i].anio;
            periodoVeinteanal.push({
                anio: currentYear,
                energiaAutoconsumidakWhAnio: annualConsumption >
                    periodoVeinteanalGeneracionFotovoltaica[i].generacionFotovoltaicaKWh *
                        this.proporcionAutoconsumo
                    ? periodoVeinteanalGeneracionFotovoltaica[i]
                        .generacionFotovoltaicaKWh * this.proporcionAutoconsumo
                    : annualConsumption,
                energiaInyectadakWhAnio: periodoVeinteanalGeneracionFotovoltaica[i].generacionFotovoltaicaKWh -
                    (annualConsumption >
                        periodoVeinteanalGeneracionFotovoltaica[i].generacionFotovoltaicaKWh *
                            this.proporcionAutoconsumo
                        ? periodoVeinteanalGeneracionFotovoltaica[i]
                            .generacionFotovoltaicaKWh * this.proporcionAutoconsumo
                        : annualConsumption),
            });
        }
        return periodoVeinteanal;
    }
    getEmisionesGEIEvitadas(periodoVeinteanalGeneracionFotovoltaica) {
        const periodoVeinteanal = [];
        periodoVeinteanal.push({
            year: periodoVeinteanalGeneracionFotovoltaica[0].anio,
            emisionesTonCO2: periodoVeinteanalGeneracionFotovoltaica[0].generacionFotovoltaicaKWh *
                (this.factorEmisiontCO2perMWh / 1000),
        });
        for (let i = 1; i < 20; i++) {
            const currentYearGeneration = periodoVeinteanalGeneracionFotovoltaica[i].generacionFotovoltaicaKWh;
            const emisionesTonCO2 = currentYearGeneration * (this.factorEmisiontCO2perMWh / 1000);
            periodoVeinteanal.push({
                year: periodoVeinteanalGeneracionFotovoltaica[i].anio,
                emisionesTonCO2,
            });
        }
        return periodoVeinteanal;
    }
}
exports.DatosTecnicos = DatosTecnicos;
//# sourceMappingURL=datos-tecnicos.js.map