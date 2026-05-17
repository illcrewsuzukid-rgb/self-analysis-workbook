"use client";
import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errParam = params.get("error");
    if (errParam) setError(`認証エラー: ${decodeURIComponent(errParam)}`);
  }, []);

  const sendLink = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setStatus("idle");
    } else {
      setStatus("sent");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)" }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <div style={{ background: "#fff", borderRadius: 20, padding: 40, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: -0.5 }}>自己分析ワークブック</h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "10px 0 28px", lineHeight: 1.7 }}>
          メールアドレスを入力すると、ログイン用のリンクが届きます。<br />リンクをクリックするだけでログインできます。
        </p>

        {status === "sent" ? (
          <div style={{ padding: 20, background: "#ecfdf5", borderRadius: 12, color: "#065f46", fontSize: 14, lineHeight: 1.7 }}>
            ✅ <strong>{email}</strong> にログインリンクを送信しました。<br />
            メールを開いてリンクをクリックしてください。
          </div>
        ) : (
          <form onSubmit={sendLink}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: "100%", padding: "14px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 15, outline: "none", boxSizing: "border-box", marginBottom: 12 }}
            />
            <button
              type="submit"
              disabled={status === "sending"}
              style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: status === "sending" ? "wait" : "pointer", opacity: status === "sending" ? 0.7 : 1 }}
            >
              {status === "sending" ? "送信中..." : "ログインリンクを送信"}
            </button>
            {error && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 12 }}>{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
