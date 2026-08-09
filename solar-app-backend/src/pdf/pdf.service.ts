import { Injectable, Logger } from '@nestjs/common';
import chromium from '@sparticuz/chromium';
import { GeneratePdfDto } from './pdf.dto';
import { buildPdfHtml } from './pdf.template';
import * as fs from 'fs';

import * as QRCode from 'qrcode';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  private async getExecutablePath(): Promise<string> {
    if (process.env.CHROME_BIN) {
      return process.env.CHROME_BIN;
    }

    // Rutas locales conocidas para entorno de desarrollo local (Windows/Linux/Mac)
    const knownPaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
    ];

    for (const path of knownPaths) {
      if (fs.existsSync(path)) {
        return path;
      }
    }

    // En Vercel / Serverless o si no hay navegador instalado localmente
    return await chromium.executablePath();
  }

  async generatePdf(data: GeneratePdfDto): Promise<Buffer> {
    let browser = null;
    try {
      // Dynamic import para compatibilidad con CommonJS (puppeteer-core v25+ es ESM puro)
      const puppeteer = (await import('puppeteer-core')).default;

      const isVercel = Boolean(process.env.VERCEL || process.env.AWS_EXECUTION_ENV);
      const executablePath = await this.getExecutablePath();

      this.logger.log(`Lanzando Puppeteer (Vercel: ${isVercel}, Executable: ${executablePath})`);

      browser = await puppeteer.launch({
        args: isVercel ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: (chromium as any).defaultViewport || { width: 1280, height: 960 },
        executablePath: executablePath,
        headless: true,
      });

      const qrTarget = data.qrUrl || 'https://solar.epresanjuan.gob.ar';
      let qrBase64 = '';
      try {
        qrBase64 = await QRCode.toDataURL(qrTarget, { margin: 1, width: 120, color: { dark: '#0f172a', light: '#ffffff' } });
      } catch (err) {
        this.logger.warn('No se pudo generar QR code base64:', err);
      }

      const page = await browser.newPage();
      const htmlContent = buildPdfHtml(data, qrBase64);

      await page.setContent(htmlContent, {
        waitUntil: ['load', 'networkidle0'],
      });

      const pdfUint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm',
        },
      });

      return Buffer.from(pdfUint8Array);
    } catch (error) {
      this.logger.error('Error al generar PDF con Puppeteer:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
