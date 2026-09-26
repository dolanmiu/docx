/**
 * Small helpers for reading and changing a template's XML, as `patchDocument` parses it (xml-js elements). Changes make
 * new elements rather than changing the template's, and keep its text, comments and elements they don't know.
 *
 * @module
 */
import type { Element } from "xml-js";

/**
 * An element's name, such as "c:ser", or "" for text and comments, which have none.
 */
export const nameOf = (element: Element): string => element.name ?? "";

/**
 * The child elements of an element, without its text and comments.
 */
export const elementsOf = (element: Element | undefined): readonly Element[] =>
    (element?.elements ?? []).filter((child) => child.type === "element");

/**
 * The child elements with a name, such as each `c:ser` of a `c:barChart`.
 */
export const childrenOf = (element: Element | undefined, name: string): readonly Element[] =>
    elementsOf(element).filter((child) => child.name === name);

/**
 * The first child element with a name.
 */
export const childOf = (element: Element | undefined, name: string): Element | undefined =>
    elementsOf(element).find((child) => child.name === name);

/**
 * Every element under an element with a name, in document order.
 */
export const descendantsOf = (element: Element | undefined, name: string): readonly Element[] =>
    elementsOf(element).flatMap((child) => [...(child.name === name ? [child] : []), ...descendantsOf(child, name)]);

/**
 * An attribute's value, as text.
 */
export const attributeOf = (element: Element | undefined, name: string): string | undefined => {
    const value = element?.attributes?.[name];
    return value === undefined ? undefined : String(value);
};

/**
 * An element's `val` attribute, such as "col" for `<c:barDir val="col"/>`.
 */
export const valueOf = (element: Element | undefined): string | undefined => attributeOf(element, "val");

/**
 * An element's `val` attribute as a whole number, or undefined if it has none, as in `<c:idx val="2"/>`.
 */
export const numberOf = (element: Element | undefined): number | undefined => {
    const value = Number(valueOf(element));
    return valueOf(element)?.trim() && Number.isInteger(value) ? value : undefined;
};

/**
 * An element's text, and its children's.
 */
export const textOf = (element: Element | undefined): string =>
    (element?.elements ?? [])
        .map((child) => {
            if (child.type === "text") {
                return String(child.text ?? "");
            }
            if (child.type === "cdata") {
                return String(child.cdata ?? "");
            }
            return child.type === "element" ? textOf(child) : "";
        })
        .join("");

/**
 * A copy of an element, which can be changed without changing it.
 */
export const copyOf = (element: Element): Element => JSON.parse(JSON.stringify(element)) as Element;

/**
 * An element with other children.
 */
export const withChildren = (element: Element, children: readonly Element[]): Element => ({ ...element, elements: [...children] });

/**
 * An element with its children changed: each is replaced by what the function gives, which can be none or several.
 * Text and comments are kept.
 */
export const mapChildren = (element: Element, change: (child: Element) => readonly Element[]): Element =>
    withChildren(
        element,
        (element.elements ?? []).flatMap((child) => (child.type === "element" ? change(child) : [child])),
    );

/**
 * An element without the child elements a test picks.
 */
export const withoutChildren = (element: Element, remove: (child: Element) => boolean): Element =>
    mapChildren(element, (child) => (remove(child) ? [] : [child]));

/**
 * An element with other attributes, which are added to or replace its own. An undefined value removes the attribute.
 */
export const withAttributes = (element: Element, attributes: Readonly<Record<string, string | number | undefined>>): Element => {
    const all = { ...element.attributes, ...attributes };
    return {
        ...element,
        attributes: Object.fromEntries(
            Object.entries(all).flatMap(([name, value]) => (value === undefined ? [] : [[name, value] as const])),
        ),
    };
};

/**
 * An element with a child in its place in the schema's order: in place of its child of the same name, or before its
 * first child that comes after it. Children the order doesn't name keep their places.
 *
 * @param order - The names of the element's children, in the schema's order, which includes the child's name
 */
export const withChild = (element: Element, child: Element, order: readonly string[]): Element => {
    const children = element.elements ?? [];
    const same = children.findIndex((existing) => existing.type === "element" && existing.name === child.name);
    if (same !== -1) {
        return withChildren(
            element,
            children.map((existing, index) => (index === same ? child : existing)),
        );
    }
    const rank = order.indexOf(nameOf(child));
    const next = children.findIndex((existing) => existing.type === "element" && order.indexOf(nameOf(existing)) > rank);
    return withChildren(element, next === -1 ? [...children, child] : [...children.slice(0, next), child, ...children.slice(next)]);
};

/**
 * A new element.
 */
export const createXmlElement = (
    name: string,
    attributes: Readonly<Record<string, string | number>> = {},
    children: readonly Element[] = [],
): Element => ({
    type: "element",
    name,
    ...(Object.keys(attributes).length > 0 ? { attributes: { ...attributes } } : {}),
    ...(children.length > 0 ? { elements: [...children] } : {}),
});
