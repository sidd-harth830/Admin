import React, { useState, useEffect } from "react";
import {
  Rocket,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { databases, appwriteConfig, ID } from "./lib/appwrite";

export default function App() {
  const [activeTab, setActiveTab] = useState<"releases" | "api-monitor">(
    "releases",
  );

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              background: "var(--accent-color)",
              padding: "8px",
              borderRadius: "12px",
            }}
          >
            <Activity size={24} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "24px" }}>
              Admin Command Center
            </h1>
            <p style={{ margin: 0, fontSize: "14px" }}>
              DelhiMetroClean & API Dashboard
            </p>
          </div>
        </div>
      </header>

      {/* Top Navigation Bar */}
      <nav style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <button
          className={activeTab === "releases" ? "primary" : "secondary"}
          onClick={() => setActiveTab("releases")}
        >
          <Rocket size={18} /> OTA Releases
        </button>
        <button
          className={activeTab === "api-monitor" ? "primary" : "secondary"}
          onClick={() => setActiveTab("api-monitor")}
        >
          <Activity size={18} /> API Health Monitor
        </button>
      </nav>

      {/* Main Content Area */}
      <main>
        {activeTab === "releases" && <ReleasesTab />}
        {activeTab === "api-monitor" && <ApiMonitorTab />}
      </main>
    </div>
  );
}

function ReleasesTab() {
  const [versionNumber, setVersionNumber] = useState("");
  const [apkUrl, setApkUrl] = useState("");
  const [isMandatory, setIsMandatory] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionNumber || !apkUrl) return;

    setStatus("submitting");
    setErrorMessage("");

    try {
      await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collectionId,
        ID.unique(),
        {
          versionNumber,
          apkUrl,
          isMandatory,
          status: "released",
          releaseDate: new Date().toISOString(),
        },
      );
      setStatus("success");
      setVersionNumber("");
      setApkUrl("");
      setIsMandatory(false);
    } catch (error: any) {
      console.error("Failed to create release:", error);
      setStatus("error");
      setErrorMessage(error.message || "An unexpected error occurred.");
    }
  };

  return (
    <div className="glass-panel" style={{ padding: "2rem" }}>
      <h2 style={{ marginBottom: "0.5rem" }}>Deploy OTA Update</h2>
      <p style={{ marginBottom: "2rem" }}>
        Push a new app release to the user devices instantly.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
      >
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: "var(--text-secondary)",
            }}
          >
            Version Number (e.g., 1.2.0)
          </label>
          <input
            type="text"
            value={versionNumber}
            onChange={(e) => setVersionNumber(e.target.value)}
            placeholder="1.0.0"
            required
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: "var(--text-secondary)",
            }}
          >
            APK Download URL
          </label>
          <input
            type="url"
            value={apkUrl}
            onChange={(e) => setApkUrl(e.target.value)}
            placeholder="https://github.com/..."
            required
          />
        </div>

        <label className="checkbox-container">
          <input
            type="checkbox"
            checked={isMandatory}
            onChange={(e) => setIsMandatory(e.target.checked)}
          />
          <span style={{ color: "var(--text-primary)" }}>Mandatory Update</span>
        </label>

        <button
          type="submit"
          className="primary"
          disabled={status === "submitting" || !versionNumber || !apkUrl}
        >
          {status === "submitting" ? (
            <Loader2 size={18} className="spin" />
          ) : (
            <Rocket size={18} />
          )}
          {status === "submitting" ? "Publishing..." : "Broadcast Release"}
        </button>

        {status === "success" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--success-color)",
              padding: "12px",
              background: "rgba(16, 185, 129, 0.1)",
              borderRadius: "8px",
            }}
          >
            <CheckCircle2 size={18} />
            <span>Release published successfully!</span>
          </div>
        )}

        {status === "error" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--danger-color)",
              padding: "12px",
              background: "rgba(239, 68, 68, 0.1)",
              borderRadius: "8px",
            }}
          >
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}
      </form>
    </div>
  );
}

function ApiMonitorTab() {
  const [status, setStatus] = useState<
    "idle" | "pinging" | "online" | "offline"
  >("idle");
  const [latency, setLatency] = useState<number | null>(null);

  const pingApi = async () => {
    setStatus("pinging");
    setLatency(null);
    const start = Date.now();
    try {
      const response = await fetch(
        "https://siddharth7307-delhi-metro-api.hf.space/api/v1",
        {
          method: "GET",
        },
      );
      const end = Date.now();
      if (response.ok) {
        setStatus("online");
      } else {
        setStatus("offline");
      }
      setLatency(end - start);
    } catch (error) {
      setStatus("offline");
    }
  };

  useEffect(() => {
    pingApi();
  }, []);

  return (
    <div className="glass-panel" style={{ padding: "2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h2 style={{ marginBottom: "0.5rem" }}>Python API Health</h2>
          <p style={{ margin: 0 }}>
            Monitor connection to the Delhi Metro AI server.
          </p>
        </div>
        <button
          className="secondary"
          onClick={pingApi}
          disabled={status === "pinging"}
          style={{ padding: "8px 16px" }}
        >
          <RefreshCw size={16} className={status === "pinging" ? "spin" : ""} />{" "}
          Refresh
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.5rem",
          background: "rgba(0,0,0,0.3)",
          borderRadius: "12px",
          border: "1px solid var(--glass-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor:
                status === "online"
                  ? "var(--success-color)"
                  : status === "offline"
                    ? "var(--danger-color)"
                    : "#eab308",
              boxShadow: `0 0 10px ${status === "online" ? "var(--success-color)" : status === "offline" ? "var(--danger-color)" : "#eab308"}`,
              animation: status === "pinging" ? "pulse 1.5s infinite" : "none",
            }}
          />
          <div>
            <div
              style={{
                fontWeight: 600,
                fontSize: "18px",
                color: "var(--text-primary)",
              }}
            >
              {status === "pinging"
                ? "Checking Status..."
                : status === "online"
                  ? "API Online"
                  : status === "offline"
                    ? "API Offline"
                    : "Idle"}
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "var(--text-secondary)",
                marginTop: "4px",
              }}
            >
              https://siddharth7307-delhi-metro-api.hf.space/api/v1
            </div>
          </div>
        </div>

        {latency !== null && (
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {latency}{" "}
              <span
                style={{ fontSize: "14px", color: "var(--text-secondary)" }}
              >
                ms
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              Latency
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
