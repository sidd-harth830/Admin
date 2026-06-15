import React, { useState, useEffect } from "react";
import {
  Rocket,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Trash2,
  LogOut,
  Lock,
  Users,
  Search,
  Info,
  Mail,
  Calendar,
  Clock,
  CheckSquare,
} from "lucide-react";
import { databases, appwriteConfig, ID, account } from "./lib/appwrite";
import { Query } from "appwrite";

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "releases" | "api-monitor" | "users"
  >("releases");
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
    } catch (e) {
      setUser(null);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get();
      setUser(currentUser);
    } catch (error: any) {
      setAuthError(error.message || "Failed to login. Check your credentials.");
    }
  };

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isCheckingAuth) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2 size={32} className="spin" color="var(--accent-color)" />
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}
      >
        <div
          className="glass-panel"
          style={{ padding: "2.5rem", width: "100%", maxWidth: "400px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "2rem",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "var(--accent-color)",
                padding: "8px",
                borderRadius: "12px",
              }}
            >
              <Lock size={24} color="white" />
            </div>
            <h1 style={{ margin: 0, fontSize: "24px" }}>Admin Login</h1>
          </div>
          <form
            onSubmit={handleLogin}
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
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="primary"
              style={{ marginTop: "0.5rem" }}
            >
              Sign In
            </button>
            {authError && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "var(--danger-color)",
                  padding: "12px",
                  background: "rgba(239, 68, 68, 0.1)",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              >
                <AlertCircle size={16} />
                <span>{authError}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

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
        <button
          className="secondary"
          onClick={handleLogout}
          style={{ padding: "8px 16px" }}
        >
          <LogOut size={16} /> Logout
        </button>
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
        <button
          className={activeTab === "users" ? "primary" : "secondary"}
          onClick={() => setActiveTab("users")}
        >
          <Users size={18} /> Mobile Users
        </button>
      </nav>

      {/* Main Content Area */}
      <main>
        {activeTab === "releases" && <ReleasesTab />}
        {activeTab === "api-monitor" && <ApiMonitorTab />}
        {activeTab === "users" && <UsersTab />}
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
  const [releases, setReleases] = useState<any[]>([]);
  const [isFetchingReleases, setIsFetchingReleases] = useState(true);
  const [pendingReleases, setPendingReleases] = useState<any[]>([]);
  const [isFetchingPending, setIsFetchingPending] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchReleases = async () => {
    setIsFetchingReleases(true);
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collectionId,
        [Query.orderDesc("$createdAt"), Query.limit(5)],
      );
      setReleases(response.documents);
    } catch (error) {
      console.error("Failed to fetch releases:", error);
    } finally {
      setIsFetchingReleases(false);
    }
  };

  const fetchPendingReleases = async () => {
    setIsFetchingPending(true);
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collectionId,
        [Query.equal("status", "planned"), Query.orderDesc("$createdAt")],
      );
      setPendingReleases(response.documents);
    } catch (error) {
      console.error("Failed to fetch pending releases:", error);
    } finally {
      setIsFetchingPending(false);
    }
  };

  const handleApproveAndPublish = async (id: string) => {
    setApprovingId(id);
    try {
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collectionId,
        id,
        {
          status: "released",
          releaseDate: new Date().toISOString(),
        },
      );
      await fetchPendingReleases();
      await fetchReleases();
    } catch (error: any) {
      console.error("Failed to approve release:", error);
      alert(error.message || "Failed to approve release.");
    } finally {
      setApprovingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this release?"))
      return;
    try {
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collectionId,
        id,
      );
      setReleases((prev) => prev.filter((r) => r.$id !== id));
      setPendingReleases((prev) => prev.filter((r) => r.$id !== id));
    } catch (error: any) {
      console.error("Failed to delete release:", error);
      alert(error.message || "Failed to delete release.");
    }
  };

  useEffect(() => {
    fetchReleases();
    fetchPendingReleases();
  }, []);

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
          status: "planned",
        },
      );
      setStatus("success");
      setVersionNumber("");
      setApkUrl("");
      setIsMandatory(false);
      await fetchPendingReleases();
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
            <Clock size={18} />
          )}
          {status === "submitting" ? "Saving..." : "Save as Draft"}
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
            <span>Draft saved successfully! Awaiting approval...</span>
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

      {/* Pending Approvals Section */}
      <div
        style={{
          marginTop: "3rem",
          paddingTop: "2rem",
          borderTop: "1px solid var(--glass-border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "1.5rem",
          }}
        >
          <Clock size={20} color="var(--accent-color)" />
          <h3 style={{ margin: 0 }}>Pending Approvals</h3>
        </div>
        {isFetchingPending ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--text-secondary)",
            }}
          >
            <Loader2 size={18} className="spin" /> Fetching pending releases...
          </div>
        ) : pendingReleases.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>
            No pending approvals at the moment.
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {pendingReleases.map((release) => (
              <div
                key={release.$id}
                style={{
                  padding: "1.5rem",
                  background: "rgba(59, 130, 246, 0.05)",
                  borderRadius: "12px",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "1rem",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "16px",
                        color: "var(--text-primary)",
                        marginBottom: "4px",
                      }}
                    >
                      v{release.versionNumber}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "var(--text-secondary)",
                        marginBottom: "8px",
                      }}
                    >
                      {new Date(release.$createdAt).toLocaleDateString()} at{" "}
                      {new Date(release.$createdAt).toLocaleTimeString()}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        wordBreak: "break-all",
                      }}
                    >
                      {release.apkUrl}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {release.isMandatory && (
                      <span
                        style={{
                          fontSize: "12px",
                          padding: "4px 8px",
                          background: "rgba(239, 68, 68, 0.1)",
                          color: "var(--danger-color)",
                          borderRadius: "4px",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Mandatory
                      </span>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    onClick={() => handleDelete(release.$id)}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--danger-color)",
                      color: "var(--danger-color)",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "14px",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    title="Reject this draft"
                  >
                    <Trash2 size={16} /> Reject
                  </button>
                  <button
                    onClick={() => handleApproveAndPublish(release.$id)}
                    disabled={approvingId === release.$id}
                    style={{
                      background: "var(--success-color)",
                      border: "none",
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      cursor: approvingId === release.$id ? "wait" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "14px",
                      fontWeight: 600,
                      opacity: approvingId === release.$id ? 0.7 : 1,
                    }}
                    title="Approve and publish this release"
                  >
                    {approvingId === release.$id ? (
                      <Loader2 size={16} className="spin" />
                    ) : (
                      <CheckSquare size={16} />
                    )}
                    {approvingId === release.$id
                      ? "Publishing..."
                      : "Approve & Go Live"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Releases Section */}
      <div
        style={{
          marginTop: "3rem",
          paddingTop: "2rem",
          borderTop: "1px solid var(--glass-border)",
        }}
      >
        <h3 style={{ marginBottom: "1.5rem" }}>Live Releases</h3>
        {isFetchingReleases ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--text-secondary)",
            }}
          >
            <Loader2 size={18} className="spin" /> Fetching...
          </div>
        ) : releases.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>No releases found.</p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {releases.map((release) => (
              <div
                key={release.$id}
                style={{
                  padding: "1rem",
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{ fontWeight: "bold", color: "var(--text-primary)" }}
                  >
                    v{release.versionNumber}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {new Date(release.$createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleDelete(release.$id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--danger-color)",
                        padding: "4px",
                        cursor: "pointer",
                        display: "flex",
                      }}
                      title="Delete Release"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                    marginBottom: "12px",
                    wordBreak: "break-all",
                  }}
                >
                  {release.apkUrl}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {release.isMandatory && (
                    <span
                      style={{
                        fontSize: "12px",
                        padding: "4px 8px",
                        background: "rgba(239, 68, 68, 0.1)",
                        color: "var(--danger-color)",
                        borderRadius: "4px",
                        border: "1px solid rgba(239, 68, 68, 0.2)",
                      }}
                    >
                      Mandatory
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: "12px",
                      padding: "4px 8px",
                      background: "rgba(16, 185, 129, 0.1)",
                      color: "var(--success-color)",
                      borderRadius: "4px",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      textTransform: "capitalize",
                    }}
                  >
                    {release.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isSavingUser, setIsSavingUser] = useState(false);

  useEffect(() => {
    if (selectedUser) {
      setEditName(selectedUser.name || "");
      setEditEmail(selectedUser.email || "");
      setIsEditingUser(false);
    }
  }, [selectedUser]);

  const fetchUsers = async (loadMore = false) => {
    setIsFetching(true);
    try {
      const queries: any[] = [Query.orderDesc("$createdAt"), Query.limit(20)];

      if (searchTerm) {
        queries.push(
          Query.or([
            Query.search("name", searchTerm),
            Query.search("email", searchTerm),
          ]),
        );
      }

      if (loadMore && users.length > 0) {
        queries.push(Query.cursorAfter(users[users.length - 1].$id));
      }

      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        queries,
      );
      if (loadMore) setUsers((prev) => [...prev, ...response.documents]);
      else setUsers(response.documents);
      setHasMore(response.documents.length === 20);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user profile?"))
      return;
    try {
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        id,
      );
      setUsers((prev) => prev.filter((u) => u.$id !== id));
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      alert(error.message || "Failed to delete user profile.");
    }
  };

  const saveUserChanges = async () => {
    if (!selectedUser) return;
    setIsSavingUser(true);
    try {
      const updatedUser = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        selectedUser.$id,
        {
          name: editName,
          email: editEmail,
        },
      );
      setUsers((prev) =>
        prev.map((u) => (u.$id === selectedUser.$id ? updatedUser : u)),
      );
      setSelectedUser(updatedUser);
      setIsEditingUser(false);
    } catch (error: any) {
      console.error("Failed to update user:", error);
      alert(error.message || "Failed to update user profile.");
    } finally {
      setIsSavingUser(false);
    }
  };

  useEffect(() => {
    fetchUsers();
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
          <h2 style={{ marginBottom: "0.5rem" }}>Mobile App Users</h2>
          <p style={{ margin: 0 }}>
            Manage registered user profiles in the system.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchUsers(false);
            }}
            style={{ display: "flex", gap: "8px" }}
          >
            <input
              type="text"
              placeholder="Search name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "220px", padding: "8px 12px" }}
            />
            <button
              type="submit"
              className="secondary"
              disabled={isFetching}
              style={{ padding: "8px 12px" }}
            >
              <Search size={16} />
            </button>
          </form>
          <button
            className="secondary"
            onClick={() => fetchUsers(false)}
            disabled={isFetching}
            style={{ padding: "8px 16px" }}
          >
            <RefreshCw size={16} className={isFetching ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {isFetching && users.length === 0 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "var(--text-secondary)",
          }}
        >
          <Loader2 size={18} className="spin" /> Loading users...
        </div>
      ) : users.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>
          No users found in the database.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {users.map((u) => (
            <div
              key={u.$id}
              onClick={() => setSelectedUser(u)}
              style={{
                padding: "1rem",
                background: "rgba(0,0,0,0.3)",
                borderRadius: "8px",
                border: "1px solid var(--glass-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(0,0,0,0.3)")
              }
            >
              <div>
                <div
                  style={{
                    fontWeight: "bold",
                    color: "var(--text-primary)",
                    marginBottom: "4px",
                  }}
                >
                  {u.name || "Anonymous User"}
                </div>
                <div
                  style={{ fontSize: "14px", color: "var(--text-secondary)" }}
                >
                  {u.email || "No email associated"}
                </div>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <span
                  style={{ fontSize: "12px", color: "var(--text-secondary)" }}
                >
                  Joined {new Date(u.$createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(u.$id);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--danger-color)",
                    padding: "4px",
                    cursor: "pointer",
                    display: "flex",
                  }}
                  title="Delete User"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {hasMore && (
            <button
              className="secondary"
              onClick={() => fetchUsers(true)}
              disabled={isFetching}
              style={{ width: "100%", marginTop: "1rem" }}
            >
              {isFetching ? <Loader2 size={16} className="spin" /> : null}
              {isFetching ? "Loading..." : "Load More Users"}
            </button>
          )}
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="glass-panel"
            style={{
              padding: "2.5rem",
              width: "100%",
              maxWidth: "520px",
              cursor: "default",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>User Details</h2>
                <p style={{ margin: 0, color: "var(--text-secondary)" }}>
                  Profile information and account metadata.
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: "24px",
                  lineHeight: 1,
                }}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gap: "1rem",
                marginBottom: "2rem",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "0.75rem",
                  alignItems: "center",
                }}
              >
                <Info size={18} />
                <div>
                  <div
                    style={{ fontSize: "12px", color: "var(--text-secondary)" }}
                  >
                    User ID
                  </div>
                  <div
                    style={{
                      fontFamily: "monospace",
                      color: "var(--text-primary)",
                      wordBreak: "break-all",
                    }}
                  >
                    {selectedUser.$id}
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "0.75rem",
                  alignItems: "center",
                }}
              >
                <Info size={18} />
                <div>
                  <div
                    style={{ fontSize: "12px", color: "var(--text-secondary)" }}
                  >
                    Name
                  </div>
                  {isEditingUser ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        marginTop: "4px",
                      }}
                    />
                  ) : (
                    <div
                      style={{ color: "var(--text-primary)", fontWeight: 600 }}
                    >
                      {selectedUser.name || "Anonymous User"}
                    </div>
                  )}
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "0.75rem",
                  alignItems: "center",
                }}
              >
                <Mail size={18} />
                <div>
                  <div
                    style={{ fontSize: "12px", color: "var(--text-secondary)" }}
                  >
                    Email
                  </div>
                  {isEditingUser ? (
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        marginTop: "4px",
                      }}
                    />
                  ) : (
                    <div
                      style={{ color: "var(--text-primary)", fontWeight: 600 }}
                    >
                      {selectedUser.email || "No email associated"}
                    </div>
                  )}
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "0.75rem",
                  alignItems: "center",
                }}
              >
                <Calendar size={18} />
                <div>
                  <div
                    style={{ fontSize: "12px", color: "var(--text-secondary)" }}
                  >
                    Account Created
                  </div>
                  <div
                    style={{ color: "var(--text-primary)", fontWeight: 600 }}
                  >
                    {new Date(selectedUser.$createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              {selectedUser.deviceId && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    gap: "0.75rem",
                    alignItems: "center",
                  }}
                >
                  <Users size={18} />
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Device ID
                    </div>
                    <div
                      style={{ color: "var(--text-primary)", fontWeight: 600 }}
                    >
                      {selectedUser.deviceId}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              {isEditingUser ? (
                <>
                  <button
                    className="secondary"
                    onClick={() => setIsEditingUser(false)}
                    disabled={isSavingUser}
                  >
                    Cancel
                  </button>
                  <button
                    className="primary"
                    onClick={saveUserChanges}
                    disabled={isSavingUser}
                  >
                    {isSavingUser ? (
                      <Loader2 size={16} className="spin" />
                    ) : null}
                    {isSavingUser ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="secondary"
                    onClick={() => setIsEditingUser(true)}
                  >
                    Edit Profile
                  </button>
                  <button
                    className="primary"
                    onClick={() => setSelectedUser(null)}
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ApiMonitorTab() {
  const [status, setStatus] = useState<
    "idle" | "pinging" | "online" | "offline"
  >("idle");
  const [latency, setLatency] = useState<number | null>(null);
  const [history, setHistory] = useState<{ time: string; latency: number }[]>(
    [],
  );

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
      const currentLatency = end - start;
      if (response.ok) {
        setStatus("online");
      } else {
        setStatus("offline");
      }
      setLatency(currentLatency);
      setHistory((prev) => {
        const newHistory = [
          ...prev,
          { time: new Date().toLocaleTimeString(), latency: currentLatency },
        ];
        return newHistory.slice(-20); // Keep the last 20 pings
      });
    } catch (error) {
      setStatus("offline");
    }
  };

  useEffect(() => {
    pingApi();
    const interval = setInterval(pingApi, 600000); // Ping every 600 seconds
    return () => clearInterval(interval);
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

      {/* Latency History Chart */}
      {history.length > 0 && (
        <div
          style={{
            marginTop: "2rem",
            padding: "1.5rem",
            background: "rgba(0,0,0,0.3)",
            borderRadius: "12px",
            border: "1px solid var(--glass-border)",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: "1rem",
              fontSize: "14px",
              color: "var(--text-secondary)",
            }}
          >
            Latency History (Last 20 pings)
          </h3>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "6px",
              height: "100px",
              borderBottom: "1px solid var(--glass-border)",
              paddingBottom: "8px",
            }}
          >
            {history.map((entry, i) => {
              const maxLatency = Math.max(
                ...history.map((h) => h.latency),
                100,
              );
              const heightPct = Math.min(
                (entry.latency / maxLatency) * 100,
                100,
              );
              return (
                <div
                  key={i}
                  title={`${entry.latency}ms at ${entry.time}`}
                  style={{
                    flex: 1,
                    height: `${heightPct}%`,
                    background: "var(--accent-color)",
                    borderRadius: "4px 4px 0 0",
                    opacity: 0.8,
                    transition: "height 0.3s ease",
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
