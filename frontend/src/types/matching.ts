/** Member row + detail payload for the matching UI (mock-backed until APIs exist). */
export interface MatchMember {
  id: string;
  name: string;
  city: string;
  age: number;
  orientation: string;
  sex: string;
  ghostedMatch: number;
  denials: number;
  successes: number;
  /** Score from past dates (0–100 mock scale). */
  dateScore: number;
  /** Short blurbs shown in the table under the name. */
  intakePreview: string[];
  /** Full intake Q&A for the detail view. */
  intakeFull: { question: string; answer: string }[];
  pastMatches: { name: string; outcome: string }[];
}
