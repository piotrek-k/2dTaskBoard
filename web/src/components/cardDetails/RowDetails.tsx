import { RowMetadataViewModel } from "../../dataTypes/CardMetadata";
import SharedCardDetailsEditorComponent from "./SharedCardDetailsEditorComponent";

interface Props {
  row: RowMetadataViewModel;
  requestSavingDataToStorage: () => Promise<void>;
  isReadOnly: boolean;
}

function RowDetails({ row, requestSavingDataToStorage, isReadOnly }: Props) {

  return (
    <>
      <SharedCardDetailsEditorComponent
        card={row}
        requestSavingDataToStorage={requestSavingDataToStorage}
        isReadOnly={isReadOnly}
      />
    </>
  )
}

export default RowDetails