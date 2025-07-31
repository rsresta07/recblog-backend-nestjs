import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
} from "@nestjs/common";
import { TagsService } from "./tags.service";
import { CreateTagDto } from "./dto/create-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ResponseMessage } from "../core/decorators/response.decorator";
import { CREATED } from "../auth/auth.constant";
import { HasRoles } from "../core/decorators/role.decorator";
import { RoleEnum } from "../utils/enum/role";
import { JwtAuthGuard } from "../auth/guard/jwt-auth.guard";
import { RolesGuard } from "../auth/guard/role.guard";

@ApiTags("Tags")
@Controller("/tags")
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  //* Create New Tag
  @Post("/create")
  @ApiBearerAuth()
  @HasRoles(RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ResponseMessage(CREATED)
  /**
   * Creates a new tag in the database.
   *
   * @param createTagDto The data transfer object containing the tag information.
   * @returns The newly created tag.
   */
  async create(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto);
  }

  //* Get all Tags
  @Get("/all")
  @ApiBearerAuth()
  @HasRoles(RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  /**
   * Retrieves a list of all tags.
   *
   * @returns A promise resolving to an array of all tags.
   */
  findAll() {
    return this.tagsService.findAll();
  }

  //* Get active tags
  @Get("/active")
  @UseInterceptors(ClassSerializerInterceptor)
  /**
   * Retrieves a list of all active tags.
   *
   * @returns A promise resolving to an array of active tags.
   */
  findActive() {
    return this.tagsService.findActive();
  }

  //* Get tag-details
  @Get("/:slug")
  @UseInterceptors(ClassSerializerInterceptor)
  /**
   * Retrieves the details of a specific tag.
   *
   * @param slug The slug identifier of the tag.
   * @returns A promise resolving to the tag details.
   */
  findOne(@Param("slug") slug: string) {
    return this.tagsService.findOne(slug);
  }

  @Patch("/update/:id")
  @ApiBearerAuth()
  @HasRoles(RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  /**
   * Updates a tag.
   *
   * @param id The UUID of the tag to update.
   * @param updateTagDto The update data transfer object.
   * @returns A promise resolving to the updated tag.
   * @throws HttpException if the update fails.
   */
  update(@Param("id") id: string, @Body() updateTagDto: UpdateTagDto) {
    return this.tagsService.update(id, updateTagDto);
  }

  @Patch("/delete/:id")
  @ApiBearerAuth()
  @HasRoles(RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  /**
   * Removes a tag. make tag status false when clicked on delete
   *
   * @param id The UUID of the tag to remove.
   * @returns A promise resolving to nothing.
   * @throws HttpException if the tag cannot be found.
   */
  remove(@Param("id") id: string) {
    return this.tagsService.remove(id);
  }
}
