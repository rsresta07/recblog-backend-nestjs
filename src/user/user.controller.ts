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
  /**
   * Retrieves a list of all users.
   *
   * @returns A promise resolving to an array of all users.
   */
  findAll() {
    return this.userService.findAll();
  }

  @Get("/details/:slug")
  /**
   * Retrieves the details of a specific user.
   *
   * @param slug The slug identifier of the user.
   * @returns A promise resolving to the user details.
   * @throws HttpException if the user cannot be found.
   */
  findOne(@Param("slug") slug: string) {
    return this.userService.findOne(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get("/me")
  /**
   * Retrieves the profile details of the authenticated user.
   *
   * @param req The current request object. The user ID is extracted from the request,
   *            which is injected by the JwtAuthGuard.
   * @returns A promise resolving to the user's profile details.
   */
  getMe(@Req() req) {
    // req.user injected by JwtAuthGuard
    return this.userService.findById(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put("/me")
  @ApiBearerAuth()
  @ApiOkResponse({ description: "Profile updated" })
  /**
   * Updates the profile details of the authenticated user.
   *
   * @param req The current request object. The user ID is extracted from the request,
   *            which is injected by the JwtAuthGuard.
   * @param dto The update data transfer object.
   * @returns A promise resolving to the updated user's profile details.
   */
  updateMe(@Req() req, @Body() dto: UpdateMeDto) {
    return this.userService.updateMe(req.user.id, dto);
  }

  @Patch("/details/:slug")
  @HasRoles(RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  /**
   * Updates the profile details of a specific user.
   *
   * @param slug The slug identifier of the user.
   * @param dto The update data transfer object.
   * @returns A promise resolving to the updated user's profile details.
   * @throws HttpException if the user cannot be found.
   */
  updateUserBySlug(@Param("slug") slug: string, @Body() dto: UpdateMeDto) {
    return this.userService.updateBySlug(slug, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("/preferences")
  /**
   * Retrieves the preferences of the authenticated user.
   *
   * @param req The current request object. The user ID is extracted from the request,
   *            which is injected by the JwtAuthGuard.
   * @returns A promise resolving to the user's preferences.
   */
  getMyPreferences(@Req() req) {
    return this.userService.getPreferences(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("/preferences")
  /**
   * Updates the preferences of the authenticated user.
   *
   * @param req The current request object. The user ID is extracted from the request,
   *            which is injected by the JwtAuthGuard.
   * @param dto The update data transfer object containing the new preferences.
   * @returns A promise resolving to the updated user preferences.
   * @throws ForbiddenException if new preferences include tags not currently in the user's preferences.
   */
  updateMyPreferences(@Req() req, @Body() dto: UpdatePreferencesDto) {
    return this.userService.updatePreferences(req.user.id, dto);
  }
}
