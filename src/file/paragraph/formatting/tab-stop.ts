// http://officeopenxml.com/WPtab.php
import { BuilderElement, XmlComponent } from "@file/xml-components";

export type TabStopDefinition = {
    readonly type: (typeof TabStopType)[keyof typeof TabStopType];
    readonly position: number | (typeof TabStopPosition)[keyof typeof TabStopPosition];
    readonly leader?: (typeof LeaderType)[keyof typeof LeaderType];
};

export const TabStopType = {
    LEFT: "left",
    RIGHT: "right",
    CENTER: "center",
    BAR: "bar",
    CLEAR: "clear",
    DECIMAL: "decimal",
    END: "end",
    NUM: "num",
    START: "start",
} as const;

export const LeaderType = {
    DOT: "dot",
    HYPHEN: "hyphen",

    MIDDLE_DOT: "middleDot",
    NONE: "none",
    UNDERSCORE: "underscore",
} as const;

export const TabStopPosition = {
    MAX: 9026,
} as const;

export const createTabStopItem = ({ type, position, leader }: TabStopDefinition): XmlComponent =>
    new BuilderElement<{
        readonly val: (typeof TabStopType)[keyof typeof TabStopType];
        readonly pos: string | number;
        readonly leader?: (typeof LeaderType)[keyof typeof LeaderType];
    }>({
        name: "w:tab",
        attributes: {
            val: { key: "w:val", value: type },
            pos: { key: "w:pos", value: position },
            leader: { key: "w:leader", value: leader },
        },
    });

export const createTabStop = (tabDefinitions: readonly TabStopDefinition[]): XmlComponent =>
    new BuilderElement({
        name: "w:tabs",
        children: tabDefinitions.map((tabDefinition) => createTabStopItem(tabDefinition)),
    });
