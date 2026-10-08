import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import { useAuth } from "../context/useAuth";
import { jwtDecode } from "jwt-decode";

function Login() {
  const navigate = useNavigate();

  const { login } = useAuth();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = await loginUser(
        email,
        password
      );
      
      login(data.token);
      
      const decoded = jwtDecode(data.token);
      const role = decoded.role?.toLowerCase();

      if (role === "admin") {
        navigate("/admin");
      }
      else if (role === "ceo") {
        navigate("/ceo");
      }
      else if (role?.includes("head")) {
        navigate("/head");
      }
      else {
        navigate("/worker");
      }

    } catch (error) {
      setError(error.message || "Invalid credentials");
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
      <p className="eyebrow">Industrial workflow management</p>
      <h1>FlowForge</h1>
      <p>Sign in to view the work that needs your team.</p>

      <form onSubmit={handleSubmit}>
        <input required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input required
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <button type="submit">
          Login
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      </section>
    </main>
  );
}

export default Login;
