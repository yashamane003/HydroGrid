import { useNavigate } from "react-router-dom";
import { useProvision } from "../context/ProvisionContext";

const ProvisionDevice = () => {
  const navigate = useNavigate();
  const {
    status,
    logs,
    deviceMac,
    config,
    setConfig,
    connectToDevice,
    saveConfigToDevice,
    retryGetInfo,
  } = useProvision();

  if (!("serial" in navigator)) {
    return (
      <div
        className="container"
        style={{ textAlign: "center", padding: "10rem 2rem" }}
      >
        <h2 style={{ color: "var(--danger)" }}>Browser Not Supported</h2>
        <p>
          Please use a modern desktop browser like Chrome or Edge for USB
          provisioning.
        </p>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '32px' }}>
      <div
        className="card glass-card"
        style={{ maxWidth: '600px', width: '100%', padding: '32px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              background: "var(--primary)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 0.75rem",
              boxShadow: "0 6px 12px var(--primary-glow)",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L12 6M12 18L12 22"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M2 12L6 12M18 12L22 12"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h2
            style={{
              fontSize: "1.35rem",
              fontWeight: 800,
              marginBottom: "0.2rem",
              letterSpacing: "-0.03em",
            }}
          >
            USB Provisioning
          </h2>
          <p style={{ color: "var(--text-muted)", fontWeight: 500, fontSize: "0.8rem" }}>
            Secure direct-to-hardware configuration
          </p>
        </div>

        <div
          style={{
            minHeight: "80px",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {status === "disconnected" && (
            <div style={{ textAlign: "center" }}>
              <button
                onClick={connectToDevice}
                className="btn btn-primary btn-full"
                style={{ padding: "0.6rem", borderRadius: "8px", fontSize: "0.85rem" }}
              >
                Find & Connect ESP32
              </button>
            </div>
          )}

          {status !== "disconnected" && (
            <div>
              {deviceMac ? (
                <div
                  style={{
                    padding: "0.65rem",
                    background: "white",
                    borderRadius: "12px",
                    border: "1px solid var(--glass-stroke)",
                    textAlign: "center",
                    marginBottom: "1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.75rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--primary)",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Connection Secure
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      fontWeight: 600,
                    }}
                  >
                    ID: {deviceMac}
                  </span>
                </div>
              ) : (
                <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                  <p
                    style={{
                      color: "var(--text-muted)",
                      marginBottom: "0.5rem",
                      fontSize: "0.8rem",
                    }}
                  >
                    Establishing communication...
                  </p>
                  <button
                    onClick={retryGetInfo}
                    className="btn"
                    style={{
                      background: "white",
                      border: "1px solid var(--glass-stroke)",
                      color: "var(--text-main)",
                      fontSize: "0.65rem",
                      padding: "0.35rem 0.75rem",
                    }}
                  >
                    Retry Discovery &rarr;
                  </button>
                </div>
              )}

              {status === "connected" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: "0.6rem" }}>WIFI NETWORK (SSID)</label>
                    <input
                      className="form-input"
                      style={{ padding: "0.55rem" }}
                      type="text"
                      value={config.ssid}
                      onChange={(e) =>
                        setConfig({ ...config, ssid: e.target.value })
                      }
                      placeholder="Home_WiFi_2.4G"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: "0.6rem" }}>WIFI PASSWORD</label>
                    <input
                      className="form-input"
                      style={{ padding: "0.55rem" }}
                      type="password"
                      value={config.password}
                      onChange={(e) =>
                        setConfig({ ...config, password: e.target.value })
                      }
                      placeholder="••••••••"
                    />
                  </div>
                  <button
                    onClick={saveConfigToDevice}
                    className="btn btn-primary btn-full"
                    style={{
                      padding: "0.65rem",
                      borderRadius: "8px",
                      marginTop: "0.15rem",
                      fontSize: "0.85rem"
                    }}
                    disabled={!config.ssid}
                  >
                    Configure Hardware
                  </button>
                </div>
              )}

              {status === "polling" && (
                <div style={{ textAlign: "center", padding: "1rem" }}>
                  <div
                    className="spinner"
                    style={{ marginBottom: "0.75rem" }}
                  ></div>
                  <h4
                    style={{
                      marginBottom: "0.25rem",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                    }}
                  >
                    Verifying Connection
                  </h4>
                  <p
                    style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
                  >
                    Synchronizing hardware with cloud infrastructure...
                  </p>
                </div>
              )}

              {status === "complete" && (
                <div style={{ textAlign: "center", padding: "1rem" }}>
                  <h3
                    style={{
                      color: "var(--primary)",
                      marginBottom: "0.75rem",
                      fontWeight: 800,
                      fontSize: "0.95rem",
                    }}
                  >
                    HARDWARE ONLINE
                  </h3>
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="btn btn-primary btn-full"
                    style={{ padding: "0.6rem", borderRadius: "8px", fontSize: "0.85rem" }}
                  >
                    Finish Integration
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: "1rem",
            background: "#0f172a",
            color: "#94a3b8",
            padding: "0.85rem",
            borderRadius: "10px",
            fontSize: "0.65rem",
            fontFamily: "monospace",
            height: "100px",
            overflowY: "auto",
            border: "1px solid #1e293b",
          }}
        >
          <div
            style={{
              borderBottom: "1px solid #1e293b",
              marginBottom: "0.75rem",
              paddingBottom: "0.5rem",
              color: "#64748b",
              fontSize: "0.65rem",
              fontWeight: 800,
            }}
          >
            SYSTEM SERIAL LOGS
          </div>
          {logs.length === 0
            ? "> Initializing buffer..."
            : logs.map((l, i) => (
                <div key={i} style={{ marginBottom: "4px" }}>
                  {"> " + l}
                </div>
              ))}
        </div>
      </div>

      <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
    </div>
  );
};

export default ProvisionDevice;
