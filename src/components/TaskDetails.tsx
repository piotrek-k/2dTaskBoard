import { useContext, useEffect, useState } from 'react'
import { Task } from '../types';
import MDEditor from '@uiw/react-md-editor';
import PlusIcon from '../icons/PlusIcon';
import { IAppStorageAccessor } from '../services/FileSystemStorage';
import DataStorageContext from './filesystem/DataStorageContext';

interface Props {
  task: Task;
}

function TaskDetails({ task }: Props) {

  const dataStorageContext = useContext(DataStorageContext) as IAppStorageAccessor;
  const [taskContent, setTaskContent] = useState<string | undefined>('');
  const [useEditMode, setUseEditMode] = useState(false);
  const [taskName, setTaskName] = useState<string>('Initial value');
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
        <p className='w-auto bg-slate-800'
         onClick={() => setUseTaskNameEditMode(true)}>
          {taskName}
        </p>
      }

      {useTaskNameEditMode && <input type='text'
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
        onBlur={() => setUseTaskNameEditMode(false)}
        className='
        bg-slate-700
         rounded-md   
         py-2 
         pl-4 
         pr-3 
         my-1'></input>}

      {useEditMode && <MDEditor
        value={taskContent}
        onChange={(x) => {
          setTaskContent(x)
        }}
      />}
      {!useEditMode && <MDEditor.Markdown source={taskContent} style={{ whiteSpace: 'pre-wrap' }} />}


    </div>
  )
}

export default TaskDetails