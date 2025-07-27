import * as bcrypt from "bcryptjs";

export class BcryptService {
  private static readonly saltRounds = 7;

  /**
   * Hashes a plain text password using bcrypt with a predefined number of salt rounds.
   *
   * @param password - The plain text password to be hashed.
   * @returns A promise that resolves to the hashed password as a string.
   */
  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BcryptService.saltRounds);
  }

  /**
   * Compares a plain text password with a hashed password using bcrypt.
   *
   * @param unhashed_password - The plain text password to compare.
   * @param hashed_password - The hashed password to compare against.
   * @returns A promise that resolves to a boolean value indicating whether the passwords match.
   */
  async comparePassword(
    unhashed_password: string,
    hashed_password: string
  ): Promise<boolean> {
    return await bcrypt.compare(unhashed_password, hashed_password);
  }
}
