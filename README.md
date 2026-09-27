# WhatsApp AI Agent

## Meta WhatsApp Cloud API setup

1. Copy `.env.example` to `.env.local` and set the Supabase, OpenRouter, and Meta WhatsApp values.
2. In Meta for Developers, configure the WhatsApp product webhook callback URL as:
   `https://<your-deployment-domain>/api/webhook`
3. Set the webhook verify token to the same value as `WHATSAPP_VERIFY_TOKEN`, then subscribe the WhatsApp Business Account to the `messages` field.
4. Set `WHATSAPP_ACCESS_TOKEN` to a Meta access token with permission to send WhatsApp messages, and set `WHATSAPP_PHONE_NUMBER_ID` to the sending phone number's ID.

The webhook handles Meta's JSON verification and message payloads, stores incoming and outgoing messages in Supabase, generates agent replies through OpenRouter, and sends replies through the Meta Graph API.