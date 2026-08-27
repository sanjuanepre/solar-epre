import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environments.prod';

if (environment.production) {
  enableProdMode();
}

function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google && (window as any).google.maps) {
      resolve();
      return;
    }

    const existingScript = document.querySelector('script[src^="https://maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      const oldCallback = (window as any).__googleMapsCallback;
      (window as any).__googleMapsCallback = () => {
        if (oldCallback) oldCallback();
        resolve();
      };
      return;
    }

    (window as any).__googleMapsCallback = () => {
      resolve();
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places,marker,geometry&v=weekly&loading=async&callback=__googleMapsCallback`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Error loading Google Maps API'));
    document.head.appendChild(script);
  });
}

async function bootstrap() {
  try {
    await loadGoogleMapsScript();
    await platformBrowserDynamic().bootstrapModule(AppModule);
  } catch (error) {
    console.error('Error bootstrapping the application:', error);
  }
}

bootstrap();
