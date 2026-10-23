// Replace the pictures a template already has: ImagePatch finds each picture whose alt text is a placeholder, such as
// {{photo}}, and gives it a new image, keeping the picture's size, position, wrapping and border. The template is made
// first here, as it would be in Word, where the placeholder goes in the picture's alt text.
// See docs/usage/templates.md.

import * as fs from "fs";
import {
    Document,
    HorizontalPositionAlign,
    HorizontalPositionRelativeFrom,
    ImagePatch,
    ImageRun,
    Packer,
    Paragraph,
    patchDocument,
    PatchType,
    TextRun,
    TextWrappingSide,
    TextWrappingType,
    VerticalPositionRelativeFrom,
} from "docx";

// The template: a placeholder picture floating to the right of the text, with a border, and a placeholder logo
const template = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new ImageRun({
                            type: "gif",
                            data: fs.readFileSync("./demo/assets/images/pizza.gif"),
                            transformation: { width: 60, height: 60 },
                            altText: { name: "Logo", description: "{{logo}}" },
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new ImageRun({
                            type: "gif",
                            data: fs.readFileSync("./demo/assets/images/pizza.gif"),
                            transformation: { width: 200, height: 200 },
                            floating: {
                                horizontalPosition: {
                                    relative: HorizontalPositionRelativeFrom.MARGIN,
                                    align: HorizontalPositionAlign.RIGHT,
                                },
                                verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: 0 },
                                wrap: { type: TextWrappingType.SQUARE, side: TextWrappingSide.LEFT },
                                margins: { left: 114300 },
                            },
                            outline: { type: "solidFill", solidFillType: "rgb", value: "1F4E79", width: 38100 },
                            altText: { name: "Photo", description: "Photo of the pet {{photo}}" },
                        }),
                        new TextRun("{{name}} is looking for a home. "),
                        new TextRun(
                            "The photo floats to the right of this text, with a blue border, as the template's picture did. " +
                                "Only its image and size are new: its position, text wrapping and border are the template's.",
                        ),
                    ],
                }),
            ],
        },
    ],
});

Packer.toBuffer(template)
    .then((data) =>
        patchDocument({
            outputType: "nodebuffer",
            data,
            patches: {
                name: { type: PatchType.PARAGRAPH, children: [new TextRun("Rex")] },
                // The dog is 332 by 300 pixels, so it is given a size with its own proportions, rather than the template's square
                photo: new ImagePatch({
                    type: "png",
                    data: fs.readFileSync("./demo/assets/images/dog.png"),
                    transformation: { width: 221, height: 200 },
                }),
                logo: new ImagePatch({
                    type: "svg",
                    data: fs.readFileSync("./demo/assets/images/linux-svg.svg"),
                    fallback: { type: "png", data: fs.readFileSync("./demo/assets/images/linux-png.png") },
                    transformation: { width: 50, height: 60 },
                    altText: { description: "Our logo" },
                }),
            },
        }),
    )
    .then((doc) => {
        fs.writeFileSync("My Document.docx", doc);
    });
