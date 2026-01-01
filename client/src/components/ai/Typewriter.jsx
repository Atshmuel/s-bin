import { useState, useEffect } from 'react';

export const Typewriter = ({ text, speed = 30, className = "" }) => {
    const [displayedText, setDisplayedText] = useState("");

    useEffect(() => {
        setDisplayedText("");

        if (!text) return;

        const words = text.split(" ");
        let index = 0;

        const intervalId = setInterval(() => {
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

        return () => clearInterval(intervalId);
    }, [text, speed]);

    return <span className={className}>{displayedText}</span>;
};