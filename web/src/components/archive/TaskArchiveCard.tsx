import { useContext, useEffect, useState } from 'react'
import ModalContext, { ModalContextProps } from '../../context/ModalContext';
import { Id } from '../../types';
import TaskDetails from '../cardDetails/TaskDetails';
import { useHotkeys } from 'react-hotkeys-hook';
import taskStorage from '../../services/TaskStorage';
import { TaskMetadataViewModel, TaskStoredMetadata } from '../../dataTypes/CardMetadata';

interface Props {
    taskId: Id;
}

function TaskArchiveCard({taskId} : Props) {

    const { setModalOpen, setModalContent } = useContext(ModalContext) as ModalContextProps;

    const [task, setTask] = useState<TaskMetadataViewModel | undefined>(undefined);

    useEffect(() => {
        const fetchTask = async () => {
            const metadata = await taskStorage.getCardMetadata<TaskStoredMetadata>(taskId);
            const task = await taskStorage.addBoardContextToCard(metadata!) as TaskMetadataViewModel;

            setTask(task);
        };

        fetchTask();
    }, [taskId]);

    const handleClickOnTask = async () => {
        if(task == null) {
            throw new Error("Task not found");
        }

        setModalContent(<TaskDetails task={task} requestSavingDataToStorage={async () => { }} isReadOnly={true} />);
        setTimeout(()=>setModalOpen(true), 0);
    };

    const ref = useHotkeys('enter', () => handleClickOnTask()); 

    return (
        <div
            onClick={() => handleClickOnTask()}
            className='bg-mainBackgroundColor p-2.5 h-[100px] min-h-[100px]
                                                        items-center flex text-left hover-ring-2 hover:ring-inset
                                                        hover:ring-rose-500 relative task m-1 w-[150px]'
            tabIndex={0}
            ref={ref}
        >
            <p
                className='my-auto h-[90%] w-full overflow-y-auto overflow-x-hidden whitespace-pre-wrap'
            >
                {task?.title}
            </p>
        </div>
    )
}

export default TaskArchiveCard