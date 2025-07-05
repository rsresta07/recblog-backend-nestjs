import { IsUUID } from "class-validator";

export class LikeDto {
  @IsUUID() postId: string;
}
