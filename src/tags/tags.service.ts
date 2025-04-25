import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CreateTagDto } from "./dto/create-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Post } from "../post/entities/post.entity";
import { Repository } from "typeorm";
import { User } from "../user/entities/user.entity";
import { Tag } from "./entities/tag.entity";

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

  async create(createTagDto: CreateTagDto) {
    try {
      const newTag = this.tagRepository.create(createTagDto);
      await this.tagRepository.save(newTag);
      return;
    } catch (error) {
      throw new HttpException(
        `Error creating: ${error}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  findAll() {
    return `This action returns all tags`;
  }

  findOne(id: number) {
    return `This action returns a #${id} tag`;
  }

  update(id: number, updateTagDto: UpdateTagDto) {
    return `This action updates a #${id} tag`;
  }

  remove(id: number) {
    return `This action removes a #${id} tag`;
  }
}
