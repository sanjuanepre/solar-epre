import { ApiProperty } from "@nestjs/swagger";
import { CoordenadasDTO } from "./coordenadas.dto";
import { TarifaCategoria } from "../../tarifa-categoria/tarifa-categoria-enum";
import { Parametros } from "../../interfaces/sheets/parametros/parametros.interface";

// src/solar/dto/solar-calculation.dto.ts
export class SolarCalculationDto {
    @ApiProperty()
    annualConsumption: number;
    @ApiProperty()
    polygonCoordinates: any[];
    @ApiProperty()
    categoriaSeleccionada: TarifaCategoria;
    @ApiProperty()
    polygonArea: number;
    @ApiProperty()
    panelsSelected?: number;
    @ApiProperty()
    potenciaMaxAsignada: number;
    parametros?: Parametros
    @ApiProperty()
    factorPotencia?: number | 1;
    @ApiProperty()
    tipoEstructura?: 'coplanar' | 'optimo';
  }
  