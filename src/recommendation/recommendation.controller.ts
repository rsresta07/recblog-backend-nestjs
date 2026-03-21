import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Query,
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

  @Get("/final-recommendations")
  @ApiBearerAuth()
  @HasRoles(RoleEnum.USER, RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  getFinalRecommendations(
    @Req() req,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    const userId = req.user?.id;
    return this.recommendationService.getFinalRecommendations(userId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
