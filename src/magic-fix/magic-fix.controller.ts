import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { MagicFixService } from "./magic-fix.service";
import { CreateMagicFixDto } from "./dto/create-magic-fix.dto";
import { UpdateMagicFixDto } from "./dto/update-magic-fix.dto";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { HasRoles } from "../core/decorators/role.decorator";
import { RoleEnum } from "../utils/enum/role";
import { JwtAuthGuard } from "../auth/guard/jwt-auth.guard";
import { RolesGuard } from "../auth/guard/role.guard";

@ApiTags("Magic Fix")
@Controller("magic-fix")
export class MagicFixController {
  constructor(private readonly magicFixService: MagicFixService) {}

  @Post("/")
  @ApiBearerAuth()
  @HasRoles(RoleEnum.USER, RoleEnum.SUPER_ADMIN) // Keep it secured to logged-in users!
  @UseGuards(JwtAuthGuard, RolesGuard)
  async magicFix(@Body() magicFixDto: CreateMagicFixDto) {
    return this.magicFixService.magicFix(magicFixDto);
  }
}
