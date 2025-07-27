import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Follow } from "src/user/entities/follow.entity";
import { User } from "src/user/entities/user.entity";
import { Repository } from "typeorm";

@Injectable()
export class FollowsService {
  /**
   * The constructor for the FollowsService class.
   *
   * Injects the required dependencies.
   *
   * @param repo The Repository for Follow entity.
   * @param users The Repository for User entity.
   */
  constructor(
    @InjectRepository(Follow) private repo: Repository<Follow>,
    @InjectRepository(User) private users: Repository<User>
  ) {}

  /**
   * Creates a follow relationship between two users.
   *
   * @param currentUserId The UUID of the user who is performing the follow.
   * @param targetId The UUID of the user who is being followed.
   *
   * @throws BadRequestException Thrown if the current user is trying to follow themselves.
   * @throws NotFoundException Thrown if the target user is not found.
   * @throws BadRequestException Thrown if the current user is already following the target user.
   *
   * @returns The newly created follow entity.
   */
  async follow(currentUserId: string, targetId: string) {
    if (currentUserId === targetId)
      throw new BadRequestException("Cannot follow yourself");

    const target = await this.users.findOneBy({ id: targetId });
    if (!target) throw new NotFoundException("User not found");

    const exists = await this.repo.exist({
      where: { follower: { id: currentUserId }, following: { id: targetId } },
    });
    if (exists) throw new BadRequestException("Already following");

    return this.repo.save({
      follower: { id: currentUserId },
      following: target,
    });
  }

  /**
   * Removes a follow relationship between two users.
   *
   * @param currentUserId The UUID of the user who is performing the unfollow.
   * @param targetId The UUID of the user who is being unfollowed.
   *
   * @throws NotFoundException Thrown if the follow relationship does not exist.
   */
  async unfollow(currentUserId: string, targetId: string) {
    const res = await this.repo.delete({
      follower: { id: currentUserId },
      following: { id: targetId },
    });
    if (!res.affected) throw new NotFoundException("Follow does not exist");
  }

  /**
   * Checks if a user is following another user.
   *
   * @param currentUserId The ID of the user to check if they are following.
   * @param targetId The ID of the user to check if they are being followed.
   *
   * @returns A promise that resolves to a boolean indicating if the user is following the target user.
   */
  isFollowing(currentUserId: string, targetId: string) {
    return this.repo.exist({
      where: { follower: { id: currentUserId }, following: { id: targetId } },
    });
  }
}
