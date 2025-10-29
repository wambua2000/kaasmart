type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `https://ubqnwfkzshalroypoucb.supabase.co/functions/v1/chat`;

export async function streamChat({
  role,
  userId,
  messages,
  onDelta,
  onDone,
  onError,
}: {
  role: 'owner' | 'manager' | 'tenant';
  userId: string;
  messages: Msg[];
  onDelta: (deltaText: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVicW53Zmt6c2hhbHJveXBvdWNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NjgyNDksImV4cCI6MjA3NDQ0NDI0OX0.05yTLNYTOLfHCX3xyfyU7CByDg390JTQ_j5S7bcNI3M`,
      },
      body: JSON.stringify({ role, userId, messages }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({ error: "Network error" }));
      
      if (resp.status === 429) {
        onError("Too many requests. Please wait a moment and try again.");
        return;
      }
      if (resp.status === 402) {
        onError("AI usage limit reached. Please add credits to continue.");
        return;
      }
      
      onError(errorData.error || "Connection error. Please try again.");
      return;
    }

    if (!resp.body) {
      onError("No response from server");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { /* ignore partial leftovers */ }
      }
    }

    onDone();
  } catch (err) {
    console.error("Stream error:", err);
    onError(err instanceof Error ? err.message : "Unknown error occurred");
  }
}

export function formatRoleColor(role: 'owner' | 'manager' | 'tenant'): string {
  const colors = {
    owner: 'hsl(var(--primary))',
    manager: 'hsl(142 76% 36%)',
    tenant: 'hsl(262 83% 58%)',
  };
  return colors[role];
}

export function getRoleIcon(role: 'owner' | 'manager' | 'tenant'): string {
  const icons = {
    owner: '👑',
    manager: '💼',
    tenant: '🏠',
  };
  return icons[role];
}

export function getRoleTitle(role: 'owner' | 'manager' | 'tenant'): string {
  const titles = {
    owner: 'Property Owner Assistant',
    manager: 'Manager Helper',
    tenant: 'Tenant Support',
  };
  return titles[role];
}
