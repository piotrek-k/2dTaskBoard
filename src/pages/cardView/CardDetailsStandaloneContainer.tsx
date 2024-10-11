import { useState } from 'react';
import DataSavingContext from '../../context/DataSavingContext';
import { DataStorageProvider } from '../../context/DataStorageProvider';
import CardDetailsStandalone from './CardDetailsStandalone';

interface Props {
}

function CardDetailsStandaloneContainer({ }: Props) {

    const [contextHasUnsavedChanges, setContextHasUnsavedChanges] = useState(false);

    return (
        <>
            <DataStorageProvider>
                <DataSavingContext.Provider value={{ contextHasUnsavedChanges, setContextHasUnsavedChanges }}>
                    <CardDetailsStandalone  />
                </DataSavingContext.Provider>
            </DataStorageProvider>
        </>
    )
}

export default CardDetailsStandaloneContainer