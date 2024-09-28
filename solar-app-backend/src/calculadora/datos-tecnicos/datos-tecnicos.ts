import { GeneracionFotovoltaica } from 'src/interfaces/generacion-fotovoltaica/generacion-fotovoltaica.interface';
import { EmisionesGeiEvitadas } from 'src/interfaces/emisiones-gei-evitadas/emisiones-gei-evitadas.interface';
import { IflujoEnergia } from 'src/interfaces/iflujo-energia/iflujo-energia.interface';
import { SolarCalculationDto } from 'src/solar/dto/solar-calculation.dto';
import { SolarData } from 'src/interfaces/solar-data/solar-data.interface';

export class DatosTecnicos {
  private readonly eficienciaInstalacion: number;
  private readonly degradacionAnualPaneles: number;
  private readonly factorEmisiontCO2perMWh: number;
  private proporcionAutoconsumo: number;
  private proporcionInyeccion: number;
  private readonly actualYear: number = new Date().getFullYear();
  private dto: SolarCalculationDto;
  private solarData: SolarData;

  constructor(dto: SolarCalculationDto, solarData: SolarData) {
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

  public getGeneracionFotovoltaica(
    yearlyEnergyACkWh: number,
  ): GeneracionFotovoltaica[] {
    const periodoVeinteanal: GeneracionFotovoltaica[] = [];

    // Generación del primer año
    periodoVeinteanal.push({
      anio: this.actualYear + 1,
      generacionFotovoltaicaKWh: yearlyEnergyACkWh,
    });

    // Generación de los siguientes 19 años con degradación anual
    for (let i = 1; i < 20; i++) {
      const previousYearGeneration =
        periodoVeinteanal[i - 1].generacionFotovoltaicaKWh;
      const degradedGeneration =
        previousYearGeneration * (1 - this.degradacionAnualPaneles);
      periodoVeinteanal.push({
        anio: periodoVeinteanal[i - 1].anio + 1,
        generacionFotovoltaicaKWh: degradedGeneration,
      });
    }

    return periodoVeinteanal;
  }

  public getFlujoEnergia(
    annualConsumption: number,
    yearlyEnergyACkWh: number,
    periodoVeinteanalGeneracionFotovoltaica: GeneracionFotovoltaica[],
  ): IflujoEnergia[] {
    const periodoVeinteanal: IflujoEnergia[] = [];

    periodoVeinteanal.push({
      anio: this.actualYear + 1,
      energiaAutoconsumidakWhAnio:
        annualConsumption >
          periodoVeinteanalGeneracionFotovoltaica[0].generacionFotovoltaicaKWh *
          this.proporcionAutoconsumo
          ? periodoVeinteanalGeneracionFotovoltaica[0]
            .generacionFotovoltaicaKWh * this.proporcionAutoconsumo
          : annualConsumption,
      energiaInyectadakWhAnio:
        periodoVeinteanalGeneracionFotovoltaica[0].generacionFotovoltaicaKWh -
        (annualConsumption >
          periodoVeinteanalGeneracionFotovoltaica[0].generacionFotovoltaicaKWh *
          this.proporcionAutoconsumo
          ? periodoVeinteanalGeneracionFotovoltaica[0]
            .generacionFotovoltaicaKWh * this.proporcionAutoconsumo
          : annualConsumption),
    });

    // Generación de los siguientes 19 años
    for (let i = 1; i < 20; i++) {
      const currentYear: number =
        periodoVeinteanalGeneracionFotovoltaica[i].anio;

      periodoVeinteanal.push({
        anio: currentYear,
        energiaAutoconsumidakWhAnio:
          annualConsumption >
            periodoVeinteanalGeneracionFotovoltaica[i].generacionFotovoltaicaKWh *
            this.proporcionAutoconsumo
            ? periodoVeinteanalGeneracionFotovoltaica[i]
              .generacionFotovoltaicaKWh * this.proporcionAutoconsumo
            : annualConsumption,
        energiaInyectadakWhAnio:
          periodoVeinteanalGeneracionFotovoltaica[i].generacionFotovoltaicaKWh -
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

  public getEmisionesGEIEvitadas(
    periodoVeinteanalGeneracionFotovoltaica: GeneracionFotovoltaica[],
  ): EmisionesGeiEvitadas[] {
    const periodoVeinteanal: EmisionesGeiEvitadas[] = [];
    // Generación del primer año
    periodoVeinteanal.push({
      year: periodoVeinteanalGeneracionFotovoltaica[0].anio,
      emisionesTonCO2:
        periodoVeinteanalGeneracionFotovoltaica[0].generacionFotovoltaicaKWh *
        (this.factorEmisiontCO2perMWh / 1000),
    });
    // Generación de los siguientes 19 años
    for (let i = 1; i < 20; i++) {
      const currentYearGeneration =
        periodoVeinteanalGeneracionFotovoltaica[i].generacionFotovoltaicaKWh;
      const emisionesTonCO2 =
        currentYearGeneration * (this.factorEmisiontCO2perMWh / 1000);

      periodoVeinteanal.push({
        year: periodoVeinteanalGeneracionFotovoltaica[i].anio,
        emisionesTonCO2,
      });
    }


    return periodoVeinteanal;
  }
}
