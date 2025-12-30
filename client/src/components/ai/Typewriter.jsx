import { useState, useEffect } from 'react';

export const Typewriter = ({ text, speed = 30, className = "" }) => {
    const [displayedText, setDisplayedText] = useState("");

    useEffect(() => {
        // Reset text if the prop changes
        setDisplayedText("");

        // Safety check
        if (!text) return;

        const words = text.split(" ");
        let index = 0;

        const intervalId = setInterval(() => {
            if (index < words.length) {
                // Append next word with a space (unless it's the first word)
                setDisplayedText((prev) => prev + (index === 0 ? "" : " ") + words[index]);
                index++;
            } else {
                clearInterval(intervalId);
            }
        }, speed);

        return () => clearInterval(intervalId);
    }, [text, speed]);

    return <p className={className}>{displayedText}</p>;
};