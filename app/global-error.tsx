"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <html lang="zh-CN">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: 32,
          background: "#faf9f5",
          color: "#3d3d3a",
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div
          style={{
            background: "#efe9de",
            border: "1px solid #e6dfd8",
            borderRadius: 12,
            padding: 48,
            maxWidth: 520,
            width: "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              color: "#8e8b82",
              fontWeight: 500,
              marginBottom: 12,
            }}
          >
            出了点小问题
          </div>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Garamond, serif",
              fontSize: 32,
              fontWeight: 400,
              color: "#141413",
              letterSpacing: "-0.5px",
              lineHeight: 1.15,
              margin: "0 0 16px",
            }}
          >
            应用遇到错误
          </h1>
          <p style={{ fontSize: 15, color: "#3d3d3a", lineHeight: 1.55, margin: "0 0 24px" }}>
            请稍后再试。如果问题仍然存在，请刷新页面。
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            style={{
              padding: "12px 20px",
              background: "#cc785c",
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              fontWeight: 500,
              fontSize: 14,
              lineHeight: 1,
              height: 40,
              cursor: "pointer",
            }}
          >
            重试
          </button>
          {error?.digest ? (
            <div
              style={{
                marginTop: 24,
                fontSize: 12,
                color: "#8e8b82",
                fontFamily: "JetBrains Mono, ui-monospace, monospace",
                wordBreak: "break-all",
              }}
            >
              错误编号：{error.digest}
            </div>
          ) : null}
        </div>
      </body>
    </html>
  );
}
