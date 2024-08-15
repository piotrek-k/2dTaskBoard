import ReactModal from 'react-modal';
import './App.css'
import KanbanBoard from './components/KanbanBoard'

ReactModal.setAppElement('#root');
if (ReactModal.defaultStyles.content) {
  ReactModal.defaultStyles.content.backgroundColor = 'black';
}

function App() {
  return (
    <KanbanBoard></KanbanBoard>
  )
}

export default App
