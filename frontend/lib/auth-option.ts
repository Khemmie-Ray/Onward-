import type { NextAuthOptions } from "next-auth";
import credentialsProvider from "next-auth/providers/credentials";
import { SiweMessage } from "siwe";

declare module "next-auth" {
  interface Session {
    address: string;
    chainId: number;
  }
}

const nextAuthSecret = process.env.NEXTAUTH_SECRET;
if (!nextAuthSecret) {
  throw new Error("NEXTAUTH_SECRET is not set");
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

          const siwe = new SiweMessage(credentials.message);
          const result = await siwe.verify({
            signature: credentials.signature || "",
          });

          if (result.success) {
            return {
              id: `${result.data.chainId}:${result.data.address}`,
            };
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
      const [chainId, address] = token.sub.split(":");
      if (chainId && address) {
        session.address = address;
        session.chainId = parseInt(chainId, 10);
      }
      return session;
    },
  },
};
