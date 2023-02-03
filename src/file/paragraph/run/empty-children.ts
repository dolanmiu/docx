import { EmptyElement } from "@file/xml-components";

// <xsd:group name="EG_RunInnerContent">
//         ...
//         <xsd:element name="noBreakHyphen" type="CT_Empty"/>
//         <xsd:element name="softHyphen" type="CT_Empty" minOccurs="0" />
//         <xsd:element name="dayShort" type="CT_Empty" minOccurs="0" />
//         <xsd:element name="monthShort" type="CT_Empty" minOccurs="0" />
//         <xsd:element name="yearShort" type="CT_Empty" minOccurs="0" />
//         <xsd:element name="dayLong" type="CT_Empty" minOccurs="0" />
//         <xsd:element name="monthLong" type="CT_Empty" minOccurs="0" />
//         <xsd:element name="yearLong" type="CT_Empty" minOccurs="0" />
//         <xsd:element name="annotationRef" type="CT_Empty" minOccurs="0" />
//         <xsd:element name="footnoteRef" type="CT_Empty" minOccurs="0" />
//         <xsd:element name="endnoteRef" type="CT_Empty" minOccurs="0" />
//         <xsd:element name="separator" type="CT_Empty" minOccurs="0" />
//         <xsd:element name="continuationSeparator" type="CT_Empty" minOccurs="0" />
//         ...
//         <xsd:element name="pgNum" type="CT_Empty" minOccurs="0" />
//         <xsd:element name="cr" type="CT_Empty" minOccurs="0" />
//         <xsd:element name="tab" type="CT_Empty" minOccurs="0" />
//         ...
//         <xsd:element name="lastRenderedPageBreak" type="CT_Empty" minOccurs="0" maxOccurs="1" />
//     </xsd:choice>
// </xsd:group>

export class NoBreakHyphen extends EmptyElement {
    public constructor() {
        super("w:noBreakHyphen");
    }
}

export class SoftHyphen extends EmptyElement {
    public constructor() {
        super("w:softHyphen");
    }
}

export class DayShort extends EmptyElement {
    public constructor() {
        super("w:dayShort");
    }
}

export class MonthShort extends EmptyElement {
    public constructor() {
        super("w:monthShort");
    }
}

export class YearShort extends EmptyElement {
    public constructor() {
        super("w:yearShort");
    }
}

export class DayLong extends EmptyElement {
    public constructor() {
        super("w:dayLong");
    }
}

export class MonthLong extends EmptyElement {
    public constructor() {
        super("w:monthLong");
    }
}

export class YearLong extends EmptyElement {
    public constructor() {
        super("w:yearLong");
    }
}

export class AnnotationReference extends EmptyElement {
    public constructor() {
        super("w:annotationRef");
    }
}

export class FootnoteReferenceElement extends EmptyElement {
    public constructor() {
        super("w:footnoteRef");
    }
}

export class EndnoteReference extends EmptyElement {
    public constructor() {
        super("w:endnoteRef");
    }
}

export class Separator extends EmptyElement {
    public constructor() {
        super("w:separator");
    }
}

export class ContinuationSeparator extends EmptyElement {
    public constructor() {
        super("w:continuationSeparator");
    }
}

export class PageNumberElement extends EmptyElement {
    public constructor() {
        super("w:pgNum");
    }
}

export class CarriageReturn extends EmptyElement {
    public constructor() {
        super("w:cr");
    }
}

export class Tab extends EmptyElement {
    public constructor() {
        super("w:tab");
    }
}

export class LastRenderedPageBreak extends EmptyElement {
    public constructor() {
        super("w:lastRenderedPageBreak");
    }
}
