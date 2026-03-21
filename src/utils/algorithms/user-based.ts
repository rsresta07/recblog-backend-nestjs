import { cosineSimilarity } from "./similarity";

interface RatingMatrix {
  [userId: string]: number[];
}

// Notice the `?` added to preferences, tags, user, and post to make TS happy
export function generateUserRatingMatrix(
  users: { id: string; preferences?: { id: string }[] }[],
  posts: { id: string; tags?: { id: string }[] }[]
): RatingMatrix {
  // Use (p.tags || []) to safely fallback if undefined
  const tagIds = Array.from(
    new Set(posts.flatMap((p) => (p.tags || []).map((t) => t.id)))
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
  users: { id: string }[],
  posts: { id: string }[],
  postLikes: { user?: { id: string }; post?: { id: string } }[],
  comments: { user?: { id: string }; post?: { id: string } }[]
): { [userId: string]: { [postId: string]: number } } {
  const matrix: { [userId: string]: { [postId: string]: number } } = {};

  for (const user of users) matrix[user.id] = {};

  for (const like of postLikes) {
    const userId = like.user?.id;
    const postId = like.post?.id;
    if (userId && postId && matrix[userId]) {
      matrix[userId][postId] = (matrix[userId][postId] || 0) + 2;
    }
  }

  for (const comment of comments) {
    const userId = comment.user?.id;
    const postId = comment.post?.id;
    if (userId && postId && matrix[userId]) {
      matrix[userId][postId] = (matrix[userId][postId] || 0) + 1;
    }
  }

  return matrix;
}

export function predictSimilarUsersByInteractions(
  userId: string,
  matrix: { [userId: string]: { [postId: string]: number } },
  threshold = 0.2
): string[] {
  const targetVector = matrix[userId];
  if (!targetVector) return [];

  const postIds = Array.from(
    new Set(Object.values(matrix).flatMap((m) => Object.keys(m)))
  );
  const getVector = (userMap: { [postId: string]: number }) =>
    postIds.map((postId) => userMap[postId] || 0);

  const targetVec = getVector(targetVector);

  return Object.entries(matrix)
    .filter(([id]) => id !== userId)
    .map(([otherUserId, otherMap]) => {
      return {
        userId: otherUserId,
        score: cosineSimilarity(targetVec, getVector(otherMap)),
      };
    })
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map(({ userId }) => userId);
}
