import { useContext } from "react";
import { AppSideContext } from "@/contexts/appSideContext";

export function useAppSide() {
    const context = useContext(AppSideContext);
    if (context === undefined) throw new Error('AppSideContext was used outside of the provider')
    return context
}
