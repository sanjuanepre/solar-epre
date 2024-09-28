import {
  Component,
  Input,
  OnInit,
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
export class GraficosComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input()
  periodoVeinteanalEmisionesGEIEvitadasOriginal!: EmisionesGeiEvitadasFront[];
  periodoVeinteanalEmisionesGEIEvitadasCopia: EmisionesGeiEvitadasFront[] = [];
  @Input() periodoVeinteanalFlujoEnergia!: FlujoEnergiaFront[];
  @Input()
  periodoVeinteanalFlujoIngresosMonetarios!: FlujoIngresosMonetariosFront[];
  periodoVeinteanalFlujoIngresosMonetariosCopia: FlujoIngresosMonetariosFront[] =
    [];
  @Input()
  periodoVeinteanalGeneracionFotovoltaica!: GeneracionFotovoltaicaFront[];
  @Input() consumoTotalAnual!: number;

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
  @Input() yearlyEnergyInitial!: number;
  porcentajeCubierto: number = 0;
  chartEmisiones!: ApexCharts;
  chartAhorroRecupero!: ApexCharts;
  private destroy$ = new Subject<void>(); // Subject para manejar desuscripciones
  ahorrosAnualesIniciales!: number;
  chartEnergiaConsumo!: ApexCharts;

  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) { }

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
    // Verificamos si periodoVeinteanalFlujoIngresosMonetarios existe antes de asignar
    if (this.periodoVeinteanalFlujoIngresosMonetarios.length === 0) {
      const resultadosFront = this.sharedService.getResultadosFront();

      if (resultadosFront.periodoVeinteanalFlujoIngresosMonetarios) {
        this.periodoVeinteanalFlujoIngresosMonetarios =
          resultadosFront.periodoVeinteanalFlujoIngresosMonetarios;
      } else {
        console.warn('No se encontraron datos de FlujoIngresosMonetarios.');
      }
    }
    if (!this.carbonOffSetInicialTon) {
      this.carbonOffSetInicialTon = this.sharedService.getCarbonOffSetTnAnual();
    }

    this.sharedService.yearlyEnergyAckWh$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe({
        next: (yearlyEnergy) => {
          this.yearlyEnergy = yearlyEnergy;
          if (this.chartEnergiaConsumo) this.updateChartEnergiaConsumo();
          if (this.chartAhorroRecupero) this.updateChartAhorroRecupero();
          if (this.chartEmisiones)
            this.updateChartEmisionesEvitadasAcumuladas();
        },
      });

    this.sharedService.plazoInversion$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe({
        next: (newPlazoRecupero) => {
          if (this.recuperoInversionMeses === 0) {
            this.recuperoInversionMeses = newPlazoRecupero;
          }
          this.recuperoInversionMeses = newPlazoRecupero;
          if (this.chartAhorroRecupero) this.updateChartAhorroRecupero();
        },
      });

    this.sharedService.carbonOffSetTnAnual$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe({
        next: (newEmisionesGeiEvitadas) => {
          this.carbonOffSet = newEmisionesGeiEvitadas;
          if (this.chartEmisiones)
            this.updateChartEmisionesEvitadasAcumuladas();
        },
      });
  }

  ngAfterViewInit(): void {
    this.carbonOffSetInicialTon = this.sharedService.getCarbonOffSetTnAnual();

    this.initializeChartEnergiaConsumo();
    this.initializeChartAhorroRecupero();
    this.initializeChartEmisionesEvitadasAcumuladas();
  }

  ngOnDestroy(): void {
    // Emitir un valor para cerrar las suscripciones
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeChartAhorroRecupero() {
    this.periodoVeinteanalFlujoIngresosMonetariosCopia = JSON.parse(
      JSON.stringify(this.periodoVeinteanalFlujoIngresosMonetarios)
    );

    const recuperoInversionAnios = Math.round(this.recuperoInversionMeses / 12);
    const primerAno =
      this.periodoVeinteanalFlujoIngresosMonetariosCopia[0].year;
    const anoRecuperoInversion = primerAno + recuperoInversionAnios;

    // Tomamos el primer valor de ahorro e ingreso
    const primerAhorro =
      this.periodoVeinteanalFlujoIngresosMonetariosCopia[0]
        .ahorroEnElectricidadTotalUsd;
    const primerIngreso =
      this.periodoVeinteanalFlujoIngresosMonetariosCopia[0]
        .ingresoPorInyeccionElectricaUsd;

    // Crear arrays con el valor constante del primer año para todo el periodo
    const ahorroData = this.periodoVeinteanalFlujoIngresosMonetariosCopia.map(
      (item, index, array) => {
        if (index === 0) {
          item.ahorroEnElectricidadTotalUsd = primerAhorro
          return item.ahorroEnElectricidadTotalUsd
        }
        const prevItem = array[index - 1].ahorroEnElectricidadTotalUsd
        array[index].ahorroEnElectricidadTotalUsd = prevItem * (1 - this.sharedService.getDegradacionPanel());
        return array[index].ahorroEnElectricidadTotalUsd
      }
    );
    const ingresoData = this.periodoVeinteanalFlujoIngresosMonetariosCopia.map(
      (item, index, array) => {
        if (index === 0) {
          item.ingresoPorInyeccionElectricaUsd = primerIngreso
          return item.ingresoPorInyeccionElectricaUsd
        }
        const prevItem = array[index - 1].ingresoPorInyeccionElectricaUsd
        array[index].ingresoPorInyeccionElectricaUsd = prevItem * (1 - this.sharedService.getDegradacionPanel());
        return array[index].ingresoPorInyeccionElectricaUsd
      }
    );

    // Extraer los años para la gráfica
    const categories = this.periodoVeinteanalFlujoIngresosMonetariosCopia.map(
      (item) => item.year.toString()
    );

    const options = {
      series: [
        {
          name: 'Ahorro por autoconsumo de energía',
          data: ahorroData,
          color: '#96c0b2',
        },
        {
          name: 'Ingreso por excedente de energía',
          data: ingresoData,
          color: '#e4c58d',
        },
        {
          name: 'Punto de recupero',
          data: [''],
          color: '#008ae3',
        },
      ],
      chart: {
        height: 350,
        width: 470,
        type: 'line',
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
      },
      stroke: {
        curve: 'smooth',
        colors: ['#96c0b2', '#e4c58d', '#008ae3'],
        width: 3,
      },
      xaxis: {
        categories: categories,
        title: {
          text: 'Año',
          style: {
            fontSize: '12px',
            fontFamily: 'sodo sans, sans-serif',
          },
          offsetY: -25,
        },
      },
      yaxis: {
        min: 0,
        labels: {
          formatter: (val: number): string => {
            return val.toLocaleString('de-DE');
          },
        },
        title: {
          text: 'USD',
          style: {
            fontSize: '12px',
            fontFamily: 'sodo sans, sans-serif',
          },
        },
      },
      tooltip: {
        enabled: true,
        theme: 'light',
        y: {
          formatter: (val: number) => {
            const valorTruncado = Math.round(val);
            return `${valorTruncado.toLocaleString('de-DE')} USD/año`;
          },
        },
      },
      annotations: {
        xaxis: [
          {
            x: anoRecuperoInversion.toString(),
            strokeDashArray: 5,
            borderColor: '#008ae3',
            borderWidth: 2,
            showInLegend: true,
          },
        ],
      },
      legend: {
        markers: {
          width: 30,
          height: 3,
          strokeWidth: 3,
          shape: 'line',
          radius: 0,
        },
        position: 'bottom',
        formatter: (seriesName: string, opts: any) => {
          // Personaliza la leyenda con margen de 4px entre la línea y el texto
          if (seriesName === 'Punto de recupero') {
            return `<span style="display: inline-block; width: 30px; height: 3px; border-top: 2px dashed #008ae3; margin-right: 4px;"></span>${seriesName}`;
          }
          return `<span style="display: inline-block; width: 30px; height: 3px; background-color: ${opts.w.globals.colors[opts.seriesIndex]
            }; margin-right: 4px;"></span>${seriesName}`;
        },
      },
    };

    // Renderiza el gráfico
    this.chartAhorroRecupero = new ApexCharts(
      document.querySelector('#chartAhorroRecuperoRef') as HTMLElement,
      options
    );
    this.chartAhorroRecupero.render();
    this.cdr.detectChanges();
  }

  private updateChartAhorroRecupero() {
    if (!this.chartAhorroRecupero) {
      console.error('El gráfico no está inicializado.');
      return;
    }
    // Obtener el valor actualizado de los meses y calcular el año de recupero
    const recuperoInversionAnios = Math.round(this.recuperoInversionMeses / 12);
    const primerAno =
      this.periodoVeinteanalFlujoIngresosMonetariosCopia[0].year;
    const anoRecuperoInversion = primerAno + recuperoInversionAnios;

    // Actualizar la anotación del año de recupero
    const updatedAnnotations = {
      xaxis: [
        {
          x: anoRecuperoInversion.toString(),
          strokeDashArray: 5, // Estilo de línea de puntos
          borderColor: '#008ae3', // Color celeste oscuro
          borderWidth: 2, // Grosor de la línea
        },
      ],
    };

    // Tomamos el primer valor de ahorro e ingreso
    const primerAhorro =
      this.sharedService.getAhorroAnualUsd() * 0.80;
    const primerIngreso =
      this.sharedService.getAhorroAnualUsd() * 0.20;

    // Crear arrays con el valor constante del primer año para todo el periodo
    const ahorroData = this.periodoVeinteanalFlujoIngresosMonetariosCopia.map(
      (item, index, array) => {
        if (index === 0) {
          item.ahorroEnElectricidadTotalUsd = primerAhorro
          return item.ahorroEnElectricidadTotalUsd
        }
        const prevItem = array[index - 1].ahorroEnElectricidadTotalUsd
        array[index].ahorroEnElectricidadTotalUsd = prevItem * (1 - this.sharedService.getDegradacionPanel());
        return array[index].ahorroEnElectricidadTotalUsd
      }
    );
    const ingresoData = this.periodoVeinteanalFlujoIngresosMonetariosCopia.map(
      (item, index, array) => {
        if (index === 0) {
          item.ingresoPorInyeccionElectricaUsd = primerIngreso
          return item.ingresoPorInyeccionElectricaUsd
        }
        const prevItem = array[index - 1].ingresoPorInyeccionElectricaUsd
        array[index].ingresoPorInyeccionElectricaUsd = prevItem * (1 - this.sharedService.getDegradacionPanel());
        return array[index].ingresoPorInyeccionElectricaUsd
      }
    );
    // Actualizar los datos y las anotaciones en el gráfico
    this.chartAhorroRecupero.updateOptions({
      series: [
        {
          name: 'Ahorro por autoconsumo de energía',
          data: ahorroData,
          color: '#96c0b2',
        },
        {
          name: 'Ingreso por excedente de energía',
          data: ingresoData,
          color: '#e4c58d',
        },
        {
          name: 'Punto de recupero',
          data: [''],
          color: '#008ae3',
        },
      ],
      chart: {
        height: 350,
        width: 470,
        type: 'line', // Tipo de gráfico general
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
      },
      stroke: {
        curve: 'smooth',
        colors: ['#96c0b2', '#e4c58d'], // Colores de las líneas reales
        width: 3, // Grosor de las líneas
      },
      yaxis: {
        min: 0, // Asegura que el eje Y comience desde 0
        labels: {
          formatter: (val: number): string => {
            return val.toLocaleString('de-DE');
          },
        },
        title: {
          text: 'USD',
          style: {
            fontSize: '12px',
            fontFamily: 'sodo sans, sans-serif',
          },
        },
      },
      grid: {
        borderColor: '#f1f1f1',
      },
      tooltip: {
        enabled: true,
        theme: 'light',
        y: {
          formatter: (val: number) => {
            const valorTruncado = Math.round(val); // Redondear hacia abajo para quitar los decimales
            return `${valorTruncado.toLocaleString('de-DE')} USD/año`; // Formatear con puntos de miles y agregar el texto
          },
        },
      },
      annotations: updatedAnnotations,
    });

    // Forzar la detección de cambios si es necesario
    this.cdr.detectChanges();
  }

  private initializeChartEnergiaConsumo() {
    const options = {
      chart: {
        type: 'bar',
        height: 350,
        width: 470,
        endingShape: 'rounded',
        background: 'transparent',
        toolbar: {
          show: false, // Eliminar el menú del gráfico
        },
      },
      series: [
        {
          data: [this.consumoTotalAnual, this.yearlyEnergy],
          name: 'Valores',
        },
      ],
      colors: ['#96c0b2', '#e4c58d'], // Colores para las barras
      plotOptions: {
        bar: {
          columnWidth: '50%',
          distributed: true, // Diferenciar colores entre las barras
        },
      },
      xaxis: {
        categories: ['Consumo total anual', 'Generación Anual'], // Etiquetas en el eje X
        labels: {
          show: false, // Ocultar las etiquetas del eje X
        },
      },
      yaxis: {
        min: 0, // Asegura que el eje Y comience desde 0
        title: {
          text: 'kWh', // Mostrar "kWh" como título del eje Y
          style: {
            fontSize: '12px',
            fontFamily: 'sodo sans, sans-serif',
          },
        },
        labels: {
          formatter: (val: number): string => {
            return val.toLocaleString('de-DE'); // Formato para valores en el eje Y
          },
        },
      },
      dataLabels: {
        enabled: true, // Habilitar los datos dentro de las columnas
        style: {
          colors: ['#6d6b6b'], // Cambiar el color del texto a gris
          fontSize: '10px', // Tamaño de letra más pequeño que el predeterminado
          fontFamily: 'inherit', // Mantener la fuente predeterminada
        },
        formatter: (val: number): string => {
          // Formatear el valor para mostrar con puntos de miles y sin decimales
          return val.toLocaleString('de-DE', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          });
        },
      },
      tooltip: {
        enabled: true,
        theme: 'light',
        y: {
          formatter: (val: number) => {
            // Formatear el valor para mostrar con puntos de miles y sin decimales
            return val.toLocaleString('de-DE', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            });
          },
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          gradientToColors: ['#96c0b2', '#e4c58d'], // Colores de gradiente para cada columna
          shadeIntensity: 1,
          type: 'vertical', // Orientación vertical del gradiente
          opacityFrom: 1, // Opacidad completa en la parte superior
          opacityTo: 0.5, // Opacidad parcial (transparente) en la parte inferior
          stops: [0, 100], // Inicio y fin del gradiente
        },
      },
    };

    // Renderizar el gráfico Sol-Luna
    this.chartEnergiaConsumo = new ApexCharts(
      document.querySelector('#chartSolLunaRef') as HTMLElement,
      options
    );
    this.chartEnergiaConsumo.render();
    this.cdr.detectChanges(); // Forzar detección de cambios en Angular
  }

  private updateChartEnergiaConsumo() {
    if (this.chartEnergiaConsumo) {
      this.chartEnergiaConsumo.updateOptions(
        {
          series: [
            {
              data: [this.consumoTotalAnual, this.yearlyEnergy],
              name: [' valor'],
            },
          ],
        },
        false,
        false
      ); // Los dos últimos parámetros indican que no se debe sobrescribir toda la configuración ni redibujar el gráfico completo
      this.cdr.detectChanges();
    }
  }

  private initializeChartEmisionesEvitadasAcumuladas() {
    if (
      !this.periodoVeinteanalEmisionesGEIEvitadasOriginal ||
      this.periodoVeinteanalEmisionesGEIEvitadasOriginal.length === 0
    ) {
      console.error(
        'periodoVeinteanalEmisionesGEIEvitadasOriginal no está definido o está vacío'
      );
      return;
    }

    // Añadir el punto inicial en 0 para el primer año
    const modifiedData = [
      { year: 2024, emisionesTonCO2: 0 },
      ...this.periodoVeinteanalEmisionesGEIEvitadasOriginal,
    ];

    // Calcula las diferencias y simula la degradación
    const seriesData = modifiedData.map((item, index, array) => {
      if (index === 0) {
        return {
          year: item.year,
          diferencia: 0, // Sin degradación en el primer año
        };
      }
      if (index === 1) {
        return {
          year: item.year,
          diferencia: this.sharedService.getCarbonOffSetTnAnual(),
        };
      }
      const prevItem = array[index - 1];
      const degradacion = this.sharedService.getDegradacionPanel();
      const emisionesReducidas = Math.abs(
        prevItem.emisionesTonCO2 - item.emisionesTonCO2 * degradacion
      );
      return {
        year: item.year,
        diferencia: emisionesReducidas,
      };
    });

    // Extrae los años y el acumulado para el gráfico
    const categories = seriesData.map((d) => d.year.toString());

    const data = seriesData.map((d) => d.diferencia);
    // Configura el gráfico
    const options = {
      series: [
        {
          name: 'Emisiones CO₂ Acumuladas',
          data: data,
          color: '#96c0b2',
        },
      ],
      chart: {
        height: 350,
        width: 470,
        type: 'area',
        className: 'chart-specific-1',
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        colors: ['#96c0b2'],
        width: 3,
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          gradientToColors: ['#e4c58d'],
          shadeIntensity: 0.8,
          type: 'vertical',
          opacityFrom: 0.8,
          opacityTo: 0.3,
          stops: [0, 100, 100, 100],
        },
      },
      markers: {
        size: 0,
        colors: ['#96c0b2'],
        strokeColors: '#fff',
        strokeWidth: 2,
        hover: {
          size: 7,
        },
      },
      xaxis: {
        categories: categories,
        title: {
          text: 'Año',
          style: {
            fontSize: '12px',
            fontFamily: 'sodo sans, sans-serif',
          },
          offsetY: -25, // Ajusta la distancia entre el texto "Año" y el gráfico
        },
      },
      yaxis: {
        min: 0,
        labels: {
          formatter: (val: number): string => {
            return val.toLocaleString('de-DE');
          },
        },
        title: {
          text: 'Ton CO₂',
          style: {
            fontSize: '12px',
            fontFamily: 'sodo sans, sans-serif',
          },
        },
      },

      tooltip: {
        enabled: true,
        theme: 'light',
        x: {
          format: 'yyyy',
        },
        y: {
          formatter: (value: number) => {
            return `${value.toLocaleString('de-DE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} tCO₂/año`;
          },
        },
        marker: {
          show: false,
        },
        style: {
          fontSize: '12px',
          fontFamily: 'sodo sans, sans-serif',
        },
      },
    };

    // Inicializa y renderiza el gráfico
    this.chartEmisiones = new ApexCharts(
      document.querySelector('#emisionesChartRef') as HTMLElement,
      options
    );

    this.chartEmisiones.render();
  }

  private updateChartEmisionesEvitadasAcumuladas(): void {
    // Copiar los datos originales para trabajar con ellos sin mutar el original
    this.periodoVeinteanalEmisionesGEIEvitadasCopia = JSON.parse(
      JSON.stringify(this.periodoVeinteanalEmisionesGEIEvitadasOriginal)
    );

    // Calcular el factor de proporcionalidad basado en el nuevo valor de carbon offset
    const factor =
      this.sharedService.getCarbonOffSetTnAnual() / this.carbonOffSetInicialTon;

    // Aplicar el factor a las emisiones para recalcularlas proporcionalmente
    const seriesData = this.periodoVeinteanalEmisionesGEIEvitadasCopia.map(
      (item, index) => {
        if (index === 0) {
          return {
            year: item.year,
            emisionesTonCO2: 0,
          };
        }
        if (index === 1) {
          return {
            year: item.year,
            emisionesTonCO2: this.sharedService.getCarbonOffSetTnAnual(),
          };
        }
        return {
          year: item.year,
          emisionesTonCO2: item.emisionesTonCO2 * factor, 
        };
      }
    );

    // Extraer los años y los valores recalculados para el gráfico
    const categories = seriesData.map((d) => d.year.toString());
    const data = seriesData.map((d) => d.emisionesTonCO2);
    // Actualiza el gráfico con los nuevos datos
    this.chartEmisiones.updateOptions({
      series: [
        {
          name: 'Emisiones CO₂ Acumuladas',
          data: data,
          color: '#96c0b2',
        },
      ],
      xaxis: {
        categories: categories,
      },
    });
    this.cdr.detectChanges();
  }
}
