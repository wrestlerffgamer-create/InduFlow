import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { api } from "../services/api";

const emptyOrder = { title: "", description: "", durations: { design: 24, production: 48, quality: 12, dispatch: 12 } };
const emptyUser = { name: "", email: "", password: "", role: "worker", department_id: "" };

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [order, setOrder] = useState(emptyOrder);
  const [user, setUser] = useState(emptyUser);
  const [notice, setNotice] = useState("");
  const load = () => Promise.all([api("/users"), api("/users/departments"), api("/orders"), api("/requests")])
    .then(([allUsers, depts, allOrders, allRequests]) => { setUsers(allUsers); setDepartments(depts); setOrders(allOrders); setRequests(allRequests); })
    .catch((error) => setNotice(error.message));
  useEffect(() => { load(); }, []);
  const createOrder = async (event) => { event.preventDefault(); try { await api("/orders", { method: "POST", body: JSON.stringify(order) }); setOrder(emptyOrder); setNotice("Order created and sent to Design."); load(); } catch (error) { setNotice(error.message); } };
  const createUser = async (event) => { event.preventDefault(); try { await api("/users", { method: "POST", body: JSON.stringify({ ...user, department_id: user.department_id || null }) }); setUser(emptyUser); setNotice("User created."); load(); } catch (error) { setNotice(error.message); } };
  const review = async (id, status) => { try { await api(`/requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); setNotice(`Request ${status}.`); load(); } catch (error) { setNotice(error.message); } };
  const needsDepartment = ["worker", "design_head", "production_head", "quality_head", "dispatch_head"].includes(user.role);
  return <AppShell title="Administration">
    {notice && <p className="notice">{notice}</p>}
    <section className="panel-grid">
      <form className="panel form-panel" onSubmit={createOrder}><h2>Create order</h2><input required placeholder="Order title" value={order.title} onChange={(event) => setOrder({ ...order, title: event.target.value })} /><textarea placeholder="Description" value={order.description} onChange={(event) => setOrder({ ...order, description: event.target.value })} /><div className="duration-grid">{Object.entries(order.durations).map(([key, value]) => <label key={key}>{key}<input min="0.25" required type="number" value={value} onChange={(event) => setOrder({ ...order, durations: { ...order.durations, [key]: Number(event.target.value) } })} /></label>)}</div><button className="button">Start workflow</button></form>
      <form className="panel form-panel" onSubmit={createUser}><h2>Add user</h2><input required placeholder="Full name" value={user.name} onChange={(event) => setUser({ ...user, name: event.target.value })} /><input required type="email" placeholder="Email" value={user.email} onChange={(event) => setUser({ ...user, email: event.target.value })} /><input required minLength="8" type="password" placeholder="Temporary password" value={user.password} onChange={(event) => setUser({ ...user, password: event.target.value })} /><select value={user.role} onChange={(event) => setUser({ ...user, role: event.target.value, department_id: "" })}><option value="worker">Worker</option><option value="design_head">Design head</option><option value="production_head">Production head</option><option value="quality_head">Quality head</option><option value="dispatch_head">Dispatch head</option><option value="ceo">CEO</option><option value="admin">Admin</option></select>{needsDepartment && <select required value={user.department_id} onChange={(event) => setUser({ ...user, department_id: event.target.value })}><option value="">Department</option>{departments.map((dept) => <option value={dept.id} key={dept.id}>{dept.name}</option>)}</select>}<button className="button">Create user</button></form>
    </section>
    <section className="panel"><h2>Pending staffing requests</h2>{requests.filter((request) => request.status === "pending").length ? <div className="request-list">{requests.filter((request) => request.status === "pending").map((request) => <article key={request.id} className="request-row"><span><b>{request.department_name}</b> requests to {request.request_type.replace("_", " ")} — {request.reason}</span><div><button className="button" onClick={() => review(request.id, "approved")}>Approve</button><button className="button danger" onClick={() => review(request.id, "rejected")}>Reject</button></div></article>)}</div> : <p>No pending staffing requests.</p>}</section>
    <section className="panel-grid"><article className="panel"><h2>Orders</h2>{orders.length ? <ul className="metric-list">{orders.map((item) => <li key={item.id}><span>#{item.id} · {item.title}</span><b>{item.status}</b></li>)}</ul> : <p>No orders created.</p>}</article><article className="panel"><h2>Users</h2>{users.length ? <ul className="metric-list">{users.map((item) => <li key={item.id}><span>{item.name} · {item.role}</span><b>{item.is_active ? "active" : "inactive"}</b></li>)}</ul> : <p>No users available.</p>}</article></section>
  </AppShell>;
}

export default AdminDashboard;
