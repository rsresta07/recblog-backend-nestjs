import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  Req,
  UseInterceptors,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginAuthDto, RegisterUserDto } from "./dto/create-auth.dto";
import { ApiTags } from "@nestjs/swagger";
import { ResponseMessage } from "src/core/decorators/response.decorator";
import { LOGGED_IN, REGISTERED, CREATED } from "./auth.constant";

@ApiTags("Auth")
@Controller("/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("/login")
  @UseInterceptors(ClassSerializerInterceptor)
  @ResponseMessage(LOGGED_IN)
  /**
   * Authenticates a user using their email and password.
   *
   * @param loginAuthDto - The login credentials including email and password.
   * @returns The authenticated user data along with a JWT token if successful.
   * @throws HttpException if authentication fails due to incorrect credentials or if the user is not activated.
   */
  login(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.login(loginAuthDto);
  }

  @Post("/register")
  @ResponseMessage(REGISTERED)
  /**
   * Registers a new user. The user is expected to provide their full name,
   * email, password, and optionally a position.
   *
   * @param createUserDto The user data to register.
   * @returns The new user data.
   */
  registerUser(@Body() createUserDto: RegisterUserDto) {
    return this.authService.createUser(createUserDto);
  }
}
