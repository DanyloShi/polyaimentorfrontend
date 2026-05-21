import { X } from "lucide-react";
import { buildGoogleLoginUrl } from "../../services/session.js";

export default function LoginModal({ open, onClose }) {
  if (!open) return null;

  const handleGoogleLogin = () => {
    window.location.href = buildGoogleLoginUrl();
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="login-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button login-modal__close" type="button" aria-label="Close login modal" onClick={onClose}>
          <X size={18} />
        </button>
        <h2>Sign In</h2>
        <p>Sign in with Google to view assistants and continue working with your account.</p>
        <button className="google-button" type="button" onClick={handleGoogleLogin}>
          <span className="google-button__mark">G</span>
          Continue with Google
        </button>
      </section>
    </div>
  );
}
