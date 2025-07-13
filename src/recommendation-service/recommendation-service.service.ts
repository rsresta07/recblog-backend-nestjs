import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Post } from "src/post/entities/post.entity";
import { Tag } from "src/tags/entities/tag.entity";
import { User } from "src/user/entities/user.entity";
import { Repository } from "typeorm";

@Injectable()
export class RecommendationServiceService {
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

  private cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    if (normA === 0 || normB === 0) return 0;
    return dot / (normA * normB);
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
        score: this.cosineSimilarity(userVector, pv.vector),
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
        score: this.cosineSimilarity(userVector, pv.vector),
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
}
