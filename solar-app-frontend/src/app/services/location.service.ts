import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GeocodingService } from './geocoding.service';
import { SharedService } from './shared.service';
import { NearbyLocationService } from './nearby-location.service';
import { NearbyLocation } from '../interfaces/nearby-location';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private predefinedLocations: NearbyLocation[] = [
    {
      lat: -31.658,
      lng: -68.277,
      energiaGeneradaAnual: 5820.48,
      irradiacionAnual: 2062.23,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -31.595,
      lng: -68.401,
      energiaGeneradaAnual: 5851.31,
      irradiacionAnual: 2069.54,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -31.517,
      lng: -68.352,
      energiaGeneradaAnual: 5836.99,
      irradiacionAnual: 2068.55,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 2000,
    },
    {
      lat: -31.829,
      lng: -68.246,
      energiaGeneradaAnual: 5714.21,
      irradiacionAnual: 2033.51,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -31.813,
      lng: -68.328,
      energiaGeneradaAnual: 5757.5,
      irradiacionAnual: 2041.43,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -31.897,
      lng: -68.38,
      energiaGeneradaAnual: 5763.62,
      irradiacionAnual: 2045.35,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -31.981,
      lng: -68.427,
      energiaGeneradaAnual: 5762.78,
      irradiacionAnual: 2033.96,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -32.002,
      lng: -68.762,
      energiaGeneradaAnual: 5890.01,
      irradiacionAnual: 2028.6,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -31.821,
      lng: -68.54,
      energiaGeneradaAnual: 5907.69,
      irradiacionAnual: 2071.04,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -31.72,
      lng: -68.583,
      energiaGeneradaAnual: 5970.11,
      irradiacionAnual: 2091.29,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -31.656,
      lng: -68.575,
      energiaGeneradaAnual: 5947.32,
      irradiacionAnual: 2093.13,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -31.683,
      lng: -68.472,
      energiaGeneradaAnual: 5666.08,
      irradiacionAnual: 1997.17,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -31.44,
      lng: -68.518,
      energiaGeneradaAnual: 5998.88,
      irradiacionAnual: 2109.98,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -31.562,
      lng: -68.727,
      energiaGeneradaAnual: 6010.68,
      irradiacionAnual: 2093.72,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -31.528,
      lng: -68.703,
      energiaGeneradaAnual: 5886.13,
      irradiacionAnual: 2046.8,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -31.457,
      lng: -68.72,
      energiaGeneradaAnual: 6098.81,
      irradiacionAnual: 2125.24,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -31.334,
      lng: -69.421,
      energiaGeneradaAnual: 6567.87,
      irradiacionAnual: 2298.79,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -30.422,
      lng: -69.228,
      energiaGeneradaAnual: 6808.67,
      irradiacionAnual: 2318.17,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -30.163,
      lng: -67.843,
      energiaGeneradaAnual: 5858.31,
      irradiacionAnual: 2055.4,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -31.648,
      lng: -69.472,
      energiaGeneradaAnual: 6419.3,
      irradiacionAnual: 2233.74,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -30.323,
      lng: -69.211,
      energiaGeneradaAnual: 6736.88,
      irradiacionAnual: 2283.57,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -30.198,
      lng: -69.109,
      energiaGeneradaAnual: 6769.55,
      irradiacionAnual: 2331.18,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -30.237,
      lng: -68.752,
      energiaGeneradaAnual: 6326.71,
      irradiacionAnual: 2213.65,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -31.524,
      lng: -68.63,
      energiaGeneradaAnual: 5984.04,
      irradiacionAnual: 2097.96,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -31.541,
      lng: -68.635,
      energiaGeneradaAnual: 5973.43,
      irradiacionAnual: 2090.94,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -31.387,
      lng: -68.483,
      energiaGeneradaAnual: 5981.36,
      irradiacionAnual: 2100.45,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -31.45,
      lng: -68.405,
      energiaGeneradaAnual: 5937.01,
      irradiacionAnual: 2091.04,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -31.496,
      lng: -68.415,
      energiaGeneradaAnual: 5961.34,
      irradiacionAnual: 2101.84,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -31.538,
      lng: -68.419,
      energiaGeneradaAnual: 5894.93,
      irradiacionAnual: 2069.53,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -31.554,
      lng: -68.333,
      energiaGeneradaAnual: 5838.92,
      irradiacionAnual: 2069.88,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -31.954,
      lng: -68.657,
      energiaGeneradaAnual: 5980.79,
      irradiacionAnual: 2072.77,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -30.954,
      lng: -67.304,
      energiaGeneradaAnual: 5669.94,
      irradiacionAnual: 1951.16,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
    {
      lat: -30.157,
      lng: -68.484,
      energiaGeneradaAnual: 6089.49,
      irradiacionAnual: 2135.85,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
      radio: 971.91,
    },
  ];

  constructor(
    private geocodingService: GeocodingService,
    private snackBar: MatSnackBar,
    private sharedService: SharedService,
    private nearbyService: NearbyLocationService
  ) {}

  async validateLocation(
    placeName: string,
    map: google.maps.Map,
    marker: google.maps.marker.AdvancedMarkerElement
  ): Promise<google.maps.LatLng | null> {
    try {
      const geocodeResult = await this.geocodingService.geocodeAddress(
        placeName,
        map,
        marker
      );

      if (geocodeResult) {
        const lat = geocodeResult.lat;
        const lng = geocodeResult.lng;

        if (this.isWithinSanJuan(lat, lng)) {
          const selectedLatLng = new google.maps.LatLng(lat, lng);
          marker.position = selectedLatLng;
          map.setZoom(22);
          return selectedLatLng;
        } else {
          // Esta rama se ejecuta si la ubicación no está dentro de San Juan
          map.setZoom(14);
          this.snackBar.open(
            'El área seleccionada está fuera de la Provincia de San Juan.',
            '',
            {
              duration: 5000,
              panelClass: ['custom-snackbar'],
              verticalPosition: 'top',
              horizontalPosition: 'center',
            }
          );
          return null;
        }
      } else {
        throw new Error('No se pudo geocodificar la dirección.');
      }
    } catch (error) {
      console.error('Error al validar la ubicación:', error);
      return null;
    }
  }

  // Polígono perimetral oficial simplificado de la Provincia de San Juan
  private static readonly SAN_JUAN_POLYGON: { lat: number; lng: number }[] = [
    { lat: -28.37, lng: -69.80 }, // Noroeste Iglesia / Límite Chile - La Rioja
    { lat: -28.30, lng: -69.25 }, // Norte Iglesia / La Rioja
    { lat: -28.45, lng: -68.80 }, // Norte Jáchal / La Rioja
    { lat: -28.95, lng: -68.45 }, // Huaco / La Rioja
    { lat: -30.00, lng: -67.25 }, // Ischigualasto / Valle Fértil Norte
    { lat: -30.50, lng: -67.15 }, // Valle Fértil Este
    { lat: -31.10, lng: -67.20 }, // Valle Fértil Sureste
    { lat: -31.60, lng: -66.85 }, // Bermejo / Caucete Este / La Rioja - San Luis
    { lat: -31.95, lng: -66.75 }, // El Encón / Desaguadero Sureste
    { lat: -32.25, lng: -67.40 }, // Límite Sur Caucete / 25 de Mayo / Mendoza
    { lat: -32.40, lng: -68.20 }, // Lagunas de Guanacache / 25 de Mayo Sur
    { lat: -32.65, lng: -68.70 }, // Sarmiento Sur / Media Agua / Mendoza
    { lat: -32.35, lng: -69.50 }, // Barreal Sur / Calingasta / Mendoza
    { lat: -32.20, lng: -70.40 }, // Paso de los Patos / Suroeste Calingasta / Chile
    { lat: -31.50, lng: -70.55 }, // Cordillera Central Calingasta / Chile
    { lat: -30.50, lng: -70.30 }, // Paso de Agua Negra / Iglesia / Chile
    { lat: -29.30, lng: -69.95 }, // Cordillera Norte Iglesia / Chile
  ];

  public isWithinSanJuan(lat: number, lng: number): boolean {
    // 1. Descarte rápido por Bounding Box envolvente
    if (lat < -32.70 || lat > -28.25 || lng < -70.70 || lng > -66.70) {
      return false;
    }

    // 2. Validación precisa punto-en-polígono (Ray-casting)
    const polygon = LocationService.SAN_JUAN_POLYGON;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng, yi = polygon[i].lat;
      const xj = polygon[j].lng, yj = polygon[j].lat;

      const intersect = ((yi > lat) !== (yj > lat))
          && (lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  }

  validatePolygonLocation(polygon: google.maps.Polygon, map: google.maps.Map, autoPan: boolean = false) {
    const path = polygon.getPath().getArray();
    if (!path || path.length === 0) return null;

    // 1. Calcular el centroide del polígono
    const centroid = this.calculateCentroid(path);
    const lat = centroid.lat;
    const lng = centroid.lng;
    if (this.isWithinSanJuan(lat, lng)) {
      if (autoPan) {
        map.setZoom(22);
        map.panTo({ lat, lng });
      }
      return { lat, lng };
    } else {
      this.snackBar.open(
        'El área seleccionada está fuera de la Provincia de San Juan.',
        '',
        {
          duration: 5000,
          panelClass: ['custom-snackbar'],
          verticalPosition: 'top',
          horizontalPosition: 'center',
        }
      );
      return false;
    }
  }

  public calculateCentroid(path: google.maps.LatLng[]): {
    lat: number;
    lng: number;
  } {
    let latSum = 0;
    let lngSum = 0;

    path.forEach((latLng) => {
      latSum += latLng.lat();
      lngSum += latLng.lng();
    });

    return {
      lat: latSum / path.length,
      lng: lngSum / path.length,
    };
  }

  public findNearbyLocation(lat: number, lng: number) {
    return this.predefinedLocations.find((location) => {
      // Calcula la distancia en kilómetros entre las coordenadas dadas y la ubicación predefinida
      const distance = this.calculateDistance(
        lat,
        lng,
        location.lat,
        location.lng
      );

      // Compara la distancia con el radio de la ubicación predefinida
      const radioInKm = location.radio / 1000;
      return distance <= radioInKm;
    });
  }
  // Método auxiliar para calcular la distancia entre dos puntos en la superficie de la Tierra
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLng = this.degreesToRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) *
        Math.cos(this.degreesToRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en kilómetros
  }

  // Método auxiliar para convertir grados a radianes
  private degreesToRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  
}
