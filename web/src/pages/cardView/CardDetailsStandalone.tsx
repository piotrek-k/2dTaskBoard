import { useCallback, useEffect, useState } from 'react';
import { Id } from '../../types';
import { useParams } from 'react-router-dom';
import TaskDetails from '../../components/cardDetails/TaskDetails';
import RowDetails from '../../components/cardDetails/RowDetails';
import { useStorageHandlerStatus } from '../../hooks/useStorageHandlerStatus';
import { MetadataType, RowMetadataViewModel, TaskMetadataViewModel } from '../../dataTypes/CardMetadata';
import cardMetadataViewModelsBuilder from '../../viewModelBuilders/CardMetadataViewModels';


function CardDetailsStandalone() {

    const { cardIdProp } = useParams();
    const [cardId] = useState<Id>(cardIdProp ?? "");

    const [task, setTask] = useState<TaskMetadataViewModel | undefined>(undefined);
    const [row, setRow] = useState<RowMetadataViewModel | undefined>(undefined);

    const storageIsReady = useStorageHandlerStatus();

    const fetchTask = useCallback(async () => {
        try {
            if (!storageIsReady || cardId === "") {
                return;
            }

            const metadataViewModel = await cardMetadataViewModelsBuilder.getMetadataOfUnknownType(cardId);

            if (metadataViewModel?.type == MetadataType.Task) {
                const taskViewModel = metadataViewModel as TaskMetadataViewModel;

                setTask(taskViewModel);

                return;
            }

            if (metadataViewModel?.type == MetadataType.Row) {
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
            {task ? <TaskDetails
                task={task}
                requestSavingDataToStorage={requestSavingDataToStorage}
                isReadOnly={false}
                requestRemovingCard={() => { throw new Error("Not implemented"); }}
                allowDelete={false} /> :
                row ? <RowDetails
                    row={row}
                    requestSavingDataToStorage={requestSavingDataToStorage}
                    isReadOnly={false}
                    requestRemovingCard={() => { throw new Error("Not implemented"); }}
                    allowDelete={false}
                /> :
                    <div>Loading...</div>}
        </>
    )
}

export default CardDetailsStandalone