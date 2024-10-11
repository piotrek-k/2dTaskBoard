import React from 'react';

export interface ModalContextProps {
    modalOpen: boolean;
    setModalOpen: (open: boolean) => void;
    modalContent: React.ReactNode;
    setModalContent: (content: React.ReactNode) => void;
}

const ModalContext = React.createContext<ModalContextProps | null>(null);

export default ModalContext;