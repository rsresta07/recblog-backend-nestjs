import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginAuthDto, RegisterUserDto } from "./dto/create-auth.dto";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ResponseMessage } from "src/core/decorators/response.decorator";
import { LOGGED_IN, REGISTERED } from "./auth.constant";
import { JwtAuthGuard } from "./guard/jwt-auth.guard";
import { RolesGuard } from "./guard/role.guard";
import { HasRoles } from "src/core/decorators/role.decorator";
import { RoleEnum } from "src/utils/enum/role";

@ApiTags("Auth")
@Controller("/api/v1/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("/login")
  @UseInterceptors(ClassSerializerInterceptor)
  @ResponseMessage(LOGGED_IN)
  login(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.login(loginAuthDto);
  }

  @Post("/create")
  registerUser(@Req() req: any, @Body() createUserDto: RegisterUserDto) {
    return this.authService.createUser(req.user, createUserDto);
  }
}
