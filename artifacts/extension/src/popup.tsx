import { useState, useEffect } from "react";
import { checkAuth, scoreCandidate, saveCandidate, getEmployerJobs } from "./lib/api";
import { getToken, setToken, clearToken } from "./lib/storage";

function Popup() {
  const [authenticated, setAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState<"login" | "profile" | "scored">("login");

  useEffect(() => {
    checkAuth().then((res) => {
      if (res.authenticated) {
        setAuthenticated(true);
        setUserEmail(res.user?.email || "");
        setPage("profile");

        chrome.storage.local.get(["pendingProfile", "pendingAction"], (data) => {
          if (data.pendingProfile) {
            setProfile(data.pendingProfile);
            chrome.storage.local.remove(["pendingProfile", "pendingAction"]);
            handleScore(data.pendingProfile);
          }
        });
      }
    });
  }, []);

  const handleLogin = async () => {
    if (!tokenInput.trim()) return;
    try {
      await setToken(tokenInput.trim());
      const res = await checkAuth();
      if (res.authenticated) {
        setAuthenticated(true);
        setUserEmail(res.user?.email || "");
        setPage("profile");
      } else {
        setError("Invalid token");
        await clearToken();
      }
    } catch {
      setError("Failed to authenticate");
      await clearToken();
    }
  };

  const handleScore = async (p?: any) => {
    const target = p || profile;
    if (!target) return;
    setScoreLoading(true);
    setError("");
    try {
      const result = await scoreCandidate(target);
      setMatchResult(result);
      setPage("scored");
    } catch (e: any) {
      setError(e.message || "Failed to score candidate");
    } finally {
      setScoreLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile || !matchResult) return;
    setSaving(true);
    setError("");
    try {
      await saveCandidate(profile, matchResult.score);
      setSaved(true);
    } catch (e: any) {
      setError(e.message || "Failed to save candidate");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await clearToken();
    setAuthenticated(false);
    setPage("login");
    setProfile(null);
    setMatchResult(null);
  };

  const handleExtractProfile = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url?.includes("linkedin.com/in/")) {
      setError("Open a LinkedIn profile page first");
      return;
    }
    chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_PROFILE" }, (response) => {
      if (response?.profile) {
        setProfile(response.profile);
        handleScore(response.profile);
      } else {
        setError("Could not extract profile. Reload the LinkedIn page and try again.");
      }
    });
  };

  if (page === "login") {
    return (
      <div style={{ width: 320, padding: 16, fontFamily: "system-ui, sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "#FFBF00", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#000" }}>O</div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>OpJobHub Recruiter</span>
        </div>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>Enter your API token to connect:</p>
        <input
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          placeholder="Paste your API token"
          style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, boxSizing: "border-box", marginBottom: 8 }}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />
        {error && <p style={{ color: "#ef4444", fontSize: 12, marginBottom: 8 }}>{error}</p>}
        <button onClick={handleLogin} style={{ width: "100%", padding: "10px 16px", background: "#111", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          Connect
        </button>
        <p style={{ fontSize: 11, color: "#999", marginTop: 12, textAlign: "center" }}>
          Get your token from OpJobHub Dashboard &gt; Settings &gt; API
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: 360, padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "#FFBF00", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#000" }}>O</div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>OpJobHub Recruiter</span>
        </div>
        <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#999", fontSize: 12, cursor: "pointer" }}>
          Logout
        </button>
      </div>

      {!profile && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>Signed in as <strong>{userEmail}</strong></p>
          <button onClick={handleExtractProfile} style={{ width: "100%", padding: "12px 16px", background: "#0077B5", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Extract Current LinkedIn Profile
          </button>
          <p style={{ fontSize: 11, color: "#999", marginTop: 8 }}>Navigate to a LinkedIn profile, then click here</p>
        </div>
      )}

      {scoreLoading && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ width: 32, height: 32, border: "3px solid #eee", borderTopColor: "#111", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 13, color: "#666" }}>Analyzing candidate against your open roles...</p>
        </div>
      )}

      {profile && !scoreLoading && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            {profile.photoUrl && (
              <img src={profile.photoUrl} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} />
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.name}</div>
              <div style={{ fontSize: 12, color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.headline}</div>
            </div>
          </div>

          {profile.skills.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Skills</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {profile.skills.slice(0, 8).map((s: string, i: number) => (
                  <span key={i} style={{ padding: "2px 8px", background: "#f0f0f0", borderRadius: 4, fontSize: 11 }}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {page === "scored" && matchResult && (
        <div style={{ borderTop: "1px solid #eee", paddingTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ position: "relative", width: 56, height: 56 }}>
              <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%" }}>
                <circle cx="18" cy="18" r="16" fill="none" stroke="#eee" strokeWidth="3" />
                <circle cx="18" cy="18" r="16" fill="none" stroke={matchResult.score >= 80 ? "#22c55e" : matchResult.score >= 60 ? "#eab308" : "#ef4444"} strokeWidth="3" strokeDasharray={`${matchResult.score}, 100`} strokeLinecap="round" />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800 }}>{matchResult.score}%</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>AI Match Score</div>
              {matchResult.recommendedRole && (
                <div style={{ fontSize: 12, color: "#666" }}>Best fit: {matchResult.recommendedRole}</div>
              )}
            </div>
          </div>

          {matchResult.matchedSkills.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#22c55e", marginBottom: 4 }}>✓ Matched Skills</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {matchResult.matchedSkills.map((s: string, i: number) => (
                  <span key={i} style={{ padding: "2px 8px", background: "#f0fdf4", borderRadius: 4, fontSize: 11, color: "#15803d" }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {matchResult.skillGaps.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#ef4444", marginBottom: 4 }}>✗ Skill Gaps</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {matchResult.skillGaps.map((s: string, i: number) => (
                  <span key={i} style={{ padding: "2px 8px", background: "#fef2f2", borderRadius: 4, fontSize: 11, color: "#dc2626" }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {matchResult.reasons?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#666", marginBottom: 4 }}>Why this score</div>
              <ul style={{ margin: 0, padding: "0 0 0 16px", fontSize: 12, color: "#666" }}>
                {matchResult.reasons.map((r: string, i: number) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSave} disabled={saving || saved} style={{ flex: 1, padding: "10px 16px", background: saved ? "#22c55e" : "#111", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              {saving ? "Saving..." : saved ? "✓ Saved to Pipeline" : "Save to Pipeline"}
            </button>
            <button onClick={() => handleScore()} style={{ padding: "10px 16px", background: "none", border: "1px solid #ddd", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              Rescore
            </button>
          </div>
        </div>
      )}

      {error && (
        <p style={{ color: "#ef4444", fontSize: 12, marginTop: 8, padding: "8px 12px", background: "#fef2f2", borderRadius: 6 }}>{error}</p>
      )}
    </div>
  );
}

export default Popup;
