import { Button } from "@/components/ui/button"
import { NavLink } from "react-router-dom"

function ErrorPage() {
    return (
        <div className="flex justify-center items-center h-screen ">
            <div className="text-center space-y-6">
                <div>
                    <h3 className="text-7xl text-primary">404</h3>
                    <p className="text-lg">
                        Oops, it looks like the page you're looking for doesn't exist.
                    </p>
                </div>
                <Button asChild={true}>
                    <NavLink to={'/'}>
                        Go To Homepage
                    </NavLink>
                </Button>
            </div>
        </div>
    )
}

export default ErrorPage
