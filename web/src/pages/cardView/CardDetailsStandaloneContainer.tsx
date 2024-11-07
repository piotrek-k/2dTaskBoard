import { useState } from 'react';
import DataSavingContext from '../../context/DataSavingContext';
import { RestoreAccessToStoragePopup } from '../../components/shared/RestoreAccessToStoragePopup';
import CardDetailsStandalone from './CardDetailsStandalone';
import { ModalProvider } from '../../context/ModalProvider';

function CardDetailsStandaloneContainer() {

    const [contextHasUnsavedChanges, setContextHasUnsavedChanges] = useState(false);

    return (
        <>
            <ModalProvider>
                <RestoreAccessToStoragePopup></RestoreAccessToStoragePopup>
                <DataSavingContext.Provider value={{ contextHasUnsavedChanges, setContextHasUnsavedChanges }}>
                    <CardDetailsStandalone />
                </DataSavingContext.Provider>
            </ModalProvider>
        </>
    )
}

export default CardDetailsStandaloneContainer