"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Critical Application Error:", error)
  }, [error])

  return (
    <html lang="en" dir="ltr">
      <head>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(to bottom right, #f8f9fa, #e9ecef);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
          }
          .container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            padding: 32px;
            max-width: 512px;
            width: 100%;
            text-align: center;
          }
          h1 {
            font-size: 28px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 12px;
          }
          p {
            font-size: 16px;
            color: #6b7280;
            line-height: 1.5;
            margin-bottom: 24px;
          }
          .button-group {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          button {
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            width: 100%;
          }
          .primary-btn {
            background: #725CAD;
            color: white;
          }
          .primary-btn:hover {
            background: #5e4d8f;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(114, 92, 173, 0.3);
          }
          .secondary-btn {
            background: white;
            color: #4b5563;
            border: 2px solid #e5e7eb;
          }
          .secondary-btn:hover {
            background: #f9fafb;
            border-color: #d1d5db;
          }
          details {
            margin-top: 16px;
            text-align: left;
          }
          summary {
            cursor: pointer;
            font-size: 14px;
            color: #9ca3af;
          }
          pre {
            margin-top: 8px;
            padding: 12px;
            background: #f3f4f6;
            border-radius: 6px;
            font-size: 11px;
            overflow: auto;
            color: #374151;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <h1>Critical System Error</h1>
          <p>
            The application has encountered a critical error and cannot continue.
          </p>

          <div className="button-group">
            <button onClick={reset} className="primary-btn">
              Try to Recover
            </button>
            <button 
              onClick={() => window.location.href = "/"} 
              className="secondary-btn"
            >
              Return Home
            </button>
          </div>

          {process.env.NODE_ENV === "development" && error.message && (
            <details>
              <summary>Developer Details</summary>
              <pre>
{error.message}
{error.stack}
              </pre>
            </details>
          )}
        </div>
      </body>
    </html>
  )
}