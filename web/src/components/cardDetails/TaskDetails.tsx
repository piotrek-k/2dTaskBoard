import { TaskMetadataViewModel } from '../../dataTypes/CardMetadata';
import SharedCardDetailsEditorComponent from './SharedCardDetailsEditorComponent';

interface Props {
  task: TaskMetadataViewModel;
  requestSavingDataToStorage: () => Promise<void>;
  isReadOnly: boolean;
  requestRemovingCard: (cardId: number) => void;
  allowDelete: boolean;
}

function TaskDetails({ task, requestSavingDataToStorage, isReadOnly, requestRemovingCard, allowDelete }: Props) {

  return (
    <>
      <SharedCardDetailsEditorComponent
        card={task}
        requestSavingDataToStorage={requestSavingDataToStorage}
        isReadOnly={isReadOnly}
        requestRemovingCard={requestRemovingCard}
        allowDelete={allowDelete}
      />
    </>
  )
}

export default TaskDetails