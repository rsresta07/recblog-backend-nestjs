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
    const tags = await this.tagRepo.find();
    if (!tags.length) throw new Error("No tags found in DB. Add some first.");

    const users = await this.seedUsers(tags);
    const posts = await this.seedPosts(users, tags);
    await this.seedInteractions(users, posts);
    await this.boostExistingPosts(); // new addition
  }

  private async seedUsers(tags: Tag[]): Promise<User[]> {
    const usersData = Array.from({ length: 30 }).map((_, i) => ({
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
    const imageUrls = [
      "https://res.cloudinary.com/dbhg87dtr/image/upload/v1752250923/z3rmxytksjpq1crj14dr.png",
      "https://res.cloudinary.com/dbhg87dtr/image/upload/v1752251206/r3kgknf7vn2mlpaderpt.png",
      "https://res.cloudinary.com/dbhg87dtr/image/upload/v1752251792/u5f9foudug2ekxvnhvze.png",
      "https://res.cloudinary.com/dbhg87dtr/image/upload/v1752252121/lj3duitokavnwu5bks8n.png",
      "https://res.cloudinary.com/dbhg87dtr/image/upload/v1752252444/dtttoriqugpv1vrirqu2.png",
      "https://res.cloudinary.com/dbhg87dtr/image/upload/v1752252566/nsqi54am2nmpjsxuah20.png",
      "https://res.cloudinary.com/dbhg87dtr/image/upload/v1752252858/quplrppej4ua5xp5krqg.png",
      "https://res.cloudinary.com/dbhg87dtr/image/upload/v1752253251/y0gaflcjdjfeu6cpctng.png",
      "https://res.cloudinary.com/dbhg87dtr/image/upload/v1754055903/gey4ovubsk5eqsulqgew.png",
      "https://res.cloudinary.com/dbhg87dtr/image/upload/v1754056268/jxxmmhgyg0ra17fsuxup.png",
      "https://res.cloudinary.com/dbhg87dtr/image/upload/v1754061343/gerxdiqlmneqxpzxawvk.png",
      "https://res.cloudinary.com/dbhg87dtr/image/upload/v1754062179/r71mcflzjiwl7reknzet.png",
      "https://res.cloudinary.com/dbhg87dtr/image/upload/v1754108548/pt6tuac04trnu7xjogf8.png",
      "https://res.cloudinary.com/dbhg87dtr/image/upload/v1762997390/l6fqvcjv5bdsfovgujgs.png",
      "https://res.cloudinary.com/dbhg87dtr/image/upload/v1762708488/kxoclbqrm3w7zdyg8ho2.png",
    ];

    const getRandomImage = () =>
      imageUrls[Math.floor(Math.random() * imageUrls.length)];

    const postsData = Array.from({ length: 60 }).map((_, i) => ({
      title: `Post ${i + 1}`,
      content: `This is detailed content for post ${
        i + 1
      }. It contains valuable information about topic #${i + 1}.`,
      slug: `post-${i + 1}`,
      image: getRandomImage(),
      status: true,
      user: users[i % users.length],
      tags: [tags[i % tags.length], tags[(i + 1) % tags.length]],
      views: Math.floor(Math.random() * 200) + 50,
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
    const randomSubset = <T>(arr: T[], count: number) =>
      arr.sort(() => 0.5 - Math.random()).slice(0, count);

    for (const user of users) {
      const likedPosts = randomSubset(
        posts,
        Math.floor(Math.random() * (posts.length / 2)) + 10
      );
      for (const post of likedPosts) {
        const exists = await this.likeRepo.findOne({
          where: { user: { id: user.id }, post: { id: post.id } },
        });
        if (!exists) {
          const like = this.likeRepo.create({ user, post });
          await this.likeRepo.save(like);
        }
      }

      const commentedPosts = randomSubset(
        posts,
        Math.floor(Math.random() * (posts.length / 3)) + 5
      );
      for (const post of commentedPosts) {
        const randomCommentCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < randomCommentCount; i++) {
          const content = `Comment ${i + 1} by ${user.username} on ${
            post.title
          }`;
          const exists = await this.commentRepo.findOne({
            where: { user: { id: user.id }, post: { id: post.id }, content },
          });
          if (!exists) {
            const comment = this.commentRepo.create({ user, post, content });
            await this.commentRepo.save(comment);
          }
        }
      }
    }
  }

  // New: boost likes, comments, and views for existing posts
  private async boostExistingPosts() {
    const users = await this.userRepo.find();
    const posts = await this.postRepo.find();

    const randomSubset = <T>(arr: T[], count: number) =>
      arr.sort(() => 0.5 - Math.random()).slice(0, count);

    for (const post of posts) {
      const likeCount = Math.floor(Math.random() * (users.length / 2)) + 10;
      const selectedUsers = randomSubset(users, likeCount);
      for (const user of selectedUsers) {
        const exists = await this.likeRepo.findOne({
          where: { user: { id: user.id }, post: { id: post.id } },
        });
        if (!exists) {
          const like = this.likeRepo.create({ user, post });
          await this.likeRepo.save(like);
        }
      }

      const commentUserCount =
        Math.floor(Math.random() * (users.length / 3)) + 5;
      const selectedCommentUsers = randomSubset(users, commentUserCount);
      for (const user of selectedCommentUsers) {
        const commentCount = Math.floor(Math.random() * 4) + 1;
        for (let i = 0; i < commentCount; i++) {
          const content = `Extra comment ${i + 1} by ${user.username} on ${
            post.title
          }`;
          const exists = await this.commentRepo.findOne({
            where: { user: { id: user.id }, post: { id: post.id }, content },
          });
          if (!exists) {
            const comment = this.commentRepo.create({ user, post, content });
            await this.commentRepo.save(comment);
          }
        }
      }

      post.viewCount =
        (post.viewCount || 0) + Math.floor(Math.random() * 1500) + 200;
      await this.postRepo.save(post);
    }

    console.log("Boosted existing posts with more likes, comments, and views.");
  }
}
