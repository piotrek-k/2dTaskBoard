import Modal from 'react-modal';
import PlusIcon from "../../icons/PlusIcon";
import { useStorageHandlerStatus } from "../../hooks/useStorageHandlerStatus";
import fileSystemHandler from "../../services/FileSystemHandler";


export function RestoreAccessToStoragePopup() {
    const storageReady = useStorageHandlerStatus();

    const showDirectoryPickerIsAvailable = 'showDirectoryPicker' in window;

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
                {!showDirectoryPickerIsAvailable && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                        <p className="font-bold">Unsupported Feature</p>
                        <p>We're sorry, but we've discovered that your browser may not support the FileSystem API that we use to store your data. This feature is essential for this application to work. For now, please consider switching to a Chrome-based browser.</p>
                    </div>
                )}

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