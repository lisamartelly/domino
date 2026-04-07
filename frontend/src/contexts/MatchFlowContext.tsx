import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MatchMember } from "../types/matching";

export type AddToMatchResult =
  | "slot0"
  | "slot1"
  | "complete"
  | "duplicate"
  | "full";

interface MatchFlowContextValue {
  slot0: MatchMember | null;
  slot1: MatchMember | null;
  addToMatch: (member: MatchMember) => AddToMatchResult;
  removeFromSlot: (index: 0 | 1) => void;
  resetPair: () => void;
}

const MatchFlowContext = createContext<MatchFlowContextValue | undefined>(
  undefined
);

export function MatchFlowProvider({ children }: { children: ReactNode }) {
  const [slot0, setSlot0] = useState<MatchMember | null>(null);
  const [slot1, setSlot1] = useState<MatchMember | null>(null);

  const addToMatch = useCallback((member: MatchMember): AddToMatchResult => {
    if (slot0?.id === member.id || slot1?.id === member.id) {
      return "duplicate";
    }
    if (!slot0) {
      setSlot0(member);
      return "slot0";
    }
    if (!slot1) {
      setSlot1(member);
      return "complete";
    }
    return "full";
  }, [slot0, slot1]);

  const removeFromSlot = useCallback((index: 0 | 1) => {
    if (index === 0) setSlot0(null);
    else setSlot1(null);
  }, []);

  const resetPair = useCallback(() => {
    setSlot0(null);
    setSlot1(null);
  }, []);

  const value = useMemo(
    () => ({
      slot0,
      slot1,
      addToMatch,
      removeFromSlot,
      resetPair,
    }),
    [slot0, slot1, addToMatch, removeFromSlot, resetPair]
  );

  return (
    <MatchFlowContext.Provider value={value}>
      {children}
    </MatchFlowContext.Provider>
  );
}

export function useMatchFlow(): MatchFlowContextValue {
  const ctx = useContext(MatchFlowContext);
  if (!ctx) {
    throw new Error("useMatchFlow must be used within MatchFlowProvider");
  }
  return ctx;
}
