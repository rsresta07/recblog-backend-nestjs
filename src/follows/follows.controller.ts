import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { FollowsService } from "./follows.service";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { HasRoles } from "src/core/decorators/role.decorator";
import { RoleEnum } from "src/utils/enum/role";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/role.guard";

@ApiTags("Follows")
@ApiBearerAuth()
@HasRoles(RoleEnum.USER)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("/follows")
export class FollowsController {
  constructor(private srv: FollowsService) {}

  @Post("/:id")
  async follow(@Param("id") id: string, @Req() req) {
    await this.srv.follow(req.user.id, id);
    return { message: "followed" };
  }

  @Delete("/:id")
  async unfollow(@Param("id") id: string, @Req() req) {
    await this.srv.unfollow(req.user.id, id);
    return { message: "unfollowed" };
  }

  @Get(":id/status")
  async isFollowing(@Param("id") targetUserId: string, @Req() req) {
    const currentUserId = req.user.id;
    const following = await this.srv.isFollowing(currentUserId, targetUserId);
    return { following };
  }
}
