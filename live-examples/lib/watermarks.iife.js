var docxWatermarks = (function(exports, docx) {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	//#region src/watermarks/vml/pict.ts
	/**
	* The picture element (`w:pict`) that holds a watermark's VML shape type and shape.
	*
	* @module
	*/
	/**
	* Creates a `w:pict` element holding VML content, such as a `v:shapetype` followed by the `v:shape` that uses it.
	*
	* ```xml
	* <w:pict><v:shapetype .../><v:shape .../></w:pict>
	* ```
	*/
	var createPict = ({ children }) => new docx.BuilderElement({
		name: "w:pict",
		children
	});
	//#endregion
	//#region src/watermarks/vml/vml-values.ts
	/**
	* Converts a boolean into the VML `t`/`f` representation.
	*
	* Undefined values are passed through so that optional attributes are omitted
	* from the generated XML.
	*
	* @param value - The boolean to convert
	* @returns `"t"` for true, `"f"` for false, or `undefined` when no value was given
	*
	* @example
	* ```typescript
	* vmlTrueFalse(true); // "t"
	* vmlTrueFalse(false); // "f"
	* vmlTrueFalse(undefined); // undefined
	* ```
	*/
	var vmlTrueFalse = (value) => value === void 0 ? void 0 : value ? "t" : "f";
	/**
	* Normalizes a colour for VML colour attributes (ST_ColorType).
	*
	* VML accepts either a named colour (`silver`, `red`, ...) or a hex triplet
	* prefixed with `#`. Hex values are accepted with or without the leading `#`
	* and are always emitted with it so that Word does not mistake them for
	* colour names. Any other value is passed through unchanged.
	*
	* @param value - A named colour, or a 6-digit hex colour with or without `#`
	* @returns The colour formatted for VML
	*
	* @example
	* ```typescript
	* vmlColorValue("C0C0C0"); // "#C0C0C0"
	* vmlColorValue("#ff0000"); // "#ff0000"
	* vmlColorValue("silver"); // "silver"
	* ```
	*/
	var vmlColorValue = (value) => /^#?[0-9a-fA-F]{6}$/.test(value) ? `#${value.replace(/^#/, "")}` : value;
	/**
	* Formats a fraction as a VML fixed-point value.
	*
	* Several VML attributes (`gain`, `blacklevel`, ...) accept fixed-point
	* numbers where 65536 represents 1.0. These are written with an `f` suffix.
	*
	* @param value - The fraction to convert, where 1 represents 65536
	* @returns The fixed-point representation, e.g. `"19661f"`
	*
	* @example
	* ```typescript
	* vmlFixedPoint(0.5); // "32768f"
	* ```
	*/
	var vmlFixedPoint = (value) => `${Math.round(value * 65536)}f`;
	//#endregion
	//#region src/watermarks/vml/vml-fill.ts
	/**
	* VML fill module for WordprocessingML documents.
	*
	* Provides functionality for describing how the interior of a VML shape is painted.
	*
	* Reference: http://webapp.docx4java.org/OnlineDemo/ecma376/VML/fill.html
	*
	* @module
	*/
	/**
	* Creates a VML fill element.
	*
	* The VML fill element (v:fill) refines the fill of its parent shape, for example
	* to make a watermark semi-transparent.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_Fill">
	*   <xsd:sequence>
	*     <xsd:element ref="o:fill" minOccurs="0"/>
	*   </xsd:sequence>
	*   <xsd:attributeGroup ref="AG_Id"/>
	*   <xsd:attribute name="type" type="ST_FillType" use="optional"/>
	*   <xsd:attribute name="on" type="s:ST_TrueFalse" use="optional"/>
	*   <xsd:attribute name="color" type="s:ST_ColorType" use="optional"/>
	*   <xsd:attribute name="opacity" type="xsd:string" use="optional"/>
	*   <xsd:attribute name="color2" type="s:ST_ColorType" use="optional"/>
	*   <xsd:attribute name="angle" type="xsd:decimal" use="optional"/>
	*   <!-- further attributes omitted -->
	* </xsd:complexType>
	* ```
	*
	* @param options - Configuration options for the fill
	* @returns An XmlComponent representing the v:fill element
	*
	* @example
	* ```typescript
	* createVmlFill({ opacity: 0.5 });
	* // <v:fill opacity="0.5"/>
	* ```
	*/
	var createVmlFill = ({ on, type, color, color2, opacity, angle } = {}) => new docx.BuilderElement({
		name: "v:fill",
		attributes: {
			on: {
				key: "on",
				value: vmlTrueFalse(on)
			},
			type: {
				key: "type",
				value: type
			},
			color: {
				key: "color",
				value: color
			},
			color2: {
				key: "color2",
				value: color2
			},
			opacity: {
				key: "opacity",
				value: opacity
			},
			angle: {
				key: "angle",
				value: angle
			}
		}
	});
	//#endregion
	//#region src/watermarks/vml/vml-text-path.ts
	/**
	* VML text path module for WordprocessingML documents.
	*
	* A text path renders text along, or stretched into, the geometry of a shape. It is
	* the mechanism behind WordArt and text watermarks.
	*
	* Reference: http://webapp.docx4java.org/OnlineDemo/ecma376/VML/textpath.html
	*
	* @module
	*/
	/**
	* Formats a VmlTextPathStyle object into the CSS-like string used by the text path `style` attribute.
	*
	* @param style - The style to format
	* @returns The formatted style, or undefined when no properties were set
	*
	* @example
	* ```typescript
	* formatVmlTextPathStyle({ fontFamily: "Calibri", fontSize: 1 });
	* // 'font-family:"Calibri";font-size:1pt'
	* ```
	*/
	var formatVmlTextPathStyle = ({ fontFamily, fontSize, fontWeight, fontStyle, textAlign, sameLetterHeights } = {}) => {
		const properties = [
			fontFamily === void 0 ? void 0 : `font-family:"${fontFamily}"`,
			fontSize === void 0 ? void 0 : `font-size:${fontSize}pt`,
			fontWeight === void 0 ? void 0 : `font-weight:${fontWeight}`,
			fontStyle === void 0 ? void 0 : `font-style:${fontStyle}`,
			textAlign === void 0 ? void 0 : `v-text-align:${textAlign}`,
			sameLetterHeights === void 0 ? void 0 : `v-same-letter-heights:${vmlTrueFalse(sameLetterHeights)}`
		].filter((property) => property !== void 0);
		return properties.length ? properties.join(";") : void 0;
	};
	/**
	* Creates a VML text path element.
	*
	* The VML text path element (v:textpath) renders text using the geometry of its
	* parent shape. On a shape type it declares that shapes of that type carry text; on
	* a shape it supplies the actual text and its styling.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_TextPath">
	*   <xsd:attributeGroup ref="AG_Id"/>
	*   <xsd:attributeGroup ref="AG_Style"/>
	*   <xsd:attribute name="on" type="s:ST_TrueFalse" use="optional"/>
	*   <xsd:attribute name="fitshape" type="s:ST_TrueFalse" use="optional"/>
	*   <xsd:attribute name="fitpath" type="s:ST_TrueFalse" use="optional"/>
	*   <xsd:attribute name="trim" type="s:ST_TrueFalse" use="optional"/>
	*   <xsd:attribute name="xscale" type="s:ST_TrueFalse" use="optional"/>
	*   <xsd:attribute name="string" type="xsd:string" use="optional"/>
	* </xsd:complexType>
	* ```
	*
	* @param options - Configuration options for the text path
	* @returns An XmlComponent representing the v:textpath element
	*
	* @example
	* ```typescript
	* createVmlTextPath({ text: "DRAFT", style: { fontFamily: "Calibri", fontSize: 1 } });
	* // <v:textpath style="font-family:&quot;Calibri&quot;;font-size:1pt" string="DRAFT"/>
	* ```
	*/
	var createVmlTextPath = ({ on, fitShape, fitPath, trim, xScale, text, style } = {}) => new docx.BuilderElement({
		name: "v:textpath",
		attributes: {
			on: {
				key: "on",
				value: vmlTrueFalse(on)
			},
			fitShape: {
				key: "fitshape",
				value: vmlTrueFalse(fitShape)
			},
			fitPath: {
				key: "fitpath",
				value: vmlTrueFalse(fitPath)
			},
			trim: {
				key: "trim",
				value: vmlTrueFalse(trim)
			},
			xScale: {
				key: "xscale",
				value: vmlTrueFalse(xScale)
			},
			style: {
				key: "style",
				value: formatVmlTextPathStyle(style)
			},
			text: {
				key: "string",
				value: text
			}
		}
	});
	//#endregion
	//#region src/watermarks/vml/vml-formulas.ts
	/**
	* VML formulas module for WordprocessingML documents.
	*
	* Formulas compute the guide values (`@0`, `@1`, ...) that a shape's path and
	* handles refer to, allowing the geometry to respond to adjustment values.
	*
	* Reference: http://webapp.docx4java.org/OnlineDemo/ecma376/VML/formulas.html
	*
	* @module
	*/
	/**
	* Creates a single VML formula element.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_F">
	*   <xsd:attribute name="eqn" type="xsd:string"/>
	* </xsd:complexType>
	* ```
	*
	* @param equation - The equation, e.g. `sum #0 0 10800`
	* @returns An XmlComponent representing the v:f element
	*/
	var createVmlFormula = (equation) => new docx.BuilderElement({
		name: "v:f",
		attributes: { equation: {
			key: "eqn",
			value: equation
		} }
	});
	/**
	* Creates a VML formulas element containing one formula per equation.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_Formulas">
	*   <xsd:sequence>
	*     <xsd:element name="f" type="CT_F" minOccurs="0" maxOccurs="unbounded"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*
	* @param equations - The equations, in order. Each is referenced by its index as `@n`.
	* @returns An XmlComponent representing the v:formulas element
	*
	* @example
	* ```typescript
	* createVmlFormulas(["sum #0 0 10800", "prod #0 2 1"]);
	* // <v:formulas><v:f eqn="sum #0 0 10800"/><v:f eqn="prod #0 2 1"/></v:formulas>
	* ```
	*/
	var createVmlFormulas = (equations) => new docx.BuilderElement({
		name: "v:formulas",
		children: equations.map(createVmlFormula)
	});
	//#endregion
	//#region src/watermarks/vml/vml-handles.ts
	/**
	* VML handles module for WordprocessingML documents.
	*
	* Handles are the draggable points that let a user change a shape's adjustment
	* values in an editor.
	*
	* Reference: http://webapp.docx4java.org/OnlineDemo/ecma376/VML/handles.html
	*
	* @module
	*/
	/**
	* Creates a single VML handle element.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_H">
	*   <xsd:attribute name="position" type="xsd:string"/>
	*   <xsd:attribute name="polar" type="xsd:string"/>
	*   <xsd:attribute name="map" type="xsd:string"/>
	*   <xsd:attribute name="invx" type="s:ST_TrueFalse"/>
	*   <xsd:attribute name="invy" type="s:ST_TrueFalse"/>
	*   <xsd:attribute name="switch" type="s:ST_TrueFalseBlank"/>
	*   <xsd:attribute name="xrange" type="xsd:string"/>
	*   <xsd:attribute name="yrange" type="xsd:string"/>
	*   <xsd:attribute name="radiusrange" type="xsd:string"/>
	* </xsd:complexType>
	* ```
	*
	* @param options - Configuration options for the handle
	* @returns An XmlComponent representing the v:h element
	*/
	var createVmlHandle = ({ position, xRange, yRange }) => new docx.BuilderElement({
		name: "v:h",
		attributes: {
			position: {
				key: "position",
				value: position
			},
			xRange: {
				key: "xrange",
				value: xRange
			},
			yRange: {
				key: "yrange",
				value: yRange
			}
		}
	});
	/**
	* Creates a VML handles element containing one handle per option.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_Handles">
	*   <xsd:sequence>
	*     <xsd:element name="h" type="CT_H" minOccurs="0" maxOccurs="unbounded"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*
	* @param handles - The handles, in order
	* @returns An XmlComponent representing the v:handles element
	*
	* @example
	* ```typescript
	* createVmlHandles([{ position: "#0,bottomRight", xRange: "6629,14971" }]);
	* // <v:handles><v:h position="#0,bottomRight" xrange="6629,14971"/></v:handles>
	* ```
	*/
	var createVmlHandles = (handles) => new docx.BuilderElement({
		name: "v:handles",
		children: handles.map(createVmlHandle)
	});
	//#endregion
	//#region src/watermarks/vml/vml-lock.ts
	/**
	* VML lock module for WordprocessingML documents.
	*
	* A lock prevents particular kinds of edits to a shape in an editor, for example
	* keeping a picture's aspect ratio or stopping WordArt text from being edited.
	*
	* Reference: http://webapp.docx4java.org/OnlineDemo/ecma376/VML/lock.html
	*
	* @module
	*/
	/**
	* Creates a VML lock element.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_Lock">
	*   <xsd:attributeGroup ref="v:AG_Ext"/>
	*   <xsd:attribute name="position" type="s:ST_TrueFalse" use="optional"/>
	*   <xsd:attribute name="selection" type="s:ST_TrueFalse" use="optional"/>
	*   <xsd:attribute name="grouping" type="s:ST_TrueFalse" use="optional"/>
	*   <xsd:attribute name="ungrouping" type="s:ST_TrueFalse" use="optional"/>
	*   <xsd:attribute name="rotation" type="s:ST_TrueFalse" use="optional"/>
	*   <xsd:attribute name="cropping" type="s:ST_TrueFalse" use="optional"/>
	*   <xsd:attribute name="verticies" type="s:ST_TrueFalse" use="optional"/>
	*   <xsd:attribute name="adjusthandles" type="s:ST_TrueFalse" use="optional"/>
	*   <xsd:attribute name="text" type="s:ST_TrueFalse" use="optional"/>
	*   <xsd:attribute name="aspectratio" type="s:ST_TrueFalse" use="optional"/>
	*   <xsd:attribute name="shapetype" type="s:ST_TrueFalse" use="optional"/>
	* </xsd:complexType>
	* ```
	*
	* @param options - Configuration options for the lock
	* @returns An XmlComponent representing the o:lock element
	*
	* @example
	* ```typescript
	* createVmlLock({ aspectRatio: true });
	* // <o:lock v:ext="edit" aspectratio="t"/>
	* ```
	*/
	var createVmlLock = ({ extension = "edit", position, selection, grouping, ungrouping, rotation, cropping, vertices, adjustHandles, text, aspectRatio, shapeType } = {}) => new docx.BuilderElement({
		name: "o:lock",
		attributes: {
			extension: {
				key: "v:ext",
				value: extension
			},
			position: {
				key: "position",
				value: vmlTrueFalse(position)
			},
			selection: {
				key: "selection",
				value: vmlTrueFalse(selection)
			},
			grouping: {
				key: "grouping",
				value: vmlTrueFalse(grouping)
			},
			ungrouping: {
				key: "ungrouping",
				value: vmlTrueFalse(ungrouping)
			},
			rotation: {
				key: "rotation",
				value: vmlTrueFalse(rotation)
			},
			cropping: {
				key: "cropping",
				value: vmlTrueFalse(cropping)
			},
			vertices: {
				key: "verticies",
				value: vmlTrueFalse(vertices)
			},
			adjustHandles: {
				key: "adjusthandles",
				value: vmlTrueFalse(adjustHandles)
			},
			text: {
				key: "text",
				value: vmlTrueFalse(text)
			},
			aspectRatio: {
				key: "aspectratio",
				value: vmlTrueFalse(aspectRatio)
			},
			shapeType: {
				key: "shapetype",
				value: vmlTrueFalse(shapeType)
			}
		}
	});
	//#endregion
	//#region src/watermarks/vml/vml-path.ts
	/**
	* VML path module for WordprocessingML documents.
	*
	* The path element refines the geometry declared on a shape or shape type: which
	* features (text, fill, gradients) the geometry supports and where connectors attach.
	*
	* Reference: http://webapp.docx4java.org/OnlineDemo/ecma376/VML/path.html
	*
	* @module
	*/
	/**
	* Creates a VML path element.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_Path">
	*   <xsd:attributeGroup ref="AG_Id"/>
	*   <xsd:attribute name="v" type="xsd:string" use="optional"/>
	*   <xsd:attribute name="limo" type="xsd:string" use="optional"/>
	*   <xsd:attribute name="textboxrect" type="xsd:string" use="optional"/>
	*   <xsd:attribute name="fillok" type="s:ST_TrueFalse" use="optional"/>
	*   <xsd:attribute name="strokeok" type="s:ST_TrueFalse" use="optional"/>
	*   <xsd:attribute name="shadowok" type="s:ST_TrueFalse" use="optional"/>
	*   <xsd:attribute name="arrowok" type="s:ST_TrueFalse" use="optional"/>
	*   <xsd:attribute name="gradientshapeok" type="s:ST_TrueFalse" use="optional"/>
	*   <xsd:attribute name="textpathok" type="s:ST_TrueFalse" use="optional"/>
	*   <xsd:attribute name="insetpenok" type="s:ST_TrueFalse" use="optional"/>
	*   <xsd:attribute ref="o:connecttype"/>
	*   <xsd:attribute ref="o:connectlocs"/>
	*   <xsd:attribute ref="o:connectangles"/>
	*   <xsd:attribute ref="o:extrusionok"/>
	* </xsd:complexType>
	* ```
	*
	* @param options - Configuration options for the path
	* @returns An XmlComponent representing the v:path element
	*
	* @example
	* ```typescript
	* createVmlPath({ textPathOk: true, connectType: "custom" });
	* // <v:path textpathok="t" o:connecttype="custom"/>
	* ```
	*/
	var createVmlPath = ({ value, fillOk, strokeOk, shadowOk, arrowOk, gradientShapeOk, textPathOk, extrusionOk, connectType, connectLocations, connectAngles } = {}) => new docx.BuilderElement({
		name: "v:path",
		attributes: {
			value: {
				key: "v",
				value
			},
			fillOk: {
				key: "fillok",
				value: vmlTrueFalse(fillOk)
			},
			strokeOk: {
				key: "strokeok",
				value: vmlTrueFalse(strokeOk)
			},
			shadowOk: {
				key: "shadowok",
				value: vmlTrueFalse(shadowOk)
			},
			arrowOk: {
				key: "arrowok",
				value: vmlTrueFalse(arrowOk)
			},
			gradientShapeOk: {
				key: "gradientshapeok",
				value: vmlTrueFalse(gradientShapeOk)
			},
			textPathOk: {
				key: "textpathok",
				value: vmlTrueFalse(textPathOk)
			},
			extrusionOk: {
				key: "o:extrusionok",
				value: vmlTrueFalse(extrusionOk)
			},
			connectType: {
				key: "o:connecttype",
				value: connectType
			},
			connectLocations: {
				key: "o:connectlocs",
				value: connectLocations
			},
			connectAngles: {
				key: "o:connectangles",
				value: connectAngles
			}
		}
	});
	//#endregion
	//#region src/watermarks/vml/vml-shape-type.ts
	/**
	* VML shape type module for WordprocessingML documents.
	*
	* A shape type defines reusable geometry (path, formulas, handles and default
	* properties) that shapes reference through their `type` attribute. Word emits a
	* shape type for each kind of VML shape it uses, such as text boxes, WordArt or
	* picture frames.
	*
	* Reference: http://webapp.docx4java.org/OnlineDemo/ecma376/VML/shapetype.html
	*
	* @module
	*/
	/**
	* Creates a VML shape type element.
	*
	* The VML shape type element (v:shapetype) declares geometry and defaults that
	* can be shared by several shapes.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_Shapetype">
	*   <xsd:sequence>
	*     <xsd:group ref="EG_ShapeElements" minOccurs="0" maxOccurs="unbounded"/>
	*     <xsd:element ref="o:complex" minOccurs="0"/>
	*   </xsd:sequence>
	*   <xsd:attributeGroup ref="AG_AllCoreAttributes"/>
	*   <xsd:attributeGroup ref="AG_AllShapeAttributes"/>
	*   <xsd:attributeGroup ref="AG_Adj"/>
	*   <xsd:attributeGroup ref="AG_Path"/>
	*   <xsd:attribute ref="o:master"/>
	* </xsd:complexType>
	* ```
	*
	* @param options - Configuration options for the shape type
	* @returns An XmlComponent representing the v:shapetype element
	*
	* @example
	* ```typescript
	* const shapeType = createVmlShapeType({
	*   id: "_x0000_t136",
	*   coordinateSize: "21600,21600",
	*   presetShapeType: 136,
	*   adjustment: "10800",
	*   path: "m@7,l@8,m@5,21600l@6,21600e",
	* });
	* ```
	*/
	var createVmlShapeType = ({ id, coordinateSize, presetShapeType, preferRelative, adjustment, path, filled, stroked, children = [] }) => new docx.BuilderElement({
		name: "v:shapetype",
		attributes: {
			id: {
				key: "id",
				value: id
			},
			coordinateSize: {
				key: "coordsize",
				value: coordinateSize
			},
			presetShapeType: {
				key: "o:spt",
				value: presetShapeType
			},
			preferRelative: {
				key: "o:preferrelative",
				value: vmlTrueFalse(preferRelative)
			},
			adjustment: {
				key: "adj",
				value: adjustment
			},
			path: {
				key: "path",
				value: path
			},
			filled: {
				key: "filled",
				value: vmlTrueFalse(filled)
			},
			stroked: {
				key: "stroked",
				value: vmlTrueFalse(stroked)
			}
		},
		children
	});
	//#endregion
	//#region src/watermarks/vml/word-art-shape-type.ts
	/** Identifier of the WordArt (plain text) shape type. Shapes reference it as `#_x0000_t136`. */
	var WORD_ART_SHAPE_TYPE_ID = "_x0000_t136";
	/** Office preset shape number for plain WordArt text. */
	var WORD_ART_PRESET_SHAPE_TYPE = 136;
	/**
	* Creates the WordArt (plain text) shape type as emitted by Microsoft Word.
	*
	* The resulting shape type has the identifier `_x0000_t136`. Shapes using it must
	* set `type: "#_x0000_t136"` and supply a `v:textpath` child carrying the text.
	*
	* @returns An XmlComponent representing the v:shapetype element
	*
	* @example
	* ```typescript
	* createPict({
	*   children: [
	*     createWordArtShapeType(),
	*     createVmlShape({
	*       id: "watermark",
	*       type: `#${WORD_ART_SHAPE_TYPE_ID}`,
	*       children: [createVmlTextPath({ text: "DRAFT" })],
	*     }),
	*   ],
	* });
	* ```
	*/
	var createWordArtShapeType = () => createVmlShapeType({
		id: WORD_ART_SHAPE_TYPE_ID,
		coordinateSize: "21600,21600",
		presetShapeType: WORD_ART_PRESET_SHAPE_TYPE,
		adjustment: "10800",
		path: "m@7,l@8,m@5,21600l@6,21600e",
		children: [
			createVmlFormulas([
				"sum #0 0 10800",
				"prod #0 2 1",
				"sum 21600 0 @1",
				"sum 0 0 @2",
				"sum 21600 0 @3",
				"if @0 @3 0",
				"if @0 21600 @1",
				"if @0 0 @2",
				"if @0 @4 21600",
				"mid @5 @6",
				"mid @8 @5",
				"mid @7 @8",
				"mid @6 @7",
				"sum @6 0 @5"
			]),
			createVmlPath({
				textPathOk: true,
				connectType: "custom",
				connectLocations: "@9,0;@10,10800;@11,21600;@12,10800",
				connectAngles: "270,180,90,0"
			}),
			createVmlTextPath({
				on: true,
				fitShape: true
			}),
			createVmlHandles([{
				position: "#0,bottomRight",
				xRange: "6629,14971"
			}]),
			createVmlLock({
				text: true,
				shapeType: true
			})
		]
	});
	//#endregion
	//#region src/watermarks/watermark-shape-style.ts
	/**
	* Z-order used by Word for watermarks. Negative values place the shape behind the text.
	*/
	var WATERMARK_Z_INDEX = -251657216;
	/**
	* Builds the VML shape style shared by watermarks.
	*
	* The shape is absolutely positioned, centred horizontally and vertically
	* relative to the page margins, and placed behind the document text.
	*
	* @param options - Size and rotation of the watermark
	* @returns The VML shape style
	*
	* @example
	* ```typescript
	* createWatermarkShapeStyle({ width: 527.85, height: 131.95, rotation: 315 });
	* ```
	*/
	var createWatermarkShapeStyle = ({ width, height, rotation }) => ({
		position: "absolute",
		marginLeft: 0,
		marginTop: 0,
		width: `${width}pt`,
		height: `${height}pt`,
		rotation: rotation || void 0,
		zIndex: WATERMARK_Z_INDEX,
		positionHorizontal: "center",
		positionHorizontalRelative: "margin",
		positionVertical: "center",
		positionVerticalRelative: "margin"
	});
	//#endregion
	//#region src/watermarks/text-watermark.ts
	/**
	* Text watermark module for WordprocessingML documents.
	*
	* A text watermark is faint text, such as "DRAFT" or "CONFIDENTIAL", drawn behind
	* the content of every page. Word implements it as a WordArt shape placed in the
	* page header, and this module produces the same markup.
	*
	* Reference: https://support.microsoft.com/en-us/office/insert-a-watermark-c0ec3d5a-6f3e-4f3c-a8b0-9d9a6f56d3fd
	*
	* @module
	*/
	/**
	* Prefix Word gives to text watermark shapes. Word's "Remove Watermark"
	* command finds watermarks by this prefix.
	*/
	var TEXT_WATERMARK_ID_PREFIX = "PowerPlusWaterMarkObject";
	/** Word's default watermark font. */
	var DEFAULT_FONT = "Calibri";
	/** Word's default watermark colour. */
	var DEFAULT_COLOR = "silver";
	/** Word's default "semitransparent" watermark opacity. */
	var DEFAULT_OPACITY = .5;
	/** Width Word gives an automatically sized watermark, in points. */
	var DEFAULT_WIDTH = 527.85;
	/** Rotation Word applies to a diagonal watermark, in degrees clockwise. */
	var DIAGONAL_ROTATION = 315;
	/**
	* Font size written for automatically sized text. Word stretches the text to
	* fill the shape regardless of the font size, and writes 1pt to mean "auto".
	*/
	var AUTO_FONT_SIZE = 1;
	/**
	* Approximate width of an uppercase letter relative to the height of the shape,
	* used to derive a default shape height that keeps the letters in proportion.
	*/
	var CHARACTER_ASPECT_RATIO = .8;
	/** Approximate width of a space relative to the height of the shape. */
	var SPACE_ASPECT_RATIO = .35;
	/**
	* Estimates a shape height that keeps the text in proportion for the given width.
	*
	* Word stretches watermark text to fill the shape, so the shape's aspect ratio
	* must roughly match the text's. Font metrics are not available here, so the
	* width of each character is approximated as a fraction of the height.
	*
	* @param text - The watermark text
	* @param width - The width of the shape in points
	* @returns The estimated height in points, never larger than the width
	*/
	var estimateHeight = (text, width) => {
		const aspectRatio = [...text].reduce((total, character) => total + (character === " " ? SPACE_ASPECT_RATIO : CHARACTER_ASPECT_RATIO), 0);
		return Math.round(width / Math.max(aspectRatio, 1) * 100) / 100;
	};
	/**
	* Represents a text watermark in a WordprocessingML document.
	*
	* TextWatermark is an inline element that belongs inside a paragraph, and the
	* paragraph belongs in a header so that the watermark repeats on every page of
	* the section. It renders as a WordArt shape centred on the page behind the
	* document text, exactly as Word's Design > Watermark command does, so Word
	* recognizes it and can remove or replace it through that command.
	*
	* @publicApi
	*
	* ## XSD Schema
	* The watermark combines several elements:
	* - w:r (run container)
	* - w:pict (picture element containing VML)
	* - v:shapetype (WordArt shape type definition)
	* - v:shape (the positioned WordArt shape)
	* - v:fill (opacity)
	* - v:textpath (the text and its font)
	*
	* @example
	* ```typescript
	* new Document({
	*   sections: [
	*     {
	*       headers: {
	*         default: new Header({
	*           children: [new Paragraph({ children: [new TextWatermark({ text: "DRAFT" })] })],
	*         }),
	*       },
	*       children: [new Paragraph("Body text")],
	*     },
	*   ],
	* });
	*
	* // Customised watermark
	* new TextWatermark({
	*   text: "CONFIDENTIAL",
	*   font: "Arial",
	*   color: "FF0000",
	*   opacity: 0.3,
	*   layout: "horizontal",
	* });
	* ```
	*/
	var TextWatermark = class extends docx.XmlComponent {
		constructor({ text, font = DEFAULT_FONT, fontSize = AUTO_FONT_SIZE, bold, italics, color = DEFAULT_COLOR, opacity = DEFAULT_OPACITY, layout = "diagonal", rotation = layout === "diagonal" ? DIAGONAL_ROTATION : 0, width = DEFAULT_WIDTH, height = estimateHeight(text, width) }) {
			super("w:r");
			this.root.push(createPict({ children: [createWordArtShapeType(), (0, docx.createVmlShape)({
				id: `${TEXT_WATERMARK_ID_PREFIX}${(0, docx.uniqueId)()}`,
				type: `#${WORD_ART_SHAPE_TYPE_ID}`,
				style: createWatermarkShapeStyle({
					width,
					height,
					rotation
				}),
				allowInCell: false,
				fillColor: vmlColorValue(color),
				stroked: false,
				children: [createVmlFill({ opacity }), createVmlTextPath({
					text,
					style: {
						fontFamily: font,
						fontSize,
						fontWeight: bold ? "bold" : void 0,
						fontStyle: italics ? "italic" : void 0
					}
				})]
			})] }));
		}
	};
	//#endregion
	//#region src/watermarks/vml/vml-stroke.ts
	/**
	* VML stroke module for WordprocessingML documents.
	*
	* Provides functionality for describing how the outline of a VML shape is drawn.
	*
	* Reference: http://webapp.docx4java.org/OnlineDemo/ecma376/VML/stroke.html
	*
	* @module
	*/
	/**
	* Creates a VML stroke element.
	*
	* The VML stroke element (v:stroke) refines the outline of its parent shape.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_Stroke">
	*   <xsd:sequence>
	*     <xsd:element ref="o:left" minOccurs="0"/>
	*     <xsd:element ref="o:top" minOccurs="0"/>
	*     <xsd:element ref="o:right" minOccurs="0"/>
	*     <xsd:element ref="o:bottom" minOccurs="0"/>
	*     <xsd:element ref="o:column" minOccurs="0"/>
	*   </xsd:sequence>
	*   <xsd:attributeGroup ref="AG_Id"/>
	*   <xsd:attributeGroup ref="AG_StrokeAttributes"/>
	* </xsd:complexType>
	*
	* <xsd:attributeGroup name="AG_StrokeAttributes">
	*   <xsd:attribute name="on" type="s:ST_TrueFalse" use="optional"/>
	*   <xsd:attribute name="weight" type="xsd:string" use="optional"/>
	*   <xsd:attribute name="color" type="s:ST_ColorType" use="optional"/>
	*   <xsd:attribute name="opacity" type="xsd:string" use="optional"/>
	*   <xsd:attribute name="joinstyle" type="ST_StrokeJoinStyle" use="optional"/>
	*   <!-- further attributes omitted -->
	* </xsd:attributeGroup>
	* ```
	*
	* @param options - Configuration options for the stroke
	* @returns An XmlComponent representing the v:stroke element
	*
	* @example
	* ```typescript
	* createVmlStroke({ joinStyle: "miter" });
	* // <v:stroke joinstyle="miter"/>
	* ```
	*/
	var createVmlStroke = ({ on, weight, color, opacity, joinStyle } = {}) => new docx.BuilderElement({
		name: "v:stroke",
		attributes: {
			on: {
				key: "on",
				value: vmlTrueFalse(on)
			},
			weight: {
				key: "weight",
				value: weight
			},
			color: {
				key: "color",
				value: color
			},
			opacity: {
				key: "opacity",
				value: opacity
			},
			joinStyle: {
				key: "joinstyle",
				value: joinStyle
			}
		}
	});
	//#endregion
	//#region src/watermarks/vml/picture-frame-shape-type.ts
	/** Identifier of the picture frame shape type. Shapes reference it as `#_x0000_t75`. */
	var PICTURE_FRAME_SHAPE_TYPE_ID = "_x0000_t75";
	/** Office preset shape number for a picture frame. */
	var PICTURE_FRAME_PRESET_SHAPE_TYPE = 75;
	/**
	* Creates the picture frame shape type as emitted by Microsoft Word.
	*
	* The resulting shape type has the identifier `_x0000_t75`. Shapes using it must
	* set `type: "#_x0000_t75"` and supply a `v:imagedata` child referencing the image.
	*
	* @returns An XmlComponent representing the v:shapetype element
	*
	* @example
	* ```typescript
	* createPict({
	*   children: [
	*     createPictureFrameShapeType(),
	*     createVmlShape({
	*       id: "picture",
	*       type: `#${PICTURE_FRAME_SHAPE_TYPE_ID}`,
	*       children: [createVmlImageData({ relationshipId: "rId1" })],
	*     }),
	*   ],
	* });
	* ```
	*/
	var createPictureFrameShapeType = () => createVmlShapeType({
		id: PICTURE_FRAME_SHAPE_TYPE_ID,
		coordinateSize: "21600,21600",
		presetShapeType: PICTURE_FRAME_PRESET_SHAPE_TYPE,
		preferRelative: true,
		path: "m@4@5l@4@11@9@11@9@5xe",
		filled: false,
		stroked: false,
		children: [
			createVmlStroke({ joinStyle: "miter" }),
			createVmlFormulas([
				"if lineDrawn pixelLineWidth 0",
				"sum @0 1 0",
				"sum 0 0 @1",
				"prod @2 1 2",
				"prod @3 21600 pixelWidth",
				"prod @3 21600 pixelHeight",
				"sum @0 0 1",
				"prod @6 1 2",
				"prod @7 21600 pixelWidth",
				"sum @8 21600 0",
				"prod @7 21600 pixelHeight",
				"sum @10 21600 0"
			]),
			createVmlPath({
				extrusionOk: false,
				gradientShapeOk: true,
				connectType: "rect"
			}),
			createVmlLock({ aspectRatio: true })
		]
	});
	//#endregion
	//#region src/watermarks/vml/vml-image-data.ts
	/**
	* VML image data module for WordprocessingML documents.
	*
	* Image data attaches a picture to a VML shape and describes how it should be
	* adjusted, for example washed out for use as a watermark.
	*
	* Reference: http://webapp.docx4java.org/OnlineDemo/ecma376/VML/imagedata.html
	*
	* @module
	*/
	/**
	* Creates a VML image data element.
	*
	* The VML image data element (v:imagedata) references an embedded picture through
	* a relationship and applies colour adjustments to it. Adjustment values are written
	* in VML's fixed-point notation where 65536 represents 1.0.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_ImageData">
	*   <xsd:attributeGroup ref="AG_Id"/>
	*   <xsd:attributeGroup ref="AG_ImageAttributes"/>
	*   <xsd:attributeGroup ref="AG_Chromakey"/>
	*   <xsd:attribute ref="o:title"/>
	*   <xsd:attribute ref="r:id"/>
	*   <!-- further attributes omitted -->
	* </xsd:complexType>
	*
	* <xsd:attributeGroup name="AG_ImageAttributes">
	*   <xsd:attribute name="src" type="xsd:string" use="optional"/>
	*   <xsd:attribute name="cropleft" type="xsd:string" use="optional"/>
	*   <xsd:attribute name="croptop" type="xsd:string" use="optional"/>
	*   <xsd:attribute name="cropright" type="xsd:string" use="optional"/>
	*   <xsd:attribute name="cropbottom" type="xsd:string" use="optional"/>
	*   <xsd:attribute name="gain" type="xsd:string" use="optional"/>
	*   <xsd:attribute name="blacklevel" type="xsd:string" use="optional"/>
	*   <xsd:attribute name="gamma" type="xsd:string" use="optional"/>
	*   <xsd:attribute name="grayscale" type="s:ST_TrueFalse" use="optional"/>
	*   <xsd:attribute name="bilevel" type="s:ST_TrueFalse" use="optional"/>
	* </xsd:attributeGroup>
	* ```
	*
	* @param options - Configuration options for the image data
	* @returns An XmlComponent representing the v:imagedata element
	*
	* @example
	* ```typescript
	* createVmlImageData({ relationshipId: "rId1", title: "logo", gain: 0.3, blackLevel: 0.35 });
	* // <v:imagedata r:id="rId1" o:title="logo" gain="19661f" blacklevel="22938f"/>
	* ```
	*/
	var createVmlImageData = ({ relationshipId, title, gain, blackLevel, gamma, grayscale, biLevel, chromaKey } = {}) => new docx.BuilderElement({
		name: "v:imagedata",
		attributes: {
			relationshipId: {
				key: "r:id",
				value: relationshipId
			},
			title: {
				key: "o:title",
				value: title
			},
			gain: {
				key: "gain",
				value: gain === void 0 ? void 0 : vmlFixedPoint(gain)
			},
			blackLevel: {
				key: "blacklevel",
				value: blackLevel === void 0 ? void 0 : vmlFixedPoint(blackLevel)
			},
			gamma: {
				key: "gamma",
				value: gamma === void 0 ? void 0 : vmlFixedPoint(gamma)
			},
			grayscale: {
				key: "grayscale",
				value: vmlTrueFalse(grayscale)
			},
			biLevel: {
				key: "bilevel",
				value: vmlTrueFalse(biLevel)
			},
			chromaKey: {
				key: "chromakey",
				value: chromaKey
			}
		}
	});
	//#endregion
	//#region \0@oxc-project+runtime@0.150.0/helpers/esm/typeof.js
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.150.0/helpers/esm/toPrimitive.js
	function toPrimitive(t, r) {
		if ("object" != _typeof(t) || !t) return t;
		var e = t[Symbol.toPrimitive];
		if (void 0 !== e) {
			var i = e.call(t, r || "default");
			if ("object" != _typeof(i)) return i;
			throw new TypeError("@@toPrimitive must return a primitive value.");
		}
		return ("string" === r ? String : Number)(t);
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.150.0/helpers/esm/toPropertyKey.js
	function toPropertyKey(t) {
		var i = toPrimitive(t, "string");
		return "symbol" == _typeof(i) ? i : i + "";
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.150.0/helpers/esm/defineProperty.js
	function _defineProperty(e, r, t) {
		return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
			value: t,
			enumerable: !0,
			configurable: !0,
			writable: !0
		}) : e[r] = t, e;
	}
	//#endregion
	//#region src/watermarks/image-watermark.ts
	/**
	* Image watermark module for WordprocessingML documents.
	*
	* An image watermark is a picture, typically a logo, drawn faintly behind the
	* content of every page. Word implements it as a legacy picture shape placed in the
	* page header, and this module produces the same markup.
	*
	* Reference: https://support.microsoft.com/en-us/office/insert-a-watermark-c0ec3d5a-6f3e-4f3c-a8b0-9d9a6f56d3fd
	*
	* @module
	*/
	/**
	* Prefix Word gives to picture watermark shapes. Word's "Remove Watermark"
	* command finds watermarks by this prefix.
	*/
	var IMAGE_WATERMARK_ID_PREFIX = "WordPictureWatermark";
	/** Brightness multiplier Word applies for its "washout" effect. */
	var WASHOUT_GAIN = .3;
	/** Black level Word applies for its "washout" effect. */
	var WASHOUT_BLACK_LEVEL = .35;
	/** Number of English Metric Units in one pixel at 96 dpi. */
	var EMUS_PER_PIXEL = 9525;
	/** Number of points in one pixel at 96 dpi. */
	var POINTS_PER_PIXEL = .75;
	/**
	* Converts a pixel measurement into points, rounded to two decimal places.
	*
	* @param pixels - The measurement in pixels
	* @returns The measurement in points
	*/
	var pixelsToPoints = (pixels) => Math.round(pixels * POINTS_PER_PIXEL * 100) / 100;
	/**
	* Represents an image watermark in a WordprocessingML document.
	*
	* ImageWatermark is an inline element that belongs inside a paragraph, and the
	* paragraph belongs in a header so that the watermark repeats on every page of
	* the section. It renders as a picture shape centred on the page behind the
	* document text, exactly as Word's Design > Watermark command does, so Word
	* recognizes it and can remove or replace it through that command.
	*
	* The image is registered with the document's media collection during
	* serialization and linked from the header through a relationship, in the same
	* way as an ImageRun.
	*
	* @publicApi
	*
	* ## XSD Schema
	* The watermark combines several elements:
	* - w:r (run container)
	* - w:pict (picture element containing VML)
	* - v:shapetype (picture frame shape type definition)
	* - v:shape (the positioned picture shape)
	* - v:imagedata (the image reference and washout adjustments)
	*
	* @example
	* ```typescript
	* new Document({
	*   sections: [
	*     {
	*       headers: {
	*         default: new Header({
	*           children: [
	*             new Paragraph({
	*               children: [
	*                 new ImageWatermark({
	*                   type: "png",
	*                   data: fs.readFileSync("./logo.png"),
	*                   transformation: { width: 400, height: 400 },
	*                 }),
	*               ],
	*             }),
	*           ],
	*         }),
	*       },
	*       children: [new Paragraph("Body text")],
	*     },
	*   ],
	* });
	* ```
	*/
	var ImageWatermark = class extends docx.XmlComponent {
		constructor({ type, data, transformation, washout = true, title }) {
			super("w:r");
			_defineProperty(this, "mediaData", void 0);
			const fileName = `${(0, docx.hashedId)(data)}.${type}`;
			this.mediaData = {
				type,
				data: (0, docx.standardizeData)(data),
				fileName,
				transformation: {
					pixels: {
						x: Math.round(transformation.width),
						y: Math.round(transformation.height)
					},
					emus: {
						x: Math.round(transformation.width * EMUS_PER_PIXEL),
						y: Math.round(transformation.height * EMUS_PER_PIXEL)
					}
				}
			};
			this.root.push(createPict({ children: [createPictureFrameShapeType(), (0, docx.createVmlShape)({
				id: `${IMAGE_WATERMARK_ID_PREFIX}${(0, docx.uniqueId)()}`,
				type: `#${PICTURE_FRAME_SHAPE_TYPE_ID}`,
				style: createWatermarkShapeStyle({
					width: pixelsToPoints(transformation.width),
					height: pixelsToPoints(transformation.height)
				}),
				allowInCell: false,
				children: [createVmlImageData({
					relationshipId: `rId{${fileName}}`,
					title,
					gain: washout ? WASHOUT_GAIN : void 0,
					blackLevel: washout ? WASHOUT_BLACK_LEVEL : void 0
				})]
			})] }));
		}
		prepForXml(context) {
			context.file.Media.addImage(this.mediaData.fileName, this.mediaData);
			return super.prepForXml(context);
		}
	};
	//#endregion
	exports.ImageWatermark = ImageWatermark;
	exports.TextWatermark = TextWatermark;
	return exports;
})({}, docx);
