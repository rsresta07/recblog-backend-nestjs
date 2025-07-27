import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { CommentDto } from "./dto/comment.dto";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/role.guard";
import { HasRoles } from "src/core/decorators/role.decorator";
import { RoleEnum } from "src/utils/enum/role";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

@ApiTags("Comments")
@Controller("posts")
export class CommentsController {
  constructor(private srv: CommentsService) {}

  @Post(":postId/comments")
  @ApiBearerAuth()
  @HasRoles(RoleEnum.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  /**
   * Adds a new comment to the given post.
   *
   * @param postId The UUID of the post to add the comment to.
   * @param dto The comment to add.
   * @param req The current request object.
   * @returns The newly added comment.
   */
  add(
    @Param("postId") postId: string,
    @Body() dto: CommentDto,
    @Req() req: any
  ) {
    return this.srv.add(req.user.id, postId, dto);
  }

  @Get(":postId/comments")
  /**
   * Fetches all comments for the given post.
   *
   * @param postId The UUID of the post to fetch comments for.
   * @returns The list of comments for the given post.
   */
  list(@Param("postId") postId: string) {
    return this.srv.findByPost(postId);
  }
}
