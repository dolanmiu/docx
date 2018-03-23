/* tslint:disable:typedef space-before-function-paren */
import * as fs from "fs";
import * as os from 'os';
import { expect } from "chai";

import { File, Paragraph } from "../../file";
import {Compiler} from './compiler';
import * as jszip from 'jszip';

async function getDocxXmlFileContent(filePath: string, xmlFileName: string): Promise<any> {
    let zipFile = fs.readFileSync(filePath);
    const zipData = await jszip.loadAsync(zipFile).then(zip => zip);
    return zipData.files[xmlFileName].async('text');
}

describe("compiler", () => {
    let compiler: Compiler;
    let file: File;
    let externalStyles: string;

    beforeEach(() => {
        file = new File({
            creator: "Dolan Miu",
            revision: "1",
            lastModifiedBy: "Dolan Miu",
        });
        const paragraph = new Paragraph("test text");
        const heading = new Paragraph("Hello world").heading1();
        file.addParagraph(new Paragraph("title").title());
        file.addParagraph(heading);
        file.addParagraph(new Paragraph("heading 2").heading2());
        file.addParagraph(paragraph);

        file.Styles.createParagraphStyle("testStyle").basedOn("Normal").bold();
        
        externalStyles = "Some external styles";
        file.setExternalStyles(externalStyles);

        compiler = new Compiler(file);
    });

    describe("#compile()", () => {
        
        it("should use document styles when they are no external styles provided", async function() {
            file.setExternalStyles('');
            const filePath = `${os.tmpdir()}/test-compile.zip`;
            let stream = fs.createWriteStream(filePath);
            
            await compiler.compile(stream);
            
            const styles = await getDocxXmlFileContent(filePath, 'word/styles.xml')
            expect(styles).not.to.equal(externalStyles);
        });

        it("should use provided external styles", async function() {
            const filePath = `${os.tmpdir()}/test-compile.zip`;
            let stream = fs.createWriteStream(filePath);
            
            await compiler.compile(stream);
            
            const styles = await getDocxXmlFileContent(filePath, 'word/styles.xml')
            expect(styles).to.equal(externalStyles);
        });
    });
});
