import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { getCodeString } from 'rehype-rewrite';

const randomid = () => parseInt(String(Math.random() * 1e15), 10).toString(36);
const Mermaid = (props: any) => {

    const className = props.props.className || "";
    const children = props.props.children || [];
    const demoid = useRef(`dome${randomid()}`);
    const [container, setContainer] = useState<HTMLElement | null>(null);
    const isMermaid =
        className && /^language-mermaid/.test(className.toLocaleLowerCase());
    const code = children
        ? getCodeString(props.props.node.children)
        : children[0] || "";

    useEffect(() => {
        if (container && isMermaid && demoid.current && code) {
            mermaid
                .render(demoid.current, code)
                .then(({ svg, bindFunctions }) => {
                    container.innerHTML = svg;
                    if (bindFunctions) {
                        bindFunctions(container);
                    }
                })
                .catch((error) => {
                    console.log("error:", error);
                });
        }
    }, [container, isMermaid, code, demoid]);

    const refElement = useCallback((node : HTMLElement) => {
        if (node !== null) {
            setContainer(node);
        }
    }, []);

    if (isMermaid) {
        return (
            <Fragment>
                <code id={demoid.current} style={{ display: "none" }} />
                <code className={className} ref={refElement} data-name="mermaid" />
            </Fragment>
        );
    }
    return <code className={className}>{children}</code>;
};

export default Mermaid;
