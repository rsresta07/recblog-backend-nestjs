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
  Query,
  Req,
} from "@nestjs/common";
import { PostService } from "./post.service";
import { CreatePostDto } from "./dto/create-post.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ResponseMessage } from "../core/decorators/response.decorator";
import { CREATED } from "../auth/auth.constant";
import { HasRoles } from "../core/decorators/role.decorator";
import { RoleEnum } from "../utils/enum/role";
import { JwtAuthGuard } from "../auth/guard/jwt-auth.guard";
import { RolesGuard } from "../auth/guard/role.guard";

@ApiTags("Post")
@Controller("/post")
export class PostController {
  constructor(private readonly postService: PostService) {}

  //* Create New Post
  @Post("/create/:userSlug")
  @ApiBearerAuth()
  @HasRoles(RoleEnum.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ResponseMessage(CREATED)
  async create(
    @Param("userSlug") userSlug: string,
    @Body() createPostDto: CreatePostDto
  ) {
    return this.postService.create(userSlug, createPostDto);
  }

  //* Get all Posts
  @Get("/all")
  @ApiBearerAuth()
  @HasRoles(RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
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

  //* Get post-details
  //* Public — no login needed
  @Get("details/:slug")
  @UseInterceptors(ClassSerializerInterceptor)
  async findOnePublic(@Param("slug") slug: string) {
    return this.postService.findOne(slug);
  }

  //* Authenticated — preference tracking
  @Get("details-auth/:slug")
  @ApiBearerAuth()
  @HasRoles(RoleEnum.USER, RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async findOneAuth(@Param("slug") slug: string, @Req() req: any) {
    const userId = req.user?.id;
    return this.postService.findOne(slug, userId);
  }

  @Patch("/update/:id")
  @ApiBearerAuth()
  @HasRoles(RoleEnum.USER, RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(@Param("id") id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postService.update(id, updatePostDto);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @HasRoles(RoleEnum.USER, RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param("id") id: string) {
    return this.postService.remove(id);
  }

  // Search post
  @Get("/search")
  searchPosts(@Query("q") query: string) {
    return this.postService.searchPosts(query);
  }

  //* Recommend posts based on user preferences (tags)
  @Get("/recommendations")
  @ApiBearerAuth()
  @HasRoles(RoleEnum.USER, RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  getRecommendedPosts(@Req() req) {
    const userId = req.user?.id;
    return this.postService.getRecommendedPostsForUser(userId);
  }
}
