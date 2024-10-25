import ReactModal from 'react-modal';
import './App.css'
import KanbanBoard from '../../components/board/KanbanBoard'
import ModalComponent from '../../components/modal/ModalComponent';
import DataSavingContext from '../../context/DataSavingContext';
import { useState } from 'react';
import { DataStorageProvider } from '../../context/DataStorageProvider';
import { ModalProvider } from '../../context/ModalProvider';

ReactModal.setAppElement('#root');
if (ReactModal.defaultStyles.content) {
  ReactModal.defaultStyles.content.backgroundColor = 'black';
}

function App() {
  const [contextHasUnsavedChanges, setContextHasUnsavedChanges] = useState(false);

  return (
    <>
      <DataStorageProvider>
        <DataSavingContext.Provider value={{ contextHasUnsavedChanges, setContextHasUnsavedChanges }}>
          <ModalProvider>
            <KanbanBoard></KanbanBoard>
            <ModalComponent />
          </ModalProvider>
        </DataSavingContext.Provider>
      </DataStorageProvider>
    </>
  )
}

export default App
