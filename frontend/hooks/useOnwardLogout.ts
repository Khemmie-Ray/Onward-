import { resetSiweGate } from "@/contexts/SiweGate";
import { signOut } from "next-auth/react";
import { useWeb3AuthDisconnect } from "@web3auth/modal/react";
import { useCallback } from "react";

export function useOnwardLogout() {
  const { disconnect } = useWeb3AuthDisconnect();
  return useCallback(async () => {
    try { await disconnect({ cleanup: true }); } catch (e) { console.error(e); }
    resetSiweGate();
    await signOut({ redirect: false });
    window.location.assign("/");
  }, [disconnect]);
}