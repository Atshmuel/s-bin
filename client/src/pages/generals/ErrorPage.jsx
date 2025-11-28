import { Button } from "@/components/ui/button"
import { NavLink } from "react-router-dom"

function ErrorPage({
    code = 404,
    description = "Oops, it looks like the page you're looking for doesn't exist.",
    buttonText = "Go To Homepage",
    navTo = "/"
}) {
    return (
        <div className="flex justify-center items-center h-screen ">
            <div className="text-center space-y-6">
                <div>
                    <h3 className="text-7xl text-primary">{code}</h3>
                    <p className="text-lg">
                        {description}
                    </p>
                </div>
                <Button asChild={true}>
                    <NavLink to={navTo}>
                        {buttonText}
                    </NavLink>
                </Button>
            </div>
        </div>
    )
}

export default ErrorPage
