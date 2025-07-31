import { IsEmail, IsEnum, IsOptional, IsString } from "class-validator";
import { RoleEnum, StatusEnum } from "../../utils/enum/role";

export class UpdateUserByAdminDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(RoleEnum)
  role?: RoleEnum;

  @IsOptional()
  @IsEnum(StatusEnum)
  status?: StatusEnum;
}
