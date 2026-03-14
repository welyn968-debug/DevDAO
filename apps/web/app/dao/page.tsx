import api from "../../lib/api-client";
import { DAOStats } from "@devdao/types";

async function getData() {
  const statsRes = await api.get("/dao/stats").catch(() => ({ data: {} }));
  const lbRes = await api.get("/dao/leaderboard").catch(() => ({ data: { data: [] } }));
  return { stats: statsRes.data as DAOStats, leaderboard: lbRes.data.data || [] };
}

export default async function DAOPage() {
  const { stats, leaderboard } = await getData();
  return (
    <div>
      <div className="page-header">
        <div className="page-title">DAO Dashboard</div>
        <div className="page-sub">$ devdao dao --stats --leaderboard</div>
      </div>
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Token Supply", value: stats?.tokenSupply ?? "--", sub: "/ 100M max", color: "cyan" },
          { label: "Treasury", value: stats?.treasuryBalance ?? "--", sub: "DEV in treasury", color: "green" },
          { label: "Token Holders", value: stats?.uniqueHolders ?? "--", sub: "Unique wallets", color: "amber" },
          { label: "Voting Quorum", value: `${stats?.quorumPercent ?? 5}%`, sub: "Of circulating", color: "purple" }
        ].map((s) => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>
      <div className="dao-grid">
        <div className="dao-card">
          <div className="dao-card-title">?? Contributor Leaderboard</div>
          {leaderboard.map((row: any, i: number) => (
            <div key={row.address || i} className="leaderboard-row">
              <div className={`lb-rank ${i < 3 ? "top3" : ""}`}>{i < 3 ? ["??", "??", "??"][i] : `#${i + 1}`}</div>
              <div className="lb-addr">{row.address}</div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <div className="lb-score">{row.approved} ?</div>
                <div style={{ fontSize: 10, color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>{row.repScore ?? 0} REP</div>
              </div>
            </div>
          ))}
        </div>
        <div className="dao-card">
          <div className="dao-card-title">?? Reward Distribution</div>
          {[{"type": "CODE", pct: 61, col: "var(--cyan)" }, { type: "RFC", pct: 24, col: "var(--purple)" }, { type: "BUG", pct: 15, col: "var(--red)" }].map((item) => (
            <div key={item.type} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>{item.type}</span>
                <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: item.col, fontWeight: 700 }}>{item.pct}%</span>
              </div>
              <div style={{ height: 6, background: "var(--bg3)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${item.pct}%`, height: "100%", background: item.col, borderRadius: 3 }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 20 }}>
            <div className="dao-card-title">?? Active Parameters</div>
            {[
              ["Voting Period", `${stats?.votingPeriodDays ?? 7} days`],
              ["Quorum", `${stats?.quorumPercent ?? 5}%`],
              ["CODE Reward", "500 DEV"],
              ["RFC Reward", "300 DEV"],
              ["BUG Reward", "200 DEV"]
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 12, fontFamily: "var(--font-mono)" }}>
                <span style={{ color: "var(--text-dim)" }}>{k}</span>
                <span style={{ color: "var(--cyan)" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
