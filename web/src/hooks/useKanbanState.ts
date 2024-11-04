import { useState } from "react";
import { KanbanDataContainer } from "../types";
import fileSystemHandler from "../services/FileSystemHandler";

export function useKanbanState() {
    const [isReady, setIsReady] = useState<boolean>(true);

    const fileName = 'data.json';

    async function getKanbanState(): Promise<KanbanDataContainer> {

        try {
            const fileContents = await fileSystemHandler.getContent(fileName);

            let result: KanbanDataContainer;

            if (fileContents.length === 0) {
                const newKanbanState = {
                    columns: [
                        { id: 1, title: 'To Do' },
                        { id: 2, title: 'In Progress' },
                        { id: 3, title: 'Done' }
                    ]
                } as KanbanDataContainer;
    
                await saveKanbanState(newKanbanState);
    
                result = newKanbanState;
            }
            else {
                result = JSON.parse(fileContents) as KanbanDataContainer;
            }

            setIsReady(true);

            return result;
        }
        catch (error) {
            setIsReady(false);

            throw error;
        }
    }

    async function saveKanbanState(boardStateContainer: KanbanDataContainer) {

        const dataContainer = {
            tasks: boardStateContainer.tasks,
            rows: boardStateContainer.rows,
            columns: boardStateContainer.columns
        }

        try {
            await fileSystemHandler.saveContent(fileName, dataContainer);

            setIsReady(true);
        }
        catch (error) {
            setIsReady(false);
            console.error(error);
        }
    }

    return [isReady, getKanbanState, saveKanbanState];
}