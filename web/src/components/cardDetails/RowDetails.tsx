import { RowMetadataViewModel } from "../../dataTypes/CardMetadata";
import SharedCardDetailsEditorComponent from "./SharedCardDetailsEditorComponent";

interface Props {
  row: RowMetadataViewModel;
  requestSavingDataToStorage: () => Promise<void>;
  isReadOnly: boolean;
  requestRemovingCard: (cardId: number) => void;
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