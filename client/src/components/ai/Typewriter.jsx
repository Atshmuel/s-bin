import { useState, useEffect } from 'react';

export const Typewriter = ({ text, speed = 30, timeOut = 0, className = "" }) => {
    const [displayedText, setDisplayedText] = useState("");

    useEffect(() => {
        setDisplayedText("");

        if (!text) return;

        let intervalId = null;

        const timeoutId = setTimeout(() => {
            const words = text.split(" ");
            let index = 0;

            intervalId = setInterval(() => {
                if (index < words.length) {
                    const nextWord = words[index];

                    if (nextWord !== undefined) {
                        setDisplayedText((prev) =>
                            prev + (index === 0 ? "" : " ") + nextWord
                        );
                    }
                    index++;
                } else {
                    clearInterval(intervalId);
                }
            }, speed);

        }, timeOut);

        return () => {
            clearTimeout(timeoutId);
            if (intervalId) clearInterval(intervalId);
        };
    }, [text, speed, timeOut]);

    return <span className={className}>{displayedText}</span>;
};