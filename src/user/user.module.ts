import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BcryptService } from "src/auth/bcryptjs/bcrypt.service";
import { Pagination } from "nestjs-typeorm-paginate";
import { User } from "./entities/user.entity";
import { Post } from "../post/entities/post.entity";
import { Tag } from "../tags/entities/tag.entity";
import { PostTag } from "../post/entities/post-tag.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Post, Tag, User, PostTag])],
  controllers: [UserController],
  providers: [UserService, BcryptService, Pagination],
})
export class UserModule {}
