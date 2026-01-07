import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAppSide } from "@/contexts/AppSideProvider"
import { useTranslation } from "react-i18next"

function Terms({ title }) {
    const { t } = useTranslation()
    const { isRight, side } = useAppSide()
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="link">{title || t('components.terms.open_button')}</Button>
            </DialogTrigger>

            <DialogContent side={side} className="max-w-[350px] sm:max-w-[700px] p-10">
                <DialogHeader isRight={isRight} >
                    <DialogTitle>{t('components.terms.title')}</DialogTitle>
                    <DialogDescription>
                        {t('components.terms.description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="overflow-auto max-h-[40vh] text-sm sm:text-base sm:max-h-[60vh] space-y-6">
                    <section>
                        <h3>{t('components.terms.sections.a.title')}</h3>
                        <p>
                            {t('components.terms.sections.a.content')}
                        </p>
                    </section>

                    <section>
                        <h3>{t('components.terms.sections.b.title')}</h3>
                        <p>
                            {t('components.terms.sections.b.content')}
                        </p>
                    </section>

                    <section>
                        <h3>{t('components.terms.sections.c.title')}</h3>
                        <p>
                            {t('components.terms.sections.c.content')}
                        </p>
                    </section>

                    <section>
                        <h3>{t('components.terms.sections.d.title')}</h3>
                        <ul>
                            <li>
                                {t('components.terms.sections.d.list.1')}
                            </li>
                            <li>
                                {t('components.terms.sections.d.list.2')}
                            </li>
                            <li>{t('components.terms.sections.d.list.3')}

                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3>{t('components.terms.sections.e.title')}</h3>
                        <p>{t('components.terms.sections.e.intro')}</p>
                        <ul>
                            <li>{t('components.terms.sections.e.list.1')}</li>
                            <li>{t('components.terms.sections.e.list.2')}</li>
                            <li>{t('components.terms.sections.e.list.3')}</li>
                        </ul>
                    </section>

                    <section>
                        <h3>{t('components.terms.sections.f.title')}</h3>
                        <p>
                            {t('components.terms.sections.f.content')}
                        </p>
                    </section>

                    <section>
                        <h3>{t('components.terms.sections.g.title')}</h3>
                        <p>
                            {t('components.terms.sections.g.content')}
                        </p>
                    </section>

                    <section>
                        <h3>{t('components.terms.sections.h.title')}</h3>
                        <p>
                            {t('components.terms.sections.h.content')}
                        </p>
                    </section>

                    <section>
                        <h3>{t('components.terms.sections.i.title')}</h3>
                        <p>
                            {t('components.terms.sections.i.content')}
                        </p>
                    </section>

                    <section>
                        <h3>{t('components.terms.sections.j.title')}</h3>
                        <p>
                            {t('components.terms.sections.j.content')}
                        </p>
                    </section>

                    <section>
                        <h3>{t('components.terms.sections.k.title')}</h3>
                        <p>
                            {t('components.terms.sections.k.content')}
                        </p>
                    </section>

                    <section>
                        <h3>{t('components.terms.sections.l.title')}</h3>
                        <p>
                            {t('components.terms.sections.l.content')}
                        </p>
                    </section>
                </div>

                <DialogFooter className="p-6">
                    <DialogClose asChild>
                        <Button>{t('components.terms.close')}</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default Terms
