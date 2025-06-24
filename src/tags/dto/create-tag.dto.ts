import { IsArray, IsBoolean, IsString, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class CreateTagDto {
  @IsString()
  @ApiProperty({ example: "Technology" })
  @Transform(({ value }) => value.trim())
  title: string;
}
