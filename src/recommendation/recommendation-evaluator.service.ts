// src/recommendation/recommendation-evaluator.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RecommendationService } from "./recommendation.service";
import { User } from "src/user/entities/user.entity";
import { Post } from "src/post/entities/post.entity";
import { PostLike } from "src/post/entities/like.entity";
import { Tag } from "src/tags/entities/tag.entity";
import { Comment } from "src/post/entities/comment.entity";

type Metrics = {
  precision: Record<string, number>;
  recall: Record<string, number>;
  hitRate: Record<string, number>;
  mrr: Record<string, number>;
  map: Record<string, number>;
  ndcg: Record<string, number>;
  coverage: Record<string, number>;
  avgPopularity: Record<string, number>;
  diversity: Record<string, number>;
  usersEvaluated: number;
};

@Injectable()
export class RecommendationEvaluatorService {
  private readonly logger = new Logger(RecommendationEvaluatorService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(PostLike) private likeRepo: Repository<PostLike>,
    @InjectRepository(Comment) private commentRepo: Repository<Comment>,
    @InjectRepository(Tag) private tagRepo: Repository<Tag>,
    private recommendationService: RecommendationService
  ) {}

  async evaluate(options?: {
    ks?: number[];
    userIds?: string[];
    minInteractions?: number;
  }): Promise<Record<string, Metrics>> {
    const ks = options?.ks ?? [5, 10, 20];
    const minInteractions = options?.minInteractions ?? 1;

    const users = options?.userIds
      ? await this.userRepo.findByIds(options.userIds)
      : await this.userRepo.find();

    const [likes, comments] = await Promise.all([
      this.likeRepo.find({ relations: ["user", "post"] }),
      this.commentRepo.find({ relations: ["user", "post"] }),
    ]);

    const userInteractions = new Map<string, Set<string>>();
    for (const l of likes) {
      if (!userInteractions.has(l.user.id))
        userInteractions.set(l.user.id, new Set());
      userInteractions.get(l.user.id)!.add(l.post.id);
    }
    for (const c of comments) {
      if (!userInteractions.has(c.user.id))
        userInteractions.set(c.user.id, new Set());
      userInteractions.get(c.user.id)!.add(c.post.id);
    }

    const postInteractionCount = new Map<string, number>();
    for (const p of await this.postRepo.find({
      relations: ["likes", "comments"],
    })) {
      const count = (p.likes?.length || 0) + (p.comments?.length || 0);
      postInteractionCount.set(p.id, count);
    }

    const tags = await this.tagRepo.find();
    const tagIndex = new Map(tags.map((t, i) => [t.id, i]));
    const posts = await this.postRepo.find({ relations: ["tags"] });
    const postTagVectors = new Map<string, number[]>();
    for (const p of posts) {
      const v = Array(tags.length).fill(0);
      for (const t of p.tags || []) {
        const idx = tagIndex.get(t.id);
        if (idx !== undefined) v[idx] = 1;
      }
      postTagVectors.set(p.id, v);
    }

    // Only the two algorithms we care about
    const algos = {
      cosineBased: async (userId: string, k: number) =>
        (
          await this.recommendationService.getRawRecommendedPostsForUser(userId)
        ).slice(0, k),
      userBased: async (userId: string, k: number) =>
        (
          await this.recommendationService.getUserBasedRecommendations(userId)
        ).slice(0, k),
    };

    const results: Record<string, Metrics> = {};
    for (const algoName of Object.keys(algos)) {
      results[algoName] = {
        precision: {},
        recall: {},
        hitRate: {},
        mrr: {},
        map: {},
        ndcg: {},
        coverage: {},
        avgPopularity: {},
        diversity: {},
        usersEvaluated: 0,
      };
    }

    const precisionAtK = (pred: string[], truth: Set<string>, k: number) =>
      k === 0 ? 0 : pred.slice(0, k).filter((id) => truth.has(id)).length / k;

    const recallAtK = (pred: string[], truth: Set<string>, k: number) =>
      truth.size === 0
        ? 0
        : pred.slice(0, k).filter((id) => truth.has(id)).length / truth.size;

    const hitRateAtK = (pred: string[], truth: Set<string>, k: number) =>
      pred.slice(0, k).some((id) => truth.has(id)) ? 1 : 0;

    const rrAtK = (pred: string[], truth: Set<string>, k: number) => {
      const topk = pred.slice(0, k);
      for (let i = 0; i < topk.length; i++)
        if (truth.has(topk[i])) return 1 / (i + 1);
      return 0;
    };

    const apk = (pred: string[], truth: Set<string>, k: number) => {
      let score = 0,
        hits = 0;
      const topk = pred.slice(0, k);
      for (let i = 0; i < topk.length; i++) {
        if (truth.has(topk[i])) {
          hits++;
          score += hits / (i + 1);
        }
      }
      return hits === 0 ? 0 : score / Math.min(truth.size, k);
    };

    const dcgAtK = (pred: string[], truth: Set<string>, k: number) =>
      pred
        .slice(0, k)
        .reduce(
          (acc, id, i) =>
            acc + (truth.has(id) ? (Math.pow(2, 1) - 1) / Math.log2(i + 2) : 0),
          0
        );

    const idcgAtK = (truthSize: number, k: number) => {
      const rels = Math.min(truthSize, k);
      let idcg = 0;
      for (let i = 0; i < rels; i++)
        idcg += (Math.pow(2, 1) - 1) / Math.log2(i + 2);
      return idcg;
    };

    const ndcgAtK = (pred: string[], truth: Set<string>, k: number) => {
      const idcg = idcgAtK(truth.size, k);
      return idcg === 0 ? 0 : dcgAtK(pred, truth, k) / idcg;
    };

    const cosine = (a: number[], b: number[]) => {
      let na = 0,
        nb = 0,
        dot = 0;
      for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
      }
      return na === 0 || nb === 0 ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
    };

