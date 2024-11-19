import { TaskMetadataViewModel } from '../../dataTypes/CardMetadata';
import SharedCardDetailsEditorComponent from './SharedCardDetailsEditorComponent';

interface Props {
  task: TaskMetadataViewModel;
  requestSavingDataToStorage: () => Promise<void>;
  isReadOnly: boolean;
}

function TaskDetails({ task, requestSavingDataToStorage, isReadOnly }: Props) {

  return (
    <>
      <SharedCardDetailsEditorComponent
        card={task}
        requestSavingDataToStorage={requestSavingDataToStorage}
        isReadOnly={isReadOnly}
      />
    </>
  )
}

export default TaskDetails