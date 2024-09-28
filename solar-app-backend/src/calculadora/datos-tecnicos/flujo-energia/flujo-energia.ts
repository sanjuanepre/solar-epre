import { GeneracionFotovoltaica } from "src/interfaces/generacion-fotovoltaica/generacion-fotovoltaica.interface";

export class FlujoEnergia {

    constructor(
        private readonly year: number,
        private readonly annualConsumption: number,
        private readonly generacionFotovoltaicaAnual: number,
        private readonly proporcionAutoconsumo: number,
        private readonly proporcionInyeccion: number
    ) { }

    public getEnergiaConsumida(): number {
        return this.annualConsumption;
    }

    public getAutoconsumida(): number {
        if (this.getEnergiaConsumida() > (this.generacionFotovoltaicaAnual * this.proporcionAutoconsumo)) {
            return this.generacionFotovoltaicaAnual * this.proporcionAutoconsumo;
        }
        return this.getEnergiaConsumida();
    }

    public getInyectada(): number {
        return this.generacionFotovoltaicaAnual - this.getAutoconsumida();
    }

    public getYear(): number {
        return this.year;
    }

}
