import {
  Body,
  Controller,
  Get,
  Options,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { SolarService } from './solar.service';
import { SolarCalculationDto } from './dto/solar-calculation.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResultadosDto } from '../interfaces/resultados-dto/resultados-dto.interface';
import { SolarData } from '../interfaces/solar-data/solar-data.interface';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
import { Response } from 'express';

@ApiTags('solar')
@Controller('solar')
export class SolarController {
  constructor(
    private readonly solarService: SolarService,
    private readonly sheetsService: GoogleSheetsService,
  ) {}

  @Post('calculate')
  @ApiOperation({
    summary: 'Realiza los cálculos para determinar el ahorro energético',
  })
  async calculateSolarSavings(
    @Body() solarCalculationDto: SolarCalculationDto,
    @Req() request: Request,
    @Res() res: Response, 
  ): Promise<void> {
    /* console.log('Información completa de la solicitud:', request.body);
    console.log('Headers:', request.headers); */
    try {
      const isOnline = await this.sheetsService.isCalculadoraOnline();

      if (true) {
        const solarCalculationWithParameters: SolarCalculationDto =
          await this.sheetsService.addParametersToSolarCalculationDto(
            solarCalculationDto,
          );
        const resultados = await this.solarService.calculateSolarSavings(
          solarCalculationWithParameters,
        );
        // console.log("resultados ", resultados.solarData.panels.yearlysAnualConfigurations);
        
        res.status(200).json(resultados); 
      } else {
        this.handleOfflineCase(res);
      }
    } catch (error) {
      console.error('Error al calcular el ahorro solar:', error);
      res.status(500).json({
        mensaje: 'No se pudo calcular el ahorro solar.',
      }); // Enviar error con código 500
    }
  }

  private handleOfflineCase(res: Response): void {
    res.status(503).json({
      mensaje:
        'La calculadora no está disponible en este momento. Por favor, inténtelo más tarde.',
    }); // Enviar error con código 503
  }

  @Post('calculate-nearby')
  async calculateSolarSavingsNearby(
    @Body() solarDataNearby: SolarData,
  ): Promise<ResultadosDto> {
    return await this.solarService.calculateSolarSavingsNearby(solarDataNearby);
  }

  @Get('solarData')
  async getSolarData(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
  ) {
    return this.solarService.getSolarData(latitude, longitude);
  }

  @Get('dataLayers')
  @ApiOperation({
    summary: 'Obtiene las URLs de capas de datos solares (GeoTIFFs) para visualización del mapa de calor.',
  })
  async getDataLayers(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radiusMeters') radiusMeters: number = 30,
  ) {
    return this.solarService.getSolarDataLayers(
      Number(latitude),
      Number(longitude),
      Number(radiusMeters),
    );
  }

  @Options('calcular')
  handleOptions() {
    // Respuesta vacía para la solicitud OPTIONS
    return;
  }
}

