import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  submitPublicTransferRequest,
  validatePublicTransferLink,
} from "../services/transferRequestService";

const initialForm = {
  employee_id: "",
  employee_name: "",
  email: "",
  phone: "",
  current_department: "",
  requested_department: "",
  current_location: "",
  requested_location: "",
  current_field: "",
  requested_field: "",
  preferred_transfer_date: "",
  reason: "",
  request_type: "employee",
};

const PublicTransferRequest = () => {
  const { slug } = useParams();
  const [linkInfo, setLinkInfo] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const validate = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await validatePublicTransferLink(slug);
        setLinkInfo(data);
      } catch (err) {
        setError(err.response?.data?.detail || "This transfer request link is invalid or expired.");
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [slug]);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      await submitPublicTransferRequest(slug, form);
      setMessage("Transfer request submitted successfully.");
      setForm(initialForm);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to submit transfer request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={styles.page}>Loading transfer request form...</div>;
  }

  if (error && !linkInfo) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2 style={styles.title}>Transfer Request</h2>
          <div className="alert alert-danger">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>{linkInfo?.title || "Employee Transfer Request"}</h2>
          <p style={styles.subtitle}>
            Submit your request for department, work location, or field transfer.
          </p>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.grid}>
            <Field
              label="Request Type"
              name="request_type"
              value={form.request_type}
              onChange={handleChange}
              required
              asSelect
            />
            <Field
              label="Employee ID"
              name="employee_id"
              value={form.employee_id}
              onChange={handleChange}
              required
            />
            <Field
              label="Employee Name"
              name="employee_name"
              value={form.employee_name}
              onChange={handleChange}
              required
            />
            <Field
              label="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />
            <Field
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />
            <Field
              label="Current Department"
              name="current_department"
              value={form.current_department}
              onChange={handleChange}
              required
            />
            <Field
              label="Requested Department"
              name="requested_department"
              value={form.requested_department}
              onChange={handleChange}
              required
            />
            <Field
              label="Current Work Location"
              name="current_location"
              value={form.current_location}
              onChange={handleChange}
              required
            />
            <Field
              label="Requested Work Location"
              name="requested_location"
              value={form.requested_location}
              onChange={handleChange}
              required
            />
            <Field
              label="Current Field"
              name="current_field"
              value={form.current_field}
              onChange={handleChange}
            />
            <Field
              label="Requested Field"
              name="requested_field"
              value={form.requested_field}
              onChange={handleChange}
            />
            <Field
              label="Preferred Transfer Date"
              type="date"
              name="preferred_transfer_date"
              value={form.preferred_transfer_date}
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Reason for Transfer</label>
            <textarea
              className="form-control"
              name="reason"
              rows="4"
              value={form.reason}
              onChange={handleChange}
              required
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
  );
};

const Field = ({ label, name, value, onChange, type = "text", required = false, asSelect = false }) => (
  <div className="mb-3">
    <label className="form-label">{label}</label>
    {asSelect ? (
      <select
        className="form-select"
        name={name}
        value={value}
        onChange={onChange}
        required={required}
      >
        <option value="employee">Employee Request</option>
        <option value="department">Department Request</option>
        <option value="management">Management Transfer</option>
      </select>
    ) : (
      <input
        className="form-control"
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
      />
    )}
  </div>
);

export default PublicTransferRequest;

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: "32px 16px",
  },
  card: {
    maxWidth: "920px",
    margin: "0 auto",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "24px",
  },
  header: {
    marginBottom: "20px",
  },
  title: {
    margin: 0,
    color: "#111827",
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#6b7280",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "0 16px",
  },
};
