import ReactModal from 'react-modal';
import './App.css'
import KanbanBoard from './components/KanbanBoard'
import ModalComponent from './components/modal/ModalComponent';
import { ModalProvider } from './components/modal/ModalProvider';
import DataStorageContext from './components/filesystem/DataStorageContext';
import { FileSystemStorage } from './services/FileSystemStorage';

ReactModal.setAppElement('#root');
if (ReactModal.defaultStyles.content) {
  ReactModal.defaultStyles.content.backgroundColor = 'black';
}

const dataStorage = new FileSystemStorage();

function App() {
  return (
    <>
      <DataStorageContext.Provider value={dataStorage}>
        <ModalProvider>
          <KanbanBoard></KanbanBoard>
          <ModalComponent />
        </ModalProvider>
      </DataStorageContext.Provider>
    </>
  )
}

export default App
