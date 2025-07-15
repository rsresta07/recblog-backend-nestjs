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
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>
  ) {}

  private mapPostToResponse(post: Post) {
    return {
      createdAt: post.createdAt,
      id: post.id,
      title: post.title,
      content: post.content,
      image: post.image,
      slug: post.slug,
      status: post.status,
      // pick tags explicitly
      tags: post.tags.map((tag) => ({
        id: tag.id,
        title: tag.title,
        slug: tag.slug,
        status: tag.status,
      })),
      // pick user fields explicitly
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
      process.env.RECOMMENDATION_MIN_RESULTS || "10"
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
      process.env.RECOMMENDATION_MIN_RESULTS || "10"
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

  async getUserBasedRecommendations(userId: string): Promise<any[]> {
    const users = await this.userRepository.find({
      relations: ["preferences"],
    });
    const posts = await this.postRepository.find({
      where: { status: true },
      relations: ["tags", "user"],
    });

    const matrix = generateUserRatingMatrix(users, posts);
    const similarUsers = predictSimilarUsers(userId, matrix);

    const recommendedPosts = posts.filter(
      (post) => post.user.id !== userId && similarUsers.includes(post.user.id)
    );

    return recommendedPosts.map((post) => this.mapPostToResponse(post));
  }

  // async getInteractionBasedRecommendations(userId: string): Promise<any[]> {
  //   const [users, posts, postLikes, comments] = await Promise.all([
  //     this.userRepository.find(),
  //     this.postRepository.find({
  //       where: { status: true },
  //       relations: ["tags", "user"],
  //     }),
  //     this.postRepository.manager.find(PostLike, {
  //       relations: ["user", "post"],
  //     }),
  //     this.postRepository.manager.find(Comment, {
  //       relations: ["user", "post"],
  //     }),
  //   ]);

  //   const interactionMatrix = generateUserPostInteractionMatrix(
  //     users,
  //     posts,
  //     postLikes,
  //     comments
  //   );

  //   const targetVector = interactionMatrix[userId];
  //   if (!targetVector) return [];

  //   // Build user-post vectors
  //   const scoredPosts = posts
  //     .filter((post) => post.user.id !== userId)
  //     .map((post) => {
  //       let score = 0;
  //       for (const [postId, weight] of Object.entries(targetVector)) {
  //         if (post.id === postId) {
  //           score += weight;
  //         }
  //       }
  //       return { post, score };
  //     })
  //     .filter((sp) => sp.score > 0)
  //     .sort((a, b) => b.score - a.score);

  //   return scoredPosts.map((sp) => this.mapPostToResponse(sp.post));
  // }

  async getCollaborativeInteractionRecommendations(
    userId: string
  ): Promise<any[]> {
    const [users, posts, likes, comments] = await Promise.all([
      this.userRepository.find(),
      this.postRepository.find({
        where: { status: true },
        relations: ["tags", "user"],
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

  async getFinalRecommendations(
    userId: string,
    options?: { minResults?: number }
  ) {
    const SIMILARITY_THRESHOLD = parseFloat(
      process.env.RECOMMENDATION_SIMILARITY_THRESHOLD || "0.33"
    );
    const MIN_RESULTS =
      options?.minResults ||
      parseFloat(process.env.RECOMMENDATION_MIN_RESULTS || "10");

    const [tags, posts, user, users, postLikes, comments] = await Promise.all([
      this.tagRepository.find(),
      this.postRepository.find({
        where: { status: true },
        relations: ["tags", "user"],
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

    // Setup tag vector info
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

    // Tag-based scores
    const tagScores = new Map<string, number>();
    postVectors.forEach(({ post, vector }) => {
      if (post.user.id !== userId) {
        const score = cosineSimilarity(userVector, vector);
        if (score > SIMILARITY_THRESHOLD) {
          tagScores.set(post.id, score);
        }
      }
    });

    // User-based scores
    const ratingMatrix = generateUserRatingMatrix(users, posts);
    const similarUsers = predictSimilarUsers(userId, ratingMatrix);
    const userBasedScores = new Map<string, number>();
    posts.forEach((post) => {
      if (post.user.id !== userId && similarUsers.includes(post.user.id)) {
        userBasedScores.set(post.id, 1);
      }
    });

    // Self interaction scores
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

    // Collaborative interaction scores
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

    // 🔢 Combine all scores
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

    combinedScores.sort((a, b) => b.score - a.score);

    return combinedScores
      .slice(0, MIN_RESULTS)
      .map(({ post }) => this.mapPostToResponse(post));
  }
}

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
