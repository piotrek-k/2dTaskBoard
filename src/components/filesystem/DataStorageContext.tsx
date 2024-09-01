import { createContext } from "react";
import { FileSystemStorage } from "../../services/FileSystemStorage";

const DataStorageContext = createContext<FileSystemStorage>(new FileSystemStorage());

export default DataStorageContext;