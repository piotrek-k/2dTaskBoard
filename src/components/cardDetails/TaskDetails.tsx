import { Task } from '../../types';
import SharedCardDetailsEditorComponent from './SharedCardDetailsEditorComponent';

interface Props {
  task: Task;
  requestSavingDataToStorage: () => Promise<void>;
}

function TaskDetails({ task, requestSavingDataToStorage }: Props) {

  return (
    <>
      <SharedCardDetailsEditorComponent task={task} requestSavingDataToStorage={requestSavingDataToStorage} />
    </>
  )
}

export default TaskDetails