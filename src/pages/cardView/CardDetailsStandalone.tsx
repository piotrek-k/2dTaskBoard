import { useContext, useEffect, useState } from 'react';
import { Id, Row, Task } from '../../types';
import { useParams } from 'react-router-dom';
import DataStorageContext from '../../context/DataStorageContext';
import TaskDetails from '../../components/cardDetails/TaskDetails';
import RowDetails from '../../components/cardDetails/RowDetails';

interface Props {
}

function CardDetailsStandalone({ }: Props) {

    const { taskId } = useParams();

    const dataStorage = useContext(DataStorageContext);

    const [task, setTask] = useState<Task | undefined>(undefined);
    const [row, setRow] = useState<Row | undefined>(undefined);

    async function fetchTask() {
        try {
            const dataContainer = await dataStorage?.fileSystemStorage.getKanbanState();

            if (dataContainer == undefined) {
                throw new Error("Data storage not set");
            }

            const typedTaskId: Id = taskId as Id;

            const task = dataContainer.tasks.find(t => t.id == typedTaskId);

            if (task) {
                setTask(task);

                return;
            }

            const row = dataContainer.rows.find(t => t.id == typedTaskId);

            if (!row) {
                throw new Error(`Task or row with ID ${taskId} not found`);
            }

            setRow(row);
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
            {task ? <TaskDetails task={task} requestSavingDataToStorage={requestSavingDataToStorage} /> :
                row ? <RowDetails row={row} requestSavingDataToStorage={requestSavingDataToStorage} /> :
                    <div>Loading...</div>}
        </>
    )
}

export default CardDetailsStandalone