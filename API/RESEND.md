# Resend (transactional email)

**Docs:** https://resend.com/docs/send-with-nodejs  
**API keys:** https://resend.com/api-keys  
**Domains:** https://resend.com/domains — verify the domain used in `EMAIL_FROM`

## Keys

| Name | Env var | Example |
|---|---|---|
| API key | `RESEND_API_KEY` | `re_xxxxxxxx` |
| From address | `EMAIL_FROM` | `TripHub <booking@yourdomain.com>` |

On localhost without a verified domain, Resend only delivers to the account owner’s email. For Railway, verify a domain first.

## Endpoint

| Method | URL | Purpose |
|---|---|---|
| POST | `https://api.resend.com/emails` | Send itinerary (via SDK) |

## Code

- Sender: `lib/email.ts` — `TODO: Put your Resend API key`
- App wrapper: `POST /api/email/send-confirmation`
- Also triggered from `POST /api/booking/create` after a successful book
