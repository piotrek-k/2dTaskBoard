import React, { useContext, useEffect, useState } from 'react'
import TaskDetails from './TaskDetails'
import { Id, Task } from '../types';
import { useParams } from 'react-router-dom';
import { FileSystemStorage } from '../services/FileSystemStorage';
import DataSavingContext from './DataSavingContext';
import PlusIcon from '../icons/PlusIcon';
import Modal from 'react-modal';
import { DataStorageProvider } from './filesystem/DataStorageProvider';
import DataStorageContext from './filesystem/DataStorageContext';
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