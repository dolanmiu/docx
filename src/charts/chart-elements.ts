/**
 * Small builders for the elements charts are written with.
 *
 * @module
 */
import { BuilderElement, StringContainer, type XmlComponent } from "docx";

type AttributeValue = string | number | undefined;

/**
 * An element with its attributes, in the order given, and its children. Undefined attributes are left out.
 */
export const createElement = (
    name: string,
    attributes: Readonly<Record<string, AttributeValue>> = {},
    children: readonly XmlComponent[] = [],
): XmlComponent => {
    const given = Object.entries(attributes).flatMap(([key, value]) => (value === undefined ? [] : [[key, { key, value }] as const]));
    return new BuilderElement<Record<string, string | number>>({
        name,
        attributes: given.length === 0 ? undefined : Object.fromEntries(given),
        children,
    });
};

/**
 * An element whose value is its `val` attribute, such as `<c:gapWidth val="219"/>`. A boolean is written as 1 or 0, as
 * Office writes them, since Office doesn't always read a missing `val` as the schema's default.
 */
export const createValue = (name: string, value: string | number | boolean): XmlComponent =>
    createElement(name, { val: typeof value === "boolean" ? Number(value) : value });

/**
 * An element that holds text, such as `<c:v>Sales</c:v>`.
 */
export const createText = (name: string, text: string): XmlComponent => new StringContainer(name, text);
