import Modal from 'react-modal';
import PlusIcon from "../../icons/PlusIcon";
import { useStorageHandlerStatus } from "../../hooks/useStorageHandlerStatus";
import fileSystemHandler from "../../services/FileSystemHandler";


export function RestoreAccessToStoragePopup() {
    const storageReady = useStorageHandlerStatus();

    return (
        <>
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
                        fileSystemHandler.restoreHandle();
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
        </>
    );
}