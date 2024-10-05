import { Task } from '../types';
import ExtendedMarkdownEditor from './ExtendedMarkdownEditor';

interface Props {
  task: Task;
  requestSavingDataToStorage: () => Promise<void>;
}

function TaskDetails({ task, requestSavingDataToStorage }: Props) {

  return (
    <>
      <ExtendedMarkdownEditor task={task} requestSavingDataToStorage={requestSavingDataToStorage} />
    </>
  )
}

export default TaskDetails