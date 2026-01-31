"use client";

import { ImportDialog } from "@/components/recipients/import-dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

import { useRouter } from "next/navigation";

interface ImportRecipientsButtonProps {
    onSuccess?: () => void;
}

export function ImportRecipientsButton({ onSuccess }: ImportRecipientsButtonProps) {
    const router = useRouter();

    const handleSuccess = () => {
        router.refresh();
        onSuccess?.();
    };

    return (
        <ImportDialog onSuccess={handleSuccess}>
            <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
            </Button>
        </ImportDialog>
    );
}
