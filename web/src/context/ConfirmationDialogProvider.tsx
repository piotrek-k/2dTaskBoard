import { ReactNode, useState } from "react";
import ConfirmationDialogContext, { ConfirmationDialogSettings } from "./ConfirmationDialogContext";

interface Props {
    children: ReactNode;
}

export function ConfirmationDialogProvider({ children }: Props) {
    const [confirmationDialogOpen, setConfirmationDialogOpen] = useState<boolean>(false);
    const [settings, setSettings] = useState<ConfirmationDialogSettings | undefined>(undefined);
    
    return (
        <ConfirmationDialogContext.Provider
            value={{
                confirmationDialogOpen: confirmationDialogOpen,
                setConfirmationDialogOpen: setConfirmationDialogOpen,
                settings,
                setSettings
            }}
        >
            {children}
        </ConfirmationDialogContext.Provider>
    );
}