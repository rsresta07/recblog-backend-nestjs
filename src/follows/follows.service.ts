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
  constructor(
    @InjectRepository(Follow) private repo: Repository<Follow>,
    @InjectRepository(User) private users: Repository<User>
  ) {}

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

  async unfollow(currentUserId: string, targetId: string) {
    const res = await this.repo.delete({
      follower: { id: currentUserId },
      following: { id: targetId },
    });
    if (!res.affected) throw new NotFoundException("Follow does not exist");
  }

  isFollowing(currentUserId: string, targetId: string) {
    return this.repo.exist({
      where: { follower: { id: currentUserId }, following: { id: targetId } },
    });
  }
}
