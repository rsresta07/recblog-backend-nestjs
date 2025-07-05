import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { PostLikesService } from "./post-likes.service";
import { RolesGuard } from "src/auth/guard/role.guard";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RoleEnum } from "src/utils/enum/role";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { HasRoles } from "src/core/decorators/role.decorator";

@ApiTags("Likes")
@ApiBearerAuth()
@HasRoles(RoleEnum.USER)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("post-likes")
export class PostLikesController {
  constructor(private srv: PostLikesService) {}

  @Post(":id/like")
  like(@Param("id") id: string, @Req() req) {
    return this.srv.like(req.user.id, id);
  }

  @Delete(":id/like")
  unlike(@Param("id") id: string, @Req() req) {
    return this.srv.unlike(req.user.id, id);
  }

  @Get(":id/like/status")
  async isLiked(@Param("id") postId: string, @Req() req) {
    const currentUserId = req.user.id;
    const liked = await this.srv.liked(currentUserId, postId);
    return { liked };
  }
}
