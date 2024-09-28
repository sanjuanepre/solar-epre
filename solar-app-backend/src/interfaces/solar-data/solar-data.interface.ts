import { TarifaCategoria } from "src/tarifa-categoria/tarifa-categoria-enum"
import { YearlyAnualConfigurations } from "../yearly-anual-configurations/yearly-anual-configurations.interface"

export interface SolarData {
    annualConsumption: number,
    yearlyEnergyAcKwh: number,
    panels: {
        panelsCountApi: number,
        maxPanelsPerSuperface: number,
        panelsSelected?: number,
        panelCapacityW: number,
        panelSize: {
            height: number,
            width: number
        },
        yearlysAnualConfigurations: YearlyAnualConfigurations[]
    }
    carbonOffsetFactorKgPerMWh: number,
    tarifaCategory: TarifaCategoria,
}
