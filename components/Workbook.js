"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

const SECTIONS = [
  { id: "home", label: "ホーム", icon: "◎" },
  { id: "history", label: "自分史", icon: "📖" },
  { id: "motivation", label: "モチベーショングラフ", icon: "📈" },
  { id: "whychain", label: "なぜなぜ分析", icon: "🔗" },
  { id: "strengths", label: "強み・弱み", icon: "⚖️" },
  { id: "values", label: "価値観マップ", icon: "🧭" },
  { id: "willcanmust", label: "Will / Can / Must", icon: "🎯" },
  { id: "vision", label: "キャリアビジョン", icon: "🔭" },
  { id: "axis", label: "企業選びの軸", icon: "🏢" },
  { id: "summary", label: "自己PR生成", icon: "✨" },
];

const LIFE_STAGES = [
  { key: "elementary", label: "小学校", years: "6〜12歳" },
  { key: "junior", label: "中学校", years: "12〜15歳" },
  { key: "high", label: "高校", years: "15〜18歳" },
  { key: "university", label: "大学", years: "18〜22歳" },
  { key: "other", label: "その他", years: "" },
];

const HISTORY_PROMPTS = [
  { key: "effort", label: "一番頑張ったこと", hint: "部活、受験、習い事、委員会 など", example: "例: サッカー部で毎朝6時から自主練して、レギュラーを勝ち取った" },
  { key: "happy", label: "一番嬉しかったこと", hint: "達成感、認められた、成長を感じた など", example: "例: 文化祭で自分が企画したイベントに200人以上が来てくれた" },
  { key: "hard", label: "一番辛かったこと", hint: "挫折、人間関係、環境の変化 など", example: "例: 仲の良かった友達とケンカして、3ヶ月間口を聞かなかった" },
  { key: "passion", label: "熱中したこと", hint: "ゲーム、読書、スポーツ、創作 なんでもOK", example: "例: マインクラフトで巨大な街を半年かけて作り込んだ" },
  { key: "decision", label: "大きな決断・転機", hint: "進路選択、引っ越し、何かを辞めた/始めた", example: "例: 理系志望だったけど、文系に転向する決断をした" },
  { key: "relation", label: "人間関係で印象的だったこと", hint: "友人、先生、先輩、家族との関わり", example: "例: 部活の先輩に「お前がいるとチームの雰囲気が良くなる」と言われた" },
  { key: "failure", label: "挫折・失敗からの学び", hint: "失敗→そこから何を得た？", example: "例: 生徒会選挙に落ちた。でも応援演説を頼まれて、裏方の大切さを知った" },
];

const STRENGTH_CATEGORIES = [
  { key: "action", label: "主体性・行動力", desc: "言われる前に自分から動ける", questions: ["自分から手を挙げて何かをやったことは？", "周りが動かない中、自分だけ行動したことは？"], example: "バイト先で売れ残り商品の割引販売を自分から提案して、廃棄率を30%下げた" },
  { key: "thinking", label: "思考力・論理性", desc: "原因を考え、筋道を立てて解決できる", questions: ["「なぜこうなった？」と原因を分析したことは？", "複雑な問題を整理して解決したことは？"], example: "ゼミのグループワークで、議論が迷走した時に論点を3つに整理して結論を出した" },
  { key: "teamwork", label: "協調性・チームワーク", desc: "チームの中で自分の役割を見つけ貢献できる", questions: ["チームで意見が対立した時、どう対応した？", "メンバーのためにフォローしたことは？"], example: "サークルで対立した2つの派閥の間に入って、折衷案を出してまとめた" },
  { key: "persistence", label: "継続力・忍耐力", desc: "結果が出なくてもコツコツ続けられる", questions: ["長期間続けていることは何？", "すぐに結果が出なくても粘り強く取り組んだことは？"], example: "TOEIC 500→800を1年半かけて達成。毎日30分のリスニングを欠かさなかった" },
  { key: "creativity", label: "創造力・発想力", desc: "他の人が思いつかないアイデアを出せる", questions: ["「それ面白いね」と言われたアイデアは？", "既存のやり方を変えて上手くいったことは？"], example: "学園祭の集客にSNSでリアルタイム投票企画を導入して、来場者を前年比150%にした" },
  { key: "communication", label: "コミュニケーション力", desc: "相手に合わせて分かりやすく伝えられる", questions: ["年代や立場が違う人と上手くやれたことは？", "難しいことを分かりやすく説明したことは？"], example: "塾のバイトで、数学嫌いな生徒に料理のレシピに例えて分数を教えて理解してもらえた" },
  { key: "leadership", label: "リーダーシップ", desc: "周りを巻き込んで目標に導ける", questions: ["リーダーや代表として動いたことは？", "メンバーのモチベーションを上げた経験は？"], example: "部長として「全員が試合に出る」をビジョンに掲げ、練習メニューを全員参加型に変えた" },
  { key: "learning", label: "学習力・吸収力", desc: "新しいことを素早くキャッチアップできる", questions: ["未経験から短期間でできるようになったことは？", "フィードバックを受けて改善したことは？"], example: "プログラミング未経験から3ヶ月でWebアプリを作り、ハッカソンに出場した" },
];

const VALUE_OPTIONS = [
  { label: "成長できる環境", desc: "新しいスキルや経験をどんどん積める" },
  { label: "安定性", desc: "長く安心して働ける基盤がある" },
  { label: "高い報酬", desc: "成果に見合った給与・待遇が得られる" },
  { label: "社会貢献", desc: "自分の仕事が社会の役に立っている実感" },
  { label: "裁量権の大きさ", desc: "自分で考え、自分で決められる" },
  { label: "チームワーク", desc: "仲間と協力して大きな成果を出す" },
  { label: "ワークライフバランス", desc: "仕事もプライベートも大切にできる" },
  { label: "技術力", desc: "最先端の技術やノウハウに触れられる" },
  { label: "グローバル", desc: "海外と関わる仕事・多様な環境" },
  { label: "人間関係の良さ", desc: "尊敬できる人、気持ちよく働ける人間関係" },
  { label: "ブランド力", desc: "知名度や社会的信頼がある企業" },
  { label: "挑戦的な仕事", desc: "難しいこと・新しいことに挑める" },
  { label: "自由な社風", desc: "服装・働き方・提案の自由度が高い" },
  { label: "専門性を磨ける", desc: "特定分野のプロフェッショナルになれる" },
  { label: "若手が活躍できる", desc: "年齢に関係なくチャンスがある" },
  { label: "福利厚生", desc: "住宅手当、育休、研修など制度が充実" },
  { label: "事業の将来性", desc: "成長産業・拡大中のビジネス" },
  { label: "理念への共感", desc: "会社のミッションやビジョンに共感できる" },
];

const AXIS_TEMPLATES = [
  { name: "成長環境", category: "仕事内容", desc: "若手でも裁量を持てる / 研修制度が充実 / 挑戦できる風土", guideQ: "あなたが「成長できた」と感じた過去の環境はどんな特徴があった？" },
  { name: "働き方", category: "制度・環境", desc: "リモートワーク / フレックス / 残業の少なさ", guideQ: "理想の1日のスケジュールを想像してみよう。仕事とプライベートのバランスは？" },
  { name: "給与・待遇", category: "制度・環境", desc: "初任給 / 昇給スピード / 賞与 / 福利厚生", guideQ: "入社5年目に最低限欲しい年収は？それはなぜ？" },
  { name: "人・社風", category: "人・カルチャー", desc: "上下関係 / コミュニケーション / 多様性", guideQ: "「この人たちと働きたい」と思った経験を思い出そう。どんな雰囲気だった？" },
  { name: "事業内容", category: "仕事内容", desc: "何を売る・届ける会社か / 社会課題との関連", guideQ: "「こんな仕事がしたい」と思った瞬間は？ どんな事業やサービスに惹かれる？" },
  { name: "企業規模・知名度", category: "企業特性", desc: "大手の安定感 vs ベンチャーのスピード感", guideQ: "大きな組織で歯車になるのと、小さな組織で何でも屋になるの、どっちがワクワクする？" },
  { name: "勤務地", category: "制度・環境", desc: "転勤の有無 / 都市部 or 地方 / 海外勤務", guideQ: "5年後、どの街に住んでいたい？ 転勤は許容できる？" },
  { name: "社会的意義", category: "企業特性", desc: "SDGs / 社会課題解決 / 世の中を変えるインパクト", guideQ: "「ありがとう」と言われて一番嬉しかったのは、どんな場面？" },
];

