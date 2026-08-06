import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environments';

export interface GeneratePdfPayload {
  uniqueID?: string;
  categoriaTarifa: string;
  tipoEstructura: string;
  roofFactor?: number;
  potenciaContratada: number;
  panelesCantidad: number;
  panelCapacityW: number;
  costoInstalacion: number;
  ahorroEstimadoPesosAnual: number;
  ahorroPorcentajeAnual: number;
  periodoRecuperoAnios: number;
  potenciaPicoKw: number;
  generacionAnualKwh: number;
  superficieTechoM2: number;
  emisionesGEIEvitadasTnAnual: number;
  proporcionAutoconsumo: number;
  proporcionInyectada: number;
  flujoEnergia?: number[];
  flujoIngresos?: number[];
  generacionFotovoltaica?: number[];
}

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  uniqueID!: string;

  constructor(private http: HttpClient) {
    this.uniqueID = this.generateShortUUID();
  }

  generateShortUUID(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  /**
   * Solicita al backend NestJS (Puppeteer/Chromium) la generación del reporte PDF vectorial.
   */
  downloadPdfBlob(payload: GeneratePdfPayload): Observable<Blob> {
    const url = `${environment.apiUrl}/pdf/generate`;
    return this.http.post(url, payload, {
      responseType: 'blob',
    });
  }
}
