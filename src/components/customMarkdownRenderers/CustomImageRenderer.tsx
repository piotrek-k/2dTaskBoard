import { useContext, useEffect, useState } from 'react';
import { IAppStorageAccessor } from '../../services/FileSystemStorage';
import DataStorageContext from '../filesystem/DataStorageContext';
import { Id } from '../../types';

interface Props {
    taskId: Id;
    props: any;
}

function CustomImageRenderer({ taskId, props }: Props) {
    const [customSrc, setCustomSrc] = useState<string>(props.src || '');
    const dataStorageContext = useContext(DataStorageContext) as IAppStorageAccessor;

    useEffect(() => {
        const fetchCustomSrc = async () => {
            const directory = await dataStorageContext.getDirectoryHandleForTaskAttachments(taskId);

            const src = await dataStorageContext.mapSrcToFileSystem(props.src, directory);
            setCustomSrc(src);
        };

        fetchCustomSrc();
    }, [props.src]);

    

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