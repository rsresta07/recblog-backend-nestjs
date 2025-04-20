import { Module } from "@nestjs/common";
import { TagsService } from "./tags.service";
import { TagsController } from "./tags.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Post } from "../post/entities/post.entity";
import { Tag } from "./entities/tag.entity";
import { User } from "../user/entities/user.entity";
import { PostTag } from "../post/entities/post-tag.entity";
import { PostUser } from "../post/entities/post-user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Post, Tag, User, PostTag, PostUser])],
  controllers: [TagsController],
  providers: [TagsService],
})
export class TagsModule {}
