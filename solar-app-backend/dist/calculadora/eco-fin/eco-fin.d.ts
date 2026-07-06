import { FlujoIngresosMonetarios } from 'src/interfaces/flujo-ingresos-monetarios/flujo-ingresos-monetarios.interface';
import { ProyeccionTarifas } from 'src/interfaces/proyeccion-tarifas/proyeccion-tarifas.interface';
import { IflujoEnergia } from 'src/interfaces/iflujo-energia/iflujo-energia.interface';
import { SolarCalculationDto } from 'src/solar/dto/solar-calculation.dto';
import { SolarData } from 'src/interfaces/solar-data/solar-data.interface';
import { Tarifa } from 'src/tarifa-categoria/tarifa/tarifa';
import { CostoMantenimiento } from 'src/interfaces/costo-mantenimiento/costo-mantenimiento.interface';
export declare class EcoFin {
    private tipoDeCambioArs;
    private impuestosProvincialesYTasasMunicipales;
    private costoUsdWpAplicado;
    private costoEquipoMedicionUsd;
    private inversionUsd;
    private costoMantenimientoUsd;
    private actualYear;
    private dto;
    private solarData;
    constructor(dto: SolarCalculationDto, solarData: SolarData, tarifaCategory: Tarifa);
    calculateCostoMantenimientoInicialUsd(inversionUsd: number): number;
    getFlujoIngresosMonetarios(periodoVeinteanalFlujoEnergia: IflujoEnergia[], periodoVeinteanalProyeccionTarifas: ProyeccionTarifas[]): FlujoIngresosMonetarios[];
    getProyeccionDeTarifas(tarifaCategory: Tarifa): ProyeccionTarifas[];
    getCostoMantenimiento(): CostoMantenimiento[];
    private calculateInversion;
}
