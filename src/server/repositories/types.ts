import type { CreateReviewInput } from "../../schemas/review-flow";

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
export type PublicReview = {
  id: string;
  summary: string;
  employmentStatus: CreateReviewInput["employmentStatus"];
  occupation: CreateReviewInput["occupation"];
  workDuration: CreateReviewInput["workDuration"];
  atmosphereTags: CreateReviewInput["atmosphereTags"];
  staffTags: CreateReviewInput["staffTags"];
  managerPresence: CreateReviewInput["managerPresence"];
  recommendation: CreateReviewInput["recommendation"];
  publishedAt: string;
  ratings: PublicReviewRating[];
  overallScore: number;
};
export type PublicListOptions = { limit?: number; offset?: number };
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
