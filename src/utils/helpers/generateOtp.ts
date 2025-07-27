/**
 * Generates a 6-digit OTP by combining the current timestamp in milliseconds
 * with a random 6-digit number, and then taking the last 6 digits.
 *
 * @returns A 6-digit OTP.
 */
export const generateOTP = (): number => {
  // Get the current timestamp in milliseconds
  const timestamp = Date.now();

  // Generate a random number between 100000 and 999999 (6 digits)
  const randomNum = Math.floor(100000 + Math.random() * 900000);

  // Combine the timestamp and random number
  const combinedString = `${timestamp}${randomNum}`;

  // Get the last 6 digits of the combined string
  const otp = combinedString.slice(-6);

  return Number(otp);
};
