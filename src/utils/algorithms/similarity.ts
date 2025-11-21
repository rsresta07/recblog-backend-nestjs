/**
 * Calculates the cosine similarity between two vectors.
 *
 * @param a - The first vector.
 * @param b - The second vector.
 * @returns The cosine similarity as a number between -1 and 1.
 *          Returns 0 if either vector has a magnitude of zero.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  // Compute the dot product of vectors a and b
  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }

  // Compute the squared sum of vector a
  let sumSquaresA = 0;
  for (let i = 0; i < a.length; i++) {
    sumSquaresA += a[i] * a[i];
  }
  const normA = Math.sqrt(sumSquaresA);

  // Compute the squared sum of vector b
  let sumSquaresB = 0;
  for (let i = 0; i < b.length; i++) {
    sumSquaresB += b[i] * b[i];
  }
  const normB = Math.sqrt(sumSquaresB);

  // Handle the zero vector case
  if (normA === 0 || normB === 0) {
    return 0;
  }

  // Step 5: Compute and return cosine similarity
  const cosineSim = dotProduct / (normA * normB);
  return cosineSim;
}
