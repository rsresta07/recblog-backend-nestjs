import { ArrayNotEmpty, IsUUID } from "class-validator";

export class UpdatePreferencesDto {
  @ArrayNotEmpty()
  @IsUUID("all", { each: true })
  tagIds: string[];
}
