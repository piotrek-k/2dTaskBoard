import { useCallback, useEffect, useState } from 'react';
import { Id } from '../../types';
import { useParams } from 'react-router-dom';
import TaskDetails from '../../components/cardDetails/TaskDetails';
import RowDetails from '../../components/cardDetails/RowDetails';
import taskStorage from '../../services/TaskStorage';
import { useStorageHandlerStatus } from '../../hooks/useStorageHandlerStatus';
import { CardStoredMetadata, MetadataType, RowMetadataViewModel, TaskMetadataViewModel } from '../../dataTypes/CardMetadata';


function CardDetailsStandalone() {

    const { cardIdProp } = useParams();
    const [cardId] = useState<Id>(Number(cardIdProp));

    const [task, setTask] = useState<TaskMetadataViewModel | undefined>(undefined);
    const [row, setRow] = useState<RowMetadataViewModel | undefined>(undefined);

    const storageIsReady = useStorageHandlerStatus();

    const fetchTask = useCallback(async () => {
        try {
            if (!storageIsReady) {
                return;
            }

            const metadata = await taskStorage.getCardMetadata(cardId as Id) ?? {
                id: cardId
            } as CardStoredMetadata;

            const metadataViewModel = await taskStorage.addBoardContextToCard(metadata);

            if(metadataViewModel?.type == MetadataType.Task) {
                const taskViewModel = metadataViewModel as TaskMetadataViewModel;

                setTask(taskViewModel);

                return;
            }

            if(metadataViewModel?.type == MetadataType.Row) {
                const rowViewModel = metadataViewModel as RowMetadataViewModel;

                setRow(rowViewModel);

                return;
            }
        } catch (error) {
            console.error("Error fetching task:", error);
        }
    }, [cardId, storageIsReady]);

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