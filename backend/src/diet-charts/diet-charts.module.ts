import { Module } from '@nestjs/common';
import { DietChartsController } from './diet-charts.controller.js';
import { DietChartsService } from './diet-charts.service.js';
@Module({controllers:[DietChartsController],providers:[DietChartsService],exports:[DietChartsService]}) export class DietChartsModule {}
