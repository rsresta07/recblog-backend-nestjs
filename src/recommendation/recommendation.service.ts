import { Repository } from "typeorm";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Post } from "src/post/entities/post.entity";
import { Tag } from "src/tags/entities/tag.entity";
import { User } from "src/user/entities/user.entity";
import { cosineSimilarity } from "src/utils/algorithms/similarity";
import {
  generateUserPostInteractionMatrix,
  generateUserRatingMatrix,
  predictSimilarUsers,
} from "src/utils/algorithms/user-based";
import { PostLike } from "src/post/entities/like.entity";
import { Comment } from "src/post/entities/comment.entity";

@Injectable()
export class RecommendationService {
  /**
   * Injects the required repositories.
   *
   * @param postRepository The Repository for Post entity.
   * @param userRepository The Repository for User entity.
   * @param tagRepository The Repository for Tag entity.
   */
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>
  ) {}

  private mapPostToResponse(post: Post & { likes?: any[]; comments?: any[] }) {
    return {
      createdAt: post.createdAt,
      id: post.id,
      title: post.title,
      content: post.content,
      image: post.image,
      slug: post.slug,
      status: post.status,
      viewCount: post.viewCount || 0,
      likeCount: post.likes?.length || 0,
      commentCount: post.comments?.length || 0,
      tags: post.tags.map((tag) => ({
        id: tag.id,
        title: tag.title,
        slug: tag.slug,
        status: tag.status,
      })),
      user: {
        id: post.user.id,
        fullName: post.user.fullName,
        slug: post.user.username,
      },
    };
  }

  async getRecommendedPostsForUser(userId: string): Promise<any[]> {
    const SIMILARITY_THRESHOLD = parseFloat(
      process.env.RECOMMENDATION_SIMILARITY_THRESHOLD || "0.33"
    );

    const tags = await this.tagRepository.find();
    const tagUsageMap = new Map<string, number>();

    const tagIndexMap = new Map(
      tags.map((tag, index) => {
        tagUsageMap.set(tag.id, 0);
        return [tag.id, index];
      })
    );

    const vectorLength = tags.length;

    const posts = await this.postRepository.find({
      where: { status: true },
      relations: ["tags", "user", "likes", "comments"],
    });

    posts.forEach((post) => {
      post.tags.forEach((tag) => {
        tagUsageMap.set(tag.id, (tagUsageMap.get(tag.id) || 0) + 1);
      });
    });

    const postVectors = posts.map((post) => {
      const vector = Array(vectorLength).fill(0);
      post.tags.forEach((tag) => {
        const idx = tagIndexMap.get(tag.id);
        const usage = tagUsageMap.get(tag.id) || 1;
        if (idx !== undefined) vector[idx] = 1 / Math.log(1 + usage);
      });
      return { post, vector };
    });

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["preferences"],
    });

    if (!user) return [];

    const userVector = Array(vectorLength).fill(0);
    user.preferences.forEach((tag) => {
      const idx = tagIndexMap.get(tag.id);
      const usage = tagUsageMap.get(tag.id) || 1;
      if (idx !== undefined) userVector[idx] = 1 / Math.log(1 + usage);
    });

    const MIN_RESULTS = parseFloat(
      process.env.RECOMMENDATION_MIN_RESULTS || "100"
    );

    let scoredPosts = postVectors
      .filter((pv) => pv.post.user.id !== userId)
      .map((pv) => ({
        post: pv.post,
        score: cosineSimilarity(userVector, pv.vector),
      }));

    const filtered = scoredPosts.filter(
      (sp) => sp.score > SIMILARITY_THRESHOLD
    );

    if (filtered.length >= MIN_RESULTS) {
      scoredPosts = filtered;
    } else {
      scoredPosts = scoredPosts
        .filter((sp) => sp.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, MIN_RESULTS);
    }

    console.log(
      "DEBUG scores:",
      scoredPosts.map((sp) => ({
        slug: sp.post.slug,
        score: sp.score,
      }))
    );

    return scoredPosts.map((sp) => this.mapPostToResponse(sp.post));
  }

  /**
   * Retrieves raw recommended posts for a user based on tag preferences and cosine similarity.
   *
   * @param userId - The ID of the user for whom to retrieve recommended posts.
   * @returns A promise that resolves to an array of posts that are recommended for the user.
   *
   * This function calculates a similarity score between the user's tag preferences and the tags of available posts.
   * It uses a cosine similarity threshold to filter and rank the posts, returning those that exceed the threshold.
   * The function also ensures that a minimum number of results is provided by adjusting the filtering if necessary.
   */
  async getRawRecommendedPostsForUser(userId: string): Promise<Post[]> {
    const SIMILARITY_THRESHOLD = parseFloat(
      process.env.RECOMMENDATION_SIMILARITY_THRESHOLD || "0.33"
    );

    const tags = await this.tagRepository.find();
    const tagUsageMap = new Map<string, number>();

    const tagIndexMap = new Map(
      tags.map((tag, index) => {
        tagUsageMap.set(tag.id, 0);
        return [tag.id, index];
      })
    );

    const vectorLength = tags.length;

    const posts = await this.postRepository.find({
      where: { status: true },
      relations: ["tags", "user"],
    });

    posts.forEach((post) => {
      post.tags.forEach((tag) => {
        tagUsageMap.set(tag.id, (tagUsageMap.get(tag.id) || 0) + 1);
      });
    });

    const postVectors = posts.map((post) => {
      const vector = Array(vectorLength).fill(0);
      post.tags.forEach((tag) => {
        const idx = tagIndexMap.get(tag.id);
        const usage = tagUsageMap.get(tag.id) || 1;
        if (idx !== undefined) vector[idx] = 1 / Math.log(1 + usage);
      });
      return { post, vector };
    });

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["preferences"],
    });

    if (!user) return [];

    const userVector = Array(vectorLength).fill(0);
    user.preferences.forEach((tag) => {
      const idx = tagIndexMap.get(tag.id);
      const usage = tagUsageMap.get(tag.id) || 1;
      if (idx !== undefined) userVector[idx] = 1 / Math.log(1 + usage);
    });

    const MIN_RESULTS = parseFloat(
      process.env.RECOMMENDATION_MIN_RESULTS || "100"
    );

    let scoredPosts = postVectors
      .filter((pv) => pv.post.user.id !== userId)
      .map((pv) => ({
        post: pv.post,
        score: cosineSimilarity(userVector, pv.vector),
      }));

    const filtered = scoredPosts.filter(
      (sp) => sp.score > SIMILARITY_THRESHOLD
    );

    if (filtered.length >= MIN_RESULTS) {
      scoredPosts = filtered;
    } else {
      scoredPosts = scoredPosts
        .filter((sp) => sp.score > 0)
        .sort((a, b) => b.score - a.score);
      // .slice(0, 10);
    }

    return scoredPosts.map((sp) => sp.post);
  }

  /**
   * Generates a list of user-based recommended posts for a given user ID.
   *
   * @remarks
   * This method retrieves all users and their preferences, as well as all active posts.
   * It generates a user rating matrix and predicts similar users based on the given user ID.
   * The posts created by these similar users are filtered and returned as recommendations.
   *
   * @param userId - The ID of the user for whom to generate recommendations.
   *
   * @returns A promise that resolves to an array of response objects, each representing a recommended post
   * for the user, excluding posts authored by the user themselves.
   */
  async getUserBasedRecommendations(userId: string): Promise<any[]> {
    const users = await this.userRepository.find({
      relations: ["preferences"],
    });

    const posts = await this.postRepository.find({
      where: { status: true },
      relations: ["tags", "user", "likes", "comments"],
    });

    const matrix = generateUserRatingMatrix(users, posts);
    const similarUsers = predictSimilarUsers(userId, matrix);

    const recommendedPosts = posts.filter(
      (post) => post.user.id !== userId && similarUsers.includes(post.user.id)
    );

    return recommendedPosts.map((post) => this.mapPostToResponse(post));
  }

  /**
   * Generates a list of posts that are recommended to a user based on the posts
   * interacted with by similar users.
   *
   * @remarks
   * This method first generates a matrix of user-post interactions, then
   * predicts similar users to the given user ID. It then finds the posts
   * that are interacted with by these similar users, and assigns a score
   * to each post based on the number of similar users that have interacted
   * with it. The posts are then sorted by score and returned as an array
   * of response objects.
   *
   * @param userId - The ID of the user for whom to generate recommendations.
   *
   * @returns A promise that resolves to an array of response objects, each
   * representing a recommended post for the user, excluding posts authored by
   * the user themselves.
   */
  async getCollaborativeInteractionRecommendations(
    userId: string
  ): Promise<any[]> {
    const [users, posts, likes, comments] = await Promise.all([
      this.userRepository.find(),
      await this.postRepository.find({
        where: { status: true },
        relations: ["tags", "user", "likes", "comments"],
      }),
      this.postRepository.manager.find(PostLike, {
        relations: ["user", "post"],
      }),
      this.postRepository.manager.find(Comment, {
        relations: ["user", "post"],
      }),
    ]);

    const matrix = generateUserPostInteractionMatrix(
      users,
      posts,
      likes,
      comments
    );
    const similarUsers = predictSimilarUsersByInteractions(userId, matrix);

    if (!matrix[userId]) return [];

    const interactedByUser = new Set(Object.keys(matrix[userId]));

    const recommendedPosts: Map<string, number> = new Map();

    for (const similarUserId of similarUsers) {
      const simUserInteractions = matrix[similarUserId] || {};
      for (const [postId, score] of Object.entries(simUserInteractions)) {
        if (!interactedByUser.has(postId)) {
          recommendedPosts.set(
            postId,
            (recommendedPosts.get(postId) || 0) + score
          );
        }
      }
    }

    const scoredPosts = Array.from(recommendedPosts.entries())
      .map(([postId, score]) => ({
        post: posts.find((p) => p.id === postId),
        score,
      }))
      .filter(({ post }) => post !== undefined)
      .sort((a, b) => b.score - a.score);

    return scoredPosts.map(({ post }) => this.mapPostToResponse(post!));
  }

  /**
   * Retrieves a list of recommended posts for the given user ID.
   *
   * This method uses a combination of tag-based, user-based, and interaction-based
   * scores to rank posts. The scores are combined using a weighted sum, and the
   * top-scoring posts are returned.
   *
   * The scoring weights are as follows:
   * - Tag-based score: 0.4
   * - User-based score: 0.2
   * - Interaction score: 0.2
   * - Collaborative interaction score: 0.2
   *
   * The method also takes an optional `minResults` parameter, which specifies the
   * minimum number of results to return. If there are fewer than `minResults`
   * posts with non-zero scores, the method will return all of them.
   *
   * @param userId The ID of the user to generate recommendations for.
   * @param options An options object with a single property, `minResults`, which
   * specifies the minimum number of results to return.
   * @returns A list of recommended posts, sorted by score in descending order.
   */
  async getFinalRecommendations(
    userId: string,
    options?: { minResults?: number }
  ) {
    const SIMILARITY_THRESHOLD = parseFloat(
      process.env.RECOMMENDATION_SIMILARITY_THRESHOLD || "0.33"
    );
    const MIN_RESULTS =
      options?.minResults ||
      parseFloat(process.env.RECOMMENDATION_MIN_RESULTS || "100");

    const [tags, posts, user, users, postLikes, comments] = await Promise.all([
      this.tagRepository.find(),
      await this.postRepository.find({
        where: { status: true },
        relations: ["tags", "user", "likes", "comments"],
      }),
      this.userRepository.findOne({
        where: { id: userId },
        relations: ["preferences"],
      }),
      this.userRepository.find({ relations: ["preferences"] }),
      this.postRepository.manager.find(PostLike, {
        relations: ["user", "post"],
      }),
      this.postRepository.manager.find(Comment, {
        relations: ["user", "post"],
      }),
    ]);

    if (!user) return [];

    const tagUsageMap = new Map<string, number>();
    const tagIndexMap = new Map(
      tags.map((tag, index) => {
        tagUsageMap.set(tag.id, 0);
        return [tag.id, index];
      })
    );
    const vectorLength = tags.length;

    posts.forEach((post) => {
      post.tags.forEach((tag) => {
        tagUsageMap.set(tag.id, (tagUsageMap.get(tag.id) || 0) + 1);
      });
    });

    const userVector = Array(vectorLength).fill(0);
    user.preferences.forEach((tag) => {
      const idx = tagIndexMap.get(tag.id);
      const usage = tagUsageMap.get(tag.id) || 1;
      if (idx !== undefined) userVector[idx] = 1 / Math.log(1 + usage);
    });

    const postVectors = posts.map((post) => {
      const vector = Array(vectorLength).fill(0);
      post.tags.forEach((tag) => {
        const idx = tagIndexMap.get(tag.id);
        const usage = tagUsageMap.get(tag.id) || 1;
        if (idx !== undefined) vector[idx] = 1 / Math.log(1 + usage);
      });
      return { post, vector };
    });

    const tagScores = new Map<string, number>();
    postVectors.forEach(({ post, vector }) => {
      if (post.user.id !== userId) {
        const score = cosineSimilarity(userVector, vector);
        if (score > SIMILARITY_THRESHOLD) {
          tagScores.set(post.id, score);
        }
      }
    });

    const ratingMatrix = generateUserRatingMatrix(users, posts);
    const similarUsers = predictSimilarUsers(userId, ratingMatrix);
    const userBasedScores = new Map<string, number>();
    posts.forEach((post) => {
      if (post.user.id !== userId && similarUsers.includes(post.user.id)) {
        userBasedScores.set(post.id, 1);
      }
    });

    const interactionMatrix = generateUserPostInteractionMatrix(
      users,
      posts,
      postLikes,
      comments
    );
    const userInteractions = interactionMatrix[userId] || {};
    const interactionScores = new Map<string, number>();
    Object.entries(userInteractions).forEach(([postId, score]) => {
      interactionScores.set(postId, score);
    });

    const collabScores = new Map<string, number>();
    const similarUsersByInteraction = predictSimilarUsersByInteractions(
      userId,
      interactionMatrix
    );
    const interactedByUser = new Set(Object.keys(userInteractions));

    for (const similarUserId of similarUsersByInteraction) {
      const simMap = interactionMatrix[similarUserId] || {};
      for (const [postId, score] of Object.entries(simMap)) {
        if (!interactedByUser.has(postId)) {
          collabScores.set(postId, (collabScores.get(postId) || 0) + score);
        }
      }
    }

    const WEIGHTS = {
      tag: 0.4,
      userBased: 0.2,
      interaction: 0.2,
      collabInteraction: 0.2,
    };

    const allPostIds = new Set([
      ...tagScores.keys(),
      ...userBasedScores.keys(),
      ...interactionScores.keys(),
      ...collabScores.keys(),
    ]);

    const combinedScores = [];
    for (const postId of allPostIds) {
      const tagScore = tagScores.get(postId) || 0;
      const userScore = userBasedScores.get(postId) || 0;
      const interactionScore = interactionScores.get(postId) || 0;
      const collabScore = collabScores.get(postId) || 0;

      const totalScore =
        WEIGHTS.tag * tagScore +
        WEIGHTS.userBased * userScore +
        WEIGHTS.interaction * interactionScore +
        WEIGHTS.collabInteraction * collabScore;

      const post = posts.find((p) => p.id === postId);
      if (post && totalScore > 0) {
        combinedScores.push({ post, score: totalScore });
      }
    }

    // Sort and dedupe
    combinedScores.sort((a, b) => b.score - a.score);

    const seen = new Set<string>();
    const deduped: { post: Post; score: number }[] = [];

    // First, add all similarity-based recommendations
    const similarityPosts = Array.from(tagScores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([postId, score]) => ({
        post: posts.find((p) => p.id === postId)!,
        score,
      }))
      .filter((item) => item.post);

    // Add all similarity posts first
    for (const item of similarityPosts) {
      if (!seen.has(item.post.id)) {
        seen.add(item.post.id);
        deduped.push(item);
      }
    }

    // Then add other recommendations that aren't already included
    for (const entry of combinedScores) {
      if (!seen.has(entry.post.id)) {
        seen.add(entry.post.id);
        deduped.push(entry);
      }
    }

    // Fallback fill: use high-scoring posts if needed
    if (deduped.length < MIN_RESULTS) {
      const remainingPosts = posts
        .filter((post) => post.user.id !== userId && !seen.has(post.id))
        .map((post) => ({
          post,
          score: 0, // These are fallback posts with minimum score
        }))
        .sort(
          (a, b) =>
            (b.post.createdAt?.getTime() || 0) -
            (a.post.createdAt?.getTime() || 0)
        );

      for (const fb of remainingPosts) {
        if (deduped.length >= MIN_RESULTS) break;
        deduped.push(fb);
      }
    }

    return deduped.map(({ post }) => this.mapPostToResponse(post));
  }

  async getRecommendationsBasedOnCurrentPostTags(
    userId: string,
    postTagIds: string[],
    currentPostId: string
  ): Promise<any[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["preferences"],
    });

    if (!user) return [];

    const userPreferredTagIds = new Set(user.preferences.map((tag) => tag.id));
    const matchedTagIds = postTagIds.filter((tagId) =>
      userPreferredTagIds.has(tagId)
    );

    if (!matchedTagIds.length) return [];

    // Query 1: Posts matching user-preferred tags
    const tagMatchedPosts = await this.postRepository
      .createQueryBuilder("post")
      .leftJoinAndSelect("post.tags", "tag")
      .leftJoinAndSelect("post.user", "user")
      .leftJoinAndSelect("post.likes", "likes")
      .leftJoinAndSelect("post.comments", "comments")
      .where("post.status = :status", { status: true })
      .andWhere("user.id != :userId", { userId })
      .andWhere(
        `post.id IN (
        SELECT pt.post_id
        FROM post_tag pt
        WHERE pt.tag_id IN (:...matchedTagIds)
      )`,
        { matchedTagIds }
      )
      .andWhere("post.id != :currentPostId", { currentPostId })
      .orderBy("post.createdAt", "DESC")
      .limit(10)
      .getMany();

    const mappedTagPosts = tagMatchedPosts.map((post) =>
      this.mapPostToResponse(post)
    );

    if (mappedTagPosts.length >= 10) return mappedTagPosts;

    const remainingCount = 10 - mappedTagPosts.length;

    // Query 2: Fallback posts excluding matched + current
    const fallbackPosts = await this.postRepository
      .createQueryBuilder("post")
      .leftJoinAndSelect("post.tags", "tag")
      .leftJoinAndSelect("post.user", "user")
      .leftJoinAndSelect("post.likes", "likes")
      .leftJoinAndSelect("post.comments", "comments")
      .where("post.status = :status", { status: true })
      .andWhere("user.id != :userId", { userId })
      .andWhere("post.id != :currentPostId", { currentPostId })
      .andWhere("post.id NOT IN (:...existingIds)", {
        existingIds: tagMatchedPosts.map((p) => p.id),
      })
      .orderBy("post.createdAt", "DESC")
      .limit(remainingCount)
      .getMany();

    const mappedFallback = fallbackPosts.map((post) =>
      this.mapPostToResponse(post)
    );

    console.log("Fallback posts:", mappedFallback.length);

    const totalSoFar = mappedTagPosts.length + mappedFallback.length;

    if (totalSoFar >= 10) return [...mappedTagPosts, ...mappedFallback];

    const extraPosts = await this.postRepository
      .createQueryBuilder("post")
      .leftJoinAndSelect("post.tags", "tag")
      .leftJoinAndSelect("post.user", "user")
      .leftJoinAndSelect("post.likes", "likes")
      .leftJoinAndSelect("post.comments", "comments")
      .where("post.status = :status", { status: true })
      .andWhere("post.id != :currentPostId", { currentPostId })
      .andWhere("post.id NOT IN (:...excludedIds)", {
        excludedIds: [
          ...tagMatchedPosts.map((p) => p.id),
          ...fallbackPosts.map((p) => p.id),
        ],
      })
      .orderBy("post.createdAt", "DESC")
      .limit(10 - totalSoFar)
      .getMany();

    const mappedExtra = extraPosts.map((post) => this.mapPostToResponse(post));

    return [...mappedTagPosts, ...mappedFallback, ...mappedExtra];
  }
}

/**
 * Predicts similar users based on interaction data.
 *
 * @param userId - The ID of the user for whom to find similar users.
 * @param matrix - A user-post interaction matrix where each key is a user ID
 * and the value is an object mapping post IDs to interaction scores.
 * @param threshold - The minimum cosine similarity score required to consider
 * users as similar. Defaults to 0.2.
 *
 * @returns An array of user IDs that are similar to the given user ID based on
 * their interactions, filtered by the specified similarity threshold.
 */
function predictSimilarUsersByInteractions(
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
      const otherVec = getVector(otherMap);
      return {
        userId: otherUserId,
        score: cosineSimilarity(targetVec, otherVec),
      };
    })
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map(({ userId }) => userId);
}
