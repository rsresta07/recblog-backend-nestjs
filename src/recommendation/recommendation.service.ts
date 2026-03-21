import { Repository, In } from "typeorm";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Post } from "src/post/entities/post.entity";
import { User } from "src/user/entities/user.entity";
import { PostLike } from "src/post/entities/like.entity";
import { Comment } from "src/post/entities/comment.entity";
import { cosineSimilarity } from "src/utils/algorithms/similarity";
import {
  generateUserPostInteractionMatrix,
  generateUserRatingMatrix,
  predictSimilarUsers,
  predictSimilarUsersByInteractions,
} from "src/utils/algorithms/user-based";

@Injectable()
export class RecommendationService {
  constructor(
    @InjectRepository(Post) private postRepository: Repository<Post>,
    @InjectRepository(User) private userRepository: Repository<User>
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
      tags:
        post.tags?.map((tag) => ({
          id: tag.id,
          title: tag.title,
          slug: tag.slug,
          status: tag.status,
        })) || [],
      user: {
        id: post.user?.id,
        fullName: post.user?.fullName,
        slug: post.user?.username,
      },
    };
  }

  async getFinalRecommendations(
    userId: string,
    options?: { minResults?: number; page?: number; limit?: number }
  ) {
    const SIMILARITY_THRESHOLD = parseFloat(
      process.env.RECOMMENDATION_SIMILARITY_THRESHOLD || "0.33"
    );
    const MIN_RESULTS =
      options?.minResults ||
      parseFloat(process.env.RECOMMENDATION_MIN_RESULTS || "100");
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    // OPTIMIZATION: Fetch lightweight ID-only representations to save heavy TypeORM hydration time
    const [postsLight, usersLight, postLikesLight, commentsLight] =
      await Promise.all([
        this.postRepository
          .createQueryBuilder("post")
          .leftJoin("post.tags", "tag")
          .leftJoin("post.user", "user")
          .select(["post.id", "post.createdAt", "user.id", "tag.id"])
          .where("post.status = :status", { status: true })
          .getMany(),

        this.userRepository
          .createQueryBuilder("user")
          .leftJoin("user.preferences", "pref")
          .select(["user.id", "pref.id"])
          .getMany(),

        this.postRepository.manager
          .createQueryBuilder(PostLike, "like")
          .leftJoin("like.user", "user")
          .leftJoin("like.post", "post")
          .select(["user.id", "post.id"])
          .getMany(),

        this.postRepository.manager
          .createQueryBuilder(Comment, "comment")
          .leftJoin("comment.user", "user")
          .leftJoin("comment.post", "post")
          .select(["user.id", "post.id"])
          .getMany(),
      ]);

    const user = usersLight.find((u) => u.id === userId);
    if (!user) return { data: [], total: 0, page, limit, totalPages: 0 };

    // Create unique list of tags from posts
    const tagIdsSet = new Set<string>();
    postsLight.forEach((p) => p.tags.forEach((t) => tagIdsSet.add(t.id)));
    const tagsArray = Array.from(tagIdsSet);

    const tagUsageMap = new Map<string, number>();
    const tagIndexMap = new Map(
      tagsArray.map((id, index) => {
        tagUsageMap.set(id, 0);
        return [id, index];
      })
    );
    const vectorLength = tagsArray.length;

    postsLight.forEach((post) => {
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

    const postVectors = postsLight.map((post) => {
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
        if (score > SIMILARITY_THRESHOLD) tagScores.set(post.id, score);
      }
    });

    const ratingMatrix = generateUserRatingMatrix(usersLight, postsLight);
    const similarUsers = predictSimilarUsers(userId, ratingMatrix);
    const userBasedScores = new Map<string, number>();
    postsLight.forEach((post) => {
      if (post.user.id !== userId && similarUsers.includes(post.user.id)) {
        userBasedScores.set(post.id, 1);
      }
    });

    const interactionMatrix = generateUserPostInteractionMatrix(
      usersLight,
      postsLight,
      postLikesLight,
      commentsLight
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
      const totalScore =
        WEIGHTS.tag * (tagScores.get(postId) || 0) +
        WEIGHTS.userBased * (userBasedScores.get(postId) || 0) +
        WEIGHTS.interaction * (interactionScores.get(postId) || 0) +
        WEIGHTS.collabInteraction * (collabScores.get(postId) || 0);

      const post = postsLight.find((p) => p.id === postId);
      if (post && totalScore > 0 && post.user.id !== userId) {
        combinedScores.push({ post, score: totalScore });
      }
    }

    combinedScores.sort((a, b) => b.score - a.score);

    const seen = new Set<string>();
    const deduped: { id: string; score: number }[] = [];

    // Push similarity posts
    Array.from(tagScores.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([postId, score]) => {
        if (!seen.has(postId)) {
          seen.add(postId);
          deduped.push({ id: postId, score });
        }
      });

    // Push combined scored posts
    for (const entry of combinedScores) {
      if (!seen.has(entry.post.id)) {
        seen.add(entry.post.id);
        deduped.push({ id: entry.post.id, score: entry.score });
      }
    }

    // Fallback logic
    if (deduped.length < MIN_RESULTS) {
      const remainingPosts = postsLight
        .filter((post) => post.user.id !== userId && !seen.has(post.id))
        .sort(
          (a, b) =>
            (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
        );

      for (const fb of remainingPosts) {
        if (deduped.length >= MIN_RESULTS) break;
        deduped.push({ id: fb.id, score: 0 });
      }
    }

    const total = deduped.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedIds = deduped.slice(skip, skip + limit).map((d) => d.id);

    // OPTIMIZATION: Only fetch FULL entities for the paginated slice
    let finalData = [];
    if (paginatedIds.length > 0) {
      const fullPosts = await this.postRepository.find({
        where: { id: In(paginatedIds) },
        relations: ["tags", "user", "likes", "comments"],
      });

      // Maintain sorted order
      const postMap = new Map(fullPosts.map((p) => [p.id, p]));
      finalData = paginatedIds.map((id) => postMap.get(id)).filter((p) => !!p);
    }

    return {
      data: finalData.map((post) => this.mapPostToResponse(post as any)),
      total,
      page,
      limit,
      totalPages,
    };
  }
}
