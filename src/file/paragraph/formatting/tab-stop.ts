// http://officeopenxml.com/WPtab.php
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

export interface TabStopDefinition {
    type: TabStopType, 
    position: number | TabStopPosition, 
    leader?: LeaderType
}    

export class TabStop extends XmlComponent {
    public constructor(tabDefs: (TabStopDefinition[] | TabStopDefinition | TabStopType), position?: number, leader?: LeaderType)  {
        super("w:tabs");
        if (typeof tabDefs === "string"){
            this.root.push(new TabStopItem(tabDefs, position, leader));
        } else {
            if (Array.isArray(tabDefs)) {
                tabDefs.forEach((function(tabDef) {
                    this.root.push(new TabStopItem(tabDef));
                }).bind(this));
            } else {
                this.root.push(new TabStopItem(tabDefs));
            }
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
    public constructor(tabDef: (TabStopDefinition |  TabStopType), position?: number, leader?: LeaderType) {
        super("w:tab");
        if (typeof tabDef === "string") {
            if (typeof position === "number")
                this.root.push(
                    new TabAttributes({
                        val: tabDef,
                        pos: position,
                        leader,
                    }),
                );
            else throw Error("Undefined position: " + position);
        } else {
            this.root.push(
                new TabAttributes({
                    val: tabDef.type,
                    pos: tabDef.position,
                    leader: tabDef.leader,
                })
            );
        }
    }
}
