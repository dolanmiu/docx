// http://www.datypic.com/sc/ooxml/e-w_footnotePr-2.html
import { NumberValueElement, XmlComponent } from "@file/xml-components";
import { FootnotePositioningLocationType, FootnoteRestartLocationType } from "@file/shared/footnote-properties";
import { NumberFormat } from "@file/shared/number-format";
import { FootnoteNumberingRestart } from "./footnote-restart";
import { FootnotePositioningLocation } from "./footnote-positioning";
import { FootnoteNumberingFormat } from "./footnote-format";

export interface IFootnoteProperties {
    readonly restartLocation?: FootnoteRestartLocationType;
    readonly positioningLocation?: FootnotePositioningLocationType;
    readonly numberFormat?:  (typeof NumberFormat)[keyof typeof NumberFormat];
    readonly startingNumber?: number;
}

export class FootnoteProperties extends XmlComponent {
    public constructor(options: IFootnoteProperties) {
        super("w:footnotePr");

        if (options.restartLocation !== undefined) {
            this.root.push(new FootnoteNumberingRestart(options.restartLocation));
        }

        if (options.positioningLocation !== undefined) {
            this.root.push(new FootnotePositioningLocation(options.positioningLocation));
        }

        if (options.numberFormat !== undefined) {
            this.root.push(new FootnoteNumberingFormat(options.numberFormat));
        }

        if (options.startingNumber !== undefined) {
            this.root.push(new NumberValueElement('w:numStart', options.startingNumber));
        }
    }
}
