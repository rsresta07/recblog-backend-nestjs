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
import generateSlug from "src/utils/helpers/generateSlug";

@Injectable()
export class AuthService {
  /**
   * The constructor for the AuthService class.
   *
   * Injects the required dependencies.
   *
   * @param userRepo The Repository for User entity.
   * @param bcryptService The service to hash and compare passwords.
   * @param userService The service to handle the user operations.
   * @param jwtService The service to handle the JWT authentication.
   * @param dataSource The DataSource to interact with the database.
   */
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly bcryptService: BcryptService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Registers a new user with the provided credentials.
   * @param createUserDto The Registration User DTO.
   * @returns The newly created user object with the JWT token.
   * @throws {HttpException} If the user already exists.
   * @throws {HttpException} If there is an error creating the user.
   */
  async createUser(createUserDto: RegisterUserDto) {
    try {
      const userExists = await this.CheckUserExists(createUserDto);
      const { email, password, ...rest } = createUserDto;
      const originalPassword = password?.trim();

      if (userExists) {
        throw new HttpException("User already exists", HttpStatus.CONFLICT);
      } else {
        const hashedPassword = await this.bcryptService.hashPassword(
          originalPassword
        );

        const data = {
          email: email?.trim(),
          password: hashedPassword,
          fullName: createUserDto.fullName?.trim(),
          username: generateSlug(createUserDto.fullName),
          role: RoleEnum.USER,
          position: createUserDto.position?.trim(),
          // If you want to make the status to be pending when creating an account, remove the status below
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
          slug: restPart.username,
        };
      }
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  /**
   * Logs in the user with the provided credentials.
   * @param loginAuthDto The Login Auth DTO.
   * @returns The user object with the JWT token.
   * @throws {HttpException} If the user is not found.
   * @throws {HttpException} If the user is not activated.
   * @throws {HttpException} If the email or password is incorrect.
   */
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
              slug: userData?.username,
            };
          } else {
            throw new HttpException(
              "Email or password incorrect",
              HttpStatus.UNAUTHORIZED
            );
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

  /**
   * Validates a user's credentials.
   *
   * @param email - The email address of the user.
   * @param password - The password of the user.
   * @returns A promise that resolves to the user object if the credentials are valid.
   * @throws {HttpException} If the credentials are invalid, with a status of UNAUTHORIZED.
   */
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

  /**
   * Generates a JWT token for a given user.
   *
   * @param user - The user object containing user details.
   * @returns A promise that resolves to a JWT token as a string.
   */
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

  /**
   * Checks if a user already exists in the repository based on the provided email.
   *
   * @param createUserDto - The DTO containing user registration data, including the email.
   * @returns A promise that resolves to the user object if found, otherwise null.
   */
  async CheckUserExists(createUserDto) {
    return await this.userRepo.findOne({
      where: {
        email: createUserDto?.email,
      },
    });
  }
}
