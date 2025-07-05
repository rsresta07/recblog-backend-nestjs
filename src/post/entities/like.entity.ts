import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { Post } from "./post.entity";
import { User } from "src/user/entities/user.entity";

@Entity("post_likes")
@Unique(["user", "post"])
export class PostLike {
  @PrimaryGeneratedColumn("uuid") id: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Post, (p) => p.likes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "post_id" })
  post: Post;

  @CreateDateColumn() createdAt: Date;
}
