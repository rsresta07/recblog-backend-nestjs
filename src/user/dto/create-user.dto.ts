import { IsDate, IsString } from "class-validator";

export class CreateUserDto {
  @IsString()
  email: string;

  @IsString()
  password: string;

  @IsString()
  refresh_token: string;

  @IsString()
  role: string;

  @IsString()
  status: string;

  @IsDate()
  last_login_at: string;
}
