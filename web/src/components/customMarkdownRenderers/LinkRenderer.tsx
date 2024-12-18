import { useEffect, useState } from 'react'
import { Id } from '../../types';
import attachmentsStorage from '../../services/AttachmentsStorage';

interface Props {
    taskId: Id;
    props: any;
}

function LinkRenderer({ taskId, props }: Props) {
    const [customSrc, setCustomSrc] = useState<string>(props.href || '');

    useEffect(() => {
        const fetchCustomSrc = async () => {
            const src = await attachmentsStorage.getLinkForAttachment(taskId, props.href);

            setCustomSrc(src);
        };

        fetchCustomSrc();
    }, [props.href]);

    return (
        <a
            {...props}
            href={customSrc}
            target="_blank"
            rel="noopener noreferrer"
        >
            {props.children}
        </a>
    )
}

export default LinkRenderer