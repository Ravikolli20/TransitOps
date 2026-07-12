import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class DashboardQueryDto {
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsIn(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'])
  status?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
