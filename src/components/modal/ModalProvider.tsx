import { ReactNode, useState } from "react";
import ModalContext from "./ModalContext";

interface Props {
    children: ReactNode;
}

export function ModalProvider({ children }: Props) {
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [modalContent, setModalContent] = useState<ReactNode>(null);

    return (
        <ModalContext.Provider
            value={{ modalOpen, setModalOpen, modalContent, setModalContent }}
        >
            {children}
        </ModalContext.Provider>
    );
}