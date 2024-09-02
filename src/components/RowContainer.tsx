import { useContext, useMemo } from 'react';
import { Column, Id, Row, Task } from '../types';
import ColumnContainer from './ColumnContainer';
import { SortableContext } from '@dnd-kit/sortable';
import RowDetails from './RowDetails';
import ModalContext, { ModalContextProps } from './modal/ModalContext';

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
        setModalContent(<RowDetails />);
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
                <div className='w-[200px] flex-none' onClick={() => {
                    handleClickOnRowDetails();
                }}
                >
                    {row.title}
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
                            />
                        ))}
                    </div>
                </SortableContext>
            </div>
        </div>
    )
}

export default RowContainer