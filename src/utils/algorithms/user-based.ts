import { User } from "src/user/entities/user.entity";
import { Post } from "src/post/entities/post.entity";
import { cosineSimilarity } from "./similarity";
import { PostLike } from "src/post/entities/like.entity";
import { Comment } from "src/post/entities/comment.entity";

interface RatingMatrix {
  [userId: string]: number[];
}

export function generateUserRatingMatrix(
  users: User[],
  posts: Post[]
): RatingMatrix {
  const tagIds = Array.from(
    new Set(posts.flatMap((p) => p.tags.map((tag) => tag.id)))
  );

  const tagIndexMap = new Map(tagIds.map((id, i) => [id, i]));

  const matrix: RatingMatrix = {};

  for (const user of users) {
    const vector = Array(tagIds.length).fill(0);
    for (const tag of user.preferences || []) {
      const idx = tagIndexMap.get(tag.id);
      if (idx !== undefined) vector[idx] = 1;
    }
    matrix[user.id] = vector;
  }

  return matrix;
}

export function predictSimilarUsers(
  targetUserId: string,
  matrix: RatingMatrix,
  threshold = 0.3
): string[] {
  const targetVector = matrix[targetUserId];
  if (!targetVector) return [];

  return Object.entries(matrix)
    .filter(([userId]) => userId !== targetUserId)
    .map(([userId, vector]) => ({
      userId,
      score: cosineSimilarity(targetVector, vector),
    }))
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map(({ userId }) => userId);
}

export function generateUserPostInteractionMatrix(
  users: User[],
  posts: Post[],
  postLikes: PostLike[],
  comments: Comment[]
): { [userId: string]: { [postId: string]: number } } {
  const matrix: { [userId: string]: { [postId: string]: number } } = {};

  for (const user of users) {
    matrix[user.id] = {};
  }

  for (const like of postLikes) {
    const userId = like.user.id;
    const postId = like.post.id;
    if (matrix[userId]) {
      matrix[userId][postId] = (matrix[userId][postId] || 0) + 2; // Like weight
    }
  }

  for (const comment of comments) {
    const userId = comment.user.id;
    const postId = comment.post.id;
    if (matrix[userId]) {
      matrix[userId][postId] = (matrix[userId][postId] || 0) + 1; // Comment weight
    }
  }

  return matrix;
}
