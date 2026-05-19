export const metadata = {
  title: "自己分析ワークブック",
  description: "就活向け自己分析ワークブック",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, fontFamily: "'Noto Sans JP', 'Helvetica Neue', sans-serif", background: "#f8f9fb" }}>
        {children}
      </body>
    </html>
  );
}
