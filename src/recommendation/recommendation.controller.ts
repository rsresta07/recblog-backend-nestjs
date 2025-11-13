import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  NotFoundException,
  Param,
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
import { RecommendationEvaluatorService } from "./recommendation-evaluator.service";

@ApiTags("Recommendation Service")
@Controller("/recommendation-service")
export class RecommendationServiceController {
  constructor(
    private readonly recommendationService: RecommendationService,
    private readonly evaluator: RecommendationEvaluatorService
  ) {}

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

  @Get("/post-context-recommendations/:postId")
  @ApiBearerAuth()
  @HasRoles(RoleEnum.USER, RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getPostContextRecommendations(
    @Param("postId") postId: string,
    @Req() req
  ) {
    const userId = req.user?.id;

    const post = await this.recommendationService["postRepository"].findOne({
      where: { id: postId },
      relations: ["tags"],
    });

    if (!post) throw new NotFoundException("Post not found");

    const tagIds = post.tags.map((t) => t.id);
    return this.recommendationService.getRecommendationsBasedOnCurrentPostTags(
      userId,
      tagIds,
      postId
    );
  }

  @Get("/evaluate")
  async evaluateRecommendations() {
    return this.evaluator.evaluate({ ks: [5, 10, 20], minInteractions: 1 });
  }
}
