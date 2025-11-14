import { HttpException, HttpStatus, Injectable, Param } from "@nestjs/common";
import { CreatePostDto } from "./dto/create-post.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { Post } from "./entities/post.entity";
import { InjectRepository, TypeOrmModule } from "@nestjs/typeorm";
import { ILike, In, Repository, TypeORMError } from "typeorm";
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

  private mapPostToResponse(post: Post & { likes?: any[]; comments?: any[] }) {
    return {
      createdAt: post.createdAt,
      id: post.id,
      title: post.title,
      content: post.content,
      image: post.image,
      slug: post.slug,
      status: post.status,
      viewCount: post.viewCount || 0,
      likeCount: post.likes?.length || 0,
      commentCount: post.comments?.length || 0,
      tags:
        post.tags?.map((tag) => ({
          id: tag.id,
          title: tag.title,
          slug: tag.slug,
          status: tag.status,
        })) || [],
      user: {
        id: post.user.id,
        fullName: post.user.fullName,
        slug: post.user.username,
      },
    };
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    // Get posts with counts in a single query
    const query = this.postRepository
      .createQueryBuilder("post")
      .leftJoinAndSelect("post.user", "user")
      .leftJoinAndSelect("post.tags", "tags")
      .loadRelationCountAndMap("post.likeCount", "post.likes")
      .loadRelationCountAndMap("post.commentCount", "post.comments")
      .orderBy("post.createdAt", "DESC")
      .skip(skip)
      .take(limit);

    const [posts, total] = await query.getManyAndCount();

    return {
      data: posts.map(this.mapPostToResponseOptimized),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByUser(userId: string, page = 1, limit = 10) {
    const [posts, total] = await this.postRepository.findAndCount({
      where: { user: { id: userId } },
      relations: ["tags", "likes", "comments"],
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: posts.map(this.mapPostToResponse),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findActive(page = 1, limit = 10, search = "") {
    const skip = (page - 1) * limit;

    const query = this.postRepository
      .createQueryBuilder("post")
      .leftJoinAndSelect("post.user", "user")
      .leftJoinAndSelect("post.tags", "tags")
      .loadRelationCountAndMap("post.likeCount", "post.likes")
      .loadRelationCountAndMap("post.commentCount", "post.comments")
      .where("post.status = :status", { status: true })
      .orderBy("post.createdAt", "DESC")
      .skip(skip)
      .take(limit);

    if (search) {
      query.andWhere("post.title ILIKE :search", { search: `%${search}%` });
    }

    const [posts, total] = await query.getManyAndCount();

    return {
      data: posts.map(this.mapPostToResponseOptimized),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  private mapPostToResponseOptimized(post: any) {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      image: post.image,
      slug: post.slug,
      status: post.status,
      createdAt: post.createdAt,
      viewCount: post.viewCount || 0,
      likeCount: post.likeCount || 0,
      commentCount: post.commentCount || 0,
      tags:
        post.tags?.map((tag) => ({
          id: tag.id,
          title: tag.title,
          slug: tag.slug,
          status: tag.status,
        })) || [],
      user: {
        id: post.user?.id,
        fullName: post.user?.fullName,
        slug: post.user?.slug,
      },
    };
  }

  /**
   * Retrieves the details of a specific post.
   *
   * @param slug The slug identifier of the post.
   * @param userId The ID of the user viewing the post. If provided, the
   *               user's tag preferences will be updated to include the tags
   *               associated with the post.
   * @returns A promise resolving to the post details.
   * @throws HttpException if the post cannot be found.
   */
  async findOne(slug: string, userId?: string) {
    try {
      const post = await this.postRepository.findOneOrFail({
        where: { slug },
        relations: ["user", "tags", "likes", "comments"], // 👈
      });

      // Increment view count
      post.viewCount = (post.viewCount || 0) + 1;
      await this.postRepository.save(post);

      if (userId) {
        await this.updateUserPreferencesOnView(userId, post.tags);
      }

      return this.mapPostToResponse(post);
    } catch (error) {
      throw new HttpException(
        `Error finding post: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async getPostById(id: string) {
    try {
      const post = await this.postRepository.findOne({
        where: { id },
        relations: ["user", "tags"],
      });
      if (!post) {
        throw new HttpException("Post not found", HttpStatus.NOT_FOUND);
      }
      return this.mapPostToResponse(post);
    } catch (error) {
      throw new HttpException(
        `Error finding post: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Updates a user's tag preferences based on the tags of a viewed post.
   *
   * @param userId - The ID of the user whose preferences are to be updated.
   * @param viewedTags - An array of Tag objects that the user has viewed.
   *
   * This method checks if any of the viewed tags are not currently in the user's
   * preferences and adds them. If the user or viewed tags are not found, the method
   * exits early. Debugging lines log the tag IDs being processed and the user's
   * updated preferences.
   */
  private async updateUserPreferencesOnView(userId: string, viewedTags: Tag[]) {
    if (!viewedTags?.length) return;

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["preferences"],
    });

    if (!user) return;

    const viewedTagIds = viewedTags.map((tag) => tag.id).filter(Boolean);

    // Debugging line
    console.log("Viewed tag IDs:", viewedTagIds);

    const existingTagIds = user.preferences.map((tag) => tag.id);

    // Find tags that are not already part of user's preferences
    const newTagIds = viewedTagIds.filter((id) => !existingTagIds.includes(id));

    // Debugging line
    console.log("New tag IDs to be added:", newTagIds);

    if (newTagIds.length > 0) {
      await this.userRepository
        .createQueryBuilder()
        .relation(User, "preferences")
        .of(user)
        .add(newTagIds);

      // Optional: Re-fetch updated user to confirm
      const updatedUser = await this.userRepository.findOne({
        where: { id: userId },
        relations: ["preferences"],
      });

      console.log(
        "Updated preferences:",
        updatedUser?.preferences.map((p) => p.id)
      );
    }
  }

  /**
   * Updates a post.
   *
   * @param id The UUID of the post to update.
   * @param updatePostDto The update data transfer object.
   * @returns The updated post with user and tag information included.
   * @throws HttpException if the post does not exist or if there is an error updating the post.
   */
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
    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) {
      throw new HttpException(
        `Post with ID '${id}' not found`,
        HttpStatus.NOT_FOUND
      );
    }
    post.status = !post.status; // toggle boolean status

    await this.postRepository.save(post);
  }

  async adminUpdate(id: string, updatePostDto: UpdatePostDto) {
    try {
      const post = await this.postRepository.findOne({
        where: { id },
        relations: ["tags", "user"],
      });

      if (!post) {
        throw new HttpException(
          `Post with ID '${id}' not found`,
          HttpStatus.NOT_FOUND
        );
      }

      // Update fields same as user update
      if (updatePostDto.title !== undefined) {
        post.title = updatePostDto.title;
        post.slug = generateSlug(updatePostDto.title);
      }
      if (updatePostDto.description !== undefined) {
        post.content = updatePostDto.description;
      }
      if (updatePostDto.image !== undefined) {
        post.image = updatePostDto.image;
      }
      if (updatePostDto.tagIds !== undefined) {
        post.tags =
          updatePostDto.tagIds.length > 0
            ? await this.tagRepository.findBy({ id: In(updatePostDto.tagIds) })
            : [];
      }

      await this.postRepository.save(post);

      const fullPost = await this.postRepository.findOneOrFail({
        where: { id: post.id },
        relations: ["user", "tags"],
      });

      return this.mapPostToResponse(fullPost);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Error updating post by admin: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Performs a full-text search on all posts.
   *
   * @param query The search query string.
   * @returns An array of posts with title, content, slug, and image fields.
   * @throws HttpException if the query parameter is missing or invalid.
   */
  async searchPosts(query: string): Promise<any[]> {
    if (!query || typeof query !== "string") {
      throw new HttpException(
        "Missing or invalid query parameter `q`",
        HttpStatus.BAD_REQUEST
      );
    }

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
