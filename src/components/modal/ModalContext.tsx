import { createContext, Dispatch, SetStateAction, ReactNode } from 'react';

export interface ModalContextProps {
    modalOpen: boolean;
    setModalOpen: Dispatch<SetStateAction<boolean>>;
    modalContent: ReactNode;
    setModalContent: Dispatch<SetStateAction<ReactNode>>;
}

const ModalContext = createContext<ModalContextProps | undefined>(undefined);

export default ModalContext;