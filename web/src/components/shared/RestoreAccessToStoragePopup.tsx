import Modal from 'react-modal';
import PlusIcon from "../../icons/PlusIcon";
import { useStorageHandlerStatus } from "../../hooks/useStorageHandlerStatus";
import fileSystemHandler from "../../services/FileSystemHandler";
import { useEffect, useState } from 'react';
import FolderIcon from '../../icons/FolderIcon';


export function RestoreAccessToStoragePopup() {
    const storageReady = useStorageHandlerStatus();

    const showDirectoryPickerIsAvailable = 'showDirectoryPicker' in window;

    const [hasFileSystemBeenAlreadyUsed, setHasFileSystemBeenAlreadyUsed] = useState<boolean | null>(null);

    useEffect(() => {
        async function fetchData() {
            const res = await fileSystemHandler.checkIfFileSystemHasAlreadyBeenAccessed();
            setHasFileSystemBeenAlreadyUsed(res);
        }
        fetchData();
    }, []);

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

                <div className="px-4 py-4 text-center">
                    <FolderIcon className="w-12 h-12 mx-auto" />
                    <div className="p-4">
                        {hasFileSystemBeenAlreadyUsed ?
                            'We have lost access to the directory where your tasks are stored. Please click the button below to regain access.' :
                            'To get started, choose a directory where you want to store your tasks.'
                        }
                    </div>

                    {hasFileSystemBeenAlreadyUsed ?
                        (
                            <button
                                onClick={() => {
                                    fileSystemHandler.restoreHandle();
                                }}
                                className="
                                    flex
                                    items-center
                                    justify-center
                                    bg-blue-500
                                    hover:bg-blue-700
                                    text-white
                                    font-bold
                                    py-2
                                    px-4
                                    rounded
                                    mt-4
                                "
                            >
                                <PlusIcon />
                                <div className='px-2'>
                                    Click to regain access
                                </div>
                            </button>

                        ) :
                        (
                            <button
                                onClick={() => {
                                    fileSystemHandler.chooseDifferentSource();
                                }}
                                className="
                                flex
                                items-center
                                justify-center
                                bg-blue-500
                                hover:bg-blue-700
                                text-white
                                font-bold
                                py-2
                                px-4
                                rounded
                                mt-4
                            "
                            >
                                <PlusIcon />
                                <div className='px-2'>
                                    Click to choose a directory
                                </div>
                            </button>
                        )
                    }


                </div>
            </Modal>
            }
        </>
    );
}