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
exports.SolarService = void 0;
const common_1 = require("@nestjs/common");
const calculadora_service_1 = require("../calculadora/calculadora.service");
let SolarService = class SolarService {
    constructor(calculadoraService) {
        this.calculadoraService = calculadoraService;
    }
    async getSolarData(latitude, longitude) {
        if (isNaN(latitude) || isNaN(longitude)) {
            throw new common_1.HttpException('Invalid coordinates received', common_1.HttpStatus.BAD_REQUEST);
        }
        const apiKey = process.env.GOOGLE_API_KEY;
        const args = {
            'location.latitude': latitude.toFixed(5),
            'location.longitude': longitude.toFixed(5),
        };
        const params = new URLSearchParams({ ...args, key: apiKey });
        const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?${params}`;
        try {
            const response = await fetch(url, {
                method: 'GET',
                cache: 'no-cache',
                headers: {
                    Pragma: 'no-cache',
                    'Cache-Control': 'no-cache',
                    'Accept-Encoding': 'gzip, deflate, br',
                },
            });
            if (!response.ok) {
                let errorMsg = 'Unknown error';
                try {
                    const errorContent = await response.json();
                    errorMsg = errorContent.error ? errorContent.error.message : JSON.stringify(errorContent);
                }
                catch (e) {
                    errorMsg = `HTTP status ${response.status}`;
                }
                console.warn(`[SolarService] Google Solar API call failed (${errorMsg}). Returning mock fallback data.`);
                return this.getMockSolarData();
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            console.warn(`[SolarService] Error calling Google Solar API (${error.message}). Returning mock fallback data.`);
            return this.getMockSolarData();
        }
    }
    getMockSolarData() {
        return {
            solarPotential: {
                panelCapacityWatts: 400,
                panelHeightMeters: 1.65,
                panelWidthMeters: 0.99,
                carbonOffsetFactorKgPerMwh: 397,
                solarPanelConfigs: Array.from({ length: 50 }, (_, i) => {
                    const panelsCount = (i + 1) * 4;
                    return {
                        panelsCount,
                        yearlyEnergyDcKwh: panelsCount * 567.2,
                    };
                }),
            },
        };
    }
    async calculateSolarSavings(dto) {
        const { latitude, longitude } = this.calculateCentroid(dto.polygonCoordinates);
        const solarDataApi = await this.getSolarData(latitude, longitude);
        const solarPanelConfig = this.calculatePanelConfig(solarDataApi.solarPotential, dto.panelsSelected);
        const yearlysAnualConfigurations = solarDataApi.solarPotential.solarPanelConfigs.map((item) => {
            return {
                panelsCount: item.panelsCount,
                yearlyEnergyDcKwh: item.yearlyEnergyDcKwh,
            };
        });
        const yearlyEnergyAcKwh = solarPanelConfig.yearlyEnergyDcKwh *
            dto.parametros.caracteristicasSistema.eficienciaInstalacion;
        const solarData = {
            annualConsumption: dto.annualConsumption,
            yearlyEnergyAcKwh: yearlyEnergyAcKwh,
            panels: {
                panelsCountApi: solarPanelConfig.panelsCount,
                panelsSelected: dto.panelsSelected,
                panelCapacityW: solarDataApi.solarPotential.panelCapacityWatts,
                panelSize: {
                    height: solarDataApi.solarPotential.panelHeightMeters,
                    width: solarDataApi.solarPotential.panelWidthMeters,
                },
                yearlysAnualConfigurations,
            },
            carbonOffsetFactorKgPerMWh: solarDataApi.solarPotential.carbonOffsetFactorKgPerMwh,
            tarifaCategory: dto.categoriaSeleccionada,
        };
        const result = await this.calculadoraService.calculateEnergySavings(solarData, dto);
        return result;
    }
    calculateCentroid(coordenadas) {
        let sumLat = 0;
        let sumLng = 0;
        for (const coord of coordenadas) {
            const lat = parseFloat(coord.lat);
            const lng = parseFloat(coord.lng);
            if (!isNaN(lat) && !isNaN(lng)) {
                sumLat += lat;
                sumLng += lng;
            }
            else {
                console.error(`Invalid coordinate found: ${coord.latitude}, ${coord.longitude}`);
            }
        }
        const centroidLat = sumLat / coordenadas.length;
        const centroidLng = sumLng / coordenadas.length;
        return { latitude: centroidLat, longitude: centroidLng };
    }
    calculatePanelConfig(solarPotential, panelsSelected) {
        if (panelsSelected < 4) {
            panelsSelected = 4;
        }
        const configs = solarPotential.solarPanelConfigs;
        const panelsCount = panelsSelected;
        const index = configs.findIndex((element) => element.panelsCount === panelsCount);
        console.log(`Índice de configuración encontrada: ${index}`);
        if (index === -1) {
            console.log('Configuración exacta no encontrada, procediendo a interpolar');
            const recalculatedConfig = {
                panelsCount: panelsSelected,
                yearlyEnergyDcKwh: this.calculateYearlyEnergyDCkWh(configs, panelsSelected),
            };
            console.log('Configuración interpolada:', JSON.stringify(recalculatedConfig));
            return recalculatedConfig;
        }
        if (index === 0) {
            console.log('Usando primera configuración disponible');
            return configs[0];
        }
        console.log('Usando configuración encontrada:', JSON.stringify(configs[index]));
        return configs[index];
    }
    calculateYearlyEnergyDCkWh(panelConfigs, panelsSelected) {
        const { slope, intercept } = this.calculateLinearRegression(panelConfigs);
        const result = slope * panelsSelected + intercept;
        return result;
    }
    calculateLinearRegression(panelConfigs) {
        const N = panelConfigs.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        panelConfigs.forEach((point, index) => {
            sumX += point.panelsCount;
            sumY += point.yearlyEnergyDcKwh;
            sumXY += point.panelsCount * point.yearlyEnergyDcKwh;
            sumX2 += point.panelsCount * point.panelsCount;
        });
        const slope = (N * sumXY - sumX * sumY) / (N * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / N;
        return { slope, intercept };
    }
    async calculateSolarSavingsNearby(solarDataNearby) {
        const { yearlyEnergyAcKwh, panels: { panelsCountApi, panelsSelected }, } = solarDataNearby;
        const proportion = panelsSelected / panelsCountApi;
        const adjustedYearlyEnergyAcKwh = yearlyEnergyAcKwh * proportion;
        const adjustedSolarDataNearby = {
            ...solarDataNearby,
            yearlyEnergyAcKwh: adjustedYearlyEnergyAcKwh,
        };
        return await this.calculadoraService.calculateEnergySavings(adjustedSolarDataNearby);
    }
};
exports.SolarService = SolarService;
exports.SolarService = SolarService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [calculadora_service_1.CalculadoraService])
], SolarService);
//# sourceMappingURL=solar.service.js.map