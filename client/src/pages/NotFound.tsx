import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <div className="card" style={{ maxWidth: 400, width: "100%", margin: 16 }}>
        <div className="card-content center-align">
          <i className="material-icons" style={{ fontSize: 64, color: "#999", marginBottom: 16 }}>error_outline</i>
          <h4>404</h4>
          <p className="grey-text">Page not found</p>
          <a href="/" className="btn waves-effect waves-light" style={{ marginTop: 16 }}>
            <i className="material-icons left">arrow_back</i>Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
