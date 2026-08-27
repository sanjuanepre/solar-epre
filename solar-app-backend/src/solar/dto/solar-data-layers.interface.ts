/**
 * Tipado de la respuesta del endpoint dataLayers:get de la Google Solar API.
 * Las URLs son temporales (firmadas) y contienen los archivos GeoTIFF de datos rasterizados.
 * @see https://developers.google.com/maps/documentation/solar/reference/rest/v1/dataLayers
 */
export interface SolarDataLayersResponse {
  /** Fecha de adquisición de las imágenes base. */
  imageryDate: { year: number; month: number; day: number };
  /** Fecha en la que fueron procesadas las imágenes. */
  imageryProcessedDate: { year: number; month: number; day: number };
  /** URL del GeoTIFF del Modelo Digital de Superficie (elevaciones en metros sobre el geoide EGM96). */
  dsmUrl: string | null;
  /** URL del GeoTIFF de imagen aérea/satelital en color verdadero. */
  rgbUrl: string | null;
  /** URL del GeoTIFF de máscara binaria de edificio (1=techo, 0=no techo). */
  maskUrl: string | null;
  /** URL del GeoTIFF de flujo solar anual (kWh/kW/año). 1 banda. */
  annualFluxUrl: string | null;
  /** URL del GeoTIFF de flujo solar mensual (12 bandas, una por mes). */
  monthlyFluxUrl: string | null;
  /** URLs de GeoTIFFs de sombras horarias (12 archivos, uno por mes; cada uno tiene 24 bandas, una por hora). */
  hourlyShadeUrls: string[];
  /** Calidad estimada de la imagen: HIGH, MEDIUM, LOW. */
  imageryQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  /** Indicador de que este resultado es un mock para desarrollo (no está en la API real). */
  isMock?: boolean;
}
