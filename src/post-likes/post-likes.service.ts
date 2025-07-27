import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PostLike } from "src/post/entities/like.entity";
import { Post } from "src/post/entities/post.entity";
import { Repository } from "typeorm";

@Injectable()
export class PostLikesService {
  /**
   * The constructor for the PostLikesService class.
   *
   * Injects the required repositories.
   *
   * @param repo The Repository for PostLike entity.
   * @param posts The Repository for Post entity.
   */
  constructor(
    @InjectRepository(PostLike) private repo: Repository<PostLike>,
    @InjectRepository(Post) private posts: Repository<Post>
  ) {}

  /**
   * Likes a post.
   *
   * @param userId The UUID of the user liking the post.
   * @param postId The UUID of the post being liked.
   *
   * @throws NotFoundException Thrown if the post does not exist.
   * @throws BadRequestException Thrown if the user is already liking the post.
   *
   * @returns The newly created like entity.
   */
  async like(userId: string, postId: string) {
    const postExists = await this.posts.exist({ where: { id: postId } });
    if (!postExists) throw new NotFoundException("Post not found");

    const already = await this.repo.exist({
      where: { user: { id: userId }, post: { id: postId } },
    });
    if (already) throw new BadRequestException("Already liked");

    return this.repo.save({ user: { id: userId }, post: { id: postId } });
  }

  /**
   * Removes a like from a post.
   *
   * @param userId The UUID of the user removing the like.
   * @param postId The UUID of the post being unlike.
   *
   * @throws NotFoundException Thrown if the like does not exist.
   */
  async unlike(userId: string, postId: string) {
    const res = await this.repo.delete({
      user: { id: userId },
      post: { id: postId },
    });
    if (!res.affected) throw new NotFoundException("Like does not exist");
  }

  /**
   * Checks if a user has liked a specific post.
   *
   * @param userId The UUID of the user.
   * @param postId The UUID of the post.
   * @returns A promise that resolves to a boolean indicating if the user has liked the post.
   */
  liked(userId: string, postId: string) {
    return this.repo.exist({
      where: { user: { id: userId }, post: { id: postId } },
    });
  }
}
