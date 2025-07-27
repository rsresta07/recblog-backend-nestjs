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
  /**
   * Like a post given its ID.
   *
   * @param id The ID of the post to like.
   * @param req The current request object.
   * @returns A message indicating success.
   */
  like(@Param("id") id: string, @Req() req) {
    return this.srv.like(req.user.id, id);
  }

  @Delete(":id/like")
  /**
   * Unlike a post given its ID.
   *
   * @param id The ID of the post to unlike.
   * @param req The current request object.
   * @returns A message indicating success.
   */
  unlike(@Param("id") id: string, @Req() req) {
    return this.srv.unlike(req.user.id, id);
  }

  @Get(":id/like/status")
  /**
   * Checks if the current user has liked a post given its ID.
   *
   * @param id The ID of the post to check if the current user has liked.
   * @param req The current request object.
   * @returns An object with a single key, `liked`, which is a boolean indicating
   * if the current user has liked the post.
   */
  async isLiked(@Param("id") postId: string, @Req() req) {
    const currentUserId = req.user.id;
    const liked = await this.srv.liked(currentUserId, postId);
    return { liked };
  }
}
