import * as JSZip from "jszip";
import * as fastXmlParser from "fast-xml-parser";
import { convertToXmlComponent, parseOptions, ImportedXmlComponent } from "file/xml-components";

export class ImportDocx {

    constructor() {
    }

    read(data) : Promise<any> {
        return new Promise((resolve) => {
            JSZip.loadAsync(data).then((zipContent) => {
                let headerContent = zipContent['files']['word/header2.xml'];
                
                headerContent.async('text').then((xmlData : string) => {
                    console.log('\n\n-------\n\n');
                    console.log('headerContent', JSON.stringify(xmlData, null, 2));
                    console.log('\n\n-------\n\n');
                    const jsonObj = fastXmlParser.parse(xmlData, parseOptions);
                    let xmlComp = convertToXmlComponent('w:hdr', jsonObj['w:hdr']) as ImportedXmlComponent;
                    resolve(xmlComp);
                }) 
            });
        })
    }
}

