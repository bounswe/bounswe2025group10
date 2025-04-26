const BASE_URL = "http://134.209.253.215:8000/";

export async function signup(email, username, password) {
  const response = await fetch(`${BASE_URL}signup/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password }),
  });
  return response.json();
}

export async function login(email, password) {
  const response = await fetch(`${BASE_URL}login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

export async function status() {
  const response = await fetch(`${BASE_URL}status/`);
  return response.json();
}

export async function getMe(token) {
  const response = await fetch(`${BASE_URL}me/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}
