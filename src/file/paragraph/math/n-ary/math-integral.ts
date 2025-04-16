import { XmlComponent } from "@file/xml-components";

import { MathComponent } from "../math-component";
import { createMathBase } from "./math-base";
import { createMathNAryProperties } from "./math-n-ary-properties";
import { createMathSubScriptElement } from "./math-sub-script";
import { createMathSuperScriptElement } from "./math-super-script";

export type IMathIntegralOptions = {
    readonly children: readonly MathComponent[];
    readonly subScript?: readonly MathComponent[];
    readonly superScript?: readonly MathComponent[];
};

export class MathIntegral extends XmlComponent {
    public constructor(options: IMathIntegralOptions) {
        super("m:nary");

        this.root.push(
            createMathNAryProperties({
                accent: "",
                hasSuperScript: !!options.superScript,
                hasSubScript: !!options.subScript,
                limitLocationVal: "subSup",
            }),
        );

        if (!!options.subScript) {
            this.root.push(createMathSubScriptElement({ children: options.subScript }));
        }

        if (!!options.superScript) {
            this.root.push(createMathSuperScriptElement({ children: options.superScript }));
        }

        this.root.push(createMathBase({ children: options.children }));
    }
}
