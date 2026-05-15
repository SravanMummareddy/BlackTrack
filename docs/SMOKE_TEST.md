# Manual Smoke Test

Run this after a deploy or before tagging a release. Expected time: ~5 minutes.

## Prerequisites

- `bun install` && `bun run prisma migrate deploy && bun run seed` against a clean DB
- App started via `bun run dev` (or production build) — base URL `http://localhost:3000`
- Browser open to `/`

## Walkthrough

1. **Auth shell** — Register a new user. Confirm dashboard renders without errors.
2. **Budget ring** — Set a monthly budget ($500). Confirm the dashboard ring shows `0% used`, `days left`, and `net P/L $0`.
3. **Session create with limits** — Start a session with `Loss Limit $100` and `Time Limit 60 min`. Confirm it lands on the session workspace and the dashboard "Current Focus" card shows a "Limit tracking active" reflection banner.
4. **Hand logging** — Log 3 hands (mix WIN/LOSS). Confirm `Live P/L` updates and the reflection banner moves toward the limit.
5. **Limit hit** — Log losing hands until net loss ≥ $100. Confirm banner flips to the danger state with "Limit reached — pause and reflect".
6. **Complete session** — Close the session with cash-out + ending mood. Confirm it appears in the sessions list with the recorded mood.
7. **Mood × Result widget** — Reload dashboard. Confirm the "Mood × Result" card lists a bucket for the starting mood and a non-zero session count. Toggle to "End" and confirm the ending mood bucket appears.
8. **Trainer flow** — Switch to the trainer tab. Submit one correct and one incorrect attempt. Confirm streak/accuracy update on the snapshot.
9. **Responsible-play break** — Open Profile → "Responsible Play Break". Click "24 hours". Confirm `breakUntil` shows a date 1 day out and the card flips to the active state.
10. **Break enforcement** — Try to create a new session. Confirm a `403` notice surfaces and the modal does not create.
11. **Clear break** — Click "Clear break". Confirm the card returns to inactive and session creation works again.
12. **Account lifecycle** — Change password, export JSON (file downloads), then sign out and sign back in with the new password.

## Pass criteria

- No console errors during the walkthrough
- `bun test` green: `bun test` reports 0 failures
- API logs show only expected `4xx` warnings (validation/forbidden), no unhandled errors

If anything diverges, capture screenshots and file under `.shared/context/`.
