import type { CreateReviewInput } from "../../schemas/review-flow";
import type { ReviewReactionType } from "../../schemas/review-reactions";
import type { PublicAuthorAttributes } from "../../lib/review-visibility";

export type EmploymentStatus = CreateReviewInput["employmentStatus"];
export type PublicCategory = { id: string; code: string; name: string };
export type PublicRatingSummary = {
  dimensionCode: string;
  dimensionLabel: string;
  displayOrder: number;
  averageScore: number | null;
};
export type PublicStoreSummary = {
  id: string;
  name: string;
  prefecture: string | null;
  city: string | null;
  categories: PublicCategory[];
  reviewCount: number;
  /** 口コミ件数が閾値に達し、投稿者属性を詳細に表示してよいか */
  detailedAttributes: boolean;
  averageRating: number | null;
  reviewExcerpt: string | null;
};
export type PublicStoreDetail = PublicStoreSummary & {
  postalCode: string | null;
  address: string | null;
  ratingSummary: PublicRatingSummary[];
};
export type PublicReviewRating = {
  dimensionCode: string;
  dimensionLabel: string;
  displayOrder: number;
  score: number;
};
export type PublicReviewReaction = {
  type: ReviewReactionType;
  label: string;
  count: number;
  reacted: boolean;
};
export type PublicReview = {
  id: string;
  summary: string;
  author: PublicAuthorAttributes;
  atmosphereTags: CreateReviewInput["atmosphereTags"];
  staffTags: CreateReviewInput["staffTags"];
  managerPresence: CreateReviewInput["managerPresence"];
  recommendation: CreateReviewInput["recommendation"];
  publishedAt: string;
  ratings: PublicReviewRating[];
  reactions: PublicReviewReaction[];
  overallScore: number;
};
export type PublicListOptions = {
  limit?: number;
  offset?: number;
  viewerUserId?: string | null;
};
export type NormalizedPublicListOptions = { limit: number; offset: number };
export type ReviewFormRatingDimension = {
  id: string;
  code: string;
  label: string;
  displayOrder: number;
  isRequired: boolean;
};
export type PublishedReviewForm = {
  id: string;
  version: number;
  dimensions: ReviewFormRatingDimension[];
};
export type CreateReviewRecord = Omit<
  CreateReviewInput,
  "storeId" | "ratings" | "agreed" | "guidelineVersion"
> & {
  storeId: string;
  userId: string;
  reviewFormId: string;
  guidelineVersion: number;
  ratings: Array<{ ratingDimensionId: string; score: number }>;
};
