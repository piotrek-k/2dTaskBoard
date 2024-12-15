import { useCallback, useContext, useEffect, useState } from 'react';
import { Id, TaskInStorage } from '../../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ModalContext, { ModalContextProps } from '../../context/ModalContext';
import TaskDetails from '../cardDetails/TaskDetails';
import { useHotkeys } from 'react-hotkeys-hook';
import { TaskMetadataViewModel } from '../../dataTypes/CardMetadata';
import cardMetadataViewModelsBuilder from '../../viewModelBuilders/CardMetadataViewModels';

interface Props {
    task: TaskInStorage;
    requestSavingDataToStorage: () => Promise<void>;
    shouldBeFocused: boolean;
    removeFocusRequest: () => void;
    moveTaskToNextColumn: (task: TaskInStorage, direction: number) => void;
}

function TaskCard({ task, requestSavingDataToStorage, shouldBeFocused, removeFocusRequest, moveTaskToNextColumn }: Props) {

    const { setModalOpen, setModalContent } = useContext(ModalContext) as ModalContextProps;

    const [taskViewModel, setTaskViewModel] = useState<TaskMetadataViewModel | null>(null);

    useEffect(() => {
        const fetchTaskMetadata = async () => {
            const taskMetadata = await cardMetadataViewModelsBuilder.getTaskMetadataViewModel(task.id) as TaskMetadataViewModel;

            setTaskViewModel(taskMetadata);
        };

        fetchTaskMetadata();
    }, [task]);

    const setHotkeyRef = useHotkeys('enter', () => handleClickOnTask(task.id));
    const setHotkeyMoveRightRef = useHotkeys('m', () => moveTaskToNextColumn(task, 1));
    const setHotkeyMoveLeftRef = useHotkeys('n', () => moveTaskToNextColumn(task, -1));

    const handleClickOnTask = useCallback(async (taskId: Id) => {
        const taskMetadata = await cardMetadataViewModelsBuilder.getTaskMetadataViewModel(taskId) as TaskMetadataViewModel;

        setModalContent(<TaskDetails
            task={taskMetadata}
            requestSavingDataToStorage={requestSavingDataToStorage}
            isReadOnly={false} />);
        setModalOpen(true);
    }, [requestSavingDataToStorage, setModalContent, setModalOpen]);

    const { setNodeRef, node, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: {
            type: "Task",
            task
        }
    });

    useEffect(() => {
        if (shouldBeFocused && node != null) {
            node.current?.focus();
            removeFocusRequest();
        }
    }, [shouldBeFocused, node, task, removeFocusRequest]);

    const style = {
        transition,
        transform: CSS.Transform.toString(transform)
    };

    const setCombinedRef = useCallback(
        (node: HTMLDivElement) => {
            setNodeRef(node);
            setHotkeyRef(node);
            setHotkeyMoveRightRef(node);
            setHotkeyMoveLeftRef(node);
        },
        [setNodeRef, setHotkeyRef, setHotkeyMoveRightRef, setHotkeyMoveLeftRef]
    );

    if (isDragging) {
        return <div
            ref={setCombinedRef}
            style={style}
            className='opacity-50 bg-mainBackgroundColor p-2.5 h-[100px] min-h-[100px]
    items-center flex text-left rounded-xl border-2 border-rose-500 relative m-1 w-[150px] touch-none'>  
        </div>;
    }

    return (
        <div
            ref={setCombinedRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => handleClickOnTask(task.id)}
            className={`bg-mainBackgroundColor p-2.5 md:h-[100px] md:min-h-[100px]
        items-center flex text-left hover-ring-2 hover:ring-inset
        hover:ring-rose-500 relative task m-1 w-full md:w-[150px] touch-none`}
            tabIndex={0}
        >
            <p
                className='my-auto md:h-[90%] w-full overflow-y-auto overflow-x-hidden whitespace-pre-wrap touch-none'
                tabIndex={-1}
            >
                {taskViewModel?.title}
            </p>
        </div>
    )
}

export default TaskCard