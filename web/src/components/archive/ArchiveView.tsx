import { useEffect, useState } from 'react'
import { ArchiveViewModel, Id } from '../../types';
import archiveStorage, { RowWithTasks } from '../../services/ArchiveStorage';
import { useStorageHandlerStatus } from '../../hooks/useStorageHandlerStatus';
import RowArchiveView from './RowArchiveView';
import kanbanBoardStorage from '../../services/KanbanBoardStorage';

function ArchiveView() {
   
    const storageIsReady = useStorageHandlerStatus();
    const [archive, setArchive] = useState<ArchiveViewModel | null>(null);

    useEffect(() => {
        const startFetch = async () => {
            if (storageIsReady) {
                setArchive(await archiveStorage.getArchive());
            }
        };

        startFetch();
    }, [storageIsReady]);

    async function restoreFromArchive(rowId: Id): Promise<void> {
        const archivedRow = archive?.rows.find((row) => row.rowId === rowId);

        if (archivedRow == null) {
            throw new Error("Row not found in archive");
        }

        const convertedData : RowWithTasks = archiveStorage.convertArchivedRowToBoardRow(archivedRow);

        kanbanBoardStorage.addRowToBoard(convertedData.row, convertedData.tasks);

        await archiveStorage.removeFromArchive(rowId);

        const newArchive = await archiveStorage.getArchive();

        setArchive(newArchive);
    }

    return (
        <>
            <div className="m-auto flex gap-2 flex-col w-full">
                <div className='flex flex-col'>
                    {archive?.rows.map((archivedRow) => (
                        <RowArchiveView archivedRow={archivedRow} key={archivedRow.row.id} restoreFromArchive={restoreFromArchive} />
                    ))}
                </div>
            </div>
        </>
    )
}

export default ArchiveView