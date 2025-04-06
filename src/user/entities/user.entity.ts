import { Exclude } from "class-transformer";
import { GenericEntity } from "src/core/generic.entity";
import { Project } from "src/project/entities/project.entity";
import { RoleEnum, StatusEnum } from "src/utils/enum/role";
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("users")
export class User extends GenericEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

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
}
