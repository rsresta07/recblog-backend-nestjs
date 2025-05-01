import { GenericEntity } from "../../core/generic.entity";
import {
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  JoinTable,
} from "typeorm";
import { Tag } from "../../tags/entities/tag.entity";
import { User } from "../../user/entities/user.entity";

@Entity("posts")
export class Post extends GenericEntity {
  @PrimaryGeneratedColumn("uuid", { name: "post_id" })
  id: string;

  @Column({ type: "varchar", length: 255, name: "title" })
  title: string;

  @Column({ type: "varchar", name: "content" })
  content: string;

  @Column({ type: "varchar", name: "image" })
  image: string;

  @Column({ type: "varchar", name: "slug" })
  slug: string;

  @Column({ type: "boolean", name: "status" })
  status: boolean;

  // tsvector
  @Column({ type: "tsvector", nullable: true })
  search_vector: string;

  // Many-to-Many relation between post and tags
  @ManyToMany(() => Tag, (tag) => tag.posts, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
  })
  @JoinTable({
    name: "post_tag",
    joinColumns: [
      {
        name: "post_id",
        referencedColumnName: "id",
      },
    ],
    inverseJoinColumns: [
      {
        name: "tag_id",
        referencedColumnName: "id",
      },
    ],
  })
  tags?: Tag[];

  //   Many-to-Many relation between user and post
  @ManyToMany(() => User, (user) => user.posts, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
  })
  @JoinTable({
    name: "post_user",
    joinColumns: [
      {
        name: "post_id",
        referencedColumnName: "id",
      },
    ],
    inverseJoinColumns: [
      {
        name: "user_id",
        referencedColumnName: "id",
      },
    ],
  })
  users?: User[];
}
