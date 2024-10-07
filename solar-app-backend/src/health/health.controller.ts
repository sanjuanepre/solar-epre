// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
    @Get()
    checkHealth() {
        return { status: 'OK' }; // Devuelve un mensaje simple de estado
    }
}
