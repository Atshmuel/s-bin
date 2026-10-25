import { useEffect, useState } from "react";

// The value once it has stayed the same for `delayMs` (a slider dragged, a
// field typed into), so a request follows the settled value, not each step.
export function useDebouncedValue(value, delayMs) {
    const [settled, setSettled] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setSettled(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);
    return settled;
}
