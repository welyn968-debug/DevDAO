import api from "../../../../lib/api-client";
import { ContributionSummary, Profile } from "@devdao/types";
import Link from "next/link";

async function getData(address: string) {
  const profileRes = await api.get(`/profiles/${address}`).catch(() => null);
  const profile = profileRes?.data as Profile | null;
  const contribs = profile?.contributions || [];
  return { profile, contribs };
}

function ContribList({ items }: { items: ContributionSummary[] }) {
  return (
    <div className="contrib-list">
      {items.map((c) => (
        <Link key={c.id} href={`/contribution/${c.id}`} className="contrib-card">
          <div>
            <div className="contrib-top">
              <span className={`contrib-type-badge type-${c.type}`}>{c.type}</span>
              <span className={`status-chip status-${c.status}`}>{c.status}</span>
            </div>
            <div className="contrib-title" style={{ marginBottom: 10 }}>{c.title}</div>
            <div className="contrib-meta">
              <span>?? {c.reward}</span>
              <span>? {new Date(c.submittedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default async function ProfilePage({ params }: { params: { address: string } }) {
  const { profile, contribs } = await getData(params.address);
  if (!profile) {
    return (
      <div className="empty">
        <div className="empty-icon">???</div>
        <div className="empty-msg">Profile not found</div>
        <div className="empty-sub">Try a different address</div>
      </div>
    );
  }

  const stats = profile.stats;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">My Profile</div>
        <div className="page-sub">$ devdao profile {profile.address}</div>
      </div>

      <div className="profile-hero">
        <div className="profile-top">
          <div className="avatar">0x</div>
          <div>
            <div className="profile-name">{profile.displayName || profile.githubHandle || profile.address}</div>
            <div className="profile-addr">Connected · Polygon</div>
            <div className={`tier-badge tier-${profile.tier}`}>?? {profile.tier}</div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "var(--text-dim)", fontFamily: "var(--font-mono)", marginBottom: 4 }}>DEV Balance</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "var(--cyan)", fontFamily: "var(--font-mono)" }}>{profile.tokenBalance}</div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>˜ on-chain</div>
          </div>
        </div>
        <div className="profile-stats">
          {[{ label: "Approved", val: stats.approved, color: "var(--green)" }, { label: "Rejected", val: stats.rejected, color: "var(--red)" }, { label: "Pending", val: stats.pending, color: "var(--text)" }, { label: "Rep Score", val: profile.repScore, color: "var(--cyan)" }].map((s) => (
            <div key={s.label} className="p-stat">
              <div className="p-stat-val" style={{ color: s.color }}>{s.val}</div>
              <div className="p-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="tabs">
        <div className="tab active">Contributions ({contribs.length})</div>
        <div className="tab">Badges</div>
        <div className="tab">Votes Cast</div>
      </div>

      <ContribList items={contribs} />
    </div>
  );
}
