import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Post } from "../../post/entities/post.entity";
import { User } from "../../user/entities/user.entity";

@Entity("tags")
export class Tag {
  @PrimaryGeneratedColumn("uuid", { name: "tag_id" })
  id: string;

  @Column({ type: "varchar", length: 255, name: "title" })
  title: string;

  @Column({ type: "varchar", name: "slug", default: "temp-slug" })
  slug: string;

  @Column({ type: "varchar", length: 255, name: "status" })
  status: boolean;

  @ManyToMany(() => Post, (post) => post.tags, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
  })
  posts?: Post[];
}
