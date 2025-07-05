import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Comment } from "src/post/entities/comment.entity";
import { Post } from "src/post/entities/post.entity";
import { Repository } from "typeorm";
import { CommentDto } from "./dto/comment.dto";

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment) private repo: Repository<Comment>,
    @InjectRepository(Post) private posts: Repository<Post>
  ) {}

  async add(userId: string, postId: string, dto: CommentDto) {
    const post = await this.posts.findOneBy({ id: postId });
    if (!post) throw new NotFoundException("Post not found");

    return this.repo.save({
      content: dto.content,
      post,
      user: { id: userId },
    });
  }

  findByPost(postId: string) {
    return this.repo.find({
      where: { post: { id: postId } },
      relations: { user: true },
      order: { createdAt: "ASC" },
    });
  }
}
