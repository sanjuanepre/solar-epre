import { APP_INITIALIZER, LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // Importa FormsModule
import { LazyLoadImageModule } from 'ng-lazyload-image'; // Importa el módulo

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { Paso1Component } from './pasos/paso1/paso1.component';
import { Paso2Component } from './pasos/paso2/paso2.component';
import { Paso3Component } from './pasos/paso3/paso3.component';
import { MapaComponent } from './mapa/mapa.component';
import { LayoutPasosComponent } from './layout-pasos/layout-pasos.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { ToolbarPasosComponent } from './pasos/toolbar-pasos/toolbar-pasos.component';

import { ConsumoComponent } from './pasos/paso2/consumo/consumo.component';
import { GraficosComponent } from './pasos/paso3/graficos/graficos.component';
import { TarifaComponent } from './pasos/paso2/tarifa/tarifa.component';
import { ResultadoComponent } from './pasos/paso2/resultado/resultado.component';
import { EnergiaComponent } from './pasos/paso3/energia/energia.component';
import { PanelesComponent } from './pasos/paso3/paneles/paneles.component';
import { TerminosComponent } from './pasos/paso0/terminos/terminos.component';
import { Paso0Component } from './pasos/paso0/paso0.component';

//Angular Material
import {MatToolbarModule} from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule } from '@angular/material/dialog';  
import { MatRadioModule } from '@angular/material/radio';
import { MatInputModule } from '@angular/material/input';



import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { HttpClientModule } from '@angular/common/http';
import { PlazoComponent } from './pasos/paso3/plazo/plazo.component';
import { PotenciaComponent } from './pasos/paso3/potencia/potencia.component';
import { SuperficieComponent } from './pasos/paso3/superficie/superficie.component';
import { EmisionesComponent } from './pasos/paso3/emisiones/emisiones.component';
import { CostoComponent } from './pasos/paso3/costo/costo.component';
import { TarifaIntercambioComponent } from './pasos/paso3/tarifa-intercambio/tarifa-intercambio.component';
import { TotalComponent } from './pasos/paso2/total/total.component';
import { NgChartsModule } from 'ng2-charts';
import { MatSliderModule, MatSliderThumb } from '@angular/material/slider';
import { GoogleMapsModule } from '@angular/google-maps';
import { EnvironmentService } from './services/environment.service';
import { firstValueFrom } from 'rxjs';
import { NgxSpinnerModule } from 'ngx-spinner';
import { AhorrosComponent } from './pasos/paso3/ahorros/ahorros.component';
import { InstruccionesComponent } from './instrucciones/instrucciones.component';
import { CustomNumberPipe } from './pipes/custom-number.pipe';
import { TarifaDialogComponent } from './pasos/paso2/tarifa/tarifa-dialog/tarifa-dialog.component';
import { DecimalPipe, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { RefreshHandlerComponent } from './refresh-handler/refresh-handler.component';

export function initializeApp(environmentService: EnvironmentService): () => Promise<void> {
  return (): Promise<void> => firstValueFrom(environmentService.loadGoogleMapsApiKey());
}
registerLocaleData(localeEs, 'es'); 
@NgModule({
  declarations: [
    AppComponent,
    WelcomeComponent,
    Paso1Component,
    Paso2Component,
    Paso3Component,
    MapaComponent,
    LayoutPasosComponent,
    ToolbarComponent,
    ToolbarPasosComponent,
    ConsumoComponent,
    GraficosComponent,
    TarifaComponent,
    ResultadoComponent,
    EnergiaComponent,
    PanelesComponent,
    TerminosComponent,
    Paso0Component,
    PlazoComponent,
    PotenciaComponent,
    SuperficieComponent,
    EmisionesComponent,
    CostoComponent,
    TarifaIntercambioComponent,
    TotalComponent,
    AhorrosComponent,
    InstruccionesComponent,
    CustomNumberPipe,
    TarifaDialogComponent,
    RefreshHandlerComponent 
  ],
  
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatCardModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    LazyLoadImageModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatIconModule,
    HttpClientModule,
    NgChartsModule,
    MatSliderModule,
    MatSlideToggleModule,
    GoogleMapsModule,
    MatDialogModule,
    MatRadioModule,
    NgxSpinnerModule.forRoot(),
    ReactiveFormsModule,
    MatInputModule,
    
  ],
  providers: [
    EnvironmentService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [EnvironmentService],
      multi: true,
    },
    { provide: LOCALE_ID, useValue: 'es' },
    DecimalPipe
  ],
  bootstrap: [AppComponent] 
})
export class AppModule { }
