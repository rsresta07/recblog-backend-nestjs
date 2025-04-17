import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from "typeorm";
import { Post } from "./post.entity";
import { Tag } from "../../tags/entities/tag.entity";

@Entity("post_tag")
export class PostTag {
  @PrimaryColumn({ name: "post_id" })
  postId: string;

  @PrimaryColumn({ name: "tag_id" })
  tagId: string;

  @ManyToOne(() => Post, (post) => post.tags, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
  })
  @JoinColumn({ name: "post_id", referencedColumnName: "id" })
  post: Post;

  @ManyToOne(() => Tag, (tag) => tag.posts, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
  })
  @JoinColumn({ name: "tag_id", referencedColumnName: "id" })
  tag: Tag;
}
