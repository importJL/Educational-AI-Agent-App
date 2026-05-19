import { MaterialIcon } from "@/components/MaterialIcon";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen" style={{ padding: 32, background: "#f5f5f5" }}>
          <div className="card" style={{ maxWidth: 540, width: "100%" }}>
            <div className="card-content center-align">
              <MaterialIcon icon="AlertTriangle" className="red-text" style={{ fontSize: 48, marginBottom: 24 }} />
              <h5 style={{ marginBottom: 16 }}>An unexpected error occurred.</h5>
              <div style={{
                padding: 16, background: "#f0f0f0", borderRadius: 8,
                overflow: "auto", marginBottom: 24, textAlign: "left"
              }}>
                <pre style={{ fontSize: 13, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                  {this.state.error?.stack}
                </pre>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="btn waves-effect waves-light"
              >
                <MaterialIcon icon="RotateCcw" className="mr-1" /> Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
