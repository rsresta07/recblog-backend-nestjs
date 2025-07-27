import { ForbiddenException, HttpException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Repository } from "typeorm";
import { Tag } from "src/tags/entities/tag.entity";

@Injectable()
export class UserService {
  /**
   * Constructor for the UserService.
   *
   * Injects the required dependencies.
   *
   * @param userRepo The Repository for User entity.
   * @param tagRepo The Repository for Tag entity.
   */
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Tag) private readonly tagRepo: Repository<Tag>
  ) {}

  /**
   * Checks if a user with the given email is authenticated.
   *
   * @param email - An object containing the email of the user.
   * @returns A promise that resolves to the user object if found, otherwise null.
   * @throws {HttpException} If an error occurs during the query.
   */
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

  /**
   * Retrieves all the users.
   *
   * @returns A promise that resolves to an array of user objects.
   * @throws {HttpException} If an error occurs during the query.
   */
  async findAll() {
    return this.userRepo.find();
  }

  /**
   * Retrieves a user by their username.
   *
   * @param slug The username of the user.
   * @returns A promise that resolves to the user object with their posts and tags.
   * @throws {HttpException} If the user cannot be found.
   */
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

  /**
   * Retrieves a user by their id.
   *
   * @param id The id of the user.
   * @returns A promise that resolves to the user object with only the following fields:
   *          - id
   *          - username
   *          - fullName
   *          - email
   *          - position
   *          - role
   *          - status
   * @throws {HttpException} If the user cannot be found.
   */
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

  /**
   * Updates the profile details of a user by their id.
   *
   * @param id The id of the user to update.
   * @param dto The update data transfer object containing the new profile details.
   * @returns A promise that resolves to the user object with only the following fields:
   *          - id
   *          - username
   *          - fullName
   *          - email
   *          - position
   *          - role
   *          - status
   * @throws {HttpException} If the user cannot be found.
   */
  async updateMe(id: string, dto) {
    await this.userRepo.update({ id }, dto);
    return this.findById(id); // return fresh copy
  }

  /**
   * Updates the profile details of a user by their username.
   *
   * @param slug The username of the user to update.
   * @param dto The update data transfer object containing the new profile details.
   * @returns A promise that resolves to the user object with only the following fields:
   *          - id
   *          - username
   *          - fullName
   *          - email
   *          - position
   *          - role
   *          - status
   * @throws {HttpException} If the user cannot be found.
   */
  async updateBySlug(slug: string, dto) {
    await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set(dto)
      .where("username = :slug", { slug })
      .execute();
    return this.findOne(slug);
  }

  /**
   * Retrieves the tag preferences of a user.
   *
   * @param id The ID of the user whose preferences are to be retrieved.
   * @returns A promise that resolves to an array of Tag objects representing the user's preferences.
   */
  async getPreferences(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ["preferences"],
    });
    return user.preferences;
  }

  /**
   * Updates the tag preferences of a user.
   *
   * @param id The ID of the user whose preferences are to be updated.
   * @param dto The update data transfer object containing the IDs of the tags to be kept.
   * @returns A promise that resolves to an array of Tag objects representing the user's updated preferences.
   * @throws {ForbiddenException} If the user is trying to add a new preference that does not already exist.
   */
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
