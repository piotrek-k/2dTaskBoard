import ReactModal from 'react-modal';
import './App.css'
import KanbanBoard from '../../components/board/KanbanBoard'
import ModalComponent from '../../components/modal/ModalComponent';
import DataSavingContext from '../../context/DataSavingContext';
import { useState } from 'react';
import { RestoreAccessToStoragePopup } from '../../components/shared/RestoreAccessToStoragePopup';
import { ModalProvider } from '../../context/ModalProvider';
import { ConfirmationDialog } from '../../components/confirmationDialog/ConfirmationDialog';
import { ConfirmationDialogProvider } from '../../context/ConfirmationDialogProvider';

ReactModal.setAppElement('#root');
if (ReactModal.defaultStyles.content) {
  ReactModal.defaultStyles.content.backgroundColor = 'black';
}

function App() {
  const [contextHasUnsavedChanges, setContextHasUnsavedChanges] = useState(false);

  return (
    <>

      <DataSavingContext.Provider value={{ contextHasUnsavedChanges, setContextHasUnsavedChanges }}>
        <ModalProvider>
          <ConfirmationDialogProvider>
            <KanbanBoard></KanbanBoard>
            <ModalComponent />
            <ConfirmationDialog />
            <RestoreAccessToStoragePopup></RestoreAccessToStoragePopup>
          </ConfirmationDialogProvider>
        </ModalProvider>
      </DataSavingContext.Provider>

    </>
  )
}

export default App
