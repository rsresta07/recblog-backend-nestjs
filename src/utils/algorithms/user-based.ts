import { User } from "src/user/entities/user.entity";
import { Post } from "src/post/entities/post.entity";
import { cosineSimilarity } from "./similarity";
import { PostLike } from "src/post/entities/like.entity";
import { Comment } from "src/post/entities/comment.entity";

// Define structure for the user rating matrix, each user maps to a numeric vector
interface RatingMatrix {
  [userId: string]: number[];
}

/**
 * Generate a user rating matrix from given users and posts.
 *
 * @remarks
 * This function generates a matrix of user ratings for each tag, where
 * the user's preferences are used to generate the rating values.
 *
 * @param users The users to generate the matrix for.
 * @param posts The posts to generate the matrix for.
 *
 * @returns A rating matrix, where each key is a user ID and the value is an array
 * of ratings (1 or 0) for each tag in the posts.
 */
export function generateUserRatingMatrix(
  users: User[],
  posts: Post[]
): RatingMatrix {
  // Extract all unique tag IDs from the posts
  const tagIds = Array.from(
    new Set(posts.flatMap((p) => p.tags.map((tag) => tag.id)))
  );

  const tagIndexMap = new Map(tagIds.map((id, i) => [id, i])); // Map each tag ID to its index in the final rating vector

  const matrix: RatingMatrix = {};

  for (const user of users) {
    const vector = Array(tagIds.length).fill(0); // Start with a zero-filled vector of tag length
    for (const tag of user.preferences || []) {
      // Set 1 for tags that the user prefers
      const idx = tagIndexMap.get(tag.id);
      if (idx !== undefined) vector[idx] = 1;
    }
    matrix[user.id] = vector; // Assign vector to the user in the matrix
  }

  return matrix;
}

/**
 * Predict similar users to a given target user ID.
 *
 * @param targetUserId The ID of the target user to find similar users for.
 * @param matrix The rating matrix to use for similarity prediction.
 * @param threshold The cosine similarity threshold to filter predicted users by.
 *
 * @returns An array of user IDs that are similar to the target user based on the given matrix and threshold.
 */
export function predictSimilarUsers(
  targetUserId: string,
  matrix: RatingMatrix,
  threshold = 0.3
): string[] {
  // Get the target user's interaction vector (postId -> weight)
  const targetVector = matrix[targetUserId];
  if (!targetVector) return [];

  return (
    Object.entries(matrix)
      .filter(([userId]) => userId !== targetUserId) // Skip comparing user with themselves
      // Calculate cosine similarity score for each user
      .map(([userId, vector]) => ({
        userId,
        score: cosineSimilarity(targetVector, vector),
      }))
      .filter(({ score }) => score >= threshold) // Filter users with score above threshold
      .sort((a, b) => b.score - a.score) // Sort users by score in descending order
      .map(({ userId }) => userId) // Return only user IDs of similar users
  );
}

/**
 * Generate a user-post interaction matrix.
 *
 * @remarks
 * This function constructs a matrix where each user ID is mapped to an object
 * that contains post IDs and their interaction scores. The interaction score
 * is calculated based on the number of likes and comments a user has on a given
 * post. Likes and comments are assigned different weights, with likes being
 * weighted more heavily.
 *
 * @param users - The list of users to generate the matrix for.
 * @param posts - The list of posts to include in the matrix.
 * @param postLikes - The list of likes on posts, used to calculate interaction scores.
 * @param comments - The list of comments on posts, used to calculate interaction scores.
 *
 * @returns A matrix where each key is a user ID and the value is an object
 * mapping post IDs to interaction scores.
 */
export function generateUserPostInteractionMatrix(
  users: User[],
  posts: Post[],
  postLikes: PostLike[],
  comments: Comment[]
): { [userId: string]: { [postId: string]: number } } {
  const matrix: { [userId: string]: { [postId: string]: number } } = {};

  // Initialize each user's row in the matrix
  for (const user of users) {
    matrix[user.id] = {};
  }

  // Assign +2 for each like (heavier weight)
  for (const like of postLikes) {
    const userId = like.user.id;
    const postId = like.post.id;
    if (matrix[userId]) {
      matrix[userId][postId] = (matrix[userId][postId] || 0) + 2; // Like weight
    }
  }

  // Assign +1 for each comment
  for (const comment of comments) {
    const userId = comment.user.id;
    const postId = comment.post.id;
    if (matrix[userId]) {
      matrix[userId][postId] = (matrix[userId][postId] || 0) + 1; // Comment weight
    }
  }

  return matrix;
}
