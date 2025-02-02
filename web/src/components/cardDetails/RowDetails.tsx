import { RowMetadataViewModel } from "../../dataTypes/CardMetadata";
import SharedCardDetailsEditorComponent from "./SharedCardDetailsEditorComponent";

interface Props {
  row: RowMetadataViewModel;
  requestSavingDataToStorage: () => Promise<void>;
  isReadOnly: boolean;
  requestRemovingCard: (cardId: number) => void;
}

function RowDetails({ row, requestSavingDataToStorage, isReadOnly, requestRemovingCard }: Props) {

  return (
    <>
      <SharedCardDetailsEditorComponent
        card={row}
        requestSavingDataToStorage={requestSavingDataToStorage}
        isReadOnly={isReadOnly}
        requestRemovingCard={requestRemovingCard}
      />
    </>
  )
}

export default RowDetails