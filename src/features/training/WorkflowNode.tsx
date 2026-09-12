import { useWorkflowContext } from '@genai-fi/base';
import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';

type WorkflowNodeProps = HTMLAttributes<HTMLElement> & {
    active?: boolean;
    children: ReactNode;
    nodeId: string;
};

export default function WorkflowNode({ active = true, children, nodeId, ...props }: WorkflowNodeProps) {
    const workflow = useWorkflowContext();
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!ref.current) return;
        return workflow.registerElement(nodeId, ref.current);
    }, [nodeId, workflow]);

    return (
        <section
            {...props}
            ref={ref}
            data-active={active}
            data-widget={nodeId}
        >
            {children}
        </section>
    );
}
