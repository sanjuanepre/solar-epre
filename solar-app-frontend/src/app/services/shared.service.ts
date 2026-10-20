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
  // Catálogo de dimensiones físicas de paneles por potencia (metros)
  private static readonly PANEL_DIMENSIONS: Record<number, DimensionPanel> = {
    400: { height: 1.722, width: 1.134 },
    450: { height: 1.903, width: 1.134 },
    500: { height: 2.094, width: 1.134 },
    550: { height: 2.278, width: 1.134 },
    600: { height: 2.172, width: 1.303 },
    700: { height: 2.384, width: 1.303 },
  };

  private maxPanelsPerMaxPotenciaSubject = new BehaviorSubject<number>(0);
  maxPanelsPerMaxPotencia$ = this.maxPanelsPerMaxPotenciaSubject.asObservable();

  private updateSubject = new BehaviorSubject<boolean>(false);
  update$ = this.updateSubject.asObservable();

  private eficienciaInstalacionSubject = new BehaviorSubject<number>(0);
  eficienciaInstalacion$ = this.eficienciaInstalacionSubject.asObservable();

  private inversionUsdSubject = new BehaviorSubject<number>(0);
  inversionUsd$ = this.inversionUsdSubject.asObservable();

  private dimensionPanelSubject = new BehaviorSubject<DimensionPanel>({ height: 2.172, width: 1.303 });
  dimensionPanel$ = this.dimensionPanelSubject.asObservable();
  private areaPanelsSelectedSubject = new BehaviorSubject<number>(0);
  areaPanelsSelected$ = this.areaPanelsSelectedSubject.asObservable();

  private costoInstalacionSubject = new BehaviorSubject<number>(0);
  costoInstalacion$ = this.costoInstalacionSubject.asObservable();

  private tarifaContratadaSubject = new BehaviorSubject<string>('');
  tarifaContratada$ = this.tarifaContratadaSubject.asObservable();

  private yearlysAnualConfigurationSubject: any = new BehaviorSubject<any>([]);
  YearlyAnualConfigurations$ =
    this.yearlysAnualConfigurationSubject.asObservable();

  private termsAcceptedSubject = new BehaviorSubject<boolean>(
    localStorage.getItem('termsAccepted') === 'true'
  );
  termsAccepted$ = this.termsAcceptedSubject.asObservable();

  private tutorialShownSubject = new BehaviorSubject<boolean>(false);
  tutorialShown$ = this.tutorialShownSubject.asObservable();
  private predefinedCoordinatesSubject = new BehaviorSubject<boolean>(false);
  predefinedCoordinates$ = this.predefinedCoordinatesSubject.asObservable();
  nearbyLocation: any;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();

  private sidebarCollapsedSubject = new BehaviorSubject<boolean>(false);
  sidebarCollapsed$ = this.sidebarCollapsedSubject.asObservable();

  setSidebarCollapsed(collapsed: boolean) {
    this.sidebarCollapsedSubject.next(collapsed);
  }

  getSidebarCollapsed(): boolean {
    return this.sidebarCollapsedSubject.getValue();
  }
  private panelsCountSelectedSubject = new BehaviorSubject<number>(0);
  panelsCountSelected$ = this.panelsCountSelectedSubject.asObservable();
  private plazoInversionSubject = new BehaviorSubject<number>(0);
  plazoInversion$ = this.plazoInversionSubject.asObservable();
  private isUpdating = false;
  private expandStep3Subject = new BehaviorSubject<boolean>(false);
  expandStep3$ = this.expandStep3Subject.asObservable();
  private panelCapacityWSubject = new BehaviorSubject<number>(600);
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

  private factorPotenciaSubject = new BehaviorSubject<number>(1.5);
  factorPotencia$ = this.factorPotenciaSubject.asObservable();

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

  private tipoEstructuraSubject = new BehaviorSubject<'coplanar' | 'optimo'>('coplanar');
  tipoEstructura$ = this.tipoEstructuraSubject.asObservable();

  private initialState = {
    tarifaContratada: '',
    yearlysAnualConfigurations: [],
    yearlyEnergyAckWh: 0,
    panelsCountSelected: 4,
    panelCapacityW: 600,
    eficienciaInstalacion: 0,
    costoInstalacion: 0,
    plazoInversion: 0,
    tarifaIntercambioUsdkWh: 0,
    potenciaMaxAsignadaW: 0,
    tipoEstructura: 'coplanar' as 'coplanar' | 'optimo'
  };


  constructor(private router: Router) {
this.restoreStateFromSession();
  }

  private saveStateToSession(): void {
    try {
      const state = {
        tarifaContratada: this.tarifaContratadaSubject.getValue(),
        yearlyEnergyAckWh: this.yearlyEnergyAckWhSubject.getValue(),
        panelsCountSelected: this.panelsCountSelectedSubject.getValue(),
        panelCapacityW: this.panelCapacityWSubject.getValue(),
        eficienciaInstalacion: this.eficienciaInstalacionSubject.getValue(),
        costoInstalacion: this.costoInstalacionSubject.getValue(),
        plazoInversion: this.plazoInversionSubject.getValue(),
        tarifaIntercambioUsdkWh: this.tarifaIntercambioUsdkWhSubject.getValue(),
        potenciaMaxAsignadaW: this.potenciaMaxAsignadaSubject.getValue(),
        potenciaInstalacionW: this.potenciaInstalacionWSubject.getValue(),
        tipoEstructura: this.tipoEstructuraSubject.getValue(),
        consumosMensuales: this.consumosMensualesSubject.getValue(),
        carbonOffSetTnAnual: this.carbonOffSetTnAnualSubject.getValue(),
        resultadosFront: this.resultadosFrontSubject.getValue(),
        yearlysAnualConfigurations: this.yearlysAnualConfigurationSubject.getValue(),
      };
      sessionStorage.setItem('solar_calc_state', JSON.stringify(state));
    } catch (_) {}
  }

  private restoreStateFromSession(): void {
    try {
      const saved = sessionStorage.getItem('solar_calc_state');
      if (saved) {
        const state = JSON.parse(saved);
        if (state.tarifaContratada) this.tarifaContratadaSubject.next(state.tarifaContratada);
        if (state.yearlyEnergyAckWh) this.yearlyEnergyAckWhSubject.next(state.yearlyEnergyAckWh);
        if (state.panelsCountSelected) this.panelsCountSelectedSubject.next(state.panelsCountSelected);
        if (state.panelCapacityW) this.panelCapacityWSubject.next(state.panelCapacityW);
        if (state.eficienciaInstalacion) this.eficienciaInstalacionSubject.next(state.eficienciaInstalacion);
        if (state.costoInstalacion) this.costoInstalacionSubject.next(state.costoInstalacion);
        if (state.plazoInversion) this.plazoInversionSubject.next(state.plazoInversion);
        if (state.tarifaIntercambioUsdkWh) this.tarifaIntercambioUsdkWhSubject.next(state.tarifaIntercambioUsdkWh);
        if (state.potenciaMaxAsignadaW) this.potenciaMaxAsignadaSubject.next(state.potenciaMaxAsignadaW);
        if (state.potenciaInstalacionW) this.potenciaInstalacionWSubject.next(state.potenciaInstalacionW);
        if (state.tipoEstructura) this.tipoEstructuraSubject.next(state.tipoEstructura);
        if (state.consumosMensuales && Array.isArray(state.consumosMensuales)) this.consumosMensualesSubject.next(state.consumosMensuales);
        if (state.carbonOffSetTnAnual) this.carbonOffSetTnAnualSubject.next(state.carbonOffSetTnAnual);
        if (state.resultadosFront && Object.keys(state.resultadosFront).length > 0) {
          this.resultadosFrontSubject.next(state.resultadosFront);
        }
        if (state.yearlysAnualConfigurations && Array.isArray(state.yearlysAnualConfigurations) && state.yearlysAnualConfigurations.length > 0) {
          this.yearlysAnualConfigurationSubject.next(state.yearlysAnualConfigurations);
        }
      }
    } catch (_) {}
  }

  setTarifaContratada(tarifaContratada: string) {
this.tarifaContratadaSubject.next(tarifaContratada);
    this.saveStateToSession();
  }

  getTarifaContratada(): string {
    const tarifa = this.tarifaContratadaSubject.getValue();
return tarifa;
  }

  setTermsAccepted(value: boolean): void {
    localStorage.setItem('termsAccepted', value ? 'true' : 'false');
    this.termsAcceptedSubject.next(value);
  }

  getTermsAccepted(): boolean {
    return this.termsAcceptedSubject.getValue() || localStorage.getItem('termsAccepted') === 'true';
  }

  setTutorialShown(value: boolean): void {
this.tutorialShownSubject.next(value);
  }

  setPredefinedCoordinates(value: boolean): void {
this.predefinedCoordinatesSubject.next(value);
  }

  setNearbyLocation(location: any) {
this.nearbyLocation = location;
  }

  getNearbyLocation() {
return this.nearbyLocation;
  }

  setIsLoading(value: boolean): void {
this.isLoadingSubject.next(value);
  }

  getIsLoading() {
    return this.isLoadingSubject.getValue();
  }


  setPanelsCountSelected(value: number): void {
if (value < 4) {
this.panelsCountSelectedSubject.next(4);
      return;
    }
    this.panelsCountSelectedSubject.next(value);
  }

  getPanelsSelected() {
    const count = this.panelsCountSelectedSubject.getValue();
return count;
  }

  setPlazoInversion(plazo: number): void {
this.plazoInversionSubject.next(plazo);
  }

  getPlazoInversionValue(): number {
    const plazo = this.plazoInversionSubject.getValue();
return plazo;
  }

  expandStep3(): void {
this.expandStep3Subject.next(false);
  }

  setPanelCapacityW(value: number) {
this.panelCapacityWSubject.next(value);
    // Sincronizar dimensiones del panel con la potencia seleccionada
    const dimension = this.getDimensionByCapacity(value);
    this.setDimensionPanels(dimension);
  }

  getPanelCapacityW(): number {
    const capacity = this.panelCapacityWSubject.getValue();
return capacity;
  }

  getDimensionByCapacity(watts: number): DimensionPanel {
    return SharedService.PANEL_DIMENSIONS[watts] || SharedService.PANEL_DIMENSIONS[400];
  }

  setYearlyEnergyAckWh(value: number): void {
this.yearlyEnergyAckWhSubject.next(value);
  }

  getYearlyEnergyAckWh(): number {
    const value = this.yearlyEnergyAckWhSubject.getValue();
return value;
  }

  setAhorroAnualUsd(ahorroElectricidadInyeccion: number) {
this.ahorroAnualUsdSubject.next(ahorroElectricidadInyeccion);
  }

  getAhorroAnualUsd() {
    const value = this.ahorroAnualUsdSubject.getValue();
return value;
  }

  setPotenciaMaxAsignadaW(potenciaMaxAsignada: number) {
this.potenciaMaxAsignadaSubject.next(potenciaMaxAsignada);
  }

  getPotenciaMaxAsignadaW(): number {
    const value = this.potenciaMaxAsignadaSubject.getValue();
return value;
  }

  setPotenciaInstalacionW(instalacionPotencia: number) {
this.potenciaInstalacionWSubject.next(instalacionPotencia);
  }

  getPotenciaInstalacionW() {
    const value = this.potenciaInstalacionWSubject.getValue();
return value;
  }

  setResultadosFrontNearby(resultadosFrontNearby: ResultadosFrontDTO) {
this.resultadosFrontSubject.next(resultadosFrontNearby);
  }

  getResultadosFrontNearby(): Partial<ResultadosFrontDTO> {
    const value = this.resultadosFrontSubject.getValue();
return value;
  }

  setResultadosFront(resultadosFront: ResultadosFrontDTO) {
this.resultadosFrontSubject.next(resultadosFront);
    this.saveStateToSession();
  }

  getResultadosFront(): Partial<ResultadosFrontDTO> {
    const value = this.resultadosFrontSubject.getValue();
return value;
  }

  setMaxPanelsPerSuperface(maxPanels: number) {
this.maxPanelsPerSuperfaceSubject.next(maxPanels);
  }

  getMaxPanelsPerSuperface() {
    const value = this.maxPanelsPerSuperfaceSubject.getValue();
return value;
  }

  setCarbonOffSetTnAnual(carbonOffSet: number) {
this.carbonOffSetTnAnualSubject.next(carbonOffSet);
  }

  getCarbonOffSetTnAnual() {
    const value = this.carbonOffSetTnAnualSubject.getValue();
return value;
  }

  setIsStopCalculate(isStop: boolean) {
this.isStopCalculateSubject.next(isStop);
  }

  getIsStopCalculate() {
    const value = this.isStopCalculateSubject.getValue();
return value;
  }

  setConsumosMensuales(consumos: any) {
this.consumosMensualesSubject.next(consumos);
    this.saveStateToSession();
  }

  getConsumosMensuales() {
    const value = this.consumosMensualesSubject.getValue();
return value;
  }

  getTarifaIntercambioUsdkWh() {
    const value = this.tarifaIntercambioUsdkWhSubject.getValue();
return value;
  }

  setTarifaIntercambioUsdkWh(tarifaIntercambio: number) {
this.tarifaIntercambioUsdkWhSubject.next(tarifaIntercambio);
  }

  getCostoInstalacion() {
    const value = this.costoInstalacionSubject.getValue();
return value;
  }
  setCostoInstalacion(costoInstalacion: number) {
    const roundedCosto = Math.round(costoInstalacion);
this.costoInstalacionSubject.next(roundedCosto);
  }

  calculateAreaPanelsSelected(totalPanels: number): number {
if (totalPanels >= 4) {
      const areaPanelsSelected = this.calculateAreaPanels(totalPanels);
      this.setAreaPanelsSelected(areaPanelsSelected);
return areaPanelsSelected;
    }
return 0;
  }
  calculateAreaPanels(panelsCount: number): number {
const dimensionPanel: DimensionPanel = this.getDimensionPanel();
    const areaPanel = dimensionPanel.height * dimensionPanel.width;
    const areaPanels = areaPanel * panelsCount;
return areaPanels;
  }
  setAreaPanelsSelected(areaPanelsSelected: number) {
this.areaPanelsSelectedSubject.next(areaPanelsSelected);
  }
  getAreaPanelsSelected() {
    const value = this.areaPanelsSelectedSubject.getValue();
return value;
  }
  getDimensionPanel(): DimensionPanel {
    const dimension = this.dimensionPanelSubject.getValue();
return dimension;
  }
  setDimensionPanels(dimensionPanel: DimensionPanel) {
this.dimensionPanelSubject.next(dimensionPanel);
  }

  setYearlysAnualConfigurations(
    yearlyAnualConfigurations: YearlysAnualConfigurationFront | never[]
  ) {
this.yearlysAnualConfigurationSubject.next(yearlyAnualConfigurations);
  }

  getYearlysAnualConfigurations(): YearlysAnualConfigurationFront[] {
    const value = this.yearlysAnualConfigurationSubject.getValue();
return value;
  }

  getInversionUsd(): number {
    const value = this.inversionUsdSubject.getValue();
return value;
  }

  setInversionUsd(inversion: number) {
this.inversionUsdSubject.next(inversion);
  }

  getCostoEquipoDeMedicion() {
    const resultados = this.getResultadosFront();
    if (resultados?.parametros?.inversionCostos?.equipoDeMedicionUsdAplicado) {
      const costo = resultados.parametros.inversionCostos.equipoDeMedicionUsdAplicado;
return costo;
    }
    let costo: number;
    if (this.getTarifaContratada().includes("T1-R")) {
      costo = 782.30;
    } else {
      costo = 646.53;
    }
return costo;
  }
  getCostoUsdWp() {
    const resultados = this.getResultadosFront();
    if (resultados?.parametros?.inversionCostos?.costoUsdWpAplicado) {
      const costo = resultados.parametros.inversionCostos.costoUsdWpAplicado;
return costo;
    }
    let costo: number;
    if (this.getTarifaContratada().includes("T1-R")) {
      costo = 1.5;
    } else {
      costo = 1.24;
    }
return costo;
  }

  getEficienciaInstalacion(): number {
    const value = this.eficienciaInstalacionSubject.getValue();
return value;
  }

  setEficienciaInstalacion(value: number) {
this.eficienciaInstalacionSubject.next(value);
  }

  update() {
this.updateSubject.next(true)
  }

  getDegradacionPanel(): number {
    const resultados = this.getResultadosFront();
    if (resultados?.parametros?.caracteristicasSistema?.degradacionAnualPanel !== undefined) {
      const degradacion = resultados.parametros.caracteristicasSistema.degradacionAnualPanel;
return degradacion;
    }
return 0.004;
  }

  resetAll() {
try {
      sessionStorage.removeItem('solar_calc_state');
      sessionStorage.removeItem('solar_map_feature');
    } catch (_) {}
    Object.keys(this.initialState).forEach(key => {
      (this as any)[`set${key.charAt(0).toUpperCase() + key.slice(1)}`](
        this.initialState[key as keyof typeof this.initialState]
      );
    });
// Redirigir al inicio de la aplicación
    // Recargar la página para asegurar un estado limpio
    // redirigir a pasos/1 y recargar mapa
    this.router.navigate(['/pasos/1'], { replaceUrl: true }).then(() => {
});
  }

  setFactorPotencia(factorPotencia: number) {
this.factorPotenciaSubject.next(factorPotencia);
  }

  getFactorPotencia(): number {
    const value = this.factorPotenciaSubject.getValue();
return value;
  }
  
  setMaxPanelsPerMaxPotencia(maxPanels: number) {
    this.maxPanelsPerMaxPotenciaSubject.next(maxPanels);
  }
  
  getMaxPanelsPerMaxPotencia() {
    return this.maxPanelsPerMaxPotenciaSubject.getValue();
  }

  setTipoEstructura(value: 'coplanar' | 'optimo') {
this.tipoEstructuraSubject.next(value);
  }

  getTipoEstructura(): 'coplanar' | 'optimo' {
    const value = this.tipoEstructuraSubject.getValue();
return value;
  }

  getMaxPanelsByTariff(watts?: number): number {
    const panelWatts = watts || this.getPanelCapacityW() || 600;
    const maxPotenciaW = this.getPotenciaMaxAsignadaW();
    if (!maxPotenciaW || maxPotenciaW <= 0) {
      return 9999;
    }
    return Math.floor(maxPotenciaW / panelWatts);
  }

}
