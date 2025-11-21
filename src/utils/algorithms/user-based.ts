import { User } from "src/user/entities/user.entity";
import { Post } from "src/post/entities/post.entity";
import { cosineSimilarity } from "./similarity";
import { PostLike } from "src/post/entities/like.entity";
import { Comment } from "src/post/entities/comment.entity";

// Define structure for the user rating matrix, each user maps to a numeric vector
interface RatingMatrix {
  [userId: string]: number[];
}

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
