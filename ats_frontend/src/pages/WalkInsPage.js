import axios from "axios";
import { useEffect, useState } from "react";

const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const WalkInsPage = () => {

  const [form, setForm] = useState({
    name:"",
    email:"",
    phone:"",
    pan:"",
    aadhaar:"",
    experience:"",
    job_match_id:"",
    resume:null
  });

  const [jobs, setJobs] = useState([]);

  // ✅ Fetch jobs
  useEffect(() => {
  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${API}/walkin/jobs`);
      setJobs(res.data);
    } catch (err) {
      console.error("Error fetching jobs", err);
    }
  };

  fetchJobs();
}, []);

  const handleChange = (e)=>{
    const {name,value,files} = e.target;

    if(name==="resume"){
      setForm({...form,resume:files[0]})
    }else{
      setForm({...form,[name]:value})
    }
  }

  const submit = async(e)=>{
    e.preventDefault();

    const data = new FormData();

    Object.entries(form).forEach(([k,v])=>{
      data.append(k,v)
    });

    await axios.post(`${API}/walkin`,data,{
      headers:{'Content-Type':'multipart/form-data'}
    });

    alert("Walk-in candidate saved");
  }

  return (

    <div className="container">

      <h3>Walk-in Candidate Entry</h3>

      <form onSubmit={submit}>

        <input name="name" placeholder="Name" onChange={handleChange} className="form-control mb-2"/>

        <input name="email" placeholder="Email" onChange={handleChange} className="form-control mb-2"/>

        <input name="phone" placeholder="Phone" onChange={handleChange} className="form-control mb-2"/>

        <input name="pan" placeholder="PAN" onChange={handleChange} className="form-control mb-2"/>

        <input name="aadhaar" placeholder="Aadhaar" onChange={handleChange} className="form-control mb-2"/>

        <input name="experience" placeholder="Experience" onChange={handleChange} className="form-control mb-2"/>

        {/* ✅ DROPDOWN ADDED */}
        <select 
          name="job_match_id" 
          onChange={handleChange} 
          className="form-control mb-2"
          required
        >
          <option value="">Select Job</option>
          {jobs.map(job => (
            <option key={job.id} value={job.id}>
              {job.title}
            </option>
          ))}
        </select>

        <input type="file" name="resume" onChange={handleChange} className="form-control mb-3"/>

        <button className="btn btn-primary">
          Save Walk-in Candidate
        </button>

      </form>

    </div>

  )
}

export default WalkInsPage;
