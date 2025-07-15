import { Module } from "@nestjs/common";
import { RecommendationService } from "./recommendation.service";
import { RecommendationServiceController } from "./recommendation.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Tag } from "src/tags/entities/tag.entity";
import { User } from "src/user/entities/user.entity";
import { Post } from "src/post/entities/post.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Post, Tag, User])],

  controllers: [RecommendationServiceController],
  providers: [RecommendationService],
})
export class RecommendationServiceModule {}
