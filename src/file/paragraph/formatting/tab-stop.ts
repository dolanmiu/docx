// http://officeopenxml.com/WPtab.php
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

export interface TabStopDefinition {
    type: TabStopType, 
    position: number | TabStopPosition, 
    leader?: LeaderType
}    

export class TabStop extends XmlComponent {
    public constructor(tabDefs: (TabStopDefinition[] | TabStopDefinition))  {
        super("w:tabs");
        if (Array.isArray(tabDefs)) {
            tabDefs.forEach((function(tabDef) {
                this.root.push(new TabStopItem(tabDef));
            }).bind(this));
        } else {
            this.root.push(new TabStopItem(tabDefs));
        }
    }
}

export enum TabStopType {
    LEFT = "left",
    RIGHT = "right",
    CENTER = "center",
    BAR = "bar",
    CLEAR = "clear",
    DECIMAL = "decimal",
    END = "end",
    NUM = "num",
    START = "start",
}

export enum LeaderType {
    DOT = "dot",
    HYPHEN = "hyphen",
    MIDDLE_DOT = "middleDot",
    NONE = "none",
    UNDERSCORE = "underscore",
}

export enum TabStopPosition {
    MAX = 9026,
}

export class TabAttributes extends XmlAttributeComponent<{
    readonly val: TabStopType;
    readonly pos: string | number;
    readonly leader?: LeaderType;
}> {
    protected readonly xmlKeys = { val: "w:val", pos: "w:pos", leader: "w:leader" };
}

export class TabStopItem extends XmlComponent {
    public constructor(tabDef: TabStopDefinition) {
        super("w:tab");
        this.root.push(
            new TabAttributes({
                val: tabDef.type,
                pos: tabDef.position,
                leader: tabDef.leader,
            })
        );
    }
}
