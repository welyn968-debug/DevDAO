import api from "../../../../lib/api-client";
import { ContributionDetail } from "@devdao/types";

async function getData(id: string) {
  const res = await api.get(`/contributions/${id}`).catch(() => null);
  return res?.data as ContributionDetail | null;
}

export default async function ContributionPage({ params }: { params: { id: string } }) {
  const data = await getData(params.id);
  if (!data) {
    return (
      <div className="empty">
        <div className="empty-icon">???</div>
        <div className="empty-msg">Contribution not found</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">{data.title}</div>
        <div className="page-sub">Type: {data.type} · Status: {data.status}</div>
      </div>
      <div className="contrib-card" style={{ gridTemplateColumns: "1fr" }}>
        <div className="contrib-top">
          <span className={`contrib-type-badge type-${data.type}`}>{data.type}</span>
          <span className={`status-chip status-${data.status}`}>{data.status}</span>
        </div>
        <p style={{ color: "var(--text)", lineHeight: 1.6 }}>{data.description}</p>
        <div className="contrib-meta">
          <span>?? {data.contributor}</span>
          <span>?? {data.reward}</span>
          <span>? {new Date(data.submittedAt).toLocaleString()}</span>
        </div>
        <div className="vote-section">
          <div className="vote-counts">
            <span className="vote-for">? {data.onChain.forVotes}</span>
            <span className="vote-against">? {data.onChain.againstVotes}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
