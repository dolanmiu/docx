// tslint:disable:object-literal-key-quotes
import { assert } from "chai";

import { ImageParagraph } from "./image";

describe("Image", () => {
    let image: ImageParagraph;

    beforeEach(() => {
        image = new ImageParagraph({
            stream: new Buffer(""),
            path: "",
            fileName: "test.png",
            dimensions: {
                pixels: {
                    x: 10,
                    y: 10,
                },
                emus: {
                    x: 10,
                    y: 10,
                },
            },
        });
    });

    describe("#constructor()", () => {
        it("should create valid JSON", () => {
            const stringifiedJson = JSON.stringify(image);

            try {
                JSON.parse(stringifiedJson);
            } catch (e) {
                assert.isTrue(false);
            }
            assert.isTrue(true);
        });
    });
});
