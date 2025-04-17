import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { LoginAuthDto, RegisterUserDto } from "./dto/create-auth.dto";
import { BcryptService } from "./bcryptjs/bcrypt.service";
import { UserService } from "src/user/user.service";
import { JwtService } from "@nestjs/jwt";

import "dotenv/config";
import { RoleEnum, StatusEnum } from "src/utils/enum/role";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly bcryptService: BcryptService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource
  ) {}

  async createUser(currentUser, createUserDto: RegisterUserDto) {
    try {
      const userExists = await this.CheckUserExists(createUserDto);
      const { email, password, ...rest } = createUserDto;
      const originalPassword = password?.trim();

      if (userExists) {
        throw new HttpException("User already exists", 500);
      } else {
        const hashedPassword = await this.bcryptService.hashPassword(
          originalPassword
        );

        const data = {
          email: email?.trim(),
          password: hashedPassword,
          role: RoleEnum.USER,
          // If you want to make the status to be pending when creating account remove the status below
          status: StatusEnum.APPROVED,
        };
        const { password, ...restPart } = await this.userRepo.save(data);

        const token: any = await this.generateToken(restPart);

        return {
          id: restPart.id,
          email: restPart.email,
          role: restPart.role,
          token,
          refreshToken: "",
        };
      }
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async login(loginAuthDto: LoginAuthDto) {
    try {
      const userData = await this.userService.isAuthenticatedUser(loginAuthDto);
      if (userData) {
        if (userData?.status == StatusEnum.APPROVED) {
          const isMatched = await this.bcryptService.comparePassword(
            loginAuthDto?.password?.trim(),
            userData?.password?.trim()
          );
          if (isMatched) {
            const token: any = await this.generateToken(userData);
            return {
              id: userData?.id,
              email: userData?.email,
              role: userData?.role,
              token,
              refreshToken: "",
            };
          } else {
            throw new HttpException("Email or password incorrect", 500);
          }
        } else {
          throw new HttpException("User not activated", 500);
        }
      } else {
        throw new HttpException("Email not found", 500);
      }
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async validateUser(email: string, password: string) {
    try {
      const user = await this.userService.isAuthenticatedUser({
        email,
      });

      if (
        user &&
        (await this.bcryptService.comparePassword(password, user.password))
      ) {
        const { password, ...result } = user;
        return result;
      }
      return null;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  // helper functions

  public async generateToken(user: any): Promise<string> {
    return this.jwtService.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      {
        secret: process.env.JWT_SECRET || "secret_key",
        expiresIn: "1d",
      }
    );
  }

  async CheckUserExists(createUserDto) {
    return await this.userRepo.findOne({
      where: {
        email: createUserDto?.email,
      },
    });
  }
}
