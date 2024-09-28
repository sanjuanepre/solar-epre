// geocoding.service.ts
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class GeocodingService {
  constructor(private snackBar: MatSnackBar) {}

  geocodeAddress(
    address: string,
    map: google.maps.Map,
    marker: google.maps.marker.AdvancedMarkerElement
  ): Promise<google.maps.LatLngLiteral> {
    const geocoder = new google.maps.Geocoder();
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, async (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results) {
          const location = results[0].geometry.location;
          resolve(location.toJSON());
        } else {
          this.snackBar.open(
            'No se encontró la ubicación. Intente de nuevo.',
            '',
            {
              duration: 5000,
              panelClass: ['custom-snackbar'],
              verticalPosition: 'top',
              horizontalPosition: 'center',
            }
          );
          reject('No se encontró la ubicación');
        }
      });
    });
  }
}
