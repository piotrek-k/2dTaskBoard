import { Fragment, useCallback, useEffect, useRef, useState, ReactNode } from 'react';
import mermaid from 'mermaid';
import { getCodeString } from 'rehype-rewrite';
import React from 'react';

const randomid = () => parseInt(String(Math.random() * 1e15), 10).toString(36);
type MermaidProps = {
    children?: ReactNode;
    className?: string;
    [key: string]: any;
};

class ErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean }> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    componentDidUpdate(prevProps: { children: ReactNode }) {
        if (prevProps.children !== this.props.children) {
            this.setState({ hasError: false });
        }
    }

    render() {
        if (this.state.hasError) {
            return <div style={{ color: "red" }}>Something went wrong while rendering the Mermaid diagram.</div>;
        }
        return this.props.children;
    }
}

const Mermaid = ({ children = null, className = "", ...props }: MermaidProps) => {
    const demoid = useRef(`dome${randomid()}`);
    const [container, setContainer] = useState<HTMLElement | null>(null);
    const [error, setError] = useState<string | null>(null);
    const isMermaid =
        className && /^language-mermaid/.test(className.toLocaleLowerCase());
    const code = children
        ? getCodeString(props.node.children)
        : (Array.isArray(children) ? children[0] : children) || "";

    useEffect(() => {
        if (container && isMermaid && demoid.current && code) {
            const renderMermaid = async () => {
                try {
                    if (await mermaid.parse(code)) {
                        const { svg, bindFunctions } = await mermaid.render(demoid.current, code);
                        if (container) {
                            container.innerHTML = svg;
                            setError(null);
                            if (bindFunctions) {
                                bindFunctions(container);
                            }
                        }
                    } else {
                        setError("Could not render the diagram. Incorrect syntax.");
                    }
                } catch (error) {
                    console.error("Mermaid rendering error:", error);
                    setError("Could not render the diagram. Incorrect syntax.");
                }
            };
            renderMermaid();
        }

        return () => {
            if (container) {
                container.innerHTML = "";
            }
        };
    }, [container, isMermaid, code, demoid]);

    const refElement = useCallback((node: HTMLElement) => {
        if (node !== null) {
            setContainer(node);
        }
    }, []);

    if (isMermaid) {
        return (
            <Fragment>
                <ErrorBoundary>
                    {error && <div style={{ color: "red" }}>{error}</div>}
                    <code id={demoid.current} style={{ display: "none" }} />
                    {!error && (
                        <code className={className} ref={refElement} data-name="mermaid" />
                    )}
                </ErrorBoundary>
            </Fragment>
        );
    }
    return <code className={className}>{children}</code>;
};

export default Mermaid;
