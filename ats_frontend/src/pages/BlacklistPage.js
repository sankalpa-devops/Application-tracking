import { useEffect, useState } from "react";
import {
  getBlacklist,
  whitelistCandidate
} from "../services/blacklistService";

const BlacklistPage = () => {

  const [data, setData] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      const res = await getBlacklist(token);
      setData(res);
    };

    fetchData();
  }, [token]); // include token as dependency

  const handleWhitelist = async (id) => {
    if (!window.confirm("Whitelist this candidate?")) return;

    await whitelistCandidate(id, token);

    // re-fetch after update
    const res = await getBlacklist(token);
    setData(res);
  };

  return (
    <div>

      <h4>Blacklisted Candidates</h4>

      <table className="table table-bordered">
        <thead className="table-dark">
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>PAN</th>
            <th>Aadhaar</th>
            <th>UAN</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {data.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.email}</td>
              <td>{c.pan}</td>
              <td>{c.aadhaar}</td>
              <td>{c.uan}</td>
              <td>{c.reason}</td>
              <td>
                {c.is_active ? (
                  <span className="badge bg-danger">Blacklisted</span>
                ) : (
                  <span className="badge bg-success">Whitelisted</span>
                )}
              </td>
              <td>
                {c.is_active && (
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => handleWhitelist(c.id)}
                  >
                    Whitelist
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
};

export default BlacklistPage;