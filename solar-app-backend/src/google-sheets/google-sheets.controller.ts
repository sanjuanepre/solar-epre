import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GoogleSheetsService } from './google-sheets.service';
import { MesesConsumo } from 'src/interfaces/meses-consumo/meses-consumo.interface';
@ApiTags('GoogleSheets')
@Controller('google-sheets')
export class GoogleSheetsController {
  

  constructor(private readonly googleSheetsService: GoogleSheetsService) {
    
  }

  @Get('read')
  @ApiOperation({
    summary:
      'obtiene los datos de la celda apuntada, pasar nombre de la pestaña y coordenadas de la celda',
  })
  async readValueCalculadora(@Query('tabName') tabName: string, @Query('range') range: string) {
    /* const result = await this.googleSheetsService.readValueCalculadora(tabName, range);
    return result.data.values; */
  }

  @Post('cargarConsumos')
  @ApiOperation({ summary: 'Carga los consumos anuales en la calculadora de Google Sheets' })
  async cargarConsumosAnualesEnCalculadora(@Body() meses: MesesConsumo[]): Promise<any> {
    // await this.googleSheetsService.cargarConsumosAnuales(meses);
    
  }

  @Get("resultados")
  @ApiOperation({ summary: 'Obtiene resultados de la calculadora solar' })
  async getResultados(){
    // return await this.googleSheetsService.readResultados();
  }


}
