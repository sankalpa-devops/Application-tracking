import { QRCodeCanvas } from "qrcode.react";
import { useCallback, useEffect, useMemo, useState } from "react";
import APP_CONFIG from "../config/appConfig";
import {
  createTransferRequestLink,
  disableTransferRequestLink,
  getTransferRequestLinks,
  getTransferRequests,
  updateTransferRequest,
  mdApproveTransferRequest,
  generateTransferLetter,
} from "../services/transferRequestService";
import { Modal } from "react-bootstrap";

const statusOptions = ["Pending", "Under Review", "Approved", "Rejected", "Completed"];

const TransferRequestsPage = ({ currentUser }) => {
  const [links, setLinks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [title, setTitle] = useState("Employee Transfer Request");
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const isMD = currentUser?.role?.toLowerCase() === "md";

  const activeLinks = useMemo(
    () => links.filter((link) => link.is_active),
    [links]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const [linkData, requestData] = await Promise.all([
        getTransferRequestLinks(),
        getTransferRequests(),
      ]);

      setLinks(linkData);
      // Filter out rejected requests from main monitor
      const activeRequests = requestData.filter(request => request.status !== "Rejected");
      setRequests(activeRequests);
      setReviewNotes(
        activeRequests.reduce((notes, item) => {
          notes[item.id] = item.review_note || "";
          return notes;
        }, {})
      );
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to load transfer requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateLink = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      await createTransferRequestLink({
        title,
        expires_in_days: Number(expiresInDays),
      });
      setMessage("Transfer request link created");
      await loadData();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to create request link");
    }
  };

  const handleDisableLink = async (linkId) => {
    setMessage("");

    try {
      await disableTransferRequestLink(linkId);
      setMessage("Transfer request link disabled");
      await loadData();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to disable request link");
    }
  };


  const copyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Transfer request URL copied");
    } catch (err) {
      setMessage(url);
    }
  };

  const handleOpenModal = (request) => {
    setSelectedRequest(request);
    setReviewNotes((current) => ({
      ...current,
      [request.id]: request.review_note || "",
    }));
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
  };

  const handleModalStatusChange = async (status) => {
    if (!selectedRequest) return;
    setMessage("");

    try {
      const updated = await updateTransferRequest(selectedRequest.id, {
        status,
        review_note: reviewNotes[selectedRequest.id] || "",
      });

      setRequests((current) =>
        current.map((item) => (item.id === selectedRequest.id ? updated : item))
      );
      setSelectedRequest(updated);
      setMessage("Transfer request updated");
      handleCloseModal();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to update transfer request");
    }
  };

  const handleModalMDApprove = async (action) => {
    if (!selectedRequest) return;
    setMessage("");

    try {
      const updated = await mdApproveTransferRequest(selectedRequest.id, {
        action,
        review_note: reviewNotes[selectedRequest.id] || "",
      });

      setRequests((current) =>
        current.map((item) => (item.id === selectedRequest.id ? updated : item))
      );
      setSelectedRequest(updated);
      setMessage(`Transfer request ${action}ed by MD`);
      handleCloseModal();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to approve transfer request");
    }
  };

  const handleModalGenerateLetter = async () => {
    if (!selectedRequest) return;
    setMessage("");

    try {
      const result = await generateTransferLetter(selectedRequest.id, {
        send_email: true,
      });

      setRequests((current) =>
        current.map((item) => (item.id === selectedRequest.id ? result.request : item))
      );
      setSelectedRequest(result.request);
      setMessage("Transfer letter generated and sent successfully");
      handleCloseModal();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to generate transfer letter");
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Employee Transfer Requests</h3>
          <p style={styles.subtitle}>
            Create request URLs and monitor department, location, and field transfer requests.
          </p>
        </div>
        <button className="btn btn-outline-primary" onClick={loadData} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div style={styles.grid}>
        <section style={styles.panel}>
          <h5>Create Request URL</h5>
          <form onSubmit={handleCreateLink}>
            <div className="mb-3">
              <label className="form-label">Request Title</label>
              <input
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
                onChange={(e) => setExpiresInDays(e.target.value)}
                required
              />
            </div>

            <button className="btn btn-primary" type="submit">
              Generate URL
            </button>
          </form>
        </section>

        <section style={styles.panel}>
          <h5>Active URLs</h5>
          {activeLinks.length === 0 && <p className="text-muted">No active transfer request URL.</p>}
          {activeLinks.map((link) => {
            const url = `${APP_CONFIG.BASE_PUBLIC_URL}/transfer-request/${link.slug}`;

            return (
              <div key={link.id} style={styles.linkBox}>
                <div style={styles.linkText}>
                  <strong>{link.title}</strong>
                  <button className="btn btn-link p-0 text-start" onClick={() => copyUrl(url)}>
                    {url}
                  </button>
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

      <section style={styles.panel}>
        <h5>Request Monitor</h5>
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-dark">
              <tr>
                <th>Employee</th>
                <th>Request Type</th>
                <th>Department</th>
                <th>Location</th>
                <th>Field</th>
                <th>Reason</th>
                <th>Preferred Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr 
                  key={request.id} 
                  style={{ cursor: "pointer" }}
                  onClick={() => handleOpenModal(request)}
                >
                  <td>
                    <strong>{request.employee_name}</strong>
                    <div className="text-muted">{request.employee_id}</div>
                    <div className="text-muted">{request.email || request.phone || ""}</div>
                  </td>
                  <td>
                    <span className={`badge ${getRequestTypeBadgeClass(request.request_type)}`}>
                      {request.request_type}
                    </span>
                  </td>
                  <td>
                    {request.current_department}
                    <div className="text-muted">to {request.requested_department}</div>
                  </td>
                  <td>
                    {request.current_location}
                    <div className="text-muted">to {request.requested_location}</div>
                  </td>
                  <td>
                    {request.current_field || "N/A"}
                    <div className="text-muted">to {request.requested_field || "N/A"}</div>
                  </td>
                  <td style={styles.reason}>{request.reason}</td>
                  <td>{request.preferred_transfer_date || "N/A"}</td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-primary">View Details</button>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={9}>No transfer requests submitted.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Request Details Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Transfer Request Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Employee:</strong> {selectedRequest.employee_name}
                  <br />
                  <small className="text-muted">{selectedRequest.employee_id}</small>
                </div>
                <div className="col-md-6">
                  <strong>Contact:</strong> {selectedRequest.email || selectedRequest.phone || "N/A"}
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <strong>Request Type:</strong>
                  <span className={`badge ${getRequestTypeBadgeClass(selectedRequest.request_type)} ms-2`}>
                    {selectedRequest.request_type}
                  </span>
                </div>
                <div className="col-md-4">
                  <strong>Status:</strong>
                  <span className={`badge ${getStatusBadgeClass(selectedRequest.status)} ms-2`}>
                    {selectedRequest.status}
                  </span>
                </div>
                <div className="col-md-4">
                  <strong>Preferred Date:</strong> {selectedRequest.preferred_transfer_date || "N/A"}
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <strong>Current Department:</strong> {selectedRequest.current_department}
                </div>
                <div className="col-md-4">
                  <strong>Requested Department:</strong> {selectedRequest.requested_department}
                </div>
                <div className="col-md-4">
                  <strong>Current Location:</strong> {selectedRequest.current_location}
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <strong>Requested Location:</strong> {selectedRequest.requested_location}
                </div>
                <div className="col-md-4">
                  <strong>Current Field:</strong> {selectedRequest.current_field || "N/A"}
                </div>
                <div className="col-md-4">
                  <strong>Requested Field:</strong> {selectedRequest.requested_field || "N/A"}
                </div>
              </div>

              <div className="mb-3">
                <strong>Reason:</strong>
                <p className="mt-1">{selectedRequest.reason}</p>
              </div>

              <hr />

              <div className="mb-3">
                <label className="form-label fw-bold">Status Update</label>
                {!isMD ? (
                  <select
                    className="form-select"
                    value={selectedRequest.status}
                    onChange={(e) => handleModalStatusChange(e.target.value)}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div>
                    <span className={`badge ${getStatusBadgeClass(selectedRequest.status)} fs-6`}>
                      {selectedRequest.status}
                    </span>
                    {selectedRequest.top_approver_name && (
                      <div className="text-muted mt-2">
                        <small>
                          Approved by: {selectedRequest.top_approver_role} ({selectedRequest.top_approver_name})
                        </small>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Review Note</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={reviewNotes[selectedRequest.id] || ""}
                  onChange={(e) =>
                    setReviewNotes((current) => ({
                      ...current,
                      [selectedRequest.id]: e.target.value,
                    }))
                  }
                  placeholder="Add your review notes here..."
                />
              </div>

              {isMD && (
                <div className="mb-3">
                  <label className="form-label fw-bold">MD Actions</label>
                  <div className="d-flex gap-2">
                    {selectedRequest.status === "Under Review" && (
                      <>
                        <button
                          className="btn btn-success"
                          onClick={() => handleModalMDApprove("approve")}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleModalMDApprove("reject")}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {selectedRequest.status === "Approved" && !selectedRequest.transfer_letter_path && (
                      <button
                        className="btn btn-primary"
                        onClick={handleModalGenerateLetter}
                      >
                        Generate Letter
                      </button>
                    )}
                    {selectedRequest.transfer_letter_path && (
                      <span className="text-success">
                        ✓ Transfer letter sent successfully
                      </span>
                    )}
                  </div>
                </div>
              )}

              {!isMD && (
                <button
                  className="btn btn-outline-primary"
                  onClick={() => handleModalStatusChange(selectedRequest.status)}
                >
                  Save Changes
                </button>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" onClick={handleCloseModal}>
            Close
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TransferRequestsPage;

const getRequestTypeBadgeClass = (type) => {
  switch (type) {
    case "department":
      return "bg-info";
    case "management":
      return "bg-warning";
    case "employee":
      return "bg-secondary";
    default:
      return "bg-secondary";
  }
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case "Pending":
      return "bg-secondary";
    case "Under Review":
      return "bg-info";
    case "Approved":
      return "bg-success";
    case "Rejected":
      return "bg-danger";
    case "Completed":
      return "bg-primary";
    default:
      return "bg-secondary";
  }
};

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
  reason: {
    maxWidth: "260px",
    whiteSpace: "normal",
  },
};
