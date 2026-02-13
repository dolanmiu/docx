/**
 * Tab stop module for WordprocessingML documents.
 *
 * This module provides tab stop definitions for paragraphs.
 *
 * Reference: http://officeopenxml.com/WPtab.php
 *
 * @module
 */
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

/**
 * Definition for a single tab stop.
 *
 * @see {@link TabStop}
 */
export type TabStopDefinition = {
    readonly type: (typeof TabStopType)[keyof typeof TabStopType];
    readonly position: number | (typeof TabStopPosition)[keyof typeof TabStopPosition];
    readonly leader?: (typeof LeaderType)[keyof typeof LeaderType];
};

/**
 * Represents a collection of tab stops in a WordprocessingML document.
 *
 * Tab stops define the positions where text will align when a tab character is used.
 *
 * Reference: http://officeopenxml.com/WPtab.php
 */
export class TabStop extends XmlComponent {
    public constructor(tabDefinitions: readonly TabStopDefinition[]) {
        super("w:tabs");

        for (const tabDefinition of tabDefinitions) {
            this.root.push(new TabStopItem(tabDefinition));
        }
    }
}

/**
 * Tab stop alignment types.
 *
 * Specifies the type of tab stop and how text aligns to it.
 */
export const TabStopType = {
    /** Left-aligned tab stop */
    LEFT: "left",
    /** Right-aligned tab stop */
    RIGHT: "right",
    /** Center-aligned tab stop */
    CENTER: "center",
    /** Bar tab stop - inserts a vertical bar at the position */
    BAR: "bar",
    /** Clears a tab stop at the specified position */
    CLEAR: "clear",
    /** Decimal-aligned tab stop - aligns on decimal point */
    DECIMAL: "decimal",
    /** End-aligned tab stop (right-to-left equivalent) */
    END: "end",
    /** List tab stop for numbered lists */
    NUM: "num",
    /** Start-aligned tab stop (left-to-right equivalent) */
    START: "start",
} as const;

/**
 * Tab stop leader character types.
 *
 * Specifies the character used to fill the space before the tab stop.
 */
export const LeaderType = {
    /** Dot leader (....) */
    DOT: "dot",
    /** Hyphen leader (----) */
    HYPHEN: "hyphen",
    /** Middle dot leader (····) */
    MIDDLE_DOT: "middleDot",
    /** No leader */
    NONE: "none",
    /** Underscore leader (____) */
    UNDERSCORE: "underscore",
} as const;

/**
 * Predefined tab stop positions.
 */
export const TabStopPosition = {
    /** Maximum tab stop position (right margin) */
    MAX: 9026,
} as const;

/**
 * Attributes for a tab stop element.
 * @internal
 */
export class TabAttributes extends XmlAttributeComponent<{
    readonly val: (typeof TabStopType)[keyof typeof TabStopType];
    readonly pos: string | number;
    readonly leader?: (typeof LeaderType)[keyof typeof LeaderType];
}> {
    protected readonly xmlKeys = { val: "w:val", pos: "w:pos", leader: "w:leader" };
}

/**
 * Represents a single tab stop item in a WordprocessingML document.
 *
 * Reference: http://officeopenxml.com/WPtab.php
 */
export class TabStopItem extends XmlComponent {
    public constructor({ type, position, leader }: TabStopDefinition) {
        super("w:tab");
        this.root.push(
            new TabAttributes({
                val: type,
                pos: position,
                leader: leader,
            }),
        );
    }
}
