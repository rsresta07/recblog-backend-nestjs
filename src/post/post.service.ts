import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CreatePostDto } from "./dto/create-post.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { Post } from "./entities/post.entity";
import { InjectRepository, TypeOrmModule } from "@nestjs/typeorm";
import { In, Repository, TypeORMError } from "typeorm";
import { User } from "../user/entities/user.entity";
import { Tag } from "../tags/entities/tag.entity";
import generateSlug from "../utils/helpers/generateSlug";

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>
  ) {}

  //* Creating a post
  async create(userSlug: string, createPostDto: CreatePostDto) {
    try {
      const user = await this.userRepository.findOneBy({ username: userSlug });
      if (!user) {
        throw new HttpException(
          `User with slug '${userSlug}' not found`,
          HttpStatus.NOT_FOUND
        );
      }

      const { tagIds, description, ...rest } = createPostDto;
      const post = this.postRepository.create({
        ...rest,
        status: true,
        content: description,
        slug: generateSlug(createPostDto.title),
      });

      if (tagIds?.length) {
        post.tags = await this.tagRepository.findBy({
          id: In(tagIds),
        });
      }

      post.user = user;

      return this.postRepository.save(post);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `error creating: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  private mapPostToResponse(post: Post) {
    return {
      createdAt: post.createdAt,
      id: post.id,
      title: post.title,
      content: post.content,
      image: post.image,
      slug: post.slug,
      status: post.status,
      // pick tags explicitly
      tags: post.tags.map((tag) => ({
        id: tag.id,
        title: tag.title,
        slug: tag.slug,
        status: tag.status,
      })),
      // pick user fields explicitly
      user: {
        id: post.user.id,
        fullName: post.user.fullName,
        slug: post.user.username,
      },
    };
  }

  //* Function to display all posts
  async findAll() {
    try {
      const posts = await this.postRepository
        .createQueryBuilder("posts")
        .leftJoinAndSelect("posts.user", "user")
        .leftJoinAndSelect("posts.tags", "tag")
        .orderBy("posts.createdAt", "DESC")
        .getMany();

      return posts.map(this.mapPostToResponse);
    } catch (error) {
      throw new HttpException(
        `error finding: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  //* Function to display active post
  async findActive() {
    try {
      const posts = await this.postRepository
        .createQueryBuilder("posts")
        .where("posts.status = :status", { status: true })
        .leftJoinAndSelect("posts.user", "user")
        .leftJoinAndSelect("posts.tags", "tag")
        .orderBy("posts.createdAt", "DESC")
        .getMany();

      return posts.map(this.mapPostToResponse);
    } catch (error) {
      throw new HttpException(
        `error finding: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async findOne(slug: string) {
    try {
      return await this.postRepository
        .createQueryBuilder("post")
        .where({ slug })
        .leftJoin("post.user", "user")
        .leftJoinAndSelect("post.tags", "tag")
        .addSelect(["user.id", "user.email", "user.fullName", "user.username"])
        .getOneOrFail();
    } catch (error) {
      if (
        error instanceof TypeORMError &&
        error.name === "EntityNotFoundError"
      ) {
        throw new HttpException(
          `Post with slug '${slug}' not found`,
          HttpStatus.NOT_FOUND
        );
      }
      throw new HttpException(
        `error finding: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    try {
      const post = await this.postRepository.findOne({
        where: { id },
        relations: ["tags"], // Load existing tags to manage updates
      });

      if (!post) {
        throw new HttpException(
          `Post with ID '${id}' not found`,
          HttpStatus.NOT_FOUND
        );
      }

      // Update basic fields if provided in DTO
      if (updatePostDto.title !== undefined) {
        post.title = updatePostDto.title;
        post.slug = generateSlug(updatePostDto.title); // Re-generate slug if title changes
      }
      if (updatePostDto.description !== undefined) {
        post.content = updatePostDto.description;
      }
      if (updatePostDto.image !== undefined) {
        post.image = updatePostDto.image;
      }

      // Update tags if provided in DTO
      if (updatePostDto.tagIds !== undefined) {
        post.tags =
          updatePostDto.tagIds.length > 0
            ? await this.tagRepository.findBy({ id: In(updatePostDto.tagIds) })
            : [];
      }

      await this.postRepository.save(post);

      // refetch post with relations
      const fullPost = await this.postRepository.findOneOrFail({
        where: { id: post.id },
        relations: ["user", "tags"],
      });

      return this.mapPostToResponse(fullPost);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Error updating post: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.postRepository.delete(id);

    if (result.affected === 0) {
      throw new HttpException(
        `Post with ID '${id}' not found`,
        HttpStatus.NOT_FOUND
      );
    }
  }

  // search post
  async searchPosts(query: string): Promise<any[]> {
    if (!query || typeof query !== "string") {
      throw new HttpException(
        "Missing or invalid query parameter `q`",
        HttpStatus.BAD_REQUEST
      );
    }

    console.log("Search query:", query);

    try {
      return await this.postRepository.query(
        `
      SELECT
        p.title,
        p.content,
        p.slug,
        p.image
      FROM posts p
      WHERE search_vector @@ plainto_tsquery('english', $1)
      ORDER BY ts_rank(search_vector, plainto_tsquery('english', $1)) DESC
      `,
        [query]
      );
    } catch (error) {
      throw new HttpException(
        `Search failed: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
