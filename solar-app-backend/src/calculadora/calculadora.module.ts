import { Module } from '@nestjs/common';
import { CalculadoraService } from './calculadora.service';

@Module({
  providers: [CalculadoraService],
  exports: [CalculadoraService],
})
export class CalculadoraModule {}
