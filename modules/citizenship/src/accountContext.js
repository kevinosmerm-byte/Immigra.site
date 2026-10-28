import { createContext, useContext } from "react";

export const AccountContext = createContext(null);

export function useAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error("useAccount must be used inside AccountProvider");
  return value;
}
