/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, cleanup } from "@testing-library/react";
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";

/* ─── react‑toastify mock ─── */
vi.mock("react-toastify", () => {
  const toast = {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  };
  return { toast };
});

import { toast } from "react-toastify";
import Alert from "../../components/Alert.jsx"; // adjust path if needed

beforeEach(() => {
  // clear history for every spy before each test
  Object.values(toast).forEach((fn) => fn.mockClear && fn.mockClear());
});
afterEach(() => cleanup());

describe("<Alert /> (toast adapter)", () => {
  it("fires the success variant with the given message", () => {
    render(<Alert message="Hello!" type="success" />);
    expect(toast.success).toHaveBeenCalledWith("Hello!", expect.any(Object));
    expect(toast.info).not.toHaveBeenCalled();
  });

  it("forwards onClose via toast options", () => {
    const handleClose = vi.fn();
    render(<Alert message="Dismiss me" onClose={handleClose} />); // default type="info"
    const [, opts] = toast.info.mock.calls[0]; // [msg, opts]
    expect(opts.onClose).toBe(handleClose);
  });
});
