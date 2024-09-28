import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PdfService } from './pdf.service';

@Injectable({
  providedIn: 'root',
})
export class GmailService {
  // private apiUrl = 'http://localhost:3000';
  private apiUrl = 'https://0l5cvs6h-3000.brs.devtunnels.ms';
  constructor(private http: HttpClient, private pdfService: PdfService) {}

  async sendEmailWithResults(email: string): Promise<void> {
    // Generar el PDF como Blob
    const pdf = await this.pdfService.generatePDF(false);
    const pdfBlob = pdf.output('blob');
    const uniqueID = this.pdfService.uniqueID;
    // Crear un objeto FormData para adjuntar el archivo
    const formData = new FormData();
    formData.append('email', email);
    formData.append('file', pdfBlob, `resultado-id-${uniqueID}.pdf`);

    // Enviar la solicitud HTTP con el archivo adjunto
    this.http.post(`${this.apiUrl}/gmail/send-email`, formData).subscribe({
      next: () => console.log('Email enviado exitosamente...'),
      error: (error) => console.error('Error al enviar el email:', error),
    });
  }

  async sendEmailChangeCapacityInApi(newPanelCapacityW: number): Promise<void> {
    this.http
      .get<any>(
        `${this.apiUrl}/gmail/send-email-change?newPanelCapacityW=${newPanelCapacityW}`
      )
      .subscribe({
        next: () => console.log('actualizacion enviada ...'),
        error: (error) => console.error(error),
      });
  }
}
