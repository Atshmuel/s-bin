import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import AccountHeader from "./AccountHeader"
import { SECTION_CLICK_HOLD_MS, SECTION_LINE_OFFSET_PX, SECTION_LINE_SLIDE_SHARE } from "@/utils/constants"

// The element that scrolls the page: the nearest scrolling ancestor, or the
// document itself.
function scrollerOf(element) {
    for (let node = element?.parentElement; node; node = node.parentElement) {
        const { overflowY } = getComputedStyle(node)
        if (/(auto|scroll)/.test(overflowY) && node.scrollHeight > node.clientHeight) return node
    }
    return document.scrollingElement
}

// The section being read: the last whose top passed the reading line. The
// line sits near the top of the screen and, over the last stretch of
// scrolling, slides down to the bottom, so the short sections at the end are
// each marked in turn and the last one exactly at the bottom.
function sectionBeingRead(ids) {
    const elements = ids.map(id => document.getElementById(id))
    if (!elements[0]) return null
    const scroller = scrollerOf(elements[0])
    if (scroller.scrollHeight <= scroller.clientHeight + 1) return null // nothing to scroll
    const isDocument = scroller === document.scrollingElement
    const viewTop = isDocument ? 0 : scroller.getBoundingClientRect().top
    const viewHeight = isDocument ? window.innerHeight : scroller.clientHeight
    const remaining = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight
    const slide = viewHeight * SECTION_LINE_SLIDE_SHARE
    const top = viewTop + SECTION_LINE_OFFSET_PX
    const bottom = viewTop + viewHeight - 1
    const line = remaining >= slide ? top : top + (bottom - top) * (1 - remaining / slide)
    let current = ids[0]
    elements.forEach((element, i) => {
        if (element && element.getBoundingClientRect().top <= line) current = ids[i]
    })
    return current
}

// The account page: whose account it is, then its sections in one column,
// with a list of them on the side on wide screens that marks the section
// being read. Each section is { id, element }; its name comes from
// components.accountPage.nav.<id>.
function AccountLayout({ user, isSelf, sections }) {
    const { t } = useTranslation()
    const idsKey = sections.map(section => section.id).join(",")
    const [activeId, setActiveId] = useState(sections[0]?.id)
    const heldUntil = useRef(0)

    useEffect(() => {
        const ids = idsKey.split(",")
        let frame = 0
        const update = () => {
            frame = 0
            if (Date.now() < heldUntil.current) return
            const current = sectionBeingRead(ids)
            if (current) setActiveId(current)
        }
        const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
        // Capture: the page may scroll inside an element, not the window.
        window.addEventListener("scroll", onScroll, { capture: true, passive: true })
        window.addEventListener("resize", onScroll, { passive: true })
        update()
        return () => {
            window.removeEventListener("scroll", onScroll, { capture: true })
            window.removeEventListener("resize", onScroll)
            cancelAnimationFrame(frame)
        }
    }, [idsKey])

    function goTo(sectionId) {
        setActiveId(sectionId)
        heldUntil.current = Date.now() + SECTION_CLICK_HOLD_MS
        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-1 py-2 lg:flex-row lg:items-start">
            <nav aria-label={t("components.accountPage.nav.label")} className="hidden w-44 shrink-0 lg:sticky lg:top-16 lg:block">
                <ul className="flex flex-col gap-1">
                    {sections.map(section => {
                        const isActive = section.id === activeId
                        return (
                            <li key={section.id}>
                                <button type="button" onClick={() => goTo(section.id)} aria-current={isActive ? "true" : undefined}
                                    className={`w-full cursor-pointer rounded-md border-s-2 px-3 py-2 text-start text-sm transition-colors hover:bg-muted
                                        ${isActive ? "border-primary bg-muted font-medium" : "border-transparent text-muted-foreground"}
                                        ${section.id === "danger" ? "text-destructive" : ""}`}>
                                    {t(`components.accountPage.nav.${section.id}`)}
                                </button>
                            </li>
                        )
                    })}
                </ul>
            </nav>
            <div className="flex min-w-0 max-w-3xl flex-1 flex-col gap-6">
                <AccountHeader user={user} isSelf={isSelf} />
                {sections.map(section => <div key={section.id}>{section.element}</div>)}
            </div>
        </div>
    )
}

export default AccountLayout
