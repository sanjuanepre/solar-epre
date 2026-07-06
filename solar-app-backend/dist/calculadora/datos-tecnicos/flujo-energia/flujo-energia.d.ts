export declare class FlujoEnergia {
    private readonly year;
    private readonly annualConsumption;
    private readonly generacionFotovoltaicaAnual;
    private readonly proporcionAutoconsumo;
    private readonly proporcionInyeccion;
    constructor(year: number, annualConsumption: number, generacionFotovoltaicaAnual: number, proporcionAutoconsumo: number, proporcionInyeccion: number);
    getEnergiaConsumida(): number;
    getAutoconsumida(): number;
    getInyectada(): number;
    getYear(): number;
}
