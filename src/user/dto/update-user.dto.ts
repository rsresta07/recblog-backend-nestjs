import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsString()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  password: string;

  @IsString()
  @IsOptional()
  refresh_token: string;

  @IsString()
  @IsOptional()
  role: string;

  @IsString()
  @IsOptional()
  status: string;

  @IsDate()
  @IsOptional()
  last_login_at: string;
}
