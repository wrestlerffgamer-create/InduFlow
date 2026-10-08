import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { api } from "../services/api";

function HeadDashboard() {
  const [feedback, setFeedback] = useState([]);
  const [requests, setRequests] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ request_type: "add_worker", worker_name: "", worker_email: "", target_user_id: "", reason: "" });
  const load = () => Promise.all([api("/head/feedback"), api("/head/requests"), api("/head/workers")]).then(([f, r, w]) => { setFeedback(f); setRequests(r); setWorkers(w); }).catch((error) => setNotice(error.message));
  useEffect(() => { load(); }, []);
  const submit = async (event) => { event.preventDefault(); try { await api("/head/requests", { method: "POST", body: JSON.stringify(form) }); setNotice("Staffing request sent to the admin."); setForm({ request_type: "add_worker", worker_name: "", worker_email: "", target_user_id: "", reason: "" }); load(); } catch (error) { setNotice(error.message); } };
  const removeMode = form.request_type === "remove_worker";
  return <AppShell title="Department management">
    {notice && <p className="notice">{notice}</p>}
    <p className="dashboard-link"><Link to="/dashboard">Open department analytics →</Link></p>
    <section className="panel-grid">
      <article className="panel"><h2>Department feedback</h2>{feedback.length ? <ul className="feedback-list">{feedback.map((item) => <li key={item.id}><b>{item.type} · {item.author_name}</b><span>{item.message}</span><small>{new Date(item.created_at).toLocaleDateString()}</small></li>)}</ul> : <p>No feedback yet.</p>}</article>
      <form className="panel form-panel" onSubmit={submit}><h2>Staffing request</h2><select value={form.request_type} onChange={(event) => setForm({ ...form, request_type: event.target.value })}><option value="add_worker">Request a worker</option><option value="remove_worker">Request worker removal</option></select>{removeMode ? <select required value={form.target_user_id} onChange={(event) => setForm({ ...form, target_user_id: event.target.value })}><option value="">Select worker</option>{workers.map((worker) => <option value={worker.id} key={worker.id}>{worker.name}</option>)}</select> : <><input required placeholder="Worker name" value={form.worker_name} onChange={(event) => setForm({ ...form, worker_name: event.target.value })} /><input required type="email" placeholder="Worker email" value={form.worker_email} onChange={(event) => setForm({ ...form, worker_email: event.target.value })} /></>}<textarea required placeholder="Business reason" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /><button className="button">Send request</button></form>
    </section>
    <section className="panel"><h2>Request history</h2>{requests.length ? <ul className="metric-list">{requests.map((request) => <li key={request.id}><span>{request.request_type.replace("_", " ")} · {request.reason}</span><b>{request.status}</b></li>)}</ul> : <p>No requests submitted.</p>}</section>
  </AppShell>;
}

export default HeadDashboard;
