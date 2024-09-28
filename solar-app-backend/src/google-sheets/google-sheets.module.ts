// src/google-sheets/google-sheets.module.ts
import { Module } from '@nestjs/common';
import { GoogleSheetsService } from './google-sheets.service';
import { GoogleSheetsController } from './google-sheets.controller';
import { CheckInitService } from './check-init/check-init.service';
import { VariablesOnlineService } from './variables-online/variables-online.service';
import { CalculadoraModule } from 'src/calculadora/calculadora.module';

@Module({
  imports: [CalculadoraModule],
  providers: [GoogleSheetsService, CheckInitService, VariablesOnlineService],
  exports: [GoogleSheetsService],
  controllers: [GoogleSheetsController],
})
export class GoogleSheetsModule {}
