import { useCallback, useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import {
  getRejectedTransferRequests,
  updateTransferRequest,
} from "../services/transferRequestService";

const statusOptions = ["Pending", "Under Review", "Approved", "Rejected", "Completed"];

const RejectedTransferRequestsPage = ({ currentUser }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [reviewNotes, setReviewNotes] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadRejectedRequests = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const requestData = await getRejectedTransferRequests();
      setRequests(requestData);
      setReviewNotes(
        requestData.reduce((notes, item) => {
          notes[item.id] = item.review_note || "";
          return notes;
        }, {})
      );
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to load rejected transfer requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRejectedRequests();
  }, [loadRejectedRequests]);

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
      loadRejectedRequests();
      handleCloseModal();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to update transfer request");
    }
  };

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

  return (
    <div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "16px",
        marginBottom: "18px",
      }}>
        <div>
          <h3 style={{ margin: 0, color: "#111827" }}>Rejected Transfer Requests</h3>
          <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
            View and manage rejected transfer requests.
          </p>
        </div>
        <button
          className="btn btn-outline-primary"
          onClick={loadRejectedRequests}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "16px",
      }}>
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
                  <td style={{ maxWidth: "200px", whiteSpace: "pre-wrap" }}>{request.reason}</td>
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
                  <td colSpan={9}>No rejected transfer requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Details Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Rejected Transfer Request Details</Modal.Title>
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

              <div className="mb-3">
                <label className="form-label fw-bold">Status Update</label>
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
              </div>

              <button
                className="btn btn-outline-primary"
                onClick={() => handleModalStatusChange(selectedRequest.status)}
              >
                Save Changes
              </button>
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

export default RejectedTransferRequestsPage;