const WHY_EPISODE_TEMPLATES = [
  { label: "部活・サークル", icon: "🏃", examples: ["大会で優勝した", "キャプテンとしてチームをまとめた", "レギュラーを勝ち取った", "怪我から復帰した"] },
  { label: "アルバイト", icon: "💼", examples: ["売上を改善した", "後輩の育成を任された", "お客様から感謝された", "新しい仕組みを提案した"] },
  { label: "ゼミ・研究", icon: "📚", examples: ["卒論を完成させた", "グループ発表で高評価を得た", "教授に褒められた", "学会で発表した"] },
  { label: "留学・海外経験", icon: "🌏", examples: ["語学力が向上した", "異文化の中で友人を作った", "価値観が変わった", "困難を乗り越えた"] },
  { label: "ボランティア", icon: "🤝", examples: ["地域イベントを企画した", "子どもたちに教えた", "被災地で支援活動をした", "継続的に参加した"] },
  { label: "趣味・個人活動", icon: "🎨", examples: ["作品を完成させた", "SNSで発信して反響を得た", "大会やコンテストに出場", "独学でスキルを習得した"] },
  { label: "学業", icon: "✏️", examples: ["苦手科目を克服した", "資格を取得した", "GPA を向上させた", "難関試験に合格した"] },
  { label: "人間関係", icon: "👥", examples: ["友人の相談に乗った", "チームの対立を解消した", "先輩との出会いで変わった", "後輩の成長を支えた"] },
];

const WHY_GUIDE_STEPS = [
  { num: 1, label: "なぜそれを頑張れた？", hint: "モチベーションの源泉は？", examples: ["負けたくなかったから", "仲間が頑張っていたから", "認められたかったから", "純粋に楽しかったから"] },
  { num: 2, label: "その裏にある感情は？", hint: "どんな気持ちが原動力だった？", examples: ["悔しさ", "誰かの役に立ちたい", "成長する喜び", "競争心", "承認欲求", "好奇心"] },
  { num: 3, label: "それはなぜ大切だと思う？", hint: "自分の根っこにある価値観に近づいている", examples: ["自分の存在価値を感じられるから", "人との繋がりが一番大事だから", "常に進化していたいから"] },
];

const INSIGHT_TEMPLATES = [
  "自分は「{X}」にモチベーションが湧くタイプ",
  "「{X}」の環境があると、力を発揮できる",
  "根底にあるのは「{X}」という価値観",
  "人から「{X}」と言われると嬉しい",
];

const DEFAULT_DATA = {
  history: {}, motivationPoints: [], whyChains: [], strengths: {},
  strengthEpisodes: {}, selectedValues: [], valueReasons: {},
  wcm: { will: "", can: "", must: "", overlap: "" },
  vision: { short: "", mid: "", long: "", rolemodel: "" },
  axis: [],
};

// ─── Shared Components ──────────────────────────
function NavItem({ section, active, onClick }) {
  return (
    <button onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
        borderRadius: 10, border: "none", cursor: "pointer", width: "100%",
        background: active ? "linear-gradient(135deg, #1a1a2e, #16213e)" : "transparent",
        color: active ? "#e2e8f0" : "#64748b", fontWeight: active ? 700 : 500,
        fontSize: 13, transition: "all 0.25s ease", textAlign: "left",
        boxShadow: active ? "0 2px 12px rgba(26,26,46,0.3)" : "none",
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#f1f5f9"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ fontSize: 16 }}>{section.icon}</span>
      <span>{section.label}</span>
    </button>
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{
        width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0",
        fontSize: 14, fontFamily: "'Noto Sans JP', sans-serif", resize: "vertical",
        background: "#fafbfc", transition: "border-color 0.2s", outline: "none",
        lineHeight: 1.7, boxSizing: "border-box",
      }}
      onFocus={e => e.target.style.borderColor = "#6366f1"}
      onBlur={e => e.target.style.borderColor = "#e2e8f0"}
    />
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)", border: "1px solid #f0f0f5", ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0, fontFamily: "'Noto Sans JP', sans-serif", letterSpacing: -0.5 }}>
        <span style={{ marginRight: 10 }}>{icon}</span>{title}
      </h2>
      {subtitle && <p style={{ color: "#94a3b8", fontSize: 13, margin: "6px 0 0 34px", lineHeight: 1.6 }}>{subtitle}</p>}
    </div>
  );
}

function Tip({ children, color = "#6366f1", bg = "#eef2ff" }) {
  return (
    <div style={{ padding: "12px 16px", background: bg, borderRadius: 10, fontSize: 12, color, lineHeight: 1.7, marginBottom: 16, borderLeft: `3px solid ${color}` }}>
      {children}
    </div>
  );
}

function ExampleBubble({ text, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 12px", borderRadius: 16, border: "1px solid #e0e7ff", background: "#f8faff",
      color: "#4f46e5", fontSize: 12, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
    }}
      onMouseEnter={e => { e.currentTarget.style.background = "#eef2ff"; e.currentTarget.style.borderColor = "#818cf8"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "#f8faff"; e.currentTarget.style.borderColor = "#e0e7ff"; }}
    >
      {text}
    </button>
  );
}

