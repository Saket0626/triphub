# Resend (transactional email)

**Docs:** https://resend.com/docs/send-with-nodejs  
**API keys:** https://resend.com/api-keys  
**Domains:** https://resend.com/domains — verify the domain used in `EMAIL_FROM`

## Keys

| Name | Env var | Example |
|---|---|---|
| API key | `RESEND_API_KEY` | `re_xxxxxxxx` |
| From address | `EMAIL_FROM` | `TripHub <booking@yourdomain.com>` |

TripHub uses a **sending-only** Resend key (free tier). `recruiter.solutions` is **not** verified on this account, so the from-address is:

`EMAIL_FROM=TripHub <onboarding@resend.dev>`

That onboarding sender is free and only delivers to the Resend account owner (`saket.amanana@gmail.com`). Do not upgrade the plan. To send to other inboxes later, add DNS for a domain you already own at https://resend.com/domains (verification is free; buying a domain is not).

The key cannot list domains or create new keys — send-only is the right restriction.

## Endpoint

| Method | URL | Purpose |
|---|---|---|
| POST | `https://api.resend.com/emails` | Send itinerary (via SDK) |

## Code

- Sender: `lib/email.ts` — `TODO: Put your Resend API key`
- App wrapper: `POST /api/email/send-confirmation`
- Also triggered from `POST /api/booking/create` after a successful book
