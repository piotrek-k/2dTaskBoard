import MDEditor from '@uiw/react-md-editor';
import { useContext, useEffect, useState } from 'react'
import { IAppStorageAccessor } from '../services/FileSystemStorage';
import CustomImageRenderer from './customMarkdownRenderers/CustomImageRenderer';
import Link from './customMarkdownRenderers/Link';
import DataStorageContext from './filesystem/DataStorageContext';
import FileUploader from './FileUploader';
import { WorkUnit } from '../types';
import PlusIcon from '../icons/PlusIcon';

interface Props {
    task: WorkUnit;
    requestSavingDataToStorage: () => Promise<void>;
}

interface TaskFile {
    name: string;
    src: string;
}

function ExtendedMarkdownEditor({ task, requestSavingDataToStorage }: Props) {
    const dataStorageContext = useContext(DataStorageContext) as IAppStorageAccessor;
    const [taskContent, setTaskContent] = useState<string | undefined>('');
    const [useEditMode, setUseEditMode] = useState(false);
    const [taskName, setTaskName] = useState<string>(task.title);
    const [useTaskNameEditMode, setUseTaskNameEditMode] = useState(false);
    const [taskFiles, setTaskFiles] = useState<TaskFile[]>([]);

    useEffect(() => {
        if (dataStorageContext) {
            dataStorageContext.getTaskContent(task.id)
                .then(content => {
                    setTaskContent(content);
                })
                .catch(err => {
                    console.error('Error fetching task content:', err);
                    setTaskContent('Error loading content');
                });
        }
    }, [dataStorageContext]);

    useEffect(() => {
        dataStorageContext.saveTaskContent(task.id, taskContent ?? "");
    }, [taskContent]);

    useEffect(() => {
        (async function () {
            task.title = taskName;

            await requestSavingDataToStorage();
        })();
    }, [taskName]);

    useEffect(() => {
        if (dataStorageContext) {
            const fetchTaskFiles = async () => {
                try {
                    const directory = await dataStorageContext.getDirectoryHandleForTaskAttachments(task.id);
                    const files = await dataStorageContext.getFilesForTask(task.id);

                    const mappedFiles = await Promise.all(files.map(async file => ({
                        name: file.name,
                        src: await dataStorageContext.mapSrcToFileSystem(file.name, directory)
                    })));

                    setTaskFiles(mappedFiles);
                } catch (err) {
                    console.error('Error fetching task files:', err);
                }
            };

            fetchTaskFiles();
        }
    }, [dataStorageContext, task.id]);

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

    return (
        <>
            <div className='flex flex-col'>
                <div className='flex flex-row gap-2'>
                    <div>{task.id}</div>

                    <button
                        onClick={() => {
                            setUseEditMode(!useEditMode)
                        }}
                        className="flex">
                        <PlusIcon />
                        Switch edit mode
                    </button>
                </div>
            </div>

            {!useTaskNameEditMode ? (
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
                    onChange={(e) => setTaskName(e.target.value)}
                    onBlur={() => setUseTaskNameEditMode(false)}
                    className="w-full px-3 py-2 text-2xl font-bold text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            )}

            <div className="border-b border-gray-600 my-4"></div>

            {useEditMode ? (<MDEditor
                value={taskContent}
                onChange={(x) => {
                    setTaskContent(x)
                }}
                previewOptions={{
                    components: {
                        img: (props: any) => <CustomImageRenderer props={props} taskId={task.id} />,
                        a: (props: any) => <Link props={props} taskId={task.id} />
                    }
                }}
                className="min-h-[50vw]"
            />) : (
                <MDEditor.Markdown
                    source={taskContent}
                    components={{
                        img: (props: any) => <CustomImageRenderer props={props} taskId={task.id} />,
                        a: (props: any) => <Link props={props} taskId={task.id} />
                    }}
                    style={{ whiteSpace: 'pre-wrap', backgroundColor: 'inherit' }}
                    className='my-3'
                />
            )}

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
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500 italic">No files attached</p>
                )}
            </div>

            <FileUploader
                onFileUpload={async (file) => {
                    try {
                        let fileHandle = (await dataStorageContext.uploadFileForTask(task.id, file)).fileHandle;

                        appendFile(fileHandle.name);
                    } catch (error) {
                        console.error('Error uploading file:', error);
                    }
                }}
            />
        </>
    )
}

export default ExtendedMarkdownEditor