import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

function normalizeMath(text) {
  return String(text || "")
    .replace(/\\\[((?:.|\n)*?)\\\]/g, (_, expr) => `$$\n${expr.trim()}\n$$`)
    .replace(/\\\(((?:.|\n)*?)\\\)/g, (_, expr) => `$${expr.trim()}$`);
}

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <article
      className={`message-bubble message-bubble--enter ${
        isUser ? "message-bubble--user" : "message-bubble--assistant"
      }`}
    >
      <div className="message-bubble__content">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {normalizeMath(message.content)}
        </ReactMarkdown>
      </div>
    </article>
  );
}