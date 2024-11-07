import { useEffect, useState, useMemo } from 'react';
import { Id } from '../../types';
import attachmentsStorage from '../../services/AttachmentsStorage';
import { useStorageHandlerStatus } from '../../hooks/useStorageHandlerStatus';

interface Props {
    taskId: Id;
    props: any;
}

const srcCache: Record<string, string> = {};

function CustomImageRenderer({ taskId, props }: Props) {
    const [customSrc, setCustomSrc] = useState<string>(props.src || '');

    const cacheKey = useMemo(() => `${taskId}-${props.src}`, [taskId, props.src]);

    const storageIsReady = useStorageHandlerStatus();

    useEffect(() => {
        const fetchCustomSrc = async () => {
            if (srcCache[cacheKey]) {
                setCustomSrc(srcCache[cacheKey]);
                return;
            }
            
            const src = await attachmentsStorage.getLinkForAttachment(taskId, props.src);
            
            srcCache[cacheKey] = src;
            setCustomSrc(src);
        };

        fetchCustomSrc();
    }, [taskId, props.src, storageIsReady, cacheKey]);

    return (
        <img
            {...props}
            src={customSrc}
            style={{ maxHeight: '20rem' }}
            loading="lazy"
        />
    );
}

export default CustomImageRenderer;