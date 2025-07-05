import { IsString, IsUUID, MinLength } from "class-validator";
import { PrimaryGeneratedColumn } from "typeorm";

export class CommentDto {
  @IsString()
  @MinLength(1)
  content: string;
}
