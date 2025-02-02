import React from 'react';

export interface ConfirmationDialogContextProps {
    confirmationDialogOpen: boolean;
    setConfirmationDialogOpen: (open: boolean) => void;
    settings: ConfirmationDialogSettings | undefined;
    setSettings: (settings: ConfirmationDialogSettings| undefined) => void;
}

export type ConfirmationDialogSettings = {
    question: string;
    acceptCallback: () => void;
};

const ConfirmationDialogContext = React.createContext<ConfirmationDialogContextProps | null>(null);

export default ConfirmationDialogContext;