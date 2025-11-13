import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "src/user/entities/user.entity";
import { Post } from "src/post/entities/post.entity";
import { Tag } from "src/tags/entities/tag.entity";
import { PostLike } from "src/post/entities/like.entity";
import { Comment } from "src/post/entities/comment.entity";
import { BcryptService } from "src/auth/bcryptjs/bcrypt.service";
import { RoleEnum, StatusEnum } from "src/utils/enum/role";

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Post) private readonly postRepo: Repository<Post>,
    @InjectRepository(Tag) private readonly tagRepo: Repository<Tag>,
    @InjectRepository(PostLike) private readonly likeRepo: Repository<PostLike>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    private readonly bcryptService: BcryptService
  ) {}

  async run() {
    const tags = await this.seedTags();
    const users = await this.seedUsers(tags);
    const posts = await this.seedPosts(users, tags);
    await this.seedInteractions(users, posts);
  }

  private async seedTags(): Promise<Tag[]> {
    const tagTitles = ["Tech", "Health", "Travel", "Food", "Science"];
    const savedTags: Tag[] = [];

    for (const title of tagTitles) {
      const slug = title.toLowerCase();
      let tag = await this.tagRepo.findOne({ where: { slug } });
      if (!tag) {
        tag = this.tagRepo.create({ title, slug });
        tag = await this.tagRepo.save(tag);
      }
      savedTags.push(tag);
    }

    return savedTags;
  }

  private async seedUsers(tags: Tag[]): Promise<User[]> {
    const usersData = Array.from({ length: 10 }).map((_, i) => ({
      fullName: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      username: `user${i + 1}`,
      password: "@Password123",
      role: RoleEnum.USER,
      status: StatusEnum.APPROVED,
      preferences: [tags[i % tags.length]],
    }));

    const savedUsers: User[] = [];
    for (const u of usersData) {
      let user = await this.userRepo.findOne({
        where: { email: u.email },
        relations: ["preferences"],
      });
      if (!user) {
        u.password = await this.bcryptService.hashPassword(u.password);
        user = this.userRepo.create(u);
        user = await this.userRepo.save(user);
      }
      savedUsers.push(user);
    }

    return savedUsers;
  }

  private async seedPosts(users: User[], tags: Tag[]): Promise<Post[]> {
    const postsData = Array.from({ length: 20 }).map((_, i) => ({
      title: `Post ${i + 1}`,
      content: `Content for post ${i + 1}`,
      slug: `post-${i + 1}`,
      image: `image${i + 1}.jpg`,
      status: true,
      user: users[i % users.length],
      tags: [
        tags[i % tags.length],
        tags[i % tags.length],
        tags[i % tags.length],
      ],
    }));

    const savedPosts: Post[] = [];
    for (const p of postsData) {
      let post = await this.postRepo.findOne({
        where: { slug: p.slug },
        relations: ["tags", "user"],
      });
      if (!post) {
        post = this.postRepo.create(p);
        post = await this.postRepo.save(post);
      }
      savedPosts.push(post);
    }

    return savedPosts;
  }

  private async seedInteractions(users: User[], posts: Post[]) {
    for (const user of users) {
      // Likes
      for (const post of posts.filter((_, i) => i % 2 === 0)) {
        const exists = await this.likeRepo.findOne({
          where: { user: { id: user.id }, post: { id: post.id } },
        });
        if (!exists) {
          const like = this.likeRepo.create({ user, post });
          await this.likeRepo.save(like);
        }
      }

      // Comments
      for (const post of posts.filter((_, i) => i % 3 === 0)) {
        const exists = await this.commentRepo.findOne({
          where: {
            user: { id: user.id },
            post: { id: post.id },
            content: `Comment by ${user.username} on ${post.title}`,
          },
        });
        if (!exists) {
          const comment = this.commentRepo.create({
            user,
            post,
            content: `Comment by ${user.username} on ${post.title}`,
          });
          await this.commentRepo.save(comment);
        }
      }
    }
  }
}
