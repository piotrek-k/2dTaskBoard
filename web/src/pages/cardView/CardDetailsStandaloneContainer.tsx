import { useState } from 'react';
import DataSavingContext from '../../context/DataSavingContext';
import { RestoreAccessToStoragePopup } from '../../components/shared/RestoreAccessToStoragePopup';
import CardDetailsStandalone from './CardDetailsStandalone';

interface Props {
}

function CardDetailsStandaloneContainer({ }: Props) {

    const [contextHasUnsavedChanges, setContextHasUnsavedChanges] = useState(false);

    return (
        <>
            <RestoreAccessToStoragePopup>
                <DataSavingContext.Provider value={{ contextHasUnsavedChanges, setContextHasUnsavedChanges }}>
                    <CardDetailsStandalone  />
                </DataSavingContext.Provider>
            </RestoreAccessToStoragePopup>
        </>
    )
}

export default CardDetailsStandaloneContainer