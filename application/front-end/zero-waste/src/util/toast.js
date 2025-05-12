// src/util/toast.js
import { toast } from "react-toastify";

// toast helper with per‑toast timeout
export function showToast(
    message,
    type = "info",
    timeout = 5000        // ms ‑‑ default matches <ToastContainer autoClose>
) {
    const map = {
        info: "info",
        success: "success",
        warning: "warn",
        error: "error",     // a.k.a. "danger"
    };

    toast[map[type] ?? "info"](message, {
        autoClose: timeout,
    });
}
