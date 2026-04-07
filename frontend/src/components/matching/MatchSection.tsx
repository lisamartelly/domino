import { Routes, Route } from "react-router-dom";
import { MatchingPage } from "./MatchingPage";
import { MemberDetailPage } from "./MemberDetailPage";
import { MatchSummaryPage } from "./MatchSummaryPage";

export function MatchSection() {
  return (
    <Routes>
      <Route index element={<MatchingPage />} />
      <Route path="member/:id" element={<MemberDetailPage />} />
      <Route path="summary" element={<MatchSummaryPage />} />
    </Routes>
  );
}
