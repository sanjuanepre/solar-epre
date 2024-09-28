import { Injectable } from '@nestjs/common';
import { GoogleSheetsService } from '../google-sheets.service';
import { sheets_v4 } from 'googleapis';

@Injectable()
export class CheckInitService {

  private readonly urlSheet =
    'https://docs.google.com/spreadsheets/d/1F7ewXNxeSzydxFn3zBpCFhLXXK7QCcidzP6bClQa3AY/edit?gid=1632757415#gid=1632757415'
  constructor() {

  }

  async isCalculadoraOnline(googleSheetClient: sheets_v4.Sheets, urlSheet?: string): Promise<boolean> {
    try {
      const sheetId = this.extractSheetIdFromUrl(urlSheet ?? this.urlSheet);
      // const sheetId = "1F7ewXNxeSzydxFn3zBpCFhLXXK7QCcidzP6bClQa3AY";


      // Intentar leer el primer rango de la primera hoja (por ejemplo, A1:A1)
      const response = await googleSheetClient.spreadsheets.get({
        spreadsheetId: sheetId,
      });

      // Si la solicitud es exitosa y devuelve un valor, la hoja está online
      return response.status === 200;
    } catch (error) {
      console.error('Error al verificar la hoja de cálculo:', error.message);
      return false;
    }
  }

  private extractSheetIdFromUrl(url: string): string {
    // El ID de la hoja de cálculo está entre "/d/" y "/edit" en la URL
    const matches = url.match(/\/d\/([a-zA-Z0-9-_]+)\//);
    return matches ? matches[1] : '';
  }
}
