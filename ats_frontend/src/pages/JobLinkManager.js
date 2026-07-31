import { QRCodeCanvas } from "qrcode.react";
import { useCallback, useEffect, useMemo, useState } from "react";
import APP_CONFIG from "../config/appConfig";

const API_BASE = APP_CONFIG.API_BASE_URL;

const JobLinkManager = () => {
  const [jobs, setJobs] = useState([]);
  const [links, setLinks] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyJobId, setBusyJobId] = useState(null);

  const token = localStorage.getItem("token");

  const authHeader = useMemo(() => ({
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  }), [token]);

  const requestJson = useCallback(async (url, options = {}) => {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const detail = data?.detail || data?.message || "Request failed";
      throw new Error(detail);
    }

    return data;
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      setError("");
      setLoading(true);

      const data = await requestJson(`${API_BASE}/jobs`, {
        headers: authHeader
      });

      const jobList = Array.isArray(data) ? data : [];
      const linkMap = {};

      await Promise.all(
        jobList.map(async (job) => {
          const linkData = await requestJson(`${API_BASE}/jobs/${job.id}/apply-link`, {
            headers: authHeader
          });

          if (!linkData.message) {
            linkMap[job.id] = linkData;
          }
        })
      );

      setJobs(jobList);
      setLinks(linkMap);
    } catch (err) {
      console.error("Fetch job links error:", err);
      setError(err.message || "Unable to load job links");
      setJobs([]);
      setLinks({});
    } finally {
      setLoading(false);
    }
  }, [authHeader, requestJson]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const generateLink = async (jobId) => {
    try {
      setError("");
      setBusyJobId(jobId);

      await requestJson(`${API_BASE}/jobs/${jobId}/apply-link`, {
        method: "POST",
        headers: authHeader
      });

      await fetchJobs();
    } catch (err) {
      console.error("Generate link error:", err);
      setError(err.message || "Unable to generate link");
    } finally {
      setBusyJobId(null);
    }
  };

  const disableLink = async (linkId, jobId) => {
    try {
      setError("");
      setBusyJobId(jobId);

      await requestJson(`${API_BASE}/jobs/apply-link/${linkId}/disable`, {
        method: "PATCH",
        headers: authHeader
      });

      await fetchJobs();
    } catch (err) {
      console.error("Disable link error:", err);
      setError(err.message || "Unable to disable link");
    } finally {
      setBusyJobId(null);
    }
  };

  const openLink = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div>
      <h4>Job Apply Links & QR Codes</h4>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <table className="table table-bordered">
        <thead className="table-dark">
          <tr>
            <th>Job</th>
            <th>Apply URL</th>
            <th>QR Code</th>
            <th>Expiry</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {loading && (
            <tr>
              <td colSpan="5" className="text-center">Loading job links...</td>
            </tr>
          )}

          {!loading && jobs.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center">No jobs found</td>
            </tr>
          )}

          {!loading && jobs.map((job) => {
            const link = links[job.id];
            const url = link
              ? `${APP_CONFIG.BASE_PUBLIC_URL}/apply/${link.slug}?job_id=${job.id}`
              : null;

            return (
              <tr key={job.id}>
                <td>{job.title}</td>

                <td>
                  {url ? (
                    <button
                      type="button"
                      className="btn btn-link p-0 text-start"
                      onClick={() => openLink(url)}
                    >
                      {url}
                    </button>
                  ) : (
                    <span className="text-muted">Not generated</span>
                  )}
                </td>

                <td>
                  {url && <QRCodeCanvas value={url} size={80} />}
                </td>

                <td>{link?.expires_at || "-"}</td>

                <td>
                  {!url ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-success"
                      disabled={busyJobId === job.id}
                      onClick={() => generateLink(job.id)}
                    >
                      {busyJobId === job.id ? "Generating..." : "Generate"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      disabled={busyJobId === job.id}
                      onClick={() => disableLink(link.id, job.id)}
                    >
                      {busyJobId === job.id ? "Disabling..." : "Disable"}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default JobLinkManager;
