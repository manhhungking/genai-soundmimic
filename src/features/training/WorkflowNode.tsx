import { useWorkflowContext } from '@genai-fi/base';
import { useLayoutEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';

type WorkflowNodeProps = HTMLAttributes<HTMLElement> & {
    active?: boolean;
    children: ReactNode;
    nodeId: string;
};

export default function WorkflowNode({ active = true, children, nodeId, ...props }: WorkflowNodeProps) {
    const workflow = useWorkflowContext();
    const ref = useRef<HTMLElement>(null);

    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) return;

        // WorkflowLayout calculates lines from offset coordinates. Cards inside
        // the training data panel have a different offset parent, so register
        // an invisible, absolutely-positioned anchor in the workflow canvas
        // using the element's actual canvas-relative bounds.
        let container = element.parentElement;
        while (container && !Array.from(container.children).some((child) => child.localName === 'svg')) {
            container = container.parentElement;
        }
        if (!container) return workflow.registerElement(nodeId, element);

        if (getComputedStyle(container).position === 'static') container.style.position = 'relative';

        const anchor = document.createElement('span');
        anchor.className = 'workflow-node-anchor';
        anchor.setAttribute('aria-hidden', 'true');
        anchor.setAttribute('data-active', String(active));
        container.appendChild(anchor);

        const updateAnchor = () => {
            const offsetParent = anchor.offsetParent as HTMLElement | null;
            const base = offsetParent ?? container;
            const elementRect = element.getBoundingClientRect();
            const baseRect = base.getBoundingClientRect();
            anchor.style.left = `${elementRect.left - baseRect.left + base.scrollLeft}px`;
            anchor.style.top = `${elementRect.top - baseRect.top + base.scrollTop}px`;
            anchor.style.width = `${elementRect.width}px`;
            anchor.style.height = `${elementRect.height}px`;
        };

        updateAnchor();
        const resizeObserver = new ResizeObserver(updateAnchor);
        resizeObserver.observe(element);
        resizeObserver.observe(container);
        window.addEventListener('resize', updateAnchor);
        const unregister = workflow.registerElement(nodeId, anchor);

        return () => {
            unregister();
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateAnchor);
            anchor.remove();
        };
    }, [active, nodeId, workflow]);

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
