import { useContext } from 'react';
import { Task } from '../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ModalContext, { ModalContextProps } from './modal/ModalContext';
import TaskDetails from './TaskDetails';

interface Props {
    task: Task;
    requestSavingDataToStorage: () => Promise<void>;
}

function TaskCard({ task, requestSavingDataToStorage }: Props) {

    const { setModalOpen, setModalContent } = useContext(ModalContext) as ModalContextProps;

    const handleClickOnTask = (task: Task) => {
        setModalContent(<TaskDetails task={task} requestSavingDataToStorage={requestSavingDataToStorage} />);
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
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => handleClickOnTask(task)}
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
    )
}

export default TaskCard