# Anthropic Claude — destination research

Layer B of hotel/activity discovery. Claude searches the live web and returns deals, events, and local favorites with source URLs.

**Keys:** https://console.anthropic.com/settings/keys  
**Docs (web search tool):** https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool  
**Env:** `ANTHROPIC_API_KEY` (starts with `sk-ant-`)

## What we call

`POST https://api.anthropic.com/v1/messages`

- Model: `claude-sonnet-4-6`
- Tool: `{ type: "web_search_20250305", name: "web_search" }`
- Prompt requires a `sourceUrl` on every specific claim

Code: `lib/research.ts`  
Route: `POST /api/research/destination`  
Cache table: `destination_research_cache` (24 hours, keyed by destination + dates + purpose)

While `SANDBOX_MODE=true` or the key is missing, we return realistic mock research so the UI (Live insight badges + Worth knowing panel) still works.
