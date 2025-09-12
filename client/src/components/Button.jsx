
export default function Button({ isOutline = false, disignType = "primary", type = "button", icon, onClick, className, children }) {
    const primaryStyle = ""
    const warningStyle = ""
    const disabledStyle = ""


    return (
        <button type={type} className={`${className} ${isOutline ? "bg-red-700" : ""} ${disignType === "primary" ? primaryStyle : disignType === "warning" ? warningStyle : disabledStyle}`} onClick={onClick} >
            {icon ? <span>{icon}</span> : null}
            {children}
        </button >)
}