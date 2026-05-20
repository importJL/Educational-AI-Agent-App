import { useState } from "react";
import { MaterialIcon } from "@/components/MaterialIcon";
import { trpc } from "@/lib/trpc";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = trpc.auth.login.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginMutation.mutateAsync({ username, password });
      window.location.reload();
    } catch {
      // error handled by mutation state
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#f5f5f5" }}>
      <div className="card" style={{ width: "100%", maxWidth: 400, margin: 16 }}>
        <div className="card-content">
          <div className="flex flex-col items-center gap-2" style={{ marginBottom: 32 }}>
            <div className="flex items-center justify-center" style={{
              width: 48, height: 48, borderRadius: 12,
              background: "linear-gradient(135deg, #1565c0, #1976d2)",
              fontSize: 20, fontWeight: 700, color: "#fff"
            }}>
              AI
            </div>
            <h5 style={{ margin: "8px 0 0" }}>Educational AI Agent</h5>
            <p className="grey-text" style={{ margin: 0 }}>Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-field">
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder=" "
                required
              />
              <label htmlFor="username">Username</label>
            </div>
            <div className="input-field">
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder=" "
                required
              />
              <label htmlFor="password">Password</label>
            </div>

            {loginMutation.error && (
              <p className="red-text" style={{ fontSize: 13 }}>{loginMutation.error.message}</p>
            )}

            <button
              type="submit"
              className="btn waves-effect waves-light w-full"
              style={{ width: "100%", marginTop: 16 }}
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <div className="preloader-wrapper small active" style={{ width: 20, height: 20, display: "inline-block", marginRight: 8 }}>
                  <div className="spinner-layer spinner-white-only">
                    <div className="circle-clipper left"><div className="circle" /></div>
                    <div className="gap-patch"><div className="circle" /></div>
                    <div className="circle-clipper right"><div className="circle" /></div>
                  </div>
                </div>
              ) : (
                <MaterialIcon icon="LogIn" className="mr-1" />
              )}
              Sign In
            </button>
          </form>

          <p className="grey-text text-center" style={{ fontSize: 11, marginTop: 24 }}>
            Development mode &middot; Default credentials: devuser / devpassword
          </p>
        </div>
      </div>
    </div>
  );
}
