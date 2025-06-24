import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class CreatePostDto {
  @IsString()
  @ApiProperty({ example: "A New Day" })
  @Transform(({ value }) => value.trim())
  title: string;

  @IsString()
  @ApiProperty({
    example:
      "<p>A New Month in the life of all these people that are traveling to the world</p>",
  })
  @Transform(({ value }) => value.trim())
  description: string;

  @IsString()
  @ApiProperty({ example: "/L029.jpg" })
  image: string;

  // @IsBoolean()
  // @ApiProperty({ example: true })
  // status: boolean;

  @IsArray()
  @IsUUID("all", { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @ApiProperty({
    example: ["98eec7cf-8b52-4f02-aac8-d17b886a901a"],
  })
  tagIds: string[];
}
