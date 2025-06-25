import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Repository } from "typeorm";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>
  ) {}

  // helper functions

  async isAuthenticatedUser({ email }: any) {
    try {
      return await this.userRepo
        .createQueryBuilder("user")
        .where("LOWER(TRIM(user.email)) = :email", {
          email: email?.toLowerCase()?.trim(),
        })
        .getOne();
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async findAll() {
    return this.userRepo.find();
  }

  async findOne(slug: string) {
    return this.userRepo
      .createQueryBuilder("user")
      .select([
        "user.id",
        "user.email",
        "user.username",
        "user.fullName",
        "user.location",
        "user.contact",
        "user.role",
        "user.status",
      ])
      .leftJoin("user.posts", "posts")
      .addSelect([
        "posts.id",
        "posts.title",
        "posts.image",
        "posts.slug",
        "posts.status",
      ])
      .leftJoin("posts.tags", "tags")
      .addSelect(["tags.id", "tags.title"])
      .where("user.username = :username", { username: slug })
      .orderBy("posts.createdAt", "DESC")
      .getOneOrFail();
  }

  async findById(id: string) {
    return this.userRepo.findOne({
      where: { id },
      select: ["id", "username", "fullName", "email", "role", "status"],
    });
  }
}
