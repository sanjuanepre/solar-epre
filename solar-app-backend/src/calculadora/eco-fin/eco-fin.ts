import { FlujoIngresosMonetarios } from 'src/interfaces/flujo-ingresos-monetarios/flujo-ingresos-monetarios.interface';
import { ProyeccionTarifas } from 'src/interfaces/proyeccion-tarifas/proyeccion-tarifas.interface';
import { IflujoEnergia } from 'src/interfaces/iflujo-energia/iflujo-energia.interface';
import { SolarCalculationDto } from 'src/solar/dto/solar-calculation.dto';
import { SolarData } from 'src/interfaces/solar-data/solar-data.interface';
import { Tarifa } from 'src/tarifa-categoria/tarifa/tarifa';
import { CostoMantenimiento } from 'src/interfaces/costo-mantenimiento/costo-mantenimiento.interface';

export class EcoFin {
  private tipoDeCambioArs: number;
  private impuestosProvincialesYTasasMunicipales: number;
  private costoUsdWpAplicado: number;
  private costoEquipoMedicionUsd: number;
  private inversionUsd: number;
  private costoMantenimientoUsd: number;
  private actualYear: number = new Date().getFullYear();
  private dto: SolarCalculationDto;
  private solarData: SolarData;

  constructor(
    dto: SolarCalculationDto,
    solarData: SolarData,
    tarifaCategory: Tarifa,
  ) {
    this.dto = dto;
    this.solarData = solarData;
    this.tipoDeCambioArs = dto.parametros.economicas.tipoCambioArs;
    this.impuestosProvincialesYTasasMunicipales = tarifaCategory.impuestos;
    this.costoUsdWpAplicado = dto.parametros.inversionCostos.costoUsdWpAplicado;
    this.costoEquipoMedicionUsd =
      dto.parametros.inversionCostos.equipoDeMedicionUsdAplicado;

    this.inversionUsd = this.calculateInversion(dto, solarData);

    this.costoMantenimientoUsd = this.calculateCostoMantenimientoInicialUsd(
      this.inversionUsd,
    );
  }

  calculateCostoMantenimientoInicialUsd(inversionUsd: number): number {
    return inversionUsd * 0.01;
  }

  getFlujoIngresosMonetarios(
    periodoVeinteanalFlujoEnergia: IflujoEnergia[],
    periodoVeinteanalProyeccionTarifas: ProyeccionTarifas[],
  ): FlujoIngresosMonetarios[] {
    const periodoVeinteanal: FlujoIngresosMonetarios[] = [];

    // Generación del primer año
    periodoVeinteanal.push({
      year: periodoVeinteanalFlujoEnergia[0].anio,
      ahorroEnElectricidadTotalUsd:
        periodoVeinteanalFlujoEnergia[0].energiaAutoconsumidakWhAnio *
        periodoVeinteanalProyeccionTarifas[1]?.cargoVariableConsumoUsdkWh *
        (1 + this.impuestosProvincialesYTasasMunicipales),
      ingresoPorInyeccionElectricaUsd:
        periodoVeinteanalFlujoEnergia[0].energiaInyectadakWhAnio *
        periodoVeinteanalProyeccionTarifas[1]?.cargoVariableInyeccionUsdKwh,
    });

    // Generación de los siguientes 19 años
    for (let i = 1; i < 20; i++) {
      const previousYearAutoconsumida =
        periodoVeinteanalFlujoEnergia[i].energiaAutoconsumidakWhAnio;
      const previousYearInyectada =
        periodoVeinteanalFlujoEnergia[i].energiaInyectadakWhAnio;

      const tarifa = periodoVeinteanalProyeccionTarifas[i + 1]
        ? periodoVeinteanalProyeccionTarifas[i + 1]
        : periodoVeinteanalProyeccionTarifas[
            periodoVeinteanalProyeccionTarifas.length - 1
          ]; // Último valor disponible

      periodoVeinteanal.push({
        year: periodoVeinteanalFlujoEnergia[i].anio,
        ahorroEnElectricidadTotalUsd:
          previousYearAutoconsumida *
          tarifa.cargoVariableConsumoUsdkWh *
          (1 + this.impuestosProvincialesYTasasMunicipales),
        ingresoPorInyeccionElectricaUsd:
          previousYearInyectada * tarifa.cargoVariableInyeccionUsdKwh,
      });
    }

    return periodoVeinteanal;
  }

  getProyeccionDeTarifas(tarifaCategory: Tarifa): ProyeccionTarifas[] {
    const periodoVeinteanal: ProyeccionTarifas[] = [];

    periodoVeinteanal.push({
      year: this.actualYear,
      cargoVariableConsumoUsdkWh:
        tarifaCategory.tarifaConsumoEnergiaArs / this.tipoDeCambioArs,
      cargoVariableInyeccionUsdKwh:
        tarifaCategory.tarifaInyeccionEnergiaArs / this.tipoDeCambioArs,
      tasaAnualAumentoDeTarifas:
        this.dto.parametros.economicas.tasaInflacionUsd,
    });

    for (let i = 1; i < 20; i++) {
      const previousProyeccion = periodoVeinteanal[i - 1];
      periodoVeinteanal.push({
        year: previousProyeccion.year + 1,
        cargoVariableConsumoUsdkWh:
          previousProyeccion.cargoVariableConsumoUsdkWh *
          (1 + this.dto.parametros.economicas.tasaInflacionUsd),
        cargoVariableInyeccionUsdKwh:
          previousProyeccion.cargoVariableInyeccionUsdKwh *
          (1 + this.dto.parametros.economicas.tasaInflacionUsd),
        tasaAnualAumentoDeTarifas:
          this.dto.parametros.economicas.tasaInflacionUsd,
      });
    }

    return periodoVeinteanal;
  }

  getCostoMantenimiento() {
    const periodoVeinteanal: CostoMantenimiento[] = [];
    
    periodoVeinteanal.push({
      year: this.actualYear,
      costoUsd: this.costoMantenimientoUsd,
    });

    for (let i = 1; i < 20; i++) {
      const previousCosto = periodoVeinteanal[i - 1];
      periodoVeinteanal.push({
        year: previousCosto.year + 1,
        costoUsd:
          previousCosto.costoUsd *
          (1 + this.dto.parametros.economicas.tasaInflacionUsd),
      });
    }

    return periodoVeinteanal;
  }

  private calculateInversion(
    dto: SolarCalculationDto,
    solarData: SolarData,
  ): number {
    const panelsApi = solarData.panels.panelsCountApi;
    const panelsSelected = solarData.panels.panelsSelected ?? panelsApi;

    const costoUsdWp = dto.parametros.inversionCostos.costoUsdWpAplicado;

    const instalacionCapacityW =
      panelsSelected * solarData.panels.panelCapacityW;
    const costoEquipoMedicionUsd =
      dto.parametros.inversionCostos.equipoDeMedicionUsdAplicado;
   
    const inversionInicial =
      costoUsdWp * instalacionCapacityW + costoEquipoMedicionUsd;
    this.dto.parametros.inversionCostos.inversion = inversionInicial;
    this.dto.parametros.inversionCostos.costoDeMantenimientoInicialUsd = inversionInicial * 0.01;
    return inversionInicial;
  }
}
