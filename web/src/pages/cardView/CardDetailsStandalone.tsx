import { useCallback, useEffect, useState } from 'react';
import { Id, Row, Task, WorkUnitType } from '../../types';
import { useParams } from 'react-router-dom';
import TaskDetails from '../../components/cardDetails/TaskDetails';
import RowDetails from '../../components/cardDetails/RowDetails';
import kanbanBoardStorage from '../../services/KanbanBoardStorage';
import taskStorage from '../../services/TaskStorage';
import { useStorageHandlerStatus } from '../../hooks/useStorageHandlerStatus';


function CardDetailsStandalone() {

    const { taskIdProp } = useParams();
    const [taskId] = useState<Id>(Number(taskIdProp));

    const [task, setTask] = useState<Task | undefined>(undefined);
    const [row, setRow] = useState<Row | undefined>(undefined);

    const storageIsReady = useStorageHandlerStatus();

    const fetchTask = useCallback(async () => {
        try {
            const metadata = await taskStorage.getCardMetadata(taskId as Id);

            if (metadata != undefined) {
                if (metadata.type == WorkUnitType.Task) {
                    setTask(metadata as Task);

                    return;
                }

                setRow(metadata as Row);

                return;
            }

            const dataContainer = await kanbanBoardStorage.getKanbanState();

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
    }, [taskId]);

    useEffect(() => {
        const startFetch = async () => {
            await fetchTask();
        };

        startFetch();
    }, [storageIsReady, fetchTask]);

    async function requestSavingDataToStorage() {
        console.log("requestSavingDataToStorage");
    }

    return (
        <>
            {task ? <TaskDetails task={task} requestSavingDataToStorage={requestSavingDataToStorage} isReadOnly={false} /> :
                row ? <RowDetails row={row} requestSavingDataToStorage={requestSavingDataToStorage} isReadOnly={false} /> :
                    <div>Loading...</div>}
        </>
    )
}

export default CardDetailsStandalone