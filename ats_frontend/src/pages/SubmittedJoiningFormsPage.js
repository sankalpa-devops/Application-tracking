import { useCallback, useEffect, useMemo, useState } from "react";
import { getJoiningForms, hrUpdateJoiningForm } from "../services/joiningFormService";

const SubmittedJoiningFormsPage = () => {
  const [forms, setForms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Edit states
  const [editingForm, setEditingForm] = useState(null);
  const [editEmployeeId, setEditEmployeeId] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editAdditionalData, setEditAdditionalData] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const formData = await getJoiningForms();
      setForms(formData);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to load submitted joining forms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredForms = useMemo(() => {
    return forms.filter((f) => {
      const term = searchTerm.toLowerCase();
      return (
        f.candidate_name?.toLowerCase().includes(term) ||
        f.candidate_email?.toLowerCase().includes(term) ||
        f.employee_id?.toLowerCase().includes(term)
      );
    });
  }, [forms, searchTerm]);

  const startEdit = (form) => {
    setEditingForm(form);
    setEditEmployeeId(form.employee_id || "");
    setEditStatus(form.status || "");
    setEditAdditionalData(form.additional_data || {});
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await hrUpdateJoiningForm(editingForm.id, {
        employee_id: editEmployeeId,
        status: editStatus,
        additional_data: editAdditionalData,
      });
      setMessage("Joining form updated successfully by HR");
      setEditingForm(null);
      await loadData();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Failed to update joining form");
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditAdditionalData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Photo size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAdditionalData((current) => ({
          ...current,
          photo_base64: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Submitted Joining Forms</h3>
          <p style={styles.subtitle}>
            Review, edit, and manage candidate submitted joining forms. Click on any candidate row to make corrections.
          </p>
        </div>
        <button className="btn btn-outline-primary" onClick={loadData} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {message && <div className="alert alert-info py-2 mb-3">{message}</div>}

      <div className="card p-3 mb-4">
        <label className="form-label fw-bold">Search Submitted Forms</label>
        <input
          type="text"
          className="form-control"
          placeholder="Filter by employee name, email, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <section style={styles.panel}>
        <div className="table-responsive">
          <table className="table table-hover table-bordered align-middle">
            <thead className="table-dark">
              <tr>
                <th>Employee</th>
                <th>Employee ID</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {filteredForms.map((form) => (
                <tr
                  key={form.id}
                  onClick={() => startEdit(form)}
                  style={{ cursor: "pointer" }}
                  title="Click to view/edit details"
                >
                  <td className="fw-bold text-primary">{form.candidate_name || "N/A"}</td>
                  <td>{form.employee_id}</td>
                  <td>
                    <div>{form.candidate_email || "N/A"}</div>
                    <small className="text-muted">{form.candidate_phone || ""}</small>
                  </td>
                  <td>
                    <span className={`badge ${form.status === "Finalized" ? "bg-success" : "bg-warning"}`}>
                      {form.status}
                    </span>
                  </td>
                  <td>{form.submitted_at ? new Date(form.submitted_at).toLocaleString() : "N/A"}</td>
                </tr>
              ))}
              {filteredForms.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-3 text-muted">
                    No submitted joining forms found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editingForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h4 style={{ margin: 0 }}>Correct Candidate Joining Form</h4>
              <button type="button" onClick={() => setEditingForm(null)} style={styles.closeBtn}>✖</button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
              <div style={styles.modalScrollable}>
                
                {/* 1. PHOTO SECTION */}
                <h6 style={styles.sectionHeader}>Passport Size Photo</h6>
                <div style={styles.editGrid}>
                  <div className="mb-3" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Replace Passport Photo</label>
                    <input type="file" className="form-control" accept="image/*" onChange={handlePhotoChange} />
                    {editAdditionalData.photo_base64 && (
                      <div className="mt-2">
                        <img
                          src={editAdditionalData.photo_base64}
                          alt="Passport Size"
                          style={{ width: "100px", height: "120px", objectFit: "cover", border: "1px solid #ccc", borderRadius: "4px" }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. SUBMISSION SETTINGS */}
                <h6 style={styles.sectionHeader}>Submission Settings</h6>
                <div style={styles.editGrid}>
                  <div className="mb-3">
                    <label className="form-label">Employee ID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editEmployeeId}
                      onChange={(e) => setEditEmployeeId(e.target.value.toUpperCase())}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      required
                    >
                      <option value="Submitted">Submitted</option>
                      <option value="Finalized">Finalized</option>
                    </select>
                  </div>
                </div>

                {/* 3. PERSONAL PARTICULARS */}
                <h6 style={styles.sectionHeader}>Personal Particulars</h6>
                <div style={styles.editGrid}>
                  <div className="mb-3">
                    <label className="form-label">Father's Name</label>
                    <input type="text" className="form-control" name="father_name" value={editAdditionalData.father_name || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Mother's Name</label>
                    <input type="text" className="form-control" name="mother_name" value={editAdditionalData.mother_name || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Spouse's Name</label>
                    <input type="text" className="form-control" name="spouse_name" value={editAdditionalData.spouse_name || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Place of Birth</label>
                    <input type="text" className="form-control" name="place_of_birth" value={editAdditionalData.place_of_birth || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Home Town</label>
                    <input type="text" className="form-control" name="home_town" value={editAdditionalData.home_town || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Domicile State</label>
                    <input type="text" className="form-control" name="domicile_state" value={editAdditionalData.domicile_state || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Marital Status</label>
                    <select className="form-select" name="marital_status" value={editAdditionalData.marital_status || "unmarried"} onChange={handleEditChange}>
                      <option value="unmarried">unmarried</option>
                      <option value="married">married</option>
                      <option value="widow">widow</option>
                      <option value="separated">separated</option>
                      <option value="divorced">divorced</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Date of Marriage</label>
                    <input type="date" className="form-control" name="date_of_marriage" value={editAdditionalData.date_of_marriage || ""} onChange={handleEditChange} />
                  </div>
                </div>

                {/* 4. ADDRESS AND EMERGENCY CONTACT */}
                <h6 style={styles.sectionHeader}>Address and Emergency Contact</h6>
                <div style={styles.editGrid}>
                  <div className="mb-3" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Permanent Address</label>
                    <textarea className="form-control" rows="2" name="permanent_address" value={editAdditionalData.permanent_address || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Mailing Address</label>
                    <textarea className="form-control" rows="2" name="mailing_address" value={editAdditionalData.mailing_address || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Emergency Contact Number</label>
                    <input type="text" className="form-control" name="emergency_contact_number" value={editAdditionalData.emergency_contact_number || ""} onChange={handleEditChange} />
                  </div>
                </div>

                {/* 5. IDENTITY & PHYSICAL DETAILS */}
                <h6 style={styles.sectionHeader}>Identity and Physical Details</h6>
                <div style={styles.editGrid}>
                  <div className="mb-3">
                    <label className="form-label">Election Card No.</label>
                    <input type="text" className="form-control" name="election_card_no" value={editAdditionalData.election_card_no || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Passport No.</label>
                    <input type="text" className="form-control" name="passport_no" value={editAdditionalData.passport_no || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Passport Place of Issue</label>
                    <input type="text" className="form-control" name="passport_place_of_issue" value={editAdditionalData.passport_place_of_issue || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Passport Date of Issue</label>
                    <input type="date" className="form-control" name="passport_date_of_issue" value={editAdditionalData.passport_date_of_issue || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Passport Valid Upto</label>
                    <input type="date" className="form-control" name="passport_valid_upto" value={editAdditionalData.passport_valid_upto || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Driving Licence No.</label>
                    <input type="text" className="form-control" name="driving_licence_no" value={editAdditionalData.driving_licence_no || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Driving Licence Issued By</label>
                    <input type="text" className="form-control" name="driving_licence_issued_by" value={editAdditionalData.driving_licence_issued_by || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Driving Licence Valid Upto</label>
                    <input type="date" className="form-control" name="driving_licence_valid_upto" value={editAdditionalData.driving_licence_valid_upto || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Ration Card No.</label>
                    <input type="text" className="form-control" name="ration_card_no" value={editAdditionalData.ration_card_no || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Ration Card Issued By</label>
                    <input type="text" className="form-control" name="ration_card_issued_by" value={editAdditionalData.ration_card_issued_by || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Height (Cms.)</label>
                    <input type="text" className="form-control" name="height_cms" value={editAdditionalData.height_cms || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Weight (Kgs.)</label>
                    <input type="text" className="form-control" name="weight_kgs" value={editAdditionalData.weight_kgs || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Blood Group</label>
                    <input type="text" className="form-control" name="blood_group" value={editAdditionalData.blood_group || ""} onChange={handleEditChange} />
                  </div>
                </div>

                {/* 6. BACKGROUND DETAILS */}
                <h6 style={styles.sectionHeader}>Background Details</h6>
                <div style={styles.editGrid}>
                  <div className="mb-3">
                    <label className="form-label">Religion</label>
                    <input type="text" className="form-control" name="religion" value={editAdditionalData.religion || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Caste</label>
                    <input type="text" className="form-control" name="caste" value={editAdditionalData.caste || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Category</label>
                    <input type="text" className="form-control" name="category" value={editAdditionalData.category || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Ailment Details</label>
                    <textarea className="form-control" rows="2" name="ailment_details" value={editAdditionalData.ailment_details || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Disability Details</label>
                    <textarea className="form-control" rows="2" name="disability_details" value={editAdditionalData.disability_details || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Languages Known</label>
                    <textarea className="form-control" rows="2" name="languages_known" value={editAdditionalData.languages_known || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Hobby</label>
                    <textarea className="form-control" rows="2" name="hobby" value={editAdditionalData.hobby || ""} onChange={handleEditChange} />
                  </div>
                </div>

                {/* 7. EDUCATION, FAMILY, WORK, BANK */}
                <h6 style={styles.sectionHeader}>Family, Education, Work, and Bank</h6>
                <div style={styles.editGrid}>
                  <div className="mb-3" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Education Summary</label>
                    <textarea className="form-control" rows="3" name="education_summary" value={editAdditionalData.education_summary || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Family Members</label>
                    <textarea className="form-control" rows="3" name="family_members_text" value={editAdditionalData.family_members_text || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Relative/Friend Working in Company</label>
                    <textarea className="form-control" rows="2" name="relative_details" value={editAdditionalData.relative_details || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Work Experience Summary</label>
                    <textarea className="form-control" rows="3" name="work_experience_summary" value={editAdditionalData.work_experience_summary || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Last Job Responsibilities</label>
                    <textarea className="form-control" rows="3" name="last_job_responsibilities" value={editAdditionalData.last_job_responsibilities || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Bank Name and Address</label>
                    <textarea className="form-control" rows="2" name="bank_name_address" value={editAdditionalData.bank_name_address || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Bank Account Number</label>
                    <input type="text" className="form-control" name="bank_account_no" value={editAdditionalData.bank_account_no || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Bank Account Type</label>
                    <input type="text" className="form-control" name="bank_account_type" value={editAdditionalData.bank_account_type || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Bank IFSC</label>
                    <input type="text" className="form-control" name="bank_ifsc" value={editAdditionalData.bank_ifsc || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Bank MICR</label>
                    <input type="text" className="form-control" name="bank_micr" value={editAdditionalData.bank_micr || ""} onChange={handleEditChange} />
                  </div>
                </div>

                {/* 8. DECLARATION DETAILS */}
                <h6 style={styles.sectionHeader}>Declaration Details</h6>
                <div style={styles.editGrid}>
                  <div className="mb-3">
                    <label className="form-label">Ever Arrested?</label>
                    <select className="form-select" name="ever_arrested" value={editAdditionalData.ever_arrested || "no"} onChange={handleEditChange}>
                      <option value="no">no</option>
                      <option value="yes">yes</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Ever Convicted?</label>
                    <select className="form-select" name="ever_convicted" value={editAdditionalData.ever_convicted || "no"} onChange={handleEditChange}>
                      <option value="no">no</option>
                      <option value="yes">yes</option>
                    </select>
                  </div>
                  <div className="mb-3" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Legal Details</label>
                    <textarea className="form-control" rows="2" name="legal_details" value={editAdditionalData.legal_details || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Been Overseas?</label>
                    <select className="form-select" name="been_overseas" value={editAdditionalData.been_overseas || "no"} onChange={handleEditChange}>
                      <option value="no">no</option>
                      <option value="yes">yes</option>
                    </select>
                  </div>
                  <div className="mb-3" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Overseas Details</label>
                    <textarea className="form-control" rows="2" name="overseas_details" value={editAdditionalData.overseas_details || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Karnataka Living Details</label>
                    <textarea className="form-control" rows="2" name="karnataka_living_details" value={editAdditionalData.karnataka_living_details || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Technical/Professional Training</label>
                    <textarea className="form-control" rows="2" name="training_summary" value={editAdditionalData.training_summary || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Publication & Presentation Details</label>
                    <textarea className="form-control" rows="2" name="publication_details" value={editAdditionalData.publication_details || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Declaration Date</label>
                    <input type="date" className="form-control" name="declaration_date" value={editAdditionalData.declaration_date || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Declaration Place</label>
                    <input type="text" className="form-control" name="declaration_place" value={editAdditionalData.declaration_place || ""} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Certificate Details</label>
                    <textarea className="form-control" rows="2" name="certificate_details" value={editAdditionalData.certificate_details || ""} onChange={handleEditChange} />
                  </div>
                </div>

              </div>

              <div style={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingForm(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmittedJoiningFormsPage;

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
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: "24px",
    borderRadius: "8px",
    maxWidth: "800px",
    width: "90%",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "12px",
    marginBottom: "16px",
  },
  closeBtn: {
    border: "none",
    background: "none",
    fontSize: "18px",
    cursor: "pointer",
  },
  sectionHeader: {
    fontWeight: "bold",
    borderBottom: "1px solid #eee",
    paddingBottom: "4px",
    marginTop: "16px",
    marginBottom: "12px",
    color: "#4b5563",
  },
  modalScrollable: {
    overflowY: "auto",
    flex: 1,
    paddingRight: "10px",
  },
  editGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "0 12px",
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    borderTop: "1px solid #e5e7eb",
    paddingTop: "12px",
    marginTop: "16px",
  },
};
