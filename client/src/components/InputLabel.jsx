import { useId } from "react";
import { Input } from "./ui/input"
import { Label } from "./ui/label"

function InputLabel({ children, variant = 'float', ...props }) {
    const id = useId();

    return (
        variant === 'float' ?
            <div className="relative">
                <Input
                    id={id}
                    placeholder=" "
                    className="peer h-12 pt-5"
                    autoComplete={props.autoComplete}
                    value={props.value ?? ""}
                    onChange={props.onChange}
                    name={props.name}
                    type={props.type}
                />
                <Label
                    htmlFor={id}
                    className="absolute left-3 top-0.5 text-sm text-muted-foreground transition-all      peer-placeholder-shown:top-2.5    peer-placeholder-shown:text-base       peer-placeholder-shown:text-gray-400       peer-focus:top-0.5       peer-focus:text-xs       peer-focus:text-primary"
                    {...props}
                >{children}</Label>
            </div>
            :
            <div className="flex gap-2 flex-col">
                <Label htmlFor={id} {...props}>{children}</Label>
                <Input id={id} {...props} />
            </div>
    )

}

export default InputLabel
