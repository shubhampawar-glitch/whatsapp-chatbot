export async function sendWhatsAppMessage(to: string, body: string) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    throw new Error(
      "Meta WhatsApp configuration is missing. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID."
    );
  }

  const response = await fetch(
    `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.replace(/^whatsapp:/, ""),
        type: "text",
        text: { body },
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      `Meta WhatsApp message failed (${response.status}): ${
        result.error?.message || "Unknown error"
      }`
    );
  }

  const messageId = result.messages?.[0]?.id;
  if (!messageId) {
    throw new Error("Meta WhatsApp message response did not include a message ID.");
  }

  return { id: messageId };
}
