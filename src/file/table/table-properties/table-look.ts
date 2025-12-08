// http://officeopenxml.com/WPtblLook.php
// <xsd:complexType name="CT_TblLook">
//     <xsd:attribute name="firstRow" type="s:ST_OnOff"/>
//     <xsd:attribute name="lastRow" type="s:ST_OnOff"/>
//     <xsd:attribute name="firstColumn" type="s:ST_OnOff"/>
//     <xsd:attribute name="lastColumn" type="s:ST_OnOff"/>
//     <xsd:attribute name="noHBand" type="s:ST_OnOff"/>
//     <xsd:attribute name="noVBand" type="s:ST_OnOff"/>
// </xsd:complexType>
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

export type ITableLookOptions = {
    readonly firstRow?: boolean;
    readonly lastRow?: boolean;
    readonly firstColumn?: boolean;
    readonly lastColumn?: boolean;
    readonly noHBand?: boolean;
    readonly noVBand?: boolean;
};

class TableLookAttributes extends XmlAttributeComponent<ITableLookOptions> {
    protected readonly xmlKeys = {
        firstRow: "w:firstRow",
        lastRow: "w:lastRow",
        firstColumn: "w:firstColumn",
        lastColumn: "w:lastColumn",
        noHBand: "w:noHBand",
        noVBand: "w:noVBand",
    };
}

export class TableLook extends XmlComponent {
    public constructor(options: ITableLookOptions) {
        super("w:tblLook");
        this.root.push(new TableLookAttributes(options));
    }
}
