import { useCallback, useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { api } from "../services/api";
import { useAuth } from "../context/useAuth";

function WorkerDashboard() {
  const { user } = useAuth();
  const [work, setWork] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState({ type: "suggestion", message: "" });

  const load = useCallback(async () => {
    try {
      const [tasks, alerts] = await Promise.all([api("/stages/my-work"), api(`/notifications/${user.id}`)]);
      setWork(tasks); setNotifications(alerts);
    } catch (error) { setMessage(error.message); }
  }, [user.id]);
  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const complete = async (orderId) => {
    try {
      const result = await api("/stages/my-progress", { method: "POST", body: JSON.stringify({ orderId }) });
      setMessage(result.transitioned ? "Everyone has completed this stage; the next department was notified." : `Progress saved (${result.completed}/${result.total} workers complete).`);
      load();
    } catch (error) { setMessage(error.message); }
  };
  const attendance = async () => {
    try { const result = await api("/worker/attendance", { method: "POST" }); setMessage(result.alreadyMarked ? "Attendance was already marked today." : "Attendance marked for today."); } catch (error) { setMessage(error.message); }
  };
  const sendFeedback = async (event) => {
    event.preventDefault();
    try { await api("/worker/feedback", { method: "POST", body: JSON.stringify(feedback) }); setFeedback({ type: "suggestion", message: "" }); setMessage("Feedback sent to your department head."); } catch (error) { setMessage(error.message); }
  };

  return <AppShell title="My work">
    {message && <p className="notice">{message}</p>}
    <section className="panel"><div className="section-title"><h2>Active department work</h2><button className="button secondary" onClick={attendance}>Mark attendance</button></div>
      {work.length ? <div className="task-list">{work.map((task) => <article className="task-card" key={task.stage_id}><div><h3>#{task.order_id} · {task.title}</h3><p>{task.description || "No description"}</p><small>Expected duration: {task.expected_duration} hours · Team: {task.completed_workers}/{task.total_workers} complete</small></div><div><span className={`badge ${task.status}`}>{task.status}</span><button className="button" disabled={task.my_status === "completed"} onClick={() => complete(task.order_id)}>{task.my_status === "completed" ? "Marked complete" : "Mark my work complete"}</button></div></article>)}</div> : <p>No active work for your department.</p>}
    </section>
    <section className="panel-grid">
      <form className="panel form-panel" onSubmit={sendFeedback}><h2>Suggestion or grievance</h2><select value={feedback.type} onChange={(event) => setFeedback({ ...feedback, type: event.target.value })}><option value="suggestion">Suggestion</option><option value="grievance">Grievance</option></select><textarea required value={feedback.message} placeholder="Tell your department head what is on your mind" onChange={(event) => setFeedback({ ...feedback, message: event.target.value })} /><button className="button">Send feedback</button></form>
      <article className="panel"><h2>Notifications</h2>{notifications.length ? <ul className="notification-list">{notifications.slice(0, 6).map((note) => <li key={note.id}><span>{note.message}</span><small>{new Date(note.created_at).toLocaleString()}</small></li>)}</ul> : <p>You are all caught up.</p>}</article>
    </section>
  </AppShell>;
}

export default WorkerDashboard;
