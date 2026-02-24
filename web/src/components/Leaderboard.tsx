import React, { useEffect, useState } from "react";
import { useI18n } from "@/i18n";

type ScoreEntry = {
  id: string;
  score: number;
  ts: number;
};

const STORAGE_KEY = "neon-pulse-leaderboard";
const TOTAL_KEY = "neon-pulse-total-balls";
const BEST_KEY = "neon-pulse-best-run";

function loadScores(): ScoreEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ScoreEntry[]) : [];
  } catch {
    return [];
  }
}

function saveScores(scores: ScoreEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
}

export function submitScore(score: number): ScoreEntry[] {
  if (typeof window !== "undefined") {
    const total = Number(localStorage.getItem(TOTAL_KEY) || "0") + score;
    localStorage.setItem(TOTAL_KEY, String(total));
    const best = Math.max(Number(localStorage.getItem(BEST_KEY) || "0"), score);
    localStorage.setItem(BEST_KEY, String(best));
  }
  const next: ScoreEntry[] = [
    { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, score, ts: Date.now() },
    ...loadScores(),
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
  saveScores(next);
  return next;
}

type LeaderboardProps = {
  latestScore?: number | null;
};

export const Leaderboard: React.FC<LeaderboardProps> = ({ latestScore }) => {
  const { t } = useI18n();
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [best, setBest] = useState(0);

  useEffect(() => {
    setScores(loadScores());
    setTotal(Number(localStorage.getItem(TOTAL_KEY) || "0"));
    setBest(Number(localStorage.getItem(BEST_KEY) || "0"));
  }, []);

  useEffect(() => {
    if (typeof latestScore === "number" && latestScore > 0) {
      setScores(submitScore(latestScore));
      setTotal(Number(localStorage.getItem(TOTAL_KEY) || "0"));
      setBest(Number(localStorage.getItem(BEST_KEY) || "0"));
    }
  }, [latestScore]);

  return (
    <div className="ui-caps bg-neon-dark/60 border border-neon-purple/20 rounded-lg p-6">
      <h3 className="text-xl font-bold text-neon-green mb-4">{t("leaderboard.title")}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
        <div className="p-4 rounded-lg bg-neon-dark/60 border border-neon-cyan/20">
          <div className="text-neon-cyan/70">{t("leaderboard.total")}</div>
          <div className="text-2xl font-bold text-neon-green">{total}</div>
        </div>
        <div className="p-4 rounded-lg bg-neon-dark/60 border border-neon-cyan/20">
          <div className="text-neon-cyan/70">{t("leaderboard.best")}</div>
          <div className="text-2xl font-bold text-neon-green">{best}</div>
        </div>
      </div>

      <div className="text-neon-cyan/70 text-sm mb-3">{t("leaderboard.top10")}</div>
      {scores.length === 0 ? (
        <div className="text-neon-cyan/70 text-sm">{t("leaderboard.empty")}</div>
      ) : (
        <ul className="space-y-2">
          {scores.slice(0, 10).map((entry, idx) => (
            <li
              key={entry.id}
              className="flex items-center justify-between text-neon-cyan/80 text-sm"
            >
              <span className="font-semibold">#{idx + 1}</span>
              <span>{entry.score}</span>
              <span className="text-xs text-neon-purple/60">
                {new Date(entry.ts).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="text-xs text-neon-purple/60 mt-4">{t("leaderboard.globalLater")}</div>
    </div>
  );
};
