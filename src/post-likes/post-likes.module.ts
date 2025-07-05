import { Module } from "@nestjs/common";
import { PostLikesService } from "./post-likes.service";
import { PostLikesController } from "./post-likes.controller";
import { PostLike } from "src/post/entities/like.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Post } from "src/post/entities/post.entity";

@Module({
  imports: [TypeOrmModule.forFeature([PostLike, Post])],
  controllers: [PostLikesController],
  providers: [PostLikesService],
})
export class PostLikesModule {}
