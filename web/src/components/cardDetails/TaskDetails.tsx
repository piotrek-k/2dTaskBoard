import { TaskMetadataViewModel } from '../../dataTypes/CardMetadata';
import SharedCardDetailsEditorComponent from './SharedCardDetailsEditorComponent';

interface Props {
  task: TaskMetadataViewModel;
  requestSavingDataToStorage: () => Promise<void>;
  isReadOnly: boolean;
  requestRemovingCard: (cardId: number) => void;
}

function TaskDetails({ task, requestSavingDataToStorage, isReadOnly, requestRemovingCard }: Props) {

  return (
    <>
      <SharedCardDetailsEditorComponent
        card={task}
        requestSavingDataToStorage={requestSavingDataToStorage}
        isReadOnly={isReadOnly}
        requestRemovingCard={requestRemovingCard}
      />
    </>
  )
}

export default TaskDetails