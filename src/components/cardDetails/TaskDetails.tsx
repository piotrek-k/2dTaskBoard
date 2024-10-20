import { Task } from '../../types';
import SharedCardDetailsEditorComponent from './SharedCardDetailsEditorComponent';

interface Props {
  task: Task;
  requestSavingDataToStorage: () => Promise<void>;
  isReadOnly: boolean;
}

function TaskDetails({ task, requestSavingDataToStorage, isReadOnly }: Props) {

  return (
    <>
      <SharedCardDetailsEditorComponent task={task} requestSavingDataToStorage={requestSavingDataToStorage} isReadOnly={isReadOnly} />
    </>
  )
}

export default TaskDetails