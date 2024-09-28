import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environments';

if (environment.production) {
  enableProdMode();
}

function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[src^="https://maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      // Script already exists
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=drawing,places,marker&loading=async&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
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
