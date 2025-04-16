// http://www.datypic.com/sc/ooxml/e-m_dPr-1.html
import { BuilderElement, XmlComponent } from "@file/xml-components";

import { createMathBeginningCharacter } from "./math-beginning-character";
import { createMathEndingCharacter } from "./math-ending-char";

type MathBracketPropertiesOptions = { readonly characters?: { readonly beginningCharacter: string; readonly endingCharacter: string } };

export const createMathBracketProperties = ({ characters }: MathBracketPropertiesOptions): XmlComponent =>
    new BuilderElement({
        name: "m:dPr",
        children: !!characters
            ? [
                  createMathBeginningCharacter({ character: characters.beginningCharacter }),
                  createMathEndingCharacter({ character: characters.endingCharacter }),
              ]
            : [],
    });
