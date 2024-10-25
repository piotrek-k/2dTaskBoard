import { ReactNode, useEffect, useState } from "react";
import DataStorageContext from "./DataStorageContext";
import Modal from 'react-modal';
import { FileSystemStorage } from "../services/FileSystemStorage";
import PlusIcon from "../icons/PlusIcon";

interface Props {
    children: ReactNode;
}

export function DataStorageProvider({ children }: Props) {
    const [storageReady, setStorageReady] = useState<boolean>(false);

    const [fileSystemStorage] = useState<FileSystemStorage>(new FileSystemStorage());

    useEffect(() => {
        fileSystemStorage.registerOnChangeCallback((newState) => {
            setStorageReady(newState);
        });

        return () => {
            fileSystemStorage.registerOnChangeCallback(() => { });
        };
    }, [fileSystemStorage]);

    return (
        <DataStorageContext.Provider
            value={{
                storageReady,
                setStorageReady,
                fileSystemStorage
            }}
        >
            {!storageReady && <Modal
                isOpen={true}
                style={{
                    content: {
                        top: '50%',
                        left: '50%',
                        right: 'auto',
                        bottom: 'auto',
                        marginRight: '-50%',
                        transform: 'translate(-50%, -50%)',
                    }
                }}
            >
                <p>
                    Your browser lost access to directory storing your tasks.
                </p>

                <button
                    onClick={() => {
                        fileSystemStorage.restoreHandle();
                    }}
                    className="
                                flex
                                "
                >
                    <PlusIcon />
                    Click to regain access
                </button>
            </Modal>
            }

            {children}
        </DataStorageContext.Provider>
    );
}