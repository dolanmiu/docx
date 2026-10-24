/**
 * Placeholders with spaces inside their delimiters, such as `{{ name }}`, for `patchDocument`'s `trimPlaceholders`.
 *
 * @module
 */
// cspell:ignore descr

import type { XmlElement as Element } from "@util/xml";

import { findDrawings } from "./drawing-patch";
import { replaceTokenInParagraphElement } from "./paragraph-token-replacer";
import { renderParagraphNode } from "./run-renderer";

type Delimiters = { readonly start: string; readonly end: string };

type SpacedPlaceholder = {
    /** Where it starts in the text */
    readonly index: number;
    /** The placeholder as the text has it, such as "{{ name }}" */
    readonly placeholder: string;
    /** The placeholder without the spaces, such as "{{name}}" */
    readonly trimmed: string;
};

/**
 * The first placeholder in a text, from an index on, with spaces inside its delimiters, whose key, without them, is
 * one to patch.
 */
const findSpacedPlaceholder = (
    text: string,
    from: number,
    { start, end }: Delimiters,
    isKey: (key: string) => boolean,
): SpacedPlaceholder | undefined => {
    // Each start is tried, so a delimiter in the text before a placeholder, such as in "{{{ name }}}", doesn't hide it
    for (let index = text.indexOf(start, from); index !== -1; index = text.indexOf(start, index + 1)) {
        const endIndex = text.indexOf(end, index + start.length);
        if (endIndex === -1) {
            return undefined;
        }
        const content = text.slice(index + start.length, endIndex);
        const key = content.trim();
        if (key !== content && isKey(key)) {
            return { index, placeholder: text.slice(index, endIndex + end.length), trimmed: `${start}${key}${end}` };
        }
    }
    return undefined;
};

const trimInText = (text: string, delimiters: Delimiters, isKey: (key: string) => boolean): string => {
    let trimmed = text;
    for (
        let found = findSpacedPlaceholder(trimmed, 0, delimiters, isKey);
        found !== undefined;
        found = findSpacedPlaceholder(trimmed, found.index + found.trimmed.length, delimiters, isKey)
    ) {
        trimmed = `${trimmed.slice(0, found.index)}${found.trimmed}${trimmed.slice(found.index + found.placeholder.length)}`;
    }
    return trimmed;
};

const paragraphsIn = (element: Element): readonly Element[] =>
    (element.elements ?? []).flatMap((child) => [...(child.name === "w:p" ? [child] : []), ...paragraphsIn(child)]);

/**
 * Takes the spaces out of each placeholder in a paragraph whose key is one to patch, even if it is split across runs.
 * The placeholder is left in its first run, as a patch would put its content there.
 */
const trimInParagraph = (paragraph: Element, delimiters: Delimiters, isKey: (key: string) => boolean): void => {
    const render = (): ReturnType<typeof renderParagraphNode> => renderParagraphNode({ element: paragraph, index: 0, parent: undefined });
    for (
        let rendered = render(), found = findSpacedPlaceholder(rendered.text, 0, delimiters, isKey);
        found !== undefined;
        rendered = render(), found = findSpacedPlaceholder(rendered.text, found.index + found.trimmed.length, delimiters, isKey)
    ) {
        replaceTokenInParagraphElement({
            paragraphElement: paragraph,
            renderedParagraph: rendered,
            originalText: found.placeholder,
            replacementText: found.trimmed,
            fromIndex: found.index,
        });
    }
};

/**
 * Takes the spaces inside the delimiters out of the placeholders in a part that patches are for, such as `{{ name }}`
 * for the patch `name`, so the patches find them. Other text is left as it is, even if it looks like a placeholder.
 *
 * @param json - The part, which is changed in place
 * @param delimiters - The placeholders' delimiters
 * @param textKeys - The keys of the patches for placeholders in the text
 * @param tableRowsKeys - The keys of the patches that repeat the rows of a table, whose fields are `{{key.field}}`
 * @param drawingKeys - The keys of the patches for drawings whose alt text holds the placeholder
 */
export const trimPlaceholders = (
    json: Element,
    {
        delimiters,
        textKeys,
        tableRowsKeys,
        drawingKeys,
    }: {
        readonly delimiters: Delimiters;
        readonly textKeys: ReadonlySet<string>;
        readonly tableRowsKeys: readonly string[];
        readonly drawingKeys: ReadonlySet<string>;
    },
): void => {
    const isTextKey = (key: string): boolean =>
        textKeys.has(key) || tableRowsKeys.some((tableRowsKey) => key.startsWith(`${tableRowsKey}.`));
    for (const paragraph of paragraphsIn(json)) {
        trimInParagraph(paragraph, delimiters, isTextKey);
    }

    const isDrawingKey = (key: string): boolean => drawingKeys.has(key);
    for (const { properties } of findDrawings(json)) {
        for (const name of ["descr", "title"]) {
            const text = properties.attributes?.[name];
            if (text !== undefined) {
                properties.attributes![name] = trimInText(String(text), delimiters, isDrawingKey);
            }
        }
    }
};
