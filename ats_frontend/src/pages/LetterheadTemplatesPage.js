import { useCallback, useEffect, useState } from "react";
import {
  createLetterheadTemplate,
  getLetterheadTemplates,
  updateLetterheadTemplate,
  deleteLetterheadTemplate,
  uploadLogo,
} from "../services/letterheadService";

const LetterheadTemplatesPage = ({ currentUser }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    template_name: "",
    template_type: "loi",
    company_name: "",
    company_address: "",
    company_phone: "",
    company_email: "",
    footer_text: "",
    signature_block: "",
    header_color: "#1a1a1a",
    footer_color: "#666666",
    is_active: true,
    is_default: false,
  });

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const data = await getLetterheadTemplates();
      setTemplates(data);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (editingTemplate) {
        await updateLetterheadTemplate(editingTemplate.id, formData);
        setMessage("Template updated successfully");
      } else {
        await createLetterheadTemplate(formData);
        setMessage("Template created successfully");
      }
      setShowForm(false);
      setEditingTemplate(null);
      setFormData({
        template_name: "",
        template_type: "loi",
        company_name: "",
        company_address: "",
        company_phone: "",
        company_email: "",
        footer_text: "",
        signature_block: "",
        header_color: "#1a1a1a",
        footer_color: "#666666",
        is_active: true,
        is_default: false,
      });
      await loadTemplates();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to save template");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      template_name: template.template_name,
      template_type: template.template_type,
      company_name: template.company_name || "",
      company_address: template.company_address || "",
      company_phone: template.company_phone || "",
      company_email: template.company_email || "",
      footer_text: template.footer_text || "",
      signature_block: template.signature_block || "",
      header_color: template.header_color || "#1a1a1a",
      footer_color: template.footer_color || "#666666",
      is_active: template.is_active,
      is_default: template.is_default,
    });
    setShowForm(true);
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return;

    setMessage("");
    try {
      await deleteLetterheadTemplate(templateId);
      setMessage("Template deleted successfully");
      await loadTemplates();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to delete template");
    }
  };

  const handleLogoUpload = async (templateId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMessage("Uploading logo...");
    try {
      await uploadLogo(templateId, file);
      setMessage("Logo uploaded successfully");
      await loadTemplates();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to upload logo");
    }
  };

  const handleSetDefault = async (template) => {
    setMessage("");
    try {
      await updateLetterheadTemplate(template.id, { is_default: true });
      setMessage("Default template updated");
      await loadTemplates();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to update default template");
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Letterhead Templates</h3>
          <p style={styles.subtitle}>
            Manage letterhead templates for Letters of Intent and Transfer Letters
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingTemplate(null);
            setFormData({
              template_name: "",
              template_type: "loi",
              company_name: "",
              company_address: "",
              company_phone: "",
              company_email: "",
              footer_text: "",
              signature_block: "",
              header_color: "#1a1a1a",
              footer_color: "#666666",
              is_active: true,
              is_default: false,
            });
            setShowForm(true);
          }}
        >
          + New Template
        </button>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      {showForm && (
        <div style={styles.panel}>
          <h5>{editingTemplate ? "Edit Template" : "Create New Template"}</h5>
          <form onSubmit={handleSubmit}>
            <div style={styles.grid}>
              <div className="mb-3">
                <label className="form-label">Template Name</label>
                <input
                  className="form-control"
                  name="template_name"
                  value={formData.template_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Template Type</label>
                <select
                  className="form-select"
                  name="template_type"
                  value={formData.template_type}
                  onChange={handleChange}
                  required
                >
                  <option value="loi">Letter of Intent</option>
                  <option value="transfer_letter">Transfer Letter</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Company Name</label>
              <input
                className="form-control"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Company Address</label>
              <textarea
                className="form-control"
                name="company_address"
                rows="2"
                value={formData.company_address}
                onChange={handleChange}
              />
            </div>

            <div style={styles.grid}>
              <div className="mb-3">
                <label className="form-label">Phone</label>
                <input
                  className="form-control"
                  name="company_phone"
                  value={formData.company_phone}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  className="form-control"
                  name="company_email"
                  value={formData.company_email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Footer Text</label>
              <textarea
                className="form-control"
                name="footer_text"
                rows="2"
                value={formData.footer_text}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Signature Block</label>
              <textarea
                className="form-control"
                name="signature_block"
                rows="2"
                value={formData.signature_block}
                onChange={handleChange}
              />
            </div>

            <div style={styles.grid}>
              <div className="mb-3">
                <label className="form-label">Header Color</label>
                <input
                  type="color"
                  className="form-control form-control-color"
                  name="header_color"
                  value={formData.header_color}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Footer Color</label>
                <input
                  type="color"
                  className="form-control form-control-color"
                  name="footer_color"
                  value={formData.footer_color}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={styles.grid}>
              <div className="mb-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="is_active"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="is_active">
                    Active
                  </label>
                </div>
              </div>
              <div className="mb-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="is_default"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="is_default">
                    Set as Default
                  </label>
                </div>
              </div>
            </div>

            <div style={styles.buttonGroup}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Saving..." : editingTemplate ? "Update Template" : "Create Template"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingTemplate(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.panel}>
        <h5>Existing Templates</h5>
        {templates.length === 0 ? (
          <p className="text-muted">No templates found. Create your first template.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Default</th>
                  <th>Logo</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id}>
                    <td>
                      <strong>{template.template_name}</strong>
                    </td>
                    <td>
                      <span className={`badge ${getTemplateTypeBadge(template.template_type)}`}>
                        {template.template_type}
                      </span>
                    </td>
                    <td>{template.company_name || "N/A"}</td>
                    <td>
                      <span className={`badge ${template.is_active ? "bg-success" : "bg-secondary"}`}>
                        {template.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      {template.is_default ? (
                        <span className="badge bg-primary">Default</span>
                      ) : (
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleSetDefault(template)}
                        >
                          Set Default
                        </button>
                      )}
                    </td>
                    <td>
                      {template.company_logo_path ? (
                        <span className="text-success">✓ Uploaded</span>
                      ) : (
                        <label className="btn btn-sm btn-outline-secondary mb-0">
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(e) => handleLogoUpload(template.id, e)}
                          />
                        </label>
                      )}
                    </td>
                    <td>
                      <div className="btn-group">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleEdit(template)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(template.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const getTemplateTypeBadge = (type) => {
  switch (type) {
    case "loi":
      return "bg-info";
    case "transfer_letter":
      return "bg-warning";
    case "general":
      return "bg-secondary";
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
  panel: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
  },
  buttonGroup: {
    display: "flex",
    gap: "8px",
  },
};

export default LetterheadTemplatesPage;
