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
  constructor(
    @InjectRepository(PostLike) private repo: Repository<PostLike>,
    @InjectRepository(Post) private posts: Repository<Post>
  ) {}

  async like(userId: string, postId: string) {
    const postExists = await this.posts.exist({ where: { id: postId } });
    if (!postExists) throw new NotFoundException("Post not found");

    const already = await this.repo.exist({
      where: { user: { id: userId }, post: { id: postId } },
    });
    if (already) throw new BadRequestException("Already liked");

    return this.repo.save({ user: { id: userId }, post: { id: postId } });
  }

  async unlike(userId: string, postId: string) {
    const res = await this.repo.delete({
      user: { id: userId },
      post: { id: postId },
    });
    if (!res.affected) throw new NotFoundException("Like does not exist");
  }

  liked(userId: string, postId: string) {
    return this.repo.exist({
      where: { user: { id: userId }, post: { id: postId } },
    });
  }
}
