import React, { useContext, useEffect, useState } from 'react'
import DataStorageContext from './filesystem/DataStorageContext';
import { Task } from '../types';

interface Props {
  task: Task;
}

function TaskDetails({ task }: Props) {

  const dataStorageContext = useContext(DataStorageContext);
  const [taskContent, setTaskContent] = useState('');

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

  return (
    <div>{task.id} {taskContent}</div>
  )
}

export default TaskDetails