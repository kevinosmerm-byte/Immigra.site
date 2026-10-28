import { createContext, useContext } from "react";
export const ProgressGateContext = createContext({ runTransition: (_progress, proceed) => proceed() });
export const useProgressGate = () => useContext(ProgressGateContext);
