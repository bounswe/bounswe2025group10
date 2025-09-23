import React from "react";
import PropTypes from "prop-types";
import { useEffect } from "react";
import { toast } from "react-toastify";

/**
 * Bootstrap-based Alert component to display messages. Deprecated in favor of react-toastify.
 *
 * Props:
 * - message: The text to display inside the alert.
 * - type: "info" | "success" | "warning" | "danger" (default: "info").
 * - onClose: Optional callback to dismiss the alert.
 * Deprecated: This component is now a wrapper around react-toastify.
const Alert = ({ message, type = "info", onClose }) => (
  <div
    className={`alert alert-${type} alert-dismissible fade show`}
    role="alert"
  >
    {message}
    {onClose && (
      <button
        type="button"
        className="btn-close"
        aria-label="Close"
        onClick={onClose}
      />
    )}
  </div>
);
 */


/**
 * Toast‑based Alert (API‑compatible with the old Bootstrap alert).
 *
 * Props:
 * – message  : string  (required)
 * – type     : "info" | "success" | "warning" | "danger"   (default "info")
 * – onClose  : function (optional) — called after toast closes
 */
const Alert = ({ message, type = "info", onClose }) => {
  useEffect(() => {
    // map Bootstrap‑style names to react‑toastify’s variants
    const variantMap = {
      info: "info",
      success: "success",
      warning: "warning",
      danger: "error",
    };
    const id = toast[variantMap[type]](message, {
      onClose,
    });

    // optional: clean‑up if the component unmounts before autoClose
    return () => toast.dismiss(id);
  }, [message, type, onClose]);

  // Render nothing — the toast is handled globally
  return null;
};

Alert.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["info", "success", "warning", "danger"]),
  onClose: PropTypes.func,
};

export default Alert;

