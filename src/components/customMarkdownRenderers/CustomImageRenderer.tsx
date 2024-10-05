import { useContext, useEffect, useState, useMemo } from 'react';
import { IAppStorageAccessor } from '../../services/FileSystemStorage';
import DataStorageContext from '../filesystem/DataStorageContext';
import { Id } from '../../types';

interface Props {
    taskId: Id;
    props: any;
}

const srcCache: Record<string, string> = {};

function CustomImageRenderer({ taskId, props }: Props) {
    const [customSrc, setCustomSrc] = useState<string>(props.src || '');
    const dataStorageContext = useContext(DataStorageContext) as IAppStorageAccessor;

    const cacheKey = useMemo(() => `${taskId}-${props.src}`, [taskId, props.src]);

    useEffect(() => {
        const fetchCustomSrc = async () => {
            if (srcCache[cacheKey]) {
                setCustomSrc(srcCache[cacheKey]);
                return;
            }

            const directory = await dataStorageContext.getDirectoryHandleForTaskAttachments(taskId);
            const src = await dataStorageContext.mapSrcToFileSystem(props.src, directory);
            
            srcCache[cacheKey] = src;
            setCustomSrc(src);
        };

        fetchCustomSrc();
    }, [cacheKey, dataStorageContext]);

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