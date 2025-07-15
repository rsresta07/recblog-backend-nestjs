// user.controller.ts
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { UserService } from "./user.service";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { RoleEnum } from "src/utils/enum/role";
import { HasRoles } from "src/core/decorators/role.decorator";
import { RolesGuard } from "src/auth/guard/role.guard";
import { UpdateMeDto } from "./dto/update-me.dto";
import { UpdatePreferencesDto } from "./dto/update-preferences.dto";

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

  @UseGuards(JwtAuthGuard)
  @Put("/me")
  @ApiBearerAuth()
  @ApiOkResponse({ description: "Profile updated" })
  updateMe(@Req() req, @Body() dto: UpdateMeDto) {
    return this.userService.updateMe(req.user.id, dto);
  }

  /* — Optional: super‑admin can patch anyone — */
  @Patch("/details/:slug")
  @HasRoles(RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateUserBySlug(@Param("slug") slug: string, @Body() dto: UpdateMeDto) {
    return this.userService.updateBySlug(slug, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("/preferences")
  getMyPreferences(@Req() req) {
    return this.userService.getPreferences(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("/preferences")
  updateMyPreferences(@Req() req, @Body() dto: UpdatePreferencesDto) {
    return this.userService.updatePreferences(req.user.id, dto);
  }
}
