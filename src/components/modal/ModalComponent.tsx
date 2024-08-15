import { useContext } from 'react';
import Modal from 'react-modal';
import ModalContext, { ModalContextProps } from './ModalContext';

function ModalComponent() {
  const { modalOpen, setModalOpen, modalContent } = useContext(ModalContext) as ModalContextProps;

  return (
    <Modal
      isOpen={modalOpen}
      onRequestClose={() => setModalOpen(false)}
    >
      {modalContent}
      <button onClick={() => setModalOpen(false)}>Close</button>
    </Modal>
  );
}

export default ModalComponent;