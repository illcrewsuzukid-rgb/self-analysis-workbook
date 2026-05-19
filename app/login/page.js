"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState("email"); // "email" | "code"
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errParam = params.get("error");
    if (errParam) setError(`認証エラー: ${decodeURIComponent(errParam)}`);
  }, []);

  const sendCode = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) {
      setError(error.message);
      setStatus("idle");
    } else {
      setStep("code");
      setStatus("idle");
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setStatus("verifying");
    setError("");
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    if (error) {
      setError(error.message);
      setStatus("idle");
    } else {
      router.push("/");
    }
  };

  const card = { background: "#fff", borderRadius: 20, padding: 40, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" };
  const input = { width: "100%", padding: "14px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 15, outline: "none", boxSizing: "border-box", marginBottom: 12 };
  const button = (disabled) => ({ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: disabled ? "wait" : "pointer", opacity: disabled ? 0.7 : 1 });

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)" }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <div style={card}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: -0.5 }}>自己分析ワークブック</h1>

        {step === "email" ? (
          <>
            <p style={{ color: "#64748b", fontSize: 13, margin: "10px 0 28px", lineHeight: 1.7 }}>
              メールアドレスを入力すると、ログインコードが届きます。
            </p>
            <form onSubmit={sendCode}>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={input} />
              <button type="submit" disabled={status === "sending"} style={button(status === "sending")}>
                {status === "sending" ? "送信中..." : "ログインコードを送信"}
              </button>
              {error && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 12 }}>{error}</p>}
            </form>
          </>
        ) : (
          <>
            <p style={{ color: "#64748b", fontSize: 13, margin: "10px 0 20px", lineHeight: 1.7 }}>
              <strong style={{ color: "#0f172a" }}>{email}</strong> にコードを送信しました。<br />
              メールに記載された <strong>コード</strong> を入力してください。
            </p>
            <form onSubmit={verifyCode}>
              <input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="12345678" maxLength={10}
                style={{ ...input, fontSize: 24, textAlign: "center", letterSpacing: 6, fontWeight: 700 }} />
              <button type="submit" disabled={status === "verifying"} style={button(status === "verifying")}>
                {status === "verifying" ? "確認中..." : "ログイン"}
              </button>
              {error && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 12 }}>{error}</p>}
              <button type="button" onClick={() => { setStep("email"); setCode(""); setError(""); }} style={{ marginTop: 12, padding: 0, background: "none", border: "none", color: "#6366f1", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
                ← メールアドレスを変更
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
