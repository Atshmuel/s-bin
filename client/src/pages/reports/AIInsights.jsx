import { useState, useCallback } from 'react';
import { useAIOverview } from '@/hooks/overviews/useAIOverview';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Loader2 } from "lucide-react";

export default function AIInsights() {
    const [finalInsights, setFinalInsights] = useState(null);

    const handleChunk = useCallback((data) => {
        if (data && data.insights) {
            setFinalInsights(data.insights);
        }
    }, []);

    const { isFetching, isError, error } = useAIOverview(handleChunk);

    return (
        <Card className="mb-6 shadow-sm overflow-hidden">
            <CardHeader className="py-4 border-b ">
                <div className="flex items-center gap-2 font-semibold text-primary">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">AI Operations Summary</CardTitle>
                </div>
            </CardHeader>

            <CardContent className="pt-5">
                {isError && (
                    <div className="text-sm text-destructive p-3 rounded-md border border-destructive/20">
                        {error?.message}
                    </div>
                )}

                {isFetching && !finalInsights && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin mb-3" />
                        <p className="text-sm font-medium animate-pulse">Analyzing system logs...</p>
                    </div>
                )}

                {finalInsights ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {finalInsights.map((insight, index) => (
                            <div key={index} className="relative flex flex-col h-full">
                                <div className="flex-1 lg:pr-4">
                                    <h3 className="font-bold text-[15px] tracking-tight mb-2">
                                        {insight.title}
                                    </h3>
                                    <p className="text-sm ">
                                        {insight.text}
                                    </p>
                                </div>

                                {index < finalInsights.length - 1 && (
                                    <Separator
                                        orientation="vertical"
                                        className="hidden lg:block absolute -right-4"
                                    />
                                )}
                                {index < finalInsights.length - 1 && (
                                    <Separator className="lg:hidden my-6" />
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    !isFetching && !isError && (
                        <p className="text-sm text-center">No logs available for analysis.</p>
                    )
                )}
            </CardContent>
        </Card>
    );
}