import { adminCredential } from "./seeds.data";
import { BcryptService } from "src/auth/bcryptjs/bcrypt.service";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../../user/entities/user.entity";
import { Repository } from "typeorm";
import { UserService } from "../../user/user.service"; // you already imported this in your module

@Injectable()
export class SeedsService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly userService: UserService,
    private readonly bcryptService: BcryptService
  ) {}

  async seedAdminData() {
    const existing = await this.userRepo.findOne({
      where: { username: adminCredential.username },
    });

    if (!existing) {
      const hashedPassword = await this.bcryptService.hashPassword(
        adminCredential.password
      );
      const adminUser = this.userRepo.create({
        ...adminCredential,
        password: hashedPassword,
      });
      await this.userRepo.save(adminUser);
      console.log("✅ Admin user seeded");
    } else {
      console.log("⚠️ Admin user already exists");
    }
  }
}
