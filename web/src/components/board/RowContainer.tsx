import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ColumnInStorage, Id, RowInStorage, RowViewModel, TaskInStorage } from '../../types';
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
import { FocusRequest } from '../../hooks/useBoardFocusManager';
import { useHotkeys } from 'react-hotkeys-hook';
import { RowMetadataViewModel } from '../../dataTypes/CardMetadata';
import cardMetadataViewModelsBuilder from '../../viewModelBuilders/CardMetadataViewModels';

interface Props {
    row: RowInStorage;
    columns: ColumnInStorage[];
    createTask: (columnId: Id, rowId: Id) => void;
    requestSavingDataToStorage: () => Promise<void>;
    rowNavigation: RowNavigation;
    handleRowFocusChange: (rowId?: Id) => void;
    focusRequest: FocusRequest;
    setFocusRequest: (focusRequest: FocusRequest) => void;
    tasks: TaskInStorage[];
    modifyTask: (task: TaskInStorage) => void;
}

function RowContainer({ row, columns, createTask, requestSavingDataToStorage, rowNavigation, handleRowFocusChange, focusRequest, setFocusRequest, tasks, modifyTask }: Props) {

    const elementRef = useRef<HTMLDivElement>(null);

    const [rowViewModel, setRowViewModel] = useState<RowViewModel | null>(null);

    useEffect(() => {
        const fetchRowMetadata = async () => {
            const rowMetadata = await cardMetadataViewModelsBuilder.getRowMetadataViewModel(row.id) as RowMetadataViewModel;
            
            setRowViewModel({
                id: row.id,
                title: rowMetadata.title
            });
        };
    
        fetchRowMetadata();
    }, [row]);

    const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

    const { setModalOpen, setModalContent } = useContext(ModalContext) as ModalContextProps;
    const handleClickOnRowDetails = useCallback(async (rowId : Id) => {
        const metadataRow = await cardMetadataViewModelsBuilder.getRowMetadataViewModel(rowId) as RowMetadataViewModel;

        setModalContent(<RowDetails
            requestSavingDataToStorage={requestSavingDataToStorage}
            row={metadataRow}
            isReadOnly={false}
        />);
        setTimeout(() => setModalOpen(true), 0);
    }, [requestSavingDataToStorage, setModalContent, setModalOpen]);

    const enterHotKeyRef = useHotkeys('enter', () => handleClickOnRowDetails(row.id));

    useEffect(() => {
        if (focusRequest.rowId === row.id && elementRef.current != null && focusRequest.columnId === undefined) {
            elementRef.current.focus();
        }
    }, [row.id, focusRequest.columnId, focusRequest.rowId]);

    useEffect(() => {
        enterHotKeyRef(elementRef.current);
    }, [enterHotKeyRef]);

    function moveTaskToNextColumn(task: TaskInStorage, direction: number): void {
        const currentColumnIndex = columns.findIndex((col) => col.id === task.columnId);
        const nextColumnIndex = currentColumnIndex + direction;

        if (nextColumnIndex < columns.length && nextColumnIndex >= 0) {
            task.columnId = columns[nextColumnIndex].id;

            modifyTask(task);

            setFocusRequest({
                rowId: task.rowId,
                columnId: task.columnId
            });
        }
    }

    return (
        <div
            className="
            m-auto
            flex
            w-full 
            items-center
            overflow-x-auto
            overflow-y-hidden
            "
            onFocus={() => handleRowFocusChange(row.id)}
        >
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
                            ref={elementRef}
                            onClick={() => {
                                handleClickOnRowDetails(row.id);
                            }}
                            tabIndex={0}>
                            {rowViewModel?.title}
                        </div>

                        <div className='flex flex-grow'></div>

                        <div className='flex flex-row flex-none p-2.5 text-gray-500'>
                            <button onClick={() => rowNavigation.moveUp(row.id)}><MoveUpIcon /></button>
                            <button onClick={() => rowNavigation.moveDown(row.id)}><MoveDownIcon /></button>
                            <button onClick={() => rowNavigation.moveTop(row.id)}><MoveTopIcon /></button>
                            <button onClick={() => rowNavigation.moveBottom(row.id)}><MoveBottomIcon /></button>
                            <button onClick={() => rowNavigation.archive(row.id)}><ArchiveIcon /></button>
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
                                tasks={tasks.filter((task) => task.columnId === col.id && task.rowId === row.id)}
                                requestSavingDataToStorage={requestSavingDataToStorage}
                                isFirstColumn={col.id === columns[0].id}
                                focusRequest={focusRequest}
                                moveTaskToNextColumn={moveTaskToNextColumn}
                            />
                        ))}
                    </div>
                </SortableContext>
            </div>
        </div>
    )
}

export default RowContainer