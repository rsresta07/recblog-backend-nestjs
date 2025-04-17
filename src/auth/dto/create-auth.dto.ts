import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class LoginAuthDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: "test@gmail.com" })
  email: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: "@password123" })
  password: string;
}

export class RegisterUserDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: "username" })
  username: string;

  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ example: "test@gmail.com" })
  email: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: "@password123" })
  password: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: "9876543210" })
  contact: string;

  @IsOptional()
  @ApiProperty({ example: "APPROVED" })
  status: any;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: "koteshwor" })
  location: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example:
      "https://media.istockphoto.com/id/1130884625/vector/user-member-vector-icon-for-ui-user-interface-or-profile-face-avatar-app-in-circle-design.jpg?s=612x612&w=0&k=20&c=1ky-gNHiS2iyLsUPQkxAtPBWH1BZt0PKBB1WBtxQJRE=",
  })
  display_image_url: string;
}
