import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BcryptService } from "src/auth/bcryptjs/bcrypt.service";
import { Pagination } from "nestjs-typeorm-paginate";
import { User } from "./entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService, BcryptService, Pagination],
})
export class UserModule {}
