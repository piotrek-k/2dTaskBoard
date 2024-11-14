import { useContext, useCallback } from 'react';
import Modal from 'react-modal';
import ModalContext, { ModalContextProps } from '../../context/ModalContext';
import DataSavingContext, { DataSavingContextProps } from '../../context/DataSavingContext';
import FocusLock from "react-focus-lock";

function ModalComponent() {
  const { modalOpen, setModalOpen, modalContent } = useContext(ModalContext) as ModalContextProps;

  const dataSavingContext = useContext(DataSavingContext) as DataSavingContextProps;

  const handleCloseModal = useCallback(() => {
    if (dataSavingContext.contextHasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to close the modal?')) {
      return;
    }
    setModalOpen(false);
  }, [dataSavingContext.contextHasUnsavedChanges, setModalOpen]);

  return (
    <Modal
      isOpen={modalOpen}
      onRequestClose={handleCloseModal}
      className="fixed inset-0 flex items-center justify-center p-4"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50"
    >
      <div className="relative bg-gray-800 dark:bg-gray-900 text-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        <FocusLock>
          <div className="sticky top-0 z-10 bg-gray-950 p-2 flex justify-end">
            <button
              onClick={handleCloseModal}
              className="text-gray-400 hover:text-gray-200 transition-colors duration-200"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div className="pt-2 pb-6 px-6">
            {modalContent}
          </div>
        </FocusLock>
      </div>
    </Modal>
  );
}

export default ModalComponent;