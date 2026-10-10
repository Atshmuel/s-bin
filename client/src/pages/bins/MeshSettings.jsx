import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Save } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getMeshSettings, updateMeshSettings } from "@/services/apiMeshSettings";

const MAX_MESH_AWAKE_WINDOW_SECONDS = 60;

function MeshSettingsRow({ organization }) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [seconds, setSeconds] = useState(String(organization.meshAwakeWindowSeconds));

    const updateMutation = useMutation({
        mutationFn: updateMeshSettings,
        onSuccess: () => {
            toast.success(t("pages.meshSettings.saved"));
            queryClient.invalidateQueries({ queryKey: ["mesh-settings"] });
        },
        onError: (error) => toast.error(error.message),
    });

    const value = Number(seconds);
    const isInvalid = !Number.isInteger(value) || value < 1 || value > MAX_MESH_AWAKE_WINDOW_SECONDS;
    const isUnchanged = value === organization.meshAwakeWindowSeconds;

    return (
        <TableRow>
            <TableCell className="font-medium">{organization.name}</TableCell>
            <TableCell>
                <Input
                    aria-label={t("pages.meshSettings.awakeTime")}
                    className="w-28"
                    type="number"
                    min={1}
                    max={MAX_MESH_AWAKE_WINDOW_SECONDS}
                    step={1}
                    value={seconds}
                    onChange={(event) => setSeconds(event.target.value)}
                />
            </TableCell>
            <TableCell className="text-right">
                <Button
                    type="button"
                    size="sm"
                    disabled={isInvalid || isUnchanged || updateMutation.isPending}
                    onClick={() => updateMutation.mutate({
                        orgId: organization._id,
                        meshAwakeWindowSeconds: value,
                    })}
                >
                    {updateMutation.isPending
                        ? <LoaderCircle className="animate-spin" />
                        : <Save />}
                    {t("pages.meshSettings.save")}
                </Button>
            </TableCell>
        </TableRow>
    );
}

function MeshSettings() {
    const { t } = useTranslation();
    const settingsQuery = useQuery({
        queryKey: ["mesh-settings"],
        queryFn: getMeshSettings,
    });
    const organizations = settingsQuery.data?.organizations ?? [];

    return (
        <main className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t("pages.meshSettings.title")}</h1>
                <p className="mt-2 text-muted-foreground">
                    {t("pages.meshSettings.description")}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t("pages.meshSettings.awakeTime")}</CardTitle>
                    <CardDescription>{t("pages.meshSettings.limit")}</CardDescription>
                </CardHeader>
                <CardContent>
                    {settingsQuery.isLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <LoaderCircle className="size-4 animate-spin" />
                            {t("loading")}
                        </div>
                    ) : settingsQuery.isError ? (
                        <p role="alert" className="text-sm text-destructive">
                            {settingsQuery.error.message}
                        </p>
                    ) : organizations.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            {t("pages.meshSettings.empty")}
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("pages.meshSettings.organization")}</TableHead>
                                    <TableHead>{t("pages.meshSettings.awakeTime")}</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {organizations.map((organization) => (
                                    <MeshSettingsRow
                                        key={`${organization._id}-${organization.meshAwakeWindowSeconds}`}
                                        organization={organization}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}

export default MeshSettings;
