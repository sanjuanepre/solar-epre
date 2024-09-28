import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
@Injectable({
  providedIn: 'root',
})
export class PdfService {
  
  uniqueID!: string;

  constructor() {
    
    this.uniqueID = this.generateShortUUID();
  }

  async generatePDF(isDownload: boolean) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [210, 297],
    });
    this.uniqueID = this.generateShortUUID();
    // Encabezado
    await this.encabezadoGenerate(doc, 'RESULTADOS ESTIMADOS', true);
    await this.resultadosGenerate(doc);
    this.footerGenerate(doc);
    await this.graficosGenerate(doc);

    // Save the PDF
    if (isDownload) {
      doc.save(`resultado-id-${this.uniqueID}.pdf`);
    }
    return doc;
  }
  private async graficosGenerate(doc: jsPDF) {
    doc.addPage();
    let yPosition = await this.encabezadoGenerate(doc, 'GRAFICAS', true);
    await this.insertarCapturaPantalla(
      doc,
      'graficos',
      doc.internal.pageSize.getWidth() - 20,
      yPosition,
      1.5
    );
    this.footerGenerate(doc);
  }

  private footerGenerate(doc: jsPDF) {
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    const footerText = 'https://solar.epresanjuan.gob.ar';

    // Configurar el tamaño y fuente del texto
    doc.setFontSize(10);
    doc.setFont('Helvetica');
    // doc.setFont('Arial', 'normal');

    // Posicionar el texto en la parte inferior derecha
    const textWidth = doc.getTextWidth(footerText); // Obtener el ancho del texto
    const xPosition = pdfWidth - textWidth - 10; // Margen de 10px desde el borde derecho
    const yPosition = pdfHeight - 10; // Margen de 10px desde el borde inferior

    // Dibujar el texto en la posición calculada
    doc.text(footerText, xPosition, yPosition);
  }

  private async resultadosGenerate(doc: jsPDF) {
    let yPosition = 50; // Posición inicial en la primera página
    yPosition = await this.insertarCapturaPantalla(
      doc,
      'appPanelesId',
      doc.internal.pageSize.getWidth() - 20,
      yPosition,
      1.5
    );
    
    yPosition = await this.insertarCapturaPantalla(
      doc,
      'ahorrosId',
      doc.internal.pageSize.getWidth() - 20,
      yPosition,
      1.5
    );
    
    yPosition = await this.insertarCapturaPantalla(
      doc,
      'hipotesisId',
      doc.internal.pageSize.getWidth() - 20,
      yPosition,
      1.5
    );
  }
  
  private async insertarCapturaPantalla(
    doc: jsPDF,
    idElement: string,
    imgWidth: number,
    y: number,
    scale: number = 1
  ): Promise<number> {
    const resultadosElement = document.getElementById(idElement);
  
    if (resultadosElement) {
      // Calcular escala dinámica basada en la resolución
      const screenScale = window.devicePixelRatio || 1;
      const canvas = await html2canvas(resultadosElement, {
        scale: screenScale,  // Usar la escala basada en la pantalla
        useCORS: true,
        logging: false,
      });
  
      let imgData = canvas.toDataURL('image/jpeg', 0.7);
      const originalImgHeight = (canvas.height * imgWidth) / canvas.width;
  
      // Tamaño máximo disponible en la página
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();
      const xOffset = (pdfWidth - imgWidth / scale) / 2; // Centrar imagen
      let yPosition = y;
  
      // Verificar cuánto espacio queda en la página
      const availableHeight = pdfHeight - yPosition - 20; // Restar margen inferior
  
      // Si la imagen es más alta que el espacio disponible, redimensionarla
      let imgHeight = originalImgHeight;
      if (imgHeight / scale > availableHeight) {
        const scalingFactor = availableHeight / (imgHeight / scale);
        imgWidth = imgWidth * scalingFactor;
        imgHeight = imgHeight * scalingFactor;
      }
  
      // Añadir la imagen al PDF redimensionada
      doc.addImage(
        imgData,
        'JPEG',
        xOffset,
        yPosition,
        imgWidth / scale,
        imgHeight / scale
      );
  
      // Actualizar yPosition para la siguiente imagen
      yPosition += imgHeight / scale + 10; // Aumentar con un margen de 10 para la siguiente imagen
  
      
  
      // Retornar la nueva posición Y
      return yPosition;
    }
  
    return y; // En caso de no encontrar el elemento, retornar la misma posición Y
  }
  
  
  

  private async encabezadoGenerate(
    doc: jsPDF,
    encabezadoText: string,
    mostrarTitulo: boolean
  ): Promise<number> {
    const logoImage = '/assets/img/a4_header_img.jpg'; // Ruta de la imagen con todos los logos
    const pdfWidth = doc.internal.pageSize.getWidth();
  
    // Añadir el ID en el PDF (esquina superior derecha)
    doc.setFontSize(10);
    doc.text(`ID: ${this.uniqueID}`, pdfWidth - 38, 8); // 8px desde la parte superior
  
    // Dimensiones originales de la imagen (en píxeles)
    const originalImageWidth = 753;
    const originalImageHeight = 80;
  
    // Ajustar el ancho de la imagen al tamaño del PDF
    const imgWidth = pdfWidth - 20; // Ancho ajustado dejando 10px de margen a cada lado
    const imgHeight = (originalImageHeight * imgWidth) / originalImageWidth; // Mantener la proporción
  
    // Posición de la imagen en el PDF
    const xPosition = 10; // Margen de 10px desde la izquierda
    const yPosition = 10; // Margen de 10px desde la parte superior
  
    // Dibujar la imagen en el PDF
    return new Promise<number>((resolve) => {
      this.addImageToPDF(
        doc,
        logoImage,
        xPosition,
        yPosition,
        imgWidth,
        imgHeight
      ).then(() => {
        let yOffset = yPosition + imgHeight + 10; // Desplazar después de la imagen
  
        // Si se muestra el título, añadirlo y ajustar el yOffset
        if (mostrarTitulo) {
          doc.setFontSize(16);
          doc.setFont('Helvetica', 'bold');
          doc.text(encabezadoText, pdfWidth / 2, yOffset, { align: 'center' });
          yOffset += 20; // Añadir espacio adicional para el título
        }
  
        resolve(yOffset); // Devolver la nueva posición Y al final
      });
    });
  }
  

  private async addImageToPDF(
    doc: jsPDF,
    imageUrl: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = imageUrl;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const compressedImageData = canvas.toDataURL('image/jpeg', 0.7);
          doc.addImage(compressedImageData, 'JPEG', x, y, width, height);
          resolve();
        }
      };
    });
  }

  private generateShortUUID(): string {
    return Math.random().toString(36).substring(2, 14);
  }

  async obtenerPdfBlob(): Promise<Blob> {
    const doc = this.generatePDF(false);

    // Devuelve el PDF como Blob
    return new Promise(async (resolve) => {
      const pdfDoc = await doc;
      const pdfBlob = pdfDoc.output('blob');
      resolve(pdfBlob);
    });
  }
}
