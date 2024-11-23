import React, { useEffect, useRef, RefObject } from "react";
import MDEditor, { MDEditorProps } from "@uiw/react-md-editor";

const CustomMDEditor: React.FC<MDEditorProps> = (props) => {

    const editorRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const editor = editorRef.current;

        if (editor) {
            const textarea = editor.querySelector<HTMLTextAreaElement>("textarea");
            const buttons = editor.querySelectorAll<HTMLButtonElement>("button");

            if (textarea) {
                textarea.tabIndex = 0;
            }

            if (buttons.length) {
                buttons.forEach((button, index) => {
                    button.tabIndex = -1;
                });
            }
        }
    }, []);

    return (
        <div ref={editorRef}>
            <MDEditor {...props} />
        </div>
    );
};

export default CustomMDEditor;
