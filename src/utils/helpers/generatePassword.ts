/**
 * Generates a password based on the given username and contact.
 *
 * The password is constructed by:
 *  1. taking the first name from the username
 *  2. taking the first letter of the first name and capitalizing it
 *  3. taking the remaining letters of the first name
 *  4. taking the last four digits of the contact
 *  5. concatenating the results of steps 2-4
 *
 * @param {string} username The username to use
 * @param {string} contact The contact to use
 * @returns {string} The generated password
 */
export default function generatePassword(username, contact) {
  if (!username || !contact || contact.length < 4) {
    throw new Error("Invalid username or contact");
  }

  const firstName = username.split(" ")[0];
  const capitalLetter = firstName.charAt(0).toUpperCase();
  const otherLetters = firstName.split(" ")[0].slice(1);

  const lastFourDigits = contact.slice(-4);

  return `@${capitalLetter}${otherLetters}${lastFourDigits}`;
}
