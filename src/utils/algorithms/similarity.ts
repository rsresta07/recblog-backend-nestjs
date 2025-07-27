/**
 * Calculates the cosine similarity between two vectors.
 *
 * @param a - The first vector.
 * @param b - The second vector.
 * @returns The cosine similarity as a number between -1 and 1.
 *          Returns 0 if either vector has a magnitude of zero.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  // Compute dot product of vectors a and b
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);

  // Compute the Euclidean norm (magnitude) of vector a and b
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  if (normA === 0 || normB === 0) return 0;
  // Return cosine similarity: dot product divided by product of magnitudes
  return dotProduct / (normA * normB);
}
