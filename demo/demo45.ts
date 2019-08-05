import * as fs from "fs";
import { Document, Packer, Paragraph, TextRun } from "../build";

const doc = new Document();

const header = doc.Header.createTable(1, 3)
  // @ts-ignore
  header.properties.root[1] = []

   header.getCell(0, 2).addParagraph(
    new Paragraph()
      .addRun(
        new TextRun('W.P. 660')
          .color('red')
          .bold()
          .size(12 * 2)
          .font('Garamond')
          .highlight('yellow')
      )
      .right()
  )

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
