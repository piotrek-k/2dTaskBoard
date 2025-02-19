import { useEffect, useState } from 'react'
import attachmentsStorage from '../../services/AttachmentsStorage';
import { CardStoredMetadata } from '../../dataTypes/CardMetadata';

interface Props {
    cardMetadata: CardStoredMetadata;
    props: any;
}

function LinkRenderer({ cardMetadata, props }: Props) {
    const [customSrc, setCustomSrc] = useState<string>(props.href || '');

    useEffect(() => {
        const fetchCustomSrc = async () => {
            const src = await attachmentsStorage.getLinkForAttachment(cardMetadata, props.href);

            setCustomSrc(src);
        };

        fetchCustomSrc();
    }, [props.href, cardMetadata]);

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