import { Injectable, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString, validateSync } from 'class-validator';
import { Environment } from '@/types';

@Injectable()
export class RootConfig {
  @IsNumber()
  PORT: number;
  @IsEnum(Environment)
  NODE_ENV: Environment;
  @IsString()
  MONGO_HOST: string;
  @IsNumber()
  MONGO_PORT: number;
  @IsString()
  MONGO_DB: string;
  @IsString()
  MONGO_USER: string;
  @IsString()
  MONGO_PASS: string;
  @IsString()
  GITHUB_TOKEN: string;
  @IsString()
  MONGO_URI: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(RootConfig, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    Logger.error('Failed to validate .env configuration');
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
