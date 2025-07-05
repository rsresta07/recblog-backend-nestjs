import { IsString, IsUUID, MinLength } from "class-validator";

export class FollowDto {
  @IsUUID() targetUserId: string;
}


