import { useContext, useMemo } from 'react';
import { Column, Id, Row, Task } from '../../types';
import ColumnContainer from './ColumnContainer';
import { SortableContext } from '@dnd-kit/sortable';
import MoveUpIcon from '../../icons/MoveUpIcon';
import MoveDownIcon from '../../icons/MoveDownIcon';
import MoveTopIcon from '../../icons/MoveTopIcon';
import MoveBottomIcon from '../../icons/MoveBottomIcon ';
import ArchiveIcon from '../../icons/ArchiveIcon';
import { RowNavigation } from '../../interfaces/RowNavigation';
import ModalContext, { ModalContextProps } from '../../context/ModalContext';
import RowDetails from '../cardDetails/RowDetails';

interface Props {
    row: Row;
    columns: Column[];
    createTask: (columnId: Id, rowId: Id) => void;
    getTasks: (columnId: Id, rowId: Id) => Task[];
    requestSavingDataToStorage: () => Promise<void>;
    rowNavigation: RowNavigation;
}

function RowContainer({ row, columns, createTask, getTasks, requestSavingDataToStorage, rowNavigation }: Props) {

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
                            <button onClick={() => rowNavigation.moveUp(row.id) }><MoveUpIcon /></button>
                            <button onClick={() => rowNavigation.moveDown(row.id) }><MoveDownIcon /></button>
                            <button onClick={() => rowNavigation.moveTop(row.id) }><MoveTopIcon /></button>
                            <button onClick={() => rowNavigation.moveBottom(row.id) }><MoveBottomIcon /></button>
                            <button onClick={() => rowNavigation.archive(row.id) }><ArchiveIcon /></button>
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