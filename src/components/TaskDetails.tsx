import React, { useContext } from 'react'
import DataStorageContext from './filesystem/DataStorageContext';

function TaskDetails() {

  const dataStorageContext = useContext(DataStorageContext);

  return (
    <div>{dataStorageContext?.getTaskContent("111")}</div>
  )
}

export default TaskDetails