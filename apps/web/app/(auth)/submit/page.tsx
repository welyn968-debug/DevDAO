"use client";

import { useState } from "react";
import api from "../../../lib/api-client";
import { ContributionType } from "@devdao/types";

const typeInfo: Record<ContributionType, { label: string; reward: string; desc: string }> = {
  CODE: { label: "Code / Pull Request", reward: "500 DEV", desc: "Link a GitHub PR or paste a diff. Community reviews your code change." },
  RFC: { label: "Proposal / RFC", reward: "300 DEV", desc: "Propose a change to governance, tokenomics, protocol design, or standards." },
  BUG: { label: "Bug Report", reward: "200 DEV", desc: "Report a reproducible bug. Severity determines bonus reward multiplier." }
};

export default function SubmitPage() {
  const [form, setForm] = useState({ type: ContributionType.CODE, title: "", description: "", links: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handle = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title || !form.description) return;
    setSubmitting(true);
    try {
      await api.post("/contributions", {
        type: form.type,
        title: form.title,
        description: form.description,
        links: form.links ? [form.links] : []
      });
      setSubmitted(true);
      setForm({ type: ContributionType.CODE, title: "", description: "", links: "" });
    } finally {
      setSubmitting(false);
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Submit Contribution</div>
        <div className="page-sub">$ devdao submit --type=CODE|RFC|BUG</div>
      </div>

      {submitted ? (
        <div style={{ background: "rgba(0,255,157,.08)", border: "1px solid rgba(0,255,157,.2)", borderRadius: 10, padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>?</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--green)", marginBottom: 6 }}>Contribution Submitted!</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-dim)" }}>Pinned to IPFS · On-chain record created · Voting opens in 1 hour</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: 24 }}>
            <div className="form-grid">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contribution Type</label>
                  <select className="form-select" value={form.type} onChange={(e) => handle("type", e.target.value)}>
                    <option value={ContributionType.CODE}>? Code / Pull Request</option>
                    <option value={ContributionType.RFC}>?? Proposal / RFC</option>
                    <option value={ContributionType.BUG}>?? Bug Report</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Base Reward</label>
                  <div className="form-input" style={{ display: "flex", alignItems: "center", color: "var(--green)", cursor: "default" }}>
                    ?? {typeInfo[form.type as ContributionType].reward}
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" placeholder="Clear, descriptive title for your contribution..." value={form.title} onChange={(e) => handle("title", e.target.value)} maxLength={120} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" placeholder={`Describe your contribution in detail.\n\n${typeInfo[form.type as ContributionType].desc}`} value={form.description} onChange={(e) => handle("description", e.target.value)} style={{ minHeight: 160 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Links (GitHub PR, Issue, Docs)</label>
                <input className="form-input" placeholder="https://github.com/org/repo/pull/123" value={form.links} onChange={(e) => handle("links", e.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || !form.title || !form.description} style={{ alignSelf: "flex-start", opacity: !form.title || !form.description ? 0.5 : 1 }}>
                {submitting ? "? Submitting on-chain..." : "?? Submit Contribution"}
              </button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-dim)", marginBottom: 12, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".1em" }}>Submission Flow</div>
              {["Connect wallet (SIWE)", "Describe contribution", "Metadata pinned to IPFS", "On-chain record created", "Community votes for 7 days", "Auto-finalised + reward paid"].map((label, i) => (
                <div key={label} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--cyan)", color: "var(--bg)", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "var(--font-mono)" }}>{i + 1}</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)", paddingTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(255,179,0,.05)", border: "1px solid rgba(255,179,0,.2)", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--amber)", marginBottom: 8, fontFamily: "var(--font-mono)" }}>? REQUIREMENTS</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
                • Hold at least 1 DEV token<br />
                • Linked GitHub account<br />
                • Minimum 5% quorum to pass<br />
                • Simple majority (FOR > AGAINST)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
