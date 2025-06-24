// user.controller.ts
import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { UserService } from "./user.service";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RoleEnum } from "src/utils/enum/role";
import { HasRoles } from "src/core/decorators/role.decorator";
import { RolesGuard } from "src/auth/guard/role.guard";

@ApiTags("User")
@Controller("/user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("/all")
  @ApiBearerAuth()
  @HasRoles(RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  findAll() {
    return this.userService.findAll();
  }

  @Get("/details/:slug")
  findOne(@Param("slug") slug: string) {
    return this.userService.findOne(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get("/me")
  getMe(@Req() req) {
    // req.user injected by JwtAuthGuard
    return this.userService.findById(req.user.id);
  }
}
