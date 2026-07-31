import { QRCodeCanvas } from "qrcode.react";
import { useCallback, useEffect, useMemo, useState } from "react";
import APP_CONFIG from "../config/appConfig";
import {
  createJoiningFormLink,
  disableJoiningFormLink,
  getJoiningCandidates,
  getJoiningFormLinks,
} from "../services/joiningFormService";

const JoiningFormsPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [title, setTitle] = useState("Joining Form");
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const activeLinks = useMemo(
    () => links.filter((link) => link.is_active),
    [links]
  );

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const term = searchTerm.toLowerCase();
      return (
        c.name?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term)
      );
    });
  }, [candidates, searchTerm]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const [candidateData, linkData] = await Promise.all([
        getJoiningCandidates(),
        getJoiningFormLinks(),
      ]);
      setCandidates(candidateData);
      setLinks(linkData);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to load joining forms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCheckboxChange = (id) => {
    setSelectedCandidateIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredCandidates.map((c) => c.id);
    setSelectedCandidateIds((current) => {
      const allSelected = allFilteredIds.every((id) => current.includes(id));
      if (allSelected) {
        return current.filter((id) => !allFilteredIds.includes(id));
      } else {
        return Array.from(new Set([...current, ...allFilteredIds]));
      }
    });
  };

  const handleCreateLinksBulk = async (event) => {
    event.preventDefault();
    if (selectedCandidateIds.length === 0) {
      setMessage("Please select at least one candidate.");
      return;
    }

    setLoading(true);
    setMessage("");
    let successCount = 0;
    let failCount = 0;

    try {
      await Promise.all(
        selectedCandidateIds.map(async (cId) => {
          try {
            await createJoiningFormLink({
              candidate_id: cId,
              title,
              expires_in_days: Number(expiresInDays),
              send_email: sendEmail,
            });
            successCount++;
          } catch (err) {
            failCount++;
          }
        })
      );

      if (failCount === 0) {
        setMessage(`Successfully generated ${successCount} link(s).`);
      } else {
        setMessage(`Generated ${successCount} link(s); failed for ${failCount} candidate(s).`);
      }

      setSelectedCandidateIds([]);
      await loadData();
    } catch (err) {
      setMessage("An error occurred during link generation.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisableLink = async (linkId) => {
    setMessage("");

    try {
      await disableJoiningFormLink(linkId);
      setMessage("Joining form URL disabled");
      await loadData();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to disable joining form URL");
    }
  };

  const copyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Joining form URL copied");
    } catch (err) {
      setMessage(url);
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Joining Forms</h3>
          <p style={styles.subtitle}>
            Create candidate-specific URLs and QR codes for joining form completion.
          </p>
        </div>
        <button className="btn btn-outline-primary" onClick={loadData} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div style={styles.grid}>
        <section style={styles.panel}>
          <h5>Create Joining URLs (Bulk)</h5>
          <form onSubmit={handleCreateLinksBulk}>
            <div className="mb-3">
              <label className="form-label">Search Candidates</label>
              <input
                type="text"
                className="form-control mb-2"
                placeholder="Type name or email to filter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="mb-3" style={{ border: "1px solid #dee2e6", borderRadius: "4px", padding: "10px", maxHeight: "250px", overflowY: "auto", background: "#f8f9fa" }}>
              <div className="form-check mb-2" style={{ borderBottom: "1px solid #dee2e6", paddingBottom: "6px" }}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="select-all-candidates"
                  checked={filteredCandidates.length > 0 && filteredCandidates.every((c) => selectedCandidateIds.includes(c.id))}
                  onChange={handleSelectAll}
                />
                <label className="form-check-label" htmlFor="select-all-candidates" style={{ fontWeight: "bold", cursor: "pointer" }}>
                  Select All Filtered ({filteredCandidates.length})
                </label>
              </div>

              {filteredCandidates.map((candidate) => (
                <div key={candidate.id} className="form-check py-1">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={`candidate-${candidate.id}`}
                    checked={selectedCandidateIds.includes(candidate.id)}
                    onChange={() => handleCheckboxChange(candidate.id)}
                  />
                  <label className="form-check-label" htmlFor={`candidate-${candidate.id}`} style={{ cursor: "pointer" }}>
                    {candidate.name} <span className="text-muted">({candidate.email})</span>
                  </label>
                </div>
              ))}

              {filteredCandidates.length === 0 && (
                <div className="text-muted text-center py-2">No candidates match your search.</div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Form Title</label>
              <input
                className="form-control"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Link Expiry Days</label>
              <input
                type="number"
                min="1"
                max="365"
                className="form-control"
                value={expiresInDays}
                onChange={(event) => setExpiresInDays(event.target.value)}
                required
              />
            </div>

            <div className="form-check mb-3">
              <input
                type="checkbox"
                className="form-check-input"
                id="send-email-checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="send-email-checkbox" style={{ cursor: "pointer" }}>
                Send generated links automatically via Email
              </label>
            </div>

            <button className="btn btn-primary w-100" type="submit" disabled={selectedCandidateIds.length === 0 || loading}>
              {loading ? "Generating..." : `Generate & Send Link(s) (${selectedCandidateIds.length})`}
            </button>
          </form>
        </section>

        <section style={styles.panel}>
          <h5>Active URLs</h5>
          {activeLinks.length === 0 && <p className="text-muted">No active joining form URL.</p>}
          {activeLinks.map((link) => {
            const url = `${APP_CONFIG.BASE_PUBLIC_URL}/joining-form/${link.slug}`;

            return (
              <div key={link.id} style={styles.linkBox}>
                <div style={styles.linkText}>
                  <strong>{link.candidate_name || link.title}</strong>
                  <button className="btn btn-link p-0 text-start" onClick={() => copyUrl(url)}>
                    {url}
                  </button>
                  <small className="text-muted">
                    {link.submitted ? `Submitted as ${link.employee_id}` : "Awaiting submission"}
                  </small>
                  <small className="text-muted">
                    Expires: {link.expires_at ? new Date(link.expires_at).toLocaleString() : "N/A"}
                  </small>
                </div>
                <QRCodeCanvas value={url} size={78} />
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDisableLink(link.id)}
                >
                  Disable
                </button>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
};

export default JoiningFormsPage;

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "18px",
  },
  title: {
    margin: 0,
    color: "#111827",
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(260px, 360px) 1fr",
    gap: "16px",
    marginBottom: "16px",
  },
  panel: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "16px",
  },
  linkBox: {
    display: "grid",
    gridTemplateColumns: "1fr auto auto",
    alignItems: "center",
    gap: "14px",
    borderTop: "1px solid #e5e7eb",
    padding: "12px 0",
  },
  linkText: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minWidth: 0,
  },
};
