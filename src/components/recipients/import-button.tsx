"use client";

import { ImportDialog } from "@/components/recipients/import-dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export function ImportRecipientsButton() {
    return (
        <ImportDialog>
            <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
            </Button>
        </ImportDialog>
    );
}
