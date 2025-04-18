import { useEffect, useMemo, useState } from 'react'
import { ColumnInStorage, Id } from '../../types';
import archiveStorage, { RowWithTasks } from '../../services/ArchiveStorage';
import { useStorageHandlerStatus } from '../../hooks/useStorageHandlerStatus';
import RowArchiveView from './RowArchiveView';
import { ArchiveStored } from '../../dataTypes/ArchiveStructures';
import boardStorage from '../../services/BoardStorage';
import ColumnHeaderContainer from '../board/ColumnHeaderContainer';

interface Props {
    columns: ColumnInStorage[];
}

function ArchiveView({ columns }: Props) {

    const storageIsReady = useStorageHandlerStatus();
    const [archive, setArchive] = useState<ArchiveStored | null>(null);
    const headerNames = useMemo(() => columns.map((col) => col.title), [columns]);

    useEffect(() => {
        const startFetch = async () => {
            if (storageIsReady) {
                setArchive(await archiveStorage.getArchive());
            }
        };

        startFetch();
    }, [storageIsReady]);

    async function restoreFromArchive(rowId: Id): Promise<void> {
        const archivedRow = archive?.rows.find((row) => row.id === rowId);

        if (archivedRow == null) {
            throw new Error("Row not found in archive");
        }

        const convertedData: RowWithTasks = archiveStorage.convertArchivedRowToBoardRow(archivedRow);

        boardStorage.addRowToBoard(convertedData.row, convertedData.tasks);

        await archiveStorage.removeFromArchive(rowId);

        const newArchive = await archiveStorage.getArchive();

        setArchive(newArchive);
    }

    return (
        <>
            <div className="m-auto flex gap-2 flex-col w-full">
                <div className='flex flex-col'>
                    <ColumnHeaderContainer
                        headerNames={headerNames}
                    />
                    {archive?.rows.map((archivedRow) => (
                        <RowArchiveView archivedRow={archivedRow} key={archivedRow.id} restoreFromArchive={restoreFromArchive} />
                    ))}
                </div>
            </div>
        </>
    )
}

export default ArchiveView