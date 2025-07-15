import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { RecommendationService } from "./recommendation.service";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { HasRoles } from "src/core/decorators/role.decorator";
import { RoleEnum } from "src/utils/enum/role";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/role.guard";

@ApiTags("Recommendation Service")
@Controller("/recommendation-service")
export class RecommendationServiceController {
  constructor(private readonly recommendationService: RecommendationService) {}

  //* Recommend posts based on user preferences (tags)
  @Get("/recommendations")
  @ApiBearerAuth()
  @HasRoles(RoleEnum.USER, RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  getRecommendedPosts(@Req() req) {
    const userId = req.user?.id;
    return this.recommendationService.getRecommendedPostsForUser(userId);
  }

  @Get("/raw-recommendations")
  @ApiBearerAuth()
  @HasRoles(RoleEnum.USER, RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  getRawRecommendedPosts(@Req() req) {
    const userId = req.user?.id;
    return this.recommendationService.getRawRecommendedPostsForUser(userId);
  }

  @Get("/user-based-recommendations")
  @ApiBearerAuth()
  @HasRoles(RoleEnum.USER, RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  getUserBasedRecommendations(@Req() req) {
    const userId = req.user?.id;
    return this.recommendationService.getUserBasedRecommendations(userId);
  }

  @Get("/interaction-based-recommendations")
  @ApiBearerAuth()
  @HasRoles(RoleEnum.USER, RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  getInteractionBasedRecommendations(@Req() req) {
    const userId = req.user?.id;
    return this.recommendationService.getCollaborativeInteractionRecommendations(
      userId
    );
  }

  @Get("/final-recommendations")
  @ApiBearerAuth()
  @HasRoles(RoleEnum.USER, RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  getFinalRecommendations(@Req() req) {
    const userId = req.user?.id;
    return this.recommendationService.getFinalRecommendations(userId);
  }
}
