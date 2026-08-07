import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';

import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { EmisionesGeiEvitadasFront } from 'src/app/interfaces/emisiones-gei-evitadas-front';
import { FlujoEnergiaFront } from 'src/app/interfaces/flujo-energia-front';
import { FlujoIngresosMonetariosFront } from 'src/app/interfaces/flujo-ingresos-monetarios-front';
import { GeneracionFotovoltaicaFront } from 'src/app/interfaces/generacion-fotovoltaica-front';
import { SharedService } from 'src/app/services/shared.service';
import * as ApexCharts from 'apexcharts';

@Component({
  selector: 'app-graficos',
  templateUrl: './graficos.component.html',
  styleUrls: ['./graficos.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraficosComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input()
  periodoVeinteanalEmisionesGEIEvitadasOriginal!: EmisionesGeiEvitadasFront[];
  periodoVeinteanalEmisionesGEIEvitadasCopia: EmisionesGeiEvitadasFront[] = [];
  @Input() periodoVeinteanalFlujoEnergia!: FlujoEnergiaFront[];
  @Input()
  periodoVeinteanalFlujoIngresosMonetarios!: FlujoIngresosMonetariosFront[];
  @Input()
  periodoVeinteanalGeneracionFotovoltaica!: GeneracionFotovoltaicaFront[];
  @Input() consumoTotalAnual!: number;
  @Input() yearlyEnergyInitial!: number;
  @Input() proporcionAutoconsumo!: number;
  @Input() proporcionInyectada!: number;
  @Input() inversionInicial!: number;

  @ViewChild('emisionesChartRef')
  emisionesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartSolLunaRef')
  chartSolLunaRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartAhorroRecuperoRef')
  chartAhorroRecuperoRef!: ElementRef<HTMLCanvasElement>;

  recuperoInversionMeses!: number;
  carbonOffSet!: number;
  carbonOffSetInicialTon!: number;
  yearlyEnergy!: number;
  porcentajeCubierto: number = 0;
  chartEmisiones!: ApexCharts;
  chartAhorroRecupero!: ApexCharts;
  private destroy$ = new Subject<void>();
  ahorrosAnualesIniciales!: number;
  chartEnergiaConsumo!: ApexCharts;
  chartDonutEnergia!: ApexCharts;
  vistaCO2: 'anual' | 'comparativa' | 'acumulada' | 'gauge' = 'anual';
  textoArboles: string = '';

  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) { }

  cambiarVistaCO2(vista: 'anual' | 'comparativa' | 'acumulada' | 'gauge') {
    this.vistaCO2 = vista;
    this.renderChartEmisiones();
  }

  ngOnChanges(changes: SimpleChanges): void {
    let hasActualChange = false;
    for (const propName in changes) {
      if (changes[propName].currentValue !== changes[propName].previousValue) {
        hasActualChange = true;
        break;
      }
    }
    if (hasActualChange) {
      this.refreshAllCharts();
    }
  }

  ngOnInit(): void {
    if (!this.yearlyEnergyInitial) {
      this.yearlyEnergyInitial = this.sharedService.getYearlyEnergyAckWh();
    }
    this.yearlyEnergy = this.yearlyEnergyInitial;

    if (!this.recuperoInversionMeses) {
      this.recuperoInversionMeses = this.sharedService.getPlazoInversionValue();
    }
    if (!this.ahorrosAnualesIniciales) {
      this.ahorrosAnualesIniciales = this.sharedService.getAhorroAnualUsd();
    }
    if (!this.periodoVeinteanalFlujoIngresosMonetarios || this.periodoVeinteanalFlujoIngresosMonetarios.length === 0) {
      const resultadosFront = this.sharedService.getResultadosFront();
      if (resultadosFront && resultadosFront.periodoVeinteanalFlujoIngresosMonetarios) {
        this.periodoVeinteanalFlujoIngresosMonetarios =
          resultadosFront.periodoVeinteanalFlujoIngresosMonetarios;
      }
    }
    if (!this.periodoVeinteanalEmisionesGEIEvitadasOriginal || this.periodoVeinteanalEmisionesGEIEvitadasOriginal.length === 0) {
      const resultadosFront = this.sharedService.getResultadosFront();
      if (resultadosFront && resultadosFront.periodoVeinteanalEmisionesGEIEvitadas) {
        this.periodoVeinteanalEmisionesGEIEvitadasOriginal =
          resultadosFront.periodoVeinteanalEmisionesGEIEvitadas;
      }
    }
    if (!this.carbonOffSetInicialTon) {
      this.carbonOffSetInicialTon = this.sharedService.getCarbonOffSetTnAnual();
    }

    this.sharedService.resultadosFront$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resultadosFront) => {
          if (resultadosFront) {
            if (resultadosFront.periodoVeinteanalFlujoIngresosMonetarios) {
              this.periodoVeinteanalFlujoIngresosMonetarios = resultadosFront.periodoVeinteanalFlujoIngresosMonetarios;
            }
            if (resultadosFront.periodoVeinteanalEmisionesGEIEvitadas) {
              this.periodoVeinteanalEmisionesGEIEvitadasOriginal = resultadosFront.periodoVeinteanalEmisionesGEIEvitadas;
            }
            if (resultadosFront.periodoVeinteanalFlujoEnergia) {
              this.periodoVeinteanalFlujoEnergia = resultadosFront.periodoVeinteanalFlujoEnergia;
            }
            if (resultadosFront.periodoVeinteanalGeneracionFotovoltaica) {
              this.periodoVeinteanalGeneracionFotovoltaica = resultadosFront.periodoVeinteanalGeneracionFotovoltaica;
            }
            this.refreshAllCharts();
          }
        },
      });

    this.sharedService.yearlyEnergyAckWh$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe({
        next: (yearlyEnergy) => {
          this.yearlyEnergy = yearlyEnergy;
          this.refreshAllCharts();
        },
      });

    this.sharedService.plazoInversion$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe({
        next: (newPlazoRecupero) => {
          this.recuperoInversionMeses = newPlazoRecupero;
          this.refreshAllCharts();
        },
      });

    this.sharedService.carbonOffSetTnAnual$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe({
        next: (newEmisionesGeiEvitadas) => {
          this.carbonOffSet = newEmisionesGeiEvitadas;
          this.refreshAllCharts();
        },
      });
  }

  ngAfterViewInit(): void {
    this.carbonOffSetInicialTon = this.sharedService.getCarbonOffSetTnAnual();
    this.refreshAllCharts();
  }

  async getChartsImages(): Promise<{ energiaConsumo?: string; ahorroRecupero?: string; emisiones?: string }> {
    const result: { energiaConsumo?: string; ahorroRecupero?: string; emisiones?: string } = {};

    try {
      if (this.chartEnergiaConsumo) {
        const data = await this.chartEnergiaConsumo.dataURI();
        if (data && 'imgURI' in data && data.imgURI) {
          result.energiaConsumo = data.imgURI;
        }
      }
    } catch (e) {
      console.warn('Error al exportar chartEnergiaConsumo:', e);
    }

    try {
      if (this.chartAhorroRecupero) {
        const data = await this.chartAhorroRecupero.dataURI();
        if (data && 'imgURI' in data && data.imgURI) {
          result.ahorroRecupero = data.imgURI;
        }
      }
    } catch (e) {
      console.warn('Error al exportar chartAhorroRecupero:', e);
    }

    try {
      if (this.chartEmisiones) {
        const data = await this.chartEmisiones.dataURI();
        if (data && 'imgURI' in data && data.imgURI) {
          result.emisiones = data.imgURI;
        }
      }
    } catch (e) {
      console.warn('Error al exportar chartEmisiones:', e);
    }

    return result;
  }

  refreshAllCharts(): void {
    if (this.chartEnergiaConsumo) {
      this.updateChartEnergiaConsumo();
    } else {
      this.initializeChartEnergiaConsumo();
    }

    if (this.chartDonutEnergia) {
      this.updateChartDonutEnergia();
    } else {
      this.initializeChartDonutEnergia();
    }

    if (this.chartAhorroRecupero) {
      this.updateChartAhorroRecupero();
    } else {
      this.initializeChartAhorroRecupero();
    }

    if (this.chartEmisiones) {
      this.updateChartEmisionesEvitadasAcumuladas();
    } else {
      this.initializeChartEmisionesEvitadasAcumuladas();
    }
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─────────────────────────────────────────────────
  // GRÁFICA 1: Energía consumida vs. generada (barras apiladas)
  // ─────────────────────────────────────────────────
  private initializeChartEnergiaConsumo() {
    const propAutoconsumo = this.proporcionAutoconsumo ?? 0.8;
    const propInyectada = this.proporcionInyectada ?? 0.2;

    const autoconsumidaKwh = this.yearlyEnergy * propAutoconsumo;
    const inyectadaKwh = this.yearlyEnergy * propInyectada;
    const compradadRedKwh = Math.max(0, this.consumoTotalAnual - autoconsumidaKwh);

    const options = {
      chart: {
        type: 'bar',
        height: 340,
        width: 470,
        stacked: true,
        background: 'transparent',
        toolbar: { show: false },
      },
      series: [
        {
          name: 'Autoconsumo solar',
          data: [autoconsumidaKwh, autoconsumidaKwh],
          color: '#5aaa8a',
        },
        {
          name: 'Comprada a la red',
          data: [compradadRedKwh, 0],
          color: '#c8c8c8',
        },
        {
          name: 'Inyectada a la red',
          data: [0, inyectadaKwh],
          color: '#e4c58d',
        },
      ],
      xaxis: {
        categories: ['Consumo total anual', 'Generación anual FV'],
        labels: {
          style: {
            fontSize: '11px',
            fontFamily: 'sodo sans, sans-serif',
            colors: ['#555', '#555'],
          },
        },
      },
      yaxis: {
        min: 0,
        title: {
          text: 'kWh',
          style: { fontSize: '12px', fontFamily: 'sodo sans, sans-serif' },
        },
        labels: {
          formatter: (val: number): string => val.toLocaleString('de-DE'),
        },
      },
      plotOptions: {
        bar: {
          columnWidth: '50%',
          borderRadius: 4,
        },
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '10px',
          fontFamily: 'sodo sans, sans-serif',
          colors: ['#fff'],
        },
        formatter: (val: number): string => {
          if (val <= 0) return '';
          return val.toLocaleString('de-DE', { maximumFractionDigits: 0 });
        },
      },
      tooltip: {
        enabled: true,
        theme: 'light',
        y: {
          formatter: (val: number) =>
            `${val.toLocaleString('de-DE', { maximumFractionDigits: 0 })} kWh`,
        },
      },
      legend: {
        position: 'bottom',
        fontSize: '11px',
        fontFamily: 'sodo sans, sans-serif',
      },
      fill: { opacity: 1 },
    };

    this.chartEnergiaConsumo = new ApexCharts(
      document.querySelector('#chartSolLunaRef') as HTMLElement,
      options
    );
    this.chartEnergiaConsumo.render();
    this.cdr.detectChanges();
  }

  private updateChartEnergiaConsumo() {
    if (!this.chartEnergiaConsumo) return;
    const propAutoconsumo = this.proporcionAutoconsumo ?? 0.8;
    const propInyectada = this.proporcionInyectada ?? 0.2;
    const autoconsumidaKwh = this.yearlyEnergy * propAutoconsumo;
    const inyectadaKwh = this.yearlyEnergy * propInyectada;
    const compradadRedKwh = Math.max(0, this.consumoTotalAnual - autoconsumidaKwh);

    this.chartEnergiaConsumo.updateOptions({
      series: [
        { name: 'Autoconsumo solar', data: [autoconsumidaKwh, autoconsumidaKwh] },
        { name: 'Comprada a la red', data: [compradadRedKwh, 0] },
        { name: 'Inyectada a la red', data: [0, inyectadaKwh] },
      ],
    }, false, false);
    this.cdr.detectChanges();
  }

  // ─────────────────────────────────────────────────
  // GRÁFICA 2 (NUEVA): Donut de distribución energética
  // ─────────────────────────────────────────────────
  private initializeChartDonutEnergia() {
    const propAutoconsumo = this.proporcionAutoconsumo ?? 0.8;
    const propInyectada = this.proporcionInyectada ?? 0.2;

    const autoconsumidaKwh = this.yearlyEnergy * propAutoconsumo;
    const inyectadaKwh = this.yearlyEnergy * propInyectada;
    const compradadRedKwh = Math.max(0, this.consumoTotalAnual - autoconsumidaKwh);
    const total = autoconsumidaKwh + inyectadaKwh + compradadRedKwh;

    const pctAutoconsumo = total > 0 ? Math.round((autoconsumidaKwh / total) * 100) : 0;
    const pctInyectada = total > 0 ? Math.round((inyectadaKwh / total) * 100) : 0;
    const pctRed = Math.max(0, 100 - pctAutoconsumo - pctInyectada);

    const options = {
      series: [pctAutoconsumo, pctInyectada, pctRed],
      chart: {
        type: 'donut',
        height: 340,
        width: 470,
        background: 'transparent',
        toolbar: { show: false },
      },
      labels: ['Autoconsumo solar', 'Inyección a la red', 'Comprada a la red'],
      colors: ['#5aaa8a', '#e4c58d', '#c8c8c8'],
      legend: {
        position: 'bottom',
        fontSize: '11px',
        fontFamily: 'sodo sans, sans-serif',
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '12px',
          fontFamily: 'sodo sans, sans-serif',
        },
        formatter: (val: number) => `${Math.round(val)} %`,
      },
      plotOptions: {
        pie: {
          donut: {
            size: '60%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Cobertura solar',
                fontSize: '13px',
                fontFamily: 'sodo sans, sans-serif',
                color: '#555',
                formatter: () => `${pctAutoconsumo + pctInyectada} %`,
              },
            },
          },
        },
      },
      tooltip: {
        enabled: true,
        theme: 'light',
        y: {
          formatter: (val: number) => `${val} %`,
        },
      },
    };

    this.chartDonutEnergia = new ApexCharts(
      document.querySelector('#chartDonutEnergiaRef') as HTMLElement,
      options
    );
    this.chartDonutEnergia.render();
    this.cdr.detectChanges();
  }

  private updateChartDonutEnergia() {
    if (!this.chartDonutEnergia) return;
    const propAutoconsumo = this.proporcionAutoconsumo ?? 0.8;
    const propInyectada = this.proporcionInyectada ?? 0.2;
    const autoconsumidaKwh = this.yearlyEnergy * propAutoconsumo;
    const inyectadaKwh = this.yearlyEnergy * propInyectada;
    const compradadRedKwh = Math.max(0, this.consumoTotalAnual - autoconsumidaKwh);
    const total = autoconsumidaKwh + inyectadaKwh + compradadRedKwh;
    const pctAutoconsumo = total > 0 ? Math.round((autoconsumidaKwh / total) * 100) : 0;
    const pctInyectada = total > 0 ? Math.round((inyectadaKwh / total) * 100) : 0;
    const pctRed = Math.max(0, 100 - pctAutoconsumo - pctInyectada);
    this.chartDonutEnergia.updateSeries([pctAutoconsumo, pctInyectada, pctRed]);
    this.cdr.detectChanges();
  }

  // ─────────────────────────────────────────────────
  // GRÁFICA 3: Ahorros anuales + flujo de caja acumulado
  // ─────────────────────────────────────────────────
  private initializeChartAhorroRecupero() {
    const flujoData = this.periodoVeinteanalFlujoIngresosMonetarios;
    if (!flujoData || flujoData.length === 0) {
      return;
    }
    const recuperoMeses = (this.recuperoInversionMeses != null && !isNaN(this.recuperoInversionMeses)) ? this.recuperoInversionMeses : 0;
    const recuperoInversionAnios = Math.round(recuperoMeses / 12);
    const primerAno = (flujoData[0] && flujoData[0].year != null && !isNaN(flujoData[0].year)) ? flujoData[0].year : new Date().getFullYear();
    const anoRecuperoInversion = primerAno + recuperoInversionAnios;
    const anoStr = (anoRecuperoInversion != null && !isNaN(anoRecuperoInversion)) ? anoRecuperoInversion.toString() : '';

    const ahorroData = flujoData.map(item => item?.ahorroEnElectricidadTotalUsd ?? 0);
    const ingresoData = flujoData.map(item => item?.ingresoPorInyeccionElectricaUsd ?? 0);
    const categories = flujoData.map(item => (item?.year != null ? item.year.toString() : ''));

    // Flujo de caja acumulado: empieza en -inversión y suma ahorros+ingresos cada año
    const inversionInicial = this.inversionInicial ?? this.sharedService.getCostoInstalacion?.() ?? 0;
    const flujoCajaAcumulado = flujoData.reduce((acc, item, index) => {
      const prevVal = index === 0 ? -inversionInicial : acc[index - 1];
      const ahorro = item?.ahorroEnElectricidadTotalUsd ?? 0;
      const ingreso = item?.ingresoPorInyeccionElectricaUsd ?? 0;
      acc.push(prevVal + ahorro + ingreso);
      return acc;
    }, [] as number[]);

    const showAnnotation = recuperoMeses > 0 && !!anoStr && categories.includes(anoStr);

    const options = {
      series: [
        {
          name: 'Ahorro por autoconsumo',
          type: 'bar',
          data: ahorroData,
          color: '#5aaa8a',
        },
        {
          name: 'Ingreso por inyección',
          type: 'bar',
          data: ingresoData,
          color: '#e4c58d',
        },
        {
          name: 'Flujo de caja acumulado',
          type: 'line',
          data: flujoCajaAcumulado,
          color: '#008ae3',
        },
      ],
      chart: {
        height: 350,
        width: 470,
        type: 'bar',
        stacked: false,
        background: 'transparent',
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      stroke: {
        width: [0, 0, 3],
        curve: 'smooth',
        colors: ['transparent', 'transparent', '#008ae3'],
      },
      plotOptions: {
        bar: {
          columnWidth: '50%',
          borderRadius: 3,
        },
      },
      xaxis: {
        categories: categories,
        title: {
          text: 'Año',
          style: { fontSize: '12px', fontFamily: 'sodo sans, sans-serif' },
          offsetY: -25,
        },
      },
      yaxis: [
        {
          seriesName: 'Ahorro por autoconsumo',
          title: {
            text: 'USD/año',
            style: { fontSize: '12px', fontFamily: 'sodo sans, sans-serif' },
          },
          labels: {
            formatter: (val: number): string => (val != null && !isNaN(val)) ? val.toLocaleString('de-DE', { maximumFractionDigits: 0 }) : '0',
          },
        },
        {
          seriesName: 'Ingreso por inyección',
          show: false,
        },
        {
          opposite: true,
          seriesName: 'Flujo de caja acumulado',
          title: {
            text: 'Flujo acumulado (USD)',
            style: { fontSize: '12px', fontFamily: 'sodo sans, sans-serif' },
          },
          labels: {
            formatter: (val: number): string => (val != null && !isNaN(val)) ? val.toLocaleString('de-DE', { maximumFractionDigits: 0 }) : '0',
          },
        },
      ],
      tooltip: {
        enabled: true,
        theme: 'light',
        shared: true,
        intersect: false,
        y: {
          formatter: (val: number, { seriesIndex }: any) => {
            if (val == null || isNaN(val)) return '0 USD';
            const valorTruncado = Math.round(val);
            return seriesIndex === 2
              ? `${valorTruncado.toLocaleString('de-DE')} USD`
              : `${valorTruncado.toLocaleString('de-DE')} USD/año`;
          },
        },
      },
      annotations: {
        yaxis: [
          {
            y: 0,
            borderColor: '#999',
            borderWidth: 1,
            strokeDashArray: 4,
          },
        ],
        xaxis: showAnnotation ? [
          {
            x: anoStr,
            strokeDashArray: 5,
            borderColor: '#008ae3',
            borderWidth: 2,
            label: {
              text: `Recupero (~${recuperoInversionAnios} años)`,
              style: {
                fontSize: '10px',
                fontFamily: 'sodo sans, sans-serif',
                background: '#e8f4ff',
                color: '#008ae3',
              },
            },
          },
        ] : [],
      },
      colors: ['#5aaa8a', '#e4c58d', '#008ae3'],
      legend: {
        position: 'bottom',
        fontSize: '11px',
        fontFamily: 'sodo sans, sans-serif',
      },
      dataLabels: { enabled: false },
      fill: { opacity: [0.85, 0.85, 1] },
    };

    this.chartAhorroRecupero = new ApexCharts(
      document.querySelector('#chartAhorroRecuperoRef') as HTMLElement,
      options
    );
    this.chartAhorroRecupero.render();
    this.cdr.detectChanges();
  }

  private updateChartAhorroRecupero() {
    if (!this.chartAhorroRecupero) {
      this.initializeChartAhorroRecupero();
      return;
    }
    const flujoData = this.periodoVeinteanalFlujoIngresosMonetarios;
    if (!flujoData || flujoData.length === 0) return;

    const recuperoMeses = (this.recuperoInversionMeses != null && !isNaN(this.recuperoInversionMeses)) ? this.recuperoInversionMeses : 0;
    const recuperoInversionAnios = Math.round(recuperoMeses / 12);
    const primerAno = (flujoData[0] && flujoData[0].year != null && !isNaN(flujoData[0].year)) ? flujoData[0].year : new Date().getFullYear();
    const anoRecuperoInversion = primerAno + recuperoInversionAnios;
    const anoStr = (anoRecuperoInversion != null && !isNaN(anoRecuperoInversion)) ? anoRecuperoInversion.toString() : '';

    const ahorroData = flujoData.map(item => item?.ahorroEnElectricidadTotalUsd ?? 0);
    const ingresoData = flujoData.map(item => item?.ingresoPorInyeccionElectricaUsd ?? 0);
    const categories = flujoData.map(item => (item?.year != null ? item.year.toString() : ''));

    const inversionInicial = this.inversionInicial ?? this.sharedService.getCostoInstalacion?.() ?? 0;
    const flujoCajaAcumulado = flujoData.reduce((acc, item, index) => {
      const prevVal = index === 0 ? -inversionInicial : acc[index - 1];
      const ahorro = item?.ahorroEnElectricidadTotalUsd ?? 0;
      const ingreso = item?.ingresoPorInyeccionElectricaUsd ?? 0;
      acc.push(prevVal + ahorro + ingreso);
      return acc;
    }, [] as number[]);

    const showAnnotation = recuperoMeses > 0 && !!anoStr && categories.includes(anoStr);

    this.chartAhorroRecupero.updateOptions({
      series: [
        { name: 'Ahorro por autoconsumo', data: ahorroData },
        { name: 'Ingreso por inyección', data: ingresoData },
        { name: 'Flujo de caja acumulado', data: flujoCajaAcumulado },
      ],
      annotations: {
        yaxis: [{ y: 0, borderColor: '#999', borderWidth: 1, strokeDashArray: 4 }],
        xaxis: showAnnotation ? [
          {
            x: anoStr,
            strokeDashArray: 5,
            borderColor: '#008ae3',
            borderWidth: 2,
            label: {
              text: `Recupero (~${recuperoInversionAnios} años)`,
              style: {
                fontSize: '10px',
                fontFamily: 'sodo sans, sans-serif',
                background: '#e8f4ff',
                color: '#008ae3',
              },
            },
          },
        ] : [],
      },
    });
    this.cdr.detectChanges();
  }

  // ─────────────────────────────────────────────────
  // GRÁFICA 4: Emisiones CO₂ evitadas (Anual, Comparativa, Acumulada y Velocímetro)
  // ─────────────────────────────────────────────────
  private initializeChartEmisionesEvitadasAcumuladas() {
    this.renderChartEmisiones();
  }

  private updateChartEmisionesEvitadasAcumuladas(): void {
    this.renderChartEmisiones();
  }

  private renderChartEmisiones() {
    if (this.chartEmisiones) {
      try {
        this.chartEmisiones.destroy();
      } catch (e) {
        console.error('Error destroying chartEmisiones', e);
      }
    }

    if (
      !this.periodoVeinteanalEmisionesGEIEvitadasOriginal ||
      this.periodoVeinteanalEmisionesGEIEvitadasOriginal.length === 0
    ) {
      return;
    }

    const anioInicial = this.periodoVeinteanalEmisionesGEIEvitadasOriginal[0].year - 1;
    const { categories, annualData, cumulativeData } = this.buildCO2Data(
      this.periodoVeinteanalEmisionesGEIEvitadasOriginal,
      anioInicial
    );

    const totalCO2Acumulado = cumulativeData[cumulativeData.length - 1];
    const anos = cumulativeData.length - 1; // 20 años
    // 1 árbol absorbe ~20 kg (0.02 tCO₂) de CO2 por año. En 20 años absorbe 0.4 tCO₂.
    const arbolesequivalentes = Math.round(totalCO2Acumulado / (0.02 * anos));

    this.textoArboles = `Equivale a absorber el CO<sub>2</sub> de ≈ <strong>${arbolesequivalentes.toLocaleString('de-DE')}</strong> árboles en ${anos} años`;

    const carbonOffsetAnual = this.sharedService.getCarbonOffSetTnAnual();
    const factor = carbonOffsetAnual / (this.yearlyEnergy || 1);
    const baseCO2 = parseFloat((this.consumoTotalAnual * factor).toFixed(2));

    let options: any;

    if (this.vistaCO2 === 'anual') {
      options = {
        series: [
          {
            name: 'CO₂ evitado anual',
            data: annualData,
          },
        ],
        chart: {
          height: 320,
          width: '100%',
          type: 'area',
          background: 'transparent',
          toolbar: { show: false },
          zoom: { enabled: false },
        },
        colors: ['#5aaa8a'],
        stroke: {
          curve: 'smooth',
          colors: ['#5aaa8a'],
          width: 3,
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'light',
            type: 'vertical',
            opacityFrom: 0.6,
            opacityTo: 0.1,
          },
        },
        dataLabels: { enabled: false },
        markers: {
          size: 0,
          colors: ['#5aaa8a'],
          strokeColors: '#fff',
          strokeWidth: 2,
          hover: { size: 6 },
        },
        xaxis: {
          categories: categories,
          labels: {
            rotate: -45,
            style: { fontSize: '10px' },
          },
        },
        yaxis: {
          title: {
            text: 'Ton CO₂/año',
            style: { fontSize: '12px', fontFamily: 'sodo sans, sans-serif' },
          },
          labels: {
            formatter: (val: number): string => (val != null && !isNaN(val)) ? val.toLocaleString('de-DE', { maximumFractionDigits: 1 }) : '0',
          },
        },
        tooltip: {
          enabled: true,
          theme: 'light',
          y: {
            formatter: (value: number) => (value != null && !isNaN(value)) ? `${value.toLocaleString('de-DE')} tCO₂ evitado` : '0 tCO₂ evitado',
          },
        },
      };
    } else if (this.vistaCO2 === 'comparativa') {
      const baseSeries = Array(categories.length).fill(baseCO2);
      const realSeries = annualData.map(val => parseFloat(Math.max(0, baseCO2 - val).toFixed(2)));

      options = {
        series: [
          {
            name: 'Emisiones sin solar',
            data: baseSeries,
          },
          {
            name: 'Emisiones con solar',
            data: realSeries,
          },
        ],
        chart: {
          height: 320,
          width: '100%',
          type: 'area',
          background: 'transparent',
          toolbar: { show: false },
          zoom: { enabled: false },
        },
        colors: ['#c8c8c8', '#5aaa8a'],
        stroke: {
          curve: 'smooth',
          width: [2, 3],
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'light',
            type: 'vertical',
            opacityFrom: 0.5,
            opacityTo: 0.1,
          },
        },
        dataLabels: { enabled: false },
        xaxis: {
          categories: categories,
          labels: {
            rotate: -45,
            style: { fontSize: '10px' },
          },
        },
        yaxis: {
          title: {
            text: 'Ton CO₂/año',
            style: { fontSize: '12px', fontFamily: 'sodo sans, sans-serif' },
          },
          labels: {
            formatter: (val: number): string => (val != null && !isNaN(val)) ? val.toLocaleString('de-DE', { maximumFractionDigits: 1 }) : '0',
          },
        },
        legend: {
          position: 'bottom',
          fontSize: '11px',
          fontFamily: 'sodo sans, sans-serif',
        },
        tooltip: {
          enabled: true,
          theme: 'light',
          shared: true,
          y: {
            formatter: (value: number) => (value != null && !isNaN(value)) ? `${value.toLocaleString('de-DE')} tCO₂/año` : '0 tCO₂/año',
          },
        },
      };
    } else if (this.vistaCO2 === 'acumulada') {
      options = {
        series: [
          {
            name: 'CO₂ evitado acumulado',
            data: cumulativeData,
          },
        ],
        chart: {
          height: 320,
          width: '100%',
          type: 'area',
          background: 'transparent',
          toolbar: { show: false },
          zoom: { enabled: false },
        },
        colors: ['#5aaa8a'],
        stroke: {
          curve: 'smooth',
          colors: ['#5aaa8a'],
          width: 3,
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'light',
            type: 'vertical',
            opacityFrom: 0.6,
            opacityTo: 0.1,
          },
        },
        dataLabels: { enabled: false },
        markers: {
          size: 0,
          colors: ['#5aaa8a'],
          strokeColors: '#fff',
          strokeWidth: 2,
          hover: { size: 6 },
        },
        xaxis: {
          categories: categories,
          labels: {
            rotate: -45,
            style: { fontSize: '10px' },
          },
        },
        yaxis: {
          title: {
            text: 'Ton CO₂ acumuladas',
            style: { fontSize: '12px', fontFamily: 'sodo sans, sans-serif' },
          },
          labels: {
            formatter: (val: number): string => (val != null && !isNaN(val)) ? val.toLocaleString('de-DE', { maximumFractionDigits: 1 }) : '0',
          },
        },
        tooltip: {
          enabled: true,
          theme: 'light',
          y: {
            formatter: (value: number) => (value != null && !isNaN(value)) ? `${value.toLocaleString('de-DE')} tCO₂ acumulado` : '0 tCO₂ acumulado',
          },
        },
      };
    } else if (this.vistaCO2 === 'gauge') {
      const totalBaseCO2_20Years = baseCO2 * (this.periodoVeinteanalEmisionesGEIEvitadasOriginal?.length || 1);
      const percent = Math.min(100, Math.round((totalCO2Acumulado / (totalBaseCO2_20Years || 1)) * 100));

      options = {
        series: [percent],
        chart: {
          type: 'radialBar',
          height: 320,
          width: '100%',
          offsetY: -10,
        },
        plotOptions: {
          radialBar: {
            startAngle: -135,
            endAngle: 135,
            hollow: {
              size: '70%',
            },
            track: {
              background: '#e7e7e7',
              strokeWidth: '97%',
              margin: 5,
            },
            dataLabels: {
              name: {
                show: true,
                label: 'Descarbonización',
                color: '#555',
                fontSize: '14px',
                fontFamily: 'sodo sans, sans-serif',
                offsetY: 20
              },
              value: {
                show: true,
                fontSize: '32px',
                fontFamily: 'sodo sans, sans-serif',
                color: '#5aaa8a',
                fontWeight: 'bold',
                offsetY: -20,
                formatter: (val: number) => `${val != null && !isNaN(val) ? val : 0}%`
              }
            }
          }
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'dark',
            type: 'horizontal',
            shadeIntensity: 0.5,
            gradientToColors: ['#5aaa8a'],
            inverseColors: true,
            opacityFrom: 1,
            opacityTo: 1,
            stops: [0, 100]
          }
        },
        colors: ['#e4c58d'],
        stroke: {
          lineCap: 'round'
        },
        subtitle: {
          text: `Evitas el ${percent}% de tus emisiones eléctricas totales`,
          align: 'center',
          style: {
            fontSize: '11px',
            fontFamily: 'sodo sans, sans-serif',
            color: '#555',
          },
        },
      };
    }

    this.chartEmisiones = new ApexCharts(
      document.querySelector('#emisionesChartRef') as HTMLElement,
      options
    );
    this.chartEmisiones.render();
  }

  /**
   * Construye los datos de CO₂ evitado anual y acumulado año a año
   * a partir de la tasa anual (carbonOffSetTnAnual) y la degradación del panel.
   */
  private buildCO2Data(
    source: { year: number; emisionesTonCO2: number }[],
    anioInicial: number
  ): { categories: string[]; annualData: number[]; cumulativeData: number[] } {
    const carbonOffSetAnual = this.sharedService.getCarbonOffSetTnAnual() || 0;
    const degradacion = this.sharedService.getDegradacionPanel() || 0.005;
    const totalYears = source ? source.length : 0;

    const startYr = (anioInicial != null && !isNaN(anioInicial)) ? anioInicial : (new Date().getFullYear() - 1);
    const categories: string[] = [startYr.toString()];
    const annualData: number[] = [0];
    const cumulativeData: number[] = [0];

    let acumulado = 0;
    let anualActual = carbonOffSetAnual;
    for (let i = 0; i < totalYears; i++) {
      acumulado += anualActual;
      const yr = (source && source[i] && source[i].year != null && !isNaN(source[i].year))
        ? source[i].year
        : (startYr + 1 + i);
      categories.push(yr.toString());
      annualData.push(parseFloat((anualActual || 0).toFixed(2)));
      cumulativeData.push(parseFloat((acumulado || 0).toFixed(2)));
      anualActual *= (1 - degradacion);
    }

    return { categories, annualData, cumulativeData };
  }
}
