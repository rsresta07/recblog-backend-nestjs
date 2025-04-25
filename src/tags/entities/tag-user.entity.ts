import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from "typeorm";
import { Tag } from "./tag.entity";
import { User } from "../../user/entities/user.entity";

@Entity("tag_user")
export class UserTag {
  @PrimaryColumn({ name: "user_id" })
  userId: string;

  @PrimaryColumn({ name: "tag_id" })
  tagId: string;

  @ManyToOne(() => User, (user) => user.tags, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
  })
  @JoinColumn({ name: "user_id", referencedColumnName: "id" })
  user: User;

  @ManyToOne(() => Tag, (tag) => tag.users, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
  })
  @JoinColumn({ name: "tag_id", referencedColumnName: "id" })
  tag: Tag;
}
