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
