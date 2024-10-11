import { useContext, useEffect, useState } from 'react';
import { Id, Task } from '../../types';
import { useParams } from 'react-router-dom';
import DataStorageContext from '../../context/DataStorageContext';
import TaskDetails from '../../components/cardDetails/TaskDetails';

interface Props {
}

function CardDetailsStandalone({ }: Props) {

    const { taskId } = useParams();

    const dataStorage = useContext(DataStorageContext);

    const [task, setTask] = useState<Task | undefined>(undefined);

    async function fetchTask() {
        try {
            const dataContainer = await dataStorage?.fileSystemStorage.getKanbanState();

            if (dataContainer == undefined) {
                throw new Error("Data storage not set");
            }

            const typedTaskId: Id = taskId as Id;

            const task = dataContainer.tasks.find(t => t.id == typedTaskId);

            if (!task) {
                throw new Error(`Task with ID ${taskId} not found`);
            }

            setTask(task);
        } catch (error) {
            console.error("Error fetching task:", error);
        }
    }

    useEffect(() => {
        const startFetch = async () => {
            await fetchTask();
        };

        startFetch();
    }, [dataStorage?.storageReady]);

    async function requestSavingDataToStorage() {
        console.log("requestSavingDataToStorage");
    }

    return (
        <>
            {task ? <TaskDetails task={task} requestSavingDataToStorage={requestSavingDataToStorage} /> : <div>Loading...</div>}
        </>
    )
}

export default CardDetailsStandalone