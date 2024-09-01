import React, { useContext, useEffect, useState } from 'react'
import DataStorageContext from './filesystem/DataStorageContext';
import { Task } from '../types';
import MDEditor from '@uiw/react-md-editor';
import PlusIcon from '../icons/PlusIcon';

interface Props {
  task: Task;
}

function TaskDetails({ task }: Props) {

  const dataStorageContext = useContext(DataStorageContext);
  const [taskContent, setTaskContent] = useState<string | undefined>('');
  const [useEditMode, setUseEditMode] = useState(false);

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
    <div>
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