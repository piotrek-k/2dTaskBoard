import { useContext, useMemo } from 'react';
import { Column, Id, Row, Task } from '../types';
import ColumnContainer from './ColumnContainer';
import { SortableContext } from '@dnd-kit/sortable';
import RowDetails from './RowDetails';
import ModalContext, { ModalContextProps } from './modal/ModalContext';
import MoveUpIcon from '../icons/MoveUpIcon';
import MoveDownIcon from '../icons/MoveDownIcon';
import MoveTopIcon from '../icons/MoveTopIcon';
import MoveBottomIcon from '../icons/MoveBottomIcon ';
import ArchiveIcon from '../icons/ArchiveIcon';

interface Props {
    row: Row;
    columns: Column[];
    createTask: (columnId: Id, rowId: Id) => void;
    getTasks: (columnId: Id, rowId: Id) => Task[];
    requestSavingDataToStorage: () => Promise<void>;
}

function RowContainer({ row, columns, createTask, getTasks, requestSavingDataToStorage }: Props) {

    const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

    const { setModalOpen, setModalContent } = useContext(ModalContext) as ModalContextProps;

    const handleClickOnRowDetails = () => {
        setModalContent(<RowDetails
            requestSavingDataToStorage={requestSavingDataToStorage}
            row={row}
        />);
        setModalOpen(true);
    };

    return (
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
                                handleClickOnRowDetails();
                            }}>
                            {row.title}
                        </div>

                        <div className='flex flex-grow'></div>

                        <div className='flex flex-row flex-none p-2.5 text-gray-500'>
                            <MoveUpIcon />
                            <MoveDownIcon />
                            <MoveTopIcon />
                            <MoveBottomIcon />
                            <ArchiveIcon />
                        </div>
                    </div>
                </div>

                <SortableContext items={columnsId}>
                    <div className='flex grow w-full'>
                        {columns.map((col) => (
                            <ColumnContainer
                                key={col.id}
                                column={col}
                                row={row}
                                createTask={createTask}
                                tasks={getTasks(col.id, row.id)}
                                requestSavingDataToStorage={requestSavingDataToStorage}
                                isFirstColumn={col.id === columns[0].id}
                            />
                        ))}
                    </div>
                </SortableContext>
            </div>
        </div>
    )
}

export default RowContainer