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
} from "@nestjs/common";
import { TagsService } from "./tags.service";
import { CreateTagDto } from "./dto/create-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";
import { ApiTags } from "@nestjs/swagger";
import { ResponseMessage } from "../core/decorators/response.decorator";
import { CREATED } from "../auth/auth.constant";

@ApiTags("Tags")
@Controller("/tags")
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  //* Create New Tag
  @Post("/create")
  @ResponseMessage(CREATED)
  async create(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto);
  }

  //* Get all Tags
  @Get("/all")
  @UseInterceptors(ClassSerializerInterceptor)
  findAll() {
    return this.tagsService.findAll();
  }

  //* Get active tags
  @Get("/active")
  @UseInterceptors(ClassSerializerInterceptor)
  findActive() {
    return this.tagsService.findActive();
  }

  //* Get tag-details
  @Get("/:slug")
  @UseInterceptors(ClassSerializerInterceptor)
  findOne(@Param("slug") slug: string) {
    return this.tagsService.findOne(slug);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateTagDto: UpdateTagDto) {
    return this.tagsService.update(id, updateTagDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.tagsService.remove(id);
  }
}
