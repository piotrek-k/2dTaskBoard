import { useEffect, useState } from "react";
import fileSystemHandler from "../services/FileSystemHandler";

export function useStorageHandlerStatus() {
    const [isReady, setIsReady] = useState<boolean>(true);

    useEffect(() => {
        const onStorageStatusChanged = (newStatus: boolean) => {
            setIsReady(newStatus);
        };

        fileSystemHandler.getReadinessWatcher().subscribe(onStorageStatusChanged);

        return () => {
            fileSystemHandler.getReadinessWatcher().unsubscribe(onStorageStatusChanged);
        };
    }, []);

    return isReady;
}