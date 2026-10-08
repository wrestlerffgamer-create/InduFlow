import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { api } from "../services/api";
import { useAuth } from "../context/useAuth";

const departmentNames = { 1: "Design", 2: "Production", 3: "Quality", 4: "Dispatch" };

function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/analytics/dashboard").then(setData).catch((err) => setError(err.message));
  }, []);

  const title = user?.role === "ceo" ? "Company overview" : "Department overview";
  const totalOrders = data?.orderStats.reduce((sum, item) => sum + item.count, 0) || 0;
  const delayed = data?.delayStats.reduce((sum, item) => sum + item.count, 0) || 0;

  return (
    <AppShell title={title}>
      {error && <p className="error">{error}</p>}
      {!data ? <p className="loading">Loading dashboard…</p> : <>
        <section className="stat-grid">
          <article className="stat-card"><span>Tracked orders</span><strong>{totalOrders}</strong></article>
          <article className="stat-card"><span>Delayed stages</span><strong>{delayed}</strong></article>
          <article className="stat-card"><span>Completed orders</span><strong>{data.orderStats.find((item) => item.status === "completed")?.count || 0}</strong></article>
        </section>
        <section className="panel-grid">
          <article className="panel"><h2>Stage status</h2>
            <ul className="metric-list">{data.workflowStats.map((item) => <li key={item.status}><span>{item.status}</span><b>{item.count}</b></li>)}</ul>
          </article>
          <article className="panel"><h2>Delay by department</h2>
            {data.delayStats.length ? <ul className="metric-list">{data.delayStats.map((item) => <li key={item.department_id}><span>{departmentNames[item.department_id] || `Department ${item.department_id}`}</span><b>{item.count}</b></li>)}</ul> : <p>No delays recorded.</p>}
          </article>
        </section>
        <section className="panel"><h2>Order workflow</h2>
          {data.orders.length ? <div className="order-list">{data.orders.map((order) => <article className="order-row" key={order.id}><div><b>#{order.id} · {order.title}</b><small>{order.status}</small></div><div className="stage-track">{order.stages.map((stage) => <span className={`stage-pill ${stage.status}`} key={stage.position}>{departmentNames[stage.departmentId]}: {stage.status}</span>)}</div></article>)}</div> : <p>No orders yet.</p>}
        </section>
      </>}
    </AppShell>
  );
}

export default Dashboard;
