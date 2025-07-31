import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CreateTagDto } from "./dto/create-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Tag } from "./entities/tag.entity";
import generateSlug from "../utils/helpers/generateSlug";

@Injectable()
export class TagsService {
  /**
   * Constructor for TagsService.
   *
   * Injects the required dependencies.
   *
   * @param tagRepository The Repository for Tag entity.
   */
  constructor(
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>
  ) {}

  /**
   * Creates a new tag in the database.
   *
   * @param createTagDto The data transfer object containing the tag information.
   * @returns A promise resolving to the newly created tag.
   * @throws HttpException if an error occurs during the creation process.
   */
  async create(createTagDto: CreateTagDto) {
    try {
      const { ...rest } = createTagDto;
      const newTag = this.tagRepository.create({
        ...rest,
        title: createTagDto.title,
        status: true,
        slug: generateSlug(rest.title),
      });

      await this.tagRepository.save(newTag);
    } catch (error) {
      throw new HttpException(
        `Error creating: ${error}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Retrieves a list of all tags.
   *
   * @returns A promise resolving to an array of all tags,
   *          with their titles in descending order.
   * @throws HttpException if an error occurs while fetching tags.
   */
  async findAll() {
    try {
      return await this.tagRepository
        .createQueryBuilder("tags")
        .orderBy("tags.title", "DESC")
        .getMany();
    } catch (error) {
      throw new HttpException(
        `error finding: ${error}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Retrieves a list of all active tags.
   *
   * @returns A promise resolving to an array of active tags,
   *          with their titles in ascending order.
   * @throws HttpException if an error occurs while fetching active tags.
   */
  async findActive() {
    try {
      return await this.tagRepository
        .createQueryBuilder("tags")
        .where("tags.status = :status", { status: true })
        .orderBy("tags.title", "ASC")
        .getMany();
    } catch (error) {
      throw new HttpException(
        `error finding: ${error}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Retrieves the details of a specific tag.
   *
   * @param slug The slug identifier of the tag.
   * @returns A promise resolving to the tag details.
   * @throws HttpException if the tag cannot be found.
   */
  async findOne(slug: string) {
    try {
      return await this.tagRepository
        .createQueryBuilder("tag")
        .where({ slug })
        .getOneOrFail();
    } catch (error) {
      throw new HttpException(
        `error finding: ${error}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Updates a tag.
   *
   * @param id The UUID of the tag to update.
   * @param updateTagDto The update data transfer object.
   * @returns A promise resolving to the updated tag.
   * @throws HttpException if the update fails.
   */
  async update(id: string, updateTagDto: UpdateTagDto) {
    try {
      const tag = await this.tagRepository.findOneByOrFail({ id });

      if (updateTagDto.title) {
        tag.title = updateTagDto.title;
        tag.slug = generateSlug(updateTagDto.title);
      }

      return await this.tagRepository.save(tag);
    } catch (error) {
      throw new HttpException(
        `Error updating tag: ${error}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Toggles the status of a tag.
   *
   * @param id The UUID of the tag to remove.
   * @returns A promise resolving to nothing.
   * @throws HttpException if the tag cannot be found.
   */
  async remove(id: string) {
    try {
      const tag = await this.tagRepository.findOneByOrFail({ id });
      tag.status = !tag.status;
      return await this.tagRepository.save(tag);
    } catch (error) {
      throw new HttpException(
        `Error toggling tag status: ${error}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
