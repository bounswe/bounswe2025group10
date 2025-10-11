export function toBoolean(str) {
  if (typeof str !== "string") return Boolean(str);        // already a non‑string
  switch (str.trim().toLowerCase()) {
    case "true":
    case "1":
    case "yes":
    case "y":
      return true;

    case "false":
    case "0":
    case "no":
    case "n":
    case "":
      return false;

    default:
      return false;
  }
}

