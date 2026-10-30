
const API_BASE_URL = "http://127.0.0.1:8000";

export async function sendMessage(mode, message) {
  const response = await fetch(
    `${API_BASE_URL}/api/${mode}/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail?.[0]?.msg ||
      data.detail ||
      "Unable to get a response from the server."
    );
  }

  return data;
}
