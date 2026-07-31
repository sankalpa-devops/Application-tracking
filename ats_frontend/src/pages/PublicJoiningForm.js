import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  getJoiningFormDownloadUrl,
  getPublicJoiningSubmission,
  submitPublicJoiningForm,
  updatePublicJoiningForm,
  validatePublicJoiningFormLink,
} from "../services/joiningFormService";

const FormDisabledContext = createContext(false);

const initialAdditionalData = {
  father_name: "",
  mother_name: "",
  spouse_name: "",
  permanent_address: "",
  mailing_address: "",
  emergency_contact_number: "",
  place_of_birth: "",
  home_town: "",
  domicile_state: "",
  marital_status: "unmarried",
  date_of_marriage: "",
  election_card_no: "",
  passport_no: "",
  passport_place_of_issue: "",
  passport_date_of_issue: "",
  passport_valid_upto: "",
  driving_licence_no: "",
  driving_licence_issued_by: "",
  driving_licence_valid_upto: "",
  ration_card_no: "",
  ration_card_issued_by: "",
  height_cms: "",
  weight_kgs: "",
  blood_group: "",
  religion: "",
  caste: "",
  category: "",
  ailment_details: "",
  disability_details: "",
  languages_known: "",
  hobby: "",
  education_summary: "",
  family_members_text: "",
  relative_details: "",
  work_experience_summary: "",
  last_job_responsibilities: "",
  bank_name_address: "",
  bank_account_no: "",
  bank_account_type: "",
  bank_ifsc: "",
  bank_micr: "",
  ever_arrested: "no",
  ever_convicted: "no",
  legal_details: "",
  been_overseas: "no",
  overseas_details: "",
  karnataka_living_details: "",
  training_summary: "",
  publication_details: "",
  declaration_date: "",
  declaration_place: "",
  certificate_details: "",
};

