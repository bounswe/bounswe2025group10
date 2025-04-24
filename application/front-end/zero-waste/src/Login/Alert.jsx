import React from "react";
import PropTypes from "prop-types";

/**
 * Bootstrap-based Alert component to display messages.
 *
 * Props:
 * - message: The text to display inside the alert.
 * - type: "info" | "success" | "warning" | "danger" (default: "info").
 * - onClose: Optional callback to dismiss the alert.
 */
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

Alert.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["info", "success", "warning", "danger"]),
  onClose: PropTypes.func,
};

export default Alert;

// Usage example:
//
// import React, { useState } from 'react';
// import Alert from './Alert';
//
// function App() {
//   const [msg, setMsg] = useState('');
//   const [type, setType] = useState('success');
//
//   const showAlert = (message, type = 'info') => {
//     setMsg(message);
//     setType(type);
//     setTimeout(() => setMsg(''), 3000);
//   };
//
//   return (
//     <div className="container mt-4">
//       <button
//         className="btn btn-primary me-2"
//         onClick={() => showAlert('This is an info alert!', 'info')}
//       >
//         Show Info
//       </button>
//       <button
//         className="btn btn-success me-2"
//         onClick={() => showAlert('Success! Operation completed.', 'success')}
//       >
//         Show Success
//       </button>
//       <button
//         className="btn btn-warning me-2"
//         onClick={() => showAlert('Warning! Check your input.', 'warning')}
//       >
//         Show Warning
//       </button>
//       <button
//         className="btn btn-danger"
//         onClick={() => showAlert('Error! Something went wrong.', 'danger')}
//       >
//         Show Error
//       </button>
//
//       {msg && <Alert message={msg} type={type} onClose={() => setMsg('')} />}
//     </div>
//   );
// }
//
// export default App;
