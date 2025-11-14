import { Exclude } from "class-transformer";
import { GenericEntity } from "src/core/generic.entity";
import { RoleEnum, StatusEnum } from "src/utils/enum/role";
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { Post } from "../../post/entities/post.entity";
import { Tag } from "../../tags/entities/tag.entity";

@Entity("users")
export class User extends GenericEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({
    type: "varchar",
    length: 100,
    unique: true,
    default: "username",
  })
  username: string;

  @Column({ type: "varchar", name: "full_name", default: "Mr. User" })
  fullName: string;

  @Exclude()
  @Column()
  password: string;

  @Column({ type: "varchar", name: "position", default: "Kathmandu" })
  position: string;

  @Column({ nullable: true })
  refresh_token: string;

  @Column({ type: "enum", enum: RoleEnum, default: RoleEnum.SUPER_ADMIN })
  role: string;

  @Column({ type: "enum", enum: StatusEnum, default: StatusEnum.PENDING })
  status: StatusEnum;

  @CreateDateColumn()
  last_login_at: Date;

  @OneToMany(() => Post, (post) => post.user)
  posts?: Post[];

  @ManyToMany(() => Tag, {})
  @JoinTable({ name: "user_tags" }) // join table: user_tags(user_id, tag_id)
  preferences: Tag[];
}
