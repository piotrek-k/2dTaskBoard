import { RowMetadataViewModel } from "../../dataTypes/CardMetadata";
import { Id } from "../../types";
import SharedCardDetailsEditorComponent from "./SharedCardDetailsEditorComponent";

interface Props {
  row: RowMetadataViewModel;
  requestSavingDataToStorage: () => Promise<void>;
  isReadOnly: boolean;
  requestRemovingCard: (cardId: Id) => void;
  allowDelete: boolean;
}

function RowDetails({ row, requestSavingDataToStorage, isReadOnly, requestRemovingCard, allowDelete }: Props) {

  return (
    <>
      <SharedCardDetailsEditorComponent
        card={row}
        requestSavingDataToStorage={requestSavingDataToStorage}
        isReadOnly={isReadOnly}
        requestRemovingCard={requestRemovingCard}
        allowDelete={allowDelete}
      />
    </>
  )
}

export default RowDetails