/**
 * Lists: the numbers and bullets of `list-style-type`, and the numbering of lists' items in Word.
 *
 * Each HTML list is numbered on its own, from its start, so each is given a numbering definition of its own, which its
 * paragraphs bring with them into the document. A list in an item of another is a deeper level of the other's
 * definition, as Word's own lists are, so its numbers start again after each of the other's items, as in HTML. When
 * that can't be so, such as for a second list in one item, or a list whose numbers differ from those the level already
 * has, it is given a definition of its own.
 *
 * @module
 */
import { AlignmentType, LevelFormat, type NumberingDefinition } from "docx";

import type { Block, ListItem, ListLevel, ParagraphBlock } from "./content";

/** How far each level of a list is indented, in twips: half an inch, as in Word */
export const LIST_INDENT = 720;
/** How far a list item's first line hangs out from its other lines, for its number or bullet, in twips */
export const HANGING = 360;
/** The deepest level of a list in Word */
export const DEEPEST_LEVEL = 8;

// The bullets of list-style-type's bullet keywords
const BULLETS: ReadonlyMap<string, string> = new Map([
    ["disc", "•"],
    ["circle", "◦"],
    ["square", "▪"],
    ["disclosure-closed", "▸"],
    ["disclosure-open", "▾"],
    ["none", ""],
]);

type Format = ListLevel["format"];

// The number formats of list-style-type's keywords, of those Word has
const NUMBERS: ReadonlyMap<string, Format> = new Map([
    ["decimal", LevelFormat.DECIMAL],
    ["decimal-leading-zero", LevelFormat.DECIMAL_ZERO],
    ["lower-roman", LevelFormat.LOWER_ROMAN],
    ["upper-roman", LevelFormat.UPPER_ROMAN],
    ["lower-alpha", LevelFormat.LOWER_LETTER],
    ["lower-latin", LevelFormat.LOWER_LETTER],
    ["upper-alpha", LevelFormat.UPPER_LETTER],
    ["upper-latin", LevelFormat.UPPER_LETTER],
    ["cjk-decimal", LevelFormat.IDEOGRAPH__DIGITAL],
    ["cjk-ideographic", LevelFormat.TAIWANESE_COUNTING],
    ["trad-chinese-informal", LevelFormat.TAIWANESE_COUNTING],
    ["japanese-informal", LevelFormat.JAPANESE_COUNTING],
    ["japanese-formal", LevelFormat.JAPANESE_LEGAL],
    ["katakana", LevelFormat.AIUEO_FULL_WIDTH],
    ["hiragana", LevelFormat.AIUEO_FULL_WIDTH],
    ["katakana-iroha", LevelFormat.IROHA_FULL_WIDTH],
    ["hiragana-iroha", LevelFormat.IROHA_FULL_WIDTH],
    ["korean-hangul-formal", LevelFormat.GANADA],
    ["hangul", LevelFormat.GANADA],
    ["hangul-consonant", LevelFormat.CHOSUNG],
    ["cjk-earthly-branch", LevelFormat.IDEOGRAPH_ZODIAC],
    ["cjk-heavenly-stem", LevelFormat.IDEOGRAPH_TRADITIONAL],
]);

// The bullets of a list in a list, and of one in that, and so on, as a browser has them
const NESTED_BULLETS = ["•", "◦", "▪"];
// The numbers of a numbered list's deeper levels, as Word has them
const NESTED_NUMBERS: readonly Format[] = [LevelFormat.DECIMAL, LevelFormat.LOWER_LETTER, LevelFormat.LOWER_ROMAN];

/**
 * The level of a list with a `list-style-type`, at a depth: a bullet, a string such as `"→ "`, or a number, with a
 * full stop after it. A number format Word doesn't have, such as `lower-greek`, is decimal.
 *
 * @param listStyleType - The list's `list-style-type`, or undefined for a list that has none, which has bullets
 * @param depth - How deep in lists the list is, from 0
 * @param start - The number its first item has
 */
