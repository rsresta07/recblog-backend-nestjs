import { IsOptional, IsString, Length } from "class-validator";

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  fullName?: string;

  @IsOptional()
  @IsString()
  @Length(4, 100)
  username?: string;

  @IsOptional()
  @IsString()
  @Length(5, 100)
  position?: string;

  @IsOptional()
  @IsString()
  email?: string;
}
