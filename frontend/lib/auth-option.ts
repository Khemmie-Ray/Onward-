import type { NextAuthOptions } from "next-auth";
import credentialsProvider from "next-auth/providers/credentials";
import {
  type SIWESession,
  verifySignature,
  getChainIdFromMessage,
  getAddressFromMessage,
} from "@reown/appkit-siwe";

declare module "next-auth" {
  interface Session extends SIWESession {
    address: string;
    chainId: number;
  }
}

const nextAuthSecret = process.env.NEXTAUTH_SECRET;
if (!nextAuthSecret) {
  throw new Error("NEXTAUTH_SECRET is not set");
}

const projectId = process.env.NEXT_PUBLIC_PROJECTID;
if (!projectId) {
  throw new Error("NEXT_PUBLIC_PROJECTID is not set");
}

export const authOptions: NextAuthOptions = {
  secret: nextAuthSecret,
  session: { strategy: "jwt" },
  providers: [
    credentialsProvider({
      name: "Ethereum",
      credentials: {
        message: { label: "Message", type: "text", placeholder: "0x0" },
        signature: { label: "Signature", type: "text", placeholder: "0x0" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.message) {
            throw new Error("SiweMessage is undefined");
          }
          const { message, signature } = credentials;
          const address = getAddressFromMessage(message);
          const chainId = getChainIdFromMessage(message);

          const isValid = await verifySignature({
            address,
            message,
            signature,
            chainId,
            projectId,
          });

          if (isValid) {
            return { id: `${chainId}:${address}` };
          }
          return null;
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
  session({ session, token }) {
    if (!token.sub) return session;
    const [, chainId, address] = token.sub.split(":");
    if (chainId && address) {
      session.address = address;
      session.chainId = parseInt(chainId, 10);
    }
    return session;
  },
},
};