/**
 * Generates a slug from a given string.
 *
 * @param {string} name The string to convert to a slug.
 * @returns {string} The generated slug.
 *
 * @example
 * generateSlug("This is a test") // "this-is-a-test-1711011111"
 */
export default function generateSlug(name) {
  const date = new Date();
  const slug = name.replace(/\s+/g, "-").toLowerCase();
  const formattedDate = date
    .toISOString()
    .replace(/[\-\.\:ZT]/g, "")
    .substr(2, 10);
  return `${slug}-${formattedDate}`;
}
