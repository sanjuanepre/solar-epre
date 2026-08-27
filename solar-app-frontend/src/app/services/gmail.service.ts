import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PdfService, GeneratePdfPayload } from './pdf.service';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environments';

@Injectable({
  providedIn: 'root',
})
export class GmailService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private pdfService: PdfService) {}

  async sendEmailWithResults(email: string, payload: GeneratePdfPayload): Promise<void> {
    try {
      // 1. Obtener el PDF vectorial generado por el backend Puppeteer
      const pdfBlob = await firstValueFrom(this.pdfService.downloadPdfBlob(payload));
      const uniqueID = payload.uniqueID || this.pdfService.uniqueID;

      // 2. Adjuntar a FormData y enviar al controlador de correo
      const formData = new FormData();
      formData.append('email', email);
      formData.append('file', pdfBlob, `resultado-id-${uniqueID}.pdf`);

      await firstValueFrom(this.http.post(`${this.apiUrl}/gmail/send-email`, formData));
      console.log('[GmailService] Email con PDF adjunto enviado exitosamente.');
    } catch (error) {
      console.error('[GmailService] Error al enviar el email:', error);
      throw error;
    }
  }

  async sendEmailChangeCapacityInApi(newPanelCapacityW: number): Promise<void> {
    this.http
      .get<any>(
        `${this.apiUrl}/gmail/send-email-change?newPanelCapacityW=${newPanelCapacityW}`
      )
      .subscribe({
        next: () => console.log('[GmailService] Notificación de actualización enviada...'),
        error: (error) => console.error('[GmailService] Error:', error),
      });
  }
}
