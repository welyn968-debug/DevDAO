"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/api-client";
import { ContributionSummary, ContributionType, ContributionStatus } from "@devdao/types";

async function fetchContributions(params: { type?: ContributionType | "ALL" }) {
  const res = await api.get("/contributions", {
    params: params.type && params.type !== "ALL" ? { type: params.type } : {}
  });
  return res.data.data as ContributionSummary[];
}

async function fetchStats() {
  const res = await api.get("/dao/stats");
  return res.data;
}

function VoteBar({ forVotes, againstVotes }: { forVotes: number; againstVotes: number }) {
  const total = forVotes + againstVotes;
  const pct = total > 0 ? Math.round((forVotes / total) * 100) : 0;
  return (
    <div className="vote-section">
      <div className="vote-bar-wrap">
        <div className="vote-bar-fill" style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--green), var(--cyan))" }} />
      </div>
      <div className="vote-counts">
        <span className="vote-for">? {forVotes}</span>
        <span className="vote-against">? {againstVotes}</span>
        <span style={{ color: "var(--text-dim)" }}>{pct}%</span>
      </div>
    </div>
  );
}

function ContribCard({ c, onVote }: { c: ContributionSummary; onVote: (id: string, support: boolean) => void }) {
  return (
    <div className="contrib-card">
      <div>
        <div className="contrib-top">
          <span className={`contrib-type-badge type-${c.type}`}>{c.type}</span>
          <span className={`status-chip status-${c.status}`}>{c.status}</span>
        </div>
        <div className="contrib-title" style={{ marginBottom: 10 }}>{c.title}</div>
        <div className="contrib-meta">
          <span>?? {c.contributor}</span>
          <span>? {new Date(c.submittedAt).toLocaleDateString()}</span>
          <span style={{ color: "var(--green)" }}>?? {c.reward}</span>
        </div>
      </div>
      <div className="vote-section">
        <VoteBar forVotes={c.forVotes} againstVotes={c.againstVotes} />
        {c.status === ContributionStatus.PENDING && (
          <div className="vote-btns">
            <button className="btn-vote for" onClick={() => onVote(c.id, true)}>? FOR</button>
            <button className="btn-vote against" onClick={() => onVote(c.id, false)}>? AGAINST</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FeedPage() {
  const [filter, setFilter] = useState<ContributionType | "ALL">("ALL");

  const { data: contributions = [], refetch } = useQuery({
    queryKey: ["contributions", filter],
    queryFn: () => fetchContributions({ type: filter })
  });

  const { data: stats } = useQuery({ queryKey: ["dao-stats"], queryFn: fetchStats });

  const filters: (ContributionType | "ALL")[] = ["ALL", ContributionType.CODE, ContributionType.RFC, ContributionType.BUG];

  const handleVote = async (id: string, support: boolean) => {
    await api.post("/votes", { contributionId: id, support });
    refetch();
  };

  const cards = useMemo(
    () => (
      <div className="contrib-list">
        {contributions.length === 0 && (
          <div className="empty">
            <div className="empty-icon">???</div>
            <div className="empty-msg">No contributions yet</div>
            <div className="empty-sub">Submit the first proposal to kickstart the DAO</div>
          </div>
        )}
        {contributions.map((c) => (
          <ContribCard key={c.id} c={c} onVote={handleVote} />)
        )}
      </div>
    ),
    [contributions]
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Community Feed</div>
        <div className="page-sub">$ devdao feed --status=all --sort=newest</div>
      </div>

      <div className="stats-grid">
        {[
          { label: "Total Contributions", value: stats?.totalContributions ?? "--", sub: "+23 this week", color: "cyan" },
          { label: "Approved", value: stats?.approvedContributions ?? "--", sub: `${stats?.approvalRate ?? 0}% approval rate`, color: "green" },
          { label: "Active Voters", value: stats?.uniqueHolders ?? "--", sub: "Holding DEV tokens", color: "amber" },
          { label: "DEV Distributed", value: stats?.tokenSupply ?? "--", sub: "Tokens rewarded", color: "purple" }
        ].map((s) => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="section-header">
        <div className="section-title">Latest Contributions</div>
        <div style={{ display: "flex", gap: 8 }}>
          {filters.map((t) => (
            <button
              key={t}
              className={`btn btn-ghost ${t === filter ? "active" : ""}`}
              style={{ padding: "5px 12px", fontSize: 11, borderColor: t === filter ? "var(--cyan)" : undefined, color: t === filter ? "var(--cyan)" : undefined }}
              onClick={() => setFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {cards}
    </div>
  );
}