const PublicJoiningForm = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const editTokenFromUrl = searchParams.get("edit");
  const storedEditToken = localStorage.getItem(`joining_edit_${slug}`);

  const [linkInfo, setLinkInfo] = useState(null);
  const [employeeId, setEmployeeId] = useState("");
  const [additionalData, setAdditionalData] = useState(initialAdditionalData);
  const [editToken, setEditToken] = useState(editTokenFromUrl || storedEditToken || "");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reviewMode, setReviewMode] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const downloadUrl = useMemo(
    () => (editToken ? getJoiningFormDownloadUrl(slug, editToken) : ""),
    [slug, editToken]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await validatePublicJoiningFormLink(slug);
        setLinkInfo(data);
        setEmployeeId(data.suggested_employee_id || "");

        const token = editTokenFromUrl || storedEditToken;
        if (token) {
          const submission = await getPublicJoiningSubmission(slug, token);
          setEmployeeId(submission.employee_id || data.suggested_employee_id || "");
          setAdditionalData({
            ...initialAdditionalData,
            ...(submission.additional_data || {}),
          });
          setEditToken(token);
          setReviewMode(true);
          if (submission.status === "Finalized") {
            setIsFinalized(true);
            setMessage("Response form submission done successfully.");
          }
        }
      } catch (err) {
        setError(err.response?.data?.detail || "This joining form link is invalid or expired.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug, editTokenFromUrl, storedEditToken]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setAdditionalData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Photo size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdditionalData((current) => ({
          ...current,
          photo_base64: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setShowVerifyModal(true);
  };

  const handleFinalizeSubmit = async (shouldFinalize = false) => {
    setSubmitting(true);
    setMessage("");
    setError("");
    setShowVerifyModal(false);

    try {
      const payload = {
        employee_id: employeeId,
        additional_data: additionalData,
        ...(shouldFinalize ? { status: "Finalized" } : {}),
      };
      const result = editToken
        ? await updatePublicJoiningForm(slug, { ...payload, edit_token: editToken })
        : await submitPublicJoiningForm(slug, payload);

      setEditToken(result.edit_token);
      localStorage.setItem(`joining_edit_${slug}`, result.edit_token);
      setSearchParams({ edit: result.edit_token });
      setReviewMode(true);

      if (shouldFinalize) {
        setIsFinalized(true);
        setMessage("Response form submission done successfully.");
        alert("Response form submission done successfully");
      } else {
        setMessage(editToken ? "Joining form updated successfully." : "Joining form submitted successfully.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to save joining form.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={styles.page}>Loading joining form...</div>;
  }

  if (error && !linkInfo) {
    return (
      <div style={styles.page}>
        <section style={styles.panel}>
          <h2 style={styles.title}>Joining Form</h2>
          <div className="alert alert-danger">{error}</div>
        </section>
      </div>
    );
  }

  const candidate = linkInfo?.candidate || {};

  return (
    <FormDisabledContext.Provider value={isFinalized}>
      <div style={styles.page}>
      <section style={styles.panel}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>{linkInfo?.title || "Joining Form"}</h2>
            <p style={styles.subtitle}>
              Confirm your details and complete only the joining information not collected during application.
            </p>
          </div>
          {reviewMode && (
            <a className="btn btn-outline-primary" href={downloadUrl} target="_blank" rel="noreferrer">
              Download PDF
            </a>
          )}
        </div>

        {isFinalized && (
          <div className="alert alert-success py-3 mb-4" style={{ fontWeight: "bold", fontSize: "16px", textAlign: "center" }}>
            ✓ Response form submission done successfully. Your details are finalized and frozen.
          </div>
        )}

        {message && !isFinalized && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <h5>Application Details</h5>
          <div style={styles.grid}>
            <ReadOnlyField label="Name" value={candidate.name} />
            <ReadOnlyField label="Email" value={candidate.email} />
            <ReadOnlyField label="Phone" value={candidate.phone} />
            <ReadOnlyField label="DOB" value={candidate.dob} />
            <ReadOnlyField label="PAN" value={candidate.pan} />
            <ReadOnlyField label="Aadhaar" value={candidate.aadhaar} />
            <ReadOnlyField label="UAN" value={candidate.uan} />
            <ReadOnlyField label="Current Location" value={candidate.current_location} />
            <div className="mb-3">
              <label className="form-label">Employee ID</label>
              <input
                className="form-control"
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value.toUpperCase())}
                required
                disabled={isFinalized}
              />
            </div>
          </div>

          <FormSection title="Passport Size Photo">
            <div className="mb-3" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Upload Passport Size Photo (JPG/PNG, Max 2MB)</label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={handlePhotoChange}
                disabled={isFinalized}
              />
              {additionalData.photo_base64 && (
                <div className="mt-2">
                  <img
                    src={additionalData.photo_base64}
                    alt="Passport Photo Preview"
                    style={{
                      width: "120px",
                      height: "150px",
                      objectFit: "cover",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              )}
            </div>
          </FormSection>

          <FormSection title="Personal Particulars">
            <Field label="Father's Name" name="father_name" value={additionalData.father_name} onChange={handleChange} required />
            <Field label="Mother's Name" name="mother_name" value={additionalData.mother_name} onChange={handleChange} />
            <Field label="Spouse's Name" name="spouse_name" value={additionalData.spouse_name} onChange={handleChange} />
            <Field label="Place of Birth" name="place_of_birth" value={additionalData.place_of_birth} onChange={handleChange} />
            <Field label="Home Town" name="home_town" value={additionalData.home_town} onChange={handleChange} />
            <Field label="Domicile State" name="domicile_state" value={additionalData.domicile_state} onChange={handleChange} />
            <Field label="Marital Status" name="marital_status" value={additionalData.marital_status} onChange={handleChange} asSelect options={["unmarried", "married", "widow", "separated", "divorced"]} />
            <Field label="Date of Marriage" type="date" name="date_of_marriage" value={additionalData.date_of_marriage} onChange={handleChange} />
          </FormSection>

          <FormSection title="Address and Emergency Contact">
            <Field label="Permanent Address" name="permanent_address" value={additionalData.permanent_address} onChange={handleChange} required asTextarea />
            <Field label="Mailing Address" name="mailing_address" value={additionalData.mailing_address} onChange={handleChange} required asTextarea />
            <Field label="Emergency Contact Number" name="emergency_contact_number" value={additionalData.emergency_contact_number} onChange={handleChange} required />
          </FormSection>

          <FormSection title="Identity and Physical Details">
            <Field label="Election Card No." name="election_card_no" value={additionalData.election_card_no} onChange={handleChange} />
            <Field label="Passport No." name="passport_no" value={additionalData.passport_no} onChange={handleChange} />
            <Field label="Passport Place of Issue" name="passport_place_of_issue" value={additionalData.passport_place_of_issue} onChange={handleChange} />
            <Field label="Passport Date of Issue" type="date" name="passport_date_of_issue" value={additionalData.passport_date_of_issue} onChange={handleChange} />
            <Field label="Passport Valid Upto" type="date" name="passport_valid_upto" value={additionalData.passport_valid_upto} onChange={handleChange} />
            <Field label="Driving Licence No." name="driving_licence_no" value={additionalData.driving_licence_no} onChange={handleChange} />
            <Field label="Driving Licence Issued By" name="driving_licence_issued_by" value={additionalData.driving_licence_issued_by} onChange={handleChange} />
            <Field label="Driving Licence Valid Upto" type="date" name="driving_licence_valid_upto" value={additionalData.driving_licence_valid_upto} onChange={handleChange} />
            <Field label="Ration Card No." name="ration_card_no" value={additionalData.ration_card_no} onChange={handleChange} />
            <Field label="Ration Card Issued By" name="ration_card_issued_by" value={additionalData.ration_card_issued_by} onChange={handleChange} />
            <Field label="Height (Cms.)" name="height_cms" value={additionalData.height_cms} onChange={handleChange} />
            <Field label="Weight (Kgs.)" name="weight_kgs" value={additionalData.weight_kgs} onChange={handleChange} />
            <Field label="Blood Group" name="blood_group" value={additionalData.blood_group} onChange={handleChange} />
          </FormSection>

          <FormSection title="Background Details">
            <Field label="Religion" name="religion" value={additionalData.religion} onChange={handleChange} />
            <Field label="Caste" name="caste" value={additionalData.caste} onChange={handleChange} />
            <Field label="Category" name="category" value={additionalData.category} onChange={handleChange} />
            <Field label="Ailment Details" name="ailment_details" value={additionalData.ailment_details} onChange={handleChange} />
            <Field label="Disability Details" name="disability_details" value={additionalData.disability_details} onChange={handleChange} />
            <Field label="Languages Known" name="languages_known" value={additionalData.languages_known} onChange={handleChange} asTextarea />
            <Field label="Hobby" name="hobby" value={additionalData.hobby} onChange={handleChange} asTextarea />
          </FormSection>

          <FormSection title="Family, Education, Work, and Bank">
            <Field label="Education Summary" name="education_summary" value={additionalData.education_summary} onChange={handleChange} asTextarea />
            <Field label="Family Members" name="family_members_text" value={additionalData.family_members_text} onChange={handleChange} asTextarea />
            <Field label="Relative/Friend Working in Company" name="relative_details" value={additionalData.relative_details} onChange={handleChange} asTextarea />
            <Field label="Work Experience Summary" name="work_experience_summary" value={additionalData.work_experience_summary} onChange={handleChange} asTextarea />
            <Field label="Last Job Responsibilities" name="last_job_responsibilities" value={additionalData.last_job_responsibilities} onChange={handleChange} asTextarea />
            <Field label="Bank Name and Address" name="bank_name_address" value={additionalData.bank_name_address} onChange={handleChange} asTextarea />
            <Field label="A/c. No." name="bank_account_no" value={additionalData.bank_account_no} onChange={handleChange} />
            <Field label="Type of A/c." name="bank_account_type" value={additionalData.bank_account_type} onChange={handleChange} />
            <Field label="IFSC No." name="bank_ifsc" value={additionalData.bank_ifsc} onChange={handleChange} />
            <Field label="MICR" name="bank_micr" value={additionalData.bank_micr} onChange={handleChange} />
          </FormSection>

          <FormSection title="Declaration Details">
            <Field label="Ever Arrested?" name="ever_arrested" value={additionalData.ever_arrested} onChange={handleChange} asSelect options={["no", "yes"]} />
            <Field label="Ever Convicted?" name="ever_convicted" value={additionalData.ever_convicted} onChange={handleChange} asSelect options={["no", "yes"]} />
            <Field label="Legal Details" name="legal_details" value={additionalData.legal_details} onChange={handleChange} asTextarea />
            <Field label="Been Overseas?" name="been_overseas" value={additionalData.been_overseas} onChange={handleChange} asSelect options={["no", "yes"]} />
            <Field label="Overseas Details" name="overseas_details" value={additionalData.overseas_details} onChange={handleChange} asTextarea />
            <Field label="Karnataka Living Details" name="karnataka_living_details" value={additionalData.karnataka_living_details} onChange={handleChange} asTextarea />
            <Field label="Technical/Professional Training" name="training_summary" value={additionalData.training_summary} onChange={handleChange} asTextarea />
            <Field label="Publication and Presentation Details" name="publication_details" value={additionalData.publication_details} onChange={handleChange} asTextarea />
            <Field label="Declaration Date" type="date" name="declaration_date" value={additionalData.declaration_date} onChange={handleChange} />
            <Field label="Declaration Place" name="declaration_place" value={additionalData.declaration_place} onChange={handleChange} />
            <Field label="Certificate Details" name="certificate_details" value={additionalData.certificate_details} onChange={handleChange} asTextarea />
          </FormSection>

          <div style={styles.actions}>
            {isFinalized ? (
              <button className="btn btn-success" type="button" disabled style={{ fontWeight: "bold" }}>
                ✓ Response form submission done successfully
              </button>
            ) : (
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? "Saving..." : reviewMode ? "Save Corrections" : "Submit and Review"}
              </button>
            )}
            {reviewMode && (
              <a className="btn btn-outline-secondary" href={downloadUrl} target="_blank" rel="noreferrer">
                Download Form
              </a>
            )}
          </div>
        </form>
      </section>

      {showVerifyModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h4 style={{ marginBottom: "15px" }}>Verify Your Details</h4>
            <p style={{ color: "#6b7280", marginBottom: "20px" }}>
              Please review all your details carefully. If you need to make any corrections, click <strong>Go Back & Edit</strong>. 
              Once you click <strong>Finalize & Freeze</strong>, your details will be locked and cannot be edited.
            </p>
            <div style={styles.modalScrollable}>
              <div style={styles.reviewGrid}>
                <div style={styles.reviewItem}><strong>Name:</strong> {candidate.name}</div>
                <div style={styles.reviewItem}><strong>Email:</strong> {candidate.email}</div>
                <div style={styles.reviewItem}><strong>Phone:</strong> {candidate.phone}</div>
                <div style={styles.reviewItem}><strong>DOB:</strong> {candidate.dob}</div>
                <div style={styles.reviewItem}><strong>PAN:</strong> {candidate.pan}</div>
                <div style={styles.reviewItem}><strong>Aadhaar:</strong> {candidate.aadhaar}</div>
                <div style={styles.reviewItem}><strong>UAN:</strong> {candidate.uan}</div>
                <div style={styles.reviewItem}><strong>Current Location:</strong> {candidate.current_location}</div>
                <div style={styles.reviewItem}><strong>Employee ID:</strong> {employeeId}</div>
                <div style={styles.reviewItem}><strong>Father's Name:</strong> {additionalData.father_name}</div>
                <div style={styles.reviewItem}><strong>Mother's Name:</strong> {additionalData.mother_name}</div>
                <div style={styles.reviewItem}><strong>Spouse's Name:</strong> {additionalData.spouse_name}</div>
                <div style={styles.reviewItem}><strong>Permanent Address:</strong> {additionalData.permanent_address}</div>
                <div style={styles.reviewItem}><strong>Mailing Address:</strong> {additionalData.mailing_address}</div>
                <div style={styles.reviewItem}><strong>Emergency Contact:</strong> {additionalData.emergency_contact_number}</div>
                <div style={styles.reviewItem}><strong>Place of Birth:</strong> {additionalData.place_of_birth}</div>
                <div style={styles.reviewItem}><strong>Home Town:</strong> {additionalData.home_town}</div>
                <div style={styles.reviewItem}><strong>Domicile State:</strong> {additionalData.domicile_state}</div>
                <div style={styles.reviewItem}><strong>Marital Status:</strong> {additionalData.marital_status}</div>
                <div style={styles.reviewItem}><strong>Date of Marriage:</strong> {additionalData.date_of_marriage}</div>
                <div style={styles.reviewItem}><strong>Election Card No:</strong> {additionalData.election_card_no}</div>
                <div style={styles.reviewItem}><strong>Passport No:</strong> {additionalData.passport_no}</div>
                <div style={styles.reviewItem}><strong>Passport Place of Issue:</strong> {additionalData.passport_place_of_issue}</div>
                <div style={styles.reviewItem}><strong>Passport Date of Issue:</strong> {additionalData.passport_date_of_issue}</div>
                <div style={styles.reviewItem}><strong>Passport Valid Upto:</strong> {additionalData.passport_valid_upto}</div>
                <div style={styles.reviewItem}><strong>Driving Licence No:</strong> {additionalData.driving_licence_no}</div>
                <div style={styles.reviewItem}><strong>Driving Licence Issued By:</strong> {additionalData.driving_licence_issued_by}</div>
                <div style={styles.reviewItem}><strong>Driving Licence Valid Upto:</strong> {additionalData.driving_licence_valid_upto}</div>
                <div style={styles.reviewItem}><strong>Ration Card No:</strong> {additionalData.ration_card_no}</div>
                <div style={styles.reviewItem}><strong>Ration Card Issued By:</strong> {additionalData.ration_card_issued_by}</div>
                <div style={styles.reviewItem}><strong>Height (Cms):</strong> {additionalData.height_cms}</div>
                <div style={styles.reviewItem}><strong>Weight (Kgs):</strong> {additionalData.weight_kgs}</div>
                <div style={styles.reviewItem}><strong>Blood Group:</strong> {additionalData.blood_group}</div>
                <div style={styles.reviewItem}><strong>Religion:</strong> {additionalData.religion}</div>
                <div style={styles.reviewItem}><strong>Caste:</strong> {additionalData.caste}</div>
                <div style={styles.reviewItem}><strong>Category:</strong> {additionalData.category}</div>
                <div style={styles.reviewItem}><strong>Ailment Details:</strong> {additionalData.ailment_details}</div>
                <div style={styles.reviewItem}><strong>Disability Details:</strong> {additionalData.disability_details}</div>
                <div style={styles.reviewItem}><strong>Languages Known:</strong> {additionalData.languages_known}</div>
                <div style={styles.reviewItem}><strong>Hobby:</strong> {additionalData.hobby}</div>
                <div style={styles.reviewItem}><strong>Education Summary:</strong> {additionalData.education_summary}</div>
                <div style={styles.reviewItem}><strong>Family Members:</strong> {additionalData.family_members_text}</div>
                <div style={styles.reviewItem}><strong>Relative Details:</strong> {additionalData.relative_details}</div>
                <div style={styles.reviewItem}><strong>Work Experience:</strong> {additionalData.work_experience_summary}</div>
                <div style={styles.reviewItem}><strong>Last Job Responsibilities:</strong> {additionalData.last_job_responsibilities}</div>
                <div style={styles.reviewItem}><strong>Bank Name & Address:</strong> {additionalData.bank_name_address}</div>
                <div style={styles.reviewItem}><strong>Bank Account No:</strong> {additionalData.bank_account_no}</div>
                <div style={styles.reviewItem}><strong>Bank Account Type:</strong> {additionalData.bank_account_type}</div>
                <div style={styles.reviewItem}><strong>Bank IFSC:</strong> {additionalData.bank_ifsc}</div>
                <div style={styles.reviewItem}><strong>Bank MICR:</strong> {additionalData.bank_micr}</div>
                <div style={styles.reviewItem}><strong>Ever Arrested?:</strong> {additionalData.ever_arrested}</div>
                <div style={styles.reviewItem}><strong>Ever Convicted?:</strong> {additionalData.ever_convicted}</div>
                <div style={styles.reviewItem}><strong>Legal Details:</strong> {additionalData.legal_details}</div>
                <div style={styles.reviewItem}><strong>Been Overseas?:</strong> {additionalData.been_overseas}</div>
                <div style={styles.reviewItem}><strong>Overseas Details:</strong> {additionalData.overseas_details}</div>
                <div style={styles.reviewItem}><strong>Karnataka Living Details:</strong> {additionalData.karnataka_living_details}</div>
                <div style={styles.reviewItem}><strong>Training Summary:</strong> {additionalData.training_summary}</div>
                <div style={styles.reviewItem}><strong>Publication Details:</strong> {additionalData.publication_details}</div>
                <div style={styles.reviewItem}><strong>Declaration Date:</strong> {additionalData.declaration_date}</div>
                <div style={styles.reviewItem}><strong>Declaration Place:</strong> {additionalData.declaration_place}</div>
                <div style={styles.reviewItem}><strong>Certificate Details:</strong> {additionalData.certificate_details}</div>
                {additionalData.photo_base64 && (
                  <div style={{ ...styles.reviewItem, gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "5px" }}>
                    <strong>Passport Size Photo:</strong>
                    <img src={additionalData.photo_base64} alt="Passport Size" style={{ width: "100px", height: "120px", objectFit: "cover", borderRadius: "4px" }} />
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button className="btn btn-secondary" onClick={() => setShowVerifyModal(false)}>Go Back & Edit</button>
              <button className="btn btn-success" onClick={() => handleFinalizeSubmit(true)}>Finalize & Freeze</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </FormDisabledContext.Provider>
  );
};

const FormSection = ({ title, children }) => (
  <section style={styles.section}>
    <h5>{title}</h5>
    <div style={styles.grid}>{children}</div>
  </section>
);

const ReadOnlyField = ({ label, value }) => (
  <div className="mb-3">
    <label className="form-label">{label}</label>
    <input className="form-control" value={value || ""} disabled />
  </div>
);

const Field = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  asTextarea = false,
  asSelect = false,
  options = [],
}) => {
  const isFinalized = useContext(FormDisabledContext);
  return (
    <div className="mb-3">
      <label className="form-label">{label}</label>
      {asTextarea ? (
        <textarea
          className="form-control"
          name={name}
          value={value}
          rows="3"
          onChange={onChange}
          required={required}
          disabled={isFinalized}
        />
      ) : asSelect ? (
        <select className="form-select" name={name} value={value} onChange={onChange} required={required} disabled={isFinalized}>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          className="form-control"
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={isFinalized}
        />
      )}
    </div>
  );
};

export default PublicJoiningForm;

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: "32px 16px",
  },
  panel: {
    maxWidth: "1040px",
    margin: "0 auto",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "24px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
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
  section: {
    borderTop: "1px solid #e5e7eb",
    paddingTop: "18px",
    marginTop: "12px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "0 16px",
  },
  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "18px",
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
  modalScrollable: {
    overflowY: "auto",
    flex: 1,
    paddingRight: "10px",
    marginTop: "10px",
  },
  reviewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  },
  reviewItem: {
    padding: "8px",
    backgroundColor: "#f9fafb",
    border: "1px solid #f3f4f6",
    borderRadius: "4px",
    fontSize: "13px",
  },
};