    const usersToEval = users.filter(
      (u) => (userInteractions.get(u.id)?.size || 0) >= minInteractions
    );

    for (const algoName of Object.keys(algos)) {
      const metricsAcc = {
        precision: new Map<number, number>(),
        recall: new Map<number, number>(),
        hitRate: new Map<number, number>(),
        mrr: new Map<number, number>(),
        map: new Map<number, number>(),
        ndcg: new Map<number, number>(),
        coverageSet: new Set<string>(),
        popularitySum: new Map<number, number>(),
        diversitySum: new Map<number, number>(),
        counts: new Map<number, number>(),
      };

      ks.forEach((k) => {
        metricsAcc.precision.set(k, 0);
        metricsAcc.recall.set(k, 0);
        metricsAcc.hitRate.set(k, 0);
        metricsAcc.mrr.set(k, 0);
        metricsAcc.map.set(k, 0);
        metricsAcc.ndcg.set(k, 0);
        metricsAcc.popularitySum.set(k, 0);
        metricsAcc.diversitySum.set(k, 0);
        metricsAcc.counts.set(k, 0);
      });

      let usersEvaluated = 0;

      for (const user of usersToEval) {
        const truth = userInteractions.get(user.id) || new Set<string>();
        const recommendFn = algos[algoName as keyof typeof algos];
        const maxK = Math.max(...ks);

        let preds: string[] = [];
        try {
          const recPosts = await recommendFn(user.id, maxK);
          preds = recPosts.map((p) => p.id);
        } catch (e) {
          this.logger.warn(`Algo ${algoName} failed for user ${user.id}: ${e}`);
          continue;
        }

        if (!preds.length) continue;
        usersEvaluated++;

        for (const k of ks) {
          const prec = precisionAtK(preds, truth, k);
          const rec = recallAtK(preds, truth, k);
          const hit = hitRateAtK(preds, truth, k);
          const mrr = rrAtK(preds, truth, k);
          const ap = apk(preds, truth, k);
          const ndcg = ndcgAtK(preds, truth, k);

          metricsAcc.precision.set(
            k,
            (metricsAcc.precision.get(k) || 0) + prec
          );
          metricsAcc.recall.set(k, (metricsAcc.recall.get(k) || 0) + rec);
          metricsAcc.hitRate.set(k, (metricsAcc.hitRate.get(k) || 0) + hit);
          metricsAcc.mrr.set(k, (metricsAcc.mrr.get(k) || 0) + mrr);
          metricsAcc.map.set(k, (metricsAcc.map.get(k) || 0) + ap);
          metricsAcc.ndcg.set(k, (metricsAcc.ndcg.get(k) || 0) + ndcg);
          metricsAcc.counts.set(k, (metricsAcc.counts.get(k) || 0) + 1);

          const topk = preds.slice(0, k);
          topk.forEach((pid) => {
            metricsAcc.coverageSet.add(pid);
            const pop = postInteractionCount.get(pid) || 0;
            metricsAcc.popularitySum.set(
              k,
              (metricsAcc.popularitySum.get(k) || 0) + pop
            );
          });

          let pairCount = 0,
            dissimilaritySum = 0;
          for (let i = 0; i < topk.length; i++) {
            for (let j = i + 1; j < topk.length; j++) {
              const vi =
                postTagVectors.get(topk[i]) || Array(tags.length).fill(0);
              const vj =
                postTagVectors.get(topk[j]) || Array(tags.length).fill(0);
              pairCount++;
              dissimilaritySum += 1 - cosine(vi, vj);
            }
          }
          const avgDissim = pairCount === 0 ? 0 : dissimilaritySum / pairCount;
          metricsAcc.diversitySum.set(
            k,
            (metricsAcc.diversitySum.get(k) || 0) + avgDissim
          );
        }
      }

      ks.forEach((k) => {
        const count = metricsAcc.counts.get(k) || 1;
        results[algoName].precision[k] = round(
          metricsAcc.precision.get(k)! / count
        );
        results[algoName].recall[k] = round(metricsAcc.recall.get(k)! / count);
        results[algoName].hitRate[k] = round(
          metricsAcc.hitRate.get(k)! / count
        );
        results[algoName].mrr[k] = round(metricsAcc.mrr.get(k)! / count);
        results[algoName].map[k] = round(metricsAcc.map.get(k)! / count);
        results[algoName].ndcg[k] = round(metricsAcc.ndcg.get(k)! / count);

        const coverage = (metricsAcc.coverageSet.size / posts.length) * 100;
        results[algoName].coverage[k] = round(coverage);

        const avgPop =
          (metricsAcc.popularitySum.get(k) || 0) /
          Math.max(1, (metricsAcc.counts.get(k) || 1) * k);
        results[algoName].avgPopularity[k] = round(avgPop);

        results[algoName].diversity[k] = round(
          (metricsAcc.diversitySum.get(k) || 0) /
            Math.max(1, metricsAcc.counts.get(k) || 1)
        );

        results[algoName].usersEvaluated = usersEvaluated;
      });
    }

    return results;
  }
}

function round(n: number) {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}
