import { useContext } from 'react'
import ModalContext, { ModalContextProps } from '../../context/ModalContext';
import { Task } from '../../types';
import TaskDetails from '../cardDetails/TaskDetails';
import { useHotkeys } from 'react-hotkeys-hook';

interface Props {
    task: Task;
}

function TaskArchiveCard({task} : Props) {

    const { setModalOpen, setModalContent } = useContext(ModalContext) as ModalContextProps;

    const handleClickOnTask = (task: Task) => {
        setModalContent(<TaskDetails task={task} requestSavingDataToStorage={async () => { }} isReadOnly={true} />);
        setTimeout(()=>setModalOpen(true), 0);
    };

    const ref = useHotkeys('enter', () => handleClickOnTask(task)); 

    return (
        <div
            onClick={() => handleClickOnTask(task)}
            className='bg-mainBackgroundColor p-2.5 h-[100px] min-h-[100px]
                                                        items-center flex text-left hover-ring-2 hover:ring-inset
                                                        hover:ring-rose-500 relative task m-1 w-[150px]'
            tabIndex={0}
            ref={ref}
        >
            <p
                className='my-auto h-[90%] w-full overflow-y-auto overflow-x-hidden whitespace-pre-wrap'
            >
                {task.title}
            </p>
        </div>
    )
}

export default TaskArchiveCard