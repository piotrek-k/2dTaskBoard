import { Row } from "../../types";
import SharedCardDetailsEditorComponent from "./SharedCardDetailsEditorComponent";

interface Props {
  row: Row;
  requestSavingDataToStorage: () => Promise<void>;
  isReadOnly: boolean;
}

function RowDetails({ row, requestSavingDataToStorage, isReadOnly }: Props) {

  return (
    <>
      <SharedCardDetailsEditorComponent task={row} requestSavingDataToStorage={requestSavingDataToStorage} isReadOnly={isReadOnly} />
    </>
  )
}

export default RowDetails