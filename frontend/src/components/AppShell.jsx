import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function AppShell({ title, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const signOut = () => {
    logout();
    navigate("/login");
  };
  const role = user?.role?.replace("_", " ");

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">FlowForge</Link>
        <div className="user-menu">
          <span>{user?.name} · {role}</span>
          <button className="button secondary" onClick={signOut}>Sign out</button>
        </div>
      </header>
      <section className="page-heading"><h1>{title}</h1></section>
      {children}
    </main>
  );
}

export default AppShell;