export const listLevelOf = (listStyleType: string | undefined, depth: number, start: number): ListLevel => {
    const type = listStyleType ?? "disc";
    const quoted = /^(["'])([^]*)\1$/.exec(type);
    if (quoted) {
        return { format: LevelFormat.BULLET, text: quoted[2], start: 1 };
    }
    const bullet = BULLETS.get(type);
    return bullet !== undefined
        ? { format: LevelFormat.BULLET, text: bullet, start: 1 }
        : { format: NUMBERS.get(type) ?? LevelFormat.DECIMAL, text: `%${depth + 1}.`, start: Math.max(start, 0) };
};

/** The level Word is given for a depth no list of a definition is at, so the definition has every level */
const defaultLevel = (bullets: boolean, depth: number): ListLevel =>
    bullets
        ? { format: LevelFormat.BULLET, text: NESTED_BULLETS[Math.min(depth, 2)], start: 1 }
        : { format: NESTED_NUMBERS[depth % 3], text: `%${depth + 1}.`, start: 1 };

const sameLevel = (a: ListLevel, b: ListLevel): boolean => a.format === b.format && a.text === b.text && a.start === b.start;

/** A numbering definition being made, with the lists at each of its levels, and which have had items under the last item above */
type Definition = {
    // eslint-disable-next-line functional/prefer-readonly-type
    readonly levels: Map<number, ListLevel>;
    /** The levels that have had items since the last item at the level above them */
    // eslint-disable-next-line functional/prefer-readonly-type
    readonly used: Set<number>;
};

// Each definition docx/html makes has a reference no other has, in any document
let definitions = 0;

/** The list paragraphs' numbering: each one's definition and level */
export type ListNumbering = ReadonlyMap<ParagraphBlock, { readonly reference: NumberingDefinition; readonly level: number }>;

/**
 * Gives the items of the lists in blocks their numbering definitions and levels, in order. Blocks in table cells are
 * numbered on their own, as their lists are apart from those around the table.
 */
export const numberLists = (blocks: readonly Block[]): ListNumbering => {
    // The list at each depth that items are in, and its definition, or undefined at a depth an item skipped over
    let open: readonly ({ readonly list: object; readonly definition: Definition } | undefined)[] = [];
    const items = blocks.filter(
        (block): block is ParagraphBlock & { readonly item: ListItem } => block.type === "paragraph" && !!block.item,
    );
    const assigned = items.map((block) => {
        const { depth, level, list } = block.item;
        const current = open[depth];
        let definition: Definition;
        if (current && current.list === list) {
            ({ definition } = current);
        } else {
            // A list in an item of another is a level of its definition, if the level is free for it
            const parent = open[depth - 1]?.definition;
            const levelOfParent = parent?.levels.get(depth);
            definition =
                parent && !parent.used.has(depth) && (levelOfParent === undefined || sameLevel(levelOfParent, level))
                    ? parent
                    : { levels: new Map(), used: new Set() };
            // eslint-disable-next-line functional/immutable-data
            definition.levels.set(depth, level);
        }
        open = [
            ...open.slice(0, depth),
            ...Array.from({ length: Math.max(depth - open.length, 0) }, () => undefined),
            { list, definition },
        ];
        // An item starts its definition's deeper levels again
        for (const used of [...definition.used]) {
            if (used > depth) {
                // eslint-disable-next-line functional/immutable-data
                definition.used.delete(used);
            }
        }
        // eslint-disable-next-line functional/immutable-data
        definition.used.add(depth);
        return { block, definition, depth };
    });

    const references = new Map(
        [...new Set(assigned.map(({ definition }) => definition))].map((definition) => {
            const [first] = [...definition.levels.values()];
            const bullets = first.format === LevelFormat.BULLET;
            definitions++;
            const reference: NumberingDefinition = {
                reference: `docx-html-list-${definitions}`,
                levels: Array.from({ length: DEEPEST_LEVEL + 1 }, (_, level) => {
                    const { format, text, start } = definition.levels.get(level) ?? defaultLevel(bullets, level);
                    return {
                        level,
                        format,
                        text,
                        start,
                        alignment: AlignmentType.LEFT,
                        style: { paragraph: { indent: { left: LIST_INDENT * (level + 1), hanging: HANGING } } },
                    };
                }),
            };
            return [definition, reference] as const;
        }),
    );
    return new Map(assigned.map(({ block, definition, depth }) => [block, { reference: references.get(definition)!, level: depth }]));
};
