import { useContext, useEffect, useState } from "react";
import { IAppStorageAccessor } from "../services/FileSystemStorage";
import { Row } from "../types";
import DataStorageContext from "./filesystem/DataStorageContext";
import MDEditor from "@uiw/react-md-editor";
import PlusIcon from "../icons/PlusIcon";

interface Props {
  row: Row;
  requestSavingDataToStorage: () => Promise<void>;
}

function RowDetails({ row, requestSavingDataToStorage }: Props) {

  const dataStorageContext = useContext(DataStorageContext) as IAppStorageAccessor;
  const [taskContent, setTaskContent] = useState<string | undefined>('');
  const [useEditMode, setUseEditMode] = useState(false);
  const [rowName, setRowName] = useState<string>(row.title);
  const [useRowNameEditMode, setUseRowNameEditMode] = useState(false);

  useEffect(() => {
    if (dataStorageContext) {
      dataStorageContext.getTaskContent(row.id)
        .then(content => {
          setTaskContent(content);
        })
        .catch(err => {
          console.error('Error fetching task content:', err);
          setTaskContent('Error loading content');
        });
    }
  }, [dataStorageContext]);

  useEffect(() => {
    dataStorageContext.saveTaskContent(row.id, taskContent ?? "");
  }, [taskContent]);

  useEffect(() => {
    (async function () {
      row.title = rowName;

      await requestSavingDataToStorage();
    })();
  }, [rowName]);

  return (
    <div className='flex flex-col'>
      <div className='flex flex-row gap-2'>
        <div>{row.id}</div>

        <button
          onClick={() => {
            setUseEditMode(!useEditMode)
          }}
          className="flex">
          <PlusIcon />
          Switch edit mode
        </button>
      </div>

      {!useRowNameEditMode &&
        <h1 className='my-3 text-4xl font-extrabold leading-none tracking-tight text-gray-900 dark:text-white'
          onClick={() => setUseRowNameEditMode(true)}>
          {rowName ?? 'Task name'}
        </h1>
      }

      {useRowNameEditMode && <textarea
        value={rowName}
        onChange={(e) => setRowName(e.target.value)}
        onBlur={() => setUseRowNameEditMode(false)}
        className='
        my-3 text-4xl font-extrabold leading-none tracking-tight text-gray-900 dark:text-white bg-inherit'></textarea>}

      {useEditMode && <MDEditor
        value={taskContent}
        onChange={(x) => {
          setTaskContent(x)
        }}
      />}
      {!useEditMode && <MDEditor.Markdown source={taskContent} style={{ whiteSpace: 'pre-wrap' }} className='my-3 min-h-60 max-h-96 overflow-y-auto bg-slate-600' />}


    </div>
  )
}

export default RowDetails