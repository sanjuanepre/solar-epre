import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { Paso1Component } from './pasos/paso1/paso1.component';
import { Paso2Component } from './pasos/paso2/paso2.component';
import { Paso3Component } from './pasos/paso3/paso3.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { LayoutPasosComponent } from './layout-pasos/layout-pasos.component';
import { Paso0Component } from './pasos/paso0/paso0.component';
import { RefreshHandlerComponent } from './refresh-handler/refresh-handler.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { ServiceUnavailableComponent } from './service-unavailable/service-unavailable.component';


const routes: Routes = [
  { path: '', component: WelcomeComponent },
  { path: 'refresh', component: RefreshHandlerComponent }, // Nueva ruta para manejar recargas
  {
    path: 'pasos', component: LayoutPasosComponent,
    children: [
      { path: '0', component: Paso0Component },
      { path: '1', component: Paso1Component },
      { path: '2', component: Paso2Component },
      { path: '3', component: Paso3Component },
      { path: '**', redirectTo: '404' }
    ]
  },
  { path: '404', component: NotFoundComponent }, // Página para rutas no encontradas
  { path: '503', component: ServiceUnavailableComponent }, // Página para servicios no disponibles
  { path: '**', redirectTo: '404' } // Redirige todas las rutas no encontradas a la página 404
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: false, preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule {}