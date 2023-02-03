import { ConcreteNumbering } from "@file/numbering";

export class NumberingReplacer {
    public replace(xmlData: string, concreteNumberings: readonly ConcreteNumbering[]): string {
        let currentXmlData = xmlData;

        for (const concreteNumbering of concreteNumberings) {
            currentXmlData = currentXmlData.replace(
                new RegExp(`{${concreteNumbering.reference}-${concreteNumbering.instance}}`, "g"),
                concreteNumbering.numId.toString(),
            );
        }

        return currentXmlData;
    }
}
