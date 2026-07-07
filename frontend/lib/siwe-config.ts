import { getCsrfToken, signIn, signOut, getSession } from "next-auth/react";
import type {
  SIWEVerifyMessageArgs,
  SIWECreateMessageArgs,
  SIWESession,
} from "@reown/appkit-siwe";
import { createSIWEConfig, formatMessage } from "@reown/appkit-siwe";
import { celo } from "@reown/appkit/networks";

export const siweConfig = createSIWEConfig({
  getMessageParams: async () => ({
    domain: typeof window !== "undefined" ? window.location.host : "",
    uri: typeof window !== "undefined" ? window.location.origin : "",
    chains: [celo.id],
    statement: "Sign in to Onward",
  }),

  createMessage: ({ address, ...args }: SIWECreateMessageArgs) =>
    formatMessage(args, address),

  getNonce: async () => {
    const nonce = await getCsrfToken();
    if (!nonce) throw new Error("Failed to get nonce");
    return nonce;
  },

  getSession: async () => {
    const session = await getSession();
    if (!session) return null;
    if (
      typeof session.address !== "string" ||
      typeof session.chainId !== "number"
    ) {
      return null;
    }
    return {
      address: session.address,
      chainId: session.chainId,
    } satisfies SIWESession;
  },

  verifyMessage: async ({ message, signature }: SIWEVerifyMessageArgs) => {
    try {
      const result = await signIn("credentials", {
        message,
        signature,
        redirect: false,
      });
      return Boolean(result?.ok);
    } catch {
      return false;
    }
  },

  signOut: async () => {
    try {
      await signOut({ redirect: false });
      return true;
    } catch {
      return false;
    }
  },

  onSignIn: () => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      const isPublic = path === "/" || path === "/leaderboard";
      if (isPublic) {
        window.location.assign("/overview");
      }
    }
  },

  onSignOut: () => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      const isPublic = path === "/" || path === "/leaderboard";
      if (!isPublic) {
        window.location.assign("/");
      }
    }
  },

  signOutOnNetworkChange: false,
  signOutOnAccountChange: true,
  signOutOnDisconnect: true,
});
