import { YearlysAnualConfigurationFront } from "./yearlys-anual-configuration-front"

export interface SolarDataFront {
    annualConsumption: number,
    carbonOffsetFactorKgPerMWh: number,
    panels: {
        maxPanelsPerSuperface: number,
        panelCapacityW: number,
        panelSize: {
            height: number,
            width: number
        },
        panelsCountApi:number,
        panelsSelected?: number,
        yearlysAnualConfigurations?: YearlysAnualConfigurationFront
    },
    tarifaCategory: string,
    yearlyEnergyAcKwh: number
}
