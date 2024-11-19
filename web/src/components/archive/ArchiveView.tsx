import { useEffect, useState } from 'react'
import { Archive, Id } from '../../types';
import archiveStorage from '../../services/ArchiveStorage';
import { useStorageHandlerStatus } from '../../hooks/useStorageHandlerStatus';
import RowArchiveView from './RowArchiveView';

function ArchiveView() {
   
    const storageIsReady = useStorageHandlerStatus();
    const [archive, setArchive] = useState<Archive | null>(null);

    useEffect(() => {
        const startFetch = async () => {
            if (storageIsReady) {
                setArchive(await archiveStorage.getArchive());
            }
        };

        startFetch();
    }, [storageIsReady]);

    async function restoreFromArchive(rowId: Id): Promise<void> {
        const archivedRow = archive?.rows.find((row) => row.row.id === rowId);

        if (archivedRow == null) {
            throw new Error("Row not found in archive");
        }

        // TODO: Move logic to service

        // const boardState = await kanbanBoardStorage.getKanbanState();

        // if (boardState == null) {
        //     throw new Error("Board state not found");
        // }

        // boardState?.rows.unshift(archivedRow.row);
        // boardState?.tasks.push(...archivedRow.columns.flatMap((column) => column.tasks));

        // await kanbanBoardStorage.saveKanbanState(boardState);

        // await archiveStorage.removeFromArchive(rowId);

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