import { createContext } from "react";
import { FileSystemStorage } from "../../services/FileSystemStorage";

export interface DataStorageContextProps {
    storageReady: boolean;
    setStorageReady: (open: boolean) => void;
    fileSystemStorage: FileSystemStorage;
}

const DataStorageContext = createContext<DataStorageContextProps | null>(null);

export default DataStorageContext;