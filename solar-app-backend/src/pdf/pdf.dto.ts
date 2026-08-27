export class GeneratePdfDto {
  uniqueID?: string;
  categoriaTarifa!: string;
  tipoEstructura!: string; // 'coplanar' | 'optimo'
  roofFactor?: number;
  potenciaContratada!: number;
  panelesCantidad!: number;
  panelCapacityW!: number;
  costoInstalacion!: number;
  ahorroEstimadoPesosAnual!: number;
  ahorroPorcentajeAnual!: number;
  periodoRecuperoAnios!: number;
  potenciaPicoKw!: number;
  generacionAnualKwh!: number;
  superficieTechoM2!: number;
  emisionesGEIEvitadasTnAnual!: number;
  proporcionAutoconsumo!: number;
  proporcionInyectada!: number;
  flujoEnergia?: number[];
  flujoIngresos?: number[];
  textoArboles?: string;
  chartImages?: {
    energiaConsumo?: string;
    donutDistribucion?: string;
    ahorroRecupero?: string;
    emisiones?: string;
    emisionesAnual?: string;
    emisionesComparativa?: string;
    emisionesAcumulada?: string;
    emisionesGauge?: string;
  };
  qrUrl?: string;
}
