import { ApiProperty } from "@nestjs/swagger";

export class CoordenadasDTO {
  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longitude: number;
  }