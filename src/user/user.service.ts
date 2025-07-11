import { ForbiddenException, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Repository } from "typeorm";
import { Tag } from "src/tags/entities/tag.entity";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Tag) private readonly tagRepo: Repository<Tag>
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
        "user.position",
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
      select: [
        "id",
        "username",
        "fullName",
        "email",
        "position",
        "role",
        "status",
      ],
    });
  }

  async updateMe(id: string, dto) {
    await this.userRepo.update({ id }, dto);
    return this.findById(id); // return fresh copy
  }

  async updateBySlug(slug: string, dto) {
    await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set(dto)
      .where("username = :slug", { slug })
      .execute();
    return this.findOne(slug);
  }

  async getPreferences(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ["preferences"],
    });
    return user.preferences;
  }

  async updatePreferences(id: string, dto: { tagIds: string[] }) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ["preferences"],
    });

    const currentTagIds = user.preferences.map((tag) => tag.id);
    const newTagIds = dto.tagIds;

    // Check if newTagIds is a subset of currentTagIds
    const isSubset = newTagIds.every((id) => currentTagIds.includes(id));

    if (!isSubset) {
      throw new ForbiddenException(
        "You can only remove existing preferences, not add new ones."
      );
    }

    // Load tags to be kept
    const tagsToKeep = await this.tagRepo.findByIds(newTagIds);
    user.preferences = tagsToKeep;
    await this.userRepo.save(user);

    return user.preferences;
  }
}
