import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsUUID()
  dietChartId?: string;

  @IsString()
  @IsNotEmpty()
  body!: string;
}
