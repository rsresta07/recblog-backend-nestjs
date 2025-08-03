import { GenericEntity } from "../../core/generic.entity";
import {
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinTable,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { Tag } from "../../tags/entities/tag.entity";
import { User } from "../../user/entities/user.entity";
import { PostLike } from "./like.entity";
import { Comment } from "./comment.entity";

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

  @Column({ type: "int", default: 0 })
  viewCount: number;

  // Many-to-Many relation between post and tags
  @ManyToMany(() => Tag, (tag) => tag.posts, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
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

  //   Many-to-One relation between post and user
  @ManyToOne(() => User, (user) => user.posts, {
    // A post must have a user
    nullable: false,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "user_id", referencedColumnName: "id" })
  user: User;

  // relationship with comment and likes
  @OneToMany(() => PostLike, (l) => l.post) likes: PostLike[];
  @OneToMany(() => Comment, (c) => c.post) comments: Comment[];
}
