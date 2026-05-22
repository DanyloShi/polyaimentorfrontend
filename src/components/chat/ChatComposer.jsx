import { SendHorizontal } from "lucide-react";
import { useRef, useState } from "react";

const MAX_TEXTAREA_HEIGHT = 104;
const MIN_TEXTAREA_HEIGHT = 48;

export default function ChatComposer({ disabled, submitDisabled, onSendMessage }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  const resizeTextarea = (nextValue) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = `${MIN_TEXTAREA_HEIGHT}px`;

    if (!nextValue.trim()) {
      textarea.style.overflowY = "hidden";
      return;
    }

    const nextHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT);
    textarea.style.height = `${Math.max(nextHeight, MIN_TEXTAREA_HEIGHT)}px`;
    textarea.style.overflowY = textarea.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
  };

  const submitMessage = async () => {
    const message = value.trim();
    if (!message || disabled || submitDisabled) return;

    setValue("");
    requestAnimationFrame(() => resizeTextarea(""));

    const ok = await onSendMessage(message);

    if (!ok) {
      setValue(message);
      requestAnimationFrame(() => resizeTextarea(message));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await submitMessage();
  };

  const handleChange = (event) => {
    const nextValue = event.target.value;
    setValue(nextValue);
    resizeTextarea(nextValue);
  };

  const handleKeyDown = async (event) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    await submitMessage();
  };

  return (
    <form className="chat-composer" onSubmit={handleSubmit}>
      <div className="chat-composer__field">
        <textarea
          ref={textareaRef}
          aria-label="Повідомлення"
          disabled={disabled}
          placeholder="Напишіть своє запитання..."
          rows={1}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
      </div>

      <button className="button button--send" type="submit" disabled={disabled || submitDisabled || !value.trim()}>
        <SendHorizontal size={18} />
        Надіслати
      </button>
    </form>
  );
}