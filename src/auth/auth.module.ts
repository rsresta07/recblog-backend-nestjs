import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";
import { BcryptService } from "./bcryptjs/bcrypt.service";
import { UserService } from "src/user/user.service";
import { JwtService } from "@nestjs/jwt";
import { JwtStrategy } from "./strategy/jwt.strategy";
import { LocalStrategy } from "./strategy/local.strategy";
import { Pagination } from "nestjs-typeorm-paginate";

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AuthController],
  providers: [
    AuthService,
    BcryptService,
    UserService,
    JwtService,
    JwtStrategy,
    LocalStrategy,
    Pagination,
  ],
})
export class AuthModule {}
