import { Module } from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { CommentsController } from "./comments.controller";
import { Comment } from "src/post/entities/comment.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Post } from "src/post/entities/post.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Post])],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
