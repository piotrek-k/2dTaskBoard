import { ReactNode, useState } from "react";
import ModalContext from "./ModalContext";

interface Props {
    children: ReactNode;
}

export function ModalProvider({ children }: Props) {
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [modalContent, setModalContent] = useState<ReactNode>(null);
    const [modalContentHasUnsavedChanges, setModalContentHasUnsavedChanges] = useState<boolean>(false);
    return (
        <ModalContext.Provider
            value={{
                modalOpen,
                setModalOpen,
                modalContent,
                setModalContent,
                modalContentHasUnsavedChanges,
                setModalContentHasUnsavedChanges
            }}
        >
            {children}
        </ModalContext.Provider>
    );
}