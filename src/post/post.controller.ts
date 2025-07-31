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
  /**
   * Creates a new post in the database.
   *
   * @param userSlug The slug of the user creating the post.
   * @param createPostDto The data transfer object containing the post information.
   * @returns The newly created post.
   */
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
  /**
   * Retrieves a list of all posts.
   *
   * @returns A promise resolving to an array of all posts,
   *          with user and tag information included.
   * @throws HttpException if an error occurs while fetching posts.
   */
  findAll() {
    return this.postService.findAll();
  }

  //* Get active post
  @Get("/active")
  @UseInterceptors(ClassSerializerInterceptor)
  /**
   * Retrieves a list of all active posts.
   *
   * @returns A promise resolving to an array of active posts,
   *          with user and tag information included.
   * @throws HttpException if an error occurs while fetching active posts.
   */
  findActive() {
    return this.postService.findActive();
  }

  //* Get post-details
  //* Public — no login needed
  @Get("details/:slug")
  @UseInterceptors(ClassSerializerInterceptor)
  /**
   * Retrieves the details of a specific post for public access.
   *
   * @param slug The slug identifier of the post.
   * @returns A promise resolving to the post details.
   * @throws HttpException if the post cannot be found.
   */
  async findOnePublic(@Param("slug") slug: string) {
    return this.postService.findOne(slug);
  }

  //* Authenticated — preference tracking
  @Get("details-auth/:slug")
  @ApiBearerAuth()
  @HasRoles(RoleEnum.USER, RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  /**
   * Retrieves the details of a specific post for an authenticated user,
   * taking into account the user's viewing preferences.
   *
   * @param slug The slug identifier of the post.
   * @param req The current request object.
   * @returns A promise resolving to the post details.
   * @throws HttpException if the post cannot be found.
   */
  async findOneAuth(@Param("slug") slug: string, @Req() req: any) {
    const userId = req.user?.id;
    return this.postService.findOne(slug, userId);
  }

  @Patch("/update/:id")
  @ApiBearerAuth()
  @HasRoles(RoleEnum.USER, RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  /**
   * Updates a post.
   *
   * @param id The UUID of the post to update.
   * @param updatePostDto The update data transfer object.
   * @returns A promise resolving to the updated post.
   * @throws HttpException if the update fails.
   */
  update(@Param("id") id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postService.update(id, updatePostDto);
  }

  @Patch("/delete/:id")
  @ApiBearerAuth()
  @HasRoles(RoleEnum.USER, RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  /**
   * Removes a post.
   *
   * @param id The UUID of the post to remove.
   * @returns A promise resolving to nothing.
   * @throws HttpException if the post cannot be found.
   */
  remove(@Param("id") id: string) {
    return this.postService.remove(id);
  }

  @Get("/admin-get-post/:id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getPostById(@Param("id") id: string) {
    return this.postService.getPostById(id);
  }

  @Patch("/admin-update/:id")
  @ApiBearerAuth()
  @HasRoles(RoleEnum.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  adminUpdate(@Param("id") id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postService.adminUpdate(id, updatePostDto);
  }

  // Search post
  @Get("/search")
  /**
   * Searches for posts based on a query string.
   *
   * @param query The search term used to find posts.
   * @returns A promise resolving to an array of posts that match the search criteria.
   * @throws HttpException if the search fails or query is invalid.
   */
  searchPosts(@Query("q") query: string) {
    return this.postService.searchPosts(query);
  }
}
