import { redirect } from "react-router";
import type { EmailOtpType } from "@supabase/supabase-js";
import type { Route } from "./+types/auth.callback";
import { createSupabaseServerClient } from "../lib/supabase.server";
import { safeRedirect } from "../lib/safe-redirect";

/**
 * Landing page for links in Supabase auth emails (password recovery today).
 * Handles both the PKCE `code` (default; needs the browser that asked for the
 * email) and a `token_hash` link (if the email template is switched to it).
 */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const next = safeRedirect(url.searchParams.get("next"), "/");
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  const { supabase, headers } = createSupabaseServerClient(request);

  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type === "recovery") {
    ok = !(await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    })).error;
  }

  if (!ok) return redirect("/forgot-password?expired=1", { headers });
  return redirect(next, { headers });
}
