import { useEffect, useState, useMemo } from 'react';
import attachmentsStorage from '../../services/AttachmentsStorage';
import { useStorageHandlerStatus } from '../../hooks/useStorageHandlerStatus';
import { CardStoredMetadata } from '../../dataTypes/CardMetadata';

interface Props {
    cardMetadata: CardStoredMetadata;
    props: any;
}

const srcCache: Record<string, string> = {};

function CustomImageRenderer({ cardMetadata, props }: Props) {
    const [customSrc, setCustomSrc] = useState<string>(props.src || '');

    const cacheKey = useMemo(() => `${cardMetadata.id}-${props.src}`, [cardMetadata, props.src]);

    const storageIsReady = useStorageHandlerStatus();

    useEffect(() => {
        const fetchCustomSrc = async () => {
            if (srcCache[cacheKey]) {
                setCustomSrc(srcCache[cacheKey]);
                return;
            }
            
            const src = await attachmentsStorage.getLinkForAttachment(cardMetadata, props.src);
            
            srcCache[cacheKey] = src;
            setCustomSrc(src);
        };

        fetchCustomSrc();
    }, [cardMetadata, props.src, storageIsReady, cacheKey]);

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