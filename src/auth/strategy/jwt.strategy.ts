import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";

import "dotenv/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * Creates an instance of the JWT strategy. This function is called by the Passport library.
   * @param {Object} [options] - The options object.
   * @param {string} [options.jwtFromRequest=ExtractJwt.fromAuthHeaderAsBearerToken] - The function to call to get the JWT from the request.
   * @param {boolean} [options.ignoreExpiration=false] - Whether or not to ignore the JWT's expiration date.
   * @param {string} [options.secretOrKey=process.env.JWT_SECRET || "secret_key"] - The secret or key to use to verify the JWT.
   */
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "secret_key",
    });
  }

  /**
   * This function is called by the Passport library when it needs to validate the JWT.
   * @param {Object} payload - The payload of the JWT.
   * @returns {Promise<Object>} - The validated payload.
   */
  async validate(payload: any) {
    return {
      id: payload.id,
      username: payload.username,
      role: payload.role,
    };
  }
}
