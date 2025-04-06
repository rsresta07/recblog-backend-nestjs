import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SeedsService } from "./seeds.service";
import { User } from "src/user/entities/user.entity";
import { UserService } from "src/user/user.service";
import { BcryptService } from "src/auth/bcryptjs/bcrypt.service";

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [SeedsService, UserService, BcryptService],
})
export class SeedsModule {}
