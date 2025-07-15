import { Module, OnModuleInit } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppDataSource } from "./config/database.config";
import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./user/user.module";
import { SeedsService } from "./database/seeds/seeds.service";
import { User } from "./user/entities/user.entity";
import { UserService } from "./user/user.service";
import { BcryptService } from "./auth/bcryptjs/bcrypt.service";
import { Pagination } from "nestjs-typeorm-paginate";
import { HealthCheckModule } from "./health-check/health-check.module";
import { PostModule } from "./post/post.module";
import { TagsModule } from "./tags/tags.module";
import { PostLikesModule } from "./post-likes/post-likes.module";
import { FollowsModule } from "./follows/follows.module";
import { CommentsModule } from "./comments/comments.module";
import { Post } from "./post/entities/post.entity";
import { PostLike } from "./post/entities/like.entity";
import { Follow } from "./user/entities/follow.entity";
import { Comment } from "./post/entities/comment.entity";
import { Tag } from "./tags/entities/tag.entity";
import { RecommendationServiceModule } from "./recommendation/recommendation.module";

@Module({
  imports: [
    TypeOrmModule.forRoot(AppDataSource.options),

    TypeOrmModule.forFeature([Tag, Follow, PostLike, Comment, User]),
    AuthModule,
    UserModule,
    HealthCheckModule,
    PostModule,
    TagsModule,
    PostLikesModule,
    FollowsModule,
    CommentsModule,
    RecommendationServiceModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedsService, UserService, BcryptService, Pagination],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly seedsService: SeedsService) {}

  async onModuleInit() {}
}
