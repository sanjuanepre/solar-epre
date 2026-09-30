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

  private async exportChartOffscreen(options: any, width: number = 800, height: number = 300): Promise<string | undefined> {
    if (!options) return undefined;
    let tempDiv: HTMLDivElement | null = null;
    let tempChart: any = null;
    try {
      tempDiv = document.createElement('div');
      tempDiv.style.position = 'fixed';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = `${width}px`;
      tempDiv.style.height = `${height}px`;
      tempDiv.style.zIndex = '-1000';
      document.body.appendChild(tempDiv);

      const exportOpts = {
        ...options,
        chart: {
          ...options.chart,
          width: width,
          height: height,
          background: '#ffffff',
          animations: { enabled: false },
        },
      };

      tempChart = new (ApexCharts as any)(tempDiv, exportOpts);
      await tempChart.render();
      await new Promise((resolve) => setTimeout(resolve, 80));
      const data = await tempChart.dataURI();
      if (data && 'imgURI' in data && data.imgURI) {
        return data.imgURI;
      }
    } catch (err) {
      console.warn('exportChartOffscreen falló, usando fallback:', err);
    } finally {
      try {
        if (tempChart) tempChart.destroy();
      } catch (_) {}
      try {
        if (tempDiv && tempDiv.parentNode) tempDiv.parentNode.removeChild(tempDiv);
      } catch (_) {}
    }
    return undefined;
  }

  async getChartsImages(): Promise<{
    energiaConsumo?: string;
    donutDistribucion?: string;
    ahorroRecupero?: string;
    emisiones?: string;
    emisionesAnual?: string;
    emisionesComparativa?: string;
    emisionesAcumulada?: string;
    emisionesGauge?: string;
  }> {
    const result: {
      energiaConsumo?: string;
      donutDistribucion?: string;
      ahorroRecupero?: string;
      emisiones?: string;
      emisionesAnual?: string;
      emisionesComparativa?: string;
      emisionesAcumulada?: string;
      emisionesGauge?: string;
    } = {};

    // 1. Energía Consumo
    try {
      result.energiaConsumo = await this.exportChartOffscreen(this.getOptionsEnergiaConsumo(true), 850, 300);
      if (!result.energiaConsumo && this.chartEnergiaConsumo) {
        const data = await this.chartEnergiaConsumo.dataURI();
        if (data && 'imgURI' in data && data.imgURI) {
          result.energiaConsumo = data.imgURI;
        }
      }
    } catch (e) {
      console.warn('Error al exportar chartEnergiaConsumo:', e);
    }

    // 3. Ahorro Recupero
    try {
      result.ahorroRecupero = await this.exportChartOffscreen(this.getOptionsAhorroRecupero(true), 850, 320);
      if (!result.ahorroRecupero && this.chartAhorroRecupero) {
        const data = await this.chartAhorroRecupero.dataURI();
        if (data && 'imgURI' in data && data.imgURI) {
          result.ahorroRecupero = data.imgURI;
        }
      }
    } catch (e) {
      console.warn('Error al exportar chartAhorroRecupero:', e);
    }

    // 4. Emisiones Anual
    try {
      result.emisionesAnual = await this.exportChartOffscreen(this.getOptionsEmisionesVista('anual', true), 750, 300);
    } catch (e) {
      console.warn('Error al exportar emisionesAnual:', e);
    }

    // 5. Emisiones Comparativa
    try {
      result.emisionesComparativa = await this.exportChartOffscreen(this.getOptionsEmisionesVista('comparativa', true), 750, 300);
    } catch (e) {
      console.warn('Error al exportar emisionesComparativa:', e);
    }

    // 6. Emisiones Acumulada
    try {
      result.emisionesAcumulada = await this.exportChartOffscreen(this.getOptionsEmisionesVista('acumulada', true), 750, 300);
      result.emisiones = result.emisionesAcumulada || result.emisionesAnual;
    } catch (e) {
      console.warn('Error al exportar emisionesAcumulada:', e);
    }

    // 7. Emisiones Gauge
    try {
      result.emisionesGauge = await this.exportChartOffscreen(this.getOptionsEmisionesVista('gauge', true), 450, 280);
    } catch (e) {
      console.warn('Error al exportar emisionesGauge:', e);
    }

    return result;
  }

  refreshAllCharts(): void {
    if (this.chartEnergiaConsumo) {
      this.updateChartEnergiaConsumo();
    } else {
      this.initializeChartEnergiaConsumo();
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
  private getOptionsEnergiaConsumo(forExport: boolean = false) {
    const yearlyEnergy = Math.round(this.yearlyEnergy || 0);
    const consumoAnual = Math.round(this.consumoTotalAnual || 0);

    let series: any[];
    let colors: string[];

    if (yearlyEnergy > consumoAnual) {
      // Caso 1: Cuando la Energía Generada supera el Consumo Total.
      // - Consumo Total Anual: dejar como está (barra única con valor consumoTotalAnual, verde)
      // - Generación anual FV: Autoconsumo solar (igual a Consumo Total anual) + Inyectada a la red (Energía Generada - Consumo Total Anual)
      const inyectadaKwh = Math.max(0, yearlyEnergy - consumoAnual);
      series = [
        {
          name: 'Autoconsumo solar',
          data: [consumoAnual, consumoAnual],
        },
        {
          name: 'Inyectada a la red',
          data: [0, inyectadaKwh],
        },
      ];
      colors = ['#5aaa8a', '#e4c58d'];
    } else {
      // Caso 2: Cuando la Energía Generada es igual o menor al Consumo Total.
      // - Consumo Total Anual: mostrar barra única, usar otro color (#334155)
      // - Generación anual FV: Autoconsumo solar (80 % de Energía Generada) + Inyectada a la red (20 % de Energía Generada)
      const autoconsumoKwh = Math.round(yearlyEnergy * 0.8);
      const inyectadaKwh = Math.round(yearlyEnergy * 0.2);
      series = [
        {
          name: 'Consumo total anual',
          data: [consumoAnual, 0],
        },
        {
          name: 'Autoconsumo solar',
          data: [0, autoconsumoKwh],
        },
        {
          name: 'Inyectada a la red',
          data: [0, inyectadaKwh],
        },
      ];
      colors = ['#334155', '#5aaa8a', '#e4c58d'];
    }

    return {
      chart: {
        type: 'bar',
        height: forExport ? 300 : 340,
        width: forExport ? 800 : '100%',
        stacked: true,
        background: forExport ? '#ffffff' : 'transparent',
        toolbar: { show: false },
        animations: { enabled: !forExport },
      },
      colors: colors,
      series: series,
      xaxis: {
        categories: ['Consumo total anual', 'Generación anual FV'],
        labels: {
          rotate: 0,
          rotateAlways: false,
          hideOverlappingLabels: false,
          trim: false,
          style: {
            fontSize: forExport ? '12px' : '11.5px',
            fontFamily: 'sodo sans, sans-serif',
            colors: ['#475569', '#475569'],
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
          formatter: (val: number): string => (val != null && !isNaN(val)) ? val.toLocaleString('de-DE') : '0',
        },
      },
      plotOptions: {
        bar: {
          columnWidth: forExport ? '35%' : '42%',
          borderRadius: 4,
        },
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '11px',
          fontFamily: 'sodo sans, sans-serif',
          colors: ['#fff'],
        },
        formatter: (val: number): string => {
          if (val <= 0) return '';
          return val.toLocaleString('de-DE', { maximumFractionDigits: 0 });
        },
      },
      tooltip: {
        enabled: !forExport,
        theme: 'light',
        y: {
          formatter: (val: number) =>
            `${val.toLocaleString('de-DE', { maximumFractionDigits: 0 })} kWh`,
        },
      },
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '12px',
        fontFamily: 'sodo sans, sans-serif',
        itemMargin: {
          horizontal: 10,
          vertical: 4,
        },
      },
      fill: { opacity: 1 },
      responsive: forExport ? [] : [
        {
          breakpoint: 768,
          options: {
            chart: {
              height: 290,
            },
            plotOptions: {
              bar: {
                columnWidth: '50%',
                borderRadius: 4,
              },
            },
            xaxis: {
              labels: {
                rotate: 0,
                rotateAlways: false,
                style: {
                  fontSize: '10.5px',
                },
              },
            },
            yaxis: {
              title: {
                text: 'kWh',
                style: { fontSize: '10.5px' },
              },
              labels: {
                style: { fontSize: '10px' },
              },
            },
            dataLabels: {
              style: {
                fontSize: '10px',
              },
            },
            legend: {
              position: 'bottom',
              horizontalAlign: 'center',
              fontSize: '11px',
              itemMargin: {
                horizontal: 8,
                vertical: 3,
              },
            },
          },
        },
      ],
    };
  }

  private initializeChartEnergiaConsumo() {
    const options = this.getOptionsEnergiaConsumo(false);
    this.chartEnergiaConsumo = new ApexCharts(
      document.querySelector('#chartSolLunaRef') as HTMLElement,
      options
    );
    this.chartEnergiaConsumo.render();
    this.cdr.detectChanges();
  }

  private updateChartEnergiaConsumo() {
    if (!this.chartEnergiaConsumo) return;
    const options = this.getOptionsEnergiaConsumo(false);
    this.chartEnergiaConsumo.updateOptions(options, true, false);
    this.cdr.detectChanges();
  }

  // ─────────────────────────────────────────────────
  // GRÁFICA 3: Ahorros anuales + flujo de caja acumulado
  // ─────────────────────────────────────────────────
  private getOptionsAhorroRecupero(forExport: boolean = false) {
    const flujoData = this.periodoVeinteanalFlujoIngresosMonetarios;
    if (!flujoData || flujoData.length === 0) {
      return null;
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

    return {
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
        height: forExport ? 300 : 360,
        width: forExport ? 850 : '100%',
        type: 'bar',
        stacked: false,
        background: forExport ? '#ffffff' : 'transparent',
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { enabled: !forExport },
      },
      stroke: {
        width: [0, 0, 3],
        curve: 'smooth',
        colors: ['transparent', 'transparent', '#008ae3'],
      },
      plotOptions: {
        bar: {
          columnWidth: '55%',
          borderRadius: 3,
        },
      },
      xaxis: {
        categories: categories,
        tickAmount: forExport ? 20 : 10,
        tickPlacement: 'between',
        labels: {
          rotate: -35,
          rotateAlways: false,
          hideOverlappingLabels: true,
          trim: true,
          style: {
            fontSize: '11px',
            fontFamily: 'sodo sans, sans-serif',
            colors: '#475569',
          },
        },
        axisBorder: { show: true, color: '#e2e8f0' },
        axisTicks: { show: true, color: '#cbd5e1' },
      },
      yaxis: [
        {
          seriesName: 'Ahorro por autoconsumo',
          title: {
            text: 'USD/año',
            style: { fontSize: '12px', fontFamily: 'sodo sans, sans-serif', color: '#475569' },
          },
          labels: {
            formatter: (val: number): string => (val != null && !isNaN(val)) ? val.toLocaleString('de-DE', { maximumFractionDigits: 0 }) : '0',
            style: { fontSize: '11px', fontFamily: 'sodo sans, sans-serif' },
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
            style: { fontSize: '12px', fontFamily: 'sodo sans, sans-serif', color: '#008ae3' },
          },
          labels: {
            formatter: (val: number): string => (val != null && !isNaN(val)) ? val.toLocaleString('de-DE', { maximumFractionDigits: 0 }) : '0',
            style: { fontSize: '11px', fontFamily: 'sodo sans, sans-serif' },
          },
        },
      ],
      tooltip: {
        enabled: !forExport,
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
            borderColor: '#94a3b8',
            borderWidth: 1.5,
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
              orientation: 'vertical',
              style: {
                fontSize: '10.5px',
                fontFamily: 'sodo sans, sans-serif',
                background: '#e0f2fe',
                color: '#0369a1',
                fontWeight: 600,
                padding: { left: 6, right: 6, top: 4, bottom: 4 },
              },
            },
          },
        ] : [],
      },
      colors: ['#5aaa8a', '#e4c58d', '#008ae3'],
      legend: {
        position: 'bottom',
        fontSize: '12px',
        fontFamily: 'sodo sans, sans-serif',
        markers: {
          radius: 3,
        },
      },
      dataLabels: { enabled: false },
      fill: { opacity: [0.85, 0.85, 1] },
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: { height: 320 },
            xaxis: {
              tickAmount: 6,
              labels: {
                rotate: -45,
                rotateAlways: true,
                style: { fontSize: '10px' },
              },
            },
            yaxis: [
              {
                title: { text: 'USD/año', style: { fontSize: '10px' } },
                labels: {
                  style: { fontSize: '10px' },
                  formatter: (val: number) => (val != null && !isNaN(val)) ? (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toString()) : '0',
                },
              },
              { show: false },
              {
                opposite: true,
                title: { text: 'Flujo (USD)', style: { fontSize: '10px' } },
                labels: {
                  style: { fontSize: '10px' },
                  formatter: (val: number) => (val != null && !isNaN(val)) ? (Math.abs(val) >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toString()) : '0',
                },
              },
            ],
            legend: {
              position: 'bottom',
              fontSize: '10px',
            },
          },
        },
      ],
    };
  }

  private initializeChartAhorroRecupero() {
    const options = this.getOptionsAhorroRecupero(false);
    if (!options) return;

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
      xaxis: {
        categories: categories,
        tickAmount: 10,
        labels: {
          rotate: -35,
          rotateAlways: false,
          hideOverlappingLabels: true,
        },
      },
      annotations: {
        yaxis: [{ y: 0, borderColor: '#94a3b8', borderWidth: 1.5, strokeDashArray: 4 }],
        xaxis: showAnnotation ? [
          {
            x: anoStr,
            strokeDashArray: 5,
            borderColor: '#008ae3',
            borderWidth: 2,
            label: {
              text: `Recupero (~${recuperoInversionAnios} años)`,
              orientation: 'vertical',
              style: {
                fontSize: '10.5px',
                fontFamily: 'sodo sans, sans-serif',
                background: '#e0f2fe',
                color: '#0369a1',
                fontWeight: 600,
                padding: { left: 6, right: 6, top: 4, bottom: 4 },
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

  private getOptionsEmisionesVista(vista: 'anual' | 'comparativa' | 'acumulada' | 'gauge', forExport: boolean = false) {
    if (
      !this.periodoVeinteanalEmisionesGEIEvitadasOriginal ||
      this.periodoVeinteanalEmisionesGEIEvitadasOriginal.length === 0
    ) {
      return null;
    }

    const anioInicial = this.periodoVeinteanalEmisionesGEIEvitadasOriginal[0].year - 1;
    const { categories, annualData, cumulativeData } = this.buildCO2Data(
      this.periodoVeinteanalEmisionesGEIEvitadasOriginal,
      anioInicial
    );

    const totalCO2Acumulado = cumulativeData[cumulativeData.length - 1];
    const carbonOffsetAnual = this.sharedService.getCarbonOffSetTnAnual();
    const factor = carbonOffsetAnual / (this.yearlyEnergy || 1);
    const consumoAnual = this.consumoTotalAnual || 0;
    const baseCO2 = parseFloat((consumoAnual * factor).toFixed(2));

    if (vista === 'anual') {
      return {
        series: [
          {
            name: 'CO₂ evitado anual',
            data: annualData,
          },
        ],
        chart: {
          height: forExport ? 260 : 330,
          width: forExport ? 750 : '100%',
          type: 'area',
          background: forExport ? '#ffffff' : 'transparent',
          toolbar: { show: false },
          zoom: { enabled: false },
          animations: { enabled: !forExport },
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
          tickAmount: forExport ? 10 : 10,
          labels: {
            rotate: -35,
            rotateAlways: false,
            hideOverlappingLabels: true,
            style: { fontSize: '11px', fontFamily: 'sodo sans, sans-serif', colors: '#475569' },
          },
          axisBorder: { show: true, color: '#e2e8f0' },
          axisTicks: { show: true, color: '#cbd5e1' },
        },
        yaxis: {
          title: {
            text: 'Ton CO₂/año',
            style: { fontSize: '12px', fontFamily: 'sodo sans, sans-serif', color: '#475569' },
          },
          labels: {
            formatter: (val: number): string => (val != null && !isNaN(val)) ? val.toLocaleString('de-DE', { maximumFractionDigits: 1 }) : '0',
            style: { fontSize: '11px', fontFamily: 'sodo sans, sans-serif' },
          },
        },
        tooltip: {
          enabled: !forExport,
          theme: 'light',
          y: {
            formatter: (value: number) => (value != null && !isNaN(value)) ? `${value.toLocaleString('de-DE', { maximumFractionDigits: 2 })} tCO₂ evitado` : '0 tCO₂ evitado',
          },
        },
        responsive: [
          {
            breakpoint: 768,
            options: {
              chart: { height: 300 },
              xaxis: {
                tickAmount: 5,
                labels: { rotate: -45, rotateAlways: true, style: { fontSize: '10px' } },
              },
              yaxis: {
                title: { text: 't CO₂/año', style: { fontSize: '10px' } },
                labels: { style: { fontSize: '10px' } },
              },
            },
          },
        ],
      };
    } else if (vista === 'comparativa') {
      const baseSeries = Array(categories.length).fill(baseCO2);
      const realSeries = annualData.map(val => parseFloat(Math.max(0, baseCO2 - val).toFixed(2)));

      return {
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
          height: forExport ? 260 : 330,
          width: forExport ? 750 : '100%',
          type: 'area',
          background: forExport ? '#ffffff' : 'transparent',
          toolbar: { show: false },
          zoom: { enabled: false },
          animations: { enabled: !forExport },
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
          tickAmount: forExport ? 10 : 10,
          labels: {
            rotate: -35,
            rotateAlways: false,
            hideOverlappingLabels: true,
            style: { fontSize: '11px', fontFamily: 'sodo sans, sans-serif', colors: '#475569' },
          },
          axisBorder: { show: true, color: '#e2e8f0' },
          axisTicks: { show: true, color: '#cbd5e1' },
        },
        yaxis: {
          title: {
            text: 'Ton CO₂/año',
            style: { fontSize: '12px', fontFamily: 'sodo sans, sans-serif', color: '#475569' },
          },
          labels: {
            formatter: (val: number): string => (val != null && !isNaN(val)) ? val.toLocaleString('de-DE', { maximumFractionDigits: 1 }) : '0',
            style: { fontSize: '11px', fontFamily: 'sodo sans, sans-serif' },
          },
        },
        legend: {
          position: 'bottom',
          fontSize: '12px',
          fontFamily: 'sodo sans, sans-serif',
          markers: { radius: 3 },
        },
        tooltip: {
          enabled: !forExport,
          theme: 'light',
          shared: true,
          y: {
            formatter: (value: number) => (value != null && !isNaN(value)) ? `${value.toLocaleString('de-DE', { maximumFractionDigits: 2 })} tCO₂/año` : '0 tCO₂/año',
          },
        },
        responsive: [
          {
            breakpoint: 768,
            options: {
              chart: { height: 300 },
              xaxis: {
                tickAmount: 5,
                labels: { rotate: -45, rotateAlways: true, style: { fontSize: '10px' } },
              },
              yaxis: {
                title: { text: 't CO₂/año', style: { fontSize: '10px' } },
                labels: { style: { fontSize: '10px' } },
              },
              legend: { fontSize: '10px' },
            },
          },
        ],
      };
    } else if (vista === 'acumulada') {
      return {
        series: [
          {
            name: 'CO₂ evitado acumulado',
            data: cumulativeData,
          },
        ],
        chart: {
          height: forExport ? 260 : 330,
          width: forExport ? 750 : '100%',
          type: 'area',
          background: forExport ? '#ffffff' : 'transparent',
          toolbar: { show: false },
          zoom: { enabled: false },
          animations: { enabled: !forExport },
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
          tickAmount: forExport ? 10 : 10,
          labels: {
            rotate: -35,
            rotateAlways: false,
            hideOverlappingLabels: true,
            style: { fontSize: '11px', fontFamily: 'sodo sans, sans-serif', colors: '#475569' },
          },
          axisBorder: { show: true, color: '#e2e8f0' },
          axisTicks: { show: true, color: '#cbd5e1' },
        },
        yaxis: {
          title: {
            text: 'Ton CO₂ acumuladas',
            style: { fontSize: '12px', fontFamily: 'sodo sans, sans-serif', color: '#475569' },
          },
          labels: {
            formatter: (val: number): string => (val != null && !isNaN(val)) ? val.toLocaleString('de-DE', { maximumFractionDigits: 1 }) : '0',
            style: { fontSize: '11px', fontFamily: 'sodo sans, sans-serif' },
          },
        },
        tooltip: {
          enabled: !forExport,
          theme: 'light',
          y: {
            formatter: (value: number) => (value != null && !isNaN(value)) ? `${value.toLocaleString('de-DE', { maximumFractionDigits: 2 })} tCO₂ acumulado` : '0 tCO₂ acumulado',
          },
        },
        responsive: [
          {
            breakpoint: 768,
            options: {
              chart: { height: 300 },
              xaxis: {
                tickAmount: 5,
                labels: { rotate: -45, rotateAlways: true, style: { fontSize: '10px' } },
              },
              yaxis: {
                title: { text: 't CO₂ acum.', style: { fontSize: '10px' } },
                labels: { style: { fontSize: '10px' } },
              },
            },
          },
        ],
      };
    } else if (vista === 'gauge') {
      const totalBaseCO2_20Years = baseCO2 * (this.periodoVeinteanalEmisionesGEIEvitadasOriginal?.length || 1);
      const percent = Math.min(100, Math.round((totalCO2Acumulado / (totalBaseCO2_20Years || 1)) * 100));

      return {
        series: [percent],
        labels: ['CO₂ Evitado'],
        chart: {
          type: 'radialBar',
          height: forExport ? 260 : 330,
          width: forExport ? 450 : '100%',
          background: forExport ? '#ffffff' : 'transparent',
          offsetY: -10,
          animations: { enabled: !forExport },
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
                color: '#475569',
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
          text: `Tu instalación solar evita el ${percent}% de las emisiones de CO₂ que generaría tu consumo desde la red eléctrica`,
          align: 'center',
          style: {
            fontSize: '12px',
            fontFamily: 'sodo sans, sans-serif',
            color: '#475569',
          },
        },
      };
    }
    return null;
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
    const { cumulativeData } = this.buildCO2Data(
      this.periodoVeinteanalEmisionesGEIEvitadasOriginal,
      anioInicial
    );

    const totalCO2Acumulado = cumulativeData[cumulativeData.length - 1];
    const anos = cumulativeData.length - 1; // 20 años
    const arbolesequivalentes = Math.round(totalCO2Acumulado / (0.02 * anos));

    this.textoArboles = `Equivale a absorber el CO<sub>2</sub> de ≈ <strong>${arbolesequivalentes.toLocaleString('de-DE')}</strong> árboles en ${anos} años`;

    const options = this.getOptionsEmisionesVista(this.vistaCO2, false);
    if (!options) return;

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
