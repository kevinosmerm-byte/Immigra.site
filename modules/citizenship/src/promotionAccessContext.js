import { createContext, useContext } from "react";

export const PromotionAccessContext = createContext(null);

export function usePromotionAccess() {
  const value = useContext(PromotionAccessContext);
  if (!value) throw new Error("usePromotionAccess must be used inside PromotionAccessProvider");
  return value;
}
