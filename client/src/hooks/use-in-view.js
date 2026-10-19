import { useEffect, useState } from "react"

// Whether an element has come near the viewport (and stays true once it has),
// so a card below the fold loads only when it is scrolled to. Returns a
// callback ref for the element.
export function useInView(rootMargin = "200px") {
    const [node, setNode] = useState(null)
    const [inView, setInView] = useState(() => typeof IntersectionObserver === "undefined")

    useEffect(() => {
        if (!node || inView) return
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) setInView(true)
        }, { rootMargin })
        observer.observe(node)
        return () => observer.disconnect()
    }, [node, inView, rootMargin])

    return [setNode, inView]
}
