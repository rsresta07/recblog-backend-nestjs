export default function generateSlug(name) {
  const date = new Date();
  const slug = name.replace(/\s+/g, "-").toLowerCase();
  const formattedDate = date
    .toISOString()
    .replace(/[\-\.\:ZT]/g, "")
    .substr(2, 10);
  return `${slug}-${formattedDate}`;
}
