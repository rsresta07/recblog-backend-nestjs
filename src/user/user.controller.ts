// user.controller.ts
import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { UserService } from "./user.service";

@Controller("/user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("details/:slug")
  findOne(@Param("slug") slug: string) {
    return this.userService.findOne(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  getMe(@Req() req) {
    // req.user injected by JwtAuthGuard
    return this.userService.findById(req.user.id);
  }
}
