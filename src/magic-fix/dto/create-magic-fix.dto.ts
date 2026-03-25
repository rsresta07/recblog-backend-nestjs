import { IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateMagicFixDto {
  @IsString()
  @ApiProperty({ example: "<p>This are bad grammar.</p>" })
  text: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: "Fix grammar and make it professional." })
  instruction?: string;
}
