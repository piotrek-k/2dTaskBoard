import TaskArchiveCard from './TaskArchiveCard'
import { ArchivedRow, Id, Row } from '../../types'
import ArchiveIcon from '../../icons/ArchiveIcon';
import { useContext } from 'react';
import ModalContext, { ModalContextProps } from '../../context/ModalContext';
import RowDetails from '../cardDetails/RowDetails';
import { useHotkeys } from 'react-hotkeys-hook';

interface Props {
    archivedRow: ArchivedRow;
    restoreFromArchive(rowId: Id): Promise<void>;
}

function RowArchiveView({ archivedRow, restoreFromArchive }: Props) {

    const { setModalOpen, setModalContent } = useContext(ModalContext) as ModalContextProps;

    const handleClickOnRow = (row: Row) => {
        setModalContent(<RowDetails row={row} requestSavingDataToStorage={async () => { }} isReadOnly={true} />);
        setTimeout(() => setModalOpen(true), 0);
    };

    const ref = useHotkeys('enter', () => handleClickOnRow(archivedRow.row));

    return (
        <>
            <div
                className="
                                    m-auto
                                    flex
                                    w-full 
                                    items-center
                                    overflow-x-auto
                                    overflow-y-hidden
                                    ">
                <div className='flex w-full'>
                    <div className='w-[200px] flex-none bg-rowTitleBackgroundColor 
                                        flex justify-center
                                        '>
                        <div className="flex flex-col">
                            <div className="
                                                bg-mainBackgroundColor
                                                w-[150px] 
                                                p-2.5
                                                m-[12px]
                                                h-[100px]
                                                "
                                onClick={() => handleClickOnRow(archivedRow.row)}
                                ref={ref}
                                tabIndex={0}
                            >
                                {archivedRow.row.title}
                            </div>

                            <div className='flex flex-grow'></div>

                            <div className='flex flex-row flex-none p-2.5 text-gray-500'>
                                <button onClick={() => restoreFromArchive(archivedRow.row.id)}><ArchiveIcon />Restore from archive</button>
                            </div>
                        </div>
                    </div>

                    <div className='flex grow w-full striped-background'>
                        {archivedRow.columns.map((archivedColumn) => (
                            <div
                                className="
                                                            min-h-[200px]
                                                            flex
                                                            flex-col
                                                            grow
                                                            basis-0
                                                            min-w-0
                                                        "
                                key={archivedColumn.id}
                            >
                                {/* <b>{archivedColumn.id}</b> */}
                                <div className="p-2 overflow-x-hidden overflow-y-hidden flex flex-row flex-wrap">
                                    {archivedColumn.tasks.map((task) => (
                                        <TaskArchiveCard task={task} key={task.id} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}

export default RowArchiveView