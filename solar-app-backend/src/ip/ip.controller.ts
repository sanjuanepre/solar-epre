import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import fetch from 'node-fetch'; // Asegúrate de instalar node-fetch si no lo tienes

@Controller('api/ip')
export class IpController {
  @Get()
  async getIp(@Res() res: Response) {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching IP', error });
    }
  }
}
