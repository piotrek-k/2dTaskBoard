import { useEffect, useState } from "react";
import fileSystemHandler from "../services/FileSystemHandler";

export function useStorageHandlerStatus() {
    const [isReady, setIsReady] = useState<boolean>(true);

    useEffect(() => {
        const onStorageStatusChanged = (newStatus: boolean) => {
            if(newStatus === isReady){
                return;
            }

            setIsReady(newStatus);
        };

        fileSystemHandler.getReadinessWatcher().subscribe(onStorageStatusChanged);

        return () => {
            fileSystemHandler.getReadinessWatcher().unsubscribe(onStorageStatusChanged);
        };
    }, [isReady]);

    return isReady;
}