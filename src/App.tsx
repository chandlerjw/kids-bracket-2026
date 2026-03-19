import { useEffect, useMemo, useState } from "react";

const regions = ["East", "West", "South", "Midwest"] as const;
const playPhases = ["region", "finalfour", "championship"] as const;
const roundNames = ["Round 1", "Sweet 16", "Regional Final"] as const;

const initialRegions: Record<string, string[][]> = {
  East: [["Duke", "Siena"], ["Ohio St.", "TCU"], ["Kansas", "Cal Baptist"], ["UCLA", "UCF"]],
  West: [["Arizona", "Long Island"], ["Villanova", "Utah St."], ["Wisconsin", "High Point"], ["Arkansas", "Hawaii"]],
  South: [["Florida", "Prairie View"], ["Clemson", "Iowa"], ["Nebraska", "Troy"], ["UNC", "VCU"]],
  Midwest: [["Michigan", "Howard"], ["Texas Tech", "Akron"], ["Alabama", "Hofstra"], ["Kentucky", "Santa Clara"]],
};

const logoIds: Record<string, number> = {
  Duke: 150,
  Arizona: 12,
  Kansas: 2305,
  UCLA: 26,
  Villanova: 222,
  Wisconsin: 275,
  Arkansas: 8,
  Florida: 57,
  Clemson: 228,
  Nebraska: 158,
  Michigan: 130,
  Alabama: 333,
  Kentucky: 96,
  "Ohio St.": 194,
  TCU: 2628,
  Iowa: 2294,
  "Texas Tech": 2641,
};

type PicksState = Record<string, Record<number, Record<number, string>>> & {
  finalFour?: Record<number, string>;
  championship?: Record<number, string>;
};

function nextRound(teams: string[]) {
  const out: string[][] = [];
  for (let i = 0; i < teams.length; i += 2) out.push([teams[i], teams[i + 1]]);
  return out;
}

function getLogoUrl(team: string) {
  const id = logoIds[team];
  return id ? `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png` : null;
}

function getInitials(team: string) {
  return team
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
}

function TeamBadge({ team }: { team: string }) {
  const [broken, setBroken] = useState(false);
  const src = getLogoUrl(team);

  if (src && !broken) {
    return (
      <img
        src={src}
        alt={team}
        onError={() => setBroken(true)}
        style={{ width: 56, height: 56, objectFit: "contain", background: "white", borderRadius: 16, padding: 6, boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}
      />
    );
  }

  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: 16,
        background: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        boxShadow: "0 2px 8px rgba(0,0,0,.08)",
      }}
    >
      {getInitials(team)}
    </div>
  );
}

function TeamButton({ team, onClick }: { team: string; onClick: (team: string) => void }) {
  return (
    <button
      onClick={() => onClick(team)}
      style={{
        width: "100%",
        border: "none",
        borderRadius: 28,
        padding: 20,
        background: "white",
        display: "flex",
        alignItems: "center",
        gap: 16,
        fontSize: 28,
        fontWeight: 900,
        textAlign: "left",
        cursor: "pointer",
        boxShadow: "0 12px 28px rgba(0,0,0,.12)",
        transition: "transform .12s ease, box-shadow .12s ease",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <TeamBadge team={team} />
      <div style={{ flex: 1 }}>
        <div>{team}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#64748b", marginTop: 6 }}>Tap to pick</div>
      </div>
      <div style={{ fontSize: 30 }}>🏀</div>
    </button>
  );
}

function SummaryList({ title, teams }: { title: string; teams: string[] }) {
  return (
    <div style={{ background: "#f8fafc", borderRadius: 24, padding: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1.5, color: "#64748b", marginBottom: 12 }}>{title}</div>
      <div style={{ display: "grid", gap: 10 }}>
        {teams.length ? teams.map((team, i) => (
          <div key={`${title}-${team}-${i}`} style={{ display: "flex", alignItems: "center", gap: 12, background: "white", borderRadius: 18, padding: 10, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
            <TeamBadge team={team} />
            <div style={{ fontWeight: 800, color: "#0f172a" }}>{team}</div>
          </div>
        )) : <div style={{ color: "#94a3b8" }}>No picks yet</div>}
      </div>
    </div>
  );
}

export default function App() {
  const [picks, setPicks] = useState<PicksState>({});
  const [screen, setScreen] = useState<"play" | "summary">("play");
  const [phase, setPhase] = useState<(typeof playPhases)[number]>("region");
  const [r, setR] = useState(0);
  const [round, setRound] = useState(0);
  const [m, setM] = useState(0);
  const [copied, setCopied] = useState(false);

  const region = regions[r];

  const regionWinners = useMemo(() => {
    return regions.map((reg) => {
      const winner = picks?.[reg]?.[2] ? Object.values(picks[reg][2])[0] : "";
      return winner;
    }).filter(Boolean);
  }, [picks]);

  const matchups = useMemo(() => {
    if (phase === "region") {
      if (round === 0) return initialRegions[region];
      return nextRound(Object.values(picks?.[region]?.[round - 1] || {}));
    }

    if (phase === "finalfour") {
      return [
        [regionWinners[0], regionWinners[1]].filter(Boolean),
        [regionWinners[2], regionWinners[3]].filter(Boolean),
      ];
    }

    if (phase === "championship") {
      return [[picks?.finalFour?.[0], picks?.finalFour?.[1]].filter(Boolean)];
    }

    return [];
  }, [phase, round, region, picks, regionWinners]);

  const matchup = matchups[m] || [];
  const regionalChamps = regions.map((reg) => (picks?.[reg]?.[2] ? Object.values(picks[reg][2])[0] : "TBD"));
  const finalFourWinners = picks?.finalFour ? [picks.finalFour[0], picks.finalFour[1]].filter(Boolean) : [];
  const nationalChampion = picks?.championship?.[0] || "TBD";

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kid-bracket-2026");
      if (!saved) return;
      const parsed = JSON.parse(saved);
      setPicks(parsed.picks || {});
      setScreen(parsed.screen || "play");
      setPhase(parsed.phase || "region");
      setR(parsed.r || 0);
      setRound(parsed.round || 0);
      setM(parsed.m || 0);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("kid-bracket-2026", JSON.stringify({ picks, screen, phase, r, round, m }));
  }, [picks, screen, phase, r, round, m]);

  function pick(team: string) {
    if (phase === "region") {
      setPicks((prev) => {
        const next = { ...prev };
        next[region] = next[region] || {};
        next[region][round] = { ...(next[region][round] || {}), [m]: team };
        return next;
      });

      if (m < matchups.length - 1) {
        setM((v) => v + 1);
        return;
      }

      if (round < 2) {
        setRound((v) => v + 1);
        setM(0);
        return;
      }

      if (r < regions.length - 1) {
        setR((v) => v + 1);
        setRound(0);
        setM(0);
        return;
      }

      setPhase("finalfour");
      setM(0);
      return;
    }

    if (phase === "finalfour") {
      setPicks((prev) => ({
        ...prev,
        finalFour: { ...(prev.finalFour || {}), [m]: team },
      }));

      if (m < matchups.length - 1) {
        setM((v) => v + 1);
        return;
      }

      setPhase("championship");
      setM(0);
      return;
    }

    if (phase === "championship") {
      setPicks((prev) => ({
        ...prev,
        championship: { 0: team },
      }));
      setScreen("summary");
    }
  }

  function reset() {
    setPicks({});
    setScreen("play");
    setPhase("region");
    setR(0);
    setRound(0);
    setM(0);
    setCopied(false);
    localStorage.removeItem("kid-bracket-2026");
  }

  async function shareBracket() {
    const lines = [
      "🏀 My March Madness 2026 Kid Bracket",
      "",
      "Regional Winners:",
      ...regions.map((reg, i) => `${reg}: ${regionalChamps[i]}`),
      "",
      `Final Four Winners: ${finalFourWinners.join(" vs ") || "TBD"}`,
      `National Champion: ${nationalChampion}`,
    ];
    const text = lines.join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ title: "My Kid Bracket", text });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  }

  if (screen === "summary") {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #e0f2fe 0%, #ffffff 45%, #fef9c3 100%)", padding: 24, fontFamily: "Arial, sans-serif" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1.6, color: "#64748b" }}>Finished Bracket</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: "#0f172a" }}>Your 2026 picks</div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={shareBracket} style={{ border: "none", borderRadius: 18, background: "#0f172a", color: "white", padding: "14px 18px", fontWeight: 800, cursor: "pointer" }}>
                {copied ? "Copied" : "Share My Bracket"}
              </button>
              <button onClick={reset} style={{ border: "1px solid #cbd5e1", borderRadius: 18, background: "white", color: "#0f172a", padding: "14px 18px", fontWeight: 800, cursor: "pointer" }}>
                Start Over
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <SummaryList title="Regional Winners" teams={regionalChamps.filter((t) => t !== "TBD")} />
            <SummaryList title="Final Four Winners" teams={finalFourWinners} />
            <SummaryList title="National Champion" teams={nationalChampion === "TBD" ? [] : [nationalChampion]} />
          </div>

          {regions.map((reg) => {
            const round1 = Object.values(picks?.[reg]?.[0] || {});
            const round2 = Object.values(picks?.[reg]?.[1] || {});
            const round3 = Object.values(picks?.[reg]?.[2] || {});
            return (
              <div key={reg} style={{ background: "rgba(255,255,255,.85)", borderRadius: 28, padding: 20, boxShadow: "0 12px 30px rgba(0,0,0,.08)" }}>
                <div style={{ fontSize: 30, fontWeight: 900, marginBottom: 16, color: "#0f172a" }}>{reg}</div>
                <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                  <SummaryList title="Round 1 Winners" teams={round1} />
                  <SummaryList title="Sweet 16" teams={round2} />
                  <SummaryList title="Regional Winner" teams={round3} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const phaseTitle =
    phase === "region"
      ? roundNames[round]
      : phase === "finalfour"
      ? "Final Four"
      : "National Championship";

  const phaseSubtitle =
    phase === "region"
      ? `${region} • Game ${m + 1} of ${matchups.length}`
      : phase === "finalfour"
      ? `Semifinal ${m + 1} of ${matchups.length}`
      : "Pick the national champion";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #e0f2fe 0%, #ffffff 45%, #fef9c3 100%)", padding: 24, fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1.6, color: "#64748b" }}>March Madness 2026</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: "#0f172a" }}>Kid Bracket Picker</div>
          </div>
          <button onClick={reset} style={{ border: "1px solid #cbd5e1", borderRadius: 18, background: "white", color: "#0f172a", padding: "14px 18px", fontWeight: 800, cursor: "pointer" }}>
            Reset
          </button>
        </div>

        <div style={{ background: "rgba(255,255,255,.8)", borderRadius: 32, padding: 24, boxShadow: "0 16px 36px rgba(0,0,0,.12)" }}>
          <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1.6, color: "#64748b" }}>{phase === "region" ? region : phase === "finalfour" ? "Final Four" : "Championship"}</div>
          <div style={{ fontSize: 42, fontWeight: 900, color: "#0f172a", marginTop: 6 }}>{phaseTitle}</div>
          <div style={{ marginTop: 8, color: "#64748b", fontWeight: 700 }}>{phaseSubtitle}</div>

          {matchup.length === 2 && (
            <div style={{ display: "grid", gap: 16, marginTop: 24 }}>
              <TeamButton team={matchup[0]} onClick={pick} />
              <div style={{ textAlign: "center", color: "#94a3b8", fontWeight: 900, letterSpacing: 2 }}>VS</div>
              <TeamButton team={matchup[1]} onClick={pick} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
