import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Paso1Component } from './pasos/paso1/paso1.component';
import { Paso2Component } from './pasos/paso2/paso2.component';
import { Paso3Component } from './pasos/paso3/paso3.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { LayoutPasosComponent } from './layout-pasos/layout-pasos.component';
import { Paso0Component } from './pasos/paso0/paso0.component';
import { RefreshHandlerComponent } from './refresh-handler/refresh-handler.component';


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
      { path: '**', redirectTo: '' }
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: false })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
