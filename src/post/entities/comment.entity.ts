import { User } from "src/user/entities/user.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Post } from "./post.entity";

@Entity("comments")
export class Comment {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column("text") content: string;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Post, (p) => p.comments, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "post_id" })
  post: Post;

  @CreateDateColumn() createdAt: Date;
}
