import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { LatentStyleException } from "./exceptions";
import { LatentStyles } from "./latent-styles";

describe("LatentStyles", () => {
    describe("#constructor()", () => {
        it("should create", () => {
            const currentLatentStyles = new LatentStyles();

            const tree = new Formatter().format(currentLatentStyles);
            expect(tree).to.deep.equal({
                "w:latentStyles": {},
            });
        });

        it("should create with exception", () => {
            const currentLatentStyles = new LatentStyles(new LatentStyleException({}));

            const tree = new Formatter().format(currentLatentStyles);
            expect(tree).to.deep.equal({
                "w:latentStyles": [
                    {
                        "w:lsdException": {
                            _attr: {},
                        },
                    },
                ],
            });
        });
    });
});
