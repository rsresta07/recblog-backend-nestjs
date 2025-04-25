import { Exclude } from "class-transformer";
import { GenericEntity } from "src/core/generic.entity";
import { RoleEnum, StatusEnum } from "src/utils/enum/role";
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Post } from "../../post/entities/post.entity";
import { Tag } from "../../tags/entities/tag.entity";

@Entity("users")
export class User extends GenericEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: "varchar", length: 100, unique: true })
  username: string;

  @Column({ type: "varchar", name: "full_name" })
  fullName: string;

  @Exclude()
  @Column()
  password: string;

  @Column({ nullable: true })
  refresh_token: string;

  @Column({ type: "enum", enum: RoleEnum, default: RoleEnum.SUPER_ADMIN })
  role: string;

  @Column({ type: "enum", enum: StatusEnum, default: StatusEnum.PENDING })
  status: StatusEnum;

  @CreateDateColumn()
  last_login_at: Date;

  @ManyToMany(() => Post, (post) => post.users, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
  })
  posts?: Post[];

  @ManyToMany(() => Tag, (tag) => tag.users, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
  })
  tags?: Tag[];
}
