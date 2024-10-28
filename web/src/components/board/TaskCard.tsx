import { useContext } from 'react';
import { Task } from '../../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ModalContext, { ModalContextProps } from '../../context/ModalContext';
import TaskDetails from '../cardDetails/TaskDetails';
import { HotKeys } from 'react-hotkeys';

interface Props {
    task: Task;
    requestSavingDataToStorage: () => Promise<void>;
}

const keyMap = {
    OPEN: 'enter'
};

function TaskCard({ task, requestSavingDataToStorage }: Props) {

    const { setModalOpen, setModalContent } = useContext(ModalContext) as ModalContextProps;

    const handlers = {
        OPEN: () => handleClickOnTask(task)
    };

    const handleClickOnTask = (task: Task) => {
        setModalContent(<TaskDetails task={task} requestSavingDataToStorage={requestSavingDataToStorage} isReadOnly={false} />);
        setModalOpen(true);
    };

    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: {
            type: "Task",
            task
        }
    });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform)
    };

    if (isDragging) {
        return <div
            ref={setNodeRef}
            style={style}
            className='opacity-50 bg-mainBackgroundColor p-2.5 h-[100px] min-h-[100px]
    items-center flex text-left rounded-xl border-2 border-rose-500 relative m-1 w-[150px]'>

        </div>;
    }

    return (
        <HotKeys keyMap={keyMap} handlers={handlers}>
            <div
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                onClick={() => handleClickOnTask(task)}
                className='bg-mainBackgroundColor p-2.5 h-[100px] min-h-[100px]
        items-center flex text-left hover-ring-2 hover:ring-inset
        hover:ring-rose-500 relative task m-1 w-[150px]'
                tabIndex={0}
            >
                <p
                    className='my-auto h-[90%] w-full overflow-y-auto overflow-x-hidden whitespace-pre-wrap'
                    tabIndex={-1}
                >
                    {task.title}
                </p>
            </div>
        </HotKeys>
    )
}

export default TaskCard