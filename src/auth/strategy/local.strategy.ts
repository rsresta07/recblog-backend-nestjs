import { Strategy } from "passport-local";
import { PassportStrategy } from "@nestjs/passport";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { AuthService } from "../auth.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  /**
   * Constructs an instance of LocalStrategy.
   *
   * @param authService - An instance of AuthService used to validate user credentials.
   */
  constructor(private authService: AuthService) {
    super();
  }

  /**
   * Validates the user's credentials.
   *
   * @param username - The username of the user attempting to authenticate.
   * @param password - The password of the user attempting to authenticate.
   * @returns A promise that resolves with the authenticated user object if the credentials are valid.
   * @throws HttpException if the credentials are invalid, with a status of UNAUTHORIZED.
   */
  async validate(username: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(username, password);

    if (!user) {
      throw new HttpException(
        "Username or password incorrect",
        HttpStatus.UNAUTHORIZED
      );
    }
    return user;
  }
}
