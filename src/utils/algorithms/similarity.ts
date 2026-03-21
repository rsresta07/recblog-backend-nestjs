export function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let sumSquaresA = 0;
  let sumSquaresB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    sumSquaresA += a[i] * a[i];
    sumSquaresB += b[i] * b[i];
  }

  const normA = Math.sqrt(sumSquaresA);
  const normB = Math.sqrt(sumSquaresB);

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
}
