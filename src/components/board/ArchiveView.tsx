import { useContext, useEffect, useMemo, useState } from 'react'
import DataStorageContext from '../../context/DataStorageContext';
import { Archive } from '../../types';
import ArchiveIcon from '../../icons/ArchiveIcon';

function ArchiveView() {
    const dataStorage = useContext(DataStorageContext);

    const [archive, setArchive] = useState<Archive | null>(null);

    const headerNames = useMemo(() => ['', 'A', 'B', 'C'], []);

    useEffect(() => {
        const startFetch = async () => {
            if (dataStorage?.storageReady) {
                setArchive(await dataStorage.fileSystemStorage.getArchive());
            }
        };

        startFetch();
    }, [dataStorage?.fileSystemStorage, dataStorage?.storageReady]);

    return (
        <>
            <div className="m-auto flex gap-2 flex-col w-full">
                <div className='flex flex-col'>
                    {/* <ColumnHeaderContainer
                        headerNames={headerNames}
                    /> */}

                    {archive?.rows.map((archivedRow) => (
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
                                                " onClick={() => {
                                                }}>
                                                {archivedRow.row.title}
                                            </div>

                                            <div className='flex flex-grow'></div>

                                            <div className='flex flex-row flex-none p-2.5 text-gray-500'>
                                                <button onClick={() => {} }><ArchiveIcon />Restore from archive</button>
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
                                            >
                                                {/* <b>{archivedColumn.id}</b> */}
                                                <div className="p-2 overflow-x-hidden overflow-y-hidden flex flex-row flex-wrap">
                                                    {archivedColumn.tasks.map((task) => (
                                                        <div
                                                            // onClick={() => handleClickOnTask(task)}
                                                            className='bg-mainBackgroundColor p-2.5 h-[100px] min-h-[100px]
                                                        items-center flex text-left hover-ring-2 hover:ring-inset
                                                        hover:ring-rose-500 relative task m-1 w-[150px]'
                                                        >
                                                            <p
                                                                className='my-auto h-[90%] w-full overflow-y-auto overflow-x-hidden whitespace-pre-wrap'
                                                            >
                                                                {task.title}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    ))}
                </div>
            </div>
        </>
    )
}

export default ArchiveView