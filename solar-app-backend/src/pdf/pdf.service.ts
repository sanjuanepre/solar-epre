import { Injectable, Logger } from '@nestjs/common';
import puppeteer from 'puppeteer-core';
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
    process.env.AWS_LAMBDA_JS_RUNTIME = 'nodejs20.x';
    try {
      const execPath = await chromium.executablePath();
      this.logger.log(`Chromium local resuelto exitosamente en: ${execPath}`);
      return execPath;
    } catch (err: any) {
      this.logger.warn(`Chromium local no encontrado (${err?.message}). Descargando pack desde GitHub...`);
      const CHROMIUM_PACK_URL = 'https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar';
      return await chromium.executablePath(CHROMIUM_PACK_URL);
    }
  }

  async generatePdf(data: GeneratePdfDto): Promise<Buffer> {
    let browser = null;
    try {
      const isVercel = Boolean(process.env.VERCEL || process.env.AWS_EXECUTION_ENV);
      if (isVercel && (chromium as any).setGraphicsMode !== undefined) {
        (chromium as any).setGraphicsMode = false;
      }
      const executablePath = await this.getExecutablePath();
      if (isVercel) {
        const path = await import('path');
        try {
          const lambdafs = (await import('@sparticuz/chromium/build/lambdafs')).default;
          const binDir = path.join(path.dirname(require.resolve('@sparticuz/chromium')), '..', 'bin');
          const al2023Tar = path.join(binDir, 'al2023.tar.br');
          if (fs.existsSync(al2023Tar) && !fs.existsSync('/tmp/al2023/lib')) {
            await lambdafs.inflate(al2023Tar);
            this.logger.log('Librerías compartidas al2023 infladas exitosamente en /tmp/al2023/lib');
          }
        } catch (inflateErr) {
          this.logger.warn('No se pudo inflar al2023.tar.br:', inflateErr);
        }

        const libDirs = ['/tmp/al2023/lib', '/tmp/al2/lib', '/tmp'];
        process.env.LD_LIBRARY_PATH = [
          ...libDirs,
          process.env.LD_LIBRARY_PATH || '',
        ].filter(Boolean).join(':');
      }

      this.logger.log(`Lanzando Puppeteer (Vercel: ${isVercel}, Executable: ${executablePath}, LD_LIBRARY_PATH: ${process.env.LD_LIBRARY_PATH})`);

      browser = await puppeteer.launch({
        args: isVercel ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        defaultViewport: (chromium as any).defaultViewport || { width: 1280, height: 960 },
        executablePath: executablePath,
        headless: isVercel ? (chromium.headless as any) : true,
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
        waitUntil: 'domcontentloaded',
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
