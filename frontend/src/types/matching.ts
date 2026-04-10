import type { MemberDto } from "../services/api";

/** Extended member data used in the matchmaker UI. */
export interface MatchMember extends MemberDto {
  age: number;
  name: string;
}

export function toMatchMember(m: MemberDto): MatchMember {
  const today = new Date();
  const bday = new Date(m.birthday);
  let age = today.getFullYear() - bday.getFullYear();
  const monthDiff = today.getMonth() - bday.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < bday.getDate())) {
    age--;
  }
  return {
    ...m,
    age,
    name: `${m.firstName} ${m.lastName}`,
  };
}
