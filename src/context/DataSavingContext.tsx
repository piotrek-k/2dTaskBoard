import React from 'react';

export interface DataSavingContextProps {
    contextHasUnsavedChanges: boolean;
    setContextHasUnsavedChanges: (hasChanges: boolean) => void;
}

const DataSavingContext = React.createContext<DataSavingContextProps | null>(null);

export default DataSavingContext;