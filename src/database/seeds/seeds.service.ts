import { adminCredential } from "./seeds.data";
import { BcryptService } from "src/auth/bcryptjs/bcrypt.service";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../../user/entities/user.entity";
import { Repository } from "typeorm";
import { UserService } from "../../user/user.service";

@Injectable()
export class SeedsService {
  /**
   * Constructor for SeedsService.
   *
   * Injects the required dependencies.
   *
   * @param userRepo The Repository for User entity.
   * @param userService The service to handle the user operations.
   * @param bcryptService The service to hash and compare passwords.
   */
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly userService: UserService,
    private readonly bcryptService: BcryptService
  ) {}

  /**
   * Seeds the admin user in the database.
   *
   * If the admin user is not present in the database, it will create a new admin user with the provided
   * credentials and hash the password before storing it.
   *
   * If the admin user already exists, it will log a message indicating that the admin user already exists.
   *
   * This function is a good example of how you can seed data in your Nest application.
   */
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
