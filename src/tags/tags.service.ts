import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CreateTagDto } from "./dto/create-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Post } from "../post/entities/post.entity";
import { In, Repository } from "typeorm";
import { User } from "../user/entities/user.entity";
import { Tag } from "./entities/tag.entity";
import generateSlug from "../utils/helpers/generateSlug";

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>
  ) {}

  //* Creating a Tag
  async create(createTagDto: CreateTagDto) {
    try {
      const { ...rest } = createTagDto;
      const newTag = this.tagRepository.create({
        ...rest,
        title: createTagDto.title,
        slug: generateSlug(rest.title),
      });

      newTag.users = await this.userRepository.findBy({
        id: In(createTagDto.userIds),
      });

      await this.tagRepository.save(newTag);
    } catch (error) {
      throw new HttpException(
        `Error creating: ${error}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  //* Function to display all tags
  async findAll() {
    try {
      return await this.tagRepository
        .createQueryBuilder("tags")
        .leftJoin("tags.users", "users")
        // .leftJoinAndSelect("tags.posts", "post")
        .orderBy("tags.title", "DESC")
        .addSelect(["users.id", "users.email", "users.fullName"])
        .getMany();
    } catch (error) {
      throw new HttpException(
        `error finding: ${error}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  //* Function to display active tags
  async findActive() {
    try {
      return await this.tagRepository
        .createQueryBuilder("tags")
        .where("tags.status = :status", { status: true })
        .leftJoin("tags.users", "users")
        // .leftJoinAndSelect("tags.posts", "post")
        .addSelect(["users.id", "users.email", "users.fullName"])
        .orderBy("tags.title", "DESC")
        .getMany();
    } catch (error) {
      throw new HttpException(
        `error finding: ${error}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async findOne(slug: string) {
    try {
      return await this.tagRepository
        .createQueryBuilder("tag")
        .where({ slug })
        .leftJoin("tag.users", "users")
        .addSelect(["users.id", "users.email", "users.fullName"])
        // .leftJoinAndSelect("tag.posts", "post")
        .getOneOrFail();
    } catch (error) {
      throw new HttpException(
        `error finding: ${error}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  update(id: string, updateTagDto: UpdateTagDto) {
    return `This action updates a #${id} tag`;
  }

  remove(id: string) {
    return `This action removes a #${id} tag`;
  }
}
