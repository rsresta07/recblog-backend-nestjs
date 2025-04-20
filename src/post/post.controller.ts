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
import { PostService } from "./post.service";
import { CreatePostDto } from "./dto/create-post.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { ApiTags } from "@nestjs/swagger";
import { ResponseMessage } from "../core/decorators/response.decorator";
import { CREATED } from "../auth/auth.constant";

@ApiTags("Post")
@Controller("/post")
export class PostController {
  constructor(private readonly postService: PostService) {}

  //* Create New Student
  @Post("/create")
  @ResponseMessage(CREATED)
  async create(@Body() createPostDto: CreatePostDto) {
    return this.postService.create(createPostDto);
  }

  //* Get all post
  @Get("/all")
  @UseInterceptors(ClassSerializerInterceptor)
  findAll() {
    return this.postService.findAll();
  }

  //* Get active post
  @Get("/active")
  @UseInterceptors(ClassSerializerInterceptor)
  findActive() {
    return this.postService.findActive();
  }

  //* Get post details
  @Get("/:slug")
  @UseInterceptors(ClassSerializerInterceptor)
  findOne(@Param("slug") slug: string) {
    return this.postService.findOne(slug);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postService.update(id, updatePostDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.postService.remove(id);
  }
}
