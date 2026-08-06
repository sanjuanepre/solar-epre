import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { PdfService } from './pdf.service';
import { GeneratePdfDto } from './pdf.dto';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('generate')
  async generatePdf(@Body() dto: GeneratePdfDto, @Res() res: Response) {
    try {
      const pdfBuffer = await this.pdfService.generatePdf(dto);
      const filename = `resultado-id-${dto.uniqueID || 'simulacion'}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length.toString());

      return res.status(HttpStatus.OK).send(pdfBuffer);
    } catch (error) {
      console.error('[PdfController] Error al generar PDF:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'No se pudo generar el reporte PDF.',
        error: error.message || error,
      });
    }
  }
}