function ProgressBar({ data }) {
  const calcProgress = () => {
    let filled = 0, total = 0;
    Object.values(data.history || {}).forEach(stage => { Object.values(stage || {}).forEach(v => { total++; if (v?.trim()) filled++; }); });
    (data.motivationPoints || []).forEach(() => { total++; filled++; }); total = Math.max(total, 3);
    (data.whyChains || []).forEach(c => { total += 4; if (c.event?.trim()) filled++; c.whys?.forEach(w => { if (w?.trim()) filled++; }); if (c.insight?.trim()) filled++; }); total = Math.max(total, 4);
    Object.values(data.strengths || {}).forEach(v => { total++; if (v > 0) filled++; }); total = Math.max(total, 4);
    total += 5; filled += Math.min((data.selectedValues || []).length, 5);
    ["will", "can", "must"].forEach(k => { total++; if (data.wcm?.[k]?.trim()) filled++; });
    ["short", "mid", "long"].forEach(k => { total++; if (data.vision?.[k]?.trim()) filled++; });
    (data.axis || []).forEach(a => { total++; if (a.name?.trim()) filled++; }); total = Math.max(total, 3);
    return total === 0 ? 0 : Math.round((filled / total) * 100);
  };
  const pct = calcProgress();
  return (
    <div style={{ margin: "0 0 8px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>全体の進捗</span>
        <span style={{ fontSize: 12, color: "#6366f1", fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: "linear-gradient(90deg, #6366f1, #8b5cf6)", transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function SaveStatus({ status }) {
  const map = {
    loading: { text: "読み込み中…", color: "#94a3b8" },
    idle: { text: "保存済み", color: "#10b981" },
    dirty: { text: "未保存の変更あり", color: "#f59e0b" },
    saving: { text: "保存中…", color: "#6366f1" },
    saved: { text: "✓ 保存しました", color: "#10b981" },
    error: { text: "⚠ 保存に失敗", color: "#ef4444" },
  };
  const s = map[status] || map.idle;
  return (
    <div style={{ fontSize: 11, color: s.color, marginTop: 8, fontWeight: 600 }}>{s.text}</div>
  );
}

// ─── Home ───────────────────────────────────────
function HomePage({ setActive }) {
  const phases = [
    { title: "PHASE 1：過去を掘り出す", color: "#6366f1", desc: "まず「自分に何があったか」を棚卸しする。ここが全ての土台になる。", steps: [
      { section: "history", title: "① 自分史を書く", desc: "人生の各ステージを例文つきで振り返る", time: "20分", why: "ESの「ガクチカ」「自己PR」のエピソード候補を洗い出すため" },
      { section: "motivation", title: "② モチベーショングラフ", desc: "テンプレートで感情の波を可視化する", time: "10分", why: "「頑張れた時期」と「辛かった時期」のパターンが見えるため" },
      { section: "whychain", title: "③ なぜなぜ分析", desc: "選択肢で原体験を深掘りする", time: "15分", why: "面接で「なぜ？」と聞かれた時に、本質まで答えられるようになるため" },
    ]},
    { title: "PHASE 2：自分を言語化する", color: "#10b981", desc: "掘り出した過去から、強み・価値観・やりたいことを整理する。", steps: [
      { section: "strengths", title: "④ 強み・弱み分析", desc: "ガイド質問に答えるだけで見つかる", time: "15分", why: "自己PRの「結論」を決めるため。弱みの言語化も面接で差がつく" },
      { section: "values", title: "⑤ 価値観マップ", desc: "タップで選んで理由を言語化する", time: "10分", why: "「志望動機」の核になる。企業選びの判断基準にも直結する" },
      { section: "willcanmust", title: "⑥ Will / Can / Must", desc: "ガイド質問で3つの交差点を導き出す", time: "15分", why: "「なぜこの業界/職種？」への回答が作れるようになる" },
    ]},
    { title: "PHASE 3：未来を設計する", color: "#f59e0b", desc: "言語化した自分をもとに、キャリアビジョンと企業選びの軸を固める。", steps: [
      { section: "vision", title: "⑦ キャリアビジョン", desc: "穴埋め形式で未来像を描く", time: "10分", why: "「入社後何がしたい？」「将来の夢は？」に即答できるようになる" },
      { section: "axis", title: "⑧ 企業選びの軸", desc: "テンプレから選んで判断基準を作る", time: "10分", why: "内定を複数もらった時の「選ぶ基準」が明確になる" },
      { section: "summary", title: "⑨ 自己PR生成", desc: "全ワークが自動で統合される", time: "5分", why: "ESの自己PR・ガクチカ・志望動機の素材が揃う" },
    ]},
  ];

  return (
    <div>
      <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", borderRadius: 20, padding: "44px 40px", marginBottom: 32, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(99,102,241,0.15)", filter: "blur(40px)" }} />
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", margin: 0, fontFamily: "'Noto Sans JP', sans-serif", letterSpacing: -1, position: "relative" }}>
          自己分析ワークブック
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 14, margin: "12px 0 0", lineHeight: 1.8, position: "relative", maxWidth: 540 }}>
          初めてでも大丈夫。<strong style={{ color: "#c7d2fe" }}>例文・選択肢・ガイド質問</strong>が全ステップについているので、<br />
          <strong style={{ color: "#c7d2fe" }}>上から順番に進めるだけ</strong>で自己分析が完成します。
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 20, position: "relative", flexWrap: "wrap" }}>
          <div style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(255,255,255,0.08)", color: "#94a3b8", fontSize: 12 }}>
            ⏱ 全体で約<strong style={{ color: "#e2e8f0" }}>2時間</strong>
          </div>
          <div style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(255,255,255,0.08)", color: "#94a3b8", fontSize: 12 }}>
            ☁️ 自動でクラウド保存
          </div>
          <div style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(255,255,255,0.08)", color: "#94a3b8", fontSize: 12 }}>
            🎯 ES・面接の素材が自動生成
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 20px", background: "#fffbeb", borderRadius: 12, marginBottom: 28, fontSize: 13, color: "#92400e", lineHeight: 1.7, borderLeft: "4px solid #f59e0b" }}>
        ⚡ <strong>就活の効率を最大化するポイント:</strong> 自己分析は<strong>「過去を掘る → 自分を言語化 → 未来を設計」</strong>の3フェーズで進めるのが鉄則。<br />
        途中でESを書き始めたくなっても、まずはPHASE 1〜3を一通りやりきろう。結果的にES作成が10倍速くなります。
      </div>

      {phases.map((phase, pi) => (
        <div key={pi} style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 4, height: 24, borderRadius: 2, background: phase.color }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{phase.title}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{phase.desc}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingLeft: 14 }}>
            {phase.steps.map(step => (
              <button key={step.section} onClick={() => setActive(step.section)}
                style={{ display: "flex", alignItems: "center", gap: 14, background: "#fff", border: "1.5px solid #f0f0f5", borderRadius: 14, padding: "16px 20px", cursor: "pointer", textAlign: "left", transition: "all 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = phase.color; e.currentTarget.style.transform = "translateX(4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#f0f0f5"; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>{step.title}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{step.desc}</div>
                  <div style={{ fontSize: 11, color: phase.color, marginTop: 4, fontWeight: 600 }}>→ {step.why}</div>
                </div>
                <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0, fontWeight: 500 }}>{step.time}</span>
                <span style={{ color: "#c7d2fe", fontSize: 18, flexShrink: 0 }}>›</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 自分史 ─────────────────────────────────────
function HistoryPage({ data, setData }) {
  const [stage, setStage] = useState("elementary");
  const history = data.history || {};
  const update = (s, key, val) => setData(p => ({ ...p, history: { ...p.history, [s]: { ...(p.history?.[s] || {}), [key]: val } } }));

  return (
    <div>
      <SectionTitle icon="📖" title="自分史" subtitle="人生の各ステージを振り返ろう。例文を参考に、思い出を書き出してみて" />
      <Tip>💡 <strong>コツ:</strong> 完璧に書かなくてOK！まずは<strong>キーワードだけ</strong>でも書いてみよう。あとから肉付けすれば大丈夫。</Tip>
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {LIFE_STAGES.map(s => (
          <button key={s.key} onClick={() => setStage(s.key)}
            style={{ padding: "8px 18px", borderRadius: 20, border: "1.5px solid", borderColor: stage === s.key ? "#6366f1" : "#e2e8f0", background: stage === s.key ? "#6366f1" : "#fff", color: stage === s.key ? "#fff" : "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
            {s.label}{s.years && <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 4 }}>({s.years})</span>}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {HISTORY_PROMPTS.map(prompt => (
          <Card key={prompt.key}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 4 }}>{prompt.label}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>🔍 {prompt.hint}</div>
            <div style={{ fontSize: 12, color: "#818cf8", marginBottom: 10, padding: "8px 12px", background: "#f8f9ff", borderRadius: 8, borderLeft: "3px solid #c7d2fe" }}>
              {prompt.example}
            </div>
            <TextArea value={history[stage]?.[prompt.key] || ""} onChange={v => update(stage, prompt.key, v)}
              placeholder="あなたのエピソードを書いてみよう..." rows={3} />
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── モチベーショングラフ ─────────
function MotivationGraph({ points }) {
  if (points.length === 0) return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>📈</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>ポイントを追加してグラフを作成しよう</div>
      <div style={{ fontSize: 12, marginTop: 4 }}>下の「＋ ポイントを追加」から始められます</div>
    </div>
  );
  const svgW = 720, svgH = 400, pad = { t: 40, r: 40, b: 60, l: 60 };
  const gw = svgW - pad.l - pad.r, gh = svgH - pad.t - pad.b;
  const sorted = [...points].sort((a, b) => a.age - b.age);
  const minAge = Math.min(...sorted.map(p => p.age)), maxAge = Math.max(...sorted.map(p => p.age));
  const ageRange = maxAge - minAge || 1;
  const toX = a => pad.l + ((a - minAge) / ageRange) * gw;
  const toY = s => pad.t + gh - (s / 100) * gh;
  const linePath = () => { if (sorted.length < 2) return ""; return sorted.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.age)} ${toY(p.score)}`).join(" "); };
  const areaPath = () => { if (sorted.length < 2) return ""; return `M ${toX(sorted[0].age)} ${toY(0)} ` + sorted.map(p => `L ${toX(p.age)} ${toY(p.score)}`).join(" ") + ` L ${toX(sorted[sorted.length - 1].age)} ${toY(0)} Z`; };
  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="aG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" /><stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" /></linearGradient>
        <filter id="sh"><feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#6366f1" floodOpacity="0.3" /></filter>
      </defs>
      <rect x={pad.l} y={pad.t} width={gw} height={gh} fill="#fafbfe" rx="4" />
      {[0, 25, 50, 75, 100].map(v => (<g key={v}><line x1={pad.l} y1={toY(v)} x2={pad.l + gw} y2={toY(v)} stroke={v === 50 ? "#c7d2fe" : "#eef0f6"} strokeWidth={v === 50 ? 1.5 : 1} strokeDasharray={v === 50 ? "6 4" : "none"} /><text x={pad.l - 12} y={toY(v) + 4} textAnchor="end" fill="#94a3b8" fontSize="13" fontWeight="600">{v}</text></g>))}
      <text x={14} y={pad.t + gh / 2} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="600" transform={`rotate(-90, 14, ${pad.t + gh / 2})`}>モチベーション</text>
      {sorted.length >= 2 && <><path d={areaPath()} fill="url(#aG)" /><path d={linePath()} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#sh)" /></>}
      {sorted.map((p, i) => { const x = toX(p.age), y = toY(p.score); const dc = p.score >= 70 ? "#6366f1" : p.score <= 30 ? "#f43f5e" : "#8b5cf6"; const ly = p.score < 80 ? y - 20 : y + 28; return (
        <g key={i}>
          <line x1={x} y1={toY(0)} x2={x} y2={y} stroke={dc} strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
          <circle cx={x} cy={y} r="10" fill={dc} opacity="0.12" /><circle cx={x} cy={y} r="6" fill="#fff" stroke={dc} strokeWidth="2.5" /><circle cx={x} cy={y} r="3" fill={dc} />
          <text x={x} y={toY(0) + 20} textAnchor="middle" fill="#475569" fontSize="13" fontWeight="700">{p.age}歳</text>
          {p.event ? <g><rect x={x - Math.min(p.event.length * 7, 70)} y={ly - 13} width={Math.min(p.event.length * 14, 140)} height={22} rx="6" fill="#fff" stroke={dc} strokeWidth="1" opacity="0.9" /><text x={x} y={ly + 2} textAnchor="middle" fill="#1e293b" fontSize="12" fontWeight="700">{p.event.length > 10 ? p.event.slice(0, 10) + "…" : p.event}</text></g>
          : <text x={x} y={ly + 2} textAnchor="middle" fill={dc} fontSize="12" fontWeight="800">{p.score}</text>}
        </g>
      ); })}
      <rect x={pad.l} y={pad.t} width={gw} height={gh} fill="none" stroke="#e2e8f0" strokeWidth="1" rx="4" />
    </svg>
  );
}

function MotivationPage({ data, setData }) {
  const points = data.motivationPoints || [];
  const presets = [
    { age: 6, score: 70, event: "小学校入学" }, { age: 10, score: 80, event: "" },
    { age: 12, score: 50, event: "中学入学" }, { age: 15, score: 60, event: "高校入学" },
    { age: 18, score: 65, event: "大学入学" }, { age: 20, score: 50, event: "" }, { age: 22, score: 70, event: "現在" },
  ];
  const addPoint = () => setData(p => ({ ...p, motivationPoints: [...(p.motivationPoints || []), { age: 18, score: 50, event: "" }] }));
  const loadPreset = () => setData(p => ({ ...p, motivationPoints: presets }));
  const updatePoint = (i, f, v) => setData(p => { const pts = [...(p.motivationPoints || [])]; pts[i] = { ...pts[i], [f]: v }; return { ...p, motivationPoints: pts }; });
  const removePoint = (i) => setData(p => ({ ...p, motivationPoints: (p.motivationPoints || []).filter((_, j) => j !== i) }));

  return (
    <div>
      <SectionTitle icon="📈" title="モチベーショングラフ" subtitle="人生の中で気持ちが上がった時・下がった時をグラフで可視化しよう" />
      <Tip>💡 まずは「テンプレートを使う」で雛形を読み込んでから、年齢・スコア・出来事を自分用に編集するのがオススメ！</Tip>
      {points.length === 0 && (
        <Card style={{ marginBottom: 16, textAlign: "center", padding: 24 }}>
          <p style={{ fontSize: 14, color: "#475569", marginBottom: 12, fontWeight: 600 }}>どこから始める？</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={loadPreset} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "#6366f1", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              📋 テンプレートを使う（推奨）
            </button>
            <button onClick={addPoint} style={{ padding: "10px 20px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              ✏️ ゼロから作る
            </button>
          </div>
        </Card>
      )}
      <Card style={{ marginBottom: 20, padding: "24px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 12 }}>あなたのモチベーション推移</div>
        <MotivationGraph points={points} />
      </Card>
      {points.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 12 }}>ポイント一覧 <span style={{ fontWeight: 400, color: "#94a3b8" }}>— スコアを調整して、出来事を記入しよう</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {points.map((p, i) => (
              <Card key={i} style={{ padding: 20 }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
                  <div style={{ flex: "0 0 80px" }}>
                    <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, display: "block", marginBottom: 4 }}>年齢</label>
                    <input type="number" value={p.age} min={0} max={100} onChange={e => updatePoint(i, "age", Number(e.target.value))}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 15, fontWeight: 600, outline: "none", boxSizing: "border-box", textAlign: "center" }} />
                  </div>
                  <div style={{ flex: "0 0 150px" }}>
                    <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span>スコア</span><span style={{ color: "#6366f1", fontWeight: 800, fontSize: 14 }}>{p.score}</span>
                    </label>
                    <input type="range" value={p.score} min={0} max={100} onChange={e => updatePoint(i, "score", Number(e.target.value))} style={{ width: "100%", accentColor: "#6366f1" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, display: "block", marginBottom: 4 }}>出来事</label>
                    <input type="text" value={p.event || ""} placeholder="何があった？" onChange={e => updatePoint(i, "event", e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <button onClick={() => removePoint(i)} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "#fef2f2", color: "#ef4444", cursor: "pointer", fontSize: 16, flexShrink: 0 }}>×</button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
      <button onClick={addPoint} style={{ marginTop: 12, padding: "12px 24px", borderRadius: 10, border: "2px dashed #c7d2fe", background: "#fafafe", color: "#6366f1", fontWeight: 700, fontSize: 14, cursor: "pointer", width: "100%" }}>＋ ポイントを追加</button>
    </div>
  );
}

// ─── なぜなぜ分析 ──────────────────────────────────
function WhyChainPage({ data, setData }) {
  const chains = data.whyChains || [];
  const [showPicker, setShowPicker] = useState(chains.length === 0);

  const addChainFromTemplate = (cat, ep) => {
    setData(p => ({ ...p, whyChains: [...(p.whyChains || []), { event: ep, category: cat, whys: ["", "", ""], insight: "" }] }));
    setShowPicker(false);
  };
  const addChainBlank = () => {
    setData(p => ({ ...p, whyChains: [...(p.whyChains || []), { event: "", category: "", whys: ["", "", ""], insight: "" }] }));
    setShowPicker(false);
  };
  const updateChain = (i, f, v) => setData(p => { const c = [...(p.whyChains || [])]; c[i] = { ...c[i], [f]: v }; return { ...p, whyChains: c }; });
  const updateWhy = (ci, wi, v) => setData(p => { const c = [...(p.whyChains || [])]; const w = [...c[ci].whys]; w[wi] = v; c[ci] = { ...c[ci], whys: w }; return { ...p, whyChains: c }; });
  const removeChain = (i) => setData(p => ({ ...p, whyChains: (p.whyChains || []).filter((_, j) => j !== i) }));

  return (
    <div>
      <SectionTitle icon="🔗" title="なぜなぜ分析" subtitle="「なぜ頑張れた？」を3回繰り返すと、自分の本質的な価値観が見えてくる" />
      <Tip>
        💡 <strong>やり方:</strong> ①まずエピソードを選ぶ → ②各ステップで選択肢を参考に回答する → ③最後に「自分の本質」をまとめる<br />
        自分史やモチベーショングラフで書いた<strong>印象的な出来事</strong>を深掘りするのがオススメ！
      </Tip>

      {showPicker && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>📌 深掘りするエピソードを選ぼう</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {WHY_EPISODE_TEMPLATES.map(cat => (
              <div key={cat.label}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
                  <span style={{ marginRight: 6 }}>{cat.icon}</span>{cat.label}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {cat.examples.map(ep => (
                    <button key={ep} onClick={() => addChainFromTemplate(cat.label, ep)}
                      style={{ padding: "8px 14px", borderRadius: 10, border: "1.5px solid #e0e7ff", background: "#fff", color: "#4338ca", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#eef2ff"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
                    >{ep}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #f0f0f5", marginTop: 16, paddingTop: 16 }}>
            <button onClick={addChainBlank} style={{ padding: "10px 20px", borderRadius: 8, border: "1.5px dashed #d4d4d8", background: "transparent", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              ✏️ 自分でエピソードを入力する
            </button>
          </div>
        </Card>
      )}

      {chains.map((chain, ci) => (
        <Card key={ci} style={{ marginBottom: 20, position: "relative" }}>
          <button onClick={() => removeChain(ci)} style={{ position: "absolute", top: 12, right: 12, width: 28, height: 28, borderRadius: 6, border: "none", background: "#fef2f2", color: "#ef4444", cursor: "pointer", fontSize: 14 }}>×</button>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6, display: "block" }}>🎬 エピソード</label>
            <TextArea value={chain.event || ""} onChange={v => updateChain(ci, "event", v)} placeholder="深掘りしたいエピソードを具体的に書こう" rows={2} />
          </div>
          <div style={{ paddingLeft: 20, borderLeft: "3px solid #e0e7ff" }}>
            {WHY_GUIDE_STEPS.map((step, wi) => (
              <div key={wi} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#6366f1", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{step.num}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#6366f1" }}>{step.label}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>— {step.hint}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  {step.examples.map(ex => (
                    <ExampleBubble key={ex} text={ex} onClick={() => {
                      const cur = chain.whys[wi] || "";
                      updateWhy(ci, wi, cur ? cur + "、" + ex : ex);
                    }} />
                  ))}
                </div>
                <TextArea value={chain.whys[wi] || ""} onChange={v => updateWhy(ci, wi, v)}
                  placeholder="選択肢を参考に、自分の言葉で書いてみよう..." rows={2} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, background: "#f8faf5", borderRadius: 12, padding: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8, display: "block" }}>💡 この深掘りから見えた自分の本質</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {INSIGHT_TEMPLATES.map(t => (
                <ExampleBubble key={t} text={t.replace("{X}", "＿＿")} onClick={() => updateChain(ci, "insight", t.replace("{X}", ""))} />
              ))}
            </div>
            <TextArea value={chain.insight || ""} onChange={v => updateChain(ci, "insight", v)}
              placeholder='例: 自分は「仲間と一緒に成長すること」にモチベーションが湧くタイプ' rows={2} />
          </div>
          <div style={{ marginTop: 16, background: "#f8f9ff", borderRadius: 12, padding: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", marginBottom: 10, display: "block" }}>📝 ガクチカ用メモ（STAR法）<span style={{ fontWeight: 400, color: "#94a3b8", marginLeft: 6 }}>— 書いておくとサマリーに自動反映</span></label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { key: "situation", label: "S: 状況", ph: "いつ、どこで、どんな場面？" },
                { key: "task", label: "T: 課題", ph: "何が問題・目標だった？" },
                { key: "action", label: "A: 行動", ph: "自分は何をした？ 工夫は？" },
                { key: "result", label: "R: 結果", ph: "数字で表せる成果は？ 学びは？" },
              ].map(s => (
                <div key={s.key}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 3, display: "block" }}>{s.label}</label>
                  <textarea value={chain[s.key] || ""} onChange={e => updateChain(ci, s.key, e.target.value)}
                    placeholder={s.ph} rows={2}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 12, fontFamily: "'Noto Sans JP', sans-serif", resize: "vertical", background: "#fff", outline: "none", lineHeight: 1.6, boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = "#6366f1"}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                  />
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}

      {chains.length > 0 && (
        <button onClick={() => setShowPicker(true)} style={{ padding: "14px 24px", borderRadius: 10, border: "2px dashed #c7d2fe", background: "#fafafe", color: "#6366f1", fontWeight: 700, fontSize: 14, cursor: "pointer", width: "100%" }}>
          ＋ もう1つエピソードを深掘りする
        </button>
      )}
    </div>
  );
}

// ─── 強み・弱み ─────────────────────────────────
function StrengthsPage({ data, setData }) {
  const strengths = data.strengths || {};
  const episodes = data.strengthEpisodes || {};
  const [openKey, setOpenKey] = useState(null);
  const updateStrength = (k, v) => setData(p => ({ ...p, strengths: { ...p.strengths, [k]: v } }));
  const updateEpisode = (k, v) => setData(p => ({ ...p, strengthEpisodes: { ...p.strengthEpisodes, [k]: v } }));

  const sorted = [...STRENGTH_CATEGORIES].sort((a, b) => (strengths[b.key] || 0) - (strengths[a.key] || 0));

  return (
    <div>
      <SectionTitle icon="⚖️" title="強み・弱み分析" subtitle="8つの力について、ガイド質問に答えながら自己評価しよう" />
      <Tip>
        💡 <strong>進め方:</strong> 各カードの「考えるヒント」に答えてみて → エピソードが思い浮かんだら高スコア、思い浮かばなかったら低スコアをつけよう。<br />
        <strong>スコア4以上が2〜3個</strong>あれば十分！弱みも大事な自己分析データです。
      </Tip>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 16 }}>自己評価チャート</div>
        {sorted.map(cat => (
          <div key={cat.key} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div style={{ width: 140, fontSize: 12, fontWeight: 600, color: "#334155", flexShrink: 0 }}>{cat.label}</div>
            <div style={{ flex: 1, height: 18, background: "#f1f5f9", borderRadius: 9, overflow: "hidden" }}>
              <div style={{ width: `${((strengths[cat.key] || 0) / 5) * 100}%`, height: "100%", borderRadius: 9, background: (strengths[cat.key] || 0) >= 4 ? "linear-gradient(90deg, #6366f1, #8b5cf6)" : (strengths[cat.key] || 0) >= 2 ? "linear-gradient(90deg, #818cf8, #a78bfa)" : "#cbd5e1", transition: "width 0.4s" }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#6366f1", width: 20, textAlign: "right" }}>{strengths[cat.key] || 0}</span>
          </div>
        ))}
      </Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {STRENGTH_CATEGORIES.map(cat => {
          const isOpen = openKey === cat.key;
          return (
            <Card key={cat.key} style={{ padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, cursor: "pointer" }} onClick={() => setOpenKey(isOpen ? null : cat.key)}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{cat.label}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{cat.desc}</div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={e => { e.stopPropagation(); updateStrength(cat.key, n); }}
                      style={{ width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer", background: (strengths[cat.key] || 0) >= n ? "#6366f1" : "#f1f5f9", color: (strengths[cat.key] || 0) >= n ? "#fff" : "#94a3b8", fontWeight: 700, fontSize: 13, transition: "all 0.15s" }}
                    >{n}</button>
                  ))}
                </div>
              </div>
              <div style={{ overflow: "hidden", maxHeight: isOpen ? 600 : 0, transition: "max-height 0.3s ease", opacity: isOpen ? 1 : 0 }}>
                <div style={{ padding: "12px 0 0" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", marginBottom: 8 }}>🤔 考えるヒント</div>
                  {cat.questions.map((q, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#475569", padding: "4px 0 4px 12px", borderLeft: "2px solid #e0e7ff" }}>
                      Q. {q}
                    </div>
                  ))}
                  <div style={{ fontSize: 12, color: "#818cf8", marginTop: 8, padding: "8px 12px", background: "#f8f9ff", borderRadius: 8, borderLeft: "3px solid #c7d2fe" }}>
                    💬 回答例: {cat.example}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <TextArea value={episodes[cat.key] || ""} onChange={v => updateEpisode(cat.key, v)}
                      placeholder="この力を発揮したエピソードを書いてみよう..." rows={3} />
                  </div>
                </div>
              </div>
              {!isOpen && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, cursor: "pointer" }} onClick={() => setOpenKey(cat.key)}>▼ クリックして詳しく記入する</div>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── 価値観マップ ──────────────────────────────────
function ValuesPage({ data, setData }) {
  const selected = data.selectedValues || [];
  const reasons = data.valueReasons || {};
  const toggle = v => setData(p => { const s = p.selectedValues || []; return { ...p, selectedValues: s.includes(v) ? s.filter(x => x !== v) : s.length < 7 ? [...s, v] : s }; });
  const updateReason = (v, t) => setData(p => ({ ...p, valueReasons: { ...p.valueReasons, [v]: t } }));

  return (
    <div>
      <SectionTitle icon="🧭" title="価値観マップ" subtitle="仕事で大切にしたいことを最大7つ選ぼう" />
      <Tip>💡 「どれも大事…」と思っても大丈夫。<strong>相対的に</strong>どれが上か、で選んでみよう。面接では「なぜそれが大事か？」を聞かれるので、理由も書いておくと最強！</Tip>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 14 }}>
          タップして選択（最大7つ）: <span style={{ color: "#6366f1" }}>{selected.length}/7</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {VALUE_OPTIONS.map(v => (
            <button key={v.label} onClick={() => toggle(v.label)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12,
              border: "1.5px solid", borderColor: selected.includes(v.label) ? "#6366f1" : "#e2e8f0",
              background: selected.includes(v.label) ? "#eef2ff" : "#fff", cursor: "pointer", textAlign: "left", transition: "all 0.15s",
            }}>
              <span style={{ width: 22, height: 22, borderRadius: 6, border: "2px solid", borderColor: selected.includes(v.label) ? "#6366f1" : "#d4d4d8", background: selected.includes(v.label) ? "#6366f1" : "transparent", color: "#fff", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {selected.includes(v.label) && "✓"}
              </span>
              <div>
                <div style={{ fontSize: 14, fontWeight: selected.includes(v.label) ? 700 : 600, color: selected.includes(v.label) ? "#4338ca" : "#334155" }}>{v.label}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{v.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </Card>
      {selected.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>選んだ価値観の理由 <span style={{ fontWeight: 400, color: "#94a3b8" }}>— 「なぜ？」を一言でも書いておこう</span></div>
          {selected.map((v, i) => (
            <Card key={v} style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ width: 24, height: 24, borderRadius: 6, background: "#6366f1", color: "#fff", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{v}</span>
              </div>
              <TextArea value={reasons[v] || ""} onChange={t => updateReason(v, t)} placeholder={`なぜ「${v}」が大切？ 過去のどんな経験から？`} rows={2} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Will / Can / Must ──────────────────────────
function WillCanMustPage({ data, setData }) {
  const wcm = data.wcm || { will: "", can: "", must: "", overlap: "" };
  const update = (k, v) => setData(p => ({ ...p, wcm: { ...p.wcm, [k]: v } }));

  const items = [
    { key: "will", label: "Will（やりたいこと）", color: "#6366f1", guideQs: [
      "時間を忘れて没頭できることは？", "「世の中のこれを変えたい！」と思うことは？", "お金をもらえなくてもやりたいことは？"
    ], examples: ["人の成長に関わる仕事", "データ分析で課題を解決する", "新しいサービスを0→1で立ち上げる", "海外と関わるビジネス"] },
    { key: "can", label: "Can（できること）", color: "#10b981", guideQs: [
      "人から「上手いね」「すごいね」と言われることは？", "強み分析でスコア4以上だったものは？", "他の人より楽にできることは？"
    ], examples: ["人の話を聞いて整理する", "コツコツ続ける", "プレゼン・説明が得意", "データ分析・数字に強い", "チームをまとめる"] },
    { key: "must", label: "Must（求められること）", color: "#f59e0b", guideQs: [
      "今の社会で解決が必要だと感じる課題は？", "バイトや活動で「あなたにお願いしたい」と言われたことは？", "10年後の世界で必要になりそうな仕事は？"
    ], examples: ["DX推進", "少子高齢化への対応", "地方創生", "環境問題の解決", "教育格差の是正", "AIの活用"] },
  ];

  return (
    <div>
      <SectionTitle icon="🎯" title="Will / Can / Must" subtitle="「やりたい」×「できる」×「求められる」の交差点を見つけよう" />
      <Tip>💡 <strong>ガイド質問に答える形式</strong>で進めよう。全部答えなくてもOK。思いついたものから書いていけば自然とまとまるよ！</Tip>
      <Card style={{ marginBottom: 24, textAlign: "center", padding: 32 }}>
        <svg width="280" height="240" viewBox="0 0 280 240">
          <circle cx="140" cy="90" r="80" fill="rgba(99,102,241,0.12)" stroke="#6366f1" strokeWidth="2" />
          <circle cx="100" cy="170" r="80" fill="rgba(16,185,129,0.12)" stroke="#10b981" strokeWidth="2" />
          <circle cx="180" cy="170" r="80" fill="rgba(245,158,11,0.12)" stroke="#f59e0b" strokeWidth="2" />
          <text x="140" y="60" textAnchor="middle" fill="#6366f1" fontWeight="700" fontSize="13">Will</text>
          <text x="60" y="200" textAnchor="middle" fill="#10b981" fontWeight="700" fontSize="13">Can</text>
          <text x="220" y="200" textAnchor="middle" fill="#f59e0b" fontWeight="700" fontSize="13">Must</text>
          <text x="140" y="148" textAnchor="middle" fill="#0f172a" fontWeight="800" fontSize="12">最適</text>
          <text x="140" y="162" textAnchor="middle" fill="#0f172a" fontWeight="800" fontSize="12">キャリア</text>
        </svg>
      </Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {items.map(item => (
          <Card key={item.key} style={{ borderLeft: `4px solid ${item.color}` }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: item.color, marginBottom: 12 }}>{item.label}</div>
            <div style={{ marginBottom: 12 }}>
              {item.guideQs.map((q, i) => (
                <div key={i} style={{ fontSize: 12, color: "#475569", padding: "5px 0 5px 12px", borderLeft: "2px solid #e0e7ff", marginBottom: 4 }}>
                  Q{i + 1}. {q}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {item.examples.map(ex => (
                <ExampleBubble key={ex} text={ex} onClick={() => {
                  const cur = wcm[item.key] || "";
                  update(item.key, cur ? cur + "\n" + ex : ex);
                }} />
              ))}
            </div>
            <TextArea value={wcm[item.key] || ""} onChange={v => update(item.key, v)} placeholder="ガイド質問への回答や、選択肢で気になったものを自分の言葉で書いてみよう..." rows={4} />
          </Card>
        ))}
        <Card style={{ borderLeft: "4px solid #0f172a" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>3つが重なるところ（=あなたの軸）</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>上で書いた Will・Can・Must を見返して、共通するキーワードや方向性をまとめよう</div>
          <TextArea value={wcm.overlap || ""} onChange={v => update("overlap", v)} placeholder="例: 「データ分析の力を活かして、社会課題を解決する事業に携わりたい」" rows={4} />
        </Card>
      </div>
    </div>
  );
}

// ─── キャリアビジョン ──────────────────────────────
function VisionPage({ data, setData }) {
  const vision = data.vision || { short: "", mid: "", long: "", rolemodel: "" };
  const update = (k, v) => setData(p => ({ ...p, vision: { ...p.vision, [k]: v } }));

  const stages = [
    { key: "short", label: "短期（1〜3年）", icon: "🌱",
      guideQs: ["入社してまず身につけたいスキルは？", "1年目に達成したい目標は？"],
      template: "入社後は（　　　）のスキルを身につけ、（　　　）ができるようになりたい。",
      examples: ["営業の基礎を叩き込む", "プログラミングスキルを習得", "チームリーダーを任される", "資格を取得する"] },
    { key: "mid", label: "中期（3〜10年）", icon: "🌿",
      guideQs: ["30歳の時、どんなポジションにいたい？", "どんな実績を持っていたい？"],
      template: "（　　　）の分野で経験を積み、（　　　）のポジションで（　　　）を達成したい。",
      examples: ["プロジェクトマネージャーとして大型案件を牽引", "海外拠点で勤務", "新規事業の立ち上げに携わる", "後輩の育成に貢献"] },
    { key: "long", label: "長期（10年〜）", icon: "🌳",
      guideQs: ["最終的に、どんな人として社会に貢献したい？", "仕事を通じて成し遂げたい「大きなこと」は？"],
      template: "最終的には（　　　）を通じて、（　　　）な社会の実現に貢献したい。",
      examples: ["業界を変えるサービスを作る", "経営に携わる", "社会課題を解決する事業を率いる", "独立して自分の理想を追求する"] },
  ];

  return (
    <div>
      <SectionTitle icon="🔭" title="キャリアビジョン" subtitle="面接で「入社後何がしたい？」「将来の夢は？」に答えられるようにしよう" />
      <Tip>
        💡 <strong>穴埋めテンプレート</strong>を用意しました。まずテンプレートを参考に書いてみて、あとから自分の言葉に直せばOK！<br />
        最初から完璧に書く必要はありません。
      </Tip>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {stages.map(s => (
          <Card key={s.key}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <div><div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{s.label}</div></div>
            </div>
            <div style={{ marginBottom: 10 }}>
              {s.guideQs.map((q, i) => (
                <div key={i} style={{ fontSize: 12, color: "#475569", padding: "4px 0 4px 12px", borderLeft: "2px solid #e0e7ff", marginBottom: 4 }}>Q. {q}</div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "#818cf8", padding: "10px 14px", background: "#f8f9ff", borderRadius: 8, marginBottom: 10, borderLeft: "3px solid #c7d2fe" }}>
              📝 テンプレート: {s.template}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {s.examples.map(ex => (
                <ExampleBubble key={ex} text={ex} onClick={() => { const cur = vision[s.key] || ""; update(s.key, cur ? cur + "、" + ex : ex); }} />
              ))}
            </div>
            <TextArea value={vision[s.key] || ""} onChange={v => update(s.key, v)} placeholder="テンプレートや例を参考に書いてみよう..." rows={3} />
          </Card>
        ))}
        <Card>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>🌟 ロールモデル（任意）</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>憧れる人がいれば、その人のどこに惹かれるか書いてみよう。ビジョンのヒントになるよ！</div>
          <TextArea value={vision.rolemodel || ""} onChange={v => update("rolemodel", v)} placeholder="例: 孫正義。大きなビジョンを掲げて実行する姿勢に憧れる" rows={2} />
        </Card>
      </div>
    </div>
  );
}

// ─── 企業選びの軸 ──────────────────────────────────
function AxisPage({ data, setData }) {
  const axis = data.axis || [];
  const [showTemplates, setShowTemplates] = useState(axis.length === 0);

  const addFromTemplate = (t) => {
    setData(p => ({ ...p, axis: [...(p.axis || []), { name: t.name, category: t.category, priority: 3, reason: "", dealbreaker: false, guideQ: t.guideQ }] }));
  };
  const updateAxis = (i, f, v) => setData(p => { const a = [...(p.axis || [])]; a[i] = { ...a[i], [f]: v }; return { ...p, axis: a }; });
  const removeAxis = (i) => setData(p => ({ ...p, axis: (p.axis || []).filter((_, j) => j !== i) }));
  const addBlank = () => setData(p => ({ ...p, axis: [...(p.axis || []), { name: "", category: "", priority: 3, reason: "", dealbreaker: false, guideQ: "" }] }));

  const categories = [...new Set(AXIS_TEMPLATES.map(t => t.category))];

  return (
    <div>
      <SectionTitle icon="🏢" title="企業選びの軸" subtitle="自分にとって譲れない条件を整理して、企業選びの判断基準を作ろう" />
      <Tip>
        💡 まずは<strong>テンプレートから3〜5個選ぶ</strong>のがオススメ。そのあと優先度（★）をつけて、「絶対条件」にチェックを入れよう。<br />
        面接で「企業選びの軸は？」と聞かれた時に、理由まで含めて答えられるようになるのがゴール！
      </Tip>

      {showTemplates && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>📌 テンプレートから選ぼう（複数選択OK）</div>
          {categories.map(cat => (
            <div key={cat} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", marginBottom: 8, textTransform: "uppercase" }}>{cat}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {AXIS_TEMPLATES.filter(t => t.category === cat).map(t => {
                  const added = axis.some(a => a.name === t.name);
                  return (
                    <button key={t.name} onClick={() => !added && addFromTemplate(t)} disabled={added}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10, border: "1.5px solid", borderColor: added ? "#c7d2fe" : "#e2e8f0", background: added ? "#eef2ff" : "#fff", cursor: added ? "default" : "pointer", textAlign: "left", opacity: added ? 0.7 : 1 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 6, border: "2px solid", borderColor: added ? "#6366f1" : "#d4d4d8", background: added ? "#6366f1" : "transparent", color: "#fff", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {added && "✓"}
                      </span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{t.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <button onClick={() => setShowTemplates(false)} style={{ marginTop: 8, padding: "10px 20px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            ✅ 選び終わった — 詳細を記入する
          </button>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {axis.map((a, i) => (
          <Card key={i} style={{ padding: 20, position: "relative" }}>
            <button onClick={() => removeAxis(i)} style={{ position: "absolute", top: 10, right: 10, width: 26, height: 26, borderRadius: 6, border: "none", background: "#fef2f2", color: "#ef4444", cursor: "pointer", fontSize: 13 }}>×</button>
            <div style={{ display: "flex", gap: 12, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
              <input type="text" value={a.name || ""} placeholder="軸の名前" onChange={e => updateAxis(i, "name", e.target.value)}
                style={{ flex: 1, minWidth: 150, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, fontWeight: 600, outline: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>優先度:</span>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => updateAxis(i, "priority", n)} style={{ width: 26, height: 26, borderRadius: 6, border: "none", cursor: "pointer", background: n <= a.priority ? "#fbbf24" : "#f1f5f9", color: n <= a.priority ? "#fff" : "#94a3b8", fontWeight: 700, fontSize: 11 }}>★</button>
                ))}
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#ef4444", fontWeight: 600, cursor: "pointer" }}>
                <input type="checkbox" checked={a.dealbreaker || false} onChange={e => updateAxis(i, "dealbreaker", e.target.checked)} style={{ accentColor: "#ef4444" }} />絶対条件
              </label>
            </div>
            {a.guideQ && (
              <div style={{ fontSize: 12, color: "#475569", padding: "6px 12px", borderLeft: "2px solid #e0e7ff", marginBottom: 8 }}>
                🤔 {a.guideQ}
              </div>
            )}
            <TextArea value={a.reason || ""} onChange={v => updateAxis(i, "reason", v)} placeholder="なぜこの軸が大切？ どんな経験からそう思った？" rows={2} />
          </Card>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={() => setShowTemplates(true)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "2px dashed #c7d2fe", background: "#fafafe", color: "#6366f1", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          📋 テンプレートから追加
        </button>
        <button onClick={addBlank} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "2px dashed #d4d4d8", background: "transparent", color: "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          ✏️ 自分で追加
        </button>
      </div>
    </div>
  );
}

// ─── サマリー ────────────────────────
function SummaryPage({ data }) {
  const [tab, setTab] = useState("overview");
  const topStrengths = STRENGTH_CATEGORIES.filter(c => (data.strengths?.[c.key] || 0) >= 4).sort((a, b) => (data.strengths?.[b.key] || 0) - (data.strengths?.[a.key] || 0)).slice(0, 3);
  const topValues = (data.selectedValues || []).slice(0, 5);
  const wcm = data.wcm || {};
  const vision = data.vision || {};
  const chains = data.whyChains || [];
  const insights = chains.map(c => c.insight).filter(Boolean);
  const dealbreakers = (data.axis || []).filter(a => a.dealbreaker && a.name);
  const tabs = [{ id: "overview", label: "全体サマリー" }, { id: "selfpr", label: "自己PR素材" }, { id: "gakuchika", label: "ガクチカ素材" }, { id: "shibou", label: "志望動機の軸" }];

  return (
    <div>
      <SectionTitle icon="✨" title="自己分析サマリー" subtitle="これまでのワークが自動で統合されます。ES・面接の素材として使おう！" />
      <Tip>💡 各セクションを埋めるほど、ここに表示される素材が充実していきます。まだ空のところがあれば、戻って記入してみよう！</Tip>
      <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "8px 18px", borderRadius: 20, border: "1.5px solid", borderColor: tab === t.id ? "#6366f1" : "#e2e8f0", background: tab === t.id ? "#6366f1" : "#fff", color: tab === t.id ? "#fff" : "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{t.label}</button>
        ))}
      </div>
      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 12px" }}>🏆 トップ強み</h3>
            {topStrengths.length > 0 ? topStrengths.map(s => (
              <div key={s.key} style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
                <strong style={{ color: "#6366f1" }}>{s.label}</strong><span style={{ color: "#64748b", marginLeft: 8 }}>（スコア: {data.strengths?.[s.key]}）</span>
                {data.strengthEpisodes?.[s.key] && <div style={{ color: "#475569", marginTop: 4, fontSize: 12 }}>{data.strengthEpisodes[s.key]}</div>}
              </div>
            )) : <p style={{ color: "#94a3b8", fontSize: 13 }}>← 「強み・弱み分析」でスコア4以上をつけると表示されます</p>}
          </Card>
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 12px" }}>🧭 コア価値観</h3>
            {topValues.length > 0 ? <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{topValues.map(v => <span key={v} style={{ padding: "6px 14px", borderRadius: 16, background: "#eef2ff", color: "#4338ca", fontSize: 12, fontWeight: 600 }}>{v}</span>)}</div>
            : <p style={{ color: "#94a3b8", fontSize: 13 }}>← 「価値観マップ」で選択すると表示されます</p>}
          </Card>
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 12px" }}>💡 深掘りから見えた本質</h3>
            {insights.length > 0 ? insights.map((ins, i) => <div key={i} style={{ padding: "8px 14px", background: "#f0fdf4", borderRadius: 8, marginBottom: 6, fontSize: 13, color: "#166534" }}>"{ins}"</div>)
            : <p style={{ color: "#94a3b8", fontSize: 13 }}>← 「なぜなぜ分析」で本質を記入すると表示されます</p>}
          </Card>
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 12px" }}>🎯 Will×Can×Mustの交差点</h3>
            {wcm.overlap ? <p style={{ color: "#334155", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{wcm.overlap}</p>
            : <p style={{ color: "#94a3b8", fontSize: 13 }}>← 「Will/Can/Must」の交差点に記入すると表示されます</p>}
          </Card>
        </div>
      )}
      {tab === "selfpr" && (
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>自己PRの構成テンプレート</h3>
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20, fontSize: 13, lineHeight: 2, color: "#334155" }}>
            <div style={{ marginBottom: 12 }}><strong style={{ color: "#6366f1" }}>① 結論（強み）:</strong><br />私の強みは <span style={{ background: "#eef2ff", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{topStrengths[0]?.label || "＿＿＿"}</span> です。</div>
            <div style={{ marginBottom: 12 }}><strong style={{ color: "#6366f1" }}>② エピソード（STAR法）:</strong><br />{data.strengthEpisodes?.[topStrengths[0]?.key] || "← 強み分析のエピソード欄に記入すると反映"}</div>
            <div><strong style={{ color: "#6366f1" }}>③ 入社後の活かし方:</strong><br />この強みを活かして、<span style={{ background: "#eef2ff", padding: "2px 8px", borderRadius: 4 }}>{vision.short || "（短期ビジョンを記入すると反映）"}</span>に貢献したいです。</div>
          </div>
          <div style={{ marginTop: 16, padding: "12px 16px", background: "#fffbeb", borderRadius: 8, fontSize: 12, color: "#92400e" }}>
            💡 <strong>STAR法</strong>: Situation（状況）→ Task（課題）→ Action（行動）→ Result（結果）で構成すると説得力UP
          </div>
        </Card>
      )}
      {tab === "gakuchika" && (
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>ガクチカの素材（STAR法）</h3>
          <div style={{ padding: "10px 14px", background: "#fffbeb", borderRadius: 8, fontSize: 12, color: "#92400e", marginBottom: 16 }}>
            💡 <strong>STAR法</strong>で整理すると面接官に伝わりやすい: S（状況）→ T（課題）→ A（行動）→ R（結果）
          </div>
          {chains.length > 0 ? chains.map((c, i) => (
            <div key={i} style={{ background: "#f8fafc", borderRadius: 10, padding: 16, marginBottom: 12, fontSize: 13 }}>
              <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>エピソード {i + 1}: {c.event || "（未記入）"}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                {[
                  { key: "situation", label: "S: 状況", color: "#6366f1" },
                  { key: "task", label: "T: 課題", color: "#10b981" },
                  { key: "action", label: "A: 行動", color: "#f59e0b" },
                  { key: "result", label: "R: 結果", color: "#ef4444" },
                ].map(s => (
                  <div key={s.key} style={{ padding: "8px 10px", borderRadius: 6, background: "#fff", border: "1px solid #f0f0f5" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: s.color, marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: "#475569" }}>{c[s.key] || "—（なぜなぜ分析で記入）"}</div>
                  </div>
                ))}
              </div>
              <div style={{ color: "#475569", lineHeight: 1.7, borderTop: "1px solid #f0f0f5", paddingTop: 8 }}>
                <strong>深掘りの動機:</strong> {c.whys?.[0] || "—"}<br />
                <strong>見えた本質:</strong> {c.insight || "—"}
              </div>
            </div>
          )) : <p style={{ color: "#94a3b8", fontSize: 13 }}>← 「なぜなぜ分析」にエピソードを追加すると表示されます</p>}
        </Card>
      )}
      {tab === "shibou" && (
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>志望動機の構成要素</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "#eef2ff", borderRadius: 10, padding: 16, fontSize: 13 }}><strong style={{ color: "#6366f1" }}>価値観の軸:</strong><div style={{ marginTop: 6, color: "#334155" }}>{topValues.length > 0 ? topValues.join("、") : "← 価値観マップで選択"}</div></div>
            <div style={{ background: "#ecfdf5", borderRadius: 10, padding: 16, fontSize: 13 }}><strong style={{ color: "#059669" }}>絶対条件:</strong><div style={{ marginTop: 6, color: "#334155" }}>{dealbreakers.length > 0 ? dealbreakers.map(d => d.name).join("、") : "← 企業選びの軸で「絶対条件」をチェック"}</div></div>
            <div style={{ background: "#fffbeb", borderRadius: 10, padding: 16, fontSize: 13 }}><strong style={{ color: "#d97706" }}>将来ビジョン:</strong><div style={{ marginTop: 6, color: "#334155" }}>{vision.long || "← キャリアビジョンの長期を記入"}</div></div>
            <div style={{ background: "#fef2f2", borderRadius: 10, padding: 16, fontSize: 13 }}><strong style={{ color: "#dc2626" }}>Will×Can×Must:</strong><div style={{ marginTop: 6, color: "#334155" }}>{wcm.overlap || "← Will/Can/Mustの交差点を記入"}</div></div>
          </div>
          <div style={{ marginTop: 16, padding: "12px 16px", background: "#f8fafc", borderRadius: 8, fontSize: 12, color: "#475569", lineHeight: 1.7 }}>
            💡 志望動機 = <strong>「自分の原体験×価値観×ビジョン」</strong>と<strong>「その企業でしかできないこと」</strong>の掛け算。企業ごとにカスタマイズしよう。
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Main App ──────────────────────────────────────
export default function Workbook({ initialData, userEmail }) {
  const [active, setActive] = useState("home");
  const [mobileNav, setMobileNav] = useState(false);
  // Merge with DEFAULT_DATA so fields added in later versions exist on older saves.
  const mergedInitial = { ...DEFAULT_DATA, ...(initialData || {}) };
  const [data, setData] = useState(mergedInitial);
  const [saveStatus, setSaveStatus] = useState("idle");

  const supabase = getSupabaseBrowser();
  const saveTimer = useRef(null);
  const statusTimer = useRef(null);
  const dirtyRef = useRef(false);
  const lastSavedRef = useRef(JSON.stringify(mergedInitial));
  const saveGenRef = useRef(0);

  // Debounced auto-save
  useEffect(() => {
    const serialized = JSON.stringify(data);
    if (serialized === lastSavedRef.current) return;
    dirtyRef.current = true;
    setSaveStatus("dirty");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const gen = ++saveGenRef.current;
      setSaveStatus("saving");
      const { error } = await supabase.from("user_data").upsert(
        { user_id: (await supabase.auth.getUser()).data.user?.id, data, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
      // Stale response — a newer save has been queued; ignore this result.
      if (gen !== saveGenRef.current) return;
      if (error) {
        console.error("save error", error);
        setSaveStatus("error");
      } else {
        lastSavedRef.current = serialized;
        // Only mark clean if nothing changed while we were saving.
        if (JSON.stringify(data) === serialized) {
          dirtyRef.current = false;
          setSaveStatus("saved");
          if (statusTimer.current) clearTimeout(statusTimer.current);
          statusTimer.current = setTimeout(
            () => setSaveStatus((s) => (s === "saved" ? "idle" : s)),
            1500
          );
        }
      }
    }, 1000);
    return () => clearTimeout(saveTimer.current);
  }, [data, supabase]);

  // Clear pending timers on unmount
  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (statusTimer.current) clearTimeout(statusTimer.current);
  }, []);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e) => {
      if (dirtyRef.current) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const logout = useCallback(async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (statusTimer.current) clearTimeout(statusTimer.current);
    saveGenRef.current++; // Invalidate any in-flight save
    await supabase.auth.signOut();
    window.location.href = "/login";
  }, [supabase]);

  const renderPage = () => {
    switch (active) {
      case "home": return <HomePage setActive={setActive} />;
      case "history": return <HistoryPage data={data} setData={setData} />;
      case "motivation": return <MotivationPage data={data} setData={setData} />;
      case "whychain": return <WhyChainPage data={data} setData={setData} />;
      case "strengths": return <StrengthsPage data={data} setData={setData} />;
      case "values": return <ValuesPage data={data} setData={setData} />;
      case "willcanmust": return <WillCanMustPage data={data} setData={setData} />;
      case "vision": return <VisionPage data={data} setData={setData} />;
      case "axis": return <AxisPage data={data} setData={setData} />;
      case "summary": return <SummaryPage data={data} />;
      default: return null;
    }
  };

  return (
    <div style={{ fontFamily: "'Noto Sans JP', 'Helvetica Neue', sans-serif", minHeight: "100vh", background: "#f8f9fb" }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <div style={{ display: "none", position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "#fff", borderBottom: "1px solid #f0f0f5", padding: "12px 16px", justifyContent: "space-between", alignItems: "center" }} className="mobile-header">
        <span style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>自己分析ワークブック</span>
        <button onClick={() => setMobileNav(!mobileNav)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#475569" }}>☰</button>
      </div>
      <style>{`@media(max-width:768px){.mobile-header{display:flex!important}.sidebar{transform:translateX(${mobileNav?'0':'-100%'})!important;position:fixed!important;z-index:99!important;box-shadow:4px 0 20px rgba(0,0,0,0.1)!important}.main-content{margin-left:0!important;padding-top:60px!important}.sidebar-overlay{display:${mobileNav?'block':'none'}!important}}`}</style>
      <div className="sidebar-overlay" onClick={() => setMobileNav(false)} style={{ display: "none", position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 98 }} />
      <div className="sidebar" style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 240, background: "#fff", borderRight: "1px solid #f0f0f5", padding: "20px 12px", overflowY: "auto", transition: "transform 0.3s ease", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "0 8px 20px", borderBottom: "1px solid #f0f0f5", marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", letterSpacing: -0.5 }}>自己分析</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>ワークブック</div>
        </div>
        <ProgressBar data={data} />
        <SaveStatus status={saveStatus} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 14, flex: 1 }}>
          {SECTIONS.map(section => (
            <NavItem key={section.id} section={section} active={active === section.id} onClick={() => { setActive(section.id); setMobileNav(false); }} />
          ))}
        </div>
        <div style={{ borderTop: "1px solid #f0f0f5", paddingTop: 12, marginTop: 12 }}>
          {userEmail && <div style={{ fontSize: 11, color: "#94a3b8", padding: "0 8px 8px", wordBreak: "break-all" }}>{userEmail}</div>}
          <button onClick={logout} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
            ログアウト
          </button>
        </div>
      </div>
      <div className="main-content" style={{ marginLeft: 240, padding: "32px 40px", maxWidth: 860, minHeight: "100vh" }}>
        {renderPage()}
      </div>
    </div>
  );
}
