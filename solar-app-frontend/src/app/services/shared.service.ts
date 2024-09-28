import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ResultadosFrontDTO } from '../interfaces/resultados-front-dto';
import { DimensionPanel } from '../interfaces/dimension-panel';
import { YearlysAnualConfigurationFront } from '../interfaces/yearlys-anual-configuration-front';
import { ParametrosFront } from '../interfaces/parametros-front';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
 
  private updateSubject = new BehaviorSubject<boolean>(false);
  update$ = this.updateSubject.asObservable();

  private eficienciaInstalacionSubject = new BehaviorSubject<number>(0);
  eficienciaInstalacion$ = this.eficienciaInstalacionSubject.asObservable();

  private inversionUsdSubject = new BehaviorSubject<number>(0);
  inversionUsd$ = this.inversionUsdSubject.asObservable();

  private dimensionPanel!: { height: number; width: number };
  private areaPanelsSelectedSubject = new BehaviorSubject<number>(0);
  areaPanelsSelected$ = this.areaPanelsSelectedSubject.asObservable();

  private costoInstalacionSubject = new BehaviorSubject<number>(0);
  costoInstalacion$ = this.costoInstalacionSubject.asObservable();

  private tarifaContratadaSubject = new BehaviorSubject<string>('');
  tarifaContratada$ = this.tarifaContratadaSubject.asObservable();

  private yearlysAnualConfigurationSubject: any = new BehaviorSubject<any>([]);
  YearlyAnualConfigurations$ =
    this.yearlysAnualConfigurationSubject.asObservable();

  private tutorialShownSubject = new BehaviorSubject<boolean>(false);
  tutorialShown$ = this.tutorialShownSubject.asObservable();
  private predefinedCoordinatesSubject = new BehaviorSubject<boolean>(false);
  predefinedCoordinates$ = this.predefinedCoordinatesSubject.asObservable();
  nearbyLocation: any;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  private panelsCountSelectedSubject = new BehaviorSubject<number>(0);
  panelsCountSelected$ = this.panelsCountSelectedSubject.asObservable();
  private plazoInversionSubject = new BehaviorSubject<number>(0);
  plazoInversion$ = this.plazoInversionSubject.asObservable();
  private isUpdating = false;
  private expandStep3Subject = new BehaviorSubject<boolean>(false);
  expandStep3$ = this.expandStep3Subject.asObservable();
  private panelCapacityWSubject = new BehaviorSubject<number>(400);
  panelCapacityW$ = this.panelCapacityWSubject.asObservable();
  private yearlyEnergyAckWhSubject = new BehaviorSubject<number>(0);
  yearlyEnergyAckWh$ = this.yearlyEnergyAckWhSubject.asObservable();

  private ahorroAnualUsdSubject = new BehaviorSubject<number>(0);
  ahorroAnualUsd$ = this.ahorroAnualUsdSubject.asObservable();

  private potenciaMaxAsignadaSubject = new BehaviorSubject<number>(0);
  potenciaMaxAsignadaW$ = this.potenciaMaxAsignadaSubject.asObservable();

  private potenciaInstalacionWSubject = new BehaviorSubject<number>(0);
  potenciaInstalacionW$ = this.potenciaInstalacionWSubject.asObservable();

  private resultadosFrontSubject = new BehaviorSubject<
    Partial<ResultadosFrontDTO>
  >({});
  resultadosFront$ = this.resultadosFrontSubject.asObservable();

  private factorPotenciaSubject = new BehaviorSubject<number>(1);
  factorPotencia$= this.factorPotenciaSubject.asObservable();

  private maxPanelsPerSuperfaceSubject = new BehaviorSubject<number>(0);
  maxPanelsPerSuperface$ = this.maxPanelsPerSuperfaceSubject.asObservable();
  private carbonOffSetTnAnualSubject = new BehaviorSubject<number>(0);
  carbonOffSetTnAnual$ = this.carbonOffSetTnAnualSubject.asObservable();
  private isStopCalculateSubject = new BehaviorSubject<boolean>(false);
  isStopCalculate$ = this.isStopCalculateSubject.asObservable();
  private consumosMensualesSubject = new BehaviorSubject<number[]>([]);
  consumosMensuales$ = this.consumosMensualesSubject.asObservable();
  private tarifaIntercambioUsdkWhSubject = new BehaviorSubject<number>(0);
  tarifaIntercambioUsdkWh$ = this.tarifaIntercambioUsdkWhSubject.asObservable();

  private initialState = {
    tarifaContratada: '',
    yearlysAnualConfigurations: [],
    yearlyEnergyAckWh: 0,
    panelsCountSelected: 4,
    dimensionPanels: { height: 0, width: 0 },
    panelCapacityW: 400,
    eficienciaInstalacion: 0,
    costoInstalacion: 0,
    plazoInversion: 0,
    tarifaIntercambioUsdkWh: 0,
    potenciaMaxAsignadaW: 0
  };
  

  constructor(private router: Router,) {
    console.log("Se instancia el shared service...");
    
  }


  setTarifaContratada(tarifaContratada: string) {
    console.log('Seteando tarifa contratada: ', tarifaContratada);
    this.tarifaContratadaSubject.next(tarifaContratada);
  }

  getTarifaContratada(): string {
    const tarifa = this.tarifaContratadaSubject.getValue();
    console.log('Obteniendo tarifa contratada: ', tarifa);
    return tarifa;
  }

  setTutorialShown(value: boolean): void {
    console.log('Mostrando tutorial: ', value);
    this.tutorialShownSubject.next(value);
  }

  setPredefinedCoordinates(value: boolean): void {
    console.log('Seteando coordenadas predefinidas: ', value);
    this.predefinedCoordinatesSubject.next(value);
  }

  setNearbyLocation(location: any) {
    console.log('Seteando ubicación cercana: ', location);
    this.nearbyLocation = location;
  }

  getNearbyLocation() {
    console.log('Obteniendo ubicación cercana: ', this.nearbyLocation);
    return this.nearbyLocation;
  }

  setIsLoading(value: boolean): void {
    console.log('Seteando estado de carga: ', value);
    this.isLoadingSubject.next(value);
  }

  getIsLoading() {
    return this.isLoadingSubject.getValue();
  }


  setPanelsCountSelected(value: number): void {
    console.log('Cantidad de paneles seleccionados: ', value);
    if (value < 4) {
      console.log('Valor menor que 4, se ajusta a 4');
      this.panelsCountSelectedSubject.next(4);
      return;
    }
    this.panelsCountSelectedSubject.next(value);
  }

  getPanelsSelected() {
    const count = this.panelsCountSelectedSubject.getValue();
    console.log('Obteniendo cantidad de paneles seleccionados: ', count);
    return count;
  }

  setPlazoInversion(plazo: number): void {
    console.log('Seteando plazo de inversión: ', plazo);
    this.plazoInversionSubject.next(plazo);
  }

  getPlazoInversionValue(): number {
    const plazo = Math.abs(this.plazoInversionSubject.getValue());
    console.log('Obteniendo plazo de inversión: ', plazo);
    return plazo;
  }

  expandStep3(): void {
    console.log('Expandiendo el paso 3');
    this.expandStep3Subject.next(false);
  }

  setPanelCapacityW(value: number) {
    console.log('Seteando capacidad de panel en W: ', value);
    this.panelCapacityWSubject.next(value);
  }

  getPanelCapacityW(): number {
    const capacity = this.panelCapacityWSubject.getValue();
    console.log('Obteniendo capacidad de panel en W: ', capacity);
    return capacity;
  }

  setYearlyEnergyAckWh(value: number): void {
    console.log('Estableciendo energía anual en kWh:', value);
    this.yearlyEnergyAckWhSubject.next(value);
  }

  getYearlyEnergyAckWh(): number {
    const value = this.yearlyEnergyAckWhSubject.getValue();
    console.log('Obteniendo energía anual en kWh:', value);
    return value;
  }

  setAhorroAnualUsd(ahorroElectricidadInyeccion: number) {
    console.log('Estableciendo ahorro anual en USD:', ahorroElectricidadInyeccion);
    this.ahorroAnualUsdSubject.next(ahorroElectricidadInyeccion);
  }

  getAhorroAnualUsd() {
    const value = this.ahorroAnualUsdSubject.getValue();
    console.log('Obteniendo ahorro anual en USD:', value);
    return value;
  }

  setPotenciaMaxAsignadaW(potenciaMaxAsignada: number) {
    console.log('Estableciendo potencia máxima asignada en W:', potenciaMaxAsignada);
    this.potenciaMaxAsignadaSubject.next(potenciaMaxAsignada);
  }

  getPotenciaMaxAsignadaValue(): number {
    const value = this.potenciaMaxAsignadaSubject.getValue();
    console.log('Obteniendo potencia máxima asignada en W:', value);
    return value;
  }

  setPotenciaInstalacionW(instalacionPotencia: number) {
    console.log('Actualizando potencia instalada en W:', instalacionPotencia);
    this.potenciaInstalacionWSubject.next(instalacionPotencia);
  }

  getPotenciaInstalacionW() {
    const value = this.potenciaInstalacionWSubject.getValue();
    console.log('Obteniendo potencia instalada en W:', value);
    return value;
  }

  setResultadosFrontNearby(resultadosFrontNearby: ResultadosFrontDTO) {
    console.log('Estableciendo resultados front nearby:', resultadosFrontNearby);
    this.resultadosFrontSubject.next(resultadosFrontNearby);
  }

  getResultadosFrontNearby(): Partial<ResultadosFrontDTO> {
    const value = this.resultadosFrontSubject.getValue();
    console.log('Obteniendo resultados front nearby:', value);
    return value;
  }

  setResultadosFront(resultadosFront: ResultadosFrontDTO) {
    console.log('Estableciendo resultados front:', resultadosFront);
    this.resultadosFrontSubject.next(resultadosFront);
  }

  getResultadosFront(): Partial<ResultadosFrontDTO> {
    const value = this.resultadosFrontSubject.getValue();
    console.log('Obteniendo resultados front:', value);
    return value;
  }

  setMaxPanelsPerSuperface(maxPanels: number) {
    console.log('Estableciendo máximo de paneles por superficie:', maxPanels);
    this.maxPanelsPerSuperfaceSubject.next(maxPanels);
  }

  getMaxPanelsPerSuperface() {
    const value = this.maxPanelsPerSuperfaceSubject.getValue();
    console.log('Obteniendo máximo de paneles por superficie:', value);
    return value;
  }

  setCarbonOffSetTnAnual(carbonOffSet: number) {
    console.log('Estableciendo compensación de carbono anual en toneladas:', carbonOffSet);
    this.carbonOffSetTnAnualSubject.next(carbonOffSet);
  }

  getCarbonOffSetTnAnual() {
    const value = this.carbonOffSetTnAnualSubject.getValue();
    console.log('Obteniendo compensación de carbono anual en toneladas:', value);
    return value;
  }

  setIsStopCalculate(isStop: boolean) {
    console.log('Estableciendo estado de detención de cálculo:', isStop);
    this.isStopCalculateSubject.next(isStop);
  }

  getIsStopCalculate() {
    const value = this.isStopCalculateSubject.getValue();
    console.log('Obteniendo estado de detención de cálculo:', value);
    return value;
  }

  setConsumosMensuales(consumos: any) {
    console.log('Estableciendo consumos mensuales:', consumos);
    this.consumosMensualesSubject.next(consumos);
  }

  getConsumosMensuales() {
    const value = this.consumosMensualesSubject.getValue();
    console.log('Obteniendo consumos mensuales:', value);
    return value;
  }

  getTarifaIntercambioUsdkWh() {
    const value = this.tarifaIntercambioUsdkWhSubject.getValue();
    console.log('Obteniendo tarifa de intercambio en USD/kWh:', value);
    return value;
  }

  setTarifaIntercambioUsdkWh(tarifaIntercambio: number) {
    console.log('Estableciendo tarifa de intercambio en USD/kWh:', tarifaIntercambio);
    this.tarifaIntercambioUsdkWhSubject.next(tarifaIntercambio);
  }

  getCostoInstalacion() {
    const value = this.costoInstalacionSubject.getValue();
    console.log('Obteniendo costo de instalación:', value);
    return value;
  }
  setCostoInstalacion(costoInstalacion: number) {
    const roundedCosto = Math.round(costoInstalacion);
    console.log('Estableciendo costo de instalación:', roundedCosto);
    this.costoInstalacionSubject.next(roundedCosto);
  }

  calculateAreaPanelsSelected(totalPanels: number): number {
    console.log('Calculando área de paneles seleccionados para', totalPanels, 'paneles');
    if (totalPanels >= 4) {
      const areaPanelsSelected = this.calculateAreaPanels(totalPanels);
      this.setAreaPanelsSelected(areaPanelsSelected);
      console.log('Área calculada:', areaPanelsSelected);
      return areaPanelsSelected;
    }
    console.log('No se calculó el área, menos de 4 paneles');
    return 0;
  }
  calculateAreaPanels(panelsCount: number): number {
    console.log('Calculando área para', panelsCount, 'paneles');
    const dimensionPanel: DimensionPanel = this.getDimensionPanel();
    const areaPanel = dimensionPanel.height * dimensionPanel.width;
    const areaPanels = areaPanel * panelsCount;
    console.log('Área calculada:', areaPanels);
    return areaPanels;
  }
  setAreaPanelsSelected(areaPanelsSelected: number) {
    console.log('Estableciendo área de paneles seleccionados:', areaPanelsSelected);
    this.areaPanelsSelectedSubject.next(areaPanelsSelected);
  }
  getAreaPanelsSelected() {
    const value = this.areaPanelsSelectedSubject.getValue();
    console.log('Obteniendo área de paneles seleccionados:', value);
    return value;
  }
  getDimensionPanel(): DimensionPanel {
    const dimension = this.dimensionPanel || {
      height: 1.879,
      width: 1.045,
    };
    console.log('Obteniendo dimensiones del panel:', dimension);
    return dimension;
  }
  setDimensionPanels(dimensionPanel: DimensionPanel) {
    console.log('Estableciendo dimensiones del panel:', dimensionPanel);
    this.dimensionPanel = dimensionPanel;
  }

  setYearlysAnualConfigurations(
    yearlyAnualConfigurations: YearlysAnualConfigurationFront | never[]
  ) {
    console.log('Estableciendo configuraciones anuales:', yearlyAnualConfigurations);
    this.yearlysAnualConfigurationSubject.next(yearlyAnualConfigurations);
  }

  getYearlysAnualConfigurations(): YearlysAnualConfigurationFront[] {
    const value = this.yearlysAnualConfigurationSubject.getValue();
    console.log('Obteniendo configuraciones anuales:', value);
    return value;
  }

  getInversionUsd(): number {
    const value = this.inversionUsdSubject.getValue();
    console.log('Obteniendo inversión en USD:', value);
    return value;
  }

  setInversionUsd(inversion: number) {
    console.log('Estableciendo inversión en USD:', inversion);
    this.inversionUsdSubject.next(inversion);
  }

  getCostoEquipoDeMedicion() {
    const resultados = this.getResultadosFront();
    let costo: number;
    if(this.getTarifaContratada().includes("T1-R")) {
      costo = 782.30;
    } else {
      costo = 646.53;
    }
    console.log('Obteniendo costo de equipo de medición:', costo);
    return costo;
  }
  getCostoUsdWp() {
    const resultados = this.getResultadosFront();
    let costo: number;
    if(this.getTarifaContratada().includes("T1-R")) {
      costo = 1.5;
    } else {
      costo = 1.24;
    }
    console.log('Obteniendo costo en USD/Wp:', costo);
    return costo;
  }

  getEficienciaInstalacion(): number {
    const value = this.eficienciaInstalacionSubject.getValue();
    console.log('Obteniendo eficiencia de instalación:', value);
    return value;
  }

  setEficienciaInstalacion(value: number) {
    console.log('Estableciendo eficiencia de instalación:', value);
    this.eficienciaInstalacionSubject.next(value);
  }

  update() {
    console.log('Actualizando...');
    this.updateSubject.next(true)
  }

  getDegradacionPanel(): number {
    const resultados = this.getResultadosFront();
    const parametros: ParametrosFront = resultados.parametros!;
    const degradacion = parametros.caracteristicasSistema.degradacionAnualPanel;
    console.log('Obteniendo degradación anual del panel:', degradacion);
    return degradacion;
  }

  resetAll() {
    console.log('Reseteando todos los valores...');
    Object.keys(this.initialState).forEach(key => {
      (this as any)[`set${key.charAt(0).toUpperCase() + key.slice(1)}`](
        this.initialState[key as keyof typeof this.initialState]
      );
    });
    console.log('Valores reseteados:', this.initialState);
    // Redirigir al inicio de la aplicación
     // Recargar la página para asegurar un estado limpio
    // redirigir a pasos/1 y recargar mapa
    this.router.navigate(['/pasos/1'], { replaceUrl: true }).then(() => {
      console.log('Redirigiendo a /pasos/1');
    });
  }

  setFactorPotencia(factorPotencia: number) {
    console.log('Estableciendo factor de potencia:', factorPotencia);
    this.factorPotenciaSubject.next(factorPotencia);
  }

  getFactorPotencia(): number {
    const value = this.factorPotenciaSubject.getValue();
    console.log('Obteniendo factor de potencia:', value);
    return value;
  }
}
