import ReactModal from 'react-modal';
import './App.css'
import KanbanBoard from './components/KanbanBoard'
import ModalComponent from './components/modal/ModalComponent';
import { ModalProvider } from './components/modal/ModalProvider';
import { DataStorageProvider } from './components/filesystem/DataStorageProvider';
import DataSavingContext from './components/DataSavingContext';
import { useState } from 'react';

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
