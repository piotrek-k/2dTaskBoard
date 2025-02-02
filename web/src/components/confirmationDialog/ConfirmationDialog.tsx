import { useContext } from "react";
import ConfirmationDialogContext, { ConfirmationDialogContextProps } from "../../context/ConfirmationDialogContext";

export function ConfirmationDialog() {
    const { confirmationDialogOpen, setConfirmationDialogOpen, settings, setSettings } = useContext(ConfirmationDialogContext) as ConfirmationDialogContextProps;

    const closeAndClearDialog = () => {
        setConfirmationDialogOpen(false);
        setSettings(undefined);
    };

    return (
        <>
            {confirmationDialogOpen && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity">
                            <div className="absolute inset-0 bg-black opacity-50"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>
                        <div
                            className="inline-block align-bottom bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
                        >
                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <h3 className="text-lg leading-6 font-medium text-gray-100">
                                        {settings?.question}
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm leading-5 text-gray-400">
                                            {settings?.question}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                <span className="flex w-full rounded-md shadow-sm sm:ml-3 sm:w-auto">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center w-full rounded-md border border-transparent px-4 py-2 bg-green-600 text-base leading-6 font-medium text-white shadow-sm hover:bg-green-500 focus:outline-none focus:ring focus:ring-green-500 transition ease-in-out duration-150 sm:text-sm sm:leading-5"
                                        onClick={() => settings?.acceptCallback()}
                                    >
                                        Accept
                                    </button>
                                </span>
                                <span className="mt-3 flex w-full rounded-md shadow-sm sm:mt-0 sm:w-auto">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center w-full rounded-md border border-gray-600 px-4 py-2 bg-gray-700 text-base leading-6 font-medium text-gray-300 shadow-sm hover:bg-gray-600 focus:outline-none focus:ring focus:ring-gray-500 transition ease-in-out duration-150 sm:text-sm sm:leading-5"
                                        onClick={() => closeAndClearDialog()}
                                    >
                                        Cancel
                                    </button>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
