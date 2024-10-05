import React, { useContext, useEffect, useState } from 'react';
import { IAppStorageAccessor } from '../services/FileSystemStorage';
import DataStorageContext from './filesystem/DataStorageContext';
import { Id } from '../types';

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

            const src = await getCustomSrc(props.src, directory);
            setCustomSrc(src);
        };


        fetchCustomSrc();
    }, [props.src]);

    async function getCustomSrc(originalSrc: string | undefined, directory: FileSystemDirectoryHandle): Promise<string> {
        if (!originalSrc) return '';

        try {
            const fileName = originalSrc.split('/').pop();
            if (!fileName) return originalSrc;

            const fileHandle = await directory.getFileHandle(fileName);
            const file = await fileHandle.getFile();
            return URL.createObjectURL(file);
        } catch (error) {
            console.error('Error getting custom src:', error);
            return originalSrc;
        }
    }

    return (
        <img
            {...props}
            src={customSrc}
            style={{ maxHeight: '20rem' }}
            loading="lazy"
            alt={props.alt || 'Custom image'}
        />
    );
}

export default CustomImageRenderer;