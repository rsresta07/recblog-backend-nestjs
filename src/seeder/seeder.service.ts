import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "src/user/entities/user.entity";
import { Post } from "src/post/entities/post.entity";
import { Tag } from "src/tags/entities/tag.entity";
import { PostLike } from "src/post/entities/like.entity";
import { Comment } from "src/post/entities/comment.entity";
import { Follow } from "src/user/entities/follow.entity"; // Adjust path if needed
import { BcryptService } from "src/auth/bcryptjs/bcrypt.service";
import { RoleEnum, StatusEnum } from "src/utils/enum/role";

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Post) private readonly postRepo: Repository<Post>,
    @InjectRepository(Tag) private readonly tagRepo: Repository<Tag>,
    @InjectRepository(PostLike) private readonly likeRepo: Repository<PostLike>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(Follow) private readonly followRepo: Repository<Follow>,
    private readonly bcryptService: BcryptService
  ) {}

  async run() {
    this.logger.log("Starting database seeding...");

    const tags = await this.seedTags();
    const users = await this.seedUsers(tags);
    await this.seedFollows(users);
    const posts = await this.seedPosts(users, tags);
    await this.seedInteractions(users, posts);

    this.logger.log("Database seeding completed successfully!");
  }

  private async seedTags(): Promise<Tag[]> {
    const defaultTags = [
      { title: "Technology", slug: "technology", status: true },
      { title: "Lifestyle", slug: "lifestyle", status: true },
      { title: "Health", slug: "health", status: true },
      { title: "Programming", slug: "programming", status: true },
      { title: "Travel", slug: "travel", status: true },
    ];

    const savedTags: Tag[] = [];
    for (const t of defaultTags) {
      let tag = await this.tagRepo.findOne({ where: { slug: t.slug } });
      if (!tag) {
        tag = this.tagRepo.create(t);
        tag = await this.tagRepo.save(tag);
      }
      savedTags.push(tag);
    }

    this.logger.log(`Seeded ${savedTags.length} tags.`);
    return savedTags;
  }

  private async seedUsers(tags: Tag[]): Promise<User[]> {
    const usersData = Array.from({ length: 30 }).map((_, i) => ({
      fullName: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      username: `user${i + 1}`,
      password: "@Password123",
      role: RoleEnum.USER, // Make sure RoleEnum.USER matches your enum definition
      status: StatusEnum.APPROVED, // Make sure StatusEnum.APPROVED matches
      preferences: [tags[i % tags.length], tags[(i + 1) % tags.length]],
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

    this.logger.log(`Seeded ${savedUsers.length} users.`);
    return savedUsers;
  }

  private async seedFollows(users: User[]) {
    let followCount = 0;
    const randomSubset = <T>(arr: T[], count: number) =>
      arr.sort(() => 0.5 - Math.random()).slice(0, count);

    for (const follower of users) {
      // Each user follows 3 to 10 random users
      const followings = randomSubset(users, Math.floor(Math.random() * 8) + 3);

      for (const following of followings) {
        // Prevent self-following
        if (follower.id === following.id) continue;

        const exists = await this.followRepo.findOne({
          where: {
            follower: { id: follower.id },
            following: { id: following.id },
          },
        });

        if (!exists) {
          const follow = this.followRepo.create({ follower, following });
          await this.followRepo.save(follow);
          followCount++;
        }
      }
    }

    this.logger.log(`Seeded ${followCount} follow relationships.`);
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
      viewCount: Math.floor(Math.random() * 2000) + 50, // Seeds random views initially
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

    this.logger.log(`Seeded ${savedPosts.length} posts.`);
    return savedPosts;
  }

  private async seedInteractions(users: User[], posts: Post[]) {
    let likeCount = 0;
    let commentCount = 0;

    const randomSubset = <T>(arr: T[], count: number) =>
      arr.sort(() => 0.5 - Math.random()).slice(0, count);

    for (const post of posts) {
      // 1. Seed Likes for the post
      const numLikes = Math.floor(Math.random() * (users.length / 2)) + 5;
      const likers = randomSubset(users, numLikes);

      for (const user of likers) {
        const exists = await this.likeRepo.findOne({
          where: { user: { id: user.id }, post: { id: post.id } },
        });
        if (!exists) {
          const like = this.likeRepo.create({ user, post });
          await this.likeRepo.save(like);
          likeCount++;
        }
      }

      // 2. Seed Comments for the post
      const numCommenters = Math.floor(Math.random() * (users.length / 3)) + 3;
      const commenters = randomSubset(users, numCommenters);

      for (const user of commenters) {
        const numCommentsPerUser = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numCommentsPerUser; i++) {
          const content = `Insightful comment ${i + 1} by ${user.username} on ${
            post.title
          }.`;
          const exists = await this.commentRepo.findOne({
            where: { user: { id: user.id }, post: { id: post.id }, content },
          });
          if (!exists) {
            const comment = this.commentRepo.create({ user, post, content });
            await this.commentRepo.save(comment);
            commentCount++;
          }
        }
      }
    }

    this.logger.log(`Seeded ${likeCount} likes and ${commentCount} comments.`);
  }
}
