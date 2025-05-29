export async function fetchStreamToken(userId) {
  const res = await fetch("http://localhost:8081/api/stream/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error("Không lấy được token video call");
  const data = await res.json();
  return data.token;
}