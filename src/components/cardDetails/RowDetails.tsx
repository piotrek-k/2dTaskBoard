import { Row } from "../../types";
import ExtendedMarkdownEditor from "./ExtendedMarkdownEditor";

interface Props {
  row: Row;
  requestSavingDataToStorage: () => Promise<void>;
}

function RowDetails({ row, requestSavingDataToStorage }: Props) {

  return (
    <>
      <ExtendedMarkdownEditor task={row} requestSavingDataToStorage={requestSavingDataToStorage} />
    </>
  )
}

export default RowDetails