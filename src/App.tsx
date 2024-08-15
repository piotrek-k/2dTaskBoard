import ReactModal from 'react-modal';
import './App.css'
import KanbanBoard from './components/KanbanBoard'
import ModalComponent from './components/modal/ModalComponent';
import { ModalProvider } from './components/modal/ModalProvider';

ReactModal.setAppElement('#root');
if (ReactModal.defaultStyles.content) {
  ReactModal.defaultStyles.content.backgroundColor = 'black';
}

function App() {
  return (
    <>
      <ModalProvider>
        <KanbanBoard></KanbanBoard>
        <ModalComponent />
      </ModalProvider>
    </>
  )
}

export default App
