/**
 * Helpers for the elements and text of parsed HTML.
 *
 * @module
 */
import type { ChildNode, Element } from "domhandler";

/** Whether a node is an element: `<script>` and `<style>` are elements of their own types */
export const isElement = (node: ChildNode): node is Element => node.type === "tag" || node.type === "script" || node.type === "style";

/** An element's children that are elements */
export const elementsOf = (element: Element): readonly Element[] => element.children.filter(isElement);

/** The text in a node and the elements in it, in order, read without recursion, so no depth of elements is too deep */
export const textOf = (node: ChildNode): string => {
    // eslint-disable-next-line functional/prefer-readonly-type
    const stack: ChildNode[] = [node];
    let text = "";
    while (stack.length > 0) {
        // eslint-disable-next-line functional/immutable-data
        const current = stack.pop()!;
        if (current.type === "text") {
            text += current.data;
        } else if ("children" in current) {
            for (let index = current.children.length - 1; index >= 0; index--) {
                // eslint-disable-next-line functional/immutable-data
                stack.push(current.children[index]);
            }
        }
    }
    return text;
};

/** An element and the elements in it, in order, read without recursion, so no depth of elements is too deep */
export const descendantsOf = (element: Element): readonly Element[] => {
    // eslint-disable-next-line functional/prefer-readonly-type
    const elements: Element[] = [];
    // eslint-disable-next-line functional/prefer-readonly-type
    const stack: Element[] = [element];
    while (stack.length > 0) {
        // eslint-disable-next-line functional/immutable-data
        const current = stack.pop()!;
        // eslint-disable-next-line functional/immutable-data
        elements.push(current);
        const children = elementsOf(current);
        for (let index = children.length - 1; index >= 0; index--) {
            // eslint-disable-next-line functional/immutable-data
            stack.push(children[index]);
        }
    }
    return elements;
};

/** Whether an element has a class */
export const hasClass = (element: Element, name: string): boolean => (element.attribs.class ?? "").split(/\s+/).includes(name);
