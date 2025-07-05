import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { User } from "./user.entity";

@Entity("follows")
@Unique(["follower", "following"])
export class Follow {
  @PrimaryGeneratedColumn("uuid") id: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "follower_id" })
  follower: User;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "following_id" })
  following: User;

  @CreateDateColumn() createdAt: Date;
}
