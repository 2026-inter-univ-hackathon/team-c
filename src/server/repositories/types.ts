export type PublicCategory = {
  id: string;
  code: string;
  name: string;
};

export type EmploymentStatus = "CURRENT" | "FORMER";

export type PublicStoreSummary = {
  id: string;
  name: string;
  prefecture: string | null;
  city: string | null;
  categories: PublicCategory[];
  reviewCount: number;
};

export type PublicStoreDetail = PublicStoreSummary & {
  postalCode: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
};

export type PublicReviewAnswer = {
  questionCode: string;
  questionLabel: string;
  displayOrder: number;
  answerText: string;
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
  publicAuthorLabel: string;
  employmentStartYear: number;
  employmentEndYear: number | null;
  employmentStatus: EmploymentStatus;
  publishedAt: Date;
  answers: PublicReviewAnswer[];
  ratings: PublicReviewRating[];
};

export type PublicListOptions = {
  limit?: number;
  offset?: number;
};

export type NormalizedPublicListOptions = {
  limit: number;
  offset: number;
};
