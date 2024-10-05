import { useContext, useEffect, useState } from 'react'
import { Task } from '../types';
import MDEditor from '@uiw/react-md-editor';
import PlusIcon from '../icons/PlusIcon';
import { IAppStorageAccessor } from '../services/FileSystemStorage';
import DataStorageContext from './filesystem/DataStorageContext';
import FileUploader from './FileUploader';
import CustomImageRenderer from './CustomImageRenderer';

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
  const [taskFiles, setTaskFiles] = useState<string[]>([]);

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

  useEffect(() => {
    if (dataStorageContext) {
      dataStorageContext.getFilesForTask(task.id)
        .then(files => {
          setTaskFiles(files.map(file => file.name));
        })
        .catch(err => {
          console.error('Error fetching task files:', err);
        });
    }
  }, [dataStorageContext, task.id]);

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
        previewOptions={{
          components: {
            img: (props: any) => <CustomImageRenderer props={props} taskId={task.id} />
          }
        }}
      />}

      {!useEditMode &&
        <MDEditor.Markdown
          source={taskContent}
          components={{
            img: (props: any) => <CustomImageRenderer props={props} taskId={task.id} />
          }}
          style={{ whiteSpace: 'pre-wrap' }}
          className='my-3 min-h-60 max-h-96 overflow-y-auto bg-slate-600'
        />}

      <div className="mt-4 mb-2">
        <h3 className="text-lg font-semibold mb-2">Attached Files:</h3>
        {taskFiles.length > 0 ? (
          <ul className="space-y-2">
            {taskFiles.map((fileName, index) => (
              <li key={index} className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                </svg>
                <span className="text-sm text-gray-700 dark:text-gray-300">{fileName}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 italic">No files attached</p>
        )}
      </div>

      <FileUploader
        onFileUpload={async (file) => {
          try {
            let fileHandle = (await dataStorageContext.uploadFileForTask(task.id, file)).fileHandle;
            console.log('File uploaded successfully:', fileHandle.name);

            setTaskContent((prevContent) => prevContent + `\n\n![${fileHandle.name}](${fileHandle.name})`);
          } catch (error) {
            console.error('Error uploading file:', error);
          }
        }}
      />


    </div>
  )
}

export default TaskDetails