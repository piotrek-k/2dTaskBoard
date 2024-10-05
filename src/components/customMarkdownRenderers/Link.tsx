import React, { useContext, useEffect, useState } from 'react'
import { IAppStorageAccessor } from '../../services/FileSystemStorage';
import { Id } from '../../types';
import DataStorageContext from '../filesystem/DataStorageContext';

interface Props {
    taskId: Id;
    props: any;
}

function Link({ taskId, props }: Props) {
    const [customSrc, setCustomSrc] = useState<string>(props.href || '');

    const dataStorageContext = useContext(DataStorageContext) as IAppStorageAccessor;

    useEffect(() => {
        const fetchCustomSrc = async () => {
            const directory = await dataStorageContext.getDirectoryHandleForTaskAttachments(taskId);

            const src = await dataStorageContext.mapSrcToFileSystem(props.href, directory);
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

export default Link