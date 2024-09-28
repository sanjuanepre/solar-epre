import { Module } from '@nestjs/common';
import { SolarService } from './solar.service';
import { SolarController } from './solar.controller';
import { HttpModule } from '@nestjs/axios';
import { GoogleSheetsModule } from 'src/google-sheets/google-sheets.module';
import { CalculadoraModule } from 'src/calculadora/calculadora.module';

@Module({
  imports: [HttpModule, GoogleSheetsModule, CalculadoraModule],
  providers: [SolarService],
  controllers: [SolarController ]
})
export class SolarModule {}
