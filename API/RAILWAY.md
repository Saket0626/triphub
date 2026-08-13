# Railway

**Live URL:** https://triphub-production-0ce1.up.railway.app

**Dashboard:** https://railway.com  
**Next.js guide:** https://docs.railway.com/guides/nextjs  
**CLI:** https://docs.railway.com/guides/cli

## What this repo is configured to do

- `output: "standalone"` in `next.config.mjs`
- `Dockerfile` binds `HOSTNAME=0.0.0.0` and `PORT` (Railway injects `PORT`)
- `railway.json` uses the Dockerfile and health-checks `GET /api/health`
- Start command inside the image: `node server.js`

## Deploy (CLI)

```bash
# in ~/triphub
npx @railway/cli login
npx @railway/cli init
npx @railway/cli up
npx @railway/cli domain
```

Then set every variable from `API/env.template` on the service → **Variables**. Redeploy after adding any `NEXT_PUBLIC_*` key (they are compile-time).

## Variables Railway injects (do not set yourself)

- `PORT`
- `RAILWAY_ENVIRONMENT`
- `RAILWAY_PUBLIC_DOMAIN` (after you generate a domain)

## Minimum vars to boot in sandbox on Railway

```
SANDBOX_MODE=true
NEXT_PUBLIC_SANDBOX_MODE=true
NODE_ENV=production
```

Trips will not persist across deploys until Supabase keys are set. Add those next (see SUPABASE.md).
