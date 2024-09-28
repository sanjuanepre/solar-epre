import { APP_INITIALIZER } from "@angular/core";
import { EnvironmentService } from "./services/environment.service";
import { Observable } from "rxjs";
import { HttpClientModule } from "@angular/common/http";
import { BrowserModule } from "@angular/platform-browser";


export function initializeApp(environmentService: EnvironmentService): () => Promise<void> {
  return (): Promise<void> => firstValueFrom(environmentService.loadGoogleMapsApiKey());
}

@NgModule({
  imports: [HttpClientModule, BrowserModule],
  providers: [
    EnvironmentService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [EnvironmentService],
      multi: true,
    },
  ],
})
export class AppConfigModule {}
function firstValueFrom(arg0: Observable<void>): Promise<void> {
  throw new Error("Function not implemented.");
}

function NgModule(arg0: { imports: any[]; providers: (typeof EnvironmentService | { provide: any; useFactory: (environmentService: EnvironmentService) => () => Promise<void>; deps: (typeof EnvironmentService)[]; multi: boolean; })[]; }): (target: typeof AppConfigModule) => void | typeof AppConfigModule {
  throw new Error("Function not implemented.");
}

