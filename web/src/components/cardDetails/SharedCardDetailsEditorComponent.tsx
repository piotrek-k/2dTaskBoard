import MDEditor from '@uiw/react-md-editor';
import { useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import DataSavingContext, { DataSavingContextProps } from '../../context/DataSavingContext';
import CustomImageRenderer from '../customMarkdownRenderers/CustomImageRenderer';
import FileUploader from '../fileUploader/FileUploader';
import LinkRenderer from '../customMarkdownRenderers/LinkRenderer';
import { Link } from "react-router-dom";
import taskStorage from '../../services/CardStorage';
import attachmentsStorage from '../../services/AttachmentsStorage';
import { useStorageHandlerStatus } from '../../hooks/useStorageHandlerStatus';
import { CardStoredMetadata } from '../../dataTypes/CardMetadata';
import CustomMDEditor from '../customMarkdownRenderers/CustomMDEditor';
import TrashIcon from '../../icons/TrashIcon';
import { Id } from '../../types';
import LinkIcon from '../../icons/LinkIcon';
import Mermaid from '../customMarkdownRenderers/Mermaid';

interface Props {
    card: CardStoredMetadata;
    requestSavingDataToStorage: () => Promise<void>;
    isReadOnly: boolean;
    requestRemovingCard: (cardId: Id) => void;
    allowDelete: boolean;
}

interface TaskFile {
    name: string;
    src: string;
}

function SharedCardDetailsEditorComponent({ card, requestSavingDataToStorage, isReadOnly, requestRemovingCard, allowDelete }: Props) {
    const { setContextHasUnsavedChanges } = useContext(DataSavingContext) as DataSavingContextProps;
    const [taskContent, setTaskContent] = useState<string | undefined>('');
    const [savedTaskContent, setSavedTaskContent] = useState(taskContent);
    const [useEditMode, setUseEditMode] = useState(false);
    const [taskName, setTaskName] = useState<string>(card.title);
    const [useTaskNameEditMode, setUseTaskNameEditMode] = useState(false);
    const [taskFiles, setTaskFiles] = useState<TaskFile[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const storageIsReady = useStorageHandlerStatus();
    const cardTitleRef = useRef<HTMLInputElement>(null);
    const saveButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (storageIsReady) {
            taskStorage.getCardContent(card.id)
                .then(content => {
                    const contentText = content.getJustMarkdownContent();
                    setTaskContent(contentText);
                    setSavedTaskContent(contentText);
                })
                .catch(err => {
                    console.error('Error fetching task content:', err);
                    setTaskContent('Error loading content');
                });
        }
    }, [storageIsReady, card.id]);

    useEffect(() => {
        (async function () {
            if (card.title != taskName) {
                setHasUnsavedChanges(true);
            }
        })();
    }, [taskName, card.title]);

    useEffect(() => {
        if (saveButtonRef.current) {
            saveButtonRef.current.focus();
        }
    }, [saveButtonRef]);

    useEffect(() => {
        setContextHasUnsavedChanges(hasUnsavedChanges);
    }, [hasUnsavedChanges, setContextHasUnsavedChanges]);

    useEffect(() => {
        if (savedTaskContent !== taskContent) {
            setHasUnsavedChanges(true);
            return;
        }

        setHasUnsavedChanges(false);
    }, [taskContent, savedTaskContent]);

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                event.preventDefault();
                event.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [hasUnsavedChanges]);

    const refreshAttachments = useCallback(() => {
        if (storageIsReady) {
            const fetchTaskFiles = async () => {
                try {
                    const files = await attachmentsStorage.getFileNamesForTask(card);

                    const mappedFiles = await Promise.all(files.map(async file => ({
                        name: file,
                        src: await attachmentsStorage.getLinkForAttachment(card, file)
                    })));

                    setTaskFiles(mappedFiles);
                } catch (err) {
                    console.error('Error fetching task files:', err);
                }
            };

            fetchTaskFiles();
        }
    }, [storageIsReady, card]);

    useEffect(() => {
        refreshAttachments();
    }, [refreshAttachments]);

    function appendFile(fileName: string) {
        const fileExtension = fileName.split('.').pop()?.toLowerCase();
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];

        if (imageExtensions.includes(fileExtension || '')) {
            appendAsImage(fileName);
        } else {
            appendAsLink(fileName);
        }
    }

    function appendAsImage(fileName: string) {
        setTaskContent((prevContent) => prevContent + `\n\n![${fileName}](${fileName})`);
    }

    function appendAsLink(fileName: string) {
        setTaskContent((prevContent) => prevContent + `\n\n[${fileName}](${fileName})`);
    }

    const handleContentChange = useCallback((newContent: string | undefined) => {
        setTaskContent(newContent);
        setHasUnsavedChanges(true);
    }, [setHasUnsavedChanges]);

    const handleSave = useCallback(async () => {
        if (storageIsReady && taskContent !== undefined) {
            card.title = taskName;

            await taskStorage.saveCardContent(card.id, taskContent, card);
            await taskStorage.saveCardMetadata(card);
            setSavedTaskContent(taskContent);
            await requestSavingDataToStorage();
            setHasUnsavedChanges(false);
        }
    }, [storageIsReady, taskContent, card, taskName, requestSavingDataToStorage]);

    const memoizedMarkdown = useMemo(() => (
        <MDEditor.Markdown
            source={taskContent}
            components={{
                img: (props: any) => <CustomImageRenderer props={props} cardMetadata={card} />,
                a: (props: any) => <LinkRenderer props={props} cardMetadata={card} />,
                code:(props: any) => <Mermaid props={props} />
            }}
            style={{
                maxWidth: '100%',
                padding: '20px',
            }}
            className='m-3 prose prose-invert lg:prose-xl'
        />
    ), [taskContent, card]);

    useEffect(() => {
        const handleKeydown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && useEditMode) {
                setUseEditMode(false);
            }
        };

        // it's workaround, because MDEditor prevents default on Escape keydown
        window.addEventListener('keydown', handleKeydown, { capture: true });

        return () => {
            window.removeEventListener('keydown', handleKeydown, { capture: true });
        };
    }, [useEditMode]);

    useEffect(() => {
        if (useEditMode && cardTitleRef?.current != null) {
            cardTitleRef?.current.focus();
        }
    }, [useEditMode]);

    const memoizedEditor = useMemo(() => (
        <CustomMDEditor
            autoFocus={false}
            value={taskContent}
            onChange={handleContentChange}
            defaultTabEnable={true}
            previewOptions={{
                components: {
                    img: (props: any) => <CustomImageRenderer props={props} cardMetadata={card} />,
                    a: (props: any) => <LinkRenderer props={props} cardMetadata={card} />
                }
            }}
            className="min-h-[50vw]"
        />
    ), [taskContent, handleContentChange, card]);

    return (
        <>
            <div className='flex flex-col'>
                <div className='flex flex-row justify-between items-center py-2'>
                    <Link to={`/card/${card.id}`} target="_blank" rel="noopener noreferrer" className="px-3 py-3 bg-gray-700 rounded-md text-base hover:bg-gray-600 transition-colors duration-200">
                        <LinkIcon />
                    </Link>
                    <div className='flex flex-row gap-2'>
                        {!isReadOnly ? <>
                            {allowDelete &&
                                <button
                                    onClick={() => {
                                        requestRemovingCard(card.id);
                                    }}
                                    className="flex items-center px-4 py-2 rounded-md font-semibold bg-gray-700 hover:bg-red-800 text-white transition-colors duration-200"
                                >
                                    <TrashIcon />
                                </button>
                            }

                            <button
                                onClick={() => {
                                    setUseEditMode(!useEditMode);
                                }}
                                className="flex items-center px-4 py-2 rounded-md font-semibold bg-gray-700 hover:bg-blue-800 text-white transition-colors duration-200"
                                ref={saveButtonRef}
                            >

                                Switch edit mode
                            </button>

                            <button
                                onClick={handleSave}
                                className={`px-4 py-2 rounded-md font-semibold ${hasUnsavedChanges
                                    ? 'bg-blue-600 hover:bg-yellow-700 text-white'
                                    : 'bg-gray-700 hover:bg-green-800 text-white'
                                    } transition-colors duration-200`}
                                disabled={!hasUnsavedChanges}
                            >
                                {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
                            </button>
                        </> : null}
                    </div>
                </div>
            </div>

            {!useEditMode && !useTaskNameEditMode ? (
                <h1
                    onClick={() => setUseTaskNameEditMode(true)}
                    className="text-2xl font-bold text-white cursor-pointer hover:text-gray-300 transition-colors duration-200 py-2 break-words"
                >
                    {taskName ?? 'Task name'}
                </h1>
            ) : (
                <input
                    type="text"
                    value={taskName}
                    ref={cardTitleRef}
                    onChange={(e) => setTaskName(e.target.value)}
                    onBlur={() => setUseTaskNameEditMode(false)}
                    className="w-full px-3 py-2 text-2xl font-bold text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            )}

            <div className="border-b border-gray-600 my-4"></div>

            {useEditMode ? memoizedEditor : memoizedMarkdown}

            <div className="border-b border-gray-600 my-4"></div>



            <div className="mt-4 mb-2">
                <h3 className="text-lg font-semibold mb-2">Attached Files:</h3>
                {taskFiles.length > 0 ? (
                    <ul className="space-y-2">
                        {taskFiles.map((taskFile, index) => (
                            <li key={index} className="flex items-center">
                                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                                </svg>
                                <a
                                    href={taskFile.src}
                                    className="text-sm text-gray-700 dark:text-gray-300"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    {taskFile.name}
                                </a>
                                <button
                                    onClick={() => {
                                        appendFile(taskFile.name);
                                    }}
                                    className="ml-2 px-2 py-1 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    +
                                </button>
                                <button
                                    onClick={async () => {
                                        if (window.confirm(`Are you sure you want to delete ${taskFile.name}?`)) {
                                            await attachmentsStorage.deleteFileForTask(card, taskFile.name);
                                            refreshAttachments();
                                        }
                                    }}
                                    className="ml-2 px-2 py-1 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500 italic">No files attached</p>
                )}
            </div>

            {!isReadOnly ? <FileUploader
                onFileUpload={async (file) => {
                    try {
                        const newFileName = await attachmentsStorage.uploadFileForTask(card, file);

                        appendFile(newFileName);

                        refreshAttachments();
                    } catch (error) {
                        console.error('Error uploading file:', error);
                    }
                }}
            /> : null}
        </>
    )
}

export default SharedCardDetailsEditorComponent