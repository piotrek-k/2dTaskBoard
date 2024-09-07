import { useState, useEffect } from 'react';
import PlusIcon from '../icons/PlusIcon';
import Modal from 'react-modal';

function WelcomeScreen() {
    const appLoadedFirstTimeKey = 'appLoadedFirstTime';

    const [appLoadedFirstTime, setAppLoadedFirstTime] = useState<boolean>(() => {
        let valueInLocalStorage = localStorage.getItem(appLoadedFirstTimeKey);
        if (valueInLocalStorage === 'false') {
            return false;
        }
        return true;
    });

    useEffect(() => {
        localStorage.setItem(appLoadedFirstTimeKey, appLoadedFirstTime.toString());
    }, [appLoadedFirstTime]);

    return (
        <>
            {appLoadedFirstTime && <Modal
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
                <h1 className="text-3xl font-bold text-center text-white mb-4">2D Kanban Board</h1>

                <p className="text-lg text-gray-300 text-center mb-6">
                    Welcome to <span className="font-semibold">2D Kanban Board</span>!
                </p>

                <div className="text-gray-300 mb-6">
                    <p className="text-lg font-semibold mb-2">Key Features:</p>
                    <ul className="list-disc list-inside space-y-4 ml-6">
                        <li>
                            <strong className="text-white">2d:</strong> you can split your tasks into columns and rows
                        </li>
                        <li>
                            <strong className="text-white">Offline:</strong> all your data is stored locally
                        </li>
                        <li>
                            <strong className="text-white">File system based:</strong> which means you can use your existing backup and versioning tools to track changes
                        </li>
                        <li>
                            <strong className="text-white">Human readable format:</strong> you can read and edit your tasks even outside of this application
                        </li>
                        <li>
                            <strong className="text-white">Markdown support:</strong> you can use markdown to format your tasks
                        </li>
                        <li>
                            <strong className="text-white">Free:</strong> this app is free of charge
                        </li>
                    </ul>
                </div>


                <div className="flex justify-center">
                    <button className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 transition duration-300"
                        onClick={() => {
                            setAppLoadedFirstTime(false);
                        }}>
                        Get started
                    </button>
                </div>

            </Modal>}
        </>
    )
}

export default WelcomeScreen