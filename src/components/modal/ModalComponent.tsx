import { useContext } from 'react';
import Modal from 'react-modal';
import ModalContext, { ModalContextProps } from './ModalContext';

function ModalComponent() {
  const { modalOpen, setModalOpen, modalContent } = useContext(ModalContext) as ModalContextProps;

  return (
    <Modal
      isOpen={modalOpen}
      onRequestClose={() => setModalOpen(false)}
      className="fixed inset-0 flex items-center justify-center p-4"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50"
    >
      <div className="relative bg-gray-800 dark:bg-gray-900 text-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        <button
          onClick={() => setModalOpen(false)}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-200 transition-colors duration-200"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        <div className="p-6">
          {modalContent}
        </div>
      </div>
    </Modal>
  );
}

export default ModalComponent;