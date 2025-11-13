import { Module } from "@nestjs/common";
import { RecommendationService } from "./recommendation.service";
import { RecommendationServiceController } from "./recommendation.controller";
import { RecommendationEvaluatorService } from "./recommendation-evaluator.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Tag } from "src/tags/entities/tag.entity";
import { User } from "src/user/entities/user.entity";
import { Post } from "src/post/entities/post.entity";
import { PostLike } from "src/post/entities/like.entity";
import { Comment } from "src/post/entities/comment.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Post, Tag, User, PostLike, Comment])],
  controllers: [RecommendationServiceController],
  providers: [RecommendationService, RecommendationEvaluatorService],
  exports: [RecommendationEvaluatorService], // optional if used elsewhere
})
export class RecommendationServiceModule {}
