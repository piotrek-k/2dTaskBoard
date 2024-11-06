import { useContext, useEffect, useState } from 'react'
import { Id } from '../../types';
import DataStorageContext from '../../context/DataStorageContext';
import attachmentsStorage from '../../services/AttachmentsStorage';

interface Props {
    taskId: Id;
    props: any;
}

function LinkRenderer({ taskId, props }: Props) {
    const [customSrc, setCustomSrc] = useState<string>(props.href || '');

    const dataStorageContext = useContext(DataStorageContext);

    useEffect(() => {
        const fetchCustomSrc = async () => {
            const directory = await dataStorageContext?.fileSystemStorage.getDirectoryHandleForTaskAttachments(taskId);

            if (!directory) {
                throw new Error('Directory not found');
            }

            const src = await attachmentsStorage.getLinkForAttachment(taskId, props.href);

            setCustomSrc(src);
        };

        fetchCustomSrc();
    }, [props.href]);

    return (
        <a
            href={customSrc}
            target="_blank"
            rel="noopener noreferrer"
        >
            {props.children}
        </a>
    )
}

export default LinkRenderer