import { IsArray, IsBoolean, IsString, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class CreateTagDto {
  @IsString()
  @ApiProperty({ example: "Technology" })
  @Transform(({ value }) => value.trim())
  title: string;

  @IsBoolean()
  @ApiProperty({ example: true })
  status: boolean;

  @IsArray()
  @IsUUID("all", { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @ApiProperty({
    example: ["69193f2c-9f02-4502-9560-06262c9303f9"],
  })
  userIds: string[];
}
