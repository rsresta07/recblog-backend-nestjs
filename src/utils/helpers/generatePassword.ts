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
