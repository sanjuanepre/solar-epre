import { EmisionesGeiEvitadas } from 'src/interfaces/emisiones-gei-evitadas/emisiones-gei-evitadas.interface';
import { IndicadoresFinancieros } from 'src/interfaces/indicadores-financieros/indicadores-financieros.interface';
import { ResultadosCapitalPropio } from 'src/interfaces/resultados-capital-propio/resultados-capital-propio.interface';
import { EcoFin } from '../eco-fin/eco-fin';
import { FlujoIngresosMonetarios } from 'src/interfaces/flujo-ingresos-monetarios/flujo-ingresos-monetarios.interface';
import { SolarCalculationDto } from 'src/solar/dto/solar-calculation.dto';
import { CostoMantenimiento } from 'src/interfaces/costo-mantenimiento/costo-mantenimiento.interface';
import { SolarData } from 'src/interfaces/solar-data/solar-data.interface';

export class Resultados {
  private readonly tasaDescuento = 10 / 100;
  private _casoConCapitalPropio: ResultadosCapitalPropio[];
  private _indicadoresFinancieros: IndicadoresFinancieros;
  private _emisionesGEIEvitadas: EmisionesGeiEvitadas[];
  private dto: SolarCalculationDto;
  private solarData: SolarData;

  constructor(
    periodoVeinteanalFlujoIngresosMonetarios: FlujoIngresosMonetarios[],
    periodoVeinteanalEmisionesGEIEvitadas: EmisionesGeiEvitadas[],
    periodoVeinteanalCostoMantenimiento: CostoMantenimiento[],
    solarData: SolarData,
    dto?: SolarCalculationDto
  ) {
    this.solarData = solarData;
    this.dto = dto;

    this.generarResultadosCapitalPropio(
      periodoVeinteanalFlujoIngresosMonetarios,
      periodoVeinteanalCostoMantenimiento
    );
    this.generarIndicadoresFinancieros();
    this.emisionesGEIEvitadas = periodoVeinteanalEmisionesGEIEvitadas;
  }

  private generarResultadosCapitalPropio(
    periodoVeinteanalFlujoIngresosMonetarios: FlujoIngresosMonetarios[],
    periodoVeinteanalCostoMantenimiento: CostoMantenimiento[]
  ): void {
    const periodoVeinteanal: ResultadosCapitalPropio[] = [];

    periodoVeinteanal.push({
      year: new Date().getFullYear(),
      flujoIngresos: 0,
      flujoEgresos: 0,
      inversiones: this.dto.parametros.inversionCostos.inversion,
      flujoFondos: 0 - 0 - this.dto.parametros.inversionCostos.inversion,
      flujoAcumulado: 0 - 0 - this.dto.parametros.inversionCostos.inversion,
    });

    for (let i = 1; i < 20; i++) {
      const year = periodoVeinteanal[i - 1].year + 1;

      const currentFlujoIngresos =
        periodoVeinteanalFlujoIngresosMonetarios[i - 1]
          .ahorroEnElectricidadTotalUsd +
        periodoVeinteanalFlujoIngresosMonetarios[i - 1]
          .ingresoPorInyeccionElectricaUsd;

      const currentFlujoEgresos =
        periodoVeinteanalCostoMantenimiento[i].costoUsd

      const currentFlujoFondos =
        currentFlujoIngresos - currentFlujoEgresos;
      const currentFlujoAcumulado =
        periodoVeinteanal[i - 1].flujoAcumulado + currentFlujoFondos;

      periodoVeinteanal.push({
        year,
        flujoIngresos: currentFlujoIngresos,
        flujoEgresos: currentFlujoEgresos,
        flujoFondos: currentFlujoFondos,
        inversiones: 0,
        flujoAcumulado: currentFlujoAcumulado,
      });
    }
    this.casoConCapitalPropio = periodoVeinteanal;
  }

  private generarIndicadoresFinancieros(): void {
    this.indicadoresFinancieros = {
      VAN: this.calcularNPV(),
      TIR: this.calcularTIR(),
      payBackMonths: this.calcularPlazoRetorno(),
    };
  }

  private calcularNPV(): number {
    let npv = 0;
    for (let i = 0; i < this.casoConCapitalPropio.length; i++) {
      npv +=
        this.casoConCapitalPropio[i].flujoFondos /
        Math.pow(1 + this.tasaDescuento, i + 1);
    }
    return npv;
  }

  private calcularTIR(): number {
    const epsilon = 0.0001; // Precisión deseada
    let tasaMin = 0.0;
    let tasaMax = 1.0;
    let tir = (tasaMin + tasaMax) / 2;

    const npv = (tasa: number) => {
      let npvValue = 0;
      for (let i = 0; i < this.casoConCapitalPropio.length; i++) {
        npvValue +=
          this.casoConCapitalPropio[i].flujoFondos / Math.pow(1 + tasa, i + 1);
      }
      return npvValue;
    };

    while (tasaMax - tasaMin > epsilon) {
      tir = (tasaMin + tasaMax) / 2;
      const npvValue = npv(tir);

      if (npvValue > 0) {
        tasaMin = tir;
      } else {
        tasaMax = tir;
      }
    }

    return tir * 100;
  }

  private calcularPlazoRetorno(): number {
    for (let i = 1; i < this.casoConCapitalPropio.length; i++) {
      const flujoActual = this.casoConCapitalPropio[i].flujoAcumulado;
      const flujoAnterior = this.casoConCapitalPropio[i - 1].flujoAcumulado;

      // Si cruzamos de negativo a positivo en este año
      if (flujoAnterior <= 0 && flujoActual > 0) {
        // Interpolar entre el flujo anterior y el actual para obtener la fracción del año
        const fraccionAnual = flujoAnterior / (flujoAnterior - flujoActual);

        // Convertir esa fracción del año en meses
        const meses = fraccionAnual * 12;

        // Retornar el índice en años y la fracción en meses
        return (i - 1) * 12 + meses;
      }
    }

    return -1; // Si no se encuentra un retorno positivo
  }

  public get casoConCapitalPropio(): ResultadosCapitalPropio[] {
    return this._casoConCapitalPropio;
  }
  public set casoConCapitalPropio(value: ResultadosCapitalPropio[]) {
    this._casoConCapitalPropio = value;
  }

  public get indicadoresFinancieros(): IndicadoresFinancieros {
    return this._indicadoresFinancieros;
  }
  public set indicadoresFinancieros(value: IndicadoresFinancieros) {
    this._indicadoresFinancieros = value;
  }

  public get emisionesGEIEvitadas(): EmisionesGeiEvitadas[] {
    return this._emisionesGEIEvitadas;
  }
  public set emisionesGEIEvitadas(value: EmisionesGeiEvitadas[]) {
    this._emisionesGEIEvitadas = value;
  }
}
