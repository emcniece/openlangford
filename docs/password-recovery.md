# Password recovery

Flow: `/login` ("Forgot password?") → `/forgot-password` (email form) → Supabase
emails a recovery link → `/auth/callback?code=…&next=/reset-password` exchanges
the code for a session (PKCE, `exchangeCodeForSession`; `token_hash` links with
`type=recovery` also work via `verifyOtp`) → `/reset-password` calls
`auth.updateUser({ password })` → `/settings`.

- The form answers the same whether or not the email has an account, so it
  can't be used to discover accounts. Same-origin check and the
  `SIGNUP_RATE_LIMITER` binding (key `recover:<ip>`, fails closed) guard it.
- PKCE stores its verifier in a cookie, so the link must be opened in the
  browser that asked for it. A link opened elsewhere lands on
  `/forgot-password?expired=1`. To lift that limit, change the Supabase
  "Reset password" email template link to
  `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`.
- Password rules match signup (6 to 1024 characters).

## Supabase settings (dashboard, not migrations)

Authentication → URL Configuration: add `https://openlangford.ca/auth/callback`
(and any preview/local origin) to **Redirect URLs**, or Supabase falls back to
the Site URL and the link won't reach the callback. Locally, add
`http://localhost:5173/auth/callback` to `additional_redirect_urls` in
`supabase/config.toml`.
