import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import { nextCookies } from "better-auth/next-js";

export const { signIn, signUp, signOut, useSession, emailOtp } =
  createAuthClient({
    plugins: [emailOTPClient(), nextCookies()],
  });
