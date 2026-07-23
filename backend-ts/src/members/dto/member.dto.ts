export interface MatchStatsDto {
  totalMatches: number;
  accepted: number;
  denied: number;
  pending: number;
}

export interface MemberDto {
  id: number;
  firstName: string;
  lastName: string;
  birthday: string;
  matchStats: MatchStatsDto;
}

export interface PastMatchDto {
  matchPublicId: string;
  otherUserName: string;
  accepted: boolean | null;
  createdAt: Date;
}

export interface MemberDetailDto extends MemberDto {
  pastMatches: PastMatchDto[];
}
