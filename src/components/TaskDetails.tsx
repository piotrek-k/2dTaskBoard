import { useContext, useEffect, useState } from 'react'
import { Task } from '../types';
import MDEditor from '@uiw/react-md-editor';
import PlusIcon from '../icons/PlusIcon';
import { IAppStorageAccessor } from '../services/FileSystemStorage';
import DataStorageContext from './filesystem/DataStorageContext';
import FileUploader from './FileUploader';

interface Props {
  task: Task;
  requestSavingDataToStorage: () => Promise<void>;
}

function TaskDetails({ task, requestSavingDataToStorage }: Props) {

  const dataStorageContext = useContext(DataStorageContext) as IAppStorageAccessor;
  const [taskContent, setTaskContent] = useState<string | undefined>('');
  const [useEditMode, setUseEditMode] = useState(false);
  const [taskName, setTaskName] = useState<string>(task.title);
  const [useTaskNameEditMode, setUseTaskNameEditMode] = useState(false);

  useEffect(() => {
    if (dataStorageContext) {
      dataStorageContext.getTaskContent(task.id)
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
    dataStorageContext.saveTaskContent(task.id, taskContent ?? "");
  }, [taskContent]);

  useEffect(() => {
    (async function () {
      task.title = taskName;

      await requestSavingDataToStorage();
    })();
  }, [taskName]);

  return (
    <div className='flex flex-col'>
      <div className='flex flex-row gap-2'>
        <div>{task.id}</div>

        <button
          onClick={() => {
            setUseEditMode(!useEditMode)
          }}
          className="flex">
          <PlusIcon />
          Switch edit mode
        </button>
      </div>

      {!useTaskNameEditMode &&
        <h1 className='my-3 text-4xl font-extrabold leading-none tracking-tight text-gray-900 dark:text-white'
          onClick={() => setUseTaskNameEditMode(true)}>
          {taskName ?? 'Task name'}
        </h1>
      }

      {useTaskNameEditMode && <textarea
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
        onBlur={() => setUseTaskNameEditMode(false)}
        className='
        my-3 text-4xl font-extrabold leading-none tracking-tight text-gray-900 dark:text-white bg-inherit'></textarea>}

      {useEditMode && <MDEditor
        value={taskContent}
        onChange={(x) => {
          setTaskContent(x)
        }}
      />}
      {!useEditMode && <MDEditor.Markdown source={taskContent} style={{ whiteSpace: 'pre-wrap' }} className='my-3 min-h-60 max-h-96 overflow-y-auto bg-slate-600' />}

      <FileUploader
        onFileUpload={async (file) => {
          try {
            let newFileName = await dataStorageContext.uploadFileForTask(task.id, file);
            console.log('File uploaded successfully:', newFileName);

            setTaskContent((prevContent) => prevContent + `\n\n[${newFileName}](${newFileName})`);
          } catch (error) {
            console.error('Error uploading file:', error);
          }
        }}
      />


    </div>
  )
}

export default TaskDetails