import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { SolarModule } from './solar/solar.module';
import { AuthModule } from './auth/auth.module';
import { GoogleSheetsModule } from './google-sheets/google-sheets.module';
import { GmailModule } from './gmail/gmail.module';
import { CalculadoraModule } from './calculadora/calculadora.module';
import { TarifaCategoriaModule } from './tarifa-categoria/tarifa-categoria.module';
import { VariablesOnlineService } from './google-sheets/variables-online/variables-online.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'), // Directorio donde se encuentran los archivos de Angular
    }),
    SolarModule,
    ConfigModule.forRoot({
      envFilePath: ['.env', '.env.sheets'],
      isGlobal: true,
    }),
    AuthModule,
    GoogleSheetsModule,
    GmailModule,
    CalculadoraModule,
    TarifaCategoriaModule
  ],
  controllers: [],
  providers: [VariablesOnlineService],
})
export class AppModule { }
