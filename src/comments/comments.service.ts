import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Comment } from "src/post/entities/comment.entity";
import { Post } from "src/post/entities/post.entity";
import { Repository } from "typeorm";
import { CommentDto } from "./dto/comment.dto";

@Injectable()
export class CommentsService {
  /**
   * The constructor for the CommentsService class.
   *
   * @param repo The Comment repository.
   * @param posts The Post repository.
   */
  constructor(
    @InjectRepository(Comment) private repo: Repository<Comment>,
    @InjectRepository(Post) private posts: Repository<Post>
  ) {}

  /**
   * Adds a new comment to a specified post.
   *
   * @param userId The ID of the user adding the comment.
   * @param postId The ID of the post to which the comment is being added.
   * @param dto The data transfer object containing the comment content.
   * @returns The newly created comment.
   * @throws NotFoundException if the post does not exist.
   */
  async add(userId: string, postId: string, dto: CommentDto) {
    const post = await this.posts.findOneBy({ id: postId });
    if (!post) throw new NotFoundException("Post not found");

    return this.repo.save({
      content: dto.content,
      post,
      user: { id: userId },
    });
  }

  /**
   * Fetches all comments associated with a specific post.
   *
   * @param postId The ID of the post for which comments are being retrieved.
   * @returns A promise resolving to an array of comments sorted by creation date in ascending order.
   */
  findByPost(postId: string) {
    return this.repo.find({
      where: { post: { id: postId } },
      relations: { user: true },
      order: { createdAt: "ASC" },
    });
  }
}
