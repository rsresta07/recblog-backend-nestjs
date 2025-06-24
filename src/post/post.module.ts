import { Module } from "@nestjs/common";
import { PostService } from "./post.service";
import { PostController } from "./post.controller";
import { PostTag } from "./entities/post-tag.entity";
import { User } from "../user/entities/user.entity";
import { Tag } from "../tags/entities/tag.entity";
import { Post } from "./entities/post.entity";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [TypeOrmModule.forFeature([Post, Tag, User, PostTag])],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
