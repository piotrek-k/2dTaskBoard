import { Row } from "../../types";
import SharedCardDetailsEditorComponent from "./SharedCardDetailsEditorComponent";

interface Props {
  row: Row;
  requestSavingDataToStorage: () => Promise<void>;
}

function RowDetails({ row, requestSavingDataToStorage }: Props) {

  return (
    <>
      <SharedCardDetailsEditorComponent task={row} requestSavingDataToStorage={requestSavingDataToStorage} />
    </>
  )
}

export default RowDetails