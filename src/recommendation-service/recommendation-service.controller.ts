import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { RecommendationServiceService } from "./recommendation-service.service";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { HasRoles } from "src/core/decorators/role.decorator";
import { RoleEnum } from "src/utils/enum/role";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/role.guard";

@ApiTags("Recommendation Service")
@Controller("/recommendation-service")
export class RecommendationServiceController {
  constructor(
    private readonly recommendationServiceService: RecommendationServiceService
  ) {}

  //* Recommend posts based on user preferences (tags)
  @Get("/recommendations")
  @ApiBearerAuth()
  @HasRoles(RoleEnum.USER, RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  getRecommendedPosts(@Req() req) {
    const userId = req.user?.id;
    return this.recommendationServiceService.getRecommendedPostsForUser(userId);
  }

  // New endpoint: raw recommended posts for RecommendBlog
  @Get("/raw-recommendations")
  @ApiBearerAuth()
  @HasRoles(RoleEnum.USER, RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  getRawRecommendedPosts(@Req() req) {
    const userId = req.user?.id;
    return this.recommendationServiceService.getRawRecommendedPostsForUser(
      userId
    );
  }
}
