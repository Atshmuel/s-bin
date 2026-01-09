import { useAIOverview } from '@/hooks/overviews/useAIOverview';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Bot, ChevronLeft, Sparkles, Terminal } from "lucide-react";
import { Skeleton } from "../../components/ui/skeleton"
import { Typewriter } from '@/components/ai/TypeWriter';
import { useTranslation } from 'react-i18next';
import { useAppSide } from '@/contexts/AppSideProvider';

export default function AIInsights() {
    const { insights, isLoadingAIOverview, aiOverviewError } = useAIOverview();
    const { isRight } = useAppSide();
    const { t } = useTranslation();
    return (
        <Card className="mb-6 shadow-sm overflow-hidden">
            <CardHeader className="py-4 border-b">
                <div className={`flex items-center gap-2 font-semibold text-primary ${isLoadingAIOverview ? "animate-pulse" : ""}`}>
                    <Sparkles className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{t("pages.analytics.aiOverview.title")}</CardTitle>
                </div>
            </CardHeader>

            <CardContent className="pt-5 min-h-46">
                {aiOverviewError ? (
                    <div className="text-sm text-destructive p-3 rounded-md border border-destructive/20">
                        {aiOverviewError?.message}
                    </div>
                ) : null}

                {isLoadingAIOverview && !aiOverviewError ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="h-5 w-3/4" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-[90%]" />
                                    <Skeleton className="h-4 w-[80%]" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}

                {insights && insights.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {insights.map((insight, index) => (
                            <div key={index} className="relative space-x-4">
                                <div className="flex-1 space-y-2">
                                    <h3 className="font-bold text-[15px] tracking-tight">
                                        <Typewriter
                                            text={insight.title}
                                            speed={50}
                                            timeOut={index * 700}
                                            className=""
                                        />
                                    </h3>
                                    <Typewriter
                                        text={insight.content}
                                        speed={50}
                                        timeOut={index * 900}
                                        className="text-sm leading-relaxed"
                                    />

                                </div>

                                <Separator
                                    className="absolute top-2 -right-7"
                                    orientation="vertical"
                                />

                            </div>
                        ))}
                    </div>
                ) : (
                    !isLoadingAIOverview && !aiOverviewError && (
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-50"></div>
                                <div className="relative bg-muted/30 p-4 rounded-full border border-border/50">
                                    <Bot className="h-8 w-8 text-muted-foreground/70" />
                                </div>
                            </div>
                            <div className="space-y-1 flex gap-2">
                                {isRight ? <Terminal size={20} /> :
                                    <div className='relative flex'>
                                        <ChevronLeft size={20} />
                                        <span className='absolute right-3.5'>_</span>
                                    </div>
                                }
                                <div>
                                    <p className="font-medium text-foreground">
                                        <Typewriter text={t("pages.analytics.aiOverview.noInsightsYet")} speed={50} />
                                    </p>
                                    <p className={`text-sm text-muted-foreground flex items-center gap-2`}>

                                        <Typewriter text={t("pages.analytics.aiOverview.waitingForData")} speed={50} timeOut={1000} />
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                )}
            </CardContent>
        </Card>
    );
}