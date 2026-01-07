import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { NavLink } from "react-router-dom"

function ErrorPage({
    code = 404,
    description,
    buttonText,
    navTo = "/"
}) {
    const { t } = useTranslation()

    return (
        <div className="flex justify-center items-center h-screen ">
            <div className="text-center space-y-6">
                <div>
                    <h3 className="text-7xl text-primary">{code}</h3>
                    <p className="text-lg">
                        {description ?? t('components.errorPage.description')}
                    </p>
                </div>
                <Button asChild={true}>
                    <NavLink to={navTo}>
                        {buttonText ?? t('components.errorPage.buttonText')}
                    </NavLink>
                </Button>
            </div>
        </div>
    )
}

export default ErrorPage
