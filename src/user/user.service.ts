import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Repository } from "typeorm";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>
  ) {}

  // helper functions

  async isAuthenticatedUser({ email }: any) {
    try {
      return await this.userRepo
        .createQueryBuilder("user")
        .where("LOWER(TRIM(user.email)) = :email", {
          email: email?.toLowerCase()?.trim(),
        })
        .getOne();
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async findOne(id: number) {
    try {
      const singleUser = await this.userRepo
        .createQueryBuilder("user")
        .where("user.id = :id", { id })
        .getOneOrFail();
      return singleUser;
    } catch (error) {
      throw new HttpException(`${error}`, HttpStatus.BAD_REQUEST);
    }
  }
}
