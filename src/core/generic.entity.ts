import { Exclude } from "class-transformer";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  UpdateDateColumn,
} from "typeorm";

export class GenericEntity {
  @Exclude()
  @CreateDateColumn({
    name: "created_at",
  })
  createdAt: Date;

  @Exclude()
  @UpdateDateColumn({
    name: "updated_at",
  })
  updatedAt: Date;

  @Exclude()
  @Column({
    default: null,
    name: "created_by",
  })
  createdBy: string;

  @Exclude()
  @Column({
    default: null,
    name: "updated_by",
  })
  updatedBy: string;
}
