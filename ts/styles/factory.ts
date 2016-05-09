import {Styles} from "./";
import {DocumentDefaults} from "./defaults";
import {ParagraphPropertiesDefaults} from "./defaults/paragraph-properties";
import {RunPropertiesDefaults} from "./defaults/run-properties";
import {Heading1Style} from "./style";
//import {StyleAttributes} from "./style/attributes";
import {ParagraphProperties} from "../docx/paragraph/properties";
import {RunProperties} from "../docx/run/properties";
import {Color} from "../docx/run/formatting";

export class DefaultStylesFactory {
    constructor() {

    }

    newInstance(): Styles {
        var styles = new Styles();
        var paragraphProperties = new ParagraphPropertiesDefaults();
        var runProperties = new RunPropertiesDefaults();
        styles.push(new DocumentDefaults(paragraphProperties, runProperties));

        var heading1ParagraphProperties = new ParagraphProperties();
        var heading1RunProperties = new RunProperties();
        heading1RunProperties.push(new Color("365F91"));
        var heading1Style = new Heading1Style(heading1ParagraphProperties, heading1RunProperties);
        styles.push(heading1Style);

        console.log(JSON.stringify(styles, null, "  "));
        return styles;
    }
}