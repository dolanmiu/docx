var docxShapes = (function(exports, docx) {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	//#region src/shapes/drawing/drawing-parts.ts
	/**
	* Small DrawingML elements that shapes and pictures in groups are made of. docx writes the same elements for images and
	* text boxes, but doesn't export them, so shapes write their own.
	*
	* @module
	*/
	/**
	* Creates `a:noFill`, for a shape with no fill or a line that isn't drawn.
	*/
	var createNoFill = () => new docx.BuilderElement({ name: "a:noFill" });
	/**
	* Creates `a:stretch`, which stretches a picture to fill its shape.
	*
	* ```xml
	* <a:stretch><a:fillRect/></a:stretch>
	* ```
	*/
	var createStretch = () => new docx.BuilderElement({
		name: "a:stretch",
		children: [new docx.BuilderElement({ name: "a:fillRect" })]
	});
	/**
	* Creates `a:srcRect`, the part of a picture that is shown. The crop is in percentages of the picture's size, and is
	* written in thousandths of a percent.
	*/
	var createSourceRectangle = (crop) => {
		const thousandths = (percentage) => percentage === void 0 ? void 0 : Math.round(percentage * 1e3);
		return new docx.BuilderElement({
			name: "a:srcRect",
			attributes: crop ? {
				left: {
					key: "l",
					value: thousandths(crop.left)
				},
				top: {
					key: "t",
					value: thousandths(crop.top)
				},
				right: {
					key: "r",
					value: thousandths(crop.right)
				},
				bottom: {
					key: "b",
					value: thousandths(crop.bottom)
				}
			} : void 0
		});
	};
	/**
	* Creates the extension list of an `a:blip` that holds an SVG picture. The blip itself shows the raster fallback, for
	* applications that can't draw SVG.
	*
	* ```xml
	* <a:extLst>
	*   <a:ext uri="{96DAC541-7B7A-43D3-8B79-37D633B846F1}">
	*     <asvg:svgBlip xmlns:asvg="http://schemas.microsoft.com/office/drawing/2016/SVG/main" r:embed="..."/>
	*   </a:ext>
	* </a:extLst>
	* ```
	*/
	var createSvgBlipExtension = (mediaData) => new docx.BuilderElement({
		name: "a:extLst",
		children: [new docx.BuilderElement({
			name: "a:ext",
			attributes: { uri: {
				key: "uri",
				value: "{96DAC541-7B7A-43D3-8B79-37D633B846F1}"
			} },
			children: [new docx.BuilderElement({
				name: "asvg:svgBlip",
				attributes: {
					namespace: {
						key: "xmlns:asvg",
						value: "http://schemas.microsoft.com/office/drawing/2016/SVG/main"
					},
					embed: {
						key: "r:embed",
						value: `rId{${mediaData.fileName}}`
					}
				}
			})]
		})]
	});
	/**
	* Creates `pic:cNvPicPr`, which stops the picture's aspect ratio and arrowheads being changed.
	*
	* ```xml
	* <pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr>
	* ```
	*/
	var createPictureLocks = () => new docx.BuilderElement({
		name: "pic:cNvPicPr",
		children: [new docx.BuilderElement({
			name: "a:picLocks",
			attributes: {
				noChangeAspect: {
					key: "noChangeAspect",
					value: 1
				},
				noChangeArrowheads: {
					key: "noChangeArrowheads",
					value: 1
				}
			}
		})]
	});
	/**
	* Creates `a:xfrm`: the position, size, rotation and flip of a shape or picture.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_Transform2D">
	*   <xsd:sequence>
	*     <xsd:element name="off" type="CT_Point2D" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="ext" type="CT_PositiveSize2D" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	*   <xsd:attribute name="rot" type="ST_Angle" use="optional" default="0"/>
	*   <xsd:attribute name="flipH" type="xsd:boolean" use="optional" default="false"/>
	*   <xsd:attribute name="flipV" type="xsd:boolean" use="optional" default="false"/>
	* </xsd:complexType>
	* ```
	*
	* @param children - Elements after the offset and size, such as a group's `a:chOff` and `a:chExt`
	*/
	var createTransform = (transformation, children = []) => {
		var _transformation$flip, _transformation$flip2, _transformation$offse, _transformation$offse2, _transformation$offse3, _transformation$offse4;
		return new docx.BuilderElement({
			name: "a:xfrm",
			attributes: {
				flipVertical: {
					key: "flipV",
					value: (_transformation$flip = transformation.flip) === null || _transformation$flip === void 0 ? void 0 : _transformation$flip.vertical
				},
				flipHorizontal: {
					key: "flipH",
					value: (_transformation$flip2 = transformation.flip) === null || _transformation$flip2 === void 0 ? void 0 : _transformation$flip2.horizontal
				},
				rotation: {
					key: "rot",
					value: transformation.rotation
				}
			},
			children: [
				new docx.BuilderElement({
					name: "a:off",
					attributes: {
						x: {
							key: "x",
							value: (_transformation$offse = (_transformation$offse2 = transformation.offset) === null || _transformation$offse2 === void 0 || (_transformation$offse2 = _transformation$offse2.emus) === null || _transformation$offse2 === void 0 ? void 0 : _transformation$offse2.x) !== null && _transformation$offse !== void 0 ? _transformation$offse : 0
						},
						y: {
							key: "y",
							value: (_transformation$offse3 = (_transformation$offse4 = transformation.offset) === null || _transformation$offse4 === void 0 || (_transformation$offse4 = _transformation$offse4.emus) === null || _transformation$offse4 === void 0 ? void 0 : _transformation$offse4.y) !== null && _transformation$offse3 !== void 0 ? _transformation$offse3 : 0
						}
					}
				}),
				new docx.BuilderElement({
					name: "a:ext",
					attributes: {
						x: {
							key: "cx",
							value: transformation.emus.x
						},
						y: {
							key: "cy",
							value: transformation.emus.y
						}
					}
				}),
				...children
			]
		});
	};
	/**
	* Creates `a:prstGeom`: one of the preset shapes, with its adjustments written as shape guides.
	*
	* @param type - The preset's OOXML name (`ST_ShapeType`), such as `"roundRect"`
	* @param adjustments - Raw shape guide values, keyed by guide name, such as `{ adj: 25000 }`. They are rounded
	*
	* ```xml
	* <a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 25000"/></a:avLst></a:prstGeom>
	* ```
	*/
	var createPresetGeometry = (type = "rect", adjustments = {}) => new docx.BuilderElement({
		name: "a:prstGeom",
		attributes: { type: {
			key: "prst",
			value: type
		} },
		children: [new docx.BuilderElement({
			name: "a:avLst",
			children: Object.entries(adjustments).map(([name, value]) => new docx.BuilderElement({
				name: "a:gd",
				attributes: {
					name: {
						key: "name",
						value: name
					},
					formula: {
						key: "fmla",
						value: `val ${Math.round(value)}`
					}
				}
			}))
		})]
	});
	/**
	* Creates `wps:txbx`: the text inside a shape, as paragraphs in `w:txbxContent`.
	*/
	var createTextBox = (children) => new docx.BuilderElement({
		name: "wps:txbx",
		children: [new docx.BuilderElement({
			name: "w:txbxContent",
			children: [...children]
		})]
	});
	//#endregion
	//#region src/shapes/preset-shape/preset-shape-type.ts
	/**
	* Preset shape types for DrawingML shapes.
	*
	* Reference: ST_ShapeType in ooxml-schemas/ISO-IEC29500-4_2016/dml-main.xsd
	*
	* @module
	*/
	/**
	* Every preset shape, by the name this library gives it, mapped to its name in OOXML (`a:prstGeom/@prst`).
	* The OOXML names are often abbreviated (`roundRect`) or numbered (`ribbon2`), so the library uses names
	* that say what the shape is.
	*/
	var PRESET_SHAPE_OOXML_NAMES = {
		line: "line",
		inverseLine: "lineInv",
		straightConnector: "straightConnector1",
		elbowConnectorOneBend: "bentConnector2",
		elbowConnector: "bentConnector3",
		elbowConnectorThreeBends: "bentConnector4",
		elbowConnectorFourBends: "bentConnector5",
		curvedConnectorOneBend: "curvedConnector2",
		curvedConnector: "curvedConnector3",
		curvedConnectorThreeBends: "curvedConnector4",
		curvedConnectorFourBends: "curvedConnector5",
		triangle: "triangle",
		rightTriangle: "rtTriangle",
		diamond: "diamond",
		parallelogram: "parallelogram",
		trapezoid: "trapezoid",
		nonIsoscelesTrapezoid: "nonIsoscelesTrapezoid",
		pentagon: "pentagon",
		hexagon: "hexagon",
		heptagon: "heptagon",
		octagon: "octagon",
		decagon: "decagon",
		dodecagon: "dodecagon",
		ellipse: "ellipse",
		teardrop: "teardrop",
		pieWedge: "pieWedge",
		pie: "pie",
		blockArc: "blockArc",
		donut: "donut",
		noSymbol: "noSmoking",
		chord: "chord",
		arc: "arc",
		frame: "frame",
		halfFrame: "halfFrame",
		lShape: "corner",
		diagonalStripe: "diagStripe",
		cross: "plus",
		plaque: "plaque",
		cylinder: "can",
		cube: "cube",
		beveledRectangle: "bevel",
		foldedCorner: "foldedCorner",
		smileyFace: "smileyFace",
		heart: "heart",
		lightningBolt: "lightningBolt",
		sun: "sun",
		moon: "moon",
		cloud: "cloud",
		leftBracket: "leftBracket",
		rightBracket: "rightBracket",
		leftBrace: "leftBrace",
		rightBrace: "rightBrace",
		bracketPair: "bracketPair",
		bracePair: "bracePair",
		rectangle: "rect",
		roundedRectangle: "roundRect",
		roundedCornerRectangle: "round1Rect",
		topRoundedCornersRectangle: "round2SameRect",
		diagonalRoundedCornersRectangle: "round2DiagRect",
		snippedCornerRectangle: "snip1Rect",
		topSnippedCornersRectangle: "snip2SameRect",
		diagonalSnippedCornersRectangle: "snip2DiagRect",
		roundedAndSnippedCornersRectangle: "snipRoundRect",
		rightArrow: "rightArrow",
		leftArrow: "leftArrow",
		upArrow: "upArrow",
		downArrow: "downArrow",
		leftRightArrow: "leftRightArrow",
		upDownArrow: "upDownArrow",
		quadArrow: "quadArrow",
		leftRightUpArrow: "leftRightUpArrow",
		bentArrow: "bentArrow",
		uTurnArrow: "uturnArrow",
		leftUpArrow: "leftUpArrow",
		bentUpArrow: "bentUpArrow",
		curvedRightArrow: "curvedRightArrow",
		curvedLeftArrow: "curvedLeftArrow",
		curvedUpArrow: "curvedUpArrow",
		curvedDownArrow: "curvedDownArrow",
		stripedRightArrow: "stripedRightArrow",
		notchedRightArrow: "notchedRightArrow",
		pentagonArrow: "homePlate",
		chevron: "chevron",
		rightArrowCallout: "rightArrowCallout",
		downArrowCallout: "downArrowCallout",
		leftArrowCallout: "leftArrowCallout",
		upArrowCallout: "upArrowCallout",
		leftRightArrowCallout: "leftRightArrowCallout",
		upDownArrowCallout: "upDownArrowCallout",
		quadArrowCallout: "quadArrowCallout",
		circularArrow: "circularArrow",
		leftCircularArrow: "leftCircularArrow",
		leftRightCircularArrow: "leftRightCircularArrow",
		swooshArrow: "swooshArrow",
		mathPlus: "mathPlus",
		mathMinus: "mathMinus",
		mathMultiply: "mathMultiply",
		mathDivide: "mathDivide",
		mathEqual: "mathEqual",
		mathNotEqual: "mathNotEqual",
		flowChartProcess: "flowChartProcess",
		flowChartAlternateProcess: "flowChartAlternateProcess",
		flowChartDecision: "flowChartDecision",
		flowChartInputOutput: "flowChartInputOutput",
		flowChartPredefinedProcess: "flowChartPredefinedProcess",
		flowChartInternalStorage: "flowChartInternalStorage",
		flowChartDocument: "flowChartDocument",
		flowChartMultidocument: "flowChartMultidocument",
		flowChartTerminator: "flowChartTerminator",
		flowChartPreparation: "flowChartPreparation",
		flowChartManualInput: "flowChartManualInput",
		flowChartManualOperation: "flowChartManualOperation",
		flowChartConnector: "flowChartConnector",
		flowChartOffpageConnector: "flowChartOffpageConnector",
		flowChartPunchedCard: "flowChartPunchedCard",
		flowChartPunchedTape: "flowChartPunchedTape",
		flowChartSummingJunction: "flowChartSummingJunction",
		flowChartOr: "flowChartOr",
		flowChartCollate: "flowChartCollate",
		flowChartSort: "flowChartSort",
		flowChartExtract: "flowChartExtract",
		flowChartMerge: "flowChartMerge",
		flowChartOfflineStorage: "flowChartOfflineStorage",
		flowChartOnlineStorage: "flowChartOnlineStorage",
		flowChartDelay: "flowChartDelay",
		flowChartMagneticTape: "flowChartMagneticTape",
		flowChartMagneticDisk: "flowChartMagneticDisk",
		flowChartMagneticDrum: "flowChartMagneticDrum",
		flowChartDisplay: "flowChartDisplay",
		explosion12: "irregularSeal1",
		explosion14: "irregularSeal2",
		star4: "star4",
		star5: "star5",
		star6: "star6",
		star7: "star7",
		star8: "star8",
		star10: "star10",
		star12: "star12",
		star16: "star16",
		star24: "star24",
		star32: "star32",
		ribbonUp: "ribbon2",
		ribbonDown: "ribbon",
		curvedRibbonUp: "ellipseRibbon2",
		curvedRibbonDown: "ellipseRibbon",
		leftRightRibbon: "leftRightRibbon",
		verticalScroll: "verticalScroll",
		horizontalScroll: "horizontalScroll",
		wave: "wave",
		doubleWave: "doubleWave",
		rectangularCallout: "wedgeRectCallout",
		roundedRectangularCallout: "wedgeRoundRectCallout",
		ellipticalCallout: "wedgeEllipseCallout",
		cloudCallout: "cloudCallout",
		lineCallout: "borderCallout1",
		bentLineCallout: "borderCallout2",
		doubleBentLineCallout: "borderCallout3",
		lineCalloutWithAccentBar: "accentCallout1",
		bentLineCalloutWithAccentBar: "accentCallout2",
		doubleBentLineCalloutWithAccentBar: "accentCallout3",
		lineCalloutWithNoBorder: "callout1",
		bentLineCalloutWithNoBorder: "callout2",
		doubleBentLineCalloutWithNoBorder: "callout3",
		lineCalloutWithBorderAndAccentBar: "accentBorderCallout1",
		bentLineCalloutWithBorderAndAccentBar: "accentBorderCallout2",
		doubleBentLineCalloutWithBorderAndAccentBar: "accentBorderCallout3",
		actionButtonBlank: "actionButtonBlank",
		actionButtonHome: "actionButtonHome",
		actionButtonHelp: "actionButtonHelp",
		actionButtonInformation: "actionButtonInformation",
		actionButtonForwardNext: "actionButtonForwardNext",
		actionButtonBackPrevious: "actionButtonBackPrevious",
		actionButtonEnd: "actionButtonEnd",
		actionButtonBeginning: "actionButtonBeginning",
		actionButtonReturn: "actionButtonReturn",
		actionButtonDocument: "actionButtonDocument",
		actionButtonSound: "actionButtonSound",
		actionButtonMovie: "actionButtonMovie",
		gear6: "gear6",
		gear9: "gear9",
		funnel: "funnel",
		cornerTabs: "cornerTabs",
		squareTabs: "squareTabs",
		plaqueTabs: "plaqueTabs",
		chartX: "chartX",
		chartStar: "chartStar",
		chartPlus: "chartPlus"
	};
	var OOXML_NAMES = new Map(Object.entries(PRESET_SHAPE_OOXML_NAMES));
	var NAMES_BY_OOXML_NAME = new Map(Object.entries(PRESET_SHAPE_OOXML_NAMES).map(([name, ooxml]) => [ooxml, name]));
	/**
	* The OOXML name (`ST_ShapeType`) of a preset shape, such as `"roundRect"` for a `"roundedRectangle"`.
	*
	* @throws If `type` is not a preset shape. The error suggests the right name when `type` is an OOXML name
	*/
	var getOoxmlShapeName = (type) => {
		const ooxmlName = OOXML_NAMES.get(type);
		if (ooxmlName === void 0) {
			const suggestion = NAMES_BY_OOXML_NAME.get(type);
			throw new Error(`Invalid shape type "${type}".${suggestion ? ` Did you mean "${suggestion}"?` : ""}`);
		}
		return ooxmlName;
	};
	var CONNECTOR_SHAPE_TYPES = /* @__PURE__ */ new Set([
		"line",
		"inverseLine",
		"straightConnector",
		"elbowConnectorOneBend",
		"elbowConnector",
		"elbowConnectorThreeBends",
		"elbowConnectorFourBends",
		"curvedConnectorOneBend",
		"curvedConnector",
		"curvedConnectorThreeBends",
		"curvedConnectorFourBends"
	]);
	/**
	* Whether a preset is a line or connector. Word writes these with `wps:cNvCnPr`
	* (connector properties) instead of `wps:cNvSpPr`.
	*/
	var isConnectorShapeType = (type) => CONNECTOR_SHAPE_TYPES.has(type);
	//#endregion
	//#region src/shapes/preset-shape/shape-adjustments.ts
	var percent = (guide, scale = 1) => ({
		guide,
		factor: 1e3 * scale
	});
	var degrees$1 = (guide) => ({
		guide,
		factor: 6e4
	});
	var remainingPercent = (guide) => ({
		guide,
		factor: -1e3,
		offset: 1e5
	});
	var PRESET_SHAPE_ADJUSTMENTS = {
		arc: {
			startAngle: degrees$1("adj1"),
			endAngle: degrees$1("adj2")
		},
		bentArrow: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2", .5),
			headLength: percent("adj3"),
			bendRadius: percent("adj4")
		},
		bentLineCallout: {
			lineStartX: percent("adj2"),
			lineStartY: percent("adj1"),
			bendX: percent("adj4"),
			bendY: percent("adj3"),
			lineEndX: percent("adj6"),
			lineEndY: percent("adj5")
		},
		bentLineCalloutWithAccentBar: {
			lineStartX: percent("adj2"),
			lineStartY: percent("adj1"),
			bendX: percent("adj4"),
			bendY: percent("adj3"),
			lineEndX: percent("adj6"),
			lineEndY: percent("adj5")
		},
		bentLineCalloutWithBorderAndAccentBar: {
			lineStartX: percent("adj2"),
			lineStartY: percent("adj1"),
			bendX: percent("adj4"),
			bendY: percent("adj3"),
			lineEndX: percent("adj6"),
			lineEndY: percent("adj5")
		},
		bentLineCalloutWithNoBorder: {
			lineStartX: percent("adj2"),
			lineStartY: percent("adj1"),
			bendX: percent("adj4"),
			bendY: percent("adj3"),
			lineEndX: percent("adj6"),
			lineEndY: percent("adj5")
		},
		bentUpArrow: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2", .5),
			headLength: percent("adj3")
		},
		beveledRectangle: { bevelWidth: percent("adj") },
		blockArc: {
			startAngle: degrees$1("adj1"),
			endAngle: degrees$1("adj2"),
			thickness: percent("adj3")
		},
		bracePair: { curveRadius: percent("adj") },
		bracketPair: { cornerRadius: percent("adj") },
		chevron: { pointLength: percent("adj") },
		chord: {
			startAngle: degrees$1("adj1"),
			endAngle: degrees$1("adj2")
		},
		circularArrow: {
			shaftThickness: percent("adj1"),
			headAngle: degrees$1("adj2"),
			endAngle: degrees$1("adj3"),
			startAngle: degrees$1("adj4"),
			headWidth: percent("adj5", .5)
		},
		cloudCallout: {
			pointerX: percent("adj1"),
			pointerY: percent("adj2")
		},
		cross: { cornerSize: percent("adj") },
		cube: { depth: percent("adj") },
		curvedConnector: { bendX: percent("adj1") },
		curvedConnectorFourBends: {
			firstBendX: percent("adj1"),
			secondBendY: percent("adj2"),
			thirdBendX: percent("adj3")
		},
		curvedConnectorThreeBends: {
			firstBendX: percent("adj1"),
			secondBendY: percent("adj2")
		},
		curvedDownArrow: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2"),
			headLength: percent("adj3")
		},
		curvedLeftArrow: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2"),
			headLength: percent("adj3")
		},
		curvedRibbonDown: {
			thickness: percent("adj1"),
			centerWidth: percent("adj2"),
			curveDepth: percent("adj3")
		},
		curvedRibbonUp: {
			thickness: percent("adj1"),
			centerWidth: percent("adj2"),
			curveDepth: percent("adj3")
		},
		curvedRightArrow: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2"),
			headLength: percent("adj3")
		},
		curvedUpArrow: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2"),
			headLength: percent("adj3")
		},
		cylinder: { topHeight: percent("adj") },
		diagonalRoundedCornersRectangle: {
			topLeftBottomRightRadius: percent("adj1"),
			topRightBottomLeftRadius: percent("adj2")
		},
		diagonalSnippedCornersRectangle: {
			topLeftBottomRightSize: percent("adj1"),
			topRightBottomLeftSize: percent("adj2")
		},
		diagonalStripe: { stripeWidth: remainingPercent("adj") },
		donut: { thickness: percent("adj") },
		doubleBentLineCallout: {
			lineStartX: percent("adj2"),
			lineStartY: percent("adj1"),
			firstBendX: percent("adj4"),
			firstBendY: percent("adj3"),
			secondBendX: percent("adj6"),
			secondBendY: percent("adj5"),
			lineEndX: percent("adj8"),
			lineEndY: percent("adj7")
		},
		doubleBentLineCalloutWithAccentBar: {
			lineStartX: percent("adj2"),
			lineStartY: percent("adj1"),
			firstBendX: percent("adj4"),
			firstBendY: percent("adj3"),
			secondBendX: percent("adj6"),
			secondBendY: percent("adj5"),
			lineEndX: percent("adj8"),
			lineEndY: percent("adj7")
		},
		doubleBentLineCalloutWithBorderAndAccentBar: {
			lineStartX: percent("adj2"),
			lineStartY: percent("adj1"),
			firstBendX: percent("adj4"),
			firstBendY: percent("adj3"),
			secondBendX: percent("adj6"),
			secondBendY: percent("adj5"),
			lineEndX: percent("adj8"),
			lineEndY: percent("adj7")
		},
		doubleBentLineCalloutWithNoBorder: {
			lineStartX: percent("adj2"),
			lineStartY: percent("adj1"),
			firstBendX: percent("adj4"),
			firstBendY: percent("adj3"),
			secondBendX: percent("adj6"),
			secondBendY: percent("adj5"),
			lineEndX: percent("adj8"),
			lineEndY: percent("adj7")
		},
		doubleWave: {
			waveHeight: percent("adj1"),
			skew: percent("adj2")
		},
		downArrow: {
			shaftThickness: percent("adj1"),
			headLength: percent("adj2")
		},
		downArrowCallout: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2", .5),
			headLength: percent("adj3"),
			boxHeight: percent("adj4")
		},
		elbowConnector: { bendX: percent("adj1") },
		elbowConnectorFourBends: {
			firstBendX: percent("adj1"),
			secondBendY: percent("adj2"),
			thirdBendX: percent("adj3")
		},
		elbowConnectorThreeBends: {
			firstBendX: percent("adj1"),
			secondBendY: percent("adj2")
		},
		ellipticalCallout: {
			pointerX: percent("adj1"),
			pointerY: percent("adj2")
		},
		foldedCorner: { foldSize: percent("adj") },
		frame: { thickness: percent("adj1") },
		gear6: {
			toothHeight: percent("adj1"),
			toothWidth: percent("adj2")
		},
		gear9: {
			toothHeight: percent("adj1"),
			toothWidth: percent("adj2")
		},
		halfFrame: {
			horizontalArmThickness: percent("adj1"),
			verticalArmThickness: percent("adj2")
		},
		hexagon: { pointLength: percent("adj") },
		horizontalScroll: { rollSize: percent("adj") },
		leftArrow: {
			shaftThickness: percent("adj1"),
			headLength: percent("adj2")
		},
		leftArrowCallout: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2", .5),
			headLength: percent("adj3"),
			boxWidth: percent("adj4")
		},
		leftBrace: {
			curveHeight: percent("adj1"),
			pointPosition: percent("adj2")
		},
		leftBracket: { cornerHeight: percent("adj") },
		leftCircularArrow: {
			shaftThickness: percent("adj1"),
			headAngle: degrees$1("adj2"),
			endAngle: degrees$1("adj3"),
			startAngle: degrees$1("adj4"),
			headWidth: percent("adj5", .5)
		},
		leftRightArrow: {
			shaftThickness: percent("adj1"),
			headLength: percent("adj2")
		},
		leftRightArrowCallout: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2", .5),
			headLength: percent("adj3"),
			boxWidth: percent("adj4")
		},
		leftRightCircularArrow: {
			shaftThickness: percent("adj1"),
			headAngle: degrees$1("adj2"),
			endAngle: degrees$1("adj3"),
			startAngle: degrees$1("adj4"),
			headWidth: percent("adj5", .5)
		},
		leftRightRibbon: {
			thickness: percent("adj1"),
			endLength: percent("adj2"),
			verticalOffset: percent("adj3")
		},
		leftRightUpArrow: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2", .5),
			headLength: percent("adj3")
		},
		leftUpArrow: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2", .5),
			headLength: percent("adj3")
		},
		lineCallout: {
			lineStartX: percent("adj2"),
			lineStartY: percent("adj1"),
			lineEndX: percent("adj4"),
			lineEndY: percent("adj3")
		},
		lineCalloutWithAccentBar: {
			lineStartX: percent("adj2"),
			lineStartY: percent("adj1"),
			lineEndX: percent("adj4"),
			lineEndY: percent("adj3")
		},
		lineCalloutWithBorderAndAccentBar: {
			lineStartX: percent("adj2"),
			lineStartY: percent("adj1"),
			lineEndX: percent("adj4"),
			lineEndY: percent("adj3")
		},
		lineCalloutWithNoBorder: {
			lineStartX: percent("adj2"),
			lineStartY: percent("adj1"),
			lineEndX: percent("adj4"),
			lineEndY: percent("adj3")
		},
		lShape: {
			horizontalArmThickness: percent("adj1"),
			verticalArmThickness: percent("adj2")
		},
		mathDivide: {
			thickness: percent("adj1"),
			gap: percent("adj2"),
			dotRadius: percent("adj3")
		},
		mathEqual: {
			thickness: percent("adj1"),
			gap: percent("adj2")
		},
		mathMinus: { thickness: percent("adj1") },
		mathMultiply: { thickness: percent("adj1") },
		mathNotEqual: {
			thickness: percent("adj1"),
			slashAngle: degrees$1("adj2"),
			gap: percent("adj3")
		},
		mathPlus: { thickness: percent("adj1") },
		moon: { thickness: percent("adj") },
		nonIsoscelesTrapezoid: {
			leftSlant: percent("adj1"),
			rightSlant: percent("adj2")
		},
		noSymbol: { thickness: percent("adj") },
		notchedRightArrow: {
			shaftThickness: percent("adj1"),
			headLength: percent("adj2")
		},
		octagon: { cornerSize: percent("adj") },
		parallelogram: { slant: percent("adj") },
		pentagonArrow: { pointLength: percent("adj") },
		pie: {
			startAngle: degrees$1("adj1"),
			endAngle: degrees$1("adj2")
		},
		plaque: { cornerRadius: percent("adj") },
		quadArrow: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2", .5),
			headLength: percent("adj3")
		},
		quadArrowCallout: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2", .5),
			headLength: percent("adj3"),
			boxSize: percent("adj4")
		},
		rectangularCallout: {
			pointerX: percent("adj1"),
			pointerY: percent("adj2")
		},
		ribbonDown: {
			endOffset: percent("adj1"),
			centerWidth: percent("adj2")
		},
		ribbonUp: {
			endOffset: percent("adj1"),
			centerWidth: percent("adj2")
		},
		rightArrow: {
			shaftThickness: percent("adj1"),
			headLength: percent("adj2")
		},
		rightArrowCallout: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2", .5),
			headLength: percent("adj3"),
			boxWidth: percent("adj4")
		},
		rightBrace: {
			curveHeight: percent("adj1"),
			pointPosition: percent("adj2")
		},
		rightBracket: { cornerHeight: percent("adj") },
		roundedAndSnippedCornersRectangle: {
			roundedCornerRadius: percent("adj1"),
			snippedCornerSize: percent("adj2")
		},
		roundedCornerRectangle: { cornerRadius: percent("adj") },
		roundedRectangle: { cornerRadius: percent("adj") },
		roundedRectangularCallout: {
			pointerX: percent("adj1"),
			pointerY: percent("adj2"),
			cornerRadius: percent("adj3")
		},
		smileyFace: { smile: percent("adj") },
		snippedCornerRectangle: { cornerSize: percent("adj") },
		star10: { innerRadius: percent("adj", .5) },
		star12: { innerRadius: percent("adj", .5) },
		star16: { innerRadius: percent("adj", .5) },
		star24: { innerRadius: percent("adj", .5) },
		star32: { innerRadius: percent("adj", .5) },
		star4: { innerRadius: percent("adj", .5) },
		star5: { innerRadius: percent("adj", .5) },
		star6: { innerRadius: percent("adj", .5) },
		star7: { innerRadius: percent("adj", .5) },
		star8: { innerRadius: percent("adj", .5) },
		stripedRightArrow: {
			shaftThickness: percent("adj1"),
			headLength: percent("adj2")
		},
		sun: { rayLength: percent("adj") },
		swooshArrow: {
			shaftThickness: percent("adj1"),
			headLength: percent("adj2")
		},
		teardrop: { pointLength: percent("adj") },
		topRoundedCornersRectangle: {
			topCornerRadius: percent("adj1"),
			bottomCornerRadius: percent("adj2")
		},
		topSnippedCornersRectangle: {
			topCornerSize: percent("adj1"),
			bottomCornerSize: percent("adj2")
		},
		trapezoid: { slant: percent("adj") },
		triangle: { apexPosition: percent("adj") },
		upArrow: {
			shaftThickness: percent("adj1"),
			headLength: percent("adj2")
		},
		upArrowCallout: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2", .5),
			headLength: percent("adj3"),
			boxHeight: percent("adj4")
		},
		upDownArrow: {
			shaftThickness: percent("adj1"),
			headLength: percent("adj2")
		},
		upDownArrowCallout: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2", .5),
			headLength: percent("adj3"),
			boxHeight: percent("adj4")
		},
		uTurnArrow: {
			shaftThickness: percent("adj1"),
			headWidth: percent("adj2", .5),
			headLength: percent("adj3"),
			bendRadius: percent("adj4"),
			tipPosition: percent("adj5")
		},
		verticalScroll: { rollSize: percent("adj") },
		wave: {
			waveHeight: percent("adj1"),
			skew: percent("adj2")
		}
	};
	/**
	* Converts a shape's adjustments to the shape guides written in `a:avLst`, keyed by guide name.
	*
	* @throws If the shape does not have an adjustment with one of the given names
	*
	* @example
	* ```typescript
	* createShapeGuides("roundedRectangle", { cornerRadius: 25 }); // { adj: 25000 }
	* createShapeGuides("pie", { startAngle: 0, endAngle: 270 }); // { adj1: 0, adj2: 16200000 }
	* ```
	*/
	var createShapeGuides = (type, adjustments = {}) => {
		const definitions = type in PRESET_SHAPE_ADJUSTMENTS ? PRESET_SHAPE_ADJUSTMENTS[type] : {};
		const names = Object.keys(definitions);
		return Object.fromEntries(Object.entries(adjustments).flatMap(([name, value]) => {
			if (!names.includes(name)) throw new Error(names.length === 0 ? `Invalid adjustment "${name}". Shape "${type}" has no adjustments` : `Invalid adjustment "${name}" for shape "${type}". Expected one of: ${names.join(", ")}`);
			const { guide, factor, offset = 0 } = definitions[name];
			return value === void 0 ? [] : [[guide, offset + value * factor]];
		}));
	};
	//#endregion
	//#region src/shapes/preset-shape/shape-units.ts
	/**
	* Converts the human units shape options are given in (points, degrees and percentages from 0 to 100)
	* to the units DrawingML stores (EMUs, 60,000ths of a degree and thousandths of a percent).
	*
	* @module
	*/
	var EMUS_PER_POINT = 12700;
	var MAX_POINTS = 1584;
	var ANGLE_UNITS_PER_DEGREE$1 = 6e4;
	/**
	* Checks that a percentage option is between 0 and 100 and returns it.
	*
	* @throws If the value is outside 0 to 100
	*/
	var percentageValue = (value, option) => {
		if (!(value >= 0 && value <= 100)) throw new Error(`Invalid ${option} ${value}. Expected a number from 0 to 100`);
		return value;
	};
	/**
	* Converts a length in points to EMUs.
	*
	* @throws If the length is negative or more than 1584 points (22 inches)
	*/
	var pointsToEmus = (points, option) => {
		if (!(points >= 0 && points <= MAX_POINTS)) throw new Error(`Invalid ${option} ${points}. Expected a number of points from 0 to ${MAX_POINTS}`);
		return Math.round(points * EMUS_PER_POINT);
	};
	/**
	* Converts an angle in degrees to an `ST_PositiveFixedAngle`: 60,000ths of a degree, from 0 up to (not including) 360 degrees.
	* Negative angles and angles of a full turn or more are brought into that range.
	*/
	var positiveFixedAngle = (degrees) => Math.round((degrees % 360 + 360) % 360 * ANGLE_UNITS_PER_DEGREE$1) % (360 * ANGLE_UNITS_PER_DEGREE$1);
	//#endregion
	//#region src/shapes/preset-shape/shape-color.ts
	/**
	* Colours for shape fills and lines.
	*
	* `src/charts/chart-color.ts` is a copy of this file, as `docx/charts` and `docx/shapes` are separate entries that import
	* only `docx`. Make a fix in both.
	*
	* @module
	*/
	var THEME_COLOR_OOXML_NAMES = new Map(Object.entries({
		dark1: "dk1",
		light1: "lt1",
		dark2: "dk2",
		light2: "lt2",
		accent1: "accent1",
		accent2: "accent2",
		accent3: "accent3",
		accent4: "accent4",
		accent5: "accent5",
		accent6: "accent6",
		hyperlink: "hlink",
		followedHyperlink: "folHlink"
	}));
	var THEME_COLOR_SUGGESTIONS = new Map([
		...[...THEME_COLOR_OOXML_NAMES].map(([name, ooxml]) => [ooxml, name]),
		["text1", "dark1"],
		["background1", "light1"],
		["text2", "dark2"],
		["background2", "light2"]
	]);
	var createColorChange = ({ name, value }) => new docx.BuilderElement({
		name,
		attributes: { value: {
			key: "val",
			value
		} }
	});
	/**
	* How a theme colour is made lighter or darker, as Word does it: by scaling its luminance (`lumMod`), and for a lighter
	* colour, adding to it (`lumOff`). Both are in thousandths of a percent.
	*/
	var themeColorChanges = ({ lighter, darker }) => {
		if (lighter !== void 0 && darker !== void 0) throw new Error("Invalid theme colour. Expected lighter or darker, not both");
		if (lighter !== void 0) {
			const amount = percentageValue(lighter, "lighter");
			return [{
				name: "a:lumMod",
				value: Math.round((100 - amount) * 1e3)
			}, {
				name: "a:lumOff",
				value: Math.round(amount * 1e3)
			}];
		}
		return darker === void 0 ? [] : [{
			name: "a:lumMod",
			value: Math.round((100 - percentageValue(darker, "darker")) * 1e3)
		}];
	};
	var createThemeColor = (color, changes) => {
		const name = THEME_COLOR_OOXML_NAMES.get(color.theme);
		if (name === void 0) {
			const suggestion = THEME_COLOR_SUGGESTIONS.get(color.theme);
			throw new Error(`Invalid theme colour "${color.theme}". ${suggestion ? `Did you mean "${suggestion}"?` : `Expected one of ${[...THEME_COLOR_OOXML_NAMES.keys()].join(", ")}`}`);
		}
		return new docx.BuilderElement({
			name: "a:schemeClr",
			attributes: { value: {
				key: "val",
				value: name
			} },
			children: [...themeColorChanges(color), ...changes].map(createColorChange)
		});
	};
	/**
	* Creates an `a:srgbClr` element from a hex colour, or an `a:schemeClr` element from a colour of the document's theme,
	* with an optional transparency.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_SRgbColor">
	*   <xsd:sequence>
	*     <xsd:group ref="EG_ColorTransform" minOccurs="0" maxOccurs="unbounded"/>
	*   </xsd:sequence>
	*   <xsd:attribute name="val" type="s:ST_HexColorRGB" use="required"/>
	* </xsd:complexType>
	*
	* <xsd:complexType name="CT_SchemeColor">
	*   <xsd:sequence>
	*     <xsd:group ref="EG_ColorTransform" minOccurs="0" maxOccurs="unbounded"/>
	*   </xsd:sequence>
	*   <xsd:attribute name="val" type="ST_SchemeColorVal" use="required"/>
	* </xsd:complexType>
	* ```
	*
	* @param color - A 6-digit hex colour such as `"FF0000"` or `"#FF0000"`, or a colour of the document's theme
	* @param transparency - From 0 (opaque) to 100 (invisible)
	* @throws If the colour is not a 6-digit hex value or a colour of the theme, or a percentage is outside 0 to 100
	*
	* @example
	* ```typescript
	* createShapeColor("1F4E79", 25); // <a:srgbClr val="1F4E79"><a:alpha val="75000"/></a:srgbClr>
	* createShapeColor({ theme: "accent1", darker: 25 }); // <a:schemeClr val="accent1"><a:lumMod val="75000"/></a:schemeClr>
	* ```
	*/
	var createShapeColor = (color, transparency) => {
		const changes = transparency ? [{
			name: "a:alpha",
			value: Math.round((100 - percentageValue(transparency, "transparency")) * 1e3)
		}] : [];
		if (typeof color !== "string") return createThemeColor(color, changes);
		if (color === "auto") throw new Error(`Invalid shape color 'auto'. Expected 6 digit hex value`);
		return new docx.BuilderElement({
			name: "a:srgbClr",
			attributes: { value: {
				key: "val",
				value: (0, docx.hexColorValue)(color)
			} },
			children: changes.map(createColorChange)
		});
	};
	/**
	* Whether a fill or line given as an object is a colour of the document's theme.
	*/
	var isThemeColor = (value) => "theme" in value;
	//#endregion
	//#region src/shapes/preset-shape/shape-effects.ts
	/**
	* Effects for preset shapes: shadows, glow, soft edges and reflection.
	*
	* Reference: ECMA-376 Part 1, 20.1.8.26 effectLst (Effect Container)
	*
	* @module
	*/
	var resolveShadow = ({ color = "000000", transparency = 60, blur = 4, distance = 3, angle = 45 }) => ({
		color,
		transparency,
		blur: pointsToEmus(blur, "shadow blur"),
		distance: pointsToEmus(distance, "shadow distance"),
		angle
	});
	var resolveReflection = ({ transparency = 50, size = 50, distance = 0, blur = .5 }) => ({
		transparency: percentageValue(transparency, "reflection transparency"),
		size: percentageValue(size, "reflection size"),
		distance: pointsToEmus(distance, "reflection distance"),
		blur: pointsToEmus(blur, "reflection blur")
	});
	var createGlow = ({ color, size = 5, transparency = 60 }) => new docx.BuilderElement({
		name: "a:glow",
		attributes: { radius: {
			key: "rad",
			value: pointsToEmus(size, "glow size")
		} },
		children: [createShapeColor(color, transparency)]
	});
	var createInnerShadow = (shadow) => {
		const { color, transparency, blur, distance, angle } = resolveShadow(shadow);
		return new docx.BuilderElement({
			name: "a:innerShdw",
			attributes: {
				blur: {
					key: "blurRad",
					value: blur
				},
				distance: {
					key: "dist",
					value: distance
				},
				direction: {
					key: "dir",
					value: positiveFixedAngle(angle)
				}
			},
			children: [createShapeColor(color, transparency)]
		});
	};
	var createOuterShadow = (shadow) => {
		const { color, transparency, blur, distance, angle } = resolveShadow(shadow);
		return new docx.BuilderElement({
			name: "a:outerShdw",
			attributes: {
				blur: {
					key: "blurRad",
					value: blur
				},
				distance: {
					key: "dist",
					value: distance
				},
				direction: {
					key: "dir",
					value: positiveFixedAngle(angle)
				},
				rotateWithShape: {
					key: "rotWithShape",
					value: false
				}
			},
			children: [createShapeColor(color, transparency)]
		});
	};
	var createReflection = (reflection) => {
		const { transparency, size, distance, blur } = resolveReflection(reflection);
		return new docx.BuilderElement({
			name: "a:reflection",
			attributes: {
				blur: {
					key: "blurRad",
					value: blur
				},
				startAlpha: {
					key: "stA",
					value: Math.round((100 - transparency) * 1e3)
				},
				endAlpha: {
					key: "endA",
					value: 300
				},
				endPosition: {
					key: "endPos",
					value: Math.round(size * 1e3)
				},
				distance: {
					key: "dist",
					value: distance
				},
				direction: {
					key: "dir",
					value: 54e5
				},
				scaleY: {
					key: "sy",
					value: -1e5
				},
				alignment: {
					key: "algn",
					value: "bl"
				},
				rotateWithShape: {
					key: "rotWithShape",
					value: false
				}
			}
		});
	};
	var createSoftEdges = (radius) => new docx.BuilderElement({
		name: "a:softEdge",
		attributes: { radius: {
			key: "rad",
			value: pointsToEmus(radius, "soft edges radius")
		} }
	});
	/**
	* Creates the `a:effectLst` element for a shape, with its effects in the order the schema requires.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_EffectList">
	*   <xsd:sequence>
	*     <xsd:element name="blur" type="CT_BlurEffect" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="fillOverlay" type="CT_FillOverlayEffect" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="glow" type="CT_GlowEffect" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="innerShdw" type="CT_InnerShadowEffect" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="outerShdw" type="CT_OuterShadowEffect" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="prstShdw" type="CT_PresetShadowEffect" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="reflection" type="CT_ReflectionEffect" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="softEdge" type="CT_SoftEdgesEffect" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*
	* @throws If a colour, transparency, size or distance is invalid
	*/
	var createShapeEffects = ({ shadow, innerShadow, glow, softEdges, reflection }) => new docx.BuilderElement({
		name: "a:effectLst",
		children: [
			...glow ? [createGlow(glow)] : [],
			...innerShadow ? [createInnerShadow(innerShadow)] : [],
			...shadow ? [createOuterShadow(shadow)] : [],
			...reflection ? [createReflection(reflection)] : [],
			...softEdges === void 0 ? [] : [createSoftEdges(softEdges)]
		]
	});
	var getShadowOverhang = (shadow) => {
		const { blur, distance, angle } = resolveShadow(shadow);
		const radians = angle * Math.PI / 180;
		const dx = distance * Math.cos(radians);
		const dy = distance * Math.sin(radians);
		return {
			top: Math.max(0, blur - dy),
			right: Math.max(0, blur + dx),
			bottom: Math.max(0, blur + dy),
			left: Math.max(0, blur - dx)
		};
	};
	var getGlowOverhang = ({ size = 5 }) => {
		const radius = pointsToEmus(size, "glow size");
		return {
			top: radius,
			right: radius,
			bottom: radius,
			left: radius
		};
	};
	var getReflectionOverhang = (reflection, height) => {
		const { size, distance, blur } = resolveReflection(reflection);
		return {
			top: 0,
			right: 0,
			bottom: distance + height * size / 100 + blur,
			left: 0
		};
	};
	/**
	* How far, in EMUs, a shape's effects reach past each side of its box.
	* Used for the drawing's `wp:effectExtent` so shadows, glows and reflections are not clipped.
	*
	* Inner shadows and soft edges stay inside the shape, so they don't reach past it.
	*
	* @param width - The shape's width in EMUs
	* @param height - The shape's height in EMUs
	* @param rotation - The shape's clockwise rotation in degrees. A rotated shape's effects are allowed for on every side
	*/
	var getShapeEffectsOverhang = ({ shadow, glow, reflection } = {}, height, rotation = 0) => {
		const extents = [
			{
				top: 0,
				right: 0,
				bottom: 0,
				left: 0
			},
			...shadow ? [getShadowOverhang(shadow)] : [],
			...glow ? [getGlowOverhang(glow)] : [],
			...reflection ? [getReflectionOverhang(reflection, height)] : []
		];
		const furthest = (side) => Math.ceil(Math.max(...extents.map((extent) => extent[side])));
		const sides = {
			top: furthest("top"),
			right: furthest("right"),
			bottom: furthest("bottom"),
			left: furthest("left")
		};
		if (rotation % 360 === 0) return sides;
		const all = Math.max(sides.top, sides.right, sides.bottom, sides.left);
		return {
			top: all,
			right: all,
			bottom: all,
			left: all
		};
	};
	//#endregion
	//#region src/shapes/picture/image-data.ts
	/**
	* Turns the pictures given to shapes, as picture fills or pictures in groups, into the media data stored in the document.
	*
	* @module
	*/
	/**
	* Creates the media data for a picture. Its file name comes from a hash of its data, so the same picture
	* used twice is stored once.
	*/
	var createImageMediaData = (image, transformation) => {
		const fileName = `${(0, docx.hashedId)(image.data)}.${image.type}`;
		if (image.type === "svg") return {
			type: "svg",
			fileName,
			data: (0, docx.standardizeData)(image.data),
			transformation,
			fallback: {
				type: image.fallback.type,
				fileName: `${(0, docx.hashedId)(image.fallback.data)}.${image.fallback.type}`,
				data: (0, docx.standardizeData)(image.fallback.data),
				transformation
			}
		};
		return {
			type: image.type,
			fileName,
			data: (0, docx.standardizeData)(image.data),
			transformation
		};
	};
	//#endregion
	//#region \0@oxc-project+runtime@0.152.0/helpers/esm/typeof.js
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.152.0/helpers/esm/toPrimitive.js
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
	//#region \0@oxc-project+runtime@0.152.0/helpers/esm/toPropertyKey.js
	function toPropertyKey(t) {
		var i = toPrimitive(t, "string");
		return "symbol" == _typeof(i) ? i : i + "";
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.152.0/helpers/esm/defineProperty.js
	function _defineProperty(e, r, t) {
		return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
			value: t,
			enumerable: !0,
			configurable: !0,
			writable: !0
		}) : e[r] = t, e;
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.152.0/helpers/esm/objectSpread2.js
	function ownKeys(e, r) {
		var t = Object.keys(e);
		if (Object.getOwnPropertySymbols) {
			var o = Object.getOwnPropertySymbols(e);
			r && (o = o.filter(function(r) {
				return Object.getOwnPropertyDescriptor(e, r).enumerable;
			})), t.push.apply(t, o);
		}
		return t;
	}
	function _objectSpread2(e) {
		for (var r = 1; r < arguments.length; r++) {
			var t = null != arguments[r] ? arguments[r] : {};
			r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
				_defineProperty(e, r, t[r]);
			}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
				Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
			});
		}
		return e;
	}
	//#endregion
	//#region src/shapes/preset-shape/shape-fill.ts
	/**
	* Fills for preset shapes: none, solid, gradient, pattern or picture.
	*
	* @module
	*/
	var GRADIENT_PATH_OOXML_NAMES = {
		circle: "circle",
		rectangle: "rect",
		shape: "shape"
	};
	var PATTERN_OOXML_NAMES = {
		percent5: "pct5",
		percent10: "pct10",
		percent20: "pct20",
		percent25: "pct25",
		percent30: "pct30",
		percent40: "pct40",
		percent50: "pct50",
		percent60: "pct60",
		percent70: "pct70",
		percent75: "pct75",
		percent80: "pct80",
		percent90: "pct90",
		horizontal: "horz",
		vertical: "vert",
		lightHorizontal: "ltHorz",
		lightVertical: "ltVert",
		darkHorizontal: "dkHorz",
		darkVertical: "dkVert",
		narrowHorizontal: "narHorz",
		narrowVertical: "narVert",
		dashedHorizontal: "dashHorz",
		dashedVertical: "dashVert",
		cross: "cross",
		downwardDiagonal: "dnDiag",
		upwardDiagonal: "upDiag",
		lightDownwardDiagonal: "ltDnDiag",
		lightUpwardDiagonal: "ltUpDiag",
		darkDownwardDiagonal: "dkDnDiag",
		darkUpwardDiagonal: "dkUpDiag",
		wideDownwardDiagonal: "wdDnDiag",
		wideUpwardDiagonal: "wdUpDiag",
		dashedDownwardDiagonal: "dashDnDiag",
		dashedUpwardDiagonal: "dashUpDiag",
		diagonalCross: "diagCross",
		smallCheckerBoard: "smCheck",
		largeCheckerBoard: "lgCheck",
		smallGrid: "smGrid",
		largeGrid: "lgGrid",
		dottedGrid: "dotGrid",
		smallConfetti: "smConfetti",
		largeConfetti: "lgConfetti",
		horizontalBrick: "horzBrick",
		diagonalBrick: "diagBrick",
		solidDiamond: "solidDmnd",
		openDiamond: "openDmnd",
		dottedDiamond: "dotDmnd",
		plaid: "plaid",
		sphere: "sphere",
		weave: "weave",
		divot: "divot",
		shingle: "shingle",
		wave: "wave",
		trellis: "trellis",
		zigZag: "zigZag"
	};
	var TILE_ALIGNMENT_OOXML_NAMES = {
		topLeft: "tl",
		top: "t",
		topRight: "tr",
		left: "l",
		center: "ctr",
		right: "r",
		bottomLeft: "bl",
		bottom: "b",
		bottomRight: "br"
	};
	var TILE_MIRROR_OOXML_NAMES = {
		none: "none",
		horizontal: "x",
		vertical: "y",
		both: "xy"
	};
	var createGradientStop = ({ position, color, transparency }) => new docx.BuilderElement({
		name: "a:gs",
		attributes: { position: {
			key: "pos",
			value: Math.round(position * 1e3)
		} },
		children: [createShapeColor(color, transparency)]
	});
	var createLinearShade = (angle) => new docx.BuilderElement({
		name: "a:lin",
		attributes: { angle: {
			key: "ang",
			value: positiveFixedAngle(angle)
		} }
	});
	var createPathShade = (path) => new docx.BuilderElement({
		name: "a:path",
		attributes: { path: {
			key: "path",
			value: GRADIENT_PATH_OOXML_NAMES[path]
		} },
		children: [new docx.BuilderElement({
			name: "a:fillToRect",
			attributes: {
				left: {
					key: "l",
					value: 5e4
				},
				top: {
					key: "t",
					value: 5e4
				},
				right: {
					key: "r",
					value: 5e4
				},
				bottom: {
					key: "b",
					value: 5e4
				}
			}
		})]
	});
	/**
	* Creates an `a:gradFill` element.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_GradientFillProperties">
	*   <xsd:sequence>
	*     <xsd:element name="gsLst" type="CT_GradientStopList" minOccurs="0" maxOccurs="1"/>
	*     <xsd:group ref="EG_ShadeProperties" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="tileRect" type="CT_RelativeRect" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	*   <xsd:attribute name="flip" type="ST_TileFlipMode" use="optional" default="none"/>
	*   <xsd:attribute name="rotWithShape" type="xsd:boolean" use="optional"/>
	* </xsd:complexType>
	* ```
	*
	* @throws If there are fewer than two stops or a stop position is outside 0 to 100
	*/
	var createGradientFill = ({ stops, angle = 0, path }) => {
		if (stops.length < 2) throw new Error(`Invalid gradient fill. Expected at least 2 stops, got ${stops.length}`);
		const sortedStops = [...stops].map((stop) => _objectSpread2(_objectSpread2({}, stop), {}, { position: percentageValue(stop.position, "gradient stop position") })).sort((a, b) => a.position - b.position);
		return new docx.BuilderElement({
			name: "a:gradFill",
			attributes: { rotateWithShape: {
				key: "rotWithShape",
				value: true
			} },
			children: [new docx.BuilderElement({
				name: "a:gsLst",
				children: sortedStops.map(createGradientStop)
			}), path ? createPathShade(path) : createLinearShade(angle)]
		});
	};
	/**
	* Creates an `a:pattFill` element.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_PatternFillProperties">
	*   <xsd:sequence>
	*     <xsd:element name="fgClr" type="CT_Color" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="bgClr" type="CT_Color" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	*   <xsd:attribute name="prst" type="ST_PresetPatternVal" use="optional"/>
	* </xsd:complexType>
	* ```
	*/
	var createPatternFill = ({ pattern, color = "000000", backgroundColor = "FFFFFF" }) => new docx.BuilderElement({
		name: "a:pattFill",
		attributes: { pattern: {
			key: "prst",
			value: PATTERN_OOXML_NAMES[pattern]
		} },
		children: [new docx.BuilderElement({
			name: "a:fgClr",
			children: [createShapeColor(color)]
		}), new docx.BuilderElement({
			name: "a:bgClr",
			children: [createShapeColor(backgroundColor)]
		})]
	});
	var createTile = ({ scale = 100, alignment = "topLeft", mirror = "none" }) => {
		if (!(scale > 0)) throw new Error(`Invalid picture tile scale ${scale}. Expected a percentage greater than 0`);
		return new docx.BuilderElement({
			name: "a:tile",
			attributes: {
				offsetX: {
					key: "tx",
					value: 0
				},
				offsetY: {
					key: "ty",
					value: 0
				},
				scaleX: {
					key: "sx",
					value: Math.round(scale * 1e3)
				},
				scaleY: {
					key: "sy",
					value: Math.round(scale * 1e3)
				},
				mirror: {
					key: "flip",
					value: TILE_MIRROR_OOXML_NAMES[mirror]
				},
				alignment: {
					key: "algn",
					value: TILE_ALIGNMENT_OOXML_NAMES[alignment]
				}
			}
		});
	};
	var createPictureBlip = (mediaData, transparency) => new docx.BuilderElement({
		name: "a:blip",
		attributes: { embed: {
			key: "r:embed",
			value: `rId{${mediaData.type === "svg" ? mediaData.fallback.fileName : mediaData.fileName}}`
		} },
		children: [...transparency ? [new docx.BuilderElement({
			name: "a:alphaModFix",
			attributes: { amount: {
				key: "amt",
				value: Math.round((100 - percentageValue(transparency, "transparency")) * 1e3)
			} }
		})] : [], ...mediaData.type === "svg" ? [createSvgBlipExtension(mediaData)] : []]
	});
	/**
	* An `a:blipFill` element: a picture that fills a shape.
	*
	* The picture is added to the document's media when the shape is written, so it is stored in the package
	* and given a relationship from the part (document, header or footer) the shape is in.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_BlipFillProperties">
	*   <xsd:sequence>
	*     <xsd:element name="blip" type="CT_Blip" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="srcRect" type="CT_RelativeRect" minOccurs="0" maxOccurs="1"/>
	*     <xsd:group ref="EG_FillModeProperties" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	*   <xsd:attribute name="dpi" type="xsd:unsignedInt" use="optional"/>
	*   <xsd:attribute name="rotWithShape" type="xsd:boolean" use="optional"/>
	* </xsd:complexType>
	* ```
	*/
	var PictureFill = class extends docx.XmlComponent {
		constructor({ image, tile, crop, transparency }, name) {
			super(name);
			_defineProperty(this, "mediaData", void 0);
			this.mediaData = createImageMediaData(image, {
				pixels: {
					x: 0,
					y: 0
				},
				emus: {
					x: 0,
					y: 0
				}
			});
			this.root.push(new docx.NextAttributeComponent({ rotateWithShape: {
				key: "rotWithShape",
				value: true
			} }));
			this.root.push(createPictureBlip(this.mediaData, transparency));
			this.root.push(createSourceRectangle(tile ? void 0 : crop));
			this.root.push(tile ? createTile(tile) : createStretch());
		}
		prepForXml(context) {
			context.file.Media.addImage(this.mediaData.fileName, this.mediaData);
			if (this.mediaData.type === "svg") context.file.Media.addImage(this.mediaData.fallback.fileName, this.mediaData.fallback);
			return super.prepForXml(context);
		}
	};
	/**
	* Creates a fill of a picture: `a:blipFill` in a shape, or `pic:blipFill` in a picture. The picture is added to the
	* document's media when it is written.
	*/
	var createPictureFill = (fill, name = "a:blipFill") => new PictureFill(fill, name);
	/**
	* Creates the fill element for a preset shape.
	*
	* - `undefined` or `"none"` writes `<a:noFill/>`
	* - A hex colour, a colour of the theme or a solid fill writes `<a:solidFill>`
	* - A gradient fill writes `<a:gradFill>`
	* - A pattern fill writes `<a:pattFill>`
	* - A picture fill writes `<a:blipFill>`, and adds the picture to the document when it is written
	*/
	var createShapeFill = (fill = "none") => {
		if (fill === "none") return createNoFill();
		if (typeof fill === "string" || isThemeColor(fill)) return new docx.BuilderElement({
			name: "a:solidFill",
			children: [createShapeColor(fill)]
		});
		if (fill.type === "gradient") return createGradientFill(fill);
		if (fill.type === "pattern") return createPatternFill(fill);
		return fill.type === "picture" ? createPictureFill(fill) : new docx.BuilderElement({
			name: "a:solidFill",
			children: [createShapeColor(fill.color, fill.transparency)]
		});
	};
	//#endregion
	//#region src/shapes/preset-shape/shape-line.ts
	/**
	* Lines (outlines) for preset shapes, including dashes and arrowheads.
	*
	* @module
	*/
	var LINE_DASH_OOXML_NAMES = {
		solid: "solid",
		dot: "dot",
		dash: "dash",
		longDash: "lgDash",
		dashDot: "dashDot",
		longDashDot: "lgDashDot",
		longDashDotDot: "lgDashDotDot",
		shortDash: "sysDash",
		shortDot: "sysDot",
		shortDashDot: "sysDashDot",
		shortDashDotDot: "sysDashDotDot"
	};
	var LINE_CAP_OOXML_NAMES = {
		flat: "flat",
		round: "rnd",
		square: "sq"
	};
	var COMPOUND_LINE_OOXML_NAMES = {
		single: "sng",
		double: "dbl",
		thickThin: "thickThin",
		thinThick: "thinThick",
		triple: "tri"
	};
	var ARROWHEAD_SIZES = {
		small: {
			factor: 2,
			ooxmlName: "sm"
		},
		medium: {
			factor: 3,
			ooxmlName: "med"
		},
		large: {
			factor: 5,
			ooxmlName: "lg"
		}
	};
	var resolveLine = (line) => typeof line === "string" || isThemeColor(line) ? { color: line } : line;
	var lineWidthEmus = ({ width = 1 }) => pointsToEmus(width, "line width");
	var resolveArrowhead = (arrowhead) => typeof arrowhead === "string" ? { type: arrowhead } : arrowhead;
	var arrowheadFactor = (arrowhead) => {
		if (!arrowhead) return 1;
		const { width = "medium", length = "medium" } = resolveArrowhead(arrowhead);
		return Math.max(ARROWHEAD_SIZES[width].factor, ARROWHEAD_SIZES[length].factor);
	};
	var createDash = (dash) => {
		if (typeof dash === "string") return new docx.BuilderElement({
			name: "a:prstDash",
			attributes: { value: {
				key: "val",
				value: LINE_DASH_OOXML_NAMES[dash]
			} }
		});
		if (dash.length === 0) throw new Error("Invalid custom line dash. Expected at least 1 dash");
		return new docx.BuilderElement({
			name: "a:custDash",
			children: dash.map(({ length, gap }) => {
				if (!(length >= 0 && gap >= 0)) throw new Error(`Invalid custom line dash { length: ${length}, gap: ${gap} }. Expected lengths of 0 or more`);
				return new docx.BuilderElement({
					name: "a:ds",
					attributes: {
						length: {
							key: "d",
							value: Math.max(1, Math.round(length * 1e5))
						},
						gap: {
							key: "sp",
							value: Math.max(1, Math.round(gap * 1e5))
						}
					}
				});
			})
		});
	};
	var createJoin = (join) => join === "miter" ? new docx.BuilderElement({
		name: "a:miter",
		attributes: { limit: {
			key: "lim",
			value: 8e5
		} }
	}) : new docx.BuilderElement({ name: `a:${join}` });
	var createLineEnd = (name, arrowhead) => {
		const { type, width, length } = resolveArrowhead(arrowhead);
		return new docx.BuilderElement({
			name,
			attributes: {
				type: {
					key: "type",
					value: type
				},
				width: {
					key: "w",
					value: width && ARROWHEAD_SIZES[width].ooxmlName
				},
				length: {
					key: "len",
					value: length && ARROWHEAD_SIZES[length].ooxmlName
				}
			}
		});
	};
	/**
	* Creates the `a:ln` element for a preset shape.
	*
	* - `undefined` writes a solid black line 1pt wide
	* - `"none"` writes `<a:ln><a:noFill/></a:ln>`
	* - A hex colour writes a solid line 1pt wide in that colour
	* - A `gradient` writes `<a:gradFill>` in place of the line's colour
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_LineProperties">
	*   <xsd:sequence>
	*     <xsd:group ref="EG_LineFillProperties" minOccurs="0" maxOccurs="1"/>
	*     <xsd:group ref="EG_LineDashProperties" minOccurs="0" maxOccurs="1"/>
	*     <xsd:group ref="EG_LineJoinProperties" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="headEnd" type="CT_LineEndProperties" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="tailEnd" type="CT_LineEndProperties" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	*   <xsd:attribute name="w" type="ST_LineWidth" use="optional"/>
	*   <xsd:attribute name="cap" type="ST_LineCap" use="optional"/>
	*   <xsd:attribute name="cmpd" type="ST_CompoundLine" use="optional"/>
	*   <xsd:attribute name="algn" type="ST_PenAlignment" use="optional"/>
	* </xsd:complexType>
	* ```
	*
	* @throws If the colour, width, transparency, gradient or custom dash is invalid
	*/
	var createShapeLine = (line = {}) => {
		var _options$color;
		if (line === "none") return new docx.BuilderElement({
			name: "a:ln",
			children: [createNoFill()]
		});
		const options = resolveLine(line);
		return new docx.BuilderElement({
			name: "a:ln",
			attributes: {
				width: {
					key: "w",
					value: lineWidthEmus(options)
				},
				cap: {
					key: "cap",
					value: options.cap && LINE_CAP_OOXML_NAMES[options.cap]
				},
				compound: {
					key: "cmpd",
					value: options.compound && COMPOUND_LINE_OOXML_NAMES[options.compound]
				}
			},
			children: [
				options.gradient ? createShapeFill(_objectSpread2({ type: "gradient" }, options.gradient)) : new docx.BuilderElement({
					name: "a:solidFill",
					children: [createShapeColor((_options$color = options.color) !== null && _options$color !== void 0 ? _options$color : "000000", options.transparency)]
				}),
				...options.dash ? [createDash(options.dash)] : [],
				...options.join ? [createJoin(options.join)] : [],
				...options.startArrow ? [createLineEnd("a:headEnd", options.startArrow)] : [],
				...options.endArrow ? [createLineEnd("a:tailEnd", options.endArrow)] : []
			]
		});
	};
	/**
	* How far, in EMUs, a shape's line (and its arrowheads) can reach past the shape's box.
	* Used for the drawing's `wp:effectExtent` so thick lines and arrowheads are not clipped.
	*/
	var getShapeLineOverhang = (line = {}) => {
		if (line === "none") return 0;
		const options = resolveLine(line);
		const factor = Math.max(arrowheadFactor(options.startArrow), arrowheadFactor(options.endArrow));
		return Math.ceil(lineWidthEmus(options) * factor / 2);
	};
	//#endregion
	//#region src/shapes/custom-geometry/svg-path.ts
	var ARGUMENT_COUNTS = {
		m: 2,
		l: 2,
		h: 1,
		v: 1,
		c: 6,
		s: 4,
		q: 4,
		t: 2,
		a: 7,
		z: 0
	};
	var NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/;
	/**
	* Splits SVG path data into commands and their arguments.
	*
	* @throws If the path doesn't start with a move, has an unknown command, or a command has the wrong number of arguments
	*/
	var tokenize$1 = (path) => {
		const commands = [];
		let index = 0;
		let letter;
		const skipSeparators = () => {
			while (index < path.length && /[\s,]/.test(path[index])) index++;
		};
		const readNumber = () => {
			skipSeparators();
			const match = NUMBER.exec(path.slice(index));
			if (!match) throw new Error(`Invalid path "${path}". Expected a number at position ${index}`);
			index += match[0].length;
			return Number(match[0]);
		};
		const readFlag = () => {
			skipSeparators();
			const flag = path[index];
			if (flag !== "0" && flag !== "1") throw new Error(`Invalid path "${path}". Expected an arc flag of 0 or 1 at position ${index}`);
			index++;
			return Number(flag);
		};
		skipSeparators();
		while (index < path.length) {
			const character = path[index];
			if (/[a-z]/i.test(character)) {
				if (ARGUMENT_COUNTS[character.toLowerCase()] === void 0) throw new Error(`Invalid path "${path}". Unsupported command "${character}"`);
				if (letter === void 0 && character.toLowerCase() !== "m") throw new Error(`Invalid path "${path}". A path must start with a move (M)`);
				letter = character;
				index++;
			} else if (letter === void 0) throw new Error(`Invalid path "${path}". A path must start with a move (M)`);
			else if (letter.toLowerCase() === "z") throw new Error(`Invalid path "${path}". Expected a command at position ${index}`);
			const command = letter.toLowerCase();
			const args = command === "a" ? [
				readNumber(),
				readNumber(),
				readNumber(),
				readFlag(),
				readFlag(),
				readNumber(),
				readNumber()
			] : Array.from({ length: ARGUMENT_COUNTS[command] }, readNumber);
			commands.push({
				letter,
				args
			});
			if (command === "m") letter = letter === "m" ? "l" : "L";
			skipSeparators();
		}
		return commands;
	};
	var angleBetween$1 = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
	/**
	* Converts an SVG arc, given by its end points, to centre form.
	*
	* Reference: https://www.w3.org/TR/SVG11/implnote.html#ArcConversionEndpointToCenter
	*
	* @returns Nothing when the arc is a straight line (a radius is 0) or has no length
	*/
	var toEllipticalArc = (from, to, radiusX, radiusY, rotationDegrees, largeArc, sweep) => {
		if (radiusX === 0 || radiusY === 0 || from.x === to.x && from.y === to.y) return;
		const rotation = rotationDegrees * Math.PI / 180;
		const cos = Math.cos(rotation);
		const sin = Math.sin(rotation);
		const dx = (from.x - to.x) / 2;
		const dy = (from.y - to.y) / 2;
		const x1 = cos * dx + sin * dy;
		const y1 = -sin * dx + cos * dy;
		const lambda = x1 * x1 / (radiusX * radiusX) + y1 * y1 / (radiusY * radiusY);
		const scale = lambda > 1 ? Math.sqrt(lambda) : 1;
		const rx = Math.abs(radiusX) * scale;
		const ry = Math.abs(radiusY) * scale;
		const numerator = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
		const denominator = rx * rx * y1 * y1 + ry * ry * x1 * x1;
		const coefficient = (largeArc === sweep ? -1 : 1) * Math.sqrt(Math.max(0, numerator / denominator));
		const cx1 = coefficient * rx * y1 / ry;
		const cy1 = -coefficient * ry * x1 / rx;
		const startAngle = angleBetween$1(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry);
		const turn = angleBetween$1((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry);
		const sweepAngle = sweep && turn < 0 ? turn + 2 * Math.PI : !sweep && turn > 0 ? turn - 2 * Math.PI : turn;
		return {
			centre: {
				x: cos * cx1 - sin * cy1 + (from.x + to.x) / 2,
				y: sin * cx1 + cos * cy1 + (from.y + to.y) / 2
			},
			radiusX: rx,
			radiusY: ry,
			rotation,
			startAngle,
			sweepAngle
		};
	};
	/**
	* The point on an arc's ellipse at an angle along it, measured as for `startAngle`.
	*/
	var pointOnArc = ({ centre, radiusX, radiusY, rotation }, angle) => ({
		x: centre.x + radiusX * Math.cos(angle) * Math.cos(rotation) - radiusY * Math.sin(angle) * Math.sin(rotation),
		y: centre.y + radiusX * Math.cos(angle) * Math.sin(rotation) + radiusY * Math.sin(angle) * Math.cos(rotation)
	});
	var readCommand = (state, { letter, args }) => {
		const { current } = state;
		const relative = letter === letter.toLowerCase();
		const point = (x, y) => relative ? {
			x: current.x + x,
			y: current.y + y
		} : {
			x,
			y
		};
		const reflect = (control) => control ? {
			x: 2 * current.x - control.x,
			y: 2 * current.y - control.y
		} : current;
		const add = (segment, to, controls = {}) => _objectSpread2({
			segments: [...state.segments, segment],
			current: to,
			subpathStart: state.subpathStart
		}, controls);
		switch (letter.toLowerCase()) {
			case "m": {
				const to = point(args[0], args[1]);
				return _objectSpread2(_objectSpread2({}, add({
					type: "move",
					to
				}, to)), {}, { subpathStart: to });
			}
			case "l": {
				const to = point(args[0], args[1]);
				return add({
					type: "line",
					to
				}, to);
			}
			case "h": {
				const to = {
					x: relative ? current.x + args[0] : args[0],
					y: current.y
				};
				return add({
					type: "line",
					to
				}, to);
			}
			case "v": {
				const to = {
					x: current.x,
					y: relative ? current.y + args[0] : args[0]
				};
				return add({
					type: "line",
					to
				}, to);
			}
			case "c":
			case "s": {
				const smooth = letter.toLowerCase() === "s";
				const control1 = smooth ? reflect(state.lastCubicControl) : point(args[0], args[1]);
				const [x2, y2, x, y] = smooth ? args : args.slice(2);
				const control2 = point(x2, y2);
				const to = point(x, y);
				return add({
					type: "cubic",
					control1,
					control2,
					to
				}, to, { lastCubicControl: control2 });
			}
			case "q":
			case "t": {
				const smooth = letter.toLowerCase() === "t";
				const control = smooth ? reflect(state.lastQuadraticControl) : point(args[0], args[1]);
				const to = smooth ? point(args[0], args[1]) : point(args[2], args[3]);
				return add({
					type: "quadratic",
					control,
					to
				}, to, { lastQuadraticControl: control });
			}
			case "a": {
				const to = point(args[5], args[6]);
				const arc = toEllipticalArc(current, to, args[0], args[1], args[2], args[3] === 1, args[4] === 1);
				return add(arc ? {
					type: "arc",
					from: current,
					to,
					arc
				} : {
					type: "line",
					to
				}, to);
			}
			default: return add({ type: "close" }, state.subpathStart);
		}
	};
	/**
	* Reads SVG path data into segments with absolute coordinates. Horizontal and vertical lines become lines,
	* smooth curves become curves with both control points, and arcs are given in centre form.
	*
	* @throws If the path is empty or not valid path data
	*/
	var parseSvgPath = (path) => {
		const commands = tokenize$1(path);
		if (commands.length === 0) throw new Error("Invalid path. Expected at least a move (M)");
		const origin = {
			x: 0,
			y: 0
		};
		return commands.reduce(readCommand, {
			segments: [],
			current: origin,
			subpathStart: origin
		}).segments;
	};
	var bezierTurningPoints = (coefficients) => {
		const [a, b, c] = coefficients;
		if (Math.abs(a) < 1e-12) return Math.abs(b) < 1e-12 ? [] : [-c / b];
		const discriminant = b * b - 4 * a * c;
		if (discriminant < 0) return [];
		const root = Math.sqrt(discriminant);
		return [(-b + root) / (2 * a), (-b - root) / (2 * a)];
	};
	/**
	* A cubic Bézier curve's position along one axis at `t`, from 0 to 1.
	*/
	var cubicAt = (p0, p1, p2, p3, t) => Math.pow(1 - t, 3) * p0 + 3 * Math.pow(1 - t, 2) * t * p1 + 3 * (1 - t) * t * t * p2 + Math.pow(t, 3) * p3;
	/**
	* A quadratic Bézier curve's position along one axis at `t`, from 0 to 1.
	*/
	var quadraticAt = (p0, p1, p2, t) => Math.pow(1 - t, 2) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
	var isWithin = (t) => t > 0 && t < 1;
	var isOnArc = ({ startAngle, sweepAngle }, angle) => {
		const fullTurn = 2 * Math.PI;
		return ((sweepAngle >= 0 ? angle - startAngle : startAngle - angle) % fullTurn + fullTurn) % fullTurn <= Math.abs(sweepAngle);
	};
	/**
	* The points on a segment furthest left, right, up and down, other than where it starts.
	*/
	var extremePoints = (segment, from) => {
		switch (segment.type) {
			case "cubic": {
				const { control1: c1, control2: c2, to } = segment;
				const turning = (p0, p1, p2, p3) => bezierTurningPoints([
					3 * (-p0 + 3 * p1 - 3 * p2 + p3),
					6 * (p0 - 2 * p1 + p2),
					3 * (p1 - p0)
				]);
				return [...turning(from.x, c1.x, c2.x, to.x), ...turning(from.y, c1.y, c2.y, to.y)].filter(isWithin).map((t) => ({
					x: cubicAt(from.x, c1.x, c2.x, to.x, t),
					y: cubicAt(from.y, c1.y, c2.y, to.y, t)
				})).concat([to]);
			}
			case "quadratic": {
				const { control, to } = segment;
				const turning = (p0, p1, p2) => bezierTurningPoints([
					0,
					2 * (p0 - 2 * p1 + p2),
					2 * (p1 - p0)
				]);
				return [...turning(from.x, control.x, to.x), ...turning(from.y, control.y, to.y)].filter(isWithin).map((t) => ({
					x: quadraticAt(from.x, control.x, to.x, t),
					y: quadraticAt(from.y, control.y, to.y, t)
				})).concat([to]);
			}
			case "arc": {
				const { arc, to } = segment;
				const { radiusX, radiusY, rotation } = arc;
				const xAngle = Math.atan2(-radiusY * Math.sin(rotation), radiusX * Math.cos(rotation));
				const yAngle = Math.atan2(radiusY * Math.cos(rotation), radiusX * Math.sin(rotation));
				return [
					xAngle,
					xAngle + Math.PI,
					yAngle,
					yAngle + Math.PI
				].filter((angle) => isOnArc(arc, angle)).map((angle) => pointOnArc(arc, angle)).concat([to]);
			}
			case "close": return [];
			default: return [segment.to];
		}
	};
	/**
	* The box around a path, reaching the furthest points of its curves rather than their control points.
	*/
	var getPathBounds = (segments) => {
		let current = {
			x: 0,
			y: 0
		};
		let subpathStart = current;
		const points = segments.flatMap((segment) => {
			const extremes = extremePoints(segment, current);
			if (segment.type === "close") current = subpathStart;
			else {
				current = segment.to;
				if (segment.type === "move") subpathStart = current;
			}
			return extremes;
		});
		return {
			left: Math.min(...points.map(({ x }) => x)),
			top: Math.min(...points.map(({ y }) => y)),
			right: Math.max(...points.map(({ x }) => x)),
			bottom: Math.max(...points.map(({ y }) => y))
		};
	};
	//#endregion
	//#region src/shapes/custom-geometry/path-holes.ts
	/**
	* Holes in custom shapes: a closed part of a path inside another part is a hole in it, and a part inside a hole is
	* filled again.
	*
	* Applications fill a path by one of two rules. By the even-odd rule, as LibreOffice fills, a part inside another is
	* always a hole. By the non-zero rule, it is a hole only if it goes round the other way. So each closed part is turned
	* round, where it needs to be, to go the other way to the part it is in, and the rules agree.
	*
	* @module
	*/
	var CURVE_STEPS = 8;
	var steps = (point) => Array.from({ length: CURVE_STEPS }, (_, index) => point((index + 1) / CURVE_STEPS));
	/**
	* The points a segment passes through, after where it starts. A close goes back to the start of the part.
	*/
	var outlineOf = (segment, from, start) => {
		switch (segment.type) {
			case "cubic": {
				const { control1: c1, control2: c2, to } = segment;
				return steps((t) => ({
					x: cubicAt(from.x, c1.x, c2.x, to.x, t),
					y: cubicAt(from.y, c1.y, c2.y, to.y, t)
				}));
			}
			case "quadratic": {
				const { control, to } = segment;
				return steps((t) => ({
					x: quadraticAt(from.x, control.x, to.x, t),
					y: quadraticAt(from.y, control.y, to.y, t)
				}));
			}
			case "arc": {
				const { arc } = segment;
				return steps((t) => pointOnArc(arc, arc.startAngle + arc.sweepAngle * t));
			}
			case "close": return [start];
			default: return [segment.to];
		}
	};
	var signedArea = (outline) => outline.reduce((total, point, index) => {
		const next = outline[(index + 1) % outline.length];
		return total + point.x * next.y - next.x * point.y;
	}, 0);
	var measurePart = (part) => {
		const { start, segments } = part;
		const outline = segments.reduce((points, segment) => [...points, ...outlineOf(segment, points[points.length - 1], start)], [start]);
		const area = signedArea(outline);
		return _objectSpread2(_objectSpread2({}, part), {}, {
			outline,
			turn: Math.abs(area) < 1e-9 ? 0 : Math.sign(area),
			closed: segments.filter(({ type }) => type === "close").length === 1 && segments[segments.length - 1].type === "close"
		});
	};
	/**
	* Splits a path into its parts. A path starts with a move, and each move starts a part.
	*/
	var splitParts = (segments) => segments.reduce((parts, segment) => {
		if (segment.type === "move") return [...parts, {
			start: segment.to,
			segments: []
		}];
		const last = parts[parts.length - 1];
		return [...parts.slice(0, -1), _objectSpread2(_objectSpread2({}, last), {}, { segments: [...last.segments, segment] })];
	}, []);
	var isPointInside = ({ x, y }, outline) => outline.reduce((inside, point, index) => {
		const previous = outline[(index + outline.length - 1) % outline.length];
		return point.y > y !== previous.y > y && x < (previous.x - point.x) * (y - point.y) / (previous.y - point.y) + point.x ? !inside : inside;
	}, false);
	var isInside$1 = (part, other) => part.outline.filter((point) => isPointInside(point, other.outline)).length > part.outline.length / 2;
	var hasEnd = (segment) => segment.type !== "close";
	var reverseSegment = (segment, from) => {
		switch (segment.type) {
			case "cubic": return {
				type: "cubic",
				control1: segment.control2,
				control2: segment.control1,
				to: from
			};
			case "quadratic": return {
				type: "quadratic",
				control: segment.control,
				to: from
			};
			case "arc": {
				const { arc } = segment;
				return {
					type: "arc",
					from: segment.to,
					to: from,
					arc: _objectSpread2(_objectSpread2({}, arc), {}, {
						startAngle: arc.startAngle + arc.sweepAngle,
						sweepAngle: -arc.sweepAngle
					})
				};
			}
			default: return {
				type: "line",
				to: from
			};
		}
	};
	/**
	* A closed part drawn the other way round. It starts where it did, and each segment is drawn backwards.
	*/
	var reversePart = ({ start, segments }) => {
		const drawn = segments.filter(hasEnd);
		const starts = [start, ...drawn.map(({ to }) => to)];
		const end = starts[starts.length - 1];
		const closing = end.x === start.x && end.y === start.y ? [] : [{
			type: "line",
			to: end
		}];
		const backwards = drawn.reduceRight((result, segment, index) => [...result, reverseSegment(segment, starts[index])], []);
		const ending = drawn[0].type === "line" ? backwards.slice(0, -1) : backwards;
		return [
			{
				type: "move",
				to: start
			},
			...closing,
			...ending,
			{ type: "close" }
		];
	};
	/**
	* Turns round the closed parts of a path that go the same way as the part they are directly inside, so that a part
	* inside another is a hole in it whichever rule an application fills paths by. Parts that aren't inside another, and
	* parts that aren't closed, are left as they are.
	*
	* @param segments - A path, starting with a move
	*/
	var orientParts = (segments) => {
		const parts = splitParts(segments).map(measurePart);
		const containers = parts.map((part, index) => parts.flatMap((other, otherIndex) => otherIndex !== index && other.turn !== 0 && isInside$1(part, other) ? [otherIndex] : []));
		const depths = containers.map(({ length }) => length);
		const turnOf = (index) => {
			const parent = containers[index].filter((container) => depths[container] < depths[index]).reduce((deepest, container) => deepest === void 0 || depths[container] > depths[deepest] ? container : deepest, void 0);
			return parent === void 0 || !parts[index].closed ? parts[index].turn : -turnOf(parent);
		};
		return parts.flatMap((part, index) => part.turn !== 0 && turnOf(index) !== part.turn ? reversePart(part) : [{
			type: "move",
			to: part.start
		}, ...part.segments]);
	};
	//#endregion
	//#region src/shapes/custom-geometry/custom-geometry.ts
	/**
	* Custom shapes (`a:custGeom`): polygons and freeform paths drawn from SVG path data.
	*
	* A shape has one path or several, each filled and outlined on its own. The box around all the paths is scaled to fill
	* the shape, and they are written as DrawingML path commands. Every corner and end of the paths is a connection site,
	* unless the shape gives its own connection points, so connectors can attach to custom shapes.
	*
	* Reference: ECMA-376 Part 1, 20.1.9.8 custGeom (Custom Geometry)
	*
	* @module
	*/
	var ANGLE_UNITS_PER_DEGREE = 6e4;
	var QUARTER_TURN = Math.PI / 2;
	var toShape = ({ left, top, x, y }, point) => ({
		x: (point.x - left) * x,
		y: (point.y - top) * y
	});
	var round = ({ x, y }) => ({
		x: Math.round(x),
		y: Math.round(y)
	});
	var degrees = (radians) => radians * 180 / Math.PI;
	var isMultipleOf = (value, step) => {
		const remainder = Math.abs(value % step);
		return remainder < 1e-9 || step - remainder < 1e-9;
	};
	/**
	* Splits an arc into cubic Bézier curves of at most a quarter turn each, for arcs DrawingML can't draw directly.
	*/
	var arcToCubics = (arc, scale) => {
		const { radiusX, radiusY, rotation, startAngle, sweepAngle } = arc;
		const count = Math.ceil(Math.abs(sweepAngle) / QUARTER_TURN - 1e-9);
		const step = sweepAngle / count;
		const handle = 4 / 3 * Math.tan(step / 4);
		const tangent = (angle) => ({
			x: -radiusX * Math.sin(angle) * Math.cos(rotation) - radiusY * Math.cos(angle) * Math.sin(rotation),
			y: -radiusX * Math.sin(angle) * Math.sin(rotation) + radiusY * Math.cos(angle) * Math.cos(rotation)
		});
		return Array.from({ length: count }, (_, index) => {
			const from = startAngle + step * index;
			const to = from + step;
			const start = pointOnArc(arc, from);
			const end = pointOnArc(arc, to);
			const startTangent = tangent(from);
			const endTangent = tangent(to);
			return {
				type: "cubic",
				points: [
					round(toShape(scale, {
						x: start.x + handle * startTangent.x,
						y: start.y + handle * startTangent.y
					})),
					round(toShape(scale, {
						x: end.x - handle * endTangent.x,
						y: end.y - handle * endTangent.y
					})),
					round(toShape(scale, end))
				]
			};
		});
	};
	/**
	* Converts an arc to DrawingML. An arc of an ellipse that is upright once scaled to the shape is written as an `arcTo`,
	* whose angles are the directions of its ends from the ellipse's centre. Other arcs are drawn with Bézier curves.
	*/
	var convertArc = (to, arc, scale) => {
		if (scale.x === 0 || scale.y === 0) return [{
			type: "line",
			to: round(toShape(scale, to))
		}];
		const isCircle = Math.abs(arc.radiusX - arc.radiusY) < 1e-9 && Math.abs(scale.x - scale.y) < 1e-9;
		if (!isCircle && !isMultipleOf(arc.rotation, QUARTER_TURN)) return arcToCubics(arc, scale);
		const turned = !isCircle && !isMultipleOf(arc.rotation, Math.PI);
		const widthRadius = (turned ? arc.radiusY : arc.radiusX) * scale.x;
		const heightRadius = (turned ? arc.radiusX : arc.radiusY) * scale.y;
		const direction = (angle) => {
			const difference = Math.atan2(heightRadius * Math.sin(angle), widthRadius * Math.cos(angle)) - angle;
			return angle + difference - 2 * Math.PI * Math.round(difference / (2 * Math.PI));
		};
		const start = direction(arc.startAngle + arc.rotation);
		const end = direction(arc.startAngle + arc.rotation + arc.sweepAngle);
		return [{
			type: "arc",
			widthRadius: Math.round(widthRadius),
			heightRadius: Math.round(heightRadius),
			startAngle: Math.round((degrees(start) % 360 + 360) % 360 * ANGLE_UNITS_PER_DEGREE),
			swingAngle: Math.round(degrees(end - start) * ANGLE_UNITS_PER_DEGREE)
		}];
	};
	var convertSegment = (segment, scale) => {
		switch (segment.type) {
			case "move":
			case "line": return [{
				type: segment.type,
				to: round(toShape(scale, segment.to))
			}];
			case "cubic": return [{
				type: "cubic",
				points: [
					round(toShape(scale, segment.control1)),
					round(toShape(scale, segment.control2)),
					round(toShape(scale, segment.to))
				]
			}];
			case "quadratic": return [{
				type: "quadratic",
				points: [round(toShape(scale, segment.control)), round(toShape(scale, segment.to))]
			}];
			case "arc": return convertArc(segment.to, segment.arc, scale);
			default: return [segment];
		}
	};
	/**
	* The direction, right (0), down (90), left (180) or up (270), a point is furthest from the middle of a box in,
	* measured as a share of the box's width and height. A point as far across as up or down is taken to be up or down.
	*/
	var outwardAngle = (x, y, width, height) => {
		const across = width === 0 ? 0 : (x - width / 2) / width;
		const down = height === 0 ? 0 : (y - height / 2) / height;
		if (Math.abs(across) > Math.abs(down)) return across > 0 ? 0 : 180;
		return down < 0 ? 270 : across === 0 && down === 0 ? 0 : 90;
	};
	/**
	* The corners and ends of the paths: where each of their segments ends. A connector leaves each one in the direction,
	* right, down, left or up, that it is furthest from the middle of the shape in.
	*/
	var findSites = (segments, scale, width, height) => {
		const ends = segments.flatMap((segment) => segment.type === "close" ? [] : [round(toShape(scale, segment.to))]);
		return ends.filter((point, index) => ends.findIndex(({ x, y }) => x === point.x && y === point.y) === index).map(({ x, y }) => ({
			x,
			y,
			angle: outwardAngle(x, y, width, height)
		}));
	};
	var SIDE_ANGLES$1 = {
		right: 0,
		bottom: 90,
		left: 180,
		top: 270
	};
	/**
	* The shape's own connection points, scaled to the shape.
	*
	* @throws If a point isn't a pair of numbers, or its side isn't one of the four
	*/
	var connectionSites = (points, scale, width, height) => points.map((point) => {
		const { x, y, side } = point;
		if (!Number.isFinite(x) || !Number.isFinite(y) || side !== void 0 && SIDE_ANGLES$1[side] === void 0) throw new Error(`Invalid connection point ${JSON.stringify(point)}. Expected numbers x and y, and a side of top, right, bottom or left`);
		const site = round(toShape(scale, {
			x,
			y
		}));
		return _objectSpread2(_objectSpread2({}, site), {}, { angle: side === void 0 ? outwardAngle(site.x, site.y, width, height) : SIDE_ANGLES$1[side] });
	});
	var PATH_FILLS = /* @__PURE__ */ new Map([
		[true, "norm"],
		[false, "none"],
		["lighter", "lighten"],
		["slightlyLighter", "lightenLess"],
		["darker", "darken"],
		["slightlyDarker", "darkenLess"]
	]);
	/**
	* Reads a custom shape's paths. Parts of a path inside other parts are turned round to go the other way, so they are
	* holes whichever way applications fill paths.
	*
	* @throws If there is no path, both `path` and `paths`, a path isn't valid SVG path data, or a fill isn't one of the choices
	*/
	var readPaths = ({ path, paths }) => {
		if (path !== void 0 && paths !== void 0) throw new Error("Invalid custom shape. Expected path or paths, not both");
		const options = paths !== null && paths !== void 0 ? paths : path === void 0 ? [] : [{ path }];
		if (options.length === 0) throw new Error("Invalid custom shape. Expected a path, or at least one of paths");
		return options.map(({ path: data, fill = true, line }) => {
			const mode = PATH_FILLS.get(fill);
			if (mode === void 0) throw new Error(`Invalid custom shape path fill "${fill}". Expected true, false, "lighter", "slightlyLighter", "darker" or "slightlyDarker"`);
			return {
				segments: orientParts(parseSvgPath(data)),
				fill: mode,
				stroke: line !== false
			};
		});
	};
	var unionOf = (bounds) => ({
		left: Math.min(...bounds.map(({ left }) => left)),
		top: Math.min(...bounds.map(({ top }) => top)),
		right: Math.max(...bounds.map(({ right }) => right)),
		bottom: Math.max(...bounds.map(({ bottom }) => bottom))
	});
	/**
	* Where the text goes, scaled to the shape.
	*
	* @throws If the box's sides aren't numbers, or it is turned inside out
	*/
	var scaleTextArea = (textArea, scale) => {
		const { left, top, right, bottom } = textArea;
		if (![
			left,
			top,
			right,
			bottom
		].every(Number.isFinite) || right < left || bottom < top) throw new Error(`Invalid text area ${JSON.stringify(textArea)}. Expected numbers left, top, right and bottom, with right at least left and bottom at least top`);
		const topLeft = round(toShape(scale, {
			x: left,
			y: top
		}));
		const bottomRight = round(toShape(scale, {
			x: right,
			y: bottom
		}));
		return {
			left: topLeft.x,
			top: topLeft.y,
			right: bottomRight.x,
			bottom: bottomRight.y
		};
	};
	/**
	* Reads a custom shape's paths and scales them to the shape: the box around them is stretched to fill the shape's box.
	* The text area and connection points are scaled with them.
	*
	* @param width - The shape's width in EMUs
	* @param height - The shape's height in EMUs
	* @throws If the paths, text area or connection points aren't valid
	*/
	var createCustomGeometryData = (options, width, height) => {
		const paths = readPaths(options);
		const bounds = unionOf(paths.map(({ segments }) => getPathBounds(segments)));
		const pathWidth = bounds.right - bounds.left;
		const pathHeight = bounds.bottom - bounds.top;
		const x = pathWidth > 0 ? width / pathWidth : 0;
		const y = pathHeight > 0 ? height / pathHeight : 0;
		const scale = {
			left: bounds.left,
			top: bounds.top,
			x,
			y
		};
		return {
			width,
			height,
			paths: paths.map(({ segments, fill, stroke }) => ({
				segments: segments.flatMap((segment) => convertSegment(segment, scale)),
				fill,
				stroke
			})),
			sites: options.connectionPoints === void 0 ? findSites(paths.flatMap(({ segments }) => segments), scale, width, height) : connectionSites(options.connectionPoints, scale, width, height),
			textArea: options.textArea && scaleTextArea(options.textArea, scale)
		};
	};
	/**
	* The box a custom shape of the given size writes its text in: its text area, or the whole shape.
	*
	* @param width - The shape's width in EMUs
	* @param height - The shape's height in EMUs
	*/
	var getCustomTextRectangle = (options, width, height) => {
		var _ref;
		return (_ref = options.textArea && createCustomGeometryData(options, width, height).textArea) !== null && _ref !== void 0 ? _ref : {
			left: 0,
			top: 0,
			right: width,
			bottom: height
		};
	};
	var createPoint = ({ x, y }) => new docx.BuilderElement({
		name: "a:pt",
		attributes: {
			x: {
				key: "x",
				value: x
			},
			y: {
				key: "y",
				value: y
			}
		}
	});
	var createPathSegment = (segment) => {
		switch (segment.type) {
			case "move": return new docx.BuilderElement({
				name: "a:moveTo",
				children: [createPoint(segment.to)]
			});
			case "line": return new docx.BuilderElement({
				name: "a:lnTo",
				children: [createPoint(segment.to)]
			});
			case "cubic": return new docx.BuilderElement({
				name: "a:cubicBezTo",
				children: segment.points.map(createPoint)
			});
			case "quadratic": return new docx.BuilderElement({
				name: "a:quadBezTo",
				children: segment.points.map(createPoint)
			});
			case "arc": return new docx.BuilderElement({
				name: "a:arcTo",
				attributes: {
					widthRadius: {
						key: "wR",
						value: segment.widthRadius
					},
					heightRadius: {
						key: "hR",
						value: segment.heightRadius
					},
					startAngle: {
						key: "stAng",
						value: segment.startAngle
					},
					swingAngle: {
						key: "swAng",
						value: segment.swingAngle
					}
				}
			});
			default: return new docx.BuilderElement({ name: "a:close" });
		}
	};
	/**
	* A guide for a length across or down the shape that keeps its share of the shape's width or height when the shape is
	* resized, as PowerPoint writes the points of freeforms: the length times `w` (or `h`), divided by the width (or height)
	* it was worked out for.
	*/
	var shareGuide = (name, value, size, length) => ({
		name,
		formula: length === 0 ? `val ${value}` : `*/ ${value} ${size} ${length}`
	});
	var createGuide = ({ name, formula }) => new docx.BuilderElement({
		name: "a:gd",
		attributes: {
			name: {
				key: "name",
				value: name
			},
			formula: {
				key: "fmla",
				value: formula
			}
		}
	});
	var siteGuides = (sites, width, height) => sites.flatMap(({ x, y }, index) => [shareGuide(`connsiteX${index}`, x, "w", width), shareGuide(`connsiteY${index}`, y, "h", height)]);
	var createConnectionSite = ({ angle }, index) => new docx.BuilderElement({
		name: "a:cxn",
		attributes: { angle: {
			key: "ang",
			value: Math.round(angle * ANGLE_UNITS_PER_DEGREE)
		} },
		children: [new docx.BuilderElement({
			name: "a:pos",
			attributes: {
				x: {
					key: "x",
					value: `connsiteX${index}`
				},
				y: {
					key: "y",
					value: `connsiteY${index}`
				}
			}
		})]
	});
	var textAreaGuides = (textArea, width, height) => textArea === void 0 ? [] : [
		shareGuide("textAreaLeft", textArea.left, "w", width),
		shareGuide("textAreaTop", textArea.top, "h", height),
		shareGuide("textAreaRight", textArea.right, "w", width),
		shareGuide("textAreaBottom", textArea.bottom, "h", height)
	];
	var createPath = (path, width, height) => new docx.BuilderElement({
		name: "a:path",
		attributes: {
			width: {
				key: "w",
				value: width
			},
			height: {
				key: "h",
				value: height
			},
			fill: {
				key: "fill",
				value: path.fill === "norm" ? void 0 : path.fill
			},
			stroke: {
				key: "stroke",
				value: path.stroke ? void 0 : false
			}
		},
		children: path.segments.map(createPathSegment)
	});
	/**
	* Creates an `a:custGeom` element for a custom shape.
	*
	* The connection sites and text area are guides that keep their share of the shape's width and height, so they stay
	* in place when the shape is resized. Without a text area, the text uses the whole of the shape's box.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_CustomGeometry2D">
	*   <xsd:sequence>
	*     <xsd:element name="avLst" type="CT_GeomGuideList" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="gdLst" type="CT_GeomGuideList" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="ahLst" type="CT_AdjustHandleList" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="cxnLst" type="CT_ConnectionSiteList" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="rect" type="CT_GeomRect" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="pathLst" type="CT_Path2DList" minOccurs="1" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createCustomGeometry = ({ width, height, paths, sites, textArea }) => new docx.BuilderElement({
		name: "a:custGeom",
		children: [
			new docx.BuilderElement({ name: "a:avLst" }),
			new docx.BuilderElement({
				name: "a:gdLst",
				children: [...siteGuides(sites, width, height), ...textAreaGuides(textArea, width, height)].map(createGuide)
			}),
			new docx.BuilderElement({ name: "a:ahLst" }),
			new docx.BuilderElement({
				name: "a:cxnLst",
				children: sites.map(createConnectionSite)
			}),
			new docx.BuilderElement({
				name: "a:rect",
				attributes: textArea ? {
					left: {
						key: "l",
						value: "textAreaLeft"
					},
					top: {
						key: "t",
						value: "textAreaTop"
					},
					right: {
						key: "r",
						value: "textAreaRight"
					},
					bottom: {
						key: "b",
						value: "textAreaBottom"
					}
				} : {
					left: {
						key: "l",
						value: "l"
					},
					top: {
						key: "t",
						value: "t"
					},
					right: {
						key: "r",
						value: "r"
					},
					bottom: {
						key: "b",
						value: "b"
					}
				}
			}),
			new docx.BuilderElement({
				name: "a:pathLst",
				children: paths.map((path) => createPath(path, width, height))
			})
		]
	});
	//#endregion
	//#region src/shapes/preset-shape/preset-shape-properties.ts
	/**
	* Shape properties (`wps:spPr`) for preset shapes.
	*
	* @module
	*/
	/**
	* Creates the `wps:spPr` element for a preset shape: transform, geometry, fill, line and effects, in schema order.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_ShapeProperties">
	*   <xsd:sequence>
	*     <xsd:element name="xfrm" type="CT_Transform2D" minOccurs="0"/>
	*     <xsd:group ref="EG_Geometry" minOccurs="0"/>
	*     <xsd:group ref="EG_FillProperties" minOccurs="0"/>
	*     <xsd:element name="ln" type="CT_LineProperties" minOccurs="0"/>
	*     <xsd:group ref="EG_EffectProperties" minOccurs="0"/>
	*     ...
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createPresetShapeProperties = ({ transformation, geometry, fill, line, effects }) => new docx.BuilderElement({
		name: "wps:spPr",
		children: [
			createTransform(transformation),
			geometry.type === "custom" ? createCustomGeometry(createCustomGeometryData(geometry, transformation.emus.x, transformation.emus.y)) : createPresetGeometry(getOoxmlShapeName(geometry.type), createShapeGuides(geometry.type, geometry.adjustments)),
			createShapeFill(fill),
			createShapeLine(line),
			...effects ? [createShapeEffects(effects)] : []
		]
	});
	//#endregion
	//#region src/shapes/preset-shape/shape-text.ts
	/**
	* Text layout inside preset shapes (`wps:bodyPr`): alignment, margins, wrapping, autofit, direction, columns and warps.
	*
	* Reference: ECMA-376 Part 1, 21.1.2.1.1 bodyPr (Body Properties)
	*
	* @module
	*/
	var VERTICAL_ALIGNMENT_OOXML_NAMES = {
		top: "t",
		center: "ctr",
		bottom: "b"
	};
	var TEXT_DIRECTION_OOXML_NAMES = {
		horizontal: "horz",
		topToBottom: "vert",
		bottomToTop: "vert270",
		stacked: "wordArtVert",
		stackedRightToLeft: "wordArtVertRtl",
		eastAsianVertical: "eaVert",
		mongolianVertical: "mongolianVert"
	};
	var TEXT_WARP_OOXML_NAMES = {
		square: "textPlain",
		stop: "textStop",
		triangleUp: "textTriangle",
		triangleDown: "textTriangleInverted",
		chevronUp: "textChevron",
		chevronDown: "textChevronInverted",
		ringInside: "textRingInside",
		ringOutside: "textRingOutside",
		archUp: "textArchUp",
		archDown: "textArchDown",
		circle: "textCircle",
		button: "textButton",
		archUpFilled: "textArchUpPour",
		archDownFilled: "textArchDownPour",
		circleFilled: "textCirclePour",
		buttonFilled: "textButtonPour",
		curveUp: "textCurveUp",
		curveDown: "textCurveDown",
		canUp: "textCanUp",
		canDown: "textCanDown",
		wave: "textWave1",
		waveInverted: "textWave2",
		doubleWave: "textDoubleWave1",
		doubleWaveInverted: "textWave4",
		inflate: "textInflate",
		deflate: "textDeflate",
		inflateBottom: "textInflateBottom",
		deflateBottom: "textDeflateBottom",
		inflateTop: "textInflateTop",
		deflateTop: "textDeflateTop",
		deflateInflate: "textDeflateInflate",
		deflateInflateDeflate: "textDeflateInflateDeflate",
		fadeRight: "textFadeRight",
		fadeLeft: "textFadeLeft",
		fadeUp: "textFadeUp",
		fadeDown: "textFadeDown",
		slantUp: "textSlantUp",
		slantDown: "textSlantDown",
		cascadeUp: "textCascadeUp",
		cascadeDown: "textCascadeDown"
	};
	var MAX_TEXT_COLUMNS = 16;
	var createAutofit = ({ resizeShapeToFitText, shrinkTextOnOverflow }) => {
		if (resizeShapeToFitText && shrinkTextOnOverflow) throw new Error("Invalid text options. A shape can't both resize to fit its text and shrink its text");
		if (resizeShapeToFitText) return [new docx.BuilderElement({ name: "a:spAutoFit" })];
		return shrinkTextOnOverflow ? [new docx.BuilderElement({ name: "a:normAutofit" })] : [];
	};
	var createWarp = (warp) => new docx.BuilderElement({
		name: "a:prstTxWarp",
		attributes: { preset: {
			key: "prst",
			value: TEXT_WARP_OOXML_NAMES[warp]
		} },
		children: [new docx.BuilderElement({ name: "a:avLst" })]
	});
	var columnCount = (count) => {
		if (!(Number.isInteger(count) && count >= 1 && count <= MAX_TEXT_COLUMNS)) throw new Error(`Invalid text column count ${count}. Expected a whole number from 1 to ${MAX_TEXT_COLUMNS}`);
		return count;
	};
	var marginEmus = (margin, side) => margin === void 0 ? void 0 : pointsToEmus(margin, `${side} text margin`);
	/**
	* Creates the `wps:bodyPr` element for the text in a preset shape.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_TextBodyProperties">
	*   <xsd:sequence>
	*     <xsd:element name="prstTxWarp" type="CT_PresetTextShape" minOccurs="0" maxOccurs="1"/>
	*     <xsd:group ref="EG_TextAutofit" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="scene3d" type="CT_Scene3D" minOccurs="0" maxOccurs="1"/>
	*     <xsd:group ref="EG_Text3D" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	*   <xsd:attribute name="vert" type="ST_TextVerticalType" use="optional"/>
	*   <xsd:attribute name="wrap" type="ST_TextWrappingType" use="optional"/>
	*   <xsd:attribute name="lIns" type="ST_Coordinate32" use="optional"/>
	*   <xsd:attribute name="tIns" type="ST_Coordinate32" use="optional"/>
	*   <xsd:attribute name="rIns" type="ST_Coordinate32" use="optional"/>
	*   <xsd:attribute name="bIns" type="ST_Coordinate32" use="optional"/>
	*   <xsd:attribute name="numCol" type="ST_TextColumnCount" use="optional"/>
	*   <xsd:attribute name="spcCol" type="ST_PositiveCoordinate32" use="optional"/>
	*   <xsd:attribute name="fromWordArt" type="xsd:boolean" use="optional"/>
	*   <xsd:attribute name="anchor" type="ST_TextAnchoringType" use="optional"/>
	*   ...
	* </xsd:complexType>
	* ```
	*
	* @throws If a margin or the column spacing is out of range, the column count isn't 1 to 16, or both autofit options are set
	*/
	var createShapeTextProperties = (options = {}) => {
		var _options$margins, _options$margins2, _options$margins3, _options$margins4, _options$columns;
		return new docx.BuilderElement({
			name: "wps:bodyPr",
			attributes: {
				direction: {
					key: "vert",
					value: options.direction && TEXT_DIRECTION_OOXML_NAMES[options.direction]
				},
				wrap: {
					key: "wrap",
					value: options.wrap === void 0 ? void 0 : options.wrap ? "square" : "none"
				},
				left: {
					key: "lIns",
					value: marginEmus((_options$margins = options.margins) === null || _options$margins === void 0 ? void 0 : _options$margins.left, "left")
				},
				top: {
					key: "tIns",
					value: marginEmus((_options$margins2 = options.margins) === null || _options$margins2 === void 0 ? void 0 : _options$margins2.top, "top")
				},
				right: {
					key: "rIns",
					value: marginEmus((_options$margins3 = options.margins) === null || _options$margins3 === void 0 ? void 0 : _options$margins3.right, "right")
				},
				bottom: {
					key: "bIns",
					value: marginEmus((_options$margins4 = options.margins) === null || _options$margins4 === void 0 ? void 0 : _options$margins4.bottom, "bottom")
				},
				columns: {
					key: "numCol",
					value: options.columns && columnCount(options.columns.count)
				},
				columnSpacing: {
					key: "spcCol",
					value: ((_options$columns = options.columns) === null || _options$columns === void 0 ? void 0 : _options$columns.spacing) === void 0 ? void 0 : pointsToEmus(options.columns.spacing, "text column spacing")
				},
				fromWordArt: {
					key: "fromWordArt",
					value: options.warp ? true : void 0
				},
				anchor: {
					key: "anchor",
					value: options.verticalAlignment && VERTICAL_ALIGNMENT_OOXML_NAMES[options.verticalAlignment]
				}
			},
			children: [...options.warp ? [createWarp(options.warp)] : [], ...createAutofit(options)]
		});
	};
	//#endregion
	//#region src/shapes/drawing/text-flow.ts
	/**
	* Text that flows from one shape to the next (`wps:txbx` with an `id`, and `wps:linkedTxbx`), as in a newsletter whose
	* article continues in another text box.
	*
	* Reference: ECMA-376 Part 1, 20.4.2.37 txbx (Textual Contents of Shape) and 20.4.2.18 linkedTxbx (Linked Textbox)
	*
	* @module
	*/
	var NO_DOCUMENT = {};
	var flows = /* @__PURE__ */ new WeakMap();
	/**
	* The text box of a shape in a text flow. The first shape of the flow written in a document has the text, and the
	* shapes after it continue it, in the order they are written. A document numbers its flows from 1, in the order they
	* are first written, so writing a document twice writes the same flows.
	*/
	var TextFlowBox = class extends docx.XmlComponent {
		constructor(flow, children) {
			super("wps:txbx");
			_defineProperty(this, "flow", void 0);
			_defineProperty(this, "children", void 0);
			this.flow = flow;
			this.children = children;
		}
		prepForXml(context) {
			var _context$file, _flows$get, _byName$get;
			const document = (_context$file = context.file) !== null && _context$file !== void 0 ? _context$file : NO_DOCUMENT;
			const byName = (_flows$get = flows.get(document)) !== null && _flows$get !== void 0 ? _flows$get : /* @__PURE__ */ new Map();
			const shapes = (_byName$get = byName.get(this.flow)) !== null && _byName$get !== void 0 ? _byName$get : [];
			const written = shapes.includes(this) ? byName : new Map([...byName, [this.flow, [...shapes, this]]]);
			flows.set(document, written);
			const id = [...written.keys()].indexOf(this.flow) + 1;
			const sequence = written.get(this.flow).indexOf(this);
			return (sequence === 0 ? new docx.BuilderElement({
				name: "wps:txbx",
				attributes: { id: {
					key: "id",
					value: id
				} },
				children: [new docx.BuilderElement({
					name: "w:txbxContent",
					children: this.children.length > 0 ? [...this.children] : [new docx.Paragraph({})]
				})]
			}) : new docx.BuilderElement({
				name: "wps:linkedTxbx",
				attributes: {
					id: {
						key: "id",
						value: id
					},
					sequence: {
						key: "seq",
						value: sequence
					}
				}
			})).prepForXml(context);
		}
	};
	/**
	* Creates the text box of a shape in a text flow: the flow's text in the first shape of the flow in the document, and
	* a link to it in the shapes after it.
	*
	* @param flow - The flow's name
	* @param children - The flow's paragraphs, which the first shape of the flow writes, or an empty paragraph if there are none
	*/
	var createTextFlowBox = (flow, children) => new TextFlowBox(flow, children);
	//#endregion
	//#region src/shapes/preset-shape/preset-shape.ts
	/**
	* Preset shapes (`wps:wsp`): rectangles, ellipses, lines, arrows and the other DrawingML presets.
	*
	* @module
	*/
	/**
	* Creates the non-visual drawing properties of a shape, picture or group inside a drawing, such as `wps:cNvPr`.
	*/
	var createNonVisualDrawingProperties$1 = (properties, name = "wps:cNvPr") => new docx.NonVisualDrawingProperties(name, properties);
	var createConnection = (name, { id, index }) => new docx.BuilderElement({
		name,
		attributes: {
			id: {
				key: "id",
				value: id
			},
			index: {
				key: "idx",
				value: index
			}
		}
	});
	var createNonVisualConnectorProperties = (connections = {}) => new docx.BuilderElement({
		name: "wps:cNvCnPr",
		children: [...connections.start ? [createConnection("a:stCxn", connections.start)] : [], ...connections.end ? [createConnection("a:endCxn", connections.end)] : []]
	});
	/**
	* Creates a `wps:wsp` element for a preset shape.
	*
	* Lines and connectors are written with `wps:cNvCnPr`, which says which shapes they are attached to,
	* and other shapes with `wps:cNvSpPr`.
	* A shape without a `textFlow` has a text box (`wps:txbx`) only when it has at least one paragraph, since
	* `w:txbxContent` can't be empty, and its text is centred vertically unless `textOptions` says otherwise. A shape in a
	* text flow always has one: the first shape of the flow writes the text, or an empty paragraph if there is none, and
	* the shapes after it link to it with `wps:linkedTxbx`. Its text starts at the top, so it can flow on from the bottom.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_WordprocessingShape">
	*   <xsd:sequence minOccurs="1" maxOccurs="1">
	*     <xsd:element name="cNvPr" type="a:CT_NonVisualDrawingProps" minOccurs="0" maxOccurs="1"/>
	*     <xsd:choice minOccurs="1" maxOccurs="1">
	*       <xsd:element name="cNvSpPr" type="a:CT_NonVisualDrawingShapeProps" minOccurs="1" maxOccurs="1"/>
	*       <xsd:element name="cNvCnPr" type="a:CT_NonVisualConnectorProperties" minOccurs="1" maxOccurs="1"/>
	*     </xsd:choice>
	*     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="style" type="a:CT_ShapeStyle" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
	*     <xsd:choice minOccurs="0" maxOccurs="1">
	*       <xsd:element name="txbx" type="CT_TextboxInfo" minOccurs="1" maxOccurs="1"/>
	*       <xsd:element name="linkedTxbx" type="CT_LinkedTextboxInformation" minOccurs="1" maxOccurs="1"/>
	*     </xsd:choice>
	*     <xsd:element name="bodyPr" type="a:CT_TextBodyProperties" minOccurs="1" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createPresetShape = ({ geometry, connections, fill, line, effects, children, textOptions, nonVisualDrawingProperties, transformation, textFlow }) => new docx.BuilderElement({
		name: "wps:wsp",
		children: [
			...nonVisualDrawingProperties ? [createNonVisualDrawingProperties$1(nonVisualDrawingProperties)] : [],
			geometry.type !== "custom" && isConnectorShapeType(geometry.type) ? createNonVisualConnectorProperties(connections) : new docx.BuilderElement({ name: "wps:cNvSpPr" }),
			createPresetShapeProperties({
				transformation,
				geometry,
				fill,
				line,
				effects
			}),
			...textFlow === void 0 ? (children === null || children === void 0 ? void 0 : children.length) ? [createTextBox(children)] : [] : [createTextFlowBox(textFlow, children !== null && children !== void 0 ? children : [])],
			createShapeTextProperties(textFlow === void 0 && (children === null || children === void 0 ? void 0 : children.length) ? _objectSpread2({ verticalAlignment: "center" }, textOptions) : textOptions)
		]
	});
	//#endregion
	//#region src/shapes/drawing/shape-group.ts
	/**
	* Groups of shapes (`wpg:wgp` and `wpg:grpSp`): shapes, pictures and groups that are moved and resized together.
	*
	* @module
	*/
	var createGroupTransform = ({ transformation, childOffset = {
		x: 0,
		y: 0
	}, childExtent = transformation.emus }) => createTransform(transformation, [new docx.BuilderElement({
		name: "a:chOff",
		attributes: {
			x: {
				key: "x",
				value: childOffset.x
			},
			y: {
				key: "y",
				value: childOffset.y
			}
		}
	}), new docx.BuilderElement({
		name: "a:chExt",
		attributes: {
			x: {
				key: "cx",
				value: childExtent.x
			},
			y: {
				key: "cy",
				value: childExtent.y
			}
		}
	})]);
	/**
	* Creates a group of shapes: `wpg:wgp` for a group drawing or a group on a canvas, and `wpg:grpSp` for a group inside
	* another group.
	*/
	var createShapeGroup = (options) => {
		var _options$name;
		return new docx.BuilderElement({
			name: (_options$name = options.name) !== null && _options$name !== void 0 ? _options$name : "wpg:wgp",
			children: [
				...options.nonVisualDrawingProperties ? [createNonVisualDrawingProperties$1(options.nonVisualDrawingProperties, "wpg:cNvPr")] : [],
				new docx.BuilderElement({ name: "wpg:cNvGrpSpPr" }),
				new docx.BuilderElement({
					name: "wpg:grpSpPr",
					children: [createGroupTransform(options)]
				}),
				...options.children
			]
		});
	};
	//#endregion
	//#region src/shapes/picture/shape-picture.ts
	/**
	* Pictures in groups and on drawing canvases (`pic:pic`).
	*
	* Reference: ECMA-376 Part 1, 20.2.2.5 pic (Picture)
	*
	* @module
	*/
	/**
	* Creates a `pic:pic` element for a picture in a group or on a canvas. On a canvas, the schema calls it `dpct:pic`,
	* which is the same element in the same namespace.
	*
	* The picture is added to the document's media when it is written.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_Picture">
	*   <xsd:sequence minOccurs="1" maxOccurs="1">
	*     <xsd:element name="nvPicPr" type="CT_PictureNonVisual" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="blipFill" type="a:CT_BlipFillProperties" minOccurs="1" maxOccurs="1"/>
	*     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="1" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createShapePicture = ({ image, crop, line, effects, nonVisualDrawingProperties, transformation }) => new docx.BuilderElement({
		name: "pic:pic",
		attributes: { namespace: {
			key: "xmlns:pic",
			value: "http://schemas.openxmlformats.org/drawingml/2006/picture"
		} },
		children: [
			new docx.BuilderElement({
				name: "pic:nvPicPr",
				children: [createNonVisualDrawingProperties$1(nonVisualDrawingProperties, "pic:cNvPr"), createPictureLocks()]
			}),
			createPictureFill({
				image,
				crop
			}, "pic:blipFill"),
			new docx.BuilderElement({
				name: "pic:spPr",
				children: [
					createTransform(transformation),
					createPresetGeometry(),
					...line ? [createShapeLine(line)] : [],
					...effects ? [createShapeEffects(effects)] : []
				]
			})
		]
	});
	//#endregion
	//#region src/shapes/drawing/shape-drawing-child.ts
	/** The `a:graphicData` URI of a shape (`wps:wsp`) */
	var SHAPE_URI = "http://schemas.microsoft.com/office/word/2010/wordprocessingShape";
	/** The `a:graphicData` URI of a group (`wpg:wgp`) */
	var GROUP_URI = "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup";
	/** The `a:graphicData` URI of a drawing canvas (`wpc:wpc`) */
	var CANVAS_URI = "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas";
	/**
	* Creates the element for a shape (`wps:wsp`), picture (`pic:pic`) or group in a drawing.
	*
	* @param groupName - The element for a group: `wpg:wgp` on a canvas, and `wpg:grpSp` inside another group
	*/
	var createShapeDrawingChild = (child, groupName) => {
		switch (child.type) {
			case "wps": return createPresetShape(_objectSpread2(_objectSpread2({}, child.data), {}, { transformation: child.transformation }));
			case "picture": return createShapePicture(_objectSpread2(_objectSpread2({}, child.data), {}, { transformation: child.transformation }));
			default: return createShapeGroup({
				name: groupName,
				nonVisualDrawingProperties: child.nonVisualDrawingProperties,
				transformation: child.transformation,
				childOffset: child.childOffset,
				childExtent: child.childExtent,
				children: child.children.map((grandchild) => createShapeDrawingChild(grandchild, "wpg:grpSp"))
			});
		}
	};
	//#endregion
	//#region src/text-layout/font-widths.ts
	/**
	* The characters the widths are for, as ranges of code points: printable ASCII; Latin-1, Latin Extended-A and B, IPA and
	* the spacing modifier letters; Greek and Cyrillic; Latin Extended Additional, for Vietnamese; and general punctuation,
	* superscripts and subscripts, currency symbols, letterlike symbols, number forms, arrows and mathematical operators.
	*/
	var FONT_WIDTH_RANGES = [
		[32, 126],
		[160, 767],
		[880, 1279],
		[7680, 7935],
		[8192, 8959]
	];
	/**
	* The faces of the tables Word draws characters in that other fonts don't have, such as Calibri for Gill Sans MT's
	* Cyrillic: the font, and whether the face is bold and italic.
	*/
	var FALLBACK_FACES = [
		{
			font: "Arial",
			bold: false,
			italic: false
		},
		{
			font: "Arial",
			bold: true,
			italic: false
		},
		{
			font: "Arial",
			bold: false,
			italic: true
		},
		{
			font: "Arial",
			bold: true,
			italic: true
		},
		{
			font: "Times New Roman",
			bold: false,
			italic: false
		},
		{
			font: "Times New Roman",
			bold: true,
			italic: false
		},
		{
			font: "Times New Roman",
			bold: false,
			italic: true
		},
		{
			font: "Times New Roman",
			bold: true,
			italic: true
		},
		{
			font: "Calibri",
			bold: false,
			italic: false
		},
		{
			font: "Tahoma",
			bold: false,
			italic: false
		},
		{
			font: "Calibri",
			bold: true,
			italic: false
		},
		{
			font: "Tahoma",
			bold: true,
			italic: false
		},
		{
			font: "Calibri",
			bold: false,
			italic: true
		},
		{
			font: "Calibri",
			bold: true,
			italic: true
		},
		{
			font: "Cambria",
			bold: false,
			italic: false
		},
		{
			font: "Cambria",
			bold: true,
			italic: false
		},
		{
			font: "Cambria",
			bold: false,
			italic: true
		},
		{
			font: "Cambria",
			bold: true,
			italic: true
		}
	];
	var FONT_WIDTHS = [
		{
			name: "Calibri",
			lineHeight: 1220.703125,
			descent: 268.5546875,
			regular: "3y566h7O7XbbaG3t4L4L7O7O3W4O3Y627X*094c4c7O*027fd+938w8l9D7E7b9T9L3Y4/886Adna6am85ax8v7b7Da28TdW877D7k4P624P7O7O4z7v8d6D8d7O4N7n8d3B3L773Bcv8d8f8d8d5t675f8d74bb6N756b4W7c4W7O3y567O7X7O7X7O7O69d26i807O4O7X6a5j7O5g5e4A8C9a3Y4P3S6C809Yavaz7f=93*04bX==7E*02=3Y*029N==am*037Oao=a2*02=858f=7v*04c5==7O*02=3B*028d8d=8f*037O8h=8d*02=8d=*0f8U9N8E=*0jag8l=*083B8X7l=*0377=*036D488y5S6K3U=*05939Q8d=*05dzdi=*0g5q7D5m=*0m3P8E9D8q8d8j8d8A917e9NaL8q8d8b7Ea37q7b4N9U8Tcf4x4d88774q7fdLa68pamaV92c5af9z8d8v7b677a6L5D8j5f7Dbi9raoa28k7O7k6b7q*026F7X7X6G678d3Q6b8+56gXfOeobLak7lf4dRbZ=*0f7O=*059T8p=*087q=gNfOeo==d/9s=*0z7q7q==a39o7X7X7I6s=*0d4Z9D5f3LcScR938l6D6A7D676b6/6/8Eaj8Z7E7O594p9S8d8D5T927B7v8d*026D738d8d7O7O9+6D6D8e8h4q8d8d8s747t8d*024q4i4I5H5Q3B8Rcucucv8d8d8t8fb8aUab5t*044/4/7171673L4q3L4Z5f5f948K8u74bb756v6b7u7j7i6/*026D9Q7v8h8E8n4Z77638d6/6/cAdmdT9H7naJbQ998D7I7I8d8q5I5I2O3R3R3X4+7I4X3t6g3W*023y3y55557O7O8p8p6b6b4y6a4A4z4y6a4z4A4m4m3y3y5d*035Z3y514U727l5d5d4F2H4h4U555/*045d5d6b8/6y5d*03514z7l7l724c5d*038j8j5U7U6I7D633W3Wa28s!!4i6D*02=4/!*034Z7K93=7E9L3Y!am!7Dao4i938w6w8Q7E7k9Lam3Y888Zdna67Iam9L85!7a7D7DbT87bKao==8T788p4i8u8T8j6+8b785s8p8k4i777f8C715U8f8F7Z6r8k638uab6Gb4aU=*04878c8L7D8u=aecK9tam8f8l6r7b6O8x729393dLcv8x8b8I808l6z9q7Vax8k7p6a9t7Z6D3Lam6M6M858K8laX9k7Z8l*027E7E9N6K8z7b3Y3Y4/dEdI9G8va28f9I938q8w6Ka47Ecx7qa2a28v9zdn9Lam9K858l7D8faV879/8IdAdW9DbW8j8AdL8H7v8l7v5q8K7OaN6D8t8t7g7+aA8n8f898d6D63759M6N8u7lbpbJ8oaq7m6Xbi7q=7O8t=6Y673B3B3LbLc28l=*028dewaB9P87ceaa9S8dd0b6bj8PeabP7q6tbKb4am8c9e7u==gledam90ewceewaB8l6D9x00*06an8y8j7A858d6N5y6F5Q8k75d5bf7q6D957K8v7g8E7G9T8na38Hb79te6bDa68G8l6D7D637D747D748K7ebo9k8/7F8I7l8I7lbF9mbF9m3Y==8y7s9U849L8n9L8t8I7ldKba3Y=*03bXc5==a37O=*057q7j=*05am8c=*0b6w5q==6F5Q8R7d876N=*2p7v=4N4N8N8b=*0VaV92aV92aV92aV92aV92=*03bi9rbi9rbi9rbi9rbi9r=*079z6F8K7q8f747QfE7Oe94J3y2n8r3p381Z00*044O4O7X7Oe9e96b7O3W*036y*037O*02!*02aO!*0200*043yge!3s6g94!*02665j5j!8K7z7O!*045g!*0o4c3u00*04!00*09672J!!5B5b5D515E5D5I5D5w3p3p5G673S5g5e5B5b5D515E5D5I5D5w3p3p!5e5k5G4U5k!*0a9E8l8l7b7Xcva6eqchdWbF8E7X887DgW8g8P9b8Z7b8l~0~07X*02a3ar7Xaf9a!*0f00*0w!*0jb+!*0c7S!!g1d2!*07b5!b1!*02=!*06bz!*027b!*0pb+5K!*03aAbjaAbjbabla7aKaqb0b0a660!*0y8l6D!*0ae9*03k8c9dO*03!*0d7o!*1o8l!*028Q!*07cv!8t7O!!5g!*023Y7O!*02dlaI!*08a+!5K!*0r7O!*0m=7O!!7O7O!*2p",
			bold: "3y566S7O7Xbpb13F4U4U7O7O424O4b6K7X*094k4k7O*027fe29u8N8h9S7E7b9Z9T4b5b8z6DdGajaA8kaK8P7p7Lad9fea8D887u556K557O7O4I7K8p6y8p7T4Y7q8p3S3/7w3ScJ8p8q8p8p5z6f5r8p7pbF7b7q6d5o7r5o7O3y567O7X7O7X7O7O6vd26w8r7O4O7X665m7O5i5g4J8P9m4c4L3Y6P8raiaPa+7f=9u*04c7==7E*02=4b*029/==aA*037OaF=ad*02=8k8H=7K*04c7==7T*02=3S*028p8p=8q*037O8w=8p*02=8p=*0f9l9/8V=*0jai8z=*083S9m7R=*037w=*036K4O8O6C6N48=*059Ka18p=*05dGdb=*0g5H7L5y=*0m428Xas8I8p8Y8y8d9v7g9/by8I8p8l7Eai7J7b4YaF9fcA4I4J8B7w4V7CdVaj8paAbZ9VcyaPa08p8P7s6j7m6+5K8x5r7LbVa7aFad8B827u6d7G7J7v6M7X7X6D698p487x9b56hkg4eCc2aC7Rfueico=*0f7T=*04c7a58J=*087a=h8g4eC==dR9A=*04c7=*0t7G7a==a29v8g837G6j=*0d5a9L5v3/cXcY9u8m6D6U7V6f6d6S6P8Zav9i7E7O5p4F9U8p915X9c7J7K8p*026D6V8p8z7T7Ta36H6H8r8f4A8y8o8o7v7A8p*024K4u576a6i3Y97cJ*028p8p8D8obfb3aX5z5z5A5z5z58587F7F6f3N4s3N585r5r9a988k7pbF7q7f6i7v7a7c6S*026ya77L8f8t8x5a7w6k8z6S6Sd6dGena27Ta/cu9H9h8d7I8x8y5R5R2Z3W3R405i815b3m6o42*023y3y55557O7O8p8p6h6h4y664J4I4y6a4I4J4m4m3y3y5d*03613H584X6Y7C5d*022T4m5d555/*045d5d6h8/6P5d*03584I7l7C6Y4k5d*038j8j5U8a757L7i4242ac8J!!4i6D6y6D=5b!*034Z7K9u=7E9T4b!aA!88aF4u9u8N6q927E7u9TaA4b8z9idGaj7IaA9T8k!7m7L88cx8DcEaF==9f7a8w4u8A9f8x7j8l7a5I8w8x4u7w7C8P7n618q938i6n8w698AaX73bybe=*048z8o9e8b*02b0de9zaA8q8d6q7b6+8E7o9o9qdPcJ8x8g8N897X6A957sas8s7T6j9t8g6y3/aA6/6/8k8y8hbe9E8i8u8h8u7E7E9Y6M8r7p4b4b5be0e09U8Pac8z9Q9u8I8N6Max7Ed17yacac8P9RdG9TaA9S8k8h7L8zbk8Dai8Ve1ev9/cu8F8rei8+7K8k7L5y967Tbx6H8J8J7L8eb98x8q8m8p6y667qaz7b8O7EbXcl8Kb87L6RbN7O=7T8F=6S6f3S3S3/c8cq8z=*028peObf9+8kcdadab8Zd/clbo9OeZd97J6FcEbyaA8o9A7N==hbeZbb9aeOcreObf866n9x00*06aP9d8U7T8k8p6O5L6V5W8G79dUcc7y6H9H8p9b8h907/a68Vax8Ybo9IembEak8Q8h6y7L65887s887s9t7RbM9A9n8i8V7T8V7Tcc9Pcc9P4b==987Yas8K9T8xau918V7Teibv4b=*03c7c7==ai7T=*057G7a=*05aA8q=*0b6H5y==6V5W9l7P8D7b=*2p7K=4Y4Y8Z8l=*0VaV9VaV9VaV9VaV9VaV9V=*03bVa7bVa7bVa7bVa7bVa7=*07a36+9n7S8z7q7QfE7Oe94J3y2n7X3p381Z00*044O4O7X7Oe9e97x7P42*036P*037O*02!*02b7!*0200*043ygC!3m6o9k!*02665o5o!9b7V7O!*045z!*0o4B3u00*04!00*096e2V!!5K5h5F575K5F5z5w5r3u3u5Q6e3Y5i5g5K5h5F575K5F5z5w5r3u3u!5n5k5O5d5r!*0aa68w8h7g7XcJaNeobXeSbY8V7X8N7Lhs8N9f9y9K878h~1~17X*02b4bu8kaU9a!*0f00*0w!*0jc8!*0c8g!!gmd2!*07br!bg!*02=!*06bz!*027b!*0pb+5K!*03aVbHaVbHbAbNatb7aUbybyaE6c!*0y8h6D!*0ae9*03kuc1d7*03!*0d7o!*1o8p!*0292!*07ce!8C7O!!5Z!*024b7O!*02d6aI!*08a+!5T!*0r7O!*0m=7O!!7O7O!*2p",
			italic: "3y566h7O7XbbaG3t4L4L7O7O3W4O3Y647X*094c4c7O*027fd+938w8a9D7E7b9T9L3Y4/886Adna5ae85ao8v747Da28TdW877D7k4P604P7O7O4z82826w827u4N82823B3L773Bcn828182825n655f826+bb6N6/6b4W7c4W7O3y567O7X7O7X7O7O69d26L807O4O7X6a5j7O5g5e4A8q9a3Y4P3S6C809Yavaz7f=93*04bX==7E*02=3Y*029N==ae*037Oai=a2*02=858f=82*04bO==7u*02=3B*028d==81*037O8h=82*02=82=*0f8H9N8D=*0jag89=*083B8X7l=*0377=*036D488y5S6K3U=*058V9P82=*05dzcK=*0g5q7D5m=*0m3P829l8q828j8d8a8a6w9Nas85828b7E9o7q7b4N9T8Tb/4x4r88774q7fd1a58daeaN8Qc59E8V828v74657a6L5f7S5f7Dbi9faoa27D7d7k6b7q7q796C7G7w6G5T8b3Q6b8+56h1fResbYak7lf3dQbN=*0f7u=*059T82=*087j=h1fRes==d/9s=*0z7q7j==9W957X7X7k6b=*0d4E974Z3Lcwcv938a6w6A7D656b6/6/8wa28Z7E7u4/3L9T828v5n7D7g7v82*026w73828d7d7u9L786D8j873L82828v747t82*023B4i4U5H5H3B8Rcn*0282828p83auaoab5n*044/4/6+7b653L*024Z5f5f828K8o6+bb6/6v6b7Q7j7j6/*026Dae7C818v8f4Z7763826/6/codje19E7saJbE998D7I7I82825A5A2O3O3O3X4+7I4X3t6g3W*023y3y55557O7O8p8p6b6b4y6a4A4z4y6a4z4A4m4m3y3y5d*035Z3v514U727l5d5d4F2H4h4T555/*045d5d6b8/6y5d*03514z7l7l724c5d*038j8j5U7U6I7D633W3Wa28s!!4U6w*02=4/!*034Z7K93=7E9L3Y!ae!7Dao4i938w6w8Q7E7k9Lag3Y888Zdna57Iae9L85!7a7D7DbU87bKao==8R788d4i8u8R8g6+8b785s8d8L4i777f8q715U818F7Z6r8k638uae6Gb4aU=*04878g8k7D8u=abcK9tae818a6r7b6O8x729393dLcn8x8b8I808f6u9q7Vax8k7p6a9t7Z6w3Lae6M6M85828aaV9g7Z8a*027E7E9N6K8z743Y3Y4/dEdI9G8va28f9I938q8w6Ka47Ecx7qa2a28v9zdn9Lae9K858a7D8faV879/8IdAdW9DbW8j8AdL8H828l7v6r8e7uci6D82827g7+aA8f8189826wcn6/b16N8n7lc8ct8oaq7i6Xbh7q=7u8p=6Y653B3B3LbKc289=*0282ewaz9P87ca9N9S8dd0b6bj8PeabP7q6DbKb4ae839d7u==g2edae81ewceewaz8a6w9x00*06a2828j7x85826N5y6K5y8k75c+ci7q6D8Y7K8v7g8v7g9L8l9X8yb79te5bD9Z8n8a6w7DcE7D747D748H7eb98n8T7D8I7l8I7lb896b8963Y==8v7s9U849L8f9L8i8I7ldKaA3Y=*03bXbO==9o7u=*057q7j=*05ae83=*0b6K6r==6K5y8H7e876N=*2p82=4N4N8N8b=*0VaN8QaN8QaN8QaN8QaN8Q=*03bi9fbi9fbi9fbi9fbi9f=*079z6F8n7q8f6/7QfE7Oe94J3y2n8r3p381Z00*044O4O7X7Oe9e97X7O3W*036y*037O*02!*02aO!*0200*043yge!3s6g94!*02665j5j!8K7z7O!*045g!*0o4c3u00*04!00*09672J!!5B5b5D515E5D5I5D5w3p3p5B673S5g5e5B5b5D515E5D5I5D5w3p3p!5z595y4T59!*0a9E8a8a7b7Xcna5ehc8dWbF8C7X887DgW8g8P9b8Z7b8a~2~27X*02a6ar7Xaf9a!*0f00*0w!*0jbQ!*0c7S!!f+d2!*07b5!b1!*02=!*06bz!*027b!*0pb+5K!*03aAbjaAbjbabla7aKaqb0b0a660!*0y8K6w!*0ae9*03k8c9dO*03!*0d7o!*1o8l!*028Q!*07cv!8t7O!!5g!*023Y7O!*02dlaI!*08a+!5K!*0r7O!*0m=7O!!7O7O!*2p",
			boldItalic: "3y566S7O7Xbpb13F4U4U7O7O424O4b6O7X*094k4k7O*027fe29u8N879S7E7b9Z9T4b5b8z6DdGagas8kaB8P7h7Lad9feb8D887u556F557O7O4I8g8g6s8g7H4Y8g8f3S3/7w3ScA8f8f8g8g5w6a5r8f7lbF7b7m6d5o7r5o7O3y567O7X7O7X7O7O6vd26V8r7O4O7X665m7O5i5g4J8G9m4c4L3Y6P8raiaPa+7f=9u*04c7==7E*02=4b*029/==as*037OaB=ad*02=8k8H=8g*04bY==7H*02=3S*028p=8f*047O8w=8f*02=8g=*0f9c9/8S=*0jai8o=*083S9m7R=*037w=*036K4O8O6C6N48=*059E9Z8f=*05dGcN=*0g5H7L5y=*0m428Oas8F8g8V8r8d9k799/by8N8g8f7Cac7C7b4YaF9fco4x4J8B7w4V7BdPag8fasbR9LcyaYa08g8L7R6h7m6+5K8x5r7LbV9LaFab8w7+7w6d7q7B7H6M7X7X6D698n487x9b56hkg3etc5aA7Ifoeacd=*0f7O=*05a58g=*087a=hkg3et==dW9A=*0z7q7a==a29m8g837u6d=*0d569x5w3/cHcH9u8m6F6S7V6a6d6S6P8Uav9i7F7H5b4F9U8g915R9c7P7K8g*026s6R8g8q7x7H9R6C6H8u8e4x8q8g8q7v7v8g8f8f4H4u5a6a6i3Y97cA*028f8f8D8ibfb3aX5w*0453527F7F6a3N4s3N585r5m92988k7lbF7m7f6i7v7a7c6S*026ya77L8f8t8x5a7u6k8r6S6Sc/dyej9W7TaUck9A9i8d7I8f8f5M5L2Z3U3R405i815b3m6b42*023y3y55557O7O8p8p6h6h4y664J4I4y664I4J4m4m3y3y5d*03613F584X6Y7C5d*022T4m5a555/*045d5d6h8/6P5d*03514I7l7C6Y4k5d*038j8j5U8a757L7i4242ac8J!!4i6D6s6D=5b!*034Z7K9u=7E9T4b!as!88aF4u9u8N6q927E7u9Taw4b8z9idGag7Ias9T8k!7m7L88cx8DcEaF==987a8n4u8A988u7j8l7a5I8n8W4u7w7C8G7n618f938i6n8w698AaX73bybe=*048z8u8W8b9H=aXde9zaA8q8d6q7b6V8E7o9o9qdPcJ8x8g8N897X6A957sai8s7T6j9t8g6s3/as6/6/8k8r87be9E8i8u878u7E7E9Y6M8r7h4b4b5be0e09U8Pac8z9Q9u8I8N6Max7Ed17yacac8P9RdG9Tas9S8k877L8zbk8Dai8Ve1ev9/cu8F8rei8+8g8k7L6B8n7HcY6H8f8f7L8eb98t8f8m8g6scA7mbu7b8H7EcrcS8Kb87J6RbM7O=7H8D=6S6a3S3S3/c8cq8o=*028feObf9+8kbX9Oab8Ze2clbo9OeZd97J6FcEbyas8i9A7N==h7eWbb9aeOcreObf7Y6h9x00*06aP8M8U7P8k8g6O5L6/5W8G73dUd27y6H9H8p9b8h947/a68Vax8Vbo9DembEal8Q876s7LcA887s887s9t7RbM8H9n848V7H8V7Tc29zc29z4b==987Yas8K9T8tau8Z8V7EeibB4b=*03c7bY==ac7H=*057q7a=*05as8i=*0b6H6B==6J5W9l7P8D7b=*2p8g=4Y4Y8Z8l=*0VbR9LbR9LbR9LbR9LbR9L=*03bV9LbV9LbV9LbV9LbV9L=*07a36+9n7S8z7m7QfE7Oe94J3y2n8r3p381Z00*044O4O7X7Oe9e97x7P42*023W6P*026y7O*02!*02b7!*0200*043ygC!3m6b9a!*02665o5o!9b7V7O!*045z!*0o4B3u00*04!00*096e2V!!5K5h5F575K5F5z5w5r3u3u5M6e3Y5i5g5K5h5F575K5F5z5w5r3u3u!5J5m5J5a5m!*0aa18w877g7XcAaNeobXeSbY8S7X8N7Lhs8N9f9y9K878h~3~37X*02b4bu8kaU9a!*0f00*0w!*0jc2!*0c8g!!gid2!*07br!bg!*02=!*06bz!*027b!*0pb+5K!*03aVbHaVbHbAbNatb7aUbybyaE6c!*0y8d6s!*0ae9*03kuc1d7*03!*0d7o!*1o8p!*0292!*07ce!8C7O!!5Z!*024b7O!*02d6aI!*08a+!5T!*0r7O!*0m=7O!!7O7O!*2p"
		},
		{
			name: "Cambria",
			lineHeight: 1172.36328125,
			descent: 222,
			regular: "3s4u699H7WdWaL3J5+5+6H8G3d5c3d7G8G*0948488G*026CdR9L9z8Oam8/8p9zaL544P9R8pcLaFad8Uad9J7M9ha89sep8X8W8q5u7G5u8G5P4t7E8z6V8H7E4L7K8E4m4a8c4fd08K8j8I8z6u6K5i8E7Uc67z7U77634Y63b83s4u6V8g8w9x4Y7Q4tdj6x7E8G5cdj4t5T8G6n6n4t8w9c4q4t6n6I7EdxdWdx6C=9L*04dy==8/*02=54*02ap==ad*038Gad=a8*02=8+9t=7E*04bM==7E*02=4m*028i==8j*038G8j=8E*02=8z=*0faCap8H=*0jaP8E=*084m9T8w=*038j=*04619K5U8s4R=*05aOaF8D=*05excO=*0g739h5x=*0m4n8za+9n8z9l8H8O8O8hapbM9n8H8d94ad8v8p4K9z9GcF4X549R8c4Q7EemaF8Aadbm9ncOaHai8w977M6K8A4Z5n9h5i9hbO9La7a79J9Z8q768l8n786S7G8M7a6A8u3Z6o4A4diMhtfOdccz8qfsePcU=*0f7H=*059E7K=*0878=iMhtfO==eq9O=*0o6t=6t=*078v7u==aqaS97838q76=*0d6maZ6o4acOcO9L8O778p9h6K767N5/9za89t8/7E4O4Kaj8z9J6B8W7U7L8G8I8x7d7c8H8L7E7Max7h7aa2894U8w8w877U8I8x8E8w4U4m4s4+4G458WcWcOcV8K8I8X8gbZbBbi6n6n6g6p6t6e6i898c6K4c4A6d4n5i5i9a8c877Uc67U77767F78785H5B5V79ce8b878J9d4c85748z5H5BdhdldPaj8ebfd09m8/9881aBaB6q6q3l4W4S5n5X8+603I693t*023I3I41418G*034t4t2Y4t4e4e2Y4v4e4e4i3+49494f*034t*052N5x5X3n555H456g*045I5I5h6n5T5h4L3N3N4s4e6+6+562W4K*036S*02~4*033333~4~4!!4s6R*0247~4!*034s4s9H3Qb2cJ72!bw!cabQ4s9L9z8o9k8/8qaLad549R9tcMaF8Yaday8U!8A9h9vch8XcfaD==8+6Y8v4s8t8+8H7X8d6Y6g8v8z4s8f7E8y7y6l8j9q8k6L8Y7u8tb87CbfbL=*04~48r8K9vca=b3cs8vad8j8i6J8p6M7o6M8I8zexbO9v8C9r897T6x8G729m7U8U7A8W8i6R4aad7979978C8Ocl8F8k8O*028/8/bz8m8W7M54544OeDeAbNaaaQ9oar9L9n9z8maf8/er8vaQaQaaaCcMaLaday8U8O9h9ocb8Xaw9Oevevbsdi9l8Zep9T7E8t8b6/8K7Eba7a9e9e8s8Lax9d8j8T8I6V7/7UaJ7z8W8jcxcx9FbI827mb/8j=7E8q=7m6K4m4m4abXcu8E=*028TdSaZbi9Kd3b59y8eencndna1hFea8o6Wcfbfad8gal8H==hrfFaM8Th6bHdSaZ8o6M6e00*06aQ9e9l878U8I7S6x8m769r85eNbo8v7aax8xaD8Uaa8fcfa7aM9gdKbpeScpaX8u8O6V9h7/8W7U8W7U9y7MdkbB9O8l9O8m9N8Ebh95bh9554==ar8KaE8LaC98aM9d9O8jcNax4f=*03dybM==ad7M=7H=*038l78=*05ad8g=*0b8m6/==8m768Q7s8X7z=*0u4K=*0tcM=cM=cM=*0l6t=6t=6t=6t=*0r9r=9r=*06eq=eq=*0776=76=76=*037E=~4~4ar~4=*0Vbm9nbm9nbm9nbm9nbm9n=*03bO9LbO9LbO9LbO9LbO9L=*07~4*057QfE7QfE5e3W2C8F3d2C0T00*045c5c8w7QfEbK8h5P3t3t3d3t5T5T5E5T85856X~4!!bM!*0200*0439jL~4426K9v!*034L4L!836H5G!*048G~4~4!*02~4*0j473u00*04!00*096n3r!!6n*084A4A6v6n*0c4A4A!5K5K6c5H5K!*0aal8G*03d08GjCfXdL8G8G9Q8G8Gie8G*029A8G8G~4*02858Z~4~48S~4~4!*0f00*0w!*0jfM!*0c86!!gfdjcaaPbY!*06aD!*02=!*06dn!*028p!*056d!*0if776!*03ew*0b!*0z8O7d!*0ad67kd67kep7kac*03=d6dRdReE7DeE7DdxdxdE7kdE7k7EcTcTdXdXiDeS938S*039X8RcFcFape8ceced6d66N6Md6d66N6Nd6cgd6d6cud6cud6d6dIgTdIdy9ady9agb9abr*03dVdVfkfk7D7DdO7kdO7kdududs9hds9h9h9x*039IdSc4c49xeNcgdtd6d6eSdTdTfDdXdXgM9Q8a8x9b9s9Q9k!9La08G9L9L8GcdcIcIb48GbHbH1O8G7z6X3Tah9Y9Ya/djaPaiaiaB4B5S7g8w9e9eaFaF6FerjJ9peSk69V9Uaa8Z8Z4M9hbjeDc8bvb8bwcDaL5J=bH*058GbwbHbwbH*07eDeDbH*06d7bHbH=bH*028G8GbH*03dXdX7v=bH*0bbt*03bwbw=btbH*099v*02bH*03bbbbfz*08fh*03ayam!!8787bgbNdWe9bgbgcK=8G8Gbj*03g2g2e9bj6k9e*02aPaYapapc3c3724q878Zc+bObObbbbbj9e9ebcbcbUbUaKa8bJbJjojobLbLbJbJbt*03=bH*04bwbwbzbzbIbP4Sdp9G9Gbt9M8H9M9M8H9M9Mbt9M8H9V8Hbq",
			bold: "3s5f6C9G8vfgbA3X6o6o759g3E5h3E7V9g*094o4o9g*0274epacab8Zb1928Da6bi5u5laG8DdeaDaT9CaTam819/aA9Wf19H9s8S5M7V5M9g5P4t8n9f7l9l8j56889l4W4K9g4QdW9s8V9l9f7d7b5J9l8jcu8d8j7v6950699g3s5f7l8I9ba1508l4tdj6A8a9g5hdj4t5W9g6R6R4t9t9c4k4t6R6Q8aeJfgeJ74=ac*04dM==92*02=5u*02b5==aT*039gaT=aA*02=9FaB=8n*04cq==8j*02=4W*028Y==8V*039g8V=9l*02=9f=*0fblb59l=*0jbn9l=*084WaO9F=*039m=*046Qav6X8I5m=*05bDaD9n=*05eUdp=*0g7O9/5U=*0m519fbOa49fa99n8+8Z99b5cDa49l8S97aT8r8D56a69+dF5D5taG9g5n8gfPaD9oaTcnaCeJd3bc9e9W8g7k9f5P5O9/5Q9/cKa/a/aVaGar8S7v8F8F7J7D8j8N876+9e4g7j5j4GjCiwgQdJdl9yfYfmea==5t=*0c8q=*03dN=aj88=*087y=jCiwgQ==ftaI=9r=*0d5t=5t=*0g8r7P==aRb+9L8O8S7v=*0d7tc87p4Kdwdwac8Z7u8I9/7b7u816MagaAac928i5l5ba+9faq7s9s8j8o9l9l9e7p7C9l9r8l8qc57C7vbn8O5b9d9f8w8j9b9f9j9f5n574Z6u5V4Ia4dQdKdS9r9q8Z8Vcicwb+777774777d6u6w8/8/7b4T5b6s545J5J9O8+918jcu8j857v8E7y7y6v6n6H7xc18J8V9o9H4U9a7i9k6v6neqeFfybn9zbQeiaA9U9e8Eb3b36W6W3I5s5p5X6z9e6j3X6C3H*023W3W4A4z9g9g9b9b4t4t3a4s4k4k3a4D4k4k4E4k4o4o4E*034t*053I9g6j3M5q684E6v*046c6c5w6R6e5w4+4v4v4s4f797b5o394Z*036S6J7f~5*036g6g~5~5!!4s7g7f7g=~5!*034u4uac3Ebbds7G!c6!d8cC58acab8Da2928Sbib15taGacdeaD9faTaZ9C!9f9/akcy9Hd6bE==9H7J9n58949H9p8R8X7J789n94589s8g9w8H6Z8V9Q997u9A8J94bO8pcycv=*04~5949sakd8=b+dy9saT8V8K7c8D7M877n8W8Dg3ct9X9map908O7f9F7Ma08ra08w9r8Z7f4KaT7w7w9u998ZcN9W998+8Z8+9292cF8y8T815t5t5lfjfyd0aybr9Gbiaca4ab8yaE92eJ8rbrbrayb8debiaTb39C8Z9/9Gco9HbgaGfUg5cjeNa28Xfeay8n8T8J7o9m8jch7v9S9S9f9xa/9H8V9p9l7l898jbJ8d9C9ldIdUa1cA8s7Jcn8Z=8j8X=7J7b4W4W4Kc+d89l=*029pfgcDcfa2dsbxam8WfodwdObIj1gf8h7hd6cyaT8Vb39d==iDgObl9dgHcvfgcD8A7d6y00*06bu9Sa28w9H9p8h778y7tae8KfpcJ8r7vbb9Eb99UaC9bcPaRbv9Oe7c0fQdabZ9y8Z7l9/899s8j9s8jas8ueycGaN9qaL9rax9lcN9VcN9V5t==b39tbb9xbd9xbk9HaG9ldha/4N=*03dNcq==aT8q=*058F7y=*05aT8V=*0b8y7o==8y7t9w8i9H8d=*0H5t=5t=*0l9r=9r=9r=9r=*0Vf2=f2=*0g8n=~5~5bb~5=*0D5t=5t=*0ecnaCcnaCcnaCcnaCcnaC=*03cKa/cKa/cKa/cKa/cKa/=*07~5*057QfE7QfE5e3W2C8F3e2C0T00*045h5h9g7QfEbK8l5P3H3H3E3H6e6e6b6e85856X~5!!c4!*0200*0439lA~54h7iai!*035151!5f7d5V!*041V~5~5!*02~5*0j4w3u00*04!00*096R3R!!6R*084Q4Q6/6R*0c4Q4Q!6f6c6D686g!*0aaz9g*03dW9glrh9el9g9la0a29gkd9g*05~5*028E9/~5~5a3~5~5!*0f00*0w!*0jfQ!*0c8R!!godj!*09aI!*02bh!*06dg!*028N!*0pfh7+!*03fz*0b!*0z8+7p!*0ad67Hd67Hep7I!*0h7I!*1o9f!*02a2!*07d4!br9g!!9g!*024Cb+!*02dBaP!*08aJ!6F!*0r9g!*0m=bH!!9g9g!*2p",
			italic: "3s4o659H7Edqaj3G5Q5Q6v8g374/377i8g*0943438g*026ndR9c9k8sa68U8f99at504H9r8bcoav9K8H9K9e7x8+9U8/e08x8A805j7i5j8g5P4f8e896N8c794A8a8i4f4a7N4bcv8n7X8f896n5+5p8n7cbo717c725T4X5T8g3s4o6R7Q8G9n4X7r4fdj6c7l8g5cdj4f5T8g6b6b4f8D8V3N4f6b6m7ldqdOdq6n=9c*04d2==8U*02=50*02a9==9K*038g9K=9U*02=8M8S=8e*04b5==79*02=4f*027Z==7X*038g7X=8n*02=89=*0f9Za98c=*0jax8i=*084f9I8p=*037S=*045V9u5G8e4D=*05apav8k=*05e0c4=*0g6L8+5D=*0m4i89aG9f899c8g8u8s82a9bs9f8c7Q8Z9G818f4A999jc14Q509r7N4k7le0av8i9Kb295csara18f8R7A5+8e4/5p8+5p8+bI9E9Ha39i8U80727T7W786V7g8y705Q853Z6o4A49i0h9fecScl8lfaeFcx=*0f79=*03d3=9e8a=*0876=i0h9fe==dX9G=*0z817n==acap977T8072=*0d6iaC6t4ac3c99c8s6N8e8+5+727p5Q9k9U9c8U7i4H4I9X899e6u8A7m7R8e8e896Z6N8c8c79799W6O6C9f7S4k8a8a7P778D8f8i8f4F4q4t4N4B458RbUbLcr8n8p8v7Xblbqao6n6n6f6n6n625X7O7S5+4e4e5X4q5p5p8x7T7N7cbf7370727v76765J5B637ocd7N7Y828J4e7J6P895J5BcHcUd99I89aJcy8A8F8v81araz6c6c3j4S4N595D8m5q3G653l*023I3I4a458g8g8G8G4f4f2Y4e*022Y4v4e4e4d3V3I3Ianan4f*064e2N5x5w3k4K5j416g*045I5I5h6a5B5h4L3N3N4j4b6X7d4T2W4K*036S6J6S~6*033333~6~6!!4s6w*0242~6!*034u4u9c37aPck6X!b8!blbn4v9c9k8c8Y8U80at9K509r9ccoav8v9Kaj8H!8e8+8Lbj8xbxa7==8K6N8m4v8c8K8f7u7Q6N6x8m8v4v7J7l8u7t6I7X978e6A8G7u8caC7kaBbn=*04~67/8E8Lbl=aocg7J9K7X886s8f6J7j6R8j8aesbq9b8x9b7C7L6h956Q937l8R7A8M8a6w4a9K6N6N8I8q8sc68w8e8u8s8u8U8Ub78b8B7x50504Hejedba9YaB8Ka99c9f9k8i9/8Ue681aBaB9Yaxcoat9Kak8H8s8+8Kbx8xah9befefb9de9c8Be09x8e7L7L6H8779dI6C8n8n7M8AaY8t7X8n8f6Ncv7cbo718x7SbUc28Abe7L6Vbo86=797Y=6N5+4f4f4abZbZ8i=*028ndlaKaPbRd9ac9m7Te2bHd29xhjd57R60bxaB9K7Xag8H==gCeDag8ofdbpdlaK846D6e00*06aB8x9c7P8H8f7y6p8i6N9j7CeldI816C9Z7Maz8A9Y7MbU9eat8tdsaLeBbRaG8u8s6N8+cv8A7c8A7c8x71d48x9b7S9t7X9h8ib68rb68r50==af80ax8Aaj8kat8t9b7LcoaY4a=*03d3b5==9G79=*057T76=*059K7X=*0b8i6H==8f6N8q6T8x71=*0S4a=4a=4a=4a=*17e1=e1=*0g8e=~6~6ad~6=*0E4m=*0fb295b295b295b295b295=*03bI9EbI9EbI9EbI9EbI9E=*07~6*057QfD7QfE5d3W2D8G3d2D0U00*044/4/8w7QfEbK8g5O3l3l373l5L5L5v5S7K7K6X~6!!bf!*0200*0438j6~63P6A9l!*034y4y!826t5G!*041I~6~6!*02~6*0j473u00*04!00*096a3m!!6a*084t4t6f6a*0c4t4t!695p5Y5j5p!*0aaa8g*03cv8gj5ePdw8g8c9s8g8gie8g*029l8g8g~6*027W8P~6~68x~6~6!*0f00*0w!*0jfz!*0c7B!!fGdj!*09a6!*02=!*06dg!*028f!*0peK6T!*03djdhedebeleldWe2egejeoee!*0z8u6Z!*0ad67kd67kep7k!*0h7E!*1o8x!*028Y!*07eE!cT8g!!8g!*024qb+!*02djaP!*08aF!6F!*0r8g!*0m=bH!!8g8g!*2p",
			boldItalic: "3s586g9q86fcb83Q6c6c6T8Z3x553x7w8Z*094f4f8Z*026Sep9C9N8EaD8O8o9HaP5l5daf8jcOamaz9kaz9U7R9rae9key9a918w5z7w5z8Z5w4e8W8T748W7P508R944K4F8q4Fdy998s8X8Q786W5I987Qc57z7Q7o5P4R5P8Z3s587e8m9b9z4R7W4edj6v808Z5hdj4e5W8Z6G6G4e9i8V4d4e6G6E80eGfceG6S=9C*04dc==8O*02=5l*02aH==az*038Zaz=ae*02=9pa6=8W*04bL==7P*02=4K*028x==8s*038Z8s=98*02=8T=*0fa+aH8W=*0jaU94=*084Kay9n=*038w=*046Ja66B8m5d=*05bsam93=*05elcD=*0g7t9r5V=*0m4Q8Tbj9E8T9F8/8z8E8LaHc89C8W8k8Sas8a8o509H9ddb5k5laf8q5c8gfdam93aBc3ageycyaS8Q9H8b79935S5M9r5P9rcob5aVaEax9C8w7o8I8B7V7m7/8T866E8L477d5v4uiXh/gidwcY9ifze/dO9c=*0e7O=*059T8R=*087m=iXh/gi==eDau=*079c=*037O=7O=*0j8g7i==arbI9z8E8w7o=*027O=*097mbW7m4Fc/c/9C8E748o9r6W7o7S6Q9Sae9C8O7T5d56aJ8Q9Y7n917Q8e8W8Y8Q7k7o8W8W7O7Obv7x7Wbb8/568R8R867I9592928X5b554S6k5Y4B9Vded8dr9a9a8E8sbVb+bp74757078786o6o8V8E6W4I4R6o4W5I5J9C8i8H7Qc17M7M7o8j7m7m6j6o6I7Fc48P8K969q4L8q6V8Q6j6odUeaePb99rbGdOa79D8R8uaRa+6K6K3F5o4N5u6h8R5T3Q6g3A*023E3E4I4x8Z8Z8N8L4e4e324e4j45304t49444r4745454s*034e*053I5W5V3F5e5H4I6v*045I5I5h6m6f5h4L3N3N464b6X7d59344Z*036S6J7a~7*036g6g~7~7!!4s71*02=~7!*034u4u9C3xbidm7T!ce!dhdf589C9N8D9N8O8waPaJ5laf9CcOam94azaG9k!939rakcP9acxbJ==9/7y94588W9/908G8G7y6Q949h589n8g9k8p6l8sag8/7t9A8J8Wbr8kbBb+=*04~78X99akdh=bndE9naz8s8I7d8o7B857V908HeLb/9s999V8s8H7J9y7K9L889X7Z9N8L714FaB7f7f9w948EcA9w8/8z8E8z8O8ObX8h8T7R5l5l5deZf7ckalb19baT9C9E9N8hac8Oem8gb1b1alaPcOaPazaH9k8E9r9bcL9aaPabfifqbzdY9F8Oey9/8W8D8D7o8H7OgT7/9898919kcH9b8s998X74dy7QcE7z988Wdede9fco877lbZ91=7O8X=746W4K4K4FcBcx94=*0298eqckbEcsd4aK9J8+eDcLdtaYife/827McxbBaB8sb38N==i9fPa+8Lg5b/eqck8g706y00*06b1989F8c9p8X87778h7v9Z8seZgT8g7/aN91b19Cas8TcfaPb39bdEbFflcQbf8/8E749rdy917Q917Q9Y7ze798am8Wag90ac94cI9BcI9B5l==aM95aP9kaN95aP9bab8QcOcH4F=*03dcbL==as7O=*058I7m=*05aB8s=*0b8h7o==8i7v907p9a7H=*0k7O=7O=7O=7O=7O=*1X8W=~7~7b7~7=*0o7O=7O=*027O=7O=7O=7O=7O=*0hc3agc3agc3agc3agc3ag=*03cob5cob5cob5cob5cob5=*07~7*057QfE7QfE5d3W2D8G3d2D0U00*0455558Z7QfEbK895w3A3A3x3A6f6f6e6f7O7O6X~7!!bC!*0200*0438lt~74h7iam!*034R4R!9z6+5X!*041V~7~7!*02~7*0j4w3u00*04!00*096G3I!!6G*084M4M6O6G*0c4M4M!6E5S6j5H5S!*0aai8Z*03dy8Zlbgkd/8Z8W9z8Z8Zkd8Z*05~7*028u9U~7~79M~7~7!*0f00*0w!*0jfQ!*0c7Y!!gedj!*09ar!*02aZ!*06dg!*028C!*0pfh7B!*03fd*07fc*03!*0z8z7k!*0ad67kd67kep7k!!fn!*0e7E!*1o8Q!*029R!*07dA!c98Z!!8Z!*024Cbd!*02dBaP!*08aJ!6F!*0r8Z!*0m=bH!!8Z8Z!*2p"
		},
		{
			name: "Arial",
			lineHeight: 1149.90234375,
			descent: 211.9140625,
			regular: "4m4m5z8I8IdVar2/5d5d65984m5d4m4m8I*094m4m98*028IfTararbibiar9zcabi4m7Qar8Id1bicaarcabiar9zbiareMarar9z4m*027l8I5d8I8I7Q8I8I4m8I8I3u3u7Q3ud18I*035d7Q4m8I7Qbi7Q*025e445e984m5d8I*03448I5dbx5O8I985dbx8E6g8B5d*02908p5d*025J8Id2*029z=ar*04fE==ar*02=4m*02bibi=ca*0398ca=bi*02=ar9z=8I*04dV==8I*024m*038I*068B9z=8I*02=8I=*0f9Dbi8I=*0jbi8I=4m*05==4mbv6Y=*037Q=*044A8I5e8I3u=*059sbj8I=*05fEeM=*0g5T9z4m=*0m3u8IbSag8Iag8Ibibi7QbicGag8I8JarbM9s9z8Ica9MdN3u4mar7Q3u7QdXbi8IcadpagdAarbO8Iarar7Q9G5Y4m9z4m9zdmatbIbic47Q9z7Q9z9z8x8x8I8I7a7D8I446t984mkRj6gpgCd173j6eMc3=*0f8I=*05ca8I=*088x=kRj6gp==ga9G=*0g4m*02=*0f8x6R==b2aG9s8R9z7Q=*0d5taJ5L3udTdTarbi7Q8I9z7Q7Q9575arbiasar8I7Q3ubx8Ibi5dar7Q8I*037Q7Q8I*03bz7a7a9T7X4m8I8I8L7R9F8I*023u3u5A574M3u8Yd1*028I8I8F8Icncd8C5d*068u8u7Q3u443u5t4m4m8I8U8z7Qbi7Q887Q8t8x8x7Q*03ca8j7X8L8E6d7Q6k8I7Q7Qf4eafJb86JbfbYal9U7B8faLaL5/5/2v3M*025I7x512/5z3u*025d5d5t5t98*035d*094m4m5d*0d522t5k585t5/*045d*0d4m5d*036d6d5d917r9z7a5d5dbf98!!5d7Q*02=~8!*035d5dar4mcgd660!c6!dnbM3uarar8Dasar9zbica4marasd1biaacabiar!9G9zarcuard3bI==926+8I3u8z928/7Q8J6+6V8I8I3u7Q7Q907Q708IaO8V7y9F6b8za88db9cd=*04ar8/8zc4e+=8Mcd9pca8Ibi7Q9z6k9N8hbQ91dXd1ay8Iay7Qarar9x9kbx8G7g6q9p8Z7Q3uca6W6War8Ibid1aM8Vbi*02arardx8ubfar4m4m7QgxfOdm97bf9Xbfaragar8uaBarer9sbfbf97agd1bicabfarbi9z9XbUarbAareleGcodRagbffObi8I8Z8j5J978Iat7a8L8L6S97aM8E8I8u8I7Q7a7QcT7Q8Z89cycT9Nbf897+bK8u=8I8I=7+7Q3u4m3ueacJ8I=*028EkW9Mca9BeSb9as7Qe1aTcZaJgtdz9s7acsaMca8Icz9T==gOe0d19AiDdkkW9Mbi7Q7T00*06bf8Lag89ar8I7F6r8u5Jau8Berat9s7a976S976S976SbC8obi8EdLa8hNdCbN89bi7Q9z7a8I7Q8I7Qar7QetaPar89ar89ar8Idtaqdtaq4m==ar8Dag97bi8Ebi8Ear89d1aM3u=*03fEdV==bM8I=*059s8x=*05ca8I=*0b8u5J==8u5Jar7Qar7Q=*0K4m=*0ed1*04=*1l8I=4m4ma/8J=*0Vdpagdpagdpagdpagdpag=*03dmatdmatdmatdmatdmat=*07b/6e9f8Jas907QfE8IfE5d3W2D8I4m381j00*04!5d8I8IfEfE6t8E3u*035d*038I8I5u!*02fE!*0200*0438fE!2Y5y5y!*035d5d!7Q8I5d!*042D!*0o4m3u00*04!00*095d!*025d*05!*045J!*0f5Q5Q5V585Q!*0a8Ibibi8I8Id1bih6iceMcM818Iar9zfE89arcaar8Ibi8Iar9z8I8I~9~9!~9~9!*0f00*0w!*0jdR!*0c53!!gNbx!*09fE!*02c0!*069o!*0teL7G!*03d2d2!*05d2*03~8!*0z7Q!*0afE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b998!!2D!*024m8B!*02b9fj!*08bf!4i!*0r8B!*0m8B97!!8B8B!*2p",
			bold: "4m5d7q8I8IdVbi3K5d5d65984m5d4m4m8I*095d5d98*029zffbi*03ar9zcabi4m8Ibi9zd1bicaarcabiar9zbiareMarar9z5d4m5d988I5d8I9z8I9z8I5d9z9z4m4m8I4mdV9z*03658I5d9z8Ica8I8I7Q654o65984m5d8I*034o8I5dbx5O8I985dbx8E6g8B5d*02908I5d*025J8Id2*029z=bi*04fE==ar*02=4m*02bibi=ca*0398ca=bi*02=ar9z=8I*04dV=8I*03=4m*029z*068B9z*04=9z=*0fbfbi9z=*0jbi9z=4m*08ch8I8I=*028I=*04619z7v9z4m=*05b4bj9z=*05fEeM=*0g7v9z5d=*0m4m9zd4bf9zbf9zbibi8Ibid5bf9z9uarbm9O9z8Ica9Zez4m4mbi8I4m8Ifwbi9zcadlb7dTbEce9zarar8I9o5E5d9z5d9zc+bkcybic28I9z7Q9z9z8e8e8I8I7N939z4o7O985dkRj6hnifdV8Ij+fEdV=*024m=*0b8I=*05ca9z=*079z8e=kRj6hn==g9ap=*0g4m*02=*0f9188==a/d59T9T9z7Q=*0d7Pd17W4meWeWbibi8I9z9z8I7Qa57Abibiarar8I8I4mc79zbi65ar8I8I9z*028I8I9z9z8I8Ice7N7NaP8T5d9z9z9a8I9p9z*024m4m6l5c5A4m9sdV*029z9z9D9zd1ddbK65*0697978I5d*028s5d5d9z9J968Ica8I8X7QaE8e8e8I*03ca9D8T9a9s7a8I749z8I8Ig7eKiWcJ8mcUdBc8aQ8m8Pbpbp5M5M323Y*025T8b5E3K7q4m*025d5d5T5T98*035d*0p5K2d5U5K5T5/*045d*037Q5d*0d6d6d5d8t7e9z995d5dbf9W!!5d8I*02=~a!*035d7hbi=dlea7q!cV!evd64mbibi9pbfar9zbica4mbiard1bia4cabiar!9o9zarcRarcFcy==9D7q9z4m969D9y8I9u7r7c9z8t4m8K8I9A8I6Z9zb+9H88aI6+96bb90bNdd=*04bi9y96c2fF=bKddaAca9zbi8I9z74bL8hcA9yfwdVa/9za/9tarara39sbv927X6TaA9G8I4mca7v7var9zbid1bA9Hbi*02arardR9pb7ar4m4m8Ih6gDdH9ybf9Kbfbibfbi8Tb8are89Obfbf9ya+d1bicabfarbi9z9Kdmarbqa/fJfXdCfjbfb7g7bf8I9G9D6x9X8Ib57N9D9D7Q9XbA9s9z9s9z8I7G8IdH8I9D95d1dcbpdm9D8Edm97=8I9z=8E8I4m*02f9ea9z=*029sk0cadBa/fgcsar8IeucwcFbNgRfk9O7NcFbNca9zcLa6==hwfecK9+k0e5k0cabi8I9800*06bf9Dbf9Dar9z7D6/8T6xa/9me8b59O7N9y7Q9y7Q9y7QbV9Lbi9sdLbahCepbi92bi8I9z7G8I*03ar8IdlaNa/95a/95a/9zdoaCdoaC4m==a+9ma+9Xbi9sbi9sa/95d1bA4m=*03fEdV==bm8I=*059O8e=*05ca9z=*0b8T6x==8T6xar8Iar8I=*0I4m*02=*1F8I=5d5dbb9u=*0E4m*02=*0ddlb7dlb7dlb7dlb7dlb7=*03c+bkc+bkc+bkc+bkc+bk=*07d8819X9ub1ac7QfE8IfE5d3W2D8I4m381j00*04!5d8I8IfEfE7O8E4m*037Q*038I8I5u!*02fE!*0200*0438fE!3M7v7v!*035d5d!9s9z5d!*042D!*0o5d3u00*04!00*095d!*025d*05!*046c!*0f5V5U6q5K5U!*0a8Ibibi8I8IdVbih6j9eMcO818Ibi9zg+8Iarcabiarbi8Kar9z8I9j~b~b!~b~b!*0f00*0w!*0jdR!*0c7F!!hrbx!*09fE!*02c0!*069o!*0tfE7Q!*03d2d2!*05d2*03~a!*0z8I!*0afE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b998!!2D!*024m8B!*02b9fj!*08bi!4i!*0r8B!*0m8B97!!8B8B!*2p",
			italic: "4m4m5z8I8IdVar2/5d5d65984m5d4m4m8I*094m4m98*028IfTararbibiar9zcabi4m7Qar8Id1bicaarcabiar9zbiareMarar9z4m*027l8I5d8I8I7Q8I8I4m8I8I3u3u7Q3ud18I*035d7Q4m8I7Qbi7Q*025e445e984m5d8I*03448I5dbx5O8I985dbx8E6g8B5d*02908p5d*025J8Id2*029z=ar*04fE==ar*02=4m*02bibi=ca*0398ca=bi*02=ar9z=8I*04dV==8I*024m*038I*068B9z=8I*02=8I=*0f9Nbi8I=*0jbi8I=*084mbt6Y=*037Q=*044p8I6g8I3u=*059Dbj8I=*05fEeM=*0g5y9z4m=*0m3u8Ibqab8Iab8Ibibi7Qbicgab8I8Iarca9C9z8Ica7NdL3u4mar7Q3u7Idebi8IcacI9sdAarbq8Iarar7Q9o5d4m9z4m9zcp9WbVbibd7Q9z7Q9z9z7Q7Q8I7+6S7Q8I446t984mkRj6gwgwca6Yj6eMca=*0f8I=*05ca8I=*087Q=kRj6gw==ga9G=*0g4m*02=*0f8x6R==at9Q9s9s9z7Q=*0d4C9R5s3udPdNarbi7Q8I9z7Q7Q9575arbiarar8I7Q3ubP8Ibi5dar7Q8I*037Q7Q8I*03b06T7h9E7Z4m8I8I8C7R9F8I*023u3u5A3u*028Pd1*028I8I978Ib+cb8I5d*068m8m7Q4z4N4y5s4m4m8I8P8C7Qbi7Q837Q8z7Q*05ca807Z8C8C4B7Q708I7Q7Qeve9fcav7db4bLa29h7B8farar4Q4Q1W3r*02577+5s2/5z3u*025d5d5A5A98*035d*094m4m5d*0d5J1j555g5A5/*045d*0d4m5d*036d6d5d9q7k9z7a5d5dbb9q!!5d7Q*02=~c!*035d5dar4mclde65!cq!dxc73uarar8Wavar9zbica4marard1bia8cablar!9o9zard5arc/bV==8W6T8H3u8C8W8X7Q8I6T7f8H8u3u7Q7I8A7Q6/8Iau8Z7C9r5S8Cac8ybocb=*04ar7V8CbcdO=8Icb8Pca8Ibi7Q9z5W9N8hbQ91ded1ax8Iax80arar9x9kbG8G6v5C8P937Q3uca6V6Var8Ibid1aK8Zbi*02arardb8wb4ar4m4m7QgGfmdc9dbb9/bkarabar8wb0arel9Cbbbb9daKd1bicablarbi9z9/crarbnaxeoercBdSabaSf+aG8I8P8a7J8F8IaM7h8I8I7o8QaK8C8I8C8I7Qd17Qd37Q8Y86c+dj9Jbw8e7IbM8m=8I8I5W7M7Q3u*02eecY8I=*028Ikm9jbUcbe7aSas7QdKaFcZaJg0do9C7hc/boca8IbU9e==hkemcY9ok2dIkm9jbi7Q8I00*06bb8Iab8ear8I7I5j8w5Wa58delaM9C7h9d7o9d7o9d7obD8Tbi8CdXaZg/d7bi7Qbi7Q9zd18I7Q8I7Qar7Qe18Yax86ax86ax8Idi9Xdi9X4m==9P88aK8Qbi8Cbi8Cax86d1aK3u=*03fEdV==ca8I=*059C7Q=*05ca8I=*0b8w7Q==8w5War7Qar7Q=*0K4m=*0ed1*04=*1l8I=4m4max8J=*0VcI9scI9scI9scI9scI9s=*03cp9Wcp9Wcp9Wcp9Wcp9W=*07b+6e9A8OaU8N7QfE8IfE5d3W2D8I4m381j00*04!5d8I8IfEfE6t8E3u*035d*038I8I5u!*02fE!*0200*0438fE!2Y5y5y!*035d5d!7Q8I5d!*042D!*0o4m3u00*04!00*095d!*025d*05!*045J!*0f5C636b5Z63!*0a8Ibibi8I8Id1bih6hGeMcM818Iar9zfE89arcaararbi8Iar9z8I8I~9~9!~9~9!*0f00*0w!*0jdR!*0c53!!gXbx!*09fE!*02c0!*069o!*0teL7G!*03d2d2!*05d2*03~c!*0z7Q!*0afE7QfE7QfE7Q!!eV!*0e7Q!*1o7K!*029A!*07cT!b998!!2D!*024m8B!*02b9fj!*08bf!4i!*0r8B!*0m8B98!!8B8B!*2p",
			boldItalic: "4m5d7q8I8IdVbi3K5d5d65984m5d4m4m8I*095d5d98*029zffbi*03ar9zcabi4m8Ibi9zd1bicaarcabiar9zbiareMarar9z5d4m5d988I5d8I9z8I9z8I5d9z9z4m4m8I4mdV9z*03658I5d9z8Ica8I8I7Q654o65984m5d8I*034o8I5dbx5O8I985dbx8E6g8B5d*02908I5d*025J8Id2*029z=bi*04fE==ar*02=4m*02bibi=ca*0398ca=bi*02=ar9z=8I*04dV=8I*03=4m*029z*068B9z*04=9z=*0fbAbi9z=*0jbi9z=4m*08ce8I8I=*028I=*046c9z7v9z4m=*05b4bj9z=*05fEeM=*0g7v9z5d=*0m4m9zcsb49zb49zbibi8Ibicoar9z9yarbIa39z8Ica9JeC4m4mbi8I4m8Iefbi9zcad5ave8btbA9zarar8I9e5E5d9z5d9zcFbacdbibc8I9z7Q9z9z8e8e8I8I7N8I9F4o7O985dkRj6hnifdV8Ij+fEdV=*024m=*0b8I=*05ca9z=*079z8e=kRj6hn==gbaM=*0g4m*02=*0f9188==b4cn9T9T9z7Q=*0d74ch7Z4meWeUbibi8I9z9z8I7Qa57Abibiarar8I8I4mcd9zbi65ar8I8I9z*028I8I9z9z8I8IbA7v7+au8Y5d9z9z9k8I9p9z*024m4m6l4m4W4m9jdV*029z9za89zdkd2bR65*069d9d8I4/4/5d8m5d5d9z9J9f8Ica8I8G7QaU8e8e7R*028Ica9I8Y9k9s6n8I729z7R7RfEeFiJcL8+d7dtc8al8m8Pb2b26i6i314n*026g8H6l3K7q4m*025d5d5W5W98*035d*0k5a*046i2M5N6b5W5/*045d*037Q5d*0d6d6d5d8F7M9z9u5d5dbf9z!!5d8I*02=~d!*035d5dbi=dmea7p!dc!eydf4mbibi9yavar9zbica4mbiard1biahcabear!9e9zarcSarcZcd==9I7v9z4m9f9I9J8I9y7v7I9z8K4m8S8I9r8I729zb89t8kao6p9fb092c5d2=*04bi8Q9fbJfx=bRd2aAca9zbi8I9z7lbL8hcA9yefdVau9zb49tarara39sbv927X6TaA9G8I4mca7v7var9zbid1bA9tbi*02arardS9Cbfar4m4m8Ih6gidm9DbfaBbfbib4bi9Cbiareva3bfbf9DaLd1bicabfarbi9zaBcdarbpb4fjftdmfEb4bfgibp8I9H9s8m9G8Ibw7+9z9z7X9KbA9s9z*028IdV8IdR8Ia697dVeDb3dm9i8Edx9d=8I9z7l8P8I4m*02f9ea9z=*029zkfcacSdffacvar8IeucwcFbNgXfia37+cZc5ca9zcg9C==hMflcZa8kfebkfcabi7R9800*06bf9zb49iar9z8/7j9C7lar92evbwa37+9D7X9D7X9D7XbZ9Abi9sdFaThtegbl8Rbi8I9zdV8I*03ar8IdEa6b497b497b49zdra8dra84m==aj97aL9Kbi9sbi9sb497d1bA4m=*03fEdV==bI8I=*059z8e=*05ca9z=*0b9C8I==9C7lar8Iar8I=*0I4m*02=*1F8I=5d4Nbb9N=*0E4m*02=*0dd5avd5avd5avd5avd5av=*03cFbacFbacFbacFbacFba=*07d8859X9zbSaj7QfE8IfE5d3W2D8I4m381j00*04!5d8I8IfEfE7O8E4m*037Q*038I8I5u!*02fE!*0200*0438fE!3M7v7v!*035d5d!9s9z5d!*042D!*0o5d3u00*04!00*095d!*025d*05!*046c!*0f606e6H6b6e!*0a8Ibibi8I8IdVbihgi/eMcO818Ibi9zg+8Iarcabiarbi8Iar9z8I9j~b~b!~b~b!*0f00*0w!*0jdR!*0c84!!hWbx!*09fE!*02c0!*069o!*0tfE7Q!*03d2d2!*05d2*03~d!*0z8I!*0afE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b998!!2D!*024m8B!*02b9fj!*08bi!4i!*0r8B!*0m8B97!!8B8B!*2p"
		},
		{
			name: "Times New Roman",
			lineHeight: 1149.90234375,
			descent: 216.30859375,
			regular: "3W5d6o7Q7Qd1ca2Q5d5d7Q8Q3W5d3W4m7Q*094m4m8Q*026Yepbiararbi9z8Ibibi5d65bi9zdVbibi8Ibiar8I9zbibieMbibi9z5d4m5d7l7Q5d6Y7Q6Y7Q6Y5d7Q7Q4m4m7Q4mca7Q*035d654m7Q7Qbi7Q7Q6Y7w387w8t3W5d7Q*03387Q5dbU4k7Q8Q5dbU7Q6g8B4I4I5d90755d5d4I4S7QbK*026Y=bi*04dV==9z*02=5d*02bi*068Qbi*058I7Q=6Y*04ar=6Y*03=4m*027Q*068B7Q*07=*0ea6bi7Q=*0jbi7Q=*084mb48E=*037Q=*046m9z5o9z4m=*059sa+7L=*05dVbi=*0g6H9z4m=*0dbi=*074m7QbU8+7Q8+7Qarar6YbicL8+7Q7n9zbi7R8I7Qbibic23Z5dbi7Q4m7BcMbi7Qbibi8hetaPaa7Q8I8I65965o4m9z4m9zc88ubDbicd7Q9z6Y8r8r6Y6Y7Q7Q6X6C7Q384p3V5dkRieeMfEdV8IhnfEca=*0f6Y=*05bi7Q=*086Y=kRieeM==eS8M=*0z8P6b==aa7Q9s7Q9z6Y=*0d4m7Q4Z4mc6c4biar7Q9z9z656Y8m6darbibl9z6Y654ma+7Qar5dbi7Q6Y8b8b7Q6Y6Y7Q7Q6Y6Y9P6A6A9c6X5d7Q7Q757Q6Y7Q*024m4d4m*0392ca*027Q7Q7N7Q9Sai8F5d*067E7E655d5d6Q5d4m4m7Q8B7m7Qbi7Q7J6Y7M6Y*05bi7o6X758n4m7Q6K7Q6Y6Ycydddl8R7ca9ck8S8M827x9N9E51512r3p*024B6I4F3r5J5d*043U3U8Q*035d*094m4m5d*0c5+4B2C3k4x3U5/*045d*036Y5d*084m5d*036d6d5d8E6t9z6R5d5dbi8u!!5d6Y*02=65!*035d5dbi4maScE6r!bi!cMbD4dbiar92a39z9zbibi5dbibldVbia3bibi8I!969zbibrbibybD==8c6A8b4d7L8c7Z6W7n6A6u8b7v4d7U7B8o746+7Q7V7P6c8r6i7L916Y9Oai=*04ak7Z7LbidW=8eai8Mbi7Qar6A8I6/9073br8GcYca9E89al6Y8u8uag95aX7Z7r628M7Z6Y4mbi6l6l8I7QardV9V7Par*029z9zbM92ak8I5d5d65dEdEbBarbib4bibi8+ar92aG9ze07RbibiaraCdVbi*028Iar9zb4cmbibiaafNfNb2dE8+akg4ar6Y7Z7o6q7Z6YaP6b8n8n7C7P9V8n7Q8n7Q6Y6R7Qa87Q8n7Tc2c285aw786JbH7c=6Y7z=6J654m*02bnbj7Q=*028nik9Vav8vf8aBbi9eg9d2e0aPiUeD7R6bby9Obi7QcJ9d==h7dMbX8SiZcoik9Var6Y5e00*06bi8n8+7m8I7Q725v926q9T83e0aP7R6bar7Car7Car7Cci8Zbi8ndj9Lg8clar6Yar6Y9z6Rbi7Qbi7Qbi7Qct9raa7Taa7Taa7QdK8ydK8y5d==ar83aC7Pbi8nbi8naa7TdV9V4m=*03dVar==bi6Y=*057R6Y=*05bi7Q=*0b926q==926qbi7Qbi7Q=*29bi=*0e6Y=5d5db97n=*0W8h=8h=8h=8h=8h=*03c88uc88uc88uc88uc88u=*07dn8f8t7Mab8B7QfE7QfE5d3W2D7Q3W381j00*045d5d7Q7QfEfE4p7Q5d*036Y*037Q7Q5u5u5daqfE3W!!00*0438fEkJ3r6x6x3q6w6w4U5d5dfE8Z6Y5deZeZ56eH5d2D5d5ddkayat7E75*027Q4meZ7Q7Q8teZ7Q7P8I9D9/4hdP9/4h4m3u00*04!00*094I2C!!4I*055i*0237374X4I*095i*023737!4h404w4y404I4I2C7j4I4I3F2C!*029Farar7Q7Qcabif9heeMc8817Qbi9zfE7Q8Ibibi8Iar7Q7Q9z7Q7QaHbc7QbTar!*0f00*0w!*0ed2cHarg09zd1dK7Rareh7+eafsbi7Q7QaM8Fb47vcabieWbxbA8Ibievcrar*02ebiKfkbi9z6Yc0bDaW4d=bieva69o619DaM8Ihs6m9g8L6s8356ekiq8B6W92bib9ca8I8Iarbi7Q6Y4m4m9Xcac9dO6xgsbKbKfSbK*0b7g5da6f0gsbigolhqagtbigolh9zarbidV4m8cc3bz7QbVfMjDb+7QbTfK4m6Y7QcahBbihBar6YbsaMbihBbK7Q7Q!*03fE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b98Q!!2D!*023W8B!*02b9fj!*08bi!4i!*0r8B!*0m8B8Q!!8B8B!*2p",
			bold: "3W5d8H7Q7QfEd14m5d5d7Q8W3W5d3W4m7Q*095d5d8W*027Qeybiarbibiar9zcaca657QcaareMbica9zcabi8IarbibifEbibiar5d4m5d957Q5d7Q8I6Y8I6Y5d7Q8I4m5d8I4md18I7Q8I8I6Y655d8I7Qbi7Q7Q6Y6a3s6a883W5d7Q*033s7Q5dbH4I7Q8W5dbH7Q6g8B4I4I5d908s5d5d4I5a7QbK*027Q=bi*04fE==ar*02=65*02bibi=ca*038Wca=bi*039z8I=7Q*04bi=6Y*03=4m*027Q==7Q*038B7Q=8I*02=8I=*0fbtbi8I=*0jca8I=*084mcT8E=*038I=*047lar6car4m=*05bpc18I=*05fEbibi=*0f89ar5d=*0dbi=*074m8IbPal8Ial8Ibibi6YbicMal8I87arbz8g9z7Qcabice4P65ca8I4m7HeIbi8Icaca8Ggwc3aS8I9z8I65ae815dar5darcs9ocxaccn7Qar6Y96967a757Q7U615d9k3s544n5dlJiefEiffE9zj6gvdV=*0f6Y=*05ca7Q=*087a=lJiefE==faa6=*0v8I=*028G5S==bu8IaA7Rar6Y=*0d4m8I5F5dcTcTbibi7Qarar656Y8k7iarbibdar6Y7Q5dcV8Ibi6Ybi7Q7Q8/8/8I6Y6Y8I8I6Y6Y9P6H6H9h795d8D8D9f7Q868I*024m4S4w4m*029vd1*028I8I8b7QbTbrbi6Y*046h6h8/8/654K5d5v4/5d5d8I9F8b7Qbi7Q8l6Y817a7a6Y*027Oca8s799f905d8I7X8I6Y6YdtdEeya88pb4dh9K9k807xarar55552R3+3+4a5s6M4H4p7M5d*043X3X8W*035d*094m4m5d*0c5+4H2N3p4u3X5/*045d*037Q5d*0d6d6d5d9w7vaU8a5d5dca94!!5d6Y*02=7Q!*035d5dbi=cved8a!ca!dxcx4Sbiar9Y9Pararcaca65cabdeMbiaBcaca9z!aearbicZbicccx==8K6H8U4S878K8f7k876H6t8U8a4S8H7H8T6/6+7Q8A8n6C8w7d879M7eaMbr=*04ca8f9nbier=9Mbr94ca7Qbi6C9z8y9j7dbL8GdCd1bl9abA6Y9N9aaG9tbl848s72947Q6Y5dca6B6B9z8IbieMaF8nbi*02ararcw9YaC8I65657QfHfGcwblcabucabialar9YaMarft8gcacablbFeMca*029zbiarbudrbicabuhahabZfmalaChCbi7Q7Q8s767W6Ybl6i90*028NaF907Q908I6Y7H7QaQ7Q908Qdcdc97cd8h6MbY8t=6Y8p=6M654m4m5dccct8I=90=90jy9HbY9ofLaobi7Qhac5ftbllgfD8g6iccaMca7QcL9t==hQeocU99jkcEjy9Hbi6Y5i00*06ca90al8h9z8I88659Y76bi91ftbl8g6ibl90bl90bl90cZ9Sca90eparhrdcbp8mbi6Yar7Hbi7Qbi7Qbi7Qdz9xbu8Qbu8Qbu8IdM8QdM8Q65==bx9hbF8Nca90ca90bu8QeMaF4m=*03fEbi==bz6Y=*058g7a=*05ca7Q=*0b9Y76==9Y76bi7Qbi7Q=*29bi=*0e7Q=5d5dbS87=*0W8G=8G=8G=8G=8G=*03cs9ocs9ocs9ocs9ocs9o=*07fk8D8L7Mab8r7QfE7QfE5d3W2D7Q3W381j00*045d5d7Q7QfEfE547Q5d*037Q*055u5u5darfE3W!!00*0438fEkQ4p8E8E4p7M8E4U5d5dfE9s7Q5deZeZ5ueH5d2D5d5deAbPbL7E8s7K7K7Q5deZ7Q8W8veZ7Q8+bxadad5dgkad5d5d3u00*04!00*094I2C!!4I*0837375s4I*0c3737!4A434v4u43555g2N7I5d553p3k!*029Zbibi7Q7Qd1bif9iZfEbS817Qcaarht7Q9zcabi8Ibi8H8Iar7Q7Qa+cm7QbEar!*0f00*0w!*0ed1d1bigWbad1dT8CaCfi7+eafsca8I8IaM8Fb45TdtbifJbHbA9zcaevcrbi*02eSiPfEbiar7ac0cxb94S==eva69o619DaM9zhs6ma88Q738X56e6jn8A7k9Ycabpca9z9zarbi7Q6Y4m4ma+d1dQem7vlrbKbKfSbK*0b7b65bZhRhobihlndt5hpbihpngarbibieM4m8Gc+bT7QcagukOc57Qc3gn4m6Y8Id1gNbigNbi6YbKaMbigNbK7Q7Q!*03fE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b98W!!2D!*023W8B!*02b9fj!*08bf!4i!*0r8B!*0m8B8W!!8B8B!*2p",
			italic: "3W5d6A7Q7Qd1ca3m5d5d7Qaz3W5d3W4m7Q*095d5daz*027Qeo9z9zarbi9z9zbibi5d6Yar8Id1arbi9zbi9z7Q8Ibi9zd19z8I8I654m656C7Q5d7Q7Q6Y7Q6Y4m7Q7Q4m4m6Y4mbi7Q*0365654m7Q6Yar6Y6Y656g4j6g8t3W657Q*034j7Q5dbU4k7Qaz5dbU7Q6g8B4I4I5d908b3W5d4I4S7QbK*027Q=9z*04dV==9z*02=5d*02bi==bi*03azbi*04=9z7Q*06ar=6Y*03=4m*027Q*068B7Q*04=7Q=*0f9wbi7Q=*0jbi7Q=*084mbK7Q=*036Y=*045I8I538I4m=*0591aU7y=*05eMar=*0g5I8I4m=*0g8I=*044m7Qam9e7Q9e7Qarar6Ybicc9e7Q7h9zaT7L9z7Qbib1bR4m5dar6Y4m6Ncgar7Mbibi8metaAan7Q9z7Q659i4b4m8I4m8IbO8xbjaD917/8I658t8t6Y6Y7Q7e5/538a384p3V5dj+hndVfEd28IhoeNca=*0f6Y=*05bi7Q=*086Y=j+hndV==eP9l=*0v7Q=*029G67==aj7Q9A8s8I65=*0d4m7Q4m4mbMbO9zar7Q8I8I65657D6Q9zbi9s9z6Y6Y4mb47Q9z658I6Y6W7Q*026Y6Y7Q7Q6Y6Y9g6a668C7k4m7Q7Q7L7s797Q*024m4m4d4m*028Ebi*027Q7Q7X7Qaxb28u65*045D5D6Y7v654v4v3Y4v4m4m7Q887G6Yar6Y5V65656Y6Y6r*026Wbi6K7k7L804m6Y667Q6r6rbQcrbP8M709/bm8x81827x8o8o4s4s2B3u*024t653/3m6A5d*044g4gaz*035d*094m4m5d*0c5+4A283j4q4g5/*045d*038I5d*0d6d6d5d87648I855d5dbi8j!!5d6+*02=6Y!*035d5d9z5daDco6i!bi!akbm4m9z9z8V9b9z8Ibibi5dar9sd1ar9/bibi9z!9i8I8IbV9za/bj==8d6a7M4m7b8d7O6a7h6a6l7M7H4m7w6N7S6Y6I7Q7R7w6m7J5C7b8F6U9Jb2=*03aWa77O7H9YbT=86b28Obi7Qar6Y9z7f8573a+8acgbi9587c56R8u8u9I8caZ7L685j8O7X6+4mbi6j6j9z7Qard19o7war*029z9zct8Vat7Q5d5d6Yevepcvaobiaxbi9z9e9z8V9Y9zek7LbibiaoaBd1bi*029zar8IaxcA9zbiaNgjgjaAdE9eafg8ah7Q7T6O667W6Yey667Q7Q7k6Q9+7M7Q*026Ybi6Yb66Y7Q7tbPbP87aB776Vb17h=6Y7v5V6Q654m*02aDb87Q=*027QhM9Yazarf2ayaV8ufXcddo9YiAdR7L66a/9Jbi7Qau8H==hkdUce90hMcEhM9Yar6Y4n00*06bi7Q9e779z7Q6U4X8V669Y6Yekey7L66ao7kao7kao7kbK8fbi7MdA9KfVaPar6Yar6Y8Ibi8I7Q8I7Q9z6Ybi7QaN7taN7taN7QcK8ycK8y5d==ao7kaB6Qbi7Mbi7MaN7td19+4m=*03dVar==aT6Y=*057L6Y=*05bi7Q=*0b8V66==8V669z6Y9z6Y=*2p7Q=4m4maI7h=*0W8m=8m=8m=8m=8m=*03bO8xbO8xbO8xbO8xbO8x=*07cM8f8E7c9M7i7QfE7QdV4F3u2l7Q3W381j00*045d5d7Q7QdVfE4p7Q5d*038I*037Q7Q5u5u5Q9TdV3W!!00*0438fEkZ3r6x6A3q6w6A4U5d5dfE8Z7Q5deZeZ4UeH5d2D6565dkazbY7Q8b75757Q4GeZ7Q7Q8teZ7Q7Q8R9D9/5ddP9/5d5d3u00*04!00*094I2D!!4I*0837374X4I*0c3737!4A464u4s464r4p286x4r4q3j2E!*029Farar7Q7Qbiarfugvd1cj817Qar8IfE7Q9zbi9z7Qar7Q7Q8I7Q7Qabah7QbT9z!*0f00*0w!*0edYdlarfl9zd1dU7Rafe47+eafsbi7Q7QaM8Fb46xbHbieLbUbA8Ibievcrarar9zebgAfk9z9z6Yc0bDaW4d==eva69o619DaM8Ihs6m9g8L6s8356fehg8B6W92bib9ca8I8Iarbi7Q6Y4m4m9Xcac9dO66gsbKbKfabK*0b7a5d9XeFep9zeAjik5eQ9zeVjD8Iarbid14m8cc3bg6Yblfbj2bl6Ybkfb4m6Y7Qbihobihoar6+bs9XbihobK7Q7Q!*03fE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b9az!!2D!*023W8B!*02b9fj!*08bi!4i!*0r8B!*0m8Baz!!8B8B!*2p",
			boldItalic: "3W658H7Q7Qd1ca4m5d5d7Q8W3W5d3W4m7Q*095d5d8W*027Qd0ar*02biararbica657Qar9zdVbibi9zbiar8I9zbiardVar9z9z5d4m5d8W7Q5d7Q7Q6Y7Q6Y5d7Q8I4m4m7Q4mca8I7Q*0265654m8I6Yar7Q6Y655s3s5s8W3W657Q*033s7Q5dbH4a7Q9u5dbH7Q6g8B4I4I5d907Q3W5d4I4I7QbK*027Q=ar*04eM=ar*03=65*02bi*068Wbi*04=9z7Q*06bi=6Y*03=4m*027Q==7Q*038B7Q=8I*02=7Q=*0fbJbi7Q=*0jca8I=*084mcT8E=*037Q=*04899z5T9z4m=*05bfcg8t=*05eMbi=*0g8j9z4m=*0g9z=*045d7Qbb9X7Q9W7Qarar6Ybicd9W7Q80arbi7Zar7Qbib1cm4m65ar7Q4m6Yddbi8Bbibi8pfVblan7Q9z8I659H5I4m9z4m9zc79nbGb8ad7j9z658t8t7n7n7Q7D605M7V3s5q3U65kRhndVhndV8Ij6fEd2=*0f6Y=*05bi7Q=*087n=kRhndV==fnaO=*05bi=*0o8I=*029e6/==bD7Qaf8s9z65=*0d4m8I4m4mbsbvarar7Q9z9z65657Z7iarbiarar6Y7Q4mch7Qar659z6Y7i7Q*026Y6Y7Q7Q6Y6Y966q6q8z7a4m7Q*027B798I*024m4m4F4m*029mca*028I8I887Qatb3az65*046E677E7J655c5c4A5c4m4m8I8z7G6Yar6Y5Y65657n7n6s*027gbi7E7a7Q934m7Q6C7Q6s6sbHcYbI9s8aaecv9l84847x8I8I4w4w2X3i*024P634f4m8H5d*044i4i8W*035d*0o5+4Y2F3I5k4i5/*045d*037Q5d*0d6d6d5d916M9E8a5d5dcaa7!!5d6Y*02=7Q!*035d5dar5dc9d/7W!br!bKch4marar9s9Par9zcabX65arardVbiajbica9z!9H9z9zclarcwbG==8F6q8B4m7G8F806w806q6V8B874m8i6Y8I6Y717Q8y836+8r6Y7G997hasbj=*04b2808fbld9=93bQ8Sbi7Qar73ar7f8573b98addcab58IbI7f9e9eaV8Sc28j77618S8y6Y4mbi6K6K9z7QardVal83ar*04cO9sah8I65657QecfgcHaCcaaUcaar9Xar9saHarem7ZcacaaCaKdVcabica9zar9zaUdiarcabIhChCbUf99WabgwaN7Q7P6/5N7M6YeU668I8I7X81aJ8H7Q8I7Q6Yca6Ybc7Q8I8dd1d18faS796vbq83=6Y8b696v654m*02ajb98I=*028IhR8W9WarfGayas8QgkduemaFkCfn7Z66cwasbi7Qc88n==hndRd09gitcDhR8War6Y6R00*06ca8I9W799z7Q7m5N9s5NbD7WemeU7Z66aC7XaC7XaC7XcR8/ca8Hfz9RhFbYbj7Oar6Y9zca9z7Q9z7Qar7Qca8IbI8dbI8dbI8IdF8IdF8I65==aC7XaK81ca8Hca8HbI8ddVaJ4m=*03eMbi==bi6Y=*058t7n=*05bi7Q=*0b9s5N==9s5Nar7Qar7Q=*29ar=*0e7Q=5d5dbC80=*0W8p=8p=8p=8p=8p=*03c79nc79nc79nc79nc79n=*07er8k8S7vab797QfE7QfE5d3W2D7Q3W381j00*045d5d7Q7QfEfE5q7Q5d*037Q*055u5u5darfE3W!!00*0438fEkY4p8E8H4p8E8H4U5d5dfEaj7Q5deZeZ4UeH5d2D5d5de7bDca767Q*034IeZ7Q7Q8WeZ7Q7QbW7Q8Y58dk9/585d3u00*04!00*094I2G!!4I*0837375s4I*0c3737!4H4k4B5k4k5d4I2C7j5d4I3F2C!*029yarar7Q7Qcabif9hwdVbT817Qar9zih7Q9zbiar8Iar7Q8I9z7Q7Qa6bu7Qblar!*0f00*0w!*0edpdcbigjbad1et8Cabfs7+eafsca8I8IaM8Fb46HczbiejbHbA9zcaevcrbibiareSiJfEarar7nc0cxb94S=areva69o619DaMavhs6ma88Q738X56fnj08A7k9Ycabpca9z9zarbi7Q6Y4m4ma+d1dQdM7wkZbKbKf5bK*0b7b65bHhhgfargxkbl4gDargTj/9zarbidV4m8mcnbg6Ybifjjjcb7Qcbgb4m6Y7Qcagjbigjae6YaUaPbQhHbK7Q7Q!*03fE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b99u!!2D!*023W8B!*02b9fj!*08bf!4i!*0r8B!*0m8B8W!!8B8B!*2p"
		},
		{
			name: "Courier New",
			lineHeight: 1132.8125,
			descent: 300.29296875,
			regular: "9o*4X!*0e9o*2G~89o*09~8*0d9o*27!*059o*06!*069o*0j!*03=9o!*039o!*02=!*049o*06!9o!9o*0j!9o*0H!9o*0I!*049o*2000*069o*14~8=9o*0E~8*05=9o*2k!=9o*03~8*03=9o*1o~8*057QfE7QfE5d3W2D8G3d2D0U00*04!9o*04!9o*0b!*029o!*0200*04389o!9o*02!*039o9o!9o!9o!*049o!*0o9o3u00*04!00*09!*0e9o!*0f9o*04!*0a9o*0l~9*02!!~9~9!~9~9!*0f00*0w!*0j9o!*0c9o!!9o!*0a9o!*02=!*069o!*0z9o9o!*059o*03~8!*0L9o*05!*0h9o!*1o9o!*029o!*079o!9o9o!!9o!*029o9o!*029o9o!*089o!9o!*0r9o!*0m=9o!!9o9o!*2p",
			bold: "9o*4X!*0e9o*2G~a9o*09~a*0d9o*27!*059o*06!*069o*0j!*03=9o!*039o!*02=!*049o*06!9o!9o*0j!9o*0H!9o*0I!*049o*2000*069o*14~a=9o*0E~a*05=9o*2k!=9o*03~a*03=9o*1o~a*057QfE88fY5k3/2G8G3d2D0U00*04!9o*04!9o*0b!*029o!*0200*04389o!9o*02!*039o9o!9o!9o!*049o!*0o9o3u00*04!00*09!*0e9o!*0f9o*04!*0a9o*0l~b*02!!~b~b!~b~b!*0f00*0w!*0j9o!*0c9o!!9o!*0a9o!*02=!*069o!*0z9o9o!*059o*03~a!*0L9o*05!*0h9o!*1o9o!*029o!*079o!9o9o!!9o!*029o9o!*029o9o!*089o!9o!*0r9o!*0m=9o!!9o9o!*2p",
			italic: "9o*7R~c9o*09~c*0d9o*27!*059o*06!*069o*0j!*03=9o!*039o!*02=!*049o*06!9o!9o*0j!9o*0H!9o*2O00*069o*14~c=9o*0E~c*05=9o*2q~c*03=9o*1o~c*057QfE7QfE5d3W2D8G3d2D0U00*04!9o*04!9o*0b!*029o!*0200*04389o!9o*02!*039o9o!9o!9o!*049o!*0o9o3u00*04!00*09!*0e9o!*0f9o*04!*0a9o*0l~9*02!!~9~9!~9~9!*0f00*0w!*0j9o!*0c9o!!9o!*0a9o!*02=!*069o!*0z9o9o!*059o*03~c!*0L9o*05!!eV!*0e9o!*1o9o!*029o!*079o!9o9o!!9o!*029o9o!*029o9o!*089o!9o!*0r9o!*0m=9o!!9o9o!*2p",
			boldItalic: "9o*7R~d9o*09~d*0d9o*2k!*069o*0j!*03=9o!*039o!*02=!*049o*06!9o!9o*0j!9o*0H!9o*2O00*069o*14~d=9o*0E~d*05=9o*2q~d*03=9o*1o~d*057QfE88fY5k3/2G8G3d2D0U00*04!9o*04!9o*0b!*029o!*0200*04389o!9o*02!*039o9o!9o!9o!*049o!*0o9o3u00*04!00*09!*0e9o!*0f9o*04!*0a9o*0l~b*02!!~b~b!~b~b!*0f00*0w!*0j9o!*0c9o!!9o!*0a9o!*02=!*069o!*0z9o9o!*059o*03~d!*0L9o*05!*0h9o!*1o9o!*029o!*079o!9o9o!!9o!*029o9o!*029o9o!*089o!9o!*0r9o!*0m=9o!!9o9o!*2p"
		},
		{
			name: "Calibri Light",
			lineHeight: 1220.703125,
			descent: 268.5546875,
			regular: "3y565Y7O7Xb3au3m4H4H7O7O3R4O3R5G7X*0947477O*027fdY8P8n8n9v7F7c9P9H3Q4V7U6zdd9+ae7Yaq8k757z9Y8GdN7R7l7f4F5G4F7O7O4u7n886F887K4H7l883t3C6V3tcn888988885p6359886UaX6y6V6a4H754H7O3y567O7X7O7X7O7O5Yd26b7O7O4O7X6c5h7O5f5e4v8u943R4S3P6w7O9Nalal7f=8P*04bR==7F*02=3Q*029E==ae*037Oae=9Y*02=7Y80=7n*04c4==7K*02=3t*028888=89*037O89=88*02=88=*0f8F9E8u=*0jaf8d=*083t8J73=*036V=*043N8q5r6I3L=*058I9J88=*05dvdm=*0g5g7z5f=*0m3G8p9d8g888q8a8n8u6K9Eaq8g877I7F9F7j7c4H9S8uci4t4v7U6V4771dn9+8laeat8pbMa28P88827e6l755X597O597zaZ93ah8z7A7b7w6g7F7F6P6u7O7s6i6a7I3L6z8m56gEfIehb8a973eTdAbK=*0f7K=*05a37k=*03af=af==6P=gEfIeh==el8+=*0z7K75==9w9N8r867f6a=*0d549O5o3Cc2c29a8p6/6y7z6c5Q5S5O8la38N7F7P534u9N888u5y8f7g7n88*026I6F88887K7K9m77778y7Y4988887M6N6U88*02494c4A5t4d3t8ycn*0288898y86ayaD9N5p*044Y4Y7d7w633t4d3s3y594N8I8c6I6UaD6V6k6f6u6P6W5S5S6d6Uak7n7Y7+8h3M6V5m8c6060cvdccAaj8vaYcK999B978b88885D5C2I3P3Q415h7w4P3q5H3U3D3U5h5r4N4N6L6M6P6P67673Q6c4v4u3Q6c4u4v5M5M5h5B5k*035W3t4Z4T767c4N5l4Q2B4f4I3+7x*048C8C6P9I6p7Q*036i4u6W7c76476A*0364647f8M7n7z5Y3R3R9Y8j!!4y6I6F6F=4V!*033S7C8P=7F9H3Q!ae!7Faf4c8P8n6z8J7F7f9Hae3Q7U8Ndd9+7Iae9H7Y!757z7lbw7Rbfaf==8G778l4c8q8G8b6P87775i8l8c4c6V728u6R5P898r7N6t8d608q9N6taPaJ=*047U848E7V8w=9Nbp8Ra589706t7c6t6l768V91dncn8l7+8S7z7c6M8s84967x7v6L8s7R6F3Cak6/6+7Y888ncLa27X8n8p8p7F7F9G6I8E753Q3Q4Vdrdy9y8k9Y849D8P8g8n6I9Q7Fcf7l9Y9Y8k9pdd9Hae9F7Y8n7z84aH7R9S8AdldB9qbC878Fds8x7n8l7n5l8x7Kan6A8j8j6/7Rag8h8981886F626V9k6y8i7ab6bm8ca1786+b17d=7K8l=6/633t3t3CbxbQ8d=*0287cSaJ9J80cja68Z7UcBaLbh9/encJ7m6AbfaPae86927j==h7f2ae89cSaJcSaJ8g6p8C00*06ac8z9J807Y886M5r6Q5R896XcLaU7l6A8T7w8E7a8F759H889X8xb29pdJbtas8e8n6F7z627l6V7l6V8x6Ya+9j8Q7q8N7k8i88aN9gaN9g3Q==8k709F869H8h9X8x8A7adtaN3Q=*03bRc4==9F7K=*057F6P=*05ae86=*0b6M5l==6Q5R8x6Y896I=*2p7n=4H4H9v87=*0Vat8pat8pat8pat8pat8p=*03aZ93aZ93aZ93aZ93aZ93=*079j6m8l7k846V7QfE7Oe94K3y2m8r3p1i1Z00*044O4O7X7Oe9e97E7O3R*036p*026q7O*02!*02aD!*0200*043yg1!3q5H7Y!*02675g5g!8W7o7O!*0456!*0o4c3u00*04!00*09642D!!5w585B4+5A5B5N5H5y3m3m5B643P5f5e5w585B4+5A5B5N5H5y3m3m!595g5C4I5g!*0a8E9d8+7l7Wcnb7gPdjeHbl7G7X857zfVaE8WaK9y8Y8M~0~082717X9Xaf7Xa99a!*0f00*0w!*0jbV!*0c7F!!fRd2!*07aV!aV!*02=!*06bz!*027c!*0pb85G!*03apb6apb6aZb69Yawa9aJaJ9O5D!*0y8n6I!*0ae9*03jYcee9*03!*0dce!*1o8i!*028J!*07cF!8o7O!!56!*023R7O!*02dtbq!*08b3!5E!*0r7O!*0m=7O!!7O7O!*2p",
			bold: "3y5q6g868fbnaO3G4/4/86864956495+8f*094r4r86*027zeg978H8H9P7Z7wa79/485d8c6Tdxaiay8gaK8E7p7Tag8+e5897F7z4Z5+4Z86864O7H8s6Z8s824/7F8s3N3W7d3NcH8s8t8s8s5J6n5t8s7cbf6S7d6u4/7p4/863y5q868f868f86866gdm6v8686568f6w5B865z5y4P8O9o495a476Q86a5aFaF7z=97*04c9==7Z*02=48*029Y==ay*0386ay=ag*02=8g8k=7H*04co==82*02=3N*028s8s=8t*03868t=8s*02=8s=*0f8Z9Y8O=*0jaz8x=*083N917n=*037d=*04458K5L7043=*0590a18s=*05dPdG=*0g5A7T5z=*0m3+8J9x8A8s8K8u8H8O729YaK8A8r807Z9Z7D7w4/aa8OcC4N4P8c7d4r7ldHai8FayaN8Jc4am978s8m7y6F7p6f5t865t7Tbh9naB8T7U7v7Q6A7Z7Z776O867M6C6u80436T8G5qgYg0eBbsat7nfbdUc2=*0f82=*05an7E=*03az=az==77=gYg0eB==eF9i=*0z827p==9Qa58L8q7z6u=*0d5oa65I3Wcmcm9u8J7j6S7T6w686a668Fan957Z875n4Oa58s8O5S8z7A7H8s*02706Z8s8s82829G7r7r8S8g4t8s8s84757c8s*024t4w4U5N4x3N8ScH*028s8t8S8qaSaXa55J*045g5g7x7Q6n3N4x3M3S5t55908w707caX7d6E6z6O777e6a6a6x7caE7H8g8i8B447d5G8w6k6kcPdwcUaD8Pbgd29t9V9r8v8s8s5X5W3047484l5B7Q573K5/4c3X4c5B5L5555737477776r6r486w4P4O486w4O4P64645B5V5E*036e3N5h5b7q7w555F582V4z504i7R*048W8W77a06J88*036C4O7e7w7q4r6U*036o6o7z947H7T6g4949ag8D!!4S706Z6Z=5d!*034a7W97=7Z9/48!ay!7Zaz4w978H6T917Z7z9/ay488c95dxai80ay9/8g!7p7T7FbQ89bzaz==8+7r8F4w8K8+8v778r7r5C8F8w4w7d7m8O79678t8L856N8x6k8Ka56Nb7b1=*048c8o8Y8d8Q=a5bJ99ap8t7k6N7w6N6F7q9d9ldHcH8F8i9a7T7w748M8o9q7R7P738M896Z3WaE7j7i8g8s8Hd3am8f8H8J8J7Z7Z9+708Y7p48485ddLdS9S8Eag8o9X978A8H70a87Zcz7Fagag8E9Jdx9/ay9Z8g8H7T8oa/89aa8UdFdV9KbW8r8ZdM8R7H8F7H5F8R82aH6U8D8D7j89aA8B8t8l8s6Z6m7d9E6S8C7ubqbG8wal7s7ibl7x=828F=7j6n3N3N3WbRc88x=*028rdab1a18kcDaq9h8ccVb3bBajeHd17G6Ubzb7ay8q9m7D==hrfmay8tdab1dab18A6J8W00*06aw8Ta18k8g8s745L78698t7fd3bc7F6U9b7Q8Y7u8Z7p9/8saf8Rbm9Je1bNaM8y8H6Z7T6m7F7d7F7d8R7gbi9D987K957E8C8sb59Ab59A48==8E7k9Z8q9/8Baf8R8U7udNb548=*03c9co==9Z82=*057Z77=*05ay8q=*0b745F==78698R7g8t70=*2p7H=4/4/9P8r=*0VaN8JaN8JaN8JaN8JaN8J=*03bh9nbh9nbh9nbh9nbh9n=*079D6G8F7E8o7d7QfE86et4R3D2q8r3p1i1Z00*0456568f86etet7Y8649*036J*026K86*02!*02aX!*0200*043ygl!3K5/8g!*026r5A5A!9e7I86!*045q!*0o4w3u00*04!00*096o2X!!5Q5s5V5i5U5V655/5S3G3G5V6o475z5y5Q5s5V5i5U5V655/5S3G3G!5t5A5W505A!*0a8Y9x9i7F8ecHbrh7dDe/bF7+8f8p7TgdaY9eb29S9g94~1~18m7l8fafaz8fat9u!*0f00*0w!*0jcd!*0c7Z!!g9dm!*07bd!bd!*02=!*06bT!*027w!*0pbs5+!*03aJbqaJbqbhbqagaQatb1b1a65X!*0y8H70!*0aet*03kgcyet*03!*0dcy!*1o8C!*0291!*07cZ!8I86!!5q!*024986!*02dNbK!*08bn!5Y!*0r86!*0m=86!!8686!*2p",
			italic: "3y565Y7O7Xb3au3m4H4H7O7O3R4O3R5G7X*0947477O*027fdY8P8n8d9v7F7c9P9H3Q4V7U6zdd9+a77Yah8k6Z7z9Y8GdN7R7l7f4F5G4F7O7O4u7X7X6y7X7m4H7X7X3t3C6V3tcg7X7W7X7X5i63597X6NaX6y6P6a4H754H7O3y567O7X7O7X7O7O5Yd26F7O7O4O7X6c5h7O5f5e4v8i943R4S3P6w7O9Nalal7f=8P*04bR==7F*02=3Q*029E==a7*037Oa7=9Y*02=7Y80=7X*04bK==7m*02=3t*0288==7W*037O89=7X*02=7X=*0f8p9E8u=*0jaf80=*083t8J73=*036V=*043N8q5r6I3L=*058v9J7X=*05dvcJ=*0g5g7z5f=*0m3G8b9d8g7W8q7Z8p8u6C9Eaq8g7X7I7F9F7j7c4H9S8uci4t4v7U6V4771dn9+89a7ak7/bMa28P7X827e6m755X597O597zaZ8Jah8z7A7b7w6g7F7F6P6u7O7s6i6a7I3L6z8m56gEfIe5b8a973eTdAbx=*0f7K=*05a383=*086P=gEfIe5==el8+=*0z7K75==9w9B8r867f6a=*0d549O5o3Ccpcp9a8d6/6y7z6c5Q5S5O8la38N7F7m534u9N7W8u5y8f7g7n7X7X886x6F7X7X7o7o9577778y7Y497W7X7M6N6U7X*02494c4A5t4d3t8ycg*027X7Z8t7XaraD9N5i5h5h5i5i4Y4Y7d7w633t4d3s3y594N8w8c6I6UaD6V6k6f6u6P6W5S5S6d6Uaa7n7Y7+883M6V5m806060c4d0cfak8vaYcw9a9B978b88885u5C2I3L3Q415h7w4P3q5H3U3D3U5h5r4N4N6L6M6P6P67673Q6c4v4u3Q6c4u4v5M5M5h5B5k*035W3t4Z4T767c4N5l4Q2B4f4I3+7x*048C8C6P9I6p7Q*036i4u6W7c76476A*0364647f8M7n7z5Y3R3R9Y8j!!4y6x6y6x=4V!*033S7C8P=7F9H3Q!a7!7Faf4c8P8n6z8J7F7f9Ha73Q7U8Ndd9+7Ia79H7Y!757z7lbx7Rbfaf==8G77894c8q8G886P87775i898E4c6V728i6R5P7W8r7N6t8d608q9R6taPaJ=*047U888E7V8w=9Nbp8Ra57Y706t7c6t6l768V91dncf8l7X8S7z7c6M8s84967x7v6L8s7R6y3Ca76/6+7Y7X8dcLa27X8p8d8p7F7F9G6I8E6Z3Q3Q4Vdrdy9y8k9Y849D8P8g8n6I9Q7Fcf7l9Y9Y8k9pdd9Ha79F7Y8d7z84aH7R9S8AdldB9qbC878Fds8x7X8l7n6m897mbX6A7X7X6/7Rag887W7X7X6ycg6PaN6y8c7ab+cg8ca1746+b07d=7m8h=6/633t3t3CbxbQ80=*027XcSaJ9J80cja68Z7UcBaLbh9/encI7m6AbfaPa77X917j==gTeta77WcSaJcSaJ8g6y8C00*06ad8c9J807Y7X6M5r6Q5R896XcLbH7l6A8T7w8E7a8F759H889X8xb29pdJbtas8e8p6y7zcv7l6V7l6V8x6Ya+9j8Q7q8N7a8i7XaN8UaN8U3Q==8k709F869H889X8x8A7adtaN3Q=*03bRbK==9F7o=*057F6P=*05a77X=*0b6M6m==6Q5R8x6Y896I=*2p7X=4H4H9v87=*0Vak7/ak7/ak7/ak7/ak7/=*03aZ8JaZ8JaZ8JaZ8JaZ8J=*079j6m8l7k846P7QfE7Oe94K3y2m8r3p1i1Z00*044O4O7X7Oe9e97E7O3R*036p*026q7O*02!*02aD!*0200*043yg1!3q5H7Y!*02675g5g!8W7o7O!*0456!*0o4c3u00*04!00*09642D!!5w585B4+5A5B5N5H5y3m3m5v643P5f5e5w585B4+5A5B5N5H5y3m3m!5u515t4I57!*0a8E9d8+7l7Wcgb3gPdjeHbl7G7X857zfVaE8WaK9y8Y8M~2~282717X9Xaf7Xa99a!*0f00*0w!*0jbJ!*0c7F!!fPd2!*07aV!aV!*02=!*06bz!*027c!*0pb85G!*03apb6apb6aZb69Yawa9aJaJ9O5D!*0y8p6x!*0ae9*03jYcee9*03!*0dce!*1o8i!*028J!*07cF!8o7O!!56!*023R7O!*02dtbq!*08b3!5E!*0r7O!*0m=7O!!7O7O!*2p",
			boldItalic: "3y5q6g868fbnaO3G4/4/86864956495+8f*094r4r86*027zeg978H8x9P7Z7wa79/485d8c6Tdxaiar8gaB8E7h7Tag8+e5897F7z4Z5+4Z86864O8f8f6S8f7G4/8f8f3N3W7d3NcA8f8e8f8f5C6n5t8f75bf6S776u4/7p4/863y5q868f868f86866gdm6Z8686568f6w5B865z5y4P8C9o495a476Q86a5aFaF7z=97*04c9==7Z*02=48*029Y==ar*0386ar=ag*02=8g8k=8f*04c2==7G*02=3N*028s==8e*03868t=8f*02=8f=*0f8J9Y8O=*0jaz8k=*083N917n=*037d=*04458K5L7043=*058Pa18f=*05dPd1=*0g5A7T5z=*0m3+8v9x8A8e8K8h8J8O6W9YaK8A8f807Z9Z7D7w4/aa8OcC4N4P8c7d4r7ldHai8taraE8jc4am978f8m7y6G7p6f5t865t7Tbh91aB8T7U7v7Q6A7Z7Z776O867M6C6u80436T8G5qgYg0epbsat7nfbdUbR=*0f82=*05an8n=*0877=gYg0ep==eF9i=*0z827p==9Q9V8L8q7z6u=*0d5oa65I3WcJcJ9u8x7j6S7T6w686a668Fan957Z7G5n4Oa58e8O5S8z7A7H8f8f8s6R6Z8f8f7I7I9p7r7r8S8g4t8e8f84757c8f*024t4w4U5N4x3N8ScA*028f8h8N8faLaXa55C5B5B5C5C5g5g7x7Q6n3N4x3M3S5t558Q8w707caX7d6E6z6O777e6a6a6x7cau7H8g8i8s447d5G8k6k6kcodkczaE8PbgcQ9u9V9r8v8s8s5O5W3043484l5B7Q573K5/4c3X4c5B5L5555737477776r6r486w4P4O486w4O4P64645B5V5E*036e3N5h5b7q7w555F582V4z504i7R*048W8W77a06J88*036C4O7e7w7q4r6U*036o6o7z947H7T6g4949ag8D!!4S6R6S6R=5d!*034a7W97=7Z9/48!ar!7Zaz4w978H6T917Z7z9/ar488c95dxai80ar9/8g!7p7T7FbR89bzaz==8+7r8t4w8K8+8s778r7r5C8t8Y4w7d7m8C79678e8L856N8x6k8Ka96Nb7b1=*048c8s8Y8d8Q=a5bJ99ap8g7k6N7w6N6F7q9d9ldHcz8F8f9a7T7w748M8o9q7R7P738M896S3War7j7i8g8f8xd3am8f8J8x8J7Z7Z9+708Y7h48485ddLdS9S8Eag8o9X978A8H70a87Zcz7Fagag8E9Jdx9/ar9Z8g8x7T8oa/89aa8UdFdV9KbW8r8ZdM8R8f8F7H6G8t7Gcf6U8f8f7j89aA8s8e8f8f6ScA77b56S8w7ucicA8wal7o7ibk7x=7G8B=7j6n3N3N3WbRc88k=*028fdab1a18kcDaq9h8ccVb3bBajeHd07G6Ubzb7ar8f9l7D==hbeNar8edab1dab18A6S8W00*06ax8wa18k8g8f745L78698t7fd3b/7F6U9b7Q8Y7u8Z7p9/8saf8Rbm9Je1bNaM8y8J6S7TcP7F7d7F7d8R7gbi9D987K957u8C8fb59cb59c48==8E7k9Z8q9/8saf8R8U7udNb548=*03c9c2==9Z7I=*057Z77=*05ar8f=*0b746G==78698R7g8t70=*2p8f=4/4/9P8r=*0VaE8jaE8jaE8jaE8jaE8j=*03bh91bh91bh91bh91bh91=*079D6G8F7E8o777QfE86et4R3D2q8r3p1i1Z00*0456568f86etet7Y8649*036J*026K86*02!*02aX!*0200*043ygl!3K5/8g!*026r5A5A!9e7I86!*045q!*0o4w3u00*04!00*096o2X!!5Q5s5V5i5U5V655/5S3G3G5P6o475z5y5Q5s5V5i5U5V655/5S3G3G!5O5l5N505r!*0a8Y9x9i7F8ecAbnh7dDe/bF7+8f8p7TgdaY9eb29S9g94~3~38m7l8fafaz8fat9u!*0f00*0w!*0jc1!*0c7Z!!g7dm!*07bd!bd!*02=!*06bT!*027w!*0pbs5+!*03aJbqaJbqbhbqagaQatb1b1a65X!*0y8J6R!*0aet*03kgcyet*03!*0dcy!*1o8C!*0291!*07cZ!8I86!!5q!*024986!*02dNbK!*08bn!5Y!*0r86!*0m=86!!8686!*2p"
		},
		{
			name: "Aptos",
			lineHeight: 1220.703125,
			descent: 281.73828125,
			regular: "3b4B5O8p8mcWa33i4B4B798m4u5k4u5j8m*094u4u8m*027Rd/9d9saQaK8I8cb4b3445b8U7Qcmb2bs91bs9u8S7vaF99dY8F8s844C5j4C8m7c8E8j8N8d8N8f4J7A8D3L3L7D44dl8D8E8N8N5e7C538L74bh6W746S4C4e4C8m3b4v8m*034e7m8EbJ6J6w8m5k7k8E5J8m5k5k8E8P8M4u8E5k6/6wb5bVcb7R=9d*04eB==8I*02=44*02aK==bs*038mbs=aF*02=918t=8j*04dd==8f*02=3L*028E==8E*038m8E=8L*02=8N=*0gaK8N=*0jb38D=*083L9g7u=*037D=*057Q4t7Q44=*059ob28D=*05gAdZ=*0h7v53=*0m4g~8aR~8*03aQ~8~8aKc7~8*028Jb68X8c4J~889~8*028U7D~8*05b/8L~8*0cbO9m~8aF8J8O~8~88P~8*0A8f~8*07==~8~8==~8*0b=*07~8*0n=*03~8*0l==~8*023L~8*0n~0*028N8d~08N8+~08f~07M~0*067d~0*0u3/~0*068Y~0*057A~0*0O8E8E~0*0f8E*05!*03~0*0t6v5B8C7Q3N3Nb28/!!5t8d*024e5b!*038E8E9d4v8Ib344!bs!8sbu459d9s7g9e8I84b3bs448U99cmb28PbsaV91!7Q7v8sbu8Fb/bu==8Q7M8D458R8Q8y748E7M6w8D8B457D748P746v8E988N6I946F8Rav7ca+cw=*048U8y8B8z*02av9896bs8E9r738c7a887F9q9He3dl9d8D9P8L907Z9e87aM8B8i6U968N8d3Lbs5+8d918NaQcmal8NaRaQaQ8I8Ibx7gaQ8S44445bfdeWbx8Ub28zaV9d9s9s7gar8Idx8Xb2b28Uagcmb3bsaV91aQ7v8zbu8Fbb9QeieAb2cn9saUeR9u8j8E7X5U8Y8fbj7D8/8/7D8jal8R8E8H8N8d6l74av6W8+8yd0dk97aq7I8dc87Q=8f8D=8d7C3L*02bxc38D=*028Hevbhaj7IevbTaf7RdYbebDa3fndm8w7ib/a+bs8E9y7Q==hBf1bx8SevbhevbhaG889o00*06bk9c9z7S918N7g5U7g5Z9P8bedbP8X7D9A8c8U7J8U7DaA9qbl98cKaCg0cSbm91aQ8d7v6l8s748s749c7mcWa6a68R9Q8y9Q8Dd99xd99x44==9A8say8wb38Rbk929Q8ycBay44=*03eBdd==b68f=*058P7A=*05bs8E=*0b7g5U==7v5U8D758F6W~8*1x==~8*0r=*05~8*0nat~8=*0Vb/8Lb/8Lb/8Lb/8Lb/8L=*03bO9mbO9mbO9mbO9mbO9m=*07~8*057QfE8IfE5d3W2D8I4m381j00*04!5k~07ceoeo~07c4e*03747575~077777m!*02cO!*0200*0438i1!3j5D~0!*033N3N!8g827c!*042f!*0o~03u00*04!00*095k!*025k*05!*046Z5k*09!*0l8R8v*028maa8U8mgjdZc38v8m8G8vhnbk8v9s8C928v8vbB8m*02d1ar8m8C8m8m!*0e00*0w!*0jdI!*0c9m!!hgbJ!*078/!8d!*02=!*06cT!*03jR!*0ubNcSbGcS*02bGcSbNcScSbx~8!*0L9o*03e48l9o*03!*0d8l!*1o8E!*029e!*07aV!7Q8m!!5j!*027MaL!*02br8W!*088W!6c!*098m!*0g8m!*0m=8m!!8m8m!*2p",
			bold: "3b4B6A8p8md9aB3E4B4B798m4I5k4I638m*094I4I8m*0286e49I9Hb3b38Z8pbebp4C5L9L80cRbjbx9tbx9W9m7VaU9FeI9n9a8z5h635h8m7c8E8E9a8B9a8I5f7/934c4c8m4EdV938Z9a9a5N845z967KbV7L7K7i5h4e5h8m3b4I8m*034e7P8EbJ6+6Z8m5k778E5W8m5C5C8E999H4I8E5C7h6ZbVcocG86=9I*04f1==8Z*02=4C*02b3==bx*038mbx=aU*02=9t8O=8E*04dE==8I*02=4c*028Z==8Z*038m8Z=96*02=9a=*0gb39a=*0jbp93=*084cal8o=*038m=*05805Q804E=*05arbj93=*05gjeb=*0h7V5z=*0m4N~abF~a*03b3~a~ab3d1~a*028Zbr9b8p5f~a8+~a*029L8m~a*05cw9p~a*0ccEaj~aaU9c9c~a~a98~a*0A8I~a*07==~a~a==~a*0b=*07~a*0n=*03~a*0l==~a*024c~a*0n~1*029a8B~19a9w~18I~18b~1*068a~1*0u4E~1*069g~1*057X~1*0O8E8E~1*0f8E*05!*03~1*0t6O6a9+8u4a4abj9s!!7J8B*024G5L!*038E8E9I=8Zbp4C!bx!9abE4E9I9H7B9O8Z8zbpbx4C9L9FcRbj9abxbf9t!8g7V9acr9nd3bE==9j8b934E9a9j8W7K8Z8b7793964E8m7K997K728Z9r9a7h9n6X9abr7Zc2dj=*049L8W969k*02br9r9Nbx8Z9W7H8p7K8A8p9A9Qf0dV9W8/au969w8v9O8Rb68Q9L8a9N9a8B4cbx6r8B9t9ab3cRb59ab3*028Z8Zc87Bb39m4C4C5LfEf9c89Lbj9mbf9I9H9H7Bbs8ZeG9bbjbj9LaVcRbpbxbf9tb37V9mcr9nbRaufefPbpde9Hb7fs9V8E8/8l679Y8Ich869s9s8m8Kb59h8Z979a8B707Kbr7L9K8Xdre29sbl858BcL8n=8I93=8B844c*02bZcw93=*0297f5ceaO85facxb28PfacCcNaXhceH8T7Gd3c2bx8Z9N8e==imfYbM9Ff5cef5ceaX8y9o00*06bV9/a08m9t9a7B677B6mat8FfecS9b86ai919L8E9L8mbpa9b/9Ud2aZgvdobH9kb38B7V709a7K9a7Ka18fdvaDb49xau8Xau93dOamdOam4C==ar94bx9ibp9hc09Rau8XdlbF4C=*03f1dE==br8I=*05987X=*05bx8Z=*0b7B67==7H679d7L9n7L~a*1x==~a*0r=*05~a*0nbo~a=*0Vcw9pcw9pcw9pcw9pcw9p=*03cEajcEajcEajcEajcEaj=*07~a*057QfE8IfE5d3W2D8I4m381k00*04!5k~17ceoeo~17c4G*03878888~17I7I7E!*02di!*0200*0438ix!3E6k~1!*033Y3Y!8F8G7c!*0427!*0o~13u00*04!00*095C!*025C*05!*047m5C*09!*0l9J8M*028ma39p8mheeJdp8M8m948MiZcD8M9s969a8M8Mct8m*02d9at8m968m8m!*0e00*0w!*0jdF!*0c9h!!hQbJ!*079f!8t!*02=!*06cT!*03mc!*0ucldjcidj*02cidjcldjdjc7~a!*0L9o*03e48n9o*03!*0d8n!*1o8Z!*029O!*07bf!8g8m!!63!*028jb4!*02bZ8W!*088W!6q!*098m!*0g8m!*0m=8m!!8m8m!*2p",
			italic: "3b4B5D8p8mdGak364B4B5Z8m4e5k4v5j8m*094v4e8m*027RdV9d9yaVaJ8I8vb4b3445b8N7Pcmb2bs9fbs9u8S7vaF98dZ8F8s7Z4A5j4x8m7c8E8k8N8i8N8i4w7A8D3D3D7E44dm8D8E8N8M5d7B4V8D74bh6W746S4/4e4/8m3b4B8m*034e7p8EbJ6J698m5k7t8E5J8m5k5k8E8P8I4v8E5k6/69bucBdk7R=9d*04dV==8I*02=44*02aJ==bs*038mbs=aF*02=9e8G=8k*04de=8i*033K*038E==8E*038m8E=8D*02=8N=*0gaJ8N=*0jb38D=3K=3K=3K=3K=3K9f7e=3J==7E=*05874t7P44=*059ob38D=*05gBdY=*0h7v4V=*0m43~caY~c*03aV~c~caJc5~c*028Jb38S8w4w~c84~c*028N7E~c*05bN8S~c*0cbO9p~caE8H8O~c~c8U~c*0A8j~c*07==~c~c==~c*0b=*07~c*0n=*03~c*0l==~c*023J~c*0n~2*028N8j~28N8+~28j~282~2*067d~2*0u3/~2*068Y~2*057J~2*0O8E8E~2*0f8E*05!*03~2*0t6v5w8B7B3N3Nb290!!9o8c8i8c=5b!*038E8E9d=8Ib344!bs!8sbr439d9y7v8Y8I7Zb3bs448N99cmb28PbsaV9f!7J7v8sbR8Fb/br==8P828D438Q8P8E748H826J8D8B437F748P746v8E8/8O6E946r8Qav7ca+ct=*048N8E8B8z*02av8/90bs8E9n718v74887F9q9He4dn9o8L9Q8K97858Y88aF8z8h6K908N8i3Dbs618c9e8NaVcmal8OaV*028I8Ibz7vaV8S44445bfbf4by8Nb28raV9d9t9y7var8Idi8Ub2b28Nahcmb3bsaV9faV7v8rbR8Fbb9QeheAbdcn9vaSf09B8k8F7W5J8Z8ibm7D8D8D7E8kal8R8E8I8N8idm74av6W908ydndI96al7H8eci7C=8i8D=8i7B3D3K3Dbzc48D=*028De+bhak7IeBbY9U7RdXbebxa6f7du8E7pb/a+bs8E9y7Q==hyf1bs8Ee+bhe+bhaC8e9o00*06bm8P9v7O9f8N7v5r7v5I9t8ae9bV8U7D9t8b8N7E8N7Eav9mbb98cMayg1cRbn90aV8i7v6d8s748s749c7pcVad9W8U9Q8y9Q8Dd99zd99z44==9A8say8wb38Rbh929Q8ycAay44=*03dVde==b38j=*058U7J=*05bs8E=*0b7v5J==7v5N8F748F6W~c*1x==~c*0r=*05~c*0nay~c=*088l=8l=*0i8j=*028j=*043K=*0fbN8SbN8SbN8SbN8SbN8S=*03bO9pbO9pbO9pbO9pbO9p=*07~c*057QfE8IfE5d3W2D8I4m381j00*04!5k~27ceoeo~27c4e*03747475~26R6R7m!*02df!*0200*0438iU!365D~2!*033q3q!8g837c!*042z!*0o~23u00*04!00*095k!*025k*05!*046+5k*09!*0l8R8v*028maa8H8mgidZc38v8m8v8vhibg8v9s8C8v*02bO8m*02dQaa8m8C8m8m!*0e00*0w!*0jdH!*0c9o!!hgbJ!*078+!8g!*02=!*06cT!*03iN!*0uczdbcDdb*02codbc4dbdbbX~c!*0L9o*03e48l9o*03!*0d8l!*1o8E!*028Y!*07aV!8P8m!!5j!*027MaW!*02br8W!*088W!4F!*098m!*0g8m!*0m=8m!!8m8m!*2p",
			boldItalic: "3b4B6k8p8mefaR3n4B4B6J8m4G5k4I638m*094I4G8m*0284e19I9Qb8b38Z8Ibebp4C5K9z80cRbjbx9Ibx9W9m7WaU9EeJ9n9a8s5a63518m7c8E8J9b8H9b8N557/934a4a8j4EdV938Z9b995K845p947KbV7L7K7i5q4e5q8m3b4B8m*034e7Y8EbJ6+6w8m5k7g8E5W8m5C5C8E9a9u4I8E5C7g6wcodge284=9I*04eh==8Z*02=4C*02b3==bx*038mbx=aU*02=9H90=8J*04dy==8N*024c*038Z==8Z*038m8Z=94*02=9b=*0gb39b=*0jbp92=4c=4c=4c=4c=4cal8k=4c==8k=*058j5Q804E=*05arbj93=*05gjea=*0h7W5p=*0m4C~dbP~d*03b7~d~db3d1~d*028Zbp9f8I55~d8Y~d*029z8j~d*05ca9k~d*0ccEar~daU999c~d~d9d~d*0A8O~d*07==~d~d==~d*0b=*07~d*0n=*03~d*0l==~d*024c~d*0n~3*02998H~39b9w~38O~38p~3*068a~3*0u4E~3*069g~3*0583~3*0O8E8E~3*0f8E*05!*05~3*0r6O5/9+8g4a4abj9s!!9o8B8I8B=5K!*038E8E9I=8Zbp4C!bx!9abJ4E9I9Q7I9C8Z8sbpbx4C9z9FcRbj9abxbf9I!887W9acS9nd2bJ==9d8p934E9a9d8Y7K958p7e93964E8k7K9a7K728Z9h9d7f9n6L9abs7Zc1di=*049z8Y969k*02bs9h9Qbx8Z9R7F8I7z8D8r9A9Qf2dWa795au969C8s9C8Qb48S9M7R9Q9a8H4abx6t8B9H9bb8cRb69db7b8b78Z8Zca7Ib79m4C4C5Kfufgc89zbj9jbf9I9M9Q7Ibt8Zei9cbjbj9zaWcRbpbxbf9Ib87W9jcS9nbRaufdfPbwde9Mb5fB9Y8J8/8l659Y8Ncc8194948k8Mb69i8Z989b8HdV7Kbs7L9Q8XdWeB9Bbp878EcW89=8N92=8H844a4c4ac6cF93=*0294fhcfaJ86ffcDaV8Of8cDcDaSgOe+917Ud2c1bx8Z9N8e==ikfYbx8+fhcffhcfaT8E9o00*06c79B9M8t9I9b7I5U7I63a68Gfid09c81ak979z8k9z8jbna2bR9Udaa+gxdpbH9mb88H7W719a7K9a7Ka18idvaFaV9Eau8Xau93dOaodOao4C==ar96bv9ibp9ica9Rau8XdCbG4C=*03ehdy==bp8O=*059d83=*05bx8Z=*0b7I65==7H649f7H9n7L~d*1x==~d*0r=*05~d*0nbq~d=*088K=8K=*0i8O=*028O=*044c=*0fca9kca9kca9kca9kca9k=*03cEarcEarcEarcEarcEar=*07~d*057QfE8IfE5d3W2D8I4m381k00*04!5k~37ceoeo~37c4G*03878788~37q7q7E!*02ds!*0200*0438jJ!3n6l~3!*033v3v!8u8H7c!*042I!*0o~33u00*04!00*095C!*025C*05!*047n5C*09!*0l9J8M*028ma39k8mheeJdp8M8m8M8MiYcz8M9s968M*02cF8m*02dVaa8m968m8m!*0e00*0w!*0jdH!*0c9o!!hPbJ!*079b!8B!*02=!*06cT!*03kS!*0ud9dUdmdU*02dhdUdadUdUd2~d!*0L9o*03e48n9o*03!*0d8n!*1o8Z!*029C!*07bf!988m!!63!*028jbh!*02bZ8W!*088W!55!*098m!*0g8m!*0m=8m!!8m8m!*2p"
		},
		{
			name: "Aptos Narrow",
			lineHeight: 1220.703125,
			descent: 281.73828125,
			regular: "2X565j7O7XbV9c304M4M7O7X444O444V7X*0944447X*0277cC8m8F9V9P7Z7wa6a63P4N8a79bia5ar8har8H876Q9J8jcJ7V7J7m4f4V4f7X6w7P7D827v827B4m727X3w3w703Pcg7X7V82824R6X4E7+6uag6m6u6f4f7e4f7X2X567X7X7O7X7e6J7PaC6o5X7X4O6F7P5J7X59597W8484457P596z5XaKbwbI77=8m*04dh==7Z*02=3P*029P==ar*037Xar=9J*02=8h7N=7D*04c2==7B*02=3w*027U==7V*037X7V=7+*02=82=*0g9P82=*0ja67X=*083w8A70=*0370=*057a4p793P=*058ra57X=*05f2cF=*0h6Q4E=*0m3W~89X~8*039W~8~89Pb5~8*027Za7897t4m~87s~8*028a70~8*05aV83~8*0caM8C~89J7X7/~8~883~8*0A7B~8*07==~8~8==~8*0b=*07~8*0n=*03~8*0l==~8*023w~8*0n~0*02827x~0828c~07B~075~0*066E~0*0u3H~0*068d~0*056T~0*0O7P7P~0*0f7P*05!*04~0*0s5Y5a7/793t3ta58h!!5b7x*023T4N!*037Q7Q8m=7Za63P!ar!7Jaq3P8m8F6F8s7Z7ma6ar3P8a8lbia585ar9Z8h!786Q7Jax7Vb1aq==85757X3P86857R6u7V755/7X7T3P706u846u5Z7V8j83698g63869F6Ca8bt=*048a7R7T7Q*029F8j8lar7V8D6u7w6A7t738x8NcUcd8t7W91818g7l8s7r9R7R7F6m8m837v3war5v7x8h829Vbi9w839W9V9W7Z7Zax6F9V873P3P4NdRdAax8aa57P9Z8m8E8F6F9z7Zcm89a5a58a9obia6ar9Z8h9V6Q7Pax7Vae91d5dma2bm8E9Ydz8H7D7V7g5q8c7Bal6+8h8h707D9y877V7+827v5S6u9F6m8f7TbUca8m9L747xb67c=7B7V=7v6X3w*02axb27X=*027+dgaj9u73dhaU9k7dcNamaD9ce8cg7M6Fb1a8ar7V8F77==g2dMaw89dgajdfaj9L7t8u00*06ai8q8K7d8h826F5q6F5w907wcZaO896+8L7w8a768a709S8Pal8pbA9HeBbLam8i9V7v6Q5Q7J6u7J6u8q6LbQ9d9g89917S917Xc08Tc08T3P==8P7N9D7Oa687ak8j917Tbu9J3P=*03dhc2==a77B=*05836T=*05ar7V=*0b6F5q==6Q5o7S6v8v6m~8*1x==~8*0r=*05~8*0n9D~8=*0VaV83aV83aV83aV83aV83=*03aM8CaM8CaM8CaM8CaM8C=*07~8*057QfE8IfE5d3W2D8I4m381j00*04!4O~06wd0d0~06w3T*036I*02~06v6v6H!*02co!*0200*0438gz!315a~0!*033s3s!8L7m6w!*0420!*0o~03u00*04!00*0959!*0259*05!*046s59*09!*0l857J*027X9i887XeTcIb47J7X7U7JfVaq7J8E7Q8g7J7LaE7X*02b/9u7X7S7X7X!*0e00*0w!*0jcs!*0c8u!!fQaC!*078a!7u!*02=!*06cU!*03ij!*0ub9cib9ci*02bbcibicicibb~8!*0L9o*03e48n9o*03!*0d8n!*1o7R!*028s!*079Z!787X!!4U!*02749R!*02ap7O!*087O!5Q!*097X!*0g7X!*0m=7O!!7X7X!*2p",
			bold: "2R565V7O7XbM9y3f4P4P7O7X4b4O4b5y7X*094b4b7X*027bb+8F8K9W9V837xa1ad4g5d8O7bbua6ai8wai8V8q729G8Bd88p8e7F4M5y4M7X6l7B7P8i7M8i7W4M7d8d3X3Y7y4fcC8d858i8i5g7b4/8d6ZaB6Y6Z6x4M7i4M7X2R567X7X7O7X7i6/7Baj6u6e7X4O6n7B5V7X5m5m868g8P4e7B5m6H6ebnc4ca7b=8F*04dm==83*02=4g*029V==ai*037Xai=9G*02=8w7U=7P*04cd==7W*02=3X*0281==85*037X85=8d*02=8i=*0g9V8i=*0jad8d=*083X9t7T=*037y=*057q5H7b4f=*059ca68d=*05ercD=*0h724/=*0m4i~aaw~a*039W~a~a9VbH~a*0282a98d7t4M~a84~a*028O7y~a*05b88z~a*0cbh9e~a9G8d8c~a~a8c~a*0A7W~a*07==~a~a==~a*0b=*07~a*0n=*03~a*0l==~a*023Y~a*0n~1*028i7M~18i8w~17W~17h~1*067k~1*0u4d~1*068o~1*0571~1*0O7B7B~1*0f7B*05!*04~1*0s685B977A3K3Ka68A!!7a7M*02=5d!*037B7B8F4b83ad4g!ai!8eaj4e8F8K6Q8O837Fadai4g8O8Dbua68gaia48w!7o728ebc8pbLaj==8n7h8d4e8g8n836Z857h6p8d8b4e7y6Z8g6Z6k858n8i6A8n6b8gan7caYbY=*048O838b8o*02an8n8Vai858T6Y7x6Z7M7G8s8Gdvcv8W889s8e8z7D8O7Y9Z7Y8R7o8X8i7M3Yai5Q7M8w8i9Wbua38i9W*028383aR6Q9W8q4g4g5ddYduaR8Oa68sa48F8H8K6Qah83d68ea6a68O9Nbuadaia48w9W728sbc8paA9sdGeaa8bV8H9YdQ8U7P857x5z8W7WaZ7h8A8A7y7Vab8p858h8i7M6k6Zan6Y8N85c3cz8Aax7o7Mbu7z=7W89=7M7b3X3X3YaNbm8d=*028hdva+9M7ndCbm9S7ZdEbrbo9Nfydg7U6PbLaYai858E7k==gnelav8Mdva+dva+9N7L8g00*06aB8Z8+7D8w8i6Q5z6Q5O9r7Sdxbw8e7h99858O7O8O7yas9maI8VbB9QeHc1as8A9W7M726j8e6Z8e6Z8W7pc89r9W8B9s7/9s8dck9xck9x4g==9q8dah8jad8paH8T9s85bTax4g=*03dmcd==a97W=*058c71=*05ai85=*0b6Q5z==6P5u8d6Y8Q6Y~a*1x==~a*0r=*05~a*0naf~a=*0Vb88zb88zb88zb88zb88z=*03bh9ebh9ebh9ebh9ebh9e=*07~a*057QfE8IfE5d3W2C8I4m381j00*04!4O~16lcFcF~16l4b*037A7B7B~16M*02!*02cL!*0200*0438gx!3g5I~1!*033y3y!977Q6l!*041R!*0o~13u00*04!00*095m!*025m*05!*046E5m*09!*0l8I7M*027X978x7Xfpd3c47L7X847Lh2bo7L8z858d7M7Tbd7X*02bN9g7X8c7X7X!*0e00*0w!*0jca!*0c8b!!g1aj!*078g!7A!*02=!*06cW!*03kj!*0ubucxbxcx*02bEcxbFcxcxbD~a!*0L9o*03e48o9o*03!*0d8o!*1o7Y!*028O!*07a4!7o7X!!5s!*027p9T!*02aC7O!*087O!5Q!*097X!*0g7X!*0m=7O!!7X7X!*2p",
			italic: "2X565a7O7Xcx9r2R4M4M7O7X3T4P454T7X*09453U7X*027acK8n8K9Y9N7X7La6a63P4N8276bha4ar8tar8F846R9J8icJ7V7J7f4c4U497X6w7P7B827z867B496V7W3n3n703Jcd7W7U82844Q6W4v7W6uag6m6u6f4z7e4A7X2X567O7X7O7X7O6T7PaB675B7X4P6P7P5J7X59597P8983457P596l5Cb8b/cH7a=8n*04co==7X*02=3P*029N==ar*037Xar=9J*02=8s7X=7B*04b/==7B*023A*037R==7U*037X7R=7W*02=82=*0g9N86=*0ja67W=3A=3A=3A=3A=3A8z6L=3z==70=*057i4m763J=*058Fa07W=*05e/cE=*0h6R4v=*0m3K~ca6~c*039Y~c~c9Nb8~c*027Sa5827K49~c7m~c*028170~c*05aF84~c*0caJ8D~c9I7V7/~c~c84~c*0A7z~c*07==~c~c==~c*0b=*07~c*0n=*03~c*0l==~c*023z~c*0n~2*027Z7A~2868a~27z~27j~2*066E~2*0u3H~2*0688~2*0571~2*0O7P7P~2!~2*0d7P*05!*04~2*0s5W527W6X3t3ta48l!!8u7y*023T4N!*037P7P8n=7Xa63P!ar!7Jan3I8n8K6R8a7X7fa6ar3P828kbha47Xar9Y8t!716R7JaP7Va/an==7/7j7W3I7/7/7R6u7U7j677W7Q3I716u896u5X7U8d81638f5S7/9E6Ba2bj=*04827R7Q*039E8d8jar7U8z6p7L6v7s728x8NcTce8z808+808j7o8a7q9L7P7F688f7Z7z3nar5v7y8s829Ybh9A819Y9Y9Z7X7Xay6R9Y843P3P4NdPdIax82a47K9Y8n8F8K6R9z7Xc383a4a4829mbha6ar9Y8t9Y6R7KaP7Vad90c/dlacbm8G9QdI8K7B7W7h5k8d7Bah6Z7W7W707I9A8b7U83827zcd6u9E6m8d7Tcdcu8s9D747ybk73=7B7T=7z6W3n3A3naAb47W=*027WdAaj9u74dka+937ccLamav98dVco7S6Qa/a2ar7T8F77==fZdBar7UdAajdAaj9I7v8u00*06am818G7a8t826R516R5g8F7xcYaX836Z8H7D827482709N8Mac8obB9HeCbMan8j9Y7z6R5O7J6u7J6u8k6QbN9i9587907V907Wc38Nc38N3P==8O7N9F7Oa58bao8j907Tbz9I3P=7C==cob/==a57z=*058471=*05ar7T=*0b6R5k==6P5k7U6u7V6m~c*1x==~c*0r=*05~c*0n9F~c=*087D=7D=*0i7D=*027D=*043A=*067V=*07aF84aF84aF84aF84aF84=*03aJ8DaJ8DaJ8DaJ8DaJ8D=*07~c*057QfE8IfE5d3W2D8I4m381j00*04!4P~26wd0d0~26w3T*036I*02~26k6f6H!*02ca!*0200*0438he!2V5e~2!*033536!8M7q6w!*042p!*0o~23u00*04!00*0959!*0259*05!*046m59*09!*0l857I7J7J7X9f7W7XeUcJbn7J7X7I7JfTal7I8y7Q7J7J7LaM7X*02cL9e7X7Q7X7X!*0e00*0w!*0jcp!*0c8v!!fEaN!*0789!7w!*02=!*06cT!*03hg!*0ubUcHbScH*02bRcHbKcHcHbF~c!*0L9o*03e48l9o*03!*0d8l!*1o7R!*028a!*079V!807X!!4U!*02749V!*02ax7P!*087O!4G!*097X!*0g7X!*0m=7O!!7X7X!*2p",
			boldItalic: "2R565H7O7Xco9E304P4P7O7X4b4P4b5n7X*094b4b7X*027dcv8B8O9T9Q7Y7J9Ya84c5a8A75bpa1ac8Eac8Q8l729F8xd48n8b7w4E5s4w7X6l7B7M8e7L8i7Q4A768a3O3O7u49co8a7/8f8i5b7a4R8a6VaB6Z6V6u4Q7i4Q7X2R567O7X7O7X7O7d7Baj6c5O7X4P6u7B5V7X5m5m7B8j8C4b7B5m6r5ObFcwc+7d=8B*04cp==7Y*02=4c*029Q==ac*037Xac=9F*02=8D83=7M*04c1==7Q*023Y*037Y==7/*037X7Y=8a*02=8f=*0g9Q8i=*0ja889=3Y=3Y=3Y=3Y=3Y9l7A=3X==7u=*057i5u7549=*059t9+89=*05ekcv=*0h724R=*0m49~daK~d*039U~d~d9QbL~d*027Sa8897I4A~d7/~d*028y7u~d*05aL8j~d*0cbe9m~d9E888a~d~d88~d*0A7P~d*07==~d~d==~d*0b=*07~d*0n=*03~d*0l==~d*023X~d*0n~3*02877M~38i8s~37P~37t~3*067m~3*0u4c~3*068f~3*0579~3*0O7B7B~3!~3*0d7B*05!*05~3*0r615n907o3K3Ka18A!!8g7K7J7K=5a!*037C7C8B=7Ya84c!ac!8bal488B8O6Q8A7Y7wa8ac4c8A8zbpa182ac9/8E!7d728bbs8nbIal==8b7t8948888b7V6V837t6s8986487v6V8j6V6i7/8p8f6t8j5+88ai78aObP=*048A7V868k*02ai8p8Rac7/8N6R7J6O7I7C8s8Gdqco8+8a9m8a8y7w8z7T9S7V8Q6/8O887L3Oac5L7K8D8f9Tbpa58f9U9T9X7Y7YaQ6Q9U8l4c4c5adKduaP8Aa18l9/8B8F8O6Qag7YcG87a1a18A9Ibpa8ac9/8E9T728lbs8nay9odye8adbU8F9MdO8Q7M817v5z8W7QaN7b8a8a7u7+a58r7/8i8f7Lco6Vai6Z8N83coc/8Las7n7HbG7p=7Q86=7L7a3O3Y3OaUbp8a=*028aduaX9C7ldzbl9M7Vdybpbc9Af4dt7/76bIaOac7/8E7j==ghe6ac7/duaXduaX9G7J8g00*06aN8y8F7G8E8f6Q5l6Q5u907QdGbH877b9f8h8A7G8A7uan9caw8TbG9TeGb/an8D9T7L726p8b6V8b6V8U7uc59s9M8C9o8a9o8acm9kcm9k4c==9l8dah8ja88raW8R9o83cbav4c=7R==cpc1==a87P=*058879=*05ac7/=*0b6R5z==6P5v8e6V8n6Z~d*1x==~d*0r=*05~d*0nad~d=*067N=7O=7O=*027N=7N=*027N=*087X=*027X=*043Y=*0684=*07aL8jaL8jaL8jaL8jaL8j=*03be9mbe9mbe9mbe9mbe9m=*07~d*057QfE8IfE5d3W2D8I4m381k00*04!4P~36lcFcF~36l4b*037A7A7B~36J6D6N!*02cm!*0200*0438h7!365N~3!*033435!8X7R6l!*042u!*0o~33u00*04!00*095m!*025m*05!*046y5m*09!*0l8H7L7M7L7X8X8j7Xftd4cj7M7X7L7Lh0bi7L8i857L7M7Tbh7X*02cA8+7X857X7X!*0e00*0w!*0jc3!*0c8g!!fLay!*078b!7D!*02=!*06cT!*03iP!*0uchdacpda*02ctdacwdadack~d!*0L9o*03e48n9o*03!*0d8n!*1o7Y!*028A!*079Z!867X!!5s!*027q9+!*02b97P!*087O!50!*097X!*0g7X!*0m=7O!!7X7X!*2p"
		},
		{
			name: "Trebuchet MS",
			lineHeight: 1161.1328125,
			descent: 222.16796875,
			regular: "4J5L558c8c9ob22w5L*028c5L*028c*0a5L5L8c*025Lc39e8S9m9B8o8daAae4m7t907Wb59+ay8KaA967x95a89bdk8J8W8C5L5z5L8c*028d8J7L8J8x5O7S8y4t5L7U4Dc+8y8p8J8J656l6c8y7GbE7R7J7r5L8c5L8c4J5L8c*028W8c768cb95L8c8c5Lb98c*0273768c8y8c5L8c735L8ccK*025L=9e*04dz==8o*02=4m*029B==ay*038cah=a8*02=8I8y=8d*04dF==8x*02=4t*028B==8p*038c8x=8y*02=8F=*0faP9B8J=*0jaF8A=*084tbn9q=*038x=*057W5a7W4G=*059Xad8y=*05fxes=*0g7M956c=*0m5b~8*0h64~8*1C=*05~8*0n=*03~8*0P~0*1R8c8c~08c~0*0d8c*05!*03~0*0t~8*07!!~8*03=~8!*038c8c9e5Ma6bY5P!bk!babC4m9e8S7+998o8CaeaP4m909ab59+9lay9X8K!8u958WbW8Jc5at==967j8C4m8D968Q8v8F7j6X8C8w4m8x8i8y7O7c8x9q8X7b8W6W8Db27ZbgbU=*04~8*0N8vbp88997B4m4m7lfbehbC9A~8919X9i8V8U88aP8vdZ8dawaw9AawbDaeay9X8K9d9H91by8Qab9ld+eobAce909bdQ9m818D846N928zbx768Y8Y848PaG8L8p8y8J7N757Nc97Z8D8jbSc49xaJ7W7Nbi8c~8=8A=7N6q4q4q4NcUcl8A=~8=8y~8*0y00*06~8*05886N~8*3J=*05~8*1H==~8*0b7QfE8IfE5d3W2D8I4m381j00*045L5L~05Lbubu~08c5L*038c*02~07b7b8c!*02bu!*0200*0438eh!2w5j~0!*035L5L!9x~08c!*048h!*0o~03u00*04!00*09!*0e67!*0v~0*028d8c~0~0hq~0*038c~0*0d~9~9!~9~9!*0f00*0w!*0jbP!*0c8c!!ei!*0a9X!*02=!*068B!*0HcK*03~8!*0L~0*03!*0j~0!*1o8B!*0299!*078F!8d8c!!8h!*025L8c!*028c!*0b8c!*0r8c!*0m=!*028c8c!*2p",
			bold: "4J5L5L9a9aaIb23B5L5L6M9a5L*02669a*095L5L9a*026Sc39V9j9Aa38V97avaI4m8l9F8FbFara/9bb59z7/9AaC9KdQ9p9B8M6i5z6i9a*028l9680958/5O7S9h4G5L8A4Ddr9e8S97986H6L6c9f8fcg8E8m8g6O9a6O9a4J5L9a8c9a8W9a769ab96J9a9a5Lb99a*0273769a8z8c5L9a736J9acK*026S=9V*04eD==8V*02=4m*02a3==a/*039aaI=aC*02=8K8y=8l*04dv==8/*02=4G*028S==8S*039a8S=9f*02=97=*0fbta395=*0jaZ9n=*084Gco9K=*038+=*045V8F6R8F4D=*05aHaG9e=*05fHep=*0g8x9A6c=*0m5F~a*0h64~a*1C=*05~a*0n=*03~a*0P~1*1R9a9a~19a~1*0d9a*05!*02~1*0u~a*07!!~a*03=~a!*039a9aa3=aNcA6b!c3!c7cq4y9V9j8x998V8MaIbe4m9F9RbFar9Ta/ao9b!969A9Bcr9pcKat==9i7Y9f4y929i9a8T8Y7Y7i9f914y8+8L8z8l7y8Y9q9f7v9l7n92bM8Jc5cf=*04~a*0N90bP8C9A814m4m8yfKeRc0a0~a9J9X9Z9m9l8Cbp90eB8Ja+bfa0aWcaaIa/ap9d9Aaa9Jcm9AaE9Veye+c8d79u9FeKa08m978x7e9N92cb7z9p9p8y9nbg9h8W9899847D8tct8M9q8TcrcSabbG8s8cbY8M~a=9n=8c6Q4J4J5cdDd89n=~a=9e~a*0y00*06~a*058C7b~a*3J=*05~a*1H==~a*0b7QfE8IfE5d3W2D8I4m381j00*045L5L~15Lbubu~19a5L*039a9a8c~17b7b8c!*02bu!*0200*0438gc!365S~1!*035L5L!9x~18c!*049a!*0o~13u00*04!00*09!*0e6m!*0v~1*02978c~1~1ia~1*039a~1*0d~b~b!~b~b!*0f00*0w!*0jci!*0c9a!!f6!*0aa4!*02=!*068B!*0HcK*03~a!*0L~1*03!*0j~1!*1o9a!*0299!*079Z!8d9a!!9a!*025L9a!*029a!*0b8c!*0r9a!*0m=!*029a9a!*2p",
			italic: "4J5L558c7x9ob22w5L*028c5L*028c*0a5L5L8c*025Lc39z8S9m9B8o8daAae4m7t907WbV9+ay8vay967x95a89bdk8J8W8C5L5z5L8c*028d8J7c8J8p6h7S8J4P5L7U50c+8y8p8J8J6x6l6A8J7GbE7R7J7r5L8c5L8c4J5L8c8h8c8J8c768cb9758c8c5Lb98c*0273738c8J9n5L8c737b8ccK*025L=9z*04dz==8o*02=4m*029B==ay*038cay=a8*02=8v8y=8d*04dd==8p*02=4P*028B==8p*038c8p=8J*02=8J=*0faP9B8J=*0jaG8F=*084Pbn9a=*038p=*057W*024D=*059tac8y=*05fxdX=*0g7M956A=*0m5t~c*0h6h~c*1C=*05~c*0n=*03~c*0P~2*1R8c8c~28c~2*0d8c*05!*03~2*0t~c*07!!~c*03=~c!*038c8c9z=a6bO5T!bu!babT4d9z8S83998o8CaeaP4m909cbV9+9qay9Y8v!8u958Wb+8JbTat==8z7h8F4d8C8z8Q8e8z7h6V8F8S4d8p8g8J7R768w9q917o8/6M8CaZ82bAbW=*04~c*0N8zbh878S7t4m4m7jflejbF9A~c949+9z8W8W87aI8zdU86avav9xazbMaeaz9Y8N8Q9H94bJ8/a59kdXecbCc5908UdW9m8r928r769981bx748V8V8b95bw8Q8t8H8L78d97VbM829e8xd3dwa5bx8o7abt8g~c=8D=786s4y4y4JdxcC8D=~c=8T~c*0y00*06~c*05876T~c*3J=*05~c*1H==~c*0b7QfE8IfE5d3W2D8I4m381j00*045L5L~25Lbubu~28c5L*038c*02~27b7b8c!*02bu!*0200*0438eh!2w5j~2!*035L5L!9x~28c!*048h!*0o~23u00*04!00*09!*0e73!*0v~2*02eJ8h~2~2hm~2*038c~2*0d~9~9!~9~9!*0f00*0w!*0jaW!*0c8c!!d+!*0a9X!*02=!*068B!*0HcK*03~c!*0L~2*03!*0j~2!*1o8B!*0299!*078F!8d8c!!8h!*025L8c!*028c!*0b8c!*0r8c!*0m=!*028c8c!*2p"
		},
		{
			name: "Georgia",
			lineHeight: 1136.23046875,
			descent: 219.23828125,
			regular: "3N5b6sa39ycNb63n5T5T7oa34e5S4e7l9C6K8L8E8R8g8S7S9k8S4V4Va3*027vexavaea2bJad9nblcL6686aS9sevb/bE9ybEa+8N9HbQarfgb69D9q5T7l5Ta3a37Q7U8M768+7z557Z964B4A8o4udN9f8r8X8M6q6M5p8/7Nbx7V7I6Y6K5T6Ka33N5b8H9K8X9D5T7Q7QeK7Q95a35SeK7Q6za37Q*02937Q4n7Q*0295gq*027v=av*04fb==ad*02=66*02bJ==bE*03a3bE=bQ*02=9C8A=7U*04bx==7z*02=4B*028k==8r*03a38r=8/*02=8L=*0fapbJ8+=*0jcL96=*084BdU8Y=*038w=*045U9s6A9s4u=*05a5b/93=*05fCcM=*0h9H5p=*0m4H~e*0eaO~e~e87~e*0ccPa2fCbv~e*0adsa2~e*039q6Y~e*085T9s~e5bl7iFfWhxe092k5gzdP=*048P=*09~e=*05~e~e=*048P=8P~e*02l7iFfW==~e~e=*0k8P=8P=*0b~e~e==~e*05=*048P=8P=8P=8P==~e*024A~e*0n!*087z!*1w3z3z!*087Q7Q!7Q!*0d7Q*05!*0f6q!*0k~e~e!*03~e*03=!*047Q7QaA4Vcuf08l!dk!cxdI4Davae97alad9qcLbE66aSayevb/aRbEcE9y!9s9H9Db/b6dHcb==9m7k8X4D8t9m8R828r7k6k8X8I4D8o7E937R6V8r9p8K6+8Z738taU7Wbqbb=*04!~e*059f~e*0Eadadch97ah8N666686fQgFd8aTcOahcGavabae97biadfo9xcOcOaTbQevcLbEcE9ya29Hahb/b6cEbJhahabWf8a1aigGaV7U8t866U8M7zcj7q9A9A8D95bb9x8r9q8X767n7IbN7V9r8Ydvdw92bS7N7Ccm8A=7z8X=7C6M4B4B4Ac5cu96=*029r~e~ea17N~e*05focj~e*05bE8PbA8t~e*0c00*06~e~ea17N~e~e906L976U~e~egEcM9x7qbZ8+cD9O~e~ecF9Wdm9VeFaN~e*03a276~e~e9D7N9D7NbC8j~e~eck9kbJ8YbJ96~e*0366==~e*0c=*03fbbx==aO7z~e~e=*03~e~e=*048PbE8P~e*03=*07~e~eg6cm~e*05=*1c8P=8P=8P=8P=*15~e~e!!~e!=*0I8P=8P=8P=8P=8P=8P=8PcPa2cPa2cPa2cPa2cPa2=*03dsa2dsa2dsa2dsa2dsa2=*07!*057QfE7QfE5d3W2D7Q3W381j00*04!5S!a3dpdp!a33z*02336q*02!7o7o69!*02cD!*0200*0438iS!5185!*046v6v!8/!a3!*041h!*0p3u00*04!00*097Q!*027Q*05!*048d7Q*09!*0o9K9K!!iR!*028+a2!*068N!*03a+!*0l00*0w!*0hgC!cN!*02fX!*0853!!j5eK!*07gO!eK!*02=!*02==!!9E!*0zgqgq!*05gq*03~866cbihgwargwmCsHhcb6hcni9sa2bJev4B9adLcu7NcmgXlvcu7Vcuh34u768+dN!*2190!*02as!*07d2!b1a3!!1h!*024nat!*02bd!*0b7Q!*0ra3!*0m=!*02a3a3!*1u4n!*0V",
			bold: "3+5U7+a/a1dLcv4d6/6/7ya/585X587oaZ7G9O9Na99na88GaAa85L5La/*028Af7bSbRbbd2bhavcDeh6+9jcNaKf/d7cQaZcQcta9aId1bWhCcFbsaN6/7o6/a/a/7Q9ka68jan8Y6991aE5y5q9U5ofUaO9Yaia888816daB8Tdv9c8O8d7Q647Qa/3+5U9taOa/bs648P7QeK8E9ya/5XeKa/6Aa/8E8E7Qas8B5i7Q8E8E9ygL*028A=bS*04gK==bh*02=6+*02d2==cQ*03a/cQ=d1*02=b4ai=9k*04dp==8Y*02=5y*029+==9Y*03a/9Y=aB*02=a5=*0fcWd2an=*0jehaE=*085yfAaB=*03a3=*047XaK8oaK5o=*05cXd7aF=*05hdeG=*0haI6d=*0m5x~f*0ec4~f~f93~f*0cfqcogpcN~f*0afucD~f*03aN8d~f*08649R~f5UnPlfiAk1g8aOmriygc=*0f~f=*05~f~f=*07~f*02nPlfiA==~f~f=*0z~f~f==~f*05=*0d~f*025q~f*0n!*088Y!*1w4d4d!*087Q7Q!7Q!*067Q!*057Q*05!*0f87!*0k~f~f!*03~f*03=!*047Q7QbS5LdNgM9s!eq!eDf05mbSbRaibzbhaNehcT6+cNbNf/d7b/cQe4aZ!aEaIbsegcFfPdH==aD8oal5m9haDag8X9Y8o7eala05m9T8gau8N7O9Yaka781au7B9hcT8Td8cJ=*04!~f*05!~f*0EbhbhdQaibta96+6+9jhAiJeEcvepboe5bSbIbRaicxbhhFaBepepcvd3f/ehcQe4aZbbaIboegcFe5d0k9k9dwhgbubqitco9k9N9H7O9D8YdX8sbdbda0ahczb69YaXai8j8y8OdH9ca+arftfwaFej9h8yeF9/=8Yau=8L815y5y5qdOeAaE=*02aX~f~fbu9h~f*05hFdX~f*05cQ9Ydja6~f*0c00*06~f~fbu9h~f~faa7Mai7O~f~fiIeGaB8sdmaCe6bt~f~fexboeJbsgjcu~f*03bb8j~f~fbs8Tbs8Tde9C~f~fdsaNd0ard0aE~f*036+==~f*0c=*03gKdp==c48Y~f~f=*03~f~f=*05cQ9Y~f*03=*07~f~fiseO~f*05=*2p~f~f!!~f!=*0Vfqcofqcofqcofqcofqco=*03fucDfucDfucDfucDfucD=*07!*057QfE7QfE5d3W2D7Q3W381k00*04!5X!a/ewew!a/4d*0387*02!7y7y6S!*02eK!*0200*0438kt!518l!*046c6c!ap!a/!*041v!*0p3u00*04!00*098E!*028E*05!*049d8E*09!*0oaOaO!!lc!*02anbb!*06a9!*03ct!*0l00*0w!*0hhL!dL!*02h3!*0853!!j/eK!*07jz!eP!*02dJ!*02==!!a9!*0zgLgL!*05gL*03~a6+dYkViUbWiUpSwQjCcFjCqAaKbbd2f/5yb3gBeJ8TeojWpreJ9ceJkf5o8janfU!*21a7!*02bE!*07eB!bpa/!!1v!*025ibd!*02cv!*0b9Q!*0ra/!*0m=!*02a/a/!*1u5i!*0V",
			italic: "3N5b6sa39ycNb63n5T5T7oa34e5S4e7l9C6K8L8E8R8g8S7N9k8S6060a3*027vexavaea2bJad9nblcL6686aS9sevb/bq9ybqa+8N9HbQarfgb69D9q5T7l5Ta3a37Q8Z8G768/7o598Z8P4F4z8g4tdL9e8p928H7d6L5r8/8qcS7R8M6Y6K5T6Ka33N5b8H9K8X9D5T7Q7QeK7Q95a35SeK9k6za37Q*028T7Q4n7Q*0295gq*027v=av*04fb==ad*02=66*02bJ=bE*02=bEa3bE=bQ*02=9C8u=8Z*04bY==7o*02=4F*028y==8p*03a38p=8/*02=8F=*0faLbJ8/=*0jcL8P=*084FdK90=*038I=*04669s6B9s4t=*059Rb/92=*05fCcV=*0h9H5r=*0m4C~g*0eaO~g~g87~g*0ccNatfCbv~g*0adjat~g*039q6Y~g*085T9s~g5bl7iFfXhxd/90k5gydN=*0f~g=*05~g~g=*07~g*02l7iFfX==~g~g=*0z~g~g==~g*05=*0d~g*024z~g*0n!*087o!*1w3333!*087Q7Q!7Q!*0d7Q7Q8Z7Q*02!*0f62!*0k~g~g!*03~g*03=!*047Q7QaA60cuf08l!dh!cxdS4pavae97asad9qcLbq66aSayevb/aRbqcE9y!9s9H9Db/b6dHcb==9m7f924p8q9m8S7Z8r7f6h928D4p8I7E907R6S8p9s8P6V8V718qb47Wbwbm=*04!~g*05!~g*0Eadadch97ah8N666686fRgHd8aTcOahcGavafae97biadfo9xcOcOaTbQevcLbqcE9ya29Hahb/b6cEbJh0h0bXfaa2aigGaV8Z8p837b8k7od+7q8/8/8s8RbA9c8p9e9276dL8MbA7R8/8Ldpdp8pbx7C7Ccn8z=7o8D=7E6L4F4F4zbWcf8P=*028/~g~ga17N~g*05focj~g*05bq8pbA8t~g*0c00*06~g~ga17N~g~g906L977b~g~gg/d+9x7qck8rcD9L~g~gcN9TcY9ceFaN~g*03a276~g~g9D7N9D7Nbr7R~g~gck8LbJ8LbJ8P~g*0366==~g*0c=*03fbbY==aO7o~g~g=*03~g~g=*05bq8p~g*03=*07~g~gg8cg~g*05=*2p~g~g!!~g!=*0VcNatcNatcNatcNatcNat=*03djatdjatdjatdjatdjat=*07!*057QfE7QdV4E3u2k7Q3W381j00*04!5S!a3dpdp!a333*0362*02!7o7o69!*02cD!*0200*0438jc!5185!*046v6v!90!9k!*042g!*0p3u00*04!00*097Q!*027Q*05!*047Q*0a!*0o9n9K!!iR!*028/a2!*068N!*03a+!*0l00*0w!*0hgC!cN!*02fX!*0853!!j5eK!*07f1!eK!*02=!*02==!!9E!*0zgqgq!*05gq*03~c66cbihgwargwmCsHhcb6hcni9sa2bJev4F9jdYcu8qd3hJmmcu7Rcuh84t768/dL!*2190!*02as!*07d2!b1a3!!2g!*024nat!*02bd!*0b7Q!*0ra3!*0m=!*02a3a3!*1u4n!*0V",
			boldItalic: "3+5U7+a/a1dLcv4d6/6/7ya/585X587oaZ7G9O9Na99na88SaAa85L5La/*028Af7bSbTbbd2bhavcDeh739jcNaKg9c+cQb2cQctadaId1bWhCcybsaN6/7o6/a/a/7Qaka98oan8J5Za9az5K5Ja15yfGaO9Yanaa8m856xaJ9AeC97at857Q647Qa/3+5U9taOa/bs648P7QeK8E9ya/5XeKa/6Aa/8E8E7QaB9K5i7Q8E8E9ygL*028A=bS*04gP==bh*026+*02=d2==cQ*03a/cQ=d1*02=b4ag=ak*04do==8J*02=5K*029Z==9Y*03a/9Y=aJ*02=a7=*0fcWd2an=*0jehaz=*085KfAaG=*03ag=*0480aK8yaK5y=*05d0c+aC=*05hheB=*0ba9=*04aI6x=*0m5F~h*0ec4~h~h93~h*0ce+cggpcN~h*0afDcJ~h*03aN85~h*08649R~h5UnPl7isk1gqbfmhiGgv=*0f~h=*05~h~h=*07~h*02nPl7is==~h~h=*0z~h~h==~h*05=*0d~h*025J~h*0n!*088J!*1w4d4d!*087Q7Q!7Q!*067Q!*057Q*05!*0f87!*0k~h~h!*03~h*03=!*047Q7QbS5LdNgM9x!eq!eDf05qbSbTafbEbhaNehcT73cNbNg9c+b/cQe4b2!aEaIbsegcyfPdJ==aD8oaq5q9saDai8X9Y8o7eaqa05qaf8gau8N7O9Yaka681au7B9sc/8TdpcA=*04!~h*05!~h*0EbhbhdQafbrad73739jhoixeEcrepb9e5bSbEbTafcxbhhEaJepepcrd1g9ehcQe4b2bbaIb9egcye5d0k4k4dohjbmbqivczak9P9n899J8Jh38saJaJa7a7dHaM9YaOan8ofGatdS97aJagfmfmaset9D8rena2=8Jan=8o855K5K5Je0eGaz=*02aJ~h~hbu9h~h*05hFdX~h*05cQ9Ydja6~h*0c00*06~h~hbu9h~h~ha57+af89~h~hi/h3aJ8sdHa7dWbK~h~hetbPeAaMgjcu~h*03bb8o~h~hbs8Tbs8TcR97~h~hdsagd0agd0az~h*0373==~h*0c=*03gPdo==c48J~h~h=*03~h~h=*05cQ9Y~h*03=*07~h~hipfk~h*05=*2p~h~h!!~h!=*0Ve+cge+cge+cge+cge+cg=*03fDcJfDcJfDcJfDcJfDcJ=*07!*057QfE7QfE5d3W2D7Q3W381k00*04!5X!a/ewew!a/4d*0387*02!7y7y6S!*02eK!*0200*0438kB!518l!*046c6c!ap!a/!*041v!*0p3u00*04!00*098E!*028E*05!*048E*0a!*0oaOaO!!lc!*02anbb!*06a9!*03ct!*0l00*0w!*0hhL!dL!*02h3!*0853!!lVeK!*07hF!eP!*02=!*02==!!a9!*0zgLgL!*05gL*03~d73e5l8iZbWiZq0x2jBcyjBqEaKbbd2g95Kbrh9eR9Afil0qJeR97eRkz5y8oanfG!*21a7!*02bE!*07eB!bpa/!!1v!*025ia/!*02cv!*0b9Q!*0ra/!*0m=!*02a/a/!*1u5i!*0V"
		},
		{
			name: "Verdana",
			lineHeight: 1215.33203125,
			descent: 209.9609375,
			regular: "5w6a7bcO9YgQbn4d76769YcO5I765I769Y*097676cO*028xfEaIaKaWc39U8/c7bL6B77aR8JdbbIcj9rcjaTaI9EbsaIftaJ9DaJ76*02cO9Y9Y9p9L899L9k5w9L9V4i5o9g4ifd9V9v9L9L6H896a9V9gcO9g9g8d9X769XcO5w6a9Y*03769Y9YfE8xa5cO76fE9Y8ucO8u8u9Ya29Y5I9Y8u8xa5fE*028x=aI*04fo==9U*02=6B*02c7==cj*03cOcj=bs*02=9t9I=9p*04eX==9k*02=4i*029A==9v*03cO9v=9V*02=9L=*0fa7c79L=*0jbL9V=*084idD9C=*039g=*044E8J7a8O4s=*05bqbI9V=*05gKfl=*0h9E6a=*049S=*049S=*0a4I~8*0ebP~8~89Y~8*0ccD=~8*0cbQak~8*18=*05~8*0n=*03~8*0P~0*089k~0*1H9Y9Y~09Y~0*0d9Y*05~0*0x~8*07!!~8*03=~8!*039Y9YaI76bLdC8s!dN!bNec4iaIaK8Sa/9UaJbLcj6BaRaKdbbIa9cjbL9r!aw9E9DcPaJdDcO==9L819V4i9T9L9I9g9w817a9V9M4i9g9ga09g7T9v9Z9N7Y9S7M9Tcm9ecScJ=*04~8*0N9Uco8SaZaI6B6B77huhfcOaRbK9DbLaIaKaK8SbG9Ufd9EbKbKaRbudbbLcjbL9raW9E9DcPaJbVb8g6glcfeoaFaZgab29p9C9j7n9K9kcu8ca0a09g9JaU9Z9v9Z9L8m7M9gd99ga59tdIdUa1cq8X8zd79o~8=9V=8z894i4i5oeiei9V=*029Z~8*0niAgg~8~8fncJ~8*0400*06~8*058S7n8S7n~8~8fdcu~8~8aR9gaR9g~8*03bL9Z~8*03cj9F~8*039D9g9D9gaJ9g~8*03b89tb89VdKaNdKaN~8*0nbP9k~8*0dcj9v~8*2l=*05~8*0naC~8=*0VcD=cD=cD=cD=cD=*04bQakbQakbQakbQakbQak=*07~8*057QfE8IfE5d3W2D8I4m381j00*04!769Y9YfEfE~09Y4d*037b*039Y9Y8x!*02cO!*0200*042MnN!5F8J8J!*037676!9N~09Y!*045F!*0o~03u00*04!00*09!*038u8u!8u8u!*058x!*0v9YaWaW9Y9YfdbIicifftd39L9YaR9EfE899rc7aIaIaW~0*04~9~9!~9~9!*0f00*0w!*0jgQ!*0c53!!ik!*08hE!fh!*02=!*06be!*0HfE*03~8!*0L~0*03!*0j~0!*1o9Y!*02bn!*07cO!bncO!!5F!*025IcO!*02fE!*0b9Y!*0rcO!*0m=cO!!cOcO!*2p",
			bold: "5m6i9bdzb7jUdu5c8v8vb7dz5F7w5FaNb7*096i6idz*029Ff4c8bWbkc+aHaacHd58y8Hc39ZeQdfdibtdiceb6aGcIbYhEbYbxaQ8vaN8vdzb7b7asaX9caXao6CaXb85m6jav5mgyb8aLaXaX7N9h78b8aafjatab9lb78vb7dz5m6ib7*038vb7b7f49mdidz7wf4b79bdz9m9mb7bhb75Fb79m9mdiiu*029F=c8*04h6==aH*02=8y*02c+==di*03dzdi=cI*02=bvb9=as*04fW==ao*02=5m*02aD==aL*03dzaL=b8*02=aX=*0fdMc+aX=*0jd5b8=*085mfLbo=*03av=*048a9Z8Ja25w=*05cVdfb8=*05hLgI=*0g7haG78=*0m5p~a*0ecB~a~ab7~a*0cei=~a*0cdebC~a*18=*05~a*0n=*03~a*0P~1*08ao~1*1Hb7b7~1b7~1*0db7*05!!~1*0v~a*07!!~a*03=~a!*03b7b7ct6idgfFb1!f8!eHfa5mc8bW9ZcCaHaQd5di8yc3c8eQdfbbdid5bt!aIaGbxeUbYfgdc==aX99b85mb2aXbcabaL998Bb8aY5mavabbhaa95aLbgaX8Obm8nb2ej9XeJd+=*04~a*0NaHef9ZbCb68y8y8Hj6i+eEc3debxd5c8bSbW9Zd9aHhrb3dedec3ddeQd5did5btbkaGbxeUbYdicjicipebgDbSbCiHcrasaVaB8jaPaofD9cbgbgavb5c+bgaLbgaX9m8nabf6atbpaIfGfRbDeFa99ufyaG~a=b8=9t9h5m5m6jfQfYb8=*02bg~a*0nl8jc~a~agme2~a*0400*06~a*059Z8j9Z8j~a~ahrfD~a~ac3avc3av~a*03d5bg~a*03dDaL~a*03bxabbxabbYat~a*03cjaIcjb8fTckfTck~a*0ncBao~a*0ddiaL~a*2l=*05~a*0nbI~a=*0Vei=ei=ei=ei=ei=*04debCdebCdebCdebCdebC=*07~a*057QfE8IfE5d3W2D8I4m381j00*04!7wb7b7fEfE~1b75c*039b*03b7*02!*02gp!*0200*042HrN!5x9E9E!*038v8v!a/~1b7!*046T!*0o~13u00*04!00*09!*039m9m!9m9m!*059m!*0vb7bkbkb7b7gydfk/kYhEejaXb7c3aGhBavbtcHc8b6bk~1*04~b~b!~b~b!*0f00*0w!*0jjU!*0c6u!!ke!*08kY!f4!*02=!*06bI!*0Hiu*03~a!*0L~1*03!*0j~1!*1ob7!*02cC!*07dB!aWdz!!6T!*025Fdz!*02gz!*0b8q!*0rdz!*0m=dz!!dzdz!*2p",
			italic: "5w6a7bcO9YgQbn4d76769YcO5I765I769Y*097676cO*028xfEaHaKaWb+9U8/c7bL6B77aR8JdbbIcj9rcjaTaI9EbsaHfuaJ9DaJ76*02cO9Y9Y9p9L899L9k5w9K9V4i5o9b4ifd9V9v9L9L6H896a9V9fcO9g9f8d9X769XcO5w6a9Y*03769Y9YfE8xa5cO76fE9Y8ucO8u8u9Ya29Y5I9Y8u8xa5fE*028x=aH*04ft==9U*02=6B*02b+==cj*03cOcj=bs*02=9t9I=9p*04eX==9k*02=4i*029A==9v*03cO9v=9V*02=9L=*0fa7b+9L=*0jbL9V=*084idD9C=*039b=*044E8J7a8J4i=*05bqbI9V=*05gKfk=*0h9E6a=*049S=*0g4I~c*0ebQ~c~c9Y~c*0ccD=~c*0cbQak~c*18=*05~c*0n=*03~c*0P~2*089k~2*1H9Y9Y~29Y~2*0d9Y*05~2*02!~2*0t~c*07!!~c*03=~c!*039Y9YaI76bLdC8s!dN!bNec4iaHaK8Sbm9UaJbLcj6BaRaKdbbIa9cjbL9r!aw9E9DcLaJdDcO==9L819V4i9S9L9I9f9w817a9V9M4i9g9g9/9f7T9v9Z9M7Y9S7M9Scm9ecScJ=*04~c*0N9Uco8SaZaI6B6B77huhfcOaRbK9DbLaHaKaK8SbG9Ufd9EbKbKaRbudbbLcjbL9raW9E9DcLaJbVb8g6glckeoaFaZgab29p9C9j7n9K9kcu8ca0a09g9JaU9Z9v9Z9L8j7M9fd99ga59tdIdUa1cq8X8zd79o~c=9V=8z894i4i5oeiei9V=*029Z~c*0niAgg~c~cfncJ~c*0400*06~c*058S7n8S7n~c~cfdcu~c~caR9gaR9g~c*03bL9Z~c*03cj9F~c*039D9f9D9faJ9g~c*03b89tb89VdKaNdKaN~c*0nbQ9k~c*0dcj9v~c*2l=*05~c*0naC~c=*0VcD=cD=cD=cD=cD=*04bQakbQakbQakbQakbQak=*07~c*057QfE8IfE5d3W2D8I4m381j00*04!769Y9YfEfE~29Y4d*037b*039Y9Y8x!*02cO!*0200*042MnL!5F8J8J!*037676!9N~29Y!*045F!*0o~23u00*04!00*09!*038u8u!8u8u!*058x!*0v9YaWaW9Y9YfdbIicidfud39L9YaR9EfE899rc7aIaIaW~2*04~9~9!~9~9!*0f00*0w!*0jgQ!*0c53!!ik!*08gh!fh!*02=!*06be!*0HfE*03~c!*0L~2*03!*0j~2!*1o9Y!*02bm!*07cO!bncO!!5F!*025IcO!*02fE!*0b9Y!*0rcO!*0m=cO!!cOcO!*2p",
			boldItalic: "5m6i9bdzb7jUdu5c8v8vb7dz5F7w5FaNb7*096i6idz*029Ff4c8bWbkc+aHaacHd58y8Hc39ZeQdfdibtdiceb6aGcIbYhEbYbxaQ8vaN8vdzb7b7asaX9caXao6CaXb85m6jav5mgyb8aKaXaX7N9h78b8a9fjatab9lb78vb7dz5m6ib7*038vb7b7f49mdidz7wf4b79bdz9m9mb7bhb75Fb79m9mdiiu*029F=c8*04h6==aH*02=8y*02c+==di*03dzdi=cI*02=bvb9=as*04fW==ao*02=5m*02aD==aK*03dzaK=b8*02=aX=*0fdMc+aX=*0jd5b8=*085mfLbo=*03av=*048a9Z8J9Z5w=*05cVdfb8=*05hLgI=*0g7haG78=*0m5p~d*0ecD~d~db7~d*0cei=~d*0cdebC~d*18=*05~d*0n=*03~d*0P~3*08ao~3*1Hb7b7~3b7~3*0db7*05!*05~3*0r~d*07!!~d*03=~d!*03b7b7ct6idgfFb1!f8!eHfa5mc8bW9ZcCaHaQd5di8yc3c8eQdfbbdid5bt!aIaGbxeUbYfgdc==aX99b85mb2aXbcabaL998Bb8aY5mavabbfa995aKbgaX8Obm8nb2ej9XeJd+=*04~d*0NaHef9ZbCb68y8y8Hj6i+eEc3dhbxd5c8bSbW9Zd9aHhrb3dhdhc3ddeQd5did5btbkaGbxeUbYdicjicipebgDbSbCiHcrasaVaB8jaPaofD9cbjbjavb5c+bgaKbgaX9c8nabf6atbpaIfGfRbDeFa99wfyaG~d=b8=9u9h5m5m6jfQfYb8=*02bg~d*0nl3jc~d~dgme2~d*0400*06~d*059Z8j9Z8j~d~dhrfD~d~dc3avc3av~d*03d5bg~d*03doaC~d*03bxabbxabbYat~d*03cjaIcjb8fTckfTck~d*0ncDao~d*0ddiaK~d*2l=*05~d*0nbI~d=*0Vei=ei=ei=ei=ei=*04debCdebCdebCdebCdebC=*07~d*057QfE8IfE5d3W2D8I4m381j00*04!7wb7b7fEfE~3b75c*039b*03b7*02!*02gp!*0200*042HrN!5x9E9E!*038v8v!a/~3b7!*0451!*0o~33u00*04!00*09!*039m9m!9m9m!*059m!*0vb7bkbkb7b7gydfk/kThEejaXb7c3aGhBavbtcHc8b6bk~3*04~b~b!~b~b!*0f00*0w!*0jjU!*0c6u!!ke!*08jU!f4!*02=!*06bI!*0Hiu*03~d!*0L~3*03!*0j~3!*1ob7!*02cC!*07dB!aWdz!!51!*025Fdz!*02gz!*0b8q!*0rdz!*0m=dz!!dzdz!*2p"
		},
		{
			name: "Tahoma",
			lineHeight: 1207.03125,
			descent: 206.54296875,
			regular: "4V5c6hbo8yfhay3j5/5/8ybo4L5H4L5+8y*095y5ybo*027qed9o9d9paC8N89araz5R6x9c7Oc3arb48Db49J8J98ag9le695908L5/5+5/bo8y8y8d8F7d8F8e4+8F8K3B4q7O3Bd88K8v8F8F5E6+5e8K7ObC7L7O6Y7w5+7wbo4V5c8y*035+8y8yex7J8Zbo5Hex8y7nbo7J7J8y8U8y5y8y7J7J8ZfE*027q=9o*04eh==8N*02=5R*02aW==b4*03bob4=ag*02=8R8A=8d*04dM==8e*02=3B*028y==8v*03bo8v=8K*02=8F=*0faLaW8Z=*0jbb92=*083Bbr84=*037O7O=*035F7O6Z864i=*05aQar8K=*05fhed=*0g7k985j=*0m3+8FaB9d8F978F9p9p7daWb+9d8F8v8Nb48l898yar9ld/3B5R9c7O4i7Odvar8Kb4bL8PegaO9/8F8R8J6+8I8y5e985e98bf9ua+agaR7O8L6Y8l8l6Y6Y8y8y7a7z8F5+5+bo5cjrhEflf3cR7CgCencR=*0f8e=*05ar8F=*086Y=jrhEfl==fF8M=*0z7R6M==9YbL968m8L6Y=*0d6FbU6J4qdNdN9o9p7d7O986+6Y8t7d9dag9l8N8e6x4qbk8H9J5E907O8d8H8H8F7d7d8F8F8e8ebf777a9Y8j4+8F8F8q7O9x8K*023B3B5R664i3B8Gd8*028K8K8P8vcibl8v5E*045t5t82826+8y4+8y935e5e8K9U8J7ObC7O766Y8B6Y6Y7d*03b48c8j8q8P6f7O6v8F7d7ddPdGfsam8xbvcE9Q8I7B8Parc561613E3Y*025u7D5k4C7r3j*028y8y5U5Ubo*038y*095y5y8y8y5d*028y*065d5+5g2v5G5f5U5/*045d5d8y8y6h8y*085y8y*055d838m9s7v8y8yauar!!8y7d*02=6x!*038y8y9o=aCco7B!cw!becw3B9o9d7X9H8N8Lazb45R9c9lc3ar8Sb4az8D!8I9890bJ95cpa+==8H778K3B8J8H8H7O8v77678K8H3B7O7O8U7O6N8v8P8E6K967j8Jb27Nbabl=*049c8H8JaycQ=8vbl8wb48v9p7d89789N8hbQ91dvd89Y8K9Y8q8J8J9x9xb48C7o6u8w8C7d4qb47d7d8R8F9pc39/8E9p*028N8Nbe7X9o8J5R5R6xfFfobe9rau8/az9o9d9d7XaI8Nd+8lauau9raCc3azb4az8D9p988/bJ95aJ9YeLe+aNcl979oeT9z8d8C8c6v8K8ebq7a8P8P7O8H9/8P8v8P8F7d7j7ObU7L8Y8vcacm8UaR7Q7nbW8g=8e92=7n6+3B3B4qcWcU92=*028PhUbpaF8WdjaP9o7OcPaRci9CfUd28l7acpbab48vbd9G==h/fmdnaleEbShUbp9p7d7M00*06au8P977Q8D8F7Y6v7X6v8W7+evbL8l7a9W8b9r7O9r7Obe8WaO8/cn9YfEdgbz8U9p7d987j907O907O9B83cIad9Y8v9Y8v9Y8KcV9ScV9S5R==9r7OaC8Haz8Paz8P9Y8vc39/3B=*03ehdM==b48e=*058l6Y=*05b48v=*0b7X6v==7X6v9H7A957L=*0R7O=*1y8d=4+4+a28v=*0VbL8PbL8PbL8PbL8PbL8P=*03bf9ubf9ubf9ubf9ubf9u=*07dD798P8v8/8f7QfE8yed4L3z2n8y4L381j00*045H5H8y8yeded5+8y3j*036h6h6d6h8y8y77774g8xcN4LfEfE00*042slLsb4C7r7r4C7r7r6I5/5/fE8L7q8ycqcq6Igj5H6N5/5/enc7bK8y8y7M7M8y4mcq8ybobocq8y9I9Scece5xhUce5x4L3u00*04!00*097J00!!7J*0841417J*0d4141!5W6a6k5c6a615w2v8+616a5G4C!*02919p9p8y8yd8areWhPe6d38Z8y9c98fE898D8y*038a9R8y*02c+cw8ybk9d!*0f00*0w!*0efhfh9pgm9ufhfI8l9oeI9Dhd9Vaz8K8Ka17u8753cwarhRexbB8Db4eyc09JarbAdkfpdI9l8L6Y=a+9f3B==e89N9V8k8kck89hc8rcdbK8Ab05lfkeW8P7O7Xaz9Yar7O7O90aC8F8e3B4qalaycYbB7dhLfEfEkxfEgBfE*098k5Rb0gbfh9lfhkspDeO95eVk47O9paCc33B5+8nb67Ob6dwfVb27Lb2dr3B7d8Fd8hoaCho9p7d9p9nbihofB8y8y!*03fE7QfE7QfE7Q!*0h7Q!*1o8y!*029H!*07aE!9Ybo!!2r!*024Lbo!*02edfj!*08bf!8y!*095y!*0gbo!*0m=bo!!bobo!*2p",
			bold: "4B5n7FcO9ZiLcd4j76769ZcO4V6L4V919Z*095H5HcO*028SeoaJaKarbR9D95bFbY7z7QaU8YdZc3c2ahc2bm9V9Abzazg4aJau9L769176cO9Z8y9n9U8f9R9i5+9Ra04K5H9r4KeWa09F9R9R6O836wa093dW9s908e9L9Z9LcO4B5n9Z*058yex7Ya/cO6Lex9Z88cO8r8r8yab9Z5H8y8r8ra/hE*028S=aJ*04ft==9D*02=7z*02c6==c2*03cOc2=bz*02=aja6=9n*04eF==9i*02=4K*029I==9F*03cO9F=a0*02=9R=*0fcNc69N=*0jce9X=*084KeIa8=*039r=*047G8Y7D9d5f=*05bCc3a0=*05gdfp=*0g9H9A6w=*0m529UccaK9UaB9Uarar8fc6dkaK9R9F9Dc29Y959ZbFazfm4K7zaU9r4K90fic39/c2d99PgNd4bL9Rbm9V839z9Z6w9A6w9Ackb9c2bzcobs9L8e9Z9Z8e8e9Z9Z8c8I9R9Z9ZcO5nlbjGhoh8f4a0jshefn=*0f9i=*05bF9R=*088e=lbjGho==h4ag=*0z918e==bId5axax9L8e=*0d7+dl885He/e/aJar8f8Y9A838e9e8faKbzaz9D9i7Q5Hcj9Rbm6Oau909n9R9R9U8f8f9R9R9i9icY8b8cbF9V5+9R9R8Q93a6a0*024K4K74716v4KareW*02a0a0a99FcHcGck6O*046j6j9X9X839Z5+8Lav6w6wa0as9X93dW928H8eaV8e8e8f*03c29w9V8Qa97o9r7J9R8f8fgrfIj5d1bqeheWcjbi8o8Pc9dQ6V6V4p4J*026U9k6d4V8u4j*028y8y6E6EcO*038y*095H5H8y8y5d*028y*06675+6f3k6s6x6E5/*045d5d8y8y7F8y*085H8y*055d7/8j9A9A8y8yc7bP!!8y8f*02=7Q!*038y8ybp=cjeEam!e0!dJe64KaJaK8Rb09D9LbYc27zaUazdZc39Uc2bYah!9z9AaudJaJe6c2==9R8b9/4K9X9Ra1939F8b7y9/9T4K9o92ab93819Fa69R7Uag899Xd48PdmcG=*04aUa19XcFff=ckcGbbc29Far7U9595bq8Gcp9sfieWbfa0bf9J9V9Va6b9c29E9h7Cbb9Q8f5Hc28j8jaj9RardZbR9Rar*029D9DcD8Rar9V7z7z7QhohccSaYc7atb+aJaKaK8Rb/9Dgk9Yc7c7aYc8dZbYc2bYahar9AatdJaJc8bfh1hfcCf0aBarhDbc9n9Q9w7Pa79idS8cacac9raebRa99Fa69R8f8990dU9sag9EereCaBdd8/8jer9x=9i9X=8j834K4K5Heqej9X=*02a8iAdRcyakfWd2az93fmdph3dRlLi79Y8ce6dmc29FcRba==kRiCdzaqfPdoiAdRar8f9100*06c7acaB8/ah9R8R7P8R7PaI91gwdV9Y8cb99zaY9raY9rddb8caakedbThreqd6acar8f9A89au90au90a/9NdCbabf9Ebf9Ebfa0e9bBe9bB7z==aY9oc8aebYa9bYa9bf9EdZbR4K=*03fteF==c29i=*059Z8e=*05c29F=*0b8R7P==8R7Pcyb4aJ9s=*2p9n=5+5+b29u=*0Vd99Pd99Pd99Pd99Pd99P=*03ckb9ckb9ckb9ckb9ckb9=*07gw9Had9Hbhae7QfE9Zed4K3z2n9Z4V381j00*046L6L9Z9Zeded9Z9Z4j*037F*039Z*035darfE4VfEfE00*042sqcxH4V8u8u4V8u8u6G6F6FfE9/9C9ZcJcJ6GiP6L6N7676h8d+dI9Z*045HcJ9ZcOcOcJ9Z8Tbqbzbz5HhJbX5H4V3u00*04!00*098r00!!8r*084L4L8r*0d4L4L!6L6X796l6X6V6w3kab6V706s5q!*02a6arar9Z9ZeWc3jmkRg4ej9N9ZaU9AhBavah9Z*03aDa19Z*02deev9ZbHaK!*0f00*0w!*0eiLiLari4bhiLjc9YargzaUiJcnbYa0a09O8U9553eCc3jhexdUahc2fGeWbmbmdbdtePdtaz9L8e=c2aO4K==fgbXaI9u9Qcx95jQ9DdZcM9Tc25lfAfAa6938RbYb5bF8Y8YaubR9R9i4K5HcicdgCdr83k1hEhEjNhEjNhE*099O7zeslkihazihp9w2ipaJipph8YarbRdZ4K8jbVdw93dBhakMdY9se0hC4K8f9ReWiucJk9ar8farbacJkthE9Z9Z!*03fE7QfE7QfE7Q!*0h7Q!*1o9Z!*02b0!*07ci!b5cO!!2W!*024VcO!*02fEfj!*08bf!9Z!*095H!*0gcO!*0m=cO!!cOcO!*2p"
		},
		{
			name: "Century Gothic",
			lineHeight: 1226.07421875,
			descent: 220.21484375,
			regular: "4l4D4Rbg8Gc7bR365N5N6F9u4l5c4l6R8G*094l4l9u*029fdzbA8+cJbE8o7BdEaH3y7y9f7eenbAdB9gdD9v7O6Gafa+f09x9g7w5v9t5vaw7Q5WaHaGa7aJaa4Wax9y383b7S38eG9yafaGaG4J645j9w8Gc/7w8o6F5vaw5v9u4l4D8G*03aw9D5NbH5N6F9u5cbH7Q6g8B5c5o5T908Q5d545c5N6Fc/*029f=bA*04fw==8o*02=3y*02cm==dB*039udA=af*02=9g8G=aH*04i5==aa*02=38*02af==af*038Bad=9w*02=aG=*0gcmaJ=*0jaH9y=*0838b46j=*037S=*043e7e48854I=*059Ac99y=*05iGhN=*0h6G5j=*0m38~8*0h8G~8*1C=*05~8*1f~0*1R7S7S~07B~0*0d753u5c4K6T8E!*05~0*0r~8*07!!~8*03=~8!*035W5WbA4l94bn4e!dB!a6d438bA8+7ebA8o7waHdB3y9fa+enbA8jdBaH9g!7R6G9gdr9xcnd4==aH6D9y389jaH9k8G8Y6D7h9yaf387S8o9y8G7hafauau93bd6i9jb+7wbwdp=*04~8*0N8oav7ecJ7O3y3y7ygFgjaD9f~8a6a9bA8Z8+7ebI8oeD95bAbA9fa+enaHdBaH9gcJ6Ga6dD9xb48rfMgGaIcp9ucJh798aHat7k5F9taac16D9E9E7S8GdL9maf9maGa75/8ogW7wad7aeOfF87av7na2d46Z~8a99P=a26438383bcode9P=~8=9n~8*0y00*06~8*056l5A~8*3J=*05~8*1H==~8*0b7QfE8IfE5d3W2D8I4m381j00*04!5c~07QfEbK~07Q5v5v5y5v7S7A7S~08F8F9u!*02fE!*0200*0438im!364R~0!*033X3X!8j~08G!*042C!*0o~03u00*04!00*09!*0e5A!*0v~0*027B8G~0~0gX~0*038G~0*0d~9~9!~9~9!*0f00*0w!*0jdD!*0c5C!!ha!*0afE!*02c0!*069o!*0Hc/*03~8!*0LfE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b99u!!2C!*024l8B!*02b9fj!*089d!4i!*0r8B!*0m8B9u!!8B8B!*2p",
			bold: "4o4o5E9o8MdsaE3s5Y5Y6U9o4o6A4o7c8M*094o4o9o*028MbAbA94ccaY887wd8aE4o7w9I6Ue4bAd88Md894886Aa0aYe4aE9I7Q50a0509o7Q6Aakaka0aka04oak9o3M44943MeI9oa0akak506U4I9o8Mcw8M947c5k9o5k9o4o4o8M8M9o8M9o8M7QbA5E7c9o6AbA7Q6g8B5g5g6A909o5d5k5g5E7cd8*028M=bA*04e4==88*02=4o*02bC==d8*039od8=a0*02=8M9o=ak*04gU=a0*03=3M*02a0==a0*038Bak=9o*02=ak=*0fbhbCak=*0jaE9o=*083MbU7Q=*0394=*044X6U5r7w50=*05a3co9o=*05gAgU=*0g5D6A4I=*0m3M~a*0h8M~a*1C=*05~a*1f~1*1R8s8s~16A~1*0d7w4o5E5k7waY!*04~1*0s~a*07!!~a*03=~a!*036A6AbA4o9obU5D!dH!b1dX3MbA947fbA887QaEd84o9IaSe4bA8hd8aE8M!7R6A9IdraEcRdn==ak6S9o3M9oak9H8M9o6S7s9oaf3M94949o8M7sa0azac99bd6w9oct8MbWdp=*04~a*0N88aO7fcc884o4o7wfxeQaJ9G~aa1aEbA8V947fc388eD8maLaL9IaSe4aEd8aE8Mcc6Aa1bOaEbK9Ef5g0addf8Ucchb9bakac8n6gaba0cC729o9o8p8xcf9oa09oaka08n94fM8May8Ie5ff95c07+9Mdx89~a=9o=9M6U3M3M44ccdc9o=~a=9o~a*0y00*06~a*057w6K~a*3J=*05~a*1H==~a*0b7QfE8IfE5d3W2D8I4m381j00*04!6A~17QfEbK~17Q4o*037w*02~18M8M9o!*02fE!*0200*0438k0!3s5E~1!*033M3M!8P~18M!*042w!*0o~13u00*04!00*09!*0e5m!*0v~1*027w8M~1~1i4~1*038M~1*0d~b~b!~b~b!*0f00*0w!*0jdN!*0c7z!!hm!*0afE!*02c0!*069o!*0Hd8*03~a!*0LfE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b99o!!2w!*024o8B!*02b9fj!*089d!4i!*0r8B!*0m8B9o!!8B8B!*2p",
			italic: "4l4D4Rbg8Gc7bR365N5N6F9u4l5c4l6R8G*094l4l9u*029fdzbA8+cJbE8o7BdEaH3y7y9f7eenbAdB9gdD9v7O6Gafa+f09x9g7w5v9t5vaw7Q5WaHaGa7aJaa4Wax9y383b7S38eG9yafaGaG4J645j9w8Gc/7w8o6F5vaw5v9u4l4D8G*03aw9D5NbH5N6F9u5cbH7Q6g8B5c5c5T908Q5d545c5N6Fc/*029f=bA*04fw==8o*02=3y*02cm==dB*039udA=af*02=9g8G=aH*04i5==aa*02=38*02af==af*038Bad=9w*02=aG=*0faNcmaJ=*0jaH9y=*0838b46j=*037S=*043a7e48854I=*059yc99y=*05iGhN=*0h6G5j=*0m38~c*0h8G~c*1C=*05~c*1f~2*1R7S7S~27B~2*0d753u5c4K6T8E!*05~2*0r~c*07!!~c*03=~c!*035W5WbA4l94bn4e!dB!a6d438bA8+7ebA8o7waHdB3y9fa+enbA8jdBaH9g!7R6G9gdr9xcnd4==aH6D9y389jaH9k8G8Y6D7h9yaf387S8o9y8G7hafauau93bd6i9jb+7wbwdp=*04~c*0N8o9V71ch7O3y3y7yggfW9V8Z~c9LabbA8C8+70bd8odL8kbmbm91bhenaHdBaI9gcJ6G9LcQ9xar8XfOgfa2cz93chh19gaHaz7k5v9eaacd6G9y9y8186df9yaf9yaGa76t8ogP7w9U7feXfp7VaX7Ca0db7l~c=9y=9Z6438383bcddq9y=~c=9y~c*0y00*06~c*056u5Z~c*3J=*05~c*1H==~c*0b7QfE8IfE5d3W2D8I4m381j00*04!5c~27QfEbK~27Q5v5v5y5v7S7A7S~28F8F9u!*02fE!*0200*0438im!364R~2!*033X3X!7q~28G!*042C!*0o~23u00*04!00*09!*0e5h!*0v~2*027B8G~2~2hB~2*038G~2*0d~9~9!~9~9!*0f00*0w!*0je6!*0c5B!!hf!*0afE!*02c0!*069o!*0Hc/*03~c!*0LfE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b99u!!2C!*024l8B!*02b9fj!*089d!4i!*0r8B!*0m8B9u!!8B8B!*2p",
			boldItalic: "4o4o5E9o8MdsaE3s5Y5Y6U9o4o6A4o7c8M*094o4o9o*028MbAbA94ccaY887wd8aE4o7w9I6Ue4bAd88Md894886Aa0aYe4aE9I7Q50a0509o7Q6Aakaka0aka04oak9o3M44943MeI9oa0akak506U4I9o8Mcw8M947c5k9o5k9o4o4o8M8M9o8M9o8M7QbA5E7c9o6AbA7Q6g8B5g5g6A909o5d5k5g5E7cd8*028M=bA*04e4==88*02=4o*02bC==d8*039od8=a0*02=8M9o=ak*04gU=a0*03=3M*02a0==a0*038Bak=9o*02=ak=*0fb3bCak=*0jaE9o=*083MbU7Q=*0394=*044x6U5n6U50=*059Ucc9o=*05gAgU=*0g5G6A4I=*0m3M~d*0h8M~d*1C=*05~d*1f~3*1R8s8s~36A~3*0d7w4o5E5k7waY!*05~3*0r~d*07!!~d*03=~d!*036A6AbA4o9obU5D!dH!bwdX3MbA947fbA887QaEd84o9IaYe4bA8hd8aE8M!7R6A9IdraEcRdn==ak6S9o3M9oak9H8M9o6S7s9oaf3M94949o8M7sa0azac99bd6w9oct8MbWdp=*04~d*0N88ar7gca884o4o7wfFeOaf9G~dasaEbA8/947gcb88ey82aEaE9Ga/e4aEd8aE8Mcc6AasbvaEbl9rf9fR9Cde8SbSh29eakao8z699Ua0d47n9o9o918AcB9oa09oaka08o8MfV8Ma78IedeY8+ch7Y9udC8g~d=9r=ac6U3M3M44cid59o=~d=9o~d*0y00*06~d*057d6o~d*3J=*05~d*1H==~d*0b7QfE8IfE5d3W2D8I4m381j00*04!6A~37QfEbK~37Q4o*037w*02~38M8M9o!*02fE!*0200*0438k0!3s5E~3!*033M3M!8V~38M!*042w!*0o~33u00*04!00*09!*0e5e!*0v~3*027w8M~3~3id~3*038M~3*0d~b~b!~b~b!*0f00*0w!*0jeu!*0c7w!!hf!*0afE!*02c0!*069o!*0Hd8*03~d!*0LfE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b99o!!2w!*024o8B!*02b9fj!*089d!4i!*0r8B!*0m8B9o!!8B8B!*2p"
		},
		{
			name: "Consolas",
			lineHeight: 1170.8984375,
			descent: 257.32421875,
			regular: "8C*a+!*03=8C!*038C*04!*048C*06!8C!8C*0j!8C*0H!8C*2O00*068C*4h~8~88C~8=8C*1o~8*058C*032T291r8C*0300*048C*0i!*028C!*0200*048C8C!8C*02!*038C8C!8C*02!*038C8C!*0o8C8C00*04!00*098C8C!!8C*0q!8C*04!*0a8C*0l~9~98C*02~9~9!~9~9!*0f00*0w!*0j8C!*0c8C!!8C8C!*098C!*02=!*068C!*028C!*0p8C8C!*038C*0b~8!*0y8C8C!*0a8C*05!*0h8C!*1o8C!*028C!*078C!8C8C!!8C!*028C8C!*028C8C!*088C!8C!*0r8C!*0m=8C!!8C8C!*2p",
			bold: "8C*a+!*03=8C!*038C*04!*048C*06!8C!8C*0j!8C*0H!8C*2O00*068C*4h~a~a8C~a=8C*1o~a*058C*032T291r8C*0300*048C*0i!*028C!*0200*048C8C!8C*02!*038C8C!8C*02!*038C8C!*0o8C8C00*04!00*098C8C!!8C*0q!8C*04!*0a8C*0l~b~b8C*02~b~b!~b~b!*0f00*0w!*0j8C!*0c8C!!8C8C!*098C!*02=!*068C!*028C!*0p8C8C!*038C*0b~a!*0y8C8C!*0a8C*05!*0h8C!*1o8C!*028C!*078C!8C8C!!8C!*028C8C!*028C8C!*088C!8C!*0r8C!*0m=8C!!8C8C!*2p",
			italic: "8C*a+!*03=8C!*038C*04!*048C*06!8C!8C*0j!8C*0H!8C*2O00*068C*4h~c~c8C~c=8C*1o~c*058C*032T291r8C*0300*048C*0i!*028C!*0200*048C8C!8C*02!*038C8C!8C*02!*038C8C!*0o8C8C00*04!00*098C8C!!8C*0q!8C*04!*0a8C*0l~9~98C*02~9~9!~9~9!*0f00*0w!*0j8C!*0c8C!!8C8C!*098C!*02=!*068C!*028C!*0p8C8C!*038C*0b~c!*0y8C8C!*0a8C*05!*0h8C!*1o8C!*028C!*078C!8C8C!!8C!*028C8C!*028C8C!*088C!8C!*0r8C!*0m=8C!!8C8C!*2p",
			boldItalic: "8C*a+!*03=8C!*038C*04!*048C*06!8C!8C*0j!8C*0H!8C*2O00*068C*4h~d~d8C~d=8C*1o~d*058C*032T291r8C*0300*048C*0i!*028C!*0200*048C8C!8C*02!*038C8C!8C*02!*038C8C!*0o8C8C00*04!00*098C8C!!8C*0q!8C*04!*0a8C*0l~b~b8C*02~b~b!~b~b!*0f00*0w!*0j8C!*0c8C!!8C8C!*098C!*02=!*068C!*028C!*0p8C8C!*038C*0b~d!*0y8C8C!*0a8C*05!*0h8C!*1o8C!*028C!*078C!8C8C!!8C!*028C8C!*028C8C!*088C!8C!*0r8C!*0m=8C!!8C8C!*2p"
		},
		{
			name: "Candara",
			lineHeight: 1220.703125,
			descent: 275.390625,
			regular: "3p3Y747U6Y7UaG3+5x5x7U7U3Y*024b8B5u7e7C8l7H8E7p8C8A3Y3Y7U*025xfN9E9a8Ba3897F9Jac4k6w9g7GdmayaS8FaS9t7/7ZaH8GdS8K8C875x4b5x7U7U4i7H8I748C815j8s8u3q3q7E3BcP8u8L8I8I5y6z5D8o7wb+7U7h785x3Y5x7U3p3Y7U6Y7E6Y3Y6z6oa04J767U3Ya03Q4b7U4b4b4i8Dat3Y3B4b4J76bR*025x=9E*04cK==89*02=4k*02a3==aS*037QaS=aH*02=8F8r=7H*04cj==81*02=3q*028A==8L*037U8L=8o*02=8K=*0f9Ma38H=*0jac8u=*083qaV6Q=*037E=*023O=4J7G5d7G4r=*059Say8w=*05e5du=*0g6+7Z5D=*0m4k~8*0h7U~8*0cbz9P~8*0cc39Z~8*18=*05~8*0n=*03~8*0P~0*1R5+5+~03Q~0*0d5+414G3B6M6L~0*0x~8*032K2K~8~8!!~8*03=~8!*034i=a9=aQcU71!cF!bQcH3/9E9a7o9k8987acaS3F9g9kdmay8eaSaf8F!8f7Z8CaW8KaUaD4k=947b8x3/8n948q7P8B7b6R8x8/3/8x83997P6/8L9F8r6D937A8nbK7UbobN=*04~8*0e8o7q8B8c~8*0t89899V7z8H7/4k4k6fdhdtad9paB819W9E8W9a7za989dm8laBaB9p9CdmacaS9N8F8B7Z81aG8K9Z9wdZelatcn8V8Iev9j7H8L7P5Z8P81bc6S8h8h7E7QaH888L7V8I746U7haq7U8m7nbJct8Sa17k7kbH7S=818t=7e6z3q*02b2bn89=*027R~8~8ae8H~8*0daS8L8/7C~8*0c00*06~8*057w5Z~8*3J=*05~8*0p=*0Vbz9Pbz9Pbz9Pbz9Pbz9P=*03c39Zc39Zc39Zc39Zc39Z=*07~8*057QfE8IfE5d3W2D8I4m381j00*043Y3Y~07QfEfE~0~03Y*02~07U*02~05x5xak!*02fE!*0200*0438bR!~0*02!*033Y3Y!!5x~0!*042i!*0o~03u00*04!00*094b!*024b*0a4A4b*0e!*0g~0*0a8H6Y~0*0d~9~9!~9~9!*0f00*0w!*0x5H!!fNa0!*09ap!*02ar!*06cM!*0L~8!*0L~0*03!*0j~0!*1o8E!*029V!*07b9!b97U!!2i!*023Y7U!*02bQ!*0b7U!*0r7U!*0m=!*027U7U!*2p",
			bold: "3p3Y797U6Y7UaG3Y5x5x7U7U3Y*024b8m5e7v7n8p7p8h7h8o8g3Y3Y7U*025xfN9S9m8Ea58f7H9Kad4n6f9d7BdwapaV8IaV9k8b8eai8+el9b8E835x4b5x7U7U4i7H8H6Z8C805G8D8C3V3V7+42d08C8L8M8H616z5H8t7Fck837F6P5x3Y5x7U3p3Y7U6Y7E6Y3Q6z6oal4o767U3Yal3Q4b7U4b4b4i8Dat3Y3B4b4T76bR*025x=9S*04cY==8f*02=4n*02a5==aV*037QaV=ai*02=8I8v=7H*04cj==80*02=3V*028E==8L*037U8L=8t*02=8H=*0fafa58H=*0jad8C=*083VaC7O65=*027+=*045A7B5Y7B4V=*05b2ap8C=*05eedu94=94=94=80=80=*0280=*037h8e5H=*0m4p~a*0h7U~a*0cc6am~a*0cczaJ~a*18=*05~a*0n80=*02~a*0P~1*1R5+5+~13Q~1*0d5+414G3B6M6L~1*0x~a*033939~a~a!!~a*03=~a!*034i=av=aXc+73!cH!bRcU3/9S9m7A9y8f83adaV4n9d9ydwap8faVa28I!8l8e8Eb09bbfb1==947b8x3/8n948q7P8B7b6R8x8/3/8x83997P6/8L9F8r6e937A8nbK7UbobN=*04~a*0e8H7q8B8B~a*0t8f8fa27D8H8b4n4n6fdodEar9kaC8l9X9S9a9m7Dao8fdl8uaCaC9k9BdwadaV9Q8I8u8e8lb99ba69ldXetaMcp948Nen9k7H8L7Z6p8F80bc6W8t8t7/7+az8o8L898M6Z7e7Fao838G7GbQcB90am7v7ebV8c=808G=7d6z3V*02b2bA8w=*0285~a~aar8X~a*0daV8La08c~a*0c00*06~a*057x6s~a*3J=*05~a*0p=*0Vc6amc6amc6amc6amc6am=*03czaJczaJczaJczaJczaJ=*07~a*057QfE8IfE5d3W2D8I4m381k00*043Y3Y~17QfEfE~1~13Y*02~17U*02~15x5xak!*02fE!*0200*0438bR!~1*02!*033Y3Y!!5x~1!*042i!*0o~13u00*04!00*094b!*024b*0a4P4b*0e!*0g~1*0a8H6Y~1*0d~b~b!~b~b!*0f00*0w!*0x5H!!fNaa!*09aL!*02ar!*06cM!*0L~a!*0L~1*03!*0j~1!*1o8E!*029V!*07b9!b97U!!2i!*023Y7U!*02bQ!*0b7U!*0r7U!*0m=!*027U7U!*2p",
			italic: "3e3Y6Q7U6Y7Ua73L5x5x7U7U3Y*024b8n5l6M7g7P7a87728d833Y3Y7U*025xe+9q8y7J9f7x778U9m3N608C77ca9wa48ba48G7D7U9O8Pe48Q807E5x3L5x7v7E4i7v8s6C8q7s5d7Y8d3z3z7D3Bcz8b8i8p8k5I685Q8b7lbA7L756z5x3Y5x7v3e3Y7U6Y7E6Y3Y6z6o9w48767U3Y9w3Q4b7U4b4b4i8Dat3Y3B4b4w76bR*025x=9q*04cd==7x*02=3N*029f==a4*037Ua4=9O*02=847/=7v*04bP==7s*02=3z*028l==8i*037U8i=8b*02=8p=*0f9B9f8q=*0j9C8a=*083z9P6Y=*037D=*044X775o7d3B=*059g9w8b=*05dgcP=*0g6E7U5Q=*0m44~c*0h7U~c*0cb79D~c*0cbC9X~c*18=*05~c*0n=*03~c*0P~2*1R5+5+~23Q~2*0d5+414G3B6M6L~2*02!~2*0t~c*032R2R~c~c!!~c*033L~c!*034i=a83Qa4c46y!br!b7bO4d9q8y73967x7E9ma43N8C96ca9w89a49o8b!7X7U80a78Qava8==8Z6S894d7L8Z807m836S68898s4d8K738G726s8i9j7Q6e8b7u7Lbj7Iaobc=*04~c*0e8o7q8B8c~c*0t7x7x9r738a7D3N3N60cFcu9G8L9J8d959q8i8y739I7xcO8d9J9J8L9cca9ma48X8b7J7U8dal8Q948CcWdka0bp898sdu8T7v8q7B608p7scX6A8b8b7D7Gam7Z8i8b8p6Cc475aY7L8i7qc3cv869J7871bg7C=7s8b=6S683z*02aXbe81=*027T~c~c9L80~c*0da48i8G7m~c*0c00*06~c*05736c~c*3J=*05~c*0p=*0Vb79Db79Db79Db79Db79D=*03bC9XbC9XbC9XbC9XbC9X=*07~c*057QfE8IfE5d3W2D8I4m381j00*043Y3Y~27QfEfE~2~23Y*02~27U*02~25x5xak!*02fE!*0200*0438bR!~2*02!*033Y3Y!!5x~2!*042i!*0o~23u00*04!00*094b!*024b*0a4s4b*0e!*0g~2*0a8q6Y~2*0d~9~9!~9~9!*0f00*0w!*0x5H!!eo9w!*099U!*02ar!*06cM!*0L~c!*0L~2*03!*0j~2!*1o8E!*029V!*07b9!b97U!!2i!*023Y7U!*02bQ!*0b7U!*0r7U!*0m=!*027U7U!*2p",
			boldItalic: "3j3Y757U6Y7Uap3S5x5x7U7U3Y*024b8C5H737j7+7m8f7j8j8c3Y3Y7U*025xfn9i8X809E7T7v9c9W4o6f907lcGa6ab8Fab977V869X8Zed93887Q5x3S5x7I7I4i7T8w6D8v7x5i8e8n3K3K7N3ZcL8m8n8t8v5O6c5I8i7vbY7Q7n6z5x3Y5x7I3j3Y7U6Y7E6Y3Q6z6o9M4w767U3Y9M3Q4b7U4b4b4i8Dat3Y3B4b4w76bR*025x=9i*04cc==7T*02=4o*029N==ab*037Uab=9X*02=8y8d=7T*04c7==7x*02=3K*028w==8n*037U8n=8i*02=8r=*049l=*099Z9N8v=*0j9W8n=*083Kao7t=*037N=*045e7l5o7l4s=*059/a68m=*05dmcO=*0g6V865I=*0m46~d*0h7U~d*0cbNab~d*0cceaF~d*189l=*04~d*0n=*03~d*0P~3*1R5+5+~33Q~3*0d5+414G3B6M6L!*05~3*0r~d*033D3D~d~d!!~d*033S~d!*034i=aG3QaAcI73!co!bncG469l8X7s977T7Q9Wab4o9097cGa68jab9Y8F!7W8688aq93aZak==8X6R8j468f8X847B8c6R6j8j8F468O7l8F7k6q8n9m7V6r8n7x8fbj7GaLbb=*04~d*0e8H7q8B8B~d*0t7T7T9P7v8l7V4o4o6fcUd29Q90ae8b9G9i8/8X7va27TcL8haeae909jcG9Wab9z8F80868bap939I97dtdRapc18K8odI9a7T8p7C608r7xcN6L8i8i7N7Pax8i8n8m8t6Dch7naT7Q8t7mchcH8ran7q75bt7E=7x8b=6T6c3K*02b4bm81=*0284~d~da48g~d*0dab8i9K82~d*0c00*06~d*057v6n~d*3J=*05~d*0p=*0n7T=*0wbNabbNabbNabbNabbNab=*03ceaFceaFceaFceaFceaF=*07~d*057QfE8IfE5d3W2D8I4m381j00*043Y3Y~37QfEfE~3~33Y*02~37U*02~35x5xak!*02fE!*0200*0438bR!~3*02!*033Y3Y!!5x~3!*042i!*0o~33u00*04!00*094b!*024b*0a4r4b*0e!*0g~3*0a8v6Y~3*0d~b~b!~b~b!*0f00*0w!*0x5H!!eo9C!*09a8!*02ar!*06cM!*0L~d!*0L~3*03!*0j~3!*1o8E!*029V!*07b9!b97U!!2i!*023Y7U!*02bQ!*0b7U!*0r7U!*0m=!*027U7U!*2p"
		},
		{
			name: "Corbel",
			lineHeight: 1207.51953125,
			descent: 256.34765625,
			regular: "38485Gaf81cBat344I4I8q81485d484j82707/75857w8c6I838c484b81*026GfP9X9h9dav8D7Uasar3S5T9t89cSaUbq8Wbz9g8E8Hav9vdO989i994X4j4X817E5m7G8o6S8o7O4+8j8k3E3N7D3EcZ8f8l8j8b5f6k5r867eb8777v6Y4I3z4I81384881*033z6G5mcT5X7D815d9I5m6o814V4E5m9092485m4Q6p7DcLdzc96G=9X*04dS==8D*02=3S*02aK==bq*0381bq=av*02=8T9x=7G*04c9==7O*02=3E*028e==8l*03818l=86*02=8j=*0gaK8o=*0jar8k=*083E977p=*037y=*05894U893E=*058faU8f=*05gwdr=*0h8H5r=*0m4u~8*0h81~8*0cbS9e~8*0cbS9C~8*18=*05~8*0n=*03~8*0P~0*1R5m5m~05m~0*0d5m*05~0*0x~8*033d3d~8~8!!~8*03=~8!*035m5m9X=9UbJ57!cm!bccq459X9h879Q8D99arbq3S9t9PcSaU8Wbqan8W!9b8H9gbU9sbcbF==8L7b8L458x8N8D7A8k7b728L8v45897C907p6Q8l8/8r6v8F6W8xaC7waYbX=*04~8*0e8J7S8G8p~8*0t8D8DbD87908E3S3S5Tfyf0bG9taU9eae9X9p9h7ZbA8DdK8maUaU9tagcSarbqam8W9d8H9ebI9sb69FekfbaQcd9m92ez9z7G8c7H6t967Oau6J8z8z7s8d9X8k8l8a8j6S6U7var7h8Z7Cbbc18ta97C7dbs7Q=7O8G=7c6k3E3E3NccbL8L=*028a~8~8a37/~8*0db18baf7X~8*0c00*06~8*058q6T~8*3J=*05~8*0p=*0VbS9ebS9ebS9ebS9ebS9e=*03bS9CbS9CbS9CbS9CbS9C=*07~8*057QfE8IfE5d3W2D8I4m381j00*045d5d~07Ec+c+~0~03r*02~06b*02~07g7g6X!*02co!*0200*0438hP!~0*02!*034B4B!!6G~0!*043v!*0o~03u00*04!00*095f!*02594F5e4g5k5e5f*022X2X6r5f4Q4V4O594K5g4g5k5g5f*022X2X!*0g~0*0a8o81~0*0d~9~9!~9~9!*0f00*0w!*0x7Q!!gAcT!*09dn!*02bv!*06cM!*0L~8!*0L~0*03!*0j~0!*1o82!*029Q!*07aP!8K81!!3v!*0248a5!*02c0!*0b5t!*0r81!*0m=!*028181!*2p",
			bold: "3e4A6bap8fcXaQ3i4O4O8g8f4Z5d4A4C837L7P7E8g7F8C7E8I8D4A4Z8f*0271g0ah9L98aN8U89awaW4k6i9U8qcWbobu9pbU9Q918WaY9+ee9Y9W9p4X4C4X8f7E67838J6V8K81588C8M3V47843Ydk8H8G8C8C5u6E5X8x7HbJ89827k4N3J4N8f3e4A8f*033J7167cT6e828f5d9I676o8f5f5067909m4A675j6I82dde8cD71=ah*04eC==8U*02=4k*02bk==bu*038fbu=aY*02=9p9K=83*04cu==81*02=3V*028x==8G*038f8G=8x*02=8C=*0gbk8K=*0jaW8M=*083Vad7P=*028984=*058q5S8q3Y=*058Hbo8H=*05gndB=*0h8W5X=*0m4F~a*0h8f~a*0ccn9S~a*0ccLaA~a*18=*05~a*0n=*03~a*0P~1*1R6767~167~1*0d67*05!*05~1*0r~a*033d3d~a~a!!~a*034b~a!*036767ah=aFcI65!c/!cbdi4rah9L8xa48U9paWbu4k9Ua7cWbo9kbuaD9p!9r8W9Lcl9YbybT==977w9b4r8B978/8c8F7w7g9b8X4r8x8a9r7Q7h8G9w8R6M92728BaX8hbuc0=*04~a*0e8J7U8G8B~a*0t8U8UbW8n9s914k4k6ifFfqc19Ubo9Iauah9K9L8nbS8Ue+8Wbobo9UarcWaWbuaz9p988W9Ic49Ybg9Wexfjbcd49K9sfsa9838x7V6o8W81bq758Q8Q7P8kaf8B8G8s8C6V6R82aQ898N7YbrbO90aL7Y7qbQ82=818P=7q6E3V3V47coc88W7T=7z8r~a~aan8y~a*0dbf8waL8m~a*0c00*06~a*058H75~a*3J=*05~a*0p=*0Vcn9Scn9Scn9Scn9Scn9S=*03cLaAcLaAcLaAcLaAcLaA=*07~a*057QfE8IfE5d3W2D8I4m381j00*045d5d~17Ec+c+~1~13P*02~177*02~17q7q6X!*02dJ!*0200*0438ip!~1*02!*034G4G!!7b~1!*043v!*0o~13u00*04!00*095B!*025A575y4P5U5y5B*023g3g6Y5B5j5f505t575y4P5U5y5B*023g3g!*0g~1*0a8K8f~1*0d~b~b!~b~b!*0f00*0w!*0x7M!!hNcT!*09dn!*02bv!*06cM!*0L~a!*0L~1*03!*0j~1!*1o8s!*029Q!*07aU!8K8f!!3v!*024Aat!*02c6!*0b5t!*0r8f!*0m=!*028f8f!*2p",
			italic: "38485w9S7TcX9Y2W4r4r8o814953494j7V767U767S7D7X6z7U7X494981*026vfy9z9f8Paa8c7uavae3W5H8X7NcnayaV8VaV958z85a58Ydr948o8T4R4j4R817E5m7W7E6v81784W7P8a3l3x763Mce867H7Q7K4+6e5l7O7jb8787m6H4A3z4A8138487T*033z6G5mcT6d7v81539I5m6o814Q4x5m9092485m4A5Y7vd3dUcl6v=9z*04c/==8c*02=3W*02am==aV*0381aV=a5*02=8z9r=7W*04b+==78*02=3l*027J==7H*03817H=7O*02=7Q=*0b6S=*03am81=*0jae8a=*083l9m6S=*0371=*044w7N5m7N3M=*0586ay86=*05fycj=*0h855l=*0m4C~c*0h7T~c*0cbX8I~c*0cc49s~c*18=*05~c*0n=*03~c*0P~2*1R5m5m~25m~2*0d5m*05~2*02!~2*0t~c*033d3d~c~c!!~c*03=~c!*035m5m9z=9tbt5b!bQ!aoc73M9z9f899t8c8TacaV3W8X9mcnay8TaVa68V!95858xbr94aMbc==8z6Q7Y3M7+8z81777W6Q6f7+873M7M7v8A7e6l7H8n8f61866d7+ae7FaFbr==7K==~c*0e8J7S8G8p~c*0t8c8cbj898U8z3W3W5HfaeDbs8Xay8t9R9z9g9f89bf8ccz8Cayay8Xa5cnacaVa68V8P858tbu94at9oe2eyayc09d9aeh9k7W7N7t6s7Z78ci6T8f8f7n8kaz8d7H867Q6vce77aD788f7uc2c28eac7y6WaL7K=787V=6P6e3l3l3xbVbL7/==7m8l~c~ca27R~c*0daL7A8X6Z~c*0c00*06~c*058e6q~c*3J=*05~c*0p=*0VbX8IbX8IbX8IbX8IbX8I=*03c49sc49sc49sc49sc49s=*07~c*057QfE8IfE5d3W2D8I4m381j00*045353~27Ec+c+~2~23r*02~2616b6b~27g7g6X!*02cq!*0200*0438ia!~2*02!*034v4v!!6G~2!*043v!*0o~23u00*04!00*095b!*02554F594j5n595f*022X2X6f5b4A4Q4x554F594j5n595f*022X2X!*0g~2*0a817T~2*0d~9~9!~9~9!*0f00*0w!*0x7Q!!fNcT!*09dn!*02bv!*06cM!*0L~c!*0L~2*03!*0j~2!*1o7N!*029Q!*07aF!8K81!!3v!*0248a5!*02c0!*0b5t!*0r81!*0m=!*028181!*2p",
			boldItalic: "3e4A6ba686dwb93i4O4O8g8f515d4I4C7Q7x7P7b857E8u758y8z4L4W8f*0271fCa79w93ay8x7RaCap4d66998qctaQb19ab69l8P8Taj9Ke99W8T9o4X4C4X8f7E678q7V6P8t7A5E848v3R427B4gcw8r8080825C6y5S8d7Kbr7R7H784N3J4N8f3e4A868g86863J7167cT6V7Q8f5d9I676F8f5b516790934A67586r7QdKezd671=a7*04el==8x*02=4d*02aY==b1*038fb1=aj*02=959V=8q*04cb==7A*02=3R*0281==80*038f80=8d*02=80=*0gaY8t=*0jap8v=*083Ra57T=47=897B=*04538q5S8q4g=*058raQ8r=*05fIcD=*0h8T5S=*0m4P~d*0h86~d*0ccr9o~d*0ccOak~d*18=*05~d*0n=*03~d*0P~3*1R6767~367~3*0d67*05!*05~3*0r~d*033d3d~d~d!!~d*034Z~d!*036767a7=9ObJ5u!c1!bzcw4ba79w8Hao8x9oarb14d9j9VctaQ9Fb1al9a!9G8T9DbF9WbTbB==997g8D4b8i998e7x8k7g6V8D8/4b877Q927U6V809f8x6u8s6/8iaG8kbabI=*04~d*0e8J7U8G8B~d*0t8x8xbJ8t928P4d4d66f5eLbY99aQ9da3a79q9w8tbU8xeq8zaQaQ99acctarb1al9a938T9dbD9WaB9Jegf0aRcO9k9meU9A8q898a6O8c7AcA7b8P8P7D8Wb38t808r806Pcw7HaV7R957NcycQ8QaX7X78b77T=7A8n=7c6y3R3R42coc48q=*028P~d~dat86~d*0daT7S9K7O~d*0c00*06~d*058v6T~d*3J=*05~d*0p=*0Vcr9ocr9ocr9ocr9ocr9o=*03cOakcOakcOakcOakcOak=*07~d*057QfE8IfE5d3W2D8I4m381j00*045d5d~37Ec+c+~3~33P*02~3747a7a~37q7q6X!*02eU!*0200*0438j1!~3*02!*034B4B!!7b~3!*043v!*0o~33u00*04!00*095B!*025w4Y5w4K5K5w5B*023g3g6V5B585b4Y5w4T5w4K5K5w5B*023g3g!*0g~3*0a8t86~3*0d~b~b!~b~b!*0f00*0w!*0x7/!!hscT!*09dn!*02bv!*06cM!*0L~d!*0L~3*03!*0j~3!*1o8u!*029Q!*07aP!8K8f!!3v!*024AaN!*02c6!*0b5D!*0r8f!*0m=!*028f8f!*2p"
		},
		{
			name: "Constantia",
			lineHeight: 1220.703125,
			descent: 249.0234375,
			regular: "3X4j5D8E6UcRaB365N5N6N8E405D406j8r4V7A798j7s8t7z8p8y40408E*026Pdbay9labbL958raZcn5k4Vaj8Ie9bJcA96cA9T7+9BbEavfYah9h915p6j5p8E7Q6q7w8J7d8T7v4S7Y944r498n4pdy968t8M8F5/6l5x8V7zbs7w7x7w5w5s5w8E3X40767A8E8d5G8s6qcs4G808E5D6s6q5n8E5E5E6q8E8Y406q5E5b80cU*026K=ay*04e2==95*02=5k*02bL==cA*038EcA=bE*02=999y=7w*04by==7v*02=4r*028A==8t*038E8t=8V*02=8J=*0f9NbL8T=*0jcn94=*055i==4rac8A=*038p=*045j8I5p8I4p=*05aQbJ8Q=*05frcW=*0h9B5w=*0m4r~e*0h8E~e*0cdZa1~e*0cdlaf~e*18=*05~e*0n=*03~e*0P~4*1R6q6q~46q~4*0d6q*05~4*0B473u~4~4!!~e*03=~4!*036q6qay=awdP6M!d1!bCcN4say9l8Cag9591cncA5kajave9bJ9NcAc396!9x9B9hbjahd1cq5b=8R6S8B487W8R8N7d816S6t8B8h488t8q8M7n6L8q8W8r7h8J6X7WaN7Mayb1=*04~4~e*0d8a6O~e*0v9595bB8Caq7+5k5k4VeVg3cBavcu9UbVay9q9l8Cb095e+8Fcucuavb3e9cncAc396ab9B9Ub7ahc3aGghgmbjdx9aaEgBa27w8F7L6Y8y7vbs789v9v8h8IaB9j8t948M7d7z7xaK7w998AcscC96bg7w7yc586=7v8w=7u6l4r4r49bEc494=*0294~e~eaL8X~e*0dcm8taR80~e*0c00*06~e*058C6Y~e*3J=*05~e*0l~4~4~e~4=*0VdZa1dZa1dZa1dZa1dZa1=*03dlafdlafdlafdlafdlaf=*07~4*057QfE7QfE5d3W2D7Q3W381k00*045D5D~47QfEg3~4~43f3f3u~45H5H5/~48F9q4V~4!!bh!*0200*0438iD~4*03!*034P4P!!6Y~4!*042t~4~4!*02~4*0k3u00*04!00*095E!*025E*083Q3Q5A5E*0c3Q3Q!*0g~4*0a8E84~4*0i!*0f00*0w!*0x7e!!eXcs!*09a+!*02=!*06e7!*0L~8!*0L~4*03!*0j~4!*1o8d!*02ag!*07ci!9M8E!!2t!*02409o!*02dD!*0b64!*0r8E!*0m=!*028E8E!*2p",
			bold: "3L4N5I8E6PcRbm3b62626U8E4u5u4u6j915J7B798b7j8A7o8n8y4u4u8E*0276dNatalakcm9q8PbAcY675Hbr91eDbQcZa2cYb18f9Jb/anflaK9F9d5z6j5z8E7Q6q8o9x7A9I8q5y8x9Z5c4W9x59eEa09n9z9t6O79669P86bX8m807Y5F5x5F8E3L4j768h8K8d5G8P6qcs5x858E5u6u6q5n8E5E5E6q9H9o4u6q5E6285cU*026/=at*04eu==9q*02=67*02b+==cZ*038EcZ=b/*02=a7aB=8o*04cx==8q*02=5c*029r==9n*038E9n=9P*02=9x=*058q=*08aNcm9I=*0jcY9Z=*05694V=5cbn9P=*039A=*046e916G915g=*05c3bQ9L=*05ftdS=*0d9I=9I=9I66=*0a9R=*0a5b~f*0h8E~f*0cfjbD~f*0ceHbR~f*18=*05~f*0n==9I=~f*0P~5*1R6q6q~56q~5*0d6q*05~5*0B4t3N~5~5!!~f*03=~5!*036q6qat=aMei7t!dv!bzd05catal8Raf9q9dcYd167braoeDbQadcZcIa2!9U9I9FcoaKelcR==9t7z9w4U8P9t9J8l8M7z7a9w9e4U9l8H9H8b7p9k9G9k7y9s7F8PbF8EbCc9=*04~5~f*0d8x72~f*0v9q9qc38RaQ8f67675HfFgJc/brd2asczatanal8Rbt9qgC9zd2d2brbAeDcYcZcIa2ak9IasbIaKcFbnh5habYf9aab9hDaY8o9i8H7v8Y8qd47xagag9h9pb0ad9n9Z9z7A8180b+8ma39ydxdD9ScO8w7Sd895=8q9p=7G795c5c4Wczdf9U=*02a0~f~fbz9S~f*0dcQ9naM8u~f*0c00*06~f*058Q7n~f*3J=*05~f*0l~5~5~f~5=*0VfjbDfjbDfjbDfjbDfjbD=*03eHbReHbReHbReHbReHbR=*07~5*057QfE7QfE5d3W2D7Q3W381j00*045u5u~57QfEg3~5~53x3x3M~56c6c6w~58F9q4V~5!!bM!*0200*0438iD~5*03!*034U4U!!7v~5!*042t~5~5!*02~5*0k3u00*04!00*095E!*025E*083Q3Q6K5E*0c3Q3Q!*0g~5*0a8E84~5*0i!*0f00*0w!*0x7j!!f+cs!*09aS!*02=!*06e7!*0L~a!*0L~5*03!*0j~5!*1o8E!*02af!*07cW!a78E!!2t!*024u9A!*02dD!*0b6B!*0r8E!*0m=!*028E8E!*2p",
			italic: "3I4j5p8E6UcUbt2Y5L5N6N8E405i40698r4Q7c79877h8t7z8p8t40408E*026Pdbal9ba5bK8V8gaBcc5i4Uag8xdYbmcb8+cb9M7Z9qbqarfHa49g8T5p695p8E7Q6q828279876/4J7Y8C4g46804ed28K8b8a7+636C5E8I79aT7M7w7C5w5s5w8E3I40767A8E8d5G8s6qcs4+7L8E5i6s6q5n8E5E5E6q8q8Y3Q6q5E4/7LcU*026K=al*04e2==8V*02=5i*02bK==cb*038Ecb=bq*02=919e=82*04bo==6/*02=4g*028f==8b*038E8b=8I*02=82=*0f9abK87=*0jcc8C=*055b==4ga98m=*0385=*045h8x538x4e=*05a1bm8x=*05f5cj=*0h9q5O=*0m49~g*0h83~g*0cd99L~g*0cd4ai~g*18=*05~g*0n=*03~g*0P~6*1R6q6q~66q~6*0d6q*05~6*0B473u~6~6!!~g*03=~6!*036q6qal40aldE6K!cD!bAcT4lal9b8ra38V8Tcccb5iagaidYbo9DcbbW8+!9u9q9gbfa4cWcv==8B6f853+7J8B8u6Z7J6f65857R3+7Q7Z8r726j7S8z7+6x8w6D7Ja97laraB=*04~6~g*0d8k6O~g*0v8V8Vbm8raa7Z5i5i4UeAfKcmarck9UbLal9a9b8raZ8Vfv8uckckaraXdYcccbbW8+a59q9Ub0a4bUapfZg7b5dt91atgra2828f7n6o8g6/e86O8I8I8a8ob78R8b8K8a79d27waD7M8J7Vc0c58cbd7C7cbH84=6/8i=7a6C4g4g46bDbW8C=*028I~g~gaFbW~g*0db+8bay7z~g*0c00*06~g*058l6y~g*3J=*05~g*0l~6~6~g~6=*0Vd99Ld99Ld99Ld99Ld99L=*03d4aid4aid4aid4aid4ai=*07~6*057QfE7QdV4E3u2k7Q3W381j00*045i5i~67QfEg3~6~63b3b3p~65D5D5W~68F9q4V~6!!a+!*0200*0438iw~6*03!*034I4I!!6W~6!*042t~6~6!*02~6*0k3u00*04!00*095E!*025E*083Q3Q5r5E*0c3Q3Q!*0g~6*0a8E84~6*0i!*0f00*0w!*0x7e!!e9cs!*09a+!*02=!*06e7!*0L~c!*0L~6*03!*0j~6!*1o8d!*02ab!*07ci!9M8E!*053Q9o!*02dD!*0b64!*0r8E!*0m=!*028E8E!*2p",
			boldItalic: "3B4N5G8E6UcRbV3960626U8E4u5d4u6j915J7B798b7j8A7o8n8y4u408E*0276dNar9Xamcq9l8JbncY655GbD8+ezbgcQ9EcQaL8y9Gbuanf4at9E9o5z6j5z8E7Q6q938/7F95825A8X9z534V914/ec9H9a958+6U776u9G7+bT8t887Y5x*028E3B4j768h8K8d5G8Y6qcs5/7+8E5d6u6q5n8E5E5E6q9o9z4k6q5E627+cU*026/=ar*04ew==9l*02=65*02cq==cQ*038EcQ=bu*02=9Kak=93*04cI==82*02=53*029k==9a*038E9a=9G*02=8+=*04as=*09ascq95=*0jcY9z=*0853bK9X=*0397=*046l8+6z8+4/=*05bZbg9u=*05fEdy=*0h9G6u=*0m4Z~h*0h8E~h*0ceSbt~h*0ce4bZ~h*18=*05~h*0n=*03~h*0P~7*1R6q6q~76q~7*0d6q*05~7*0B4t3N~7~7!!~h*03=~7!*036q6qar4uaHei7r!dm!bxdt5aar9X8Ra89l9ocYcX65bDaoezbga3cQcT9E!9P9G9EbZateacG==9S76964L8E9B9A7U8J766V968N4L8P8o9o7P7f959p90719G7z8Ebj8ubzbE=*04~7~h*0d8x6U~h*0v9l9lbR8Ram8y65655Gf0gecQb3d3afcxar9S9X8Rbt9lfZ91d3d3b3btezcYcQcT9Eam9GafbtatcHb0gRg/bueM9HazhKaI939g857l9d82eX7p9G9G9g8/bT9O9a9H957Fec88bF8t9H8WdGdK91cL8u7vdc8R=829f=7G7753534Vcod19z=9O=9G~h~haUc+~h*0dct9aau89~h*0c00*06~h*058R7b~h*3J=*05~h*0l~7~7~h~7=*0VeSbteSbteSbteSbteSbt=*03e4bZe4bZe4bZe4bZe4bZ=*07~7*057QfE7QfE5d3W2D7Q3W381j00*045d5d~77QfEg3~7~73s3s3M~767676t~78F9q4V~7!!bM!*0200*0438iD~7*03!*034N4N!!7v~7!*042t~7~7!*02~7*0k3u00*04!00*095E!*025E*083Q3Q6k5E*0c3Q3Q!*0g~7*0a8E84~7*0i!*0f00*0w!*0x7j!!fTcs!*09aS!*02=!*06e7!*0L~d!*0L~7*03!*0j~7!*1o8B!*02a8!*07cW!a08E!*054k9A!*02dD!*0b6B!*0r8E!*0m=!*028E8E!*2p"
		},
		{
			name: "Book Antiqua",
			lineHeight: 1205.56640625,
			descent: 282.2265625,
			regular: "3W4m5P9u7Qd8ca3g5d5d659u3W5d3W9u7Q*093W3W9u*026YbHca9zb5c69z8IbXd05h5dbm9zeOc/ci9scias8d9BcabifEar*025d9u5d9u7Q5d7Q8F6Y9z7v5d8I964z3G8I4zdP968y9p8M6b6E569r8Rd2848I7Q5d9u5d9u3W4m7Q7Q9u7Q9u7Q5dbH5d7Q9u5dbH7Q6g8B4S4S5d909Q5d5d4S5d7Qcj*026Y=ca*04eM==9z*02=5h*02c6==ci*039ud1=ca*02=9s8I=7Q*04bS==7v*024v*038y==8y*038B8I=9r*02=9p=*0fbqc69z9z=*0id096=*084vau8d=*038A=*046v9z5x9z4z=*05bTcl93=*05fCcX=*0g6S9B56==cc=*0dar=*044z~e*0h7Q~e*1C=*05~e*1f!*1R5d5d!5d!*0d5d3W5d4V5d5Y!*0B~e~e!*03~e*03=!*045d5dca=aze46a!cQ!bIbZ4+ca9z8hap9zard0ci5hbmcaeOc/9/cicG9s!a99BarbqardDbA==9y6q8X4+8E9y8+8q8C6q6U8X7+4+8s899o8z6U8y9u8W6z8v6L8Eal8bbUaJ=*04!~e*0M9zbO8AaY8d5h5h5dfagrbSbm~ebbcKca9z9z8AbM9zfY8Qd0d0bmbseOd0cicK9sb59BbbdkarcKbShhhjaMec9haYhIas7Q8P7G6S8U7vby6q9S9S8u8OaS9S8y9B9p6Y7w8Id2849G8VdLdQ8Ubw7K7ncw8f~e=8U=726E4z4v3GbScS96=~e=9B~e*0y00*06~e*057m5P~e*3J=*05~e*0l!!~e!~e*1h==~e*05!*057QfE7QfE5d3W2D7Q3W381j00*04!5d!7QfEbK!7Q4m*037Q*02!7Q7Q9u!*02fE!*0200*0438hU!3g5P!*045b5b!7P!7Q!*042D!*0p3u00*04!00*09!*0e6o!*0y8I7Q!!iA!*037Q!*0y00*0w!*0jbI!*0c6W!!hl!*0afj!*02c0!*069o!*0Hcj*03~8!*0LfE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b99u!!2D!*023W8B!*02b9fj!*089d!4i!*0r8B!*0m8B9u!!8B8B!*2p",
			bold: "3W4m6i9u7QdVd13z5d5d6Y9u3W5d3W4E7Q*093W3W9u*026YbHcaarbid19z8Id1d16565ca9zfEd1d19zd1bi9zarcacafEar*025d9u5d9u7Q5d7Q9z6Y9z7Q658I9z5d5d9z5ddV9z8I9z9z656Y5d9z8Id17Q8I7Q4S9u4S9u3W4m7Q7Q9u7Q9u7Q5dbH6S7Q9u5dbH7Q6g8B5F5F5d90a15d5d5F7E7QdVdWdV6Y=ca*04fE==9z*02=65*02d1*069ud1=ca*02=9z9z=7Q*04ca==7Q*02=5d*028I==8I*038B8I=9z*02=9z=*0fbyd19z9z=*0id19z=*085dcaaq=*039A=*04719z6b9z5d=*05cJcQ9I=*05fEd1=*0g6Aar5d=*0gar=*045d~f*0h7Q~f*1C=*05~f*1f!*1R5d5d!5d!*0d5d*05!*0B~f~f!*03~f*03=!*045d5dca=atd/74!cZ!bVbV5ucaar8MbG9zard1d165cacafEd1amd1c+9z!9NarareoareTbU==9C7a9j5u8W9C8P8c8M7a7m9j7F5u9y839y8v7m8I9N8T7m91758Wbr8kc+cc=*04!~f*0M9zcf8Ibh9z65*02fVgecnca~fbKd1caanar8IbL9zh79zd9d9cab+fEd1*029zbiarbKepard3cpiwiwbHfKabbhiZbi7Q8Z8L769c7Qdr7aalal9y9Mbwag8Iag9z6Y7T8Id57Qag9KeEeE9Gd98w7qdl96~f=9f=6Y6Y5d*02cWdr9z=~f=ag~f*0y00*06~f*058d6p~f*3J=*05~f*0l!!~f!~f*1h==~f*05!*057QfE7QfE5d3W2D7Q3W381j00*04!5d!7QfEbK!7Q4m4m5d4m7Q*02!7Q7Q9u!*02fE!*0200*0438fE!3z6i!*046565!97!7Q!*042D!*0p3u00*04!00*09!*0e6H!*0y8I7Q!!jf!*037Q!*0y00*0w!*0jch!*0c6i!!hE!*0afC!*02c0!*069o!*0HdV*03~a!*0LfE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b99u!!2D!*023W8B!*02b9fj!*089d!4i!*0r8B!*0m8B9u!!8B8B!*2p",
			italic: "3W5d7Q9u7QdVca5d*02659u3W5d3W4E7Q*093W3W9u*027QbHbi9zarca9z8Ibica5d5dar8IeMcaca9zcaar8I9zcabieMbiarar5d9u5d9u7Q5d6Y7f6n7Q654m7Q7Q4m4m6Y4mca8I6Y7Q7f65655d8I7Qbi7Q7Q6Y5d9u5d9u3W5d7Q7Q9uar9u7Q5dbH5d7Q9u5dbH7Q6g8B4S4S5d907Q5d5d4S5d7Qcj*027Q=bi*04eJ==9z*02=5d*02ca*069uca*04=9z7Q=6Y*049+==65*02=4m*026Y==6Y*038B6Y=8I*02=7Q7Q=*0e9dca7Q=*0c7P=*05ca7Q=*084maq8I=*037x=*045l8I5b8I4m=*05aXc18p=*05g4at=*0g5W9z5d=*0gar=*044m~g*0h7Q~g*1C=*05~g*1f!*1R5d5d!5d!*0d5d*05!*0B~g~g!*03~g*03=!*045d5dbi=aBdg6h!cb!bPce4mbi9z88ai9zarcaca5darbieMcaaecabA9z!9l9zarcQbibica==775R8y4m7J777U7L6Z5R6I8y7v4m7y7M8M7z6B6Y8d7c6q7r6q7J9Y7Yaqa8=*04!~g*0M9zb+89ar8I5d*02eNfAbmar~gavbFbi9v9z89bb9zeO8LbRbRarbbeMcacabF9zar9zavcTbibFbwfRfRaSel9aaJgx9I6Y79736a7265b35S8I8I7A7FaD8j6Y8I7Q6nca7QbP7Q8I8bcrcr6w9W6q6xal7R~g=7F7f6n654m*029Cah7Q=~g=8I~g*0y00*06~g*057X5t~g*3J=*05~g*0l!!~g!~g*1h==~g*05!*057QfE7QdV4E3u2k7Q3W381j00*04!5d!7QfEbK!7Q4m*037Q*02!7Q*02!*02fE!*0200*0438fE!5d7Q!*045d5d!8r!7Q!*042D!*0p3u00*04!00*09!*0e68!*0y8I7Q!!gI!*037Q!*0y00*0w!*0jb3!*0c6k!!hd!*0afE!*02c0!*069o!*0Hcj*03~c!*0LfE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b99u!!2D!*023W8B!*02b9fj!*089d!4i!*0r8B!*0m8B9u!!8B8B!*2p",
			boldItalic: "3W5d7Q9u7QdVd13W5d5d6Y9u3W653W4X7Q*093W3W9u*026Yd1biaraJca9z8Icaca6565bi9zeMcad1ard1bi8I9zcaarfEbi9zar5d9u5d9u7Q5d8I8p6Y8I6Y5d7Q8I5d5d8I5dd18I*028p656Y658I8Id17Q8I7Q5d9u5d9u3W5d7Q7Q9u7Q9u8I5dbH5d7Q9u65bH7Q6g8B5F5F5d908I5d5d5F5d7QdV*026Y=bi*04eM==9z*02=65*02caca=d1*039ud1=ca*02=ar8I*06by=6Y*03=5d*028I*068B8I*07=*0eaoca8I=*0jca8I=*085dcaaq=*038K=*046O9z6N9z5d=*05bucI8M=*05eMca=*0g6x9z65=*0m4x~h*0h7Q~h*1C=*05~h*1f!*1R5d5d!5d!*0d5d*05!*0B~h~h!*03~h*03=!*045d5dbi=aWdx7i!cT!bxc85dbiar8ian9zarcad165bibieMcaacd1bUar!9o9z9zeybidHc2==8N7w8u5d8+8N8C8n8M7w738u945d8M7W8M8M738I9b8M75987y8+bA8LbdbI=*04!~h*0M9zbR8maJ8I656l65g8g5bybi~harc1biaqar8mbL9zhp9ac4c4bibPeMcad1bSaraJ9zarevbibSbDi5hHbXfraqaBi2b18I8I8k6L8H6YcC6k8I8I8Q88b38Y8I*026Yd18IcV7Q8I8ocEcE7EbJ7B7occ8A~h=8w7E6Y6Y5d*02aSbC8I=~h=8I~h*0y00*06~h*05855L~h*3J=*05~h*0l!!~h!~h*1h==~h*05!*057QfE7QfE5d3W2D7Q3W381j00*04!65!7QfEbK!7Q4m4m3W4m7Q*02!8I8I9u!*02fE!*0200*0438fE!3W7Q!*045d5d!9W!7Q!*042D!*0p3u00*04!00*09!*0e68!*0y8I7Q!!jg!*037Q!*0y00*0w!*0jcd!*0c69!!hu!*0afE!*02c0!*069o!*0HdV*03~d!*0LfE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b99u!!2D!*023W8B!*02b9fj!*089d!4i!*0r8B!*0m8B9u!!8B8B!*2p"
		},
		{
			name: "Franklin Gothic Book",
			lineHeight: 1133.7890625,
			descent: 217.28515625,
			regular: "3W4d4Y9a9abgar2R4B4B9a9a3W*02769a*093W3W9a*027VbF8o9s93a78A7Ya7a33W5S9Q7GcGah9T8L9T9B8V7B9u8pcN887+894B764B7Q*028h8p7i8r894I7H8s3B3B7R3CcK8u888m8o5a7g4Q8u72ao6E6v6D4B7Q4B9a3W4d9a9aar9b7Q9a7Qc55t5o9a3Wc57Q9a9a63637Q8n9a1J7Q635o5odM*027V=8o*04ea==8A*02=3W*02a7==9T*039a9T=9u*02=8S8T=8h*04d9==89*02=3B*0286==88*039a88=8u*02=8m=8D=*0d9Ra78r=*0ja38s=*083B9I77=*037R=*044W7G5j7G3C=*05aza38u=*05f3dl=*0g587B4Q=*0m9a~8*0h9a~8*1C=*05~8*1f!*1R7Q7Q!7Q!*0d7Q*05!*0x~8*07!!~8*03=~8!*037Q7Q8u=8Aa33W!9T!7+9Z3v8o9s6Z998A89a39T3W9Q8LcGah7X9T9K8L!7F7B7+bq88bV9Z==976Y8k3v7X978s6H806Y5G8k8c3v7x6t8n726q888m8h747+6k7X9O70aEaw=*04~8*0N8n9B6G9d8V3W3W5Screh9I9s~880a38o929s6G9A8Acc8wabab9Q8LcGa39T9R8L937B80bq88a69fe8ef9McD8C9ddQ9r8h8i8c5E7v899+6R8k8k7p6TaO8n88868m7i5w6v9O6E847Fb+c17YaG7j7rbF7V~8=7W=7r7g3B*029ObT7X=~86q84~8*0y00*06~8*056Z5E~8*3J=*05~8*1H==~8*0b7QfE8IfE5d3W2D8I4m381j00*04!3W!9aarar!7Q3W*036h*02!9a9aar!*02bF!*0200*0438gB!2V4Y!*043m3m!7Q!9a!*041G!*0p3u00*04!00*09!*0e5B!*0y7Y9b!!f7!*039a!*0d~9~9!~9~9!*0f00*0w!*0jel!*0c9a!!fE!*0ac9!*02c0!*069o!*0HdM*03~8!*0LfE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b99a!!1G!*021J8B!*02b9fE!*08bf!4i!*0r8B!*0m8B9a!!8B8B!*2p",
			bold: "3W4x5g9u9ubAaL394V4V9u9u4e*027q9u*094e4e9u*028dbZ8I9M9nar8U8garan4e6aa87+c+aBab93ab9V9d7V9O8Jd58s8i8t4V7q4V88*028B8J7C8L8t507/8M3V3V893Wd28O8s8G8I5u7A588O7maI6Y6P6X4V884V9u3W4x9u9uaL9v889u88cp5N5I9u4ecp889u9u6n6n888H9u21886n5I5Ie4*028d=8I*04eu==8U*02=4e*02ar==ab*039uab=9O*02=9a9b=8B*04dt==8t*02=3V*028q==8s*039u8s=8O*02=8G=8X=*0da9ar8L=*0jan8M=*083Va07r=*0389=*045e7+5D7+3W=*05aTan8O=*05fndF=*0g5s7V58=*0m9u~a*0h9u~a*1C=*05~a*1f!*1R8888!88!*0d88*05!*0x~a*07!!~a*03=~a!*0388888O=8Uan4e!ab!8iah3P8I9M7h9t8U8tanab4ea893c+aB8faba293!7Z7V8ibK8scdah==9r7g8E3P8f9r8M6/8k7g5+8E8w3P7R6N8H7m6K8s8G8B7o8i6E8fa67kaYaQ=*04~a*0N8H9V6+9x9d4e4e6acLeBa09M~a8kan8I9m9M6+9U8Ucw8Qavava893c+anaba9939n7V8kbK8saq9zeseza4cX8W9xe89L8B8C8w5Y7P8tai798E8E7J7bb68H8s8q8G7C5Q6Pa66Y8o7Zcicl8ga+7D7LbZ8d~a=8e=7L7A3V*02a6cb8f=~a6K8o~a*0y00*06~a*057h5Y~a*3J=*05~a*1H==~a*0b7QfE8IfE5d3W2D8I4m381j00*04!4e!9uaLaL!884e*036B*02!9u9uaL!*02bZ!*0200*0438gV!3d5g!*043G3G!88!9u!*041+!*0p3u00*04!00*09!*0e5V!*0y8g9v!!fr!*039u!*0d~b~b!~b~b!*0f00*0w!*0jeF!*0c9u!!fY!*0act!*02ck!*069I!*0He4*03~a!*0LfY88fY88fY88!*0h88!*1o82!*029U!*07db!bt9u!!1+!*02218V!*02btfY!*08bz!4C!*0r8V!*0m8V9u!!8V8V!*2p",
			italic: "3W4b4R9a9ac5ar2O4B4B9a9a3W*027l9a*093W3W9a*027ObH8Q9z90a88L7Xabag3U5N9L7ZcLafa28J9/9V8Y7E9D8gcI8r808d4B7l4B7Q*028n8q7q8q884I7T8w3B3B7G3BcN8A898o8l5j7d4P8u6Yay6Q6F6z4B7Q4B9a3W4c9a9aar9a7Q9a7Qc55w5h9a3Wc57Q9a9a63637Q9a9a217Q635n5hdM*027O=8Q*04dG==8L*02=3U*02a8==a2*039aa2=9D*02=8P8G=8n*04d9==88*02=3B*027/==89*039a89=8u*02=8o=*0f9Da88q=*0jag8w=*083B9B77=*037H=*044P7Z5k7Z3P=*05aJag8A=*05fhe0=*0g4/7E4P=*0m9a~c*0h9a~c*1C=*05~c*1f!*1R7Q7Q!7Q!*0d7Q*05!*0x~c*07!!~c*03=~c!*037Q7Q8n=8Lag3U!a2!89ah3C8Q9z76908L8daga23U9L8EcLaf86a29V8J!7P7E80bH8rc9ah==9n718w3C879n8y6M87715S8w8i3C7H6y8z6Y6D898u8p7p856d87a675aMaF=*04~c*0N8x9M769u8Y3U3U5Nclew9S9m~c7Paa8Q9a9z6O9E8LbN8Eakak9L8EcLaga29Z8J907E7PbH8rag9nemev9XcO8J9oe29E8n8q8i5K7r889e6W8w8w7H6yb18t898i8o7q5A6F9l6Q8h7wcfcj83aV7r7ubK81~c=82=7C7d3B*029xc1827z~c6m8f~c*0y00*06~c*05735K~c*3J=*05~c*1H==~c*0b7QfE8IfE5d3W2D8I4m381j00*04!3W!9aarar!7Q3W*035S*02!9a9aar!*02bK!*0200*0438hI!2O4R!*043j3j!7Q!9a!*041G!*0p3u00*04!00*09!*0e5E!*0y7X9a!!dZ!*039a!*0d~9~9!~9~9!*0f00*0w!*0jel!*0c9a!!fE!*0acr!*02c0!*069o!*0HdM*03~c!*0LfE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b99a!!1G!*02218B!*02b9fE!*08bf!4i!*0r8B!*0m8B9a!!8B8B!*2p",
			boldItalic: "3W4v599u9ucpaL364V4V9u9u4e*027F9u*094e4e9u*0286b/989T9kas938favaA4c65a38hd3azam91ajad9g7Y9X8Ad08L8k8x4V7F4V88*028H8K7K8K8s508b8Q3V3V7+3Vd58U8t8I8F5D7x578O7gaS786Z6T4V884V9u3W4w9u9uaL9u889u88cp5Q5B9u4ecp889u9u6n6n889u9u2l886n5H5Be4*0286=98*04d+==93*02=4c*02as==am*039uam=9X*02=978+=8H*04dt==8s*02=3V*028j==8t*039u8t=8O*02=8I=*0f9Xas8K=*0jaA8Q=*083V9V7r=*037/=*04578h5E8h47=*05b1aA8U=*05fBek=*0g5j7Y57=*0m9u~d*0h9u~d*1C=*05~d*1f!*1R8888!88!*0d88*05!*0x~d*07!!~d*03=~d!*0388888H=93aA4c!am!8taB3W989T7q9k938xaAam4ca38Yd3az8qamad91!877Y8kb/8LctaB==9H7l8Q3W8r9H8S748r7l6a8Q8C3W7/6S8T7g6X8t8O8J7J8p6x8raq7pb4aZ=*04~d*0N8Ra47q9O9g4c4c65cFeQaa9G~d87au989u9T769Y93c58YaEaEa38Yd3aAamah919k7Y87b/8LaA9HeGePafd6919Iem9Y8H8K8C627L8s9y7e8Q8Q7/6Sbl8N8t8C8I7K5U6Z9F788B7QczcD8nbd7L7Oc28l~d=8m=7W7x3V*029Rcl8m7T~d6G8z~d*0y00*06~d*057n62~d*3J=*05~d*1H==~d*0b7QfE8IfE5d3W2D8I4m381j00*04!4e!9uaLaL!884e*036a*02!9u9uaL!*02c2!*0200*0438i0!3659!*043D3D!88!9u!*041+!*0p3u00*04!00*09!*0e5Y!*0y8f9u!!eh!*039u!*0d~b~b!~b~b!*0f00*0w!*0jeF!*0c9u!!fY!*0acL!*02ck!*069I!*0He4*03~d!*0LfY88fY88fY88!*0h88!*1o82!*029U!*07db!bt9u!!1+!*022l8V!*02btfY!*08bz!4C!*0r8V!*0m8V9u!!8V8V!*2p"
		},
		{
			name: "Gill Sans MT",
			lineHeight: 1159.66796875,
			descent: 230.46875,
			regular: "4m4f5y988uaA9N2Y53536x983r533r4p7Q*093r3B98*025dfOar8Pb4bK7Q7lbAbp3W3Wag7GcdcdcT7+cT9s7a9sb49sgib49sa65d4p5d7l8E5d6H7Q6S7+7v3W6H7Q3r3r7v3rc37Q8E7Q7Q6c615d7Q6Sbf7Q6S6x5d445d974m4f6S8j8E8E446m5dbA4p7G9853bA8E6c9853535d8E8u5d5d535J7Gdc*025d=ar*04e0==7Q*02=3W*02bK==cT*0398cT=b4*02=7+7Q=6H*04ar==7v*02=3r*028P==8E*03988E=7Q*02=7Q=~8~8=*05~8*03=*029ibK7+~8*05=*03~8*0k3r~8*06==~8~8=4A~8~87G3r==~8~8==~8*06==eld1==~8~8=*03~8~8=*066S~8*07=*03~8*05=*06~8*0i8E~8*2Y!*1R5d5d!5d!*0d5d*05!*0x~8*07!!~8*05!*03~8*06!~8!~8*0j!~8*0s8B~8*3100*06~8*5R7QfE8IfE5d3W2D8I4m381k00*04!53!7QfE!*023r*02!6H6H70!7G7G5y!*02fE!*0200*0438fO!*074V4V!*0836!*0p3u00*04!00*09!*0X9y!*0d~9~9!~9~9!*0f00*0w!*0MfE!*02c0!*0T~8!*2x7K!*029A!*07cT!b9!*0236!*02448B!*02b9!*0b4i!*0r97!*0m97!*029797!*2p",
			bold: "4m4f7v988ubfbK3M61617l984f5d4f4p8E*094f4f98*025TfjcdaWc3cy9X9scJd15d5dbf9DdRdcdHagdHaB9sbfcTbfifcJb4aW6S4p6S987Q5d8j977Q978E4K8u974f4f8E4fe+979i9797706H6m977+cd8E7+89614p61984m4f7Q898E8E4p895dbA5y9i985dbA7Q6c985d*029D8E5d*026c9ie0*025T=cd*04gN==9X*02=5d*02cy==dH*0398dH=cT*02=ag9s=8j*04cd==8E*02=4f*029D==9i*03989i=97*02=97=~a~a=*05~a*03=*02aWcy97~a*05=*03~a*0k4f~a*06==~a~a==~a~a9D4f==~a~a==~a*06==h6dH==~a~a=*03~a~a=*068P~a*07=*03~a*05=*06~a*0i8E~a*2Y!*1R5d5d!5d!*0d5d*05!*0x~a*07!!~a*05!*03~a*06!~a!~a*0j!~a*0s8B~a*3100*06~a*5R7QfE8IfE5d3W2D8I4m381j00*04!5d!7QfE!*024f*02!8P*02!7+7+5y!*02fE!*0200*0438gX!*075353!*083r!*0p3u00*04!00*09!*0X9P!*0d~b~b!~b~b!*0f00*0w!*0MfE!*02c0!*0T~a!*2x7K!*029A!*07cT!b9!*023r!*024f8B!*02b9!*0b4i!*0r98!*0m8B!*028B8B!*2p",
			italic: "4m3W5y987Qb4aM2Y4A4A7098363W364p89*09363698*025yfO897+8Eag7+6x9saW3M3M8P6xcJaMag70ag8j7a7+9X7+evar7G975d4p5d7l7Q5d7l7l617l6S4f6H7l2Y2Y7a2YbA7l707G7l4V5y4p7l5T9D6H5T7a5d445d984m3W617l8E8E447G5dbA4V6S983WbA7Q6c9853535d8E8u5d5d534K6Sdc*025y=89*04d1==7+*02=3M*02ag==ag*0398ag=9X*02=707Q=7l*04a6==6S*02=2Y*0270==70*039870=7l*02=7G=~c~c=*05~c*03=*0297ag7l~c*05=*03~c*0k2Y~c*06==~c~c=4K~c~c6x2Y==~c~c==~c*06==f9bf==~c~c=*03~c~c=*066x~c*07=*03~c*05=*06~c*0i8E~c*2Y!*1R5d5d!5d!*0d5d*05!*0x~c*07!!~c*05!*03~c*06!~c!~c*0j!~c*0s8B~c*3100*06~c*5R7QfE8IfE5d3W2D8I4m381j00*04!3W!7QfE!*0236*02!6m*02!7v7a5y!*02fE!*0200*0438fO!*073B3B!*083g!*0p3u00*04!00*09!*0X8/!*0d~9~9!~9~9!*0f00*0w!*0MfE!*02c0!*0T~c!*2x7K!*029A!*07cT!b9!*023g!*02448B!*02b9!*0b4i!*0r98!*0m97!*029797!*2p",
			boldItalic: "4m447v987Gbfbp3M5o5o7v98445o444p8j*09444498*0253fj9N9XaMbK977GbAco4K4Ka68jeQcdd197d1a6899HbK8EeQaB8P9X5T4p5T977Q5d8E8u7l8u7+5d7G8E44447Z44cT8E8P978E5J5T5J8E7abp8j7G7a614p61984m447l8u8E8E4p8E5dbA5J8u985obA7Q6c9853535d9D8E5d5d535T8udc*0253=9N*04fu==97*02=4K*02bK==d1*0398d1=bK*02=978E*06aM==7+*02=44*028E8E=8P*03988P=8E*02=97=~d~d=*05~d*03=*02aMbK8u~d*05=*03~d*0k44~d*06==~d~d=6c~d~d8j44==~d~d==~d*06==gsco==~d~d=*03~d~d=*068j~d*07=*03~d*05=*06~d*0i8E~d*2Y!*1R5d5d!5d!*0d5d*05!*0x~d*07!!~d*05!*03~d*06!~d!~d*0j!~d*0s8B~d*3100*06~d*5R7QfE8IfE5d3W2D8I4m381j00*04!5o!7QfE!*0244*02!7G*02!8j7+5y!*02fE!*0200*0438gX!*074f4f!*082Y!*0p3u00*04!00*09!*0X8/!*0d~b~b!~b~b!*0f00*0w!*0MfE!*02c0!*0T~d!*2x7K!*029A!*07cT!b9!*022Y!*02448B!*02b9!*0b4i!*0r8B!*0m8B!*028B8B!*2p"
		},
		{
			name: "Impact",
			lineHeight: 1219.7265625,
			descent: 210.9375,
			regular: "2M4e5O9O8zaR902V4V4V4p8l2E4C2V6c8o5Z7S8i7Q8p8u688n8u3a3a8l*028dc77Y8E8G8F6w6e8D8H4w5b8p5Ybd8u8y7S8y8r857d8z8bcK7y7p6d4q6c4q7z8E5d7U887L887/4x878c4i4o7u4ic38b7/87865C7n4N8a6Rat6O705v5O4f5O8d2M4e858n8A7p4f7A5dcg555P8l4Ccg8E5r8l4+565d7n905d5d3R5a5P9Ma5aP8d=7Y*04b9==6w*02=4w*028L==8y*038l8y=8z*02=7S8C=7U*04bN==7/*02=4i*027/==7/*038l7/=8a*02=87=*0fak8L88=*056v=*0c8H8c=*084i9O8F=*0385=*036M6J6G6G5/4u=*05af8F8b=*05aMbZ=*0g7d7d4M=*0m4w~8*0h6X~8*1C=*05~8*0n=*03~8*0P~0*1R5d5d~05d~0*0d5d*05~0*0x~8*07!!~8*03=~8!*035d5d7Y3s8paB6q!a0!a0af4M7Y8E5Y7Y6w6d8H8y4w8p8cbd8u7d8y8H7S!6a7d7pct7ych8N==8c848b4M8a8c8e7Q7+84608b7/4M8a7C8f6R5+7/8w8563885L8ac07NbAcf=*04~8*0N6wal6s8G854w4w5bd8cIal8o~8708H7Y8E8E6sac6wbA8i8t8t8o98bd8H8y8H7S8G7d70ct7y8W8VcTd89Jc+8E8icK8q7U8a825p9L7/bH7V8L8L7/8NaH8l7/8k877L6K70c16O8F83cxcS9hcg8a7Qc67/~8=8n=7Q7n4i4i4ocUcg8n=~8=89~8*0y00*06~8*056K6k~8*3J=*05~8*1H==~8*0b7QfE8IfE5d3W2D8I4m381j00*04!4C~07QfEfE~08E2E*035p*02~08v8v5s!*028F!*0200*0438g1!2V64~0!*033636!8w~09a!*041Z!*0o~03u00*04!00*09!*0352!*095d!*0v~0*026e8n~0~0k4~0*038j~0*0d~9~9!~9~9!*0f00*0w!*0jaR!*0c9a!!dB!*0acf!*02c0!*069o!*0Harbwbz9T~8!*0LfE7QfE7QfE7Q!*0h7Q!*1o7G!*029D!*07cT!b48l!!1Z!*023s8B!*02b9fE!*08bf!4i!*0r8d!*0m=8l!!8l8l!*2p",
			bold: "2M4y66a68Tb99k3d5d5d4J8F2Y4W3d6w8I6h8a8C888J8O6s8H8O3u3u8F*028xcr8g8Y8+8Z6Q6y8X8/4Q5v8J6gbx8O8S8a8S8L8p7x8T8vd27S7J6x4K6w4K7T8Y5x8c8s838s8j4R8r8w4C4I7O4Ccn8v8j8r8q5W7H558u79aN767k5P664z668x2M4y8p8H8U7J4z7U5xcA5p678F4WcA8Y5L8F5i5q5x7H9k5x5x495u67a4apb78x=8g*04bt==6Q*02=4Q*0293==8S*038F8S=8T*02=8a8W=8c*04c5==8j*02=4C*028j==8j*038F8j=8u*02=8r=*0faE938s=*056P=*0c8/8w=*084Ca68Z=*038p=*0374716+6+6j4O=*05az8Z8v=*05b4ch=*0g7x7x54=*0m4Q~a*0h7f~a*1C=*05~a*0n=*03~a*0P~1*1R5x5x~15x~1*0d5x*05~1*0x~a*07!!~a*03=~a!*035x5x8g3M8JaV6K!ak!akaz548g8Y6g8g6Q6x8/8S4Q8J8wbx8O7x8S8/8a!6u7x7JcN7ScB95==8w8o8v548u8w8y888i8o6k8v8j548u7W8z796i8j8Q8p6n8s638uck85bUcz=*04~a*0N6QaF6M8+8p4Q4Q5vdsd0aF8I~a7k8/8g8Y8Y6Maw6QbU8C8N8N8I9sbx8/8S8/8a8+7x7kcN7S9e9ddbdsa1di8Y8Cd28K8c8u8m5Ja38jb/8d93938j95a/8F8j8E8r83727kcl768Z8ncRda9BcA8u88cq8j~a=8H=887H4C4C4IdccA8H=~a=8t~a*0y00*06~a*05726E~a*3J=*05~a*1H==~a*0b7QfE8IfE5d3W2D8I4m381j00*04!4W~188fYfY~18Y2Y*035J*02~18P8P5M!*028Z!*0200*0438gl!3d6o~1!*033q3q!8Q~19u!*042h!*0o~13u00*04!00*09!*035m!*095x!*0v~1*026y8H~1~1ko~1*038D~1*0d~b~b!~b~b!*0f00*0w!*0jb9!*0c9u!!dV!*0acz!*02ck!*069I!*0HaLbQbTab~a!*0LfY88fY88fY88!*0h88!*1o7+!*029X!*07db!bo8F!!2h!*023M8V!*02btfY!*08bz!4C!*0r8x!*0m=8F!!8F8F!*2p"
		}
	];
	[
		...Array.from({ length: 95 }, (_, index) => 32 + index),
		...Array.from({ length: 96 }, (_, index) => 160 + index).filter((code) => code !== 173),
		...[
			8364,
			8218,
			402,
			8222,
			8230,
			8224,
			8225,
			710,
			8240,
			352,
			8249,
			338,
			381,
			8216,
			8217
		],
		...[
			8220,
			8221,
			8226,
			8211,
			8212,
			732,
			8482,
			353,
			8250,
			339,
			382,
			376
		]
	].sort((one, other) => one - other).map((code) => String.fromCodePoint(code)).join("");
	//#endregion
	//#region src/text-layout/more-widths.ts
	/**
	* How wide Word draws the characters of Hebrew, the Arabic-Indic and Devanagari digits, Thai, box drawing, blocks,
	* geometric shapes, symbols and dingbats in the fonts of the width tables, plain and bold, and in Calibri's, Cambria's,
	* Arial's, Times New Roman's and Courier New's italics, the font it draws each in, and how far above and below the
	* baseline those fonts make room in a line.
	*
	* Generated by scripts/generate-more-widths.ts from Word's PDFs of scripts/layout-probes/stops2/word-stops-more-widths.ts,
	* saved from Word 16 for Mac. Do not edit by hand.
	*
	* @module
	*/
	/**
	* The characters the widths are for, as ranges of code points: Hebrew; the Arabic-Indic and Eastern Arabic-Indic digits;
	* the Devanagari full stops and digits; Thai; and box drawing, block elements, geometric shapes, miscellaneous symbols and
	* dingbats.
	*/
	var MORE_WIDTH_RANGES = [
		[1424, 1535],
		[1632, 1641],
		[1776, 1785],
		[2404, 2415],
		[3584, 3711],
		[9472, 10175]
	];
	var MORE_WIDTHS = [
		{
			name: "Calibri",
			regular: {
				widths: "!000*0I0LR0000Au0000000FQ0000000V0000!*071jT1d80VC15w1p20Aa0Jp1q71mx0Aa15B1ak13M1rp1qK0Aa0V01oL1hU1h61ky13W1bS1jT15B1Im1uy!*0418q*020C/11o!*0a1fm*0j11a1vH1hu*09!1t01vM1Ck1w91w91F81cW1mV1wV1x+1Hw26G2201x31x31mV1+r28h25j1w91w91rp1LS1kp1vD1yr1yr1yK1yK1KE1J61x31tE1qv1341oB1wi1x31bN1w91Qh1u/1EH1LJ1t01t01iE1630001bN1bN000*06!*031fc0PU1su1cW1531fV1bN1d/000*071u51u51yK1H21Hw1Ox1Ox1AY1UX1UX1LJ1Iq2Cq!*0z1e82sg1e82sg1e8*0a2sg1e8*022sg1e8*022sg1e8*022sg*021e81e82sg1e81e82sg*021e81e82sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg1e81e82sg1e8*072sg1e8*031KJ*0s1e8*032sg*021e8*0b1KJ23/2iz2iz1KJ2iz*021KJ2011JA1r11KJ0S10zu0h11KJ*021NW2iz*0b1uo1uo26B*070Tk0Tk2sg2dy2sg*032qG1N426B26B2sg26B*022qG26B2qG26B*022sg26B*022qG26B*041fQ1lW1sS26B26B1uo26B*071uo1uo26B*0b0Tk26B*072Ll26B*0a2sg*0326B2sg*0422a22a1ds1W523I1T21T21fm1C52sg2sg26B2sg26B1Lz2sg2sg1RU1RU2sg2da24S*022sg24S1e82sg1ND2sg2sg1aS1fG2sg1uy1vi25x2sg1RU1RZ1SJ2sg2sg2cj*072sg*0323I1pc1pc1m42sg1m42sg1Ua1jE1KX20O1nw2sg*0o1GZ1GZ2sg1GZ2sg2sg1GZ2sg0Zh1iX2352dD16w10l13n1vi1vi2bI29q*072sg1/r1/r2sg2sg1RZ*0523I*032cj*051Mt1Mt2sg*051jk2sg1q22sg2sg1/v2sg*031YV28v28v1Iq1Iq2sg1m423S2sg2sg1au1CX2hA2Ge2sg2sg1m4*032nC1m41m41GV*032sg*0U26B2sg*08!2sg*022BO2sg27m1/v2sg*0a1R22sg1/F2sg1/F1/F27d*032sg1GB1KX2a62sg2aO*031/v1/v2sg1/v*0622D2aO2aO2sg2sg2aO*0e2sg2aO2aO2sg2aO*032sg1/m2sg2af*032sg*022aO2sg0CW0N415m0Lo0Lo1hq1hq0Lo1hq1oi1cW2sg2sg1Hn1Rc2d50La0La0MM0MM0L/0L/1g21g21441440La0La0Uf0Uf3fx*091/v*0j2sg*031SJ2sg1SJ26Q2sg*052l/2l/2sg*021uR2sg*041Tg1Tg2sg*021/v2sg*0c",
				fonts: "-*230*0b-1*0L-11-*0b1*06-*071*0c-*0A2-2*08-2*02-2*02-2*02-2*0O3*034*0s3*0i453343*0243*0243*024*033*0b4-3*07--453*03453363*024343*0263*0243*04-*0233-3*07443*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*076*023*046363*046*0b3*0a66336366363*0h633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g-*093*0k6*023*0863*0d63*0d6"
			},
			bold: {
				widths: "!000*0I0LR0000Ct0000000H70000000Wj000!*071lS1dM0Xd16w1pP0C/0Mj1rb1ow0C/15K1ap14n1sp1sb0C/0Wj1rA1ka1j01l/18b1eV1nr15K1MW1vW!*041e3*020Ej13/!*0a1fm*0j11a1vH1hu*09!1Gi1Jh1Ma1Hr1Hr1On1k/1ws1E+1Qh1Uu2jY2ly1IT1IT1uo23I2tk2wD1Hr1Hr1Gi1NM1tj1G81Gr1Gr1O41O41Z81Z81IT1ER1DX1i11Gi1Av1IT1iY1Hw1KE1Av1KX20q1yU1yU1n+1ap0001iY1iY000*06!*031fc0RA1yB1b91b91hU1iX1kS000*071wC1yK1LS1Vp1Ku1VS1VS1Gr2mX1UX24H1VS2z8!*0z1e82vj1e82vj1hb*071e81hb1hb2vj1e81hb1hb2vj1e81hb1hb2vj1e81hb1hb2vj*021hb1hb2vj1hb1hb2vj*021hb1hb2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj1hb1hb2vj1hb*072vj1hg*031KJ*0s1hg*032vo*021hg*0b1KJ2782lI2lI1KJ2lI*021KJ23a1MI1ua1KJ0V90CD0k91KJ*021NW2lI*0b1uo1uo29K*070Tk0Tk2sg2gG2vo*032qG1Qd29K29K2vo29K*022qG29K2qG29K*022vo29K*022qG29K*041jp1lW1sS29K29K1uo29K*071uo1uo29K*0b0Tk29K*072Ot29K*0a2vo*0329K2vo*0425j25j1gA1Zd26Q1W91W91iu1Fd2vo2vo29K2vo29K1OH2vo2vo1V11V12vo2gh27Z*022vo27Z1hg2vo1QK2vo2vo1d/1iO2vo1xG1yr28F2vo1V11V61VS2vo2vo2fs*072vo*0326Q1sk1sk1pc2vo1pc2vo1Xj1mM1O423W1qF2vo*0o1K61K62vo1K62vo2vo1K62vo10p1m426d2gL19E13s16w1yr1yr2eR2cy*072vo22y22y2vo2vo1V6*0526Q*032fs*051PC1PC2vo*051ms2vo1ta2vo2vo22D2vo*032012bE2bE1Lz1Lz2vo1pc26+2vo2vo1dB1G32kJ2Jm2vo2vo1pc*032qL1pc1pc1K1*032vo*0U29K2vo*08!2vo*022EX2vo2au22D2vo*0a1Ua2vo22N2vo22N22N2ak*032vo1JK1O42de2vo2dW*0322D22D2vo22D*0625M2dW2dW2vo2vo2dW*0e2vo2dW2dW2vo2dW*032vo22t2vo2do*032vo*022dW2vo0G20Qc18v0Ox0Ox1ky1ky0Ox1ky1rp1g22vo2vo1Ku1Uk2gc0Oi0Oi0PU0PU0P80P81ja1ja17c17c0Oi0Oi0Xn0Xn3fx*0922D*0j2vo*031VS2vo1VS29Y2vo*052p82p82vo*021x+2vo*041Wo1Wo2vo*0222D2vo*0c",
				fonts: "-*230*0b-1*0L-11-*0b1*06-*071*0c-*0A2-2*08-2*02-2*02-2*02-2*0O3*034*0s3*0i453343*0243*0243*024*033*0b4-3*07--453*03453363*024343*0263*0243*04-*0233-3*07443*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*076*023*046363*046*0b3*0a66336366363*0h633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g-*093*0k6*023*0863*0d63*0d6"
			},
			italic: {
				widths: "!000*0I0LR0000Au0000000FQ0000000V0000!*071j51d80VC15w1p20Aa0Jp1q71mx0Aa15B1ak13M1rp1qK0Aa0V01oL1hU1h61ky13W1az1jT15B1Im1uy!*0418q*020C/11o!*0u11a1vH1hu*09!1t01vM1Ck1w91w91F81cW1mV1wV1x+1Hw26G2201x31x31mV1+r28h25j1w91w91rp1LS1kp1vD1yr1yr1yK1yK1KE1J61x31tE1qv1341oB1wi1x31bN1w91Qh1u/1EH1LJ1t01t01iE1630001bN1bN000*06!*031k/0PU1su1cW1531fV1bN1d/000*071u51u51yK1H21Hw1Ox1Ox1AY1UX1UX1LJ1Iq2Cq!*0z1e82sg1e82sg1e8*0a2sg1e8*022sg1e8*022sg1e8*022sg*021e81e82sg1e81e82sg*021e81e82sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg1e81e82sg1e8*072sg1e8*031KJ*0s1e8*032sg*021e8*0b1KJ23/2iz2iz1KJ2iz*021KJ2011JA1r11KJ0S10zu0h11KJ*021NW2iz*0b1uo1uo26B*070Tk0Tk2sg2dy2sg*032qG1N426B26B!26B*022qG26B2qG26B*02!26B*022qG26B*041fQ1lW1sS26B26B1uo26B*071uo1uo26B*0b0Tk26B*072Ll26B*0a!*0326B!*0422a22a1ds1W523I1T21T21fm1C5!2sg26B!26B1Lz!!1RU1RU!2da24S*02!24S1e8!1ND!!1aS1fG!1uy1vi25x!1RU1RZ1SJ!!2cj*07!*022sg23I1pc1pc1m42sg1m42sg1Ua1jE1KX20O1nw!*0b2sg*0a!!1GZ1GZ!1GZ!!1GZ!0Zh1iX2352dD16w10l13n1vi1vi2bI29q*07!1/r1/r!!1RZ*0523I*032cj*051Mt1Mt!*022sg!!1jk!1q2!!1/v2sg2sg!!1YV28v28v1Iq1Iq!1m423S!!1au1CX2hA2Ge!!1m4*032nC1m41m41GV*03!!2sg*04!!2sg2sg!2sg*04!!2sg!2sg!!2sg*0j!!2sg*04!*0526B!*032sg2sg!2sg2sg!2sg!2sg2BO!27m1/v!*052sg!2sg2sg!1R2!1/F!1/F1/F27d*03!1GB1KX2a6!2aO*031/v1/v!1/v*0622D2aO2aO!!2aO*0e!2aO2aO!2aO*03!1/m!2af*03!*022aO!0CW0N415m0Lo0Lo1hq1hq0Lo1hq1oi1cW!!1Hn1Rc2d50La0La0MM0MM0L/0L/1g21g21441440La0La0Uf0Uf3fx*091/v*0j2sg!*021SJ2sg1SJ26Q2sg*04!2l/2l/2sg*021uR2sg*041Tg1Tg2sg!2sg1/v2sg*0b!",
				fonts: "-*230*0b-1*0L-11-*0b1*06-*071*0c-*0A2-2*08-2*02-2*02-2*02-2*0O3*034*0s3*0i453343*0243*0243*024*033*0b4-3*07--453*034533-3*024343*02-3*0243*04-*0233-3*07443*0b-3*0j-*033-*043*08-33-33--33-3*03-33-3--33-3*02-3*02--3*07-*023*046363*04-*0b3*0a--33-3--3-3*0h-33--3*0h-*026--3-3--3*02--3*04-33--3*03--3*0a--3*04--33-3*04--3-3--3*0j--3*04-*053-*0333-33-3-33-33-*053-33-3-3-3*05-3*02-3*05-3*09--3*0e-33-3*03-3-3*03-*023-3*0a--3*0g-*093*0k-*023*08-3*0d-3*0d-"
			},
			boldItalic: {
				widths: "!000*0I0LR0000Ct0000000H70000000Wj000!*071kN1dM0Xd16w1pP0C/0Mj1rb1ow0C/15K1ap14n1sp1sb0C/0Wj1rA1ka1j01l/18b1d31nr15K1MW1vW!*041e3*020Ej13/!*0u11a1vH1hu*09!1Gi1Jh1Ma1Hr1Hr1On1k/1ws1E+1Qh1Uu2jY2ly1IT1IT1uo23I2tk2wD1Hr1Hr1Gi1NM1tj1G81Gr1Gr1O41O41Z81Z81IT1ER1DX1i11Gi1Av1IT1iY1Hw1KE1Av1KX20q1yU1yU1n+1ap0001iY1iY000*06!*031fc0RA1yB1b91b91hU1iX1kS000*071wC1yK1LS1Vp1Ku1VS1VS1Gr2mX1UX24H1VS2z8!*0z1e82vj1e82vj1hb*071e81hb1hb2vj1e81hb1hb2vj1e81hb1hb2vj1e81hb1hb2vj*021hb1hb2vj1hb1hb2vj*021hb1hb2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj1hb1hb2vj1hb*072vj1hg*031KJ*0s1hg*032vo*021hg*0b1KJ2782lI2lI1KJ2lI*021KJ23a1MI1ua1KJ0V90CD0k91KJ*021NW2lI*0b1uo1uo29K*070Tk0Tk2sg2gG2vo*032qG1Qd29K29K!29K*022qG29K2qG29K*02!29K*022qG29K*041jp1lW1sS29K29K1uo29K*071uo1uo29K*0b0Tk29K*072Ot29K*0a!*0329K!*0425j25j1gA1Zd26Q1W91W91iu1Fd!2vo29K!29K1OH!!1V11V1!2gh27Z*02!27Z1hg!1QK!!1d/1iO!1xG1yr28F!1V11V61VS!!2fs*07!*022vo26Q1sk1sk1pc2vo1pc2vo1Xj1mM1O423W1qF!*0b2vo*0a!!1K61K6!1K6!!1K6!10p1m426d2gL19E13s16w1yr1yr2eR2cy*07!22y22y!!1V6*0526Q*032fs*051PC1PC!*022vo!!1ms!1ta!!22D2vo2vo!!2012bE2bE1Lz1Lz!1pc26+!!1dB1G32kJ2Jm!!1pc*032qL1pc1pc1K1*03!!2vo*04!!2vo2vo!2vo*04!!2vo!2vo!!2vo*0j!!2vo*04!*0529K!*032vo2vo!2vo2vo!2vo!2vo2EX!2au22D!*052vo!2vo2vo!1Ua!22N!22N22N2ak*03!1JK1O42de!2dW*0322D22D!22D*0625M2dW2dW!!2dW*0e!2dW2dW!2dW*03!22t!2do*03!*022dW!0G20Qc18v0Ox0Ox1ky1ky0Ox1ky1rp1g2!!1Ku1Uk2gc0Oi0Oi0PU0PU0P80P81ja1ja17c17c0Oi0Oi0Xn0Xn3fx*0922D*0j2vo!*021VS2vo1VS29Y2vo*04!2p82p82vo*021x+2vo*041Wo1Wo2vo!2vo22D2vo*0b!",
				fonts: "-*230*0b-1*0L-11-*0b1*06-*071*0c-*0A2-2*08-2*02-2*02-2*02-2*0O3*034*0s3*0i453343*0243*0243*024*033*0b4-3*07--453*034533-3*024343*02-3*0243*04-*0233-3*07443*0b-3*0j-*033-*043*08-33-33--33-3*03-33-3--33-3*02-3*02--3*07-*023*046363*04-*0b3*0a--33-3--3-3*0h-33--3*0h-*026--3-3--3*02--3*04-33--3*03--3*0a--3*04--33-3*04--3-3--3*0j--3*04-*053-*0333-33-3-33-33-*053-33-3-3-3*05-3*02-3*05-3*09--3*0e-33-3*03-3-3*03-*023-3*0a--3*0g-*093*0k-*023*08-3*0d-3*0d-"
			}
		},
		{
			name: "Cambria",
			regular: {
				widths: "!000*0I0TD0000Ju0000000Hq0000000LD000!*071be1770Qr11t19E0HA0IK1au1ak0FG16G13C13s1fh1bS0GU0LD1af16Z16Z14Q1bo17U1a119f1vn1e8!*041n31le1jk0wG0W4!*0a1ib*0j!*0c0ZU0+c16Z0+c0+v1bC0Nd0Tu12U0/i14L1f51hz11D12r0X31hU1hq1jr0+v0+F0ZK16k0Xn17U16k16k0Z70Z718x18x10J11D0RC0Rs0ZK0ZK10S0Tk0YX14V14M18+1770ZA0V+0+v0TX0000Iy0Iy000*06!*031mx0qf0WW0Rs0LP0RM0JE12r000*0712U0+R0/81oN1fJ1g01ix12K1jL1es0/L19B1/v!*0z1C12sg1C12sg1e8*071C01e81e82sg1C01e81e82sg1C01e81e82sg1C11e81e82sg1C12sg1e81e82sg1e81e82sg1C02sg1e81e82sg1e81e82sg1G31e81e82sg2sg1e81e82sg1G31e81e82sg2sg1e81e82sg2sg1e81e82sg1e81e82sg1e8*072sg1e8*031KJ*0s1e8*032sg*021e8*0b1KJ23/2iz2iz1KJ2iz*0223/2011JA1r11KJ0S10zu0h11KJ1KJ23/1NW2iz*0b1uo1uo26B*072sg*022dy2sg*032qG1N426B26B2sg26B*022qG26B2qG26B*022sg26B*022qG26B*041kf1tS1iY26B26B1uo26B*071uo1uo26B*0b0Tp26B*072Ll26B*0a2sg*0326B2sg*0422a22a1ds1W523I1T21T21fm1C52sg2sg26B2sg26B1Lz2sg2sg1RU1RU2sg2da24S*022sg24S1e82sg1ND2sg2sg1aS1fG2sg1uy1vi25x2sg1RU1RZ1SJ2sg2sg2cj*072sg*0323I1pc1pc1m42sg1m42sg1Ua1jE1KX20O1nw2sg*0n1pr1tS1GZ2sg1GZ2sg2sg1GZ2sg0Zh1iX2352dD16w10l13n1vi1vi2bI29q*072sg1/r1/r2sg2sg1RZ*0523I*032cj*051Mt1Mt2sg*051jk2sg1q22sg2sg1/v2sg*031YV28v28v1Iq1Iq2sg1m423S2sg2sg1au1CX2hA2Ge2sg2sg1m4*032nC1m41m41GV*032sg*0U26B2sg*08!2sg*022BO2sg27m1/v2sg*0a1R22sg1/F2sg1/F1/F27d*032sg1GB1KX2a62sg2aO*031/v1/v2sg1/v*0622D2aO2aO2sg2sg2aO*0e2sg2aO2aO2sg2aO*032sg1/m2sg2af*032sg*022aO2sg0CW0N415m0Lo0Lo1hq1hq0Lo1hq1oi1cW2sg2sg1Hn1Rc2d50La0La0MM0MM0L/0L/1g21g21441440La0La0Uf0Uf2XR*022XW2XR*051/v*0j2sg*031SJ2sg1SJ26Q2sg*052l/2l/2sg*021uR2sg*041Tg1Tg2sg*021/v2sg*0c",
				fonts: "-*0J7-7--7--7-*087*0q-*047*04-*0a7*0j-*0c8*0L-88-*0b8*06-*078*0c-*0A9-9*08-9*02-9*02-9*02-9*02-9*06-9*06-9*06-9*0m3*037*0s3*0i7-3373*02-3*0273*0277-73*0b773*0766753*03753363*027373*0263*0273*04-*023373*07773*0b73*0j6*0336*043*08633633663363*0363363663363*0263*02663*076*023*046363*046*0b3*0a6--36366363*0h633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g-*093*0k6*023*0863*0d63*0d6"
			},
			bold: {
				widths: "!000*0I0UN0000Q20000000Q20000000Nn000!*071il17J0Vj18A1g20KE0NC1eQ1iJ0My17v15K13/1fV1jk0OV0Nn1aI1fh1c/17q1od1gr1bt18v1HB1gZ!*041te1v91x30DV17U!*0a1nM*0j!*0c0XS10S16N0/811t1d/0OE0Xn12A0+/19r1in1l915p16a0Yk1ib1nH1kS10d11k0+c15T0XS17U15315p10J10J1db1db13H13/0VR0SA0Yu0XS14i0Uh11a15311D18b1oN0XS0Wt14M0SJ0000Io0Io000*06!*031sz0rd0TD0De0Af0Ju0KV0QP000*070TN0Xn0TX1iH1dR1dx1fo0TD1gt1eB0YE1cK20i!*0z1C12vj1C12vj1hb*071C01hb1hb2vj1C01hb1hb2vj1C01hb1hb2vj1C11hb1hb2vj!2vj1hb1hb2vj1hb1hb2vj!2vj1hb1hb2vj1hb1hb2vj!1hb1hb2vj2vj1hb1hb2vj!1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj1hb1hb2vj1hb*072vj1hg*031KJ*0s1hg*032vo*021hg*0b1KJ!2lI2lI1KJ2lI*02!23a1MI1ua1KJ0V90CD0k91KJ1KJ!1NW2lI*0b1uo1uo29K*072vo2vo2sg2gG2vo*032qG1Qd29K29K2vo29K*022qG29K2qG29K*022vo29K*022qG29K*041ni1tS1iY29K29K1uo29K*071uo1uo29K*0b0Tp29K*072Ot29K*0a2vo*0329K2vo*0425j25j1gA1Zd26Q1W91W91iu1Fd2vo2vo29K2vo29K1OH2vo2vo1V11V12vo2gh27Z*022vo27Z1hg2vo1QK2vo2vo1d/1iO2vo1xG1yr28F2vo1V11V61VS2vo2vo2fs*072vo*0326Q1sk1sk1pc2vo1pc2vo1Xj1mM1O423W1qF2vo*0o!1K62vo1K62vo2vo1K62vo10p1m426d2gL19E13s16w1yr1yr2eR2cy*072vo22y22y2vo2vo1V6*0526Q*032fs*051PC1PC2vo*051ms2vo1ta2vo2vo22D2vo*032012bE2bE1Lz1Lz2vo1pc26+2vo2vo1dB1G32kJ2Jm2vo2vo1pc*032qL1pc1pc1K1*032vo*0U29K2vo*08!2vo*022EX2vo2au22D2vo*0a1Ua2vo22N2vo22N22N2ak*032vo1JK1O42de2vo2dW*0322D22D2vo22D*0625M2dW2dW2vo2vo2dW*0e2vo2dW2dW2vo2dW*032vo22t2vo2do*032vo*022dW2vo0G20Qc18v0Ox0Ox1ky1ky0Ox1ky1rp1g22vo2vo1Ku1Uk2gc0Oi0Oi0PU0PU0P80P81ja1ja17c17c0Oi0Oi0Xn0Xn2XD*0922D*0j2vo*031VS2vo1VS29Y2vo*052p82p82vo*021x+2vo*041Wo1Wo2vo*0222D2vo*0c",
				fonts: "-*0J7-7--7--7-*087*0q-*047*04-*0a7*0j-*0ca*0L-aa-*0ba*06-*07a*0c-*0A9-9*08-9*02-9*02-9*02-9*02-9*06-9*06-9*06-9*0m3*037*0s3*0i7-3373*02-3*0273*0277-73*0b773*0766753*03753363*027373*0263*0273*04-*023373*07773*0b73*0j6*0336*043*08633633663363*0363363663363*0263*02663*076*023*046363*046*0b3*0a66-36366363*0h633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g-*093*0k6*023*0863*0d63*0d6"
			},
			italic: {
				widths: "!000*0I0VW0000Q20000000Q20000000LD000!*071aI14i0O911f1ak0Fd0DH19z1aI0BN14n10b13919T19u0DV0HF18714C13i12/15B16815r15+1wQ1a6!*041iq1e+1by0tM0Vt!*0H0ZU0+c16Z0+c0+v1bC0Nd0Tu12U0/i14L1f51hz11D12r0X31hU1hq1jr0+v0+F0ZA16k0Xn17U16k16k0Z70YX18x18x10J11D0RC0Rs0ZK0ZK10S0Tk0YX14V14M18+1770ZA0V+0+v0TX0000Iy0Iy000*06!*031iz0qf0WW0Rs0LP0RM0JE12r000*0712U0+R0/81oN1fJ1g01ix12K1jL1es0/L19B1/v!*0z1C12sg1C12sg1e8*071C01e81e82sg1C01e81e82sg1C01e81e82sg1C11e81e82sg!2sg1e81e82sg1e81e82sg!2sg1e81e82sg1e81e82sg!1e81e82sg2sg1e81e82sg!1e81e82sg2sg1e81e82sg2sg1e81e82sg1e81e82sg1e8*072sg1e8*031KJ*0s1e8*032sg*021e8*0b1KJ!2iz2iz1KJ2iz*02!2011JA1r11KJ0S10zu0h11KJ1KJ!1NW2iz*0b1uo1uo26B*07!!2sg2dy2sg*032qG1N426B26B!26B*022qG26B2qG26B*02!26B*022qG26B*041kf1tS1iY26B26B1uo26B*071uo1uo26B*0b0Tp26B*072Ll26B*0a!*0326B!*0422a22a1ds1W523I1T21T21fm1C5!2sg26B!26B1Lz!!1RU1RU!2da24S*02!24S1e8!1ND!!1aS1fG!1uy1vi25x!1RU1RZ1SJ!!2cj*07!*022sg23I1pc1pc1m42sg1m42sg1Ua1jE1KX20O1nw!*0b2sg*0a!*021GZ!1GZ!!1GZ!0Zh1iX2352dD16w10l13n1vi1vi2bI29q*07!1/r1/r!!1RZ*0523I*032cj*051Mt1Mt!*022sg!!1jk!1q2!!1/v2sg2sg!!1YV28v28v1Iq1Iq!1m423S!!1au1CX2hA2Ge!!1m4*032nC1m41m41GV*03!!2sg*04!!2sg2sg!2sg*04!!2sg!2sg!!2sg*0j!!2sg*04!*0526B!*032sg2sg!2sg2sg!2sg!2sg2BO!27m1/v!*052sg!2sg2sg!1R2!1/F!1/F1/F27d*03!1GB1KX2a6!2aO*031/v1/v!1/v*0622D2aO2aO!!2aO*0e!2aO2aO!2aO*03!1/m!2af*03!*022aO!0CW0N415m0Lo0Lo1hq1hq0Lo1hq1oi1cW!!1Hn1Rc2d50La0La0MM0MM0L/0L/1g21g21441440La0La0Uf0Uf2Y02XR2XR2XW*022Y52XW2XR2XW1/v*0j2sg!*021SJ2sg1SJ26Q2sg*04!2l/2l/2sg*021uR2sg*041Tg1Tg2sg!2sg1/v2sg*0b!",
				fonts: "-*0J7-7--7--7-*087*0q-*047*04-*0Hc*0L-cc-*0bc*06-*07c*0c-*0A9-9*08-9*02-9*02-9*02-9*02-9*06-9*06-9*06-9*0m3*037*0s3*0i7-3373*02-3*0273*0277-73*0b773*07--753*037533-3*027373*02-3*0273*04-*023373*07773*0b73*0j-*033-*043*08-33-33--33-3*03-33-3--33-3*02-3*02--3*07-*023*046363*04-*0b3*0a-*023-3--3-3*0h-33--3*0h-*026--3-3--3*02--3*04-33--3*03--3*0a--3*04--33-3*04--3-3--3*0j--3*04-*053-*0333-33-3-33-33-*053-33-3-3-3*05-3*02-3*05-3*09--3*0e-33-3*03-3-3*03-*023-3*0a--3*0g-*093*0k-*023*08-3*0d-3*0d-"
			},
			boldItalic: {
				widths: "!000*0I0WC0000Q20000000Q20000000Od000!*071gU1910W+14C1g20Me0Oi1f+1gA0HP15V14Q15h1be1ib0LD0Od17g1fm1ce16U1m41c516U19f1FM1eG!*041ws1s11nC0zE13C!*0H0XS10S16N0/811t1d/0OE0Xn12A0+/19r1in1l915p16a0UL1ib1nH1kS10d11k0+c15T0XS17U15315p10J10J1db1cq13H13/0VR0SA0Yu0XS14i0Uh11a15311D18b1oN0XS0Wt14M0SJ0000Io0Io000*06!*031pw0rd0TD0De0Af0Ju0KV0QP000*070TN0Xn0TX1iH1dR1dx1fo0TD1gt1eB0YE1cK20i!*0z1C12vj1C12vj1hb*071C01hb1hb2vj1C01hb1hb2vj1C01hb1hb2vj1C11hb1hb2vj!2vj1hb1hb2vj1hb1hb2vj!2vj1hb1hb2vj1hb1hb2vj!1hb1hb2vj2vj1hb1hb2vj!1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj1hb1hb2vj1hb*072vj1hg*031KJ*0s1hg*032vo*021hg*0b1KJ!2lI2lI1KJ2lI*02!23a1MI1ua1KJ0V90CD0k91KJ1KJ!1NW2lI*0b1uo1uo29K*07!!2sg2gG2vo*032qG1Qd29K29K!29K*022qG29K2qG29K*02!29K*022qG29K*041ni1tS1iY29K29K1uo29K*071uo1uo29K*0b0Tp29K*072Ot29K*0a!*0329K!*0425j25j1gA1Zd26Q1W91W91iu1Fd!2vo29K!29K1OH!!1V11V1!2gh27Z*02!27Z1hg!1QK!!1d/1iO!1xG1yr28F!1V11V61VS!!2fs*07!*022vo26Q1sk1sk1pc2vo1pc2vo1Xj1mM1O423W1qF!*0b2vo*0a!*021K6!1K6!!1K6!10p1m426d2gL19E13s16w1yr1yr2eR2cy*07!22y22y!!1V6*0526Q*032fs*051PC1PC!*022vo!!1ms!1ta!!22D2vo2vo!!2012bE2bE1Lz1Lz!1pc26+!!1dB1G32kJ2Jm!!1pc*032qL1pc1pc1K1*03!!2vo*04!!2vo2vo!2vo*04!!2vo!2vo!!2vo*0j!!2vo*04!*0529K!*032vo2vo!2vo2vo!2vo!2vo2EX!2au22D!*052vo!2vo2vo!1Ua!22N!22N22N2ak*03!1JK1O42de!2dW*0322D22D!22D*0625M2dW2dW!!2dW*0e!2dW2dW!2dW*03!22t!2do*03!*022dW!0G20Qc18v0Ox0Ox1ky1ky0Ox1ky1rp1g2!!1Ku1Uk2gc0Oi0Oi0PU0PU0P80P81ja1ja17c17c0Oi0Oi0Xn0Xn2XD*0922D*0j2vo!*021VS2vo1VS29Y2vo*04!2p82p82vo*021x+2vo*041Wo1Wo2vo!2vo22D2vo*0b!",
				fonts: "-*0J7-7--7--7-*087*0q-*047*04-*0Hd*0L-dd-*0bd*06-*07d*0c-*0A9-9*08-9*02-9*02-9*02-9*02-9*06-9*06-9*06-9*0m3*037*0s3*0i7-3373*02-3*0273*0277-73*0b773*07--753*037533-3*027373*02-3*0273*04-*023373*07773*0b73*0j-*033-*043*08-33-33--33-3*03-33-3--33-3*02-3*02--3*07-*023*046363*04-*0b3*0a-*023-3--3-3*0h-33--3*0h-*026--3-3--3*02--3*04-33--3*03--3*0a--3*04--33-3*04--3-3--3*0j--3*04-*053-*0333-33-3-33-33-*053-33-3-3-3*05-3*02-3*05-3*09--3*0e-33-3*03-3-3*03-*023-3*0a--3*0g-*093*0k-*023*08-3*0d-3*0d-"
			}
		},
		{
			name: "Arial",
			regular: {
				widths: "!000*0I0XQ0000GZ0000000Hq0000000T5000!*071n+1kI0+m1fr1u50Cy0XL1tz1sb0Cy1fA18218l1tz1tX0Cy0T51pL1iJ1ow1lo1871aN1lW1fA1Iv1Aq!*041d41d41d30AT11a!*0a1ib*0j11a1vH1hu*09!1t01vM1Ck1w91w91F81cW1mV1wV1x+1Hw26G2201x31x31mV1+r28h25j1w91w91rp1LS1kp1vD1yr1yr1yK1yK1KE1J61x31tE1qv1341oB1wi1x31bN1w91Qh1u/1EH1LJ1t01t01iE1630001bN1bN000*06!*031s10PU1su1cW1531fV1bN1d/000*071u51u51yK1H21Hw1Ox1Ox1AY1UX1UX1LJ1Iq2Cq!*0z1KJ2sg1xG2sg1e8*071KJ1e81e82sg1KJ1e81e82sg1KJ1e81e82sg1KJ1e81e82sg1KJ2sg1e81e82sg1e81e82sg1KJ2sg1e81e82sg1e81e82sg1KJ1e81e82sg2sg1e81e82sg1KJ1e81e82sg2sg1e81e82sg1KJ1e81e82sg1e81e82sg1e8*072sg1e8*031KJ*0s1e8*032sg*021e8*0b1KJ23/2iz2iz1KJ2iz*021KJ2011JA1r11KJ0S10zu0h11KJ*021NW2iz*0b1uo1uo26B*070Tp0Tp2sg2dy2sg*032qG1N426B26B2sg26B*022qG26B2qG26B*022sg26B*022qG26B*041dd1uo1sS26B26B1uo26B*071uo1uo26B*0b0Tp26B*072Ll26B*0a2sg*0326B2sg*0422a22a1ds1W523I1T21T21fm1C52sg2sg26B2sg26B1Lz2sg2sg1RU1RU2sg2da24S*022sg24S1e82sg1ND2sg2sg1aS1fG2sg1uy1vi25x2sg1RU1RZ1SJ2sg2sg2cj*072sg2sg2vy2Ar2fd1pc1pc1m41Rc1m41Rc1Ua1jE1KX20O1nw2sg*0n1j11GZ1GZ1Cz1GZ1sO1fL1GZ2sg0Zh1e81Rc2dD16w10l1e81vi1vi2bI29q*072sg1/r1/r2sg2sg1RZ*0523I*032cj*051Mt1Mt2sg*051jk2sg1q22sg2sg1/v2sg*031YV28v28v1Iq1Iq2sg1m423S2sg2sg1au1CX2hA2Ge2sg2sg1m4*032nC1m41m41GV*032sg*0U26B2sg*08!2sg*022BO2sg27m1/v2sg*0a1R22sg1/F2sg1/F1/F27d*032sg1GB1KX2a62sg2aO*031/v1/v2sg1/v*0622D2aO2aO2sg2sg2aO*0e2sg2aO2aO2sg2aO*032sg1/m2sg2af*032sg*022aO2sg0CW0N415m0Lo0Lo1hq1hq0Lo1hq1oi1cW2sg2sg1Hn1Rc2d50La0La0MM0MM0L/0L/1g21g21441440La0La0Uf0Uf2XR*022XW2XR*051/v*0j2sg*031SJ2sg1SJ26Q2sg*052l/2l/2sg*021uR2sg*041Tg1Tg2sg*021/v2sg*0c",
				fonts: "-*230*0b-1*0L-11-*0a1*07-*071*0c-*0A2-2*08-2*02-2*02-2*02-2*02-2*06-2*06-2*06-2*06-2*0e3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*07-*0253*03-53363*02-3-3*0263*02-3*04-*0233-3*07--3*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*0766-*023*02-3-3*046*0b3*0a6-33-3--363--3*02-3*0a633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g5*093*0k6*023*0863*0d63*0d6"
			},
			bold: {
				widths: "!000*0I15Q0000KN0000000Q20000000Yi000!*071r11pZ17l1lW1v/0GG10z1wd1xV0GG1hu1cH1dx1vt1yr0GG0Yi1vR1kW1sN1rK1e31f+1pw1hu1LJ1Fd!*041lj*020Hc1eQ!*0a1nM*0j11a1vH1hu*09!1Gi1Jh1Ma1Hr1Hr1On1k/1ws1E+1Qh1Uu2jY2ly1IT1IT1uo23I2tk2wD1Hr1Hr1Gi1NM1tj1G81Gr1Gr1O41O41Z81Z81IT1ER1DX1i11Gi1Av1IT1iY1Hw1KE1Av1KX20q1yU1yU1n+1ap0001iY1iY000*06!*031Hc0RA1yB1b91b91hU1iX1kS000*071wC1yK1LS1Vp1Ku1VS1VS1Gr2mX1UX24H1VS2z8!*0z1KJ2vj1xG2vj1hb*071KJ1hb1hb2vj1KJ1hb1hb2vj1KJ1hb1hb2vj1KJ1hb1hb2vj1KJ2vj1hb1hb2vj1hb1hb2vj1KJ2vj1hb1hb2vj1hb1hb2vj1KJ1hb1hb2vj2vj1hb1hb2vj1KJ1hb1hb2vj2vj1hb1hb2vj1KJ1hb1hb2vj1hb1hb2vj1hb*072vj1hg*031KJ*0s1hg*032vo*021hg*0b1KJ2782lI2lI1KJ2lI*021KJ23a1MI1ua1KJ0V90CD0k91KJ*021NW2lI*0b1uo1uo29K*070Tp0Tp2sg2gG2vo*032qG1Qd29K29K2vo29K*022qG29K2qG29K*022vo29K*022qG29K*041dd1uo1sS29K29K1uo29K*071uo1uo29K*0b0Tp29K*072Ot29K*0a2vo*0329K2vo*0425j25j1gA1Zd26Q1W91W91iu1Fd2vo2vo29K2vo29K1OH2vo2vo1V11V12vo2gh27Z*022vo27Z1hg2vo1QK2vo2vo1d/1iO2vo1xG1yr28F2vo1V11V61VS2vo2vo2fs*072vo2vo2vy2Ar2fd1sk1sk1pc1Rc1pc1Rc1Xj1mM1O423W1qF2vo*0n1j11K61K61Cz1K61sO1fL1K62vo10p1e81Rc2gL19E13s1e81yr1yr2eR2cy*072vo22y22y2vo2vo1V6*0526Q*032fs*051PC1PC2vo*051ms2vo1ta2vo2vo22D2vo*032012bE2bE1Lz1Lz2vo1pc26+2vo2vo1dB1G32kJ2Jm2vo2vo1pc*032qL1pc1pc1K1*032vo*0U29K2vo*08!2vo*022EX2vo2au22D2vo*0a1Ua2vo22N2vo22N22N2ak*032vo1JK1O42de2vo2dW*0322D22D2vo22D*0625M2dW2dW2vo2vo2dW*0e2vo2dW2dW2vo2dW*032vo22t2vo2do*032vo*022dW2vo0G20Qc18v0Ox0Ox1ky1ky0Ox1ky1rp1g22vo2vo1Ku1Uk2gc0Oi0Oi0PU0PU0P80P81ja1ja17c17c0Oi0Oi0Xn0Xn2++*022/32++*0522D*0j2vo*031VS2vo1VS29Y2vo*052p82p82vo*021x+2vo*041Wo1Wo2vo*0222D2vo*0c",
				fonts: "-*230*0b-1*0L-11-*0a1*07-*071*0c-*0A2-2*08-2*02-2*02-2*02-2*02-2*06-2*06-2*06-2*06-2*0e3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*07-*0253*03-53363*02-3-3*0263*02-3*04-*0233-3*07--3*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*0766-*023*02-3-3*046*0b3*0a6-33-3--363--3*02-3*0a633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g5*093*0k6*023*0863*0d63*0d6"
			},
			italic: {
				widths: "!000*0I0XQ0000GZ0000000Hq0000000T5000!*071n+1kI0+m1fr1u50Cy0XL1tz1sb0Cy1fA18218l1tz1tX0Cy0T51pL1iJ1ow1lo1871aN1lW1fA1Iv1Aq!*041d41d41d30AT11a!*0u11a1vH1hu*09!1t01vM1Ck1w91w91F81cW1mV1wV1x+1Hw26G2201x31x31mV1+r28h25j1w91w91rp1LS1kp1vD1yr1yr1yK1yK1KE1J61x31tE1qv1341oB1wi1x31bN1w91Qh1u/1EH1LJ1t01t01iE1630001bN1bN000*06!*031s10PU1su1cW1531fV1bN1d/000*071u51u51yK1H21Hw1Ox1Ox1AY1UX1UX1LJ1Iq2Cq!*0z1KJ2sg1xG2sg1e8*071KJ1e81e82sg1KJ1e81e82sg1KJ1e81e82sg1KJ1e81e82sg1KJ2sg1e81e82sg1e81e82sg1KJ2sg1e81e82sg1e81e82sg1KJ1e81e82sg2sg1e81e82sg1KJ1e81e82sg2sg1e81e82sg1KJ1e81e82sg1e81e82sg1e8*072sg1e8*031KJ*0s1e8*032sg*021e8*0b1KJ23/2iz2iz1KJ2iz*021KJ2011JA1r11KJ0S10zu0h11KJ*021NW2iz*0b1uo1uo26B*070Tp0Tp2sg2dy2sg*032qG1N426B26B!26B*022qG26B2qG26B*02!26B*022qG26B*041dd1uo1sS26B26B1uo26B*071uo1uo26B*0b0Tp26B*072Ll26B*0a!*0326B!*0422a22a1ds1W523I1T21T21fm1C5!2sg26B!26B1Lz!!1RU1RU!2da24S*02!24S1e8!1ND!!1aS1fG!1uy1vi25x!1RU1RZ1SJ!!2cj*07!!2vy2Ar2fd1pc1pc1m41Rc1m41Rc1Ua1jE1KX20O1nw!*0b2sg*0a!1j11GZ1GZ1Cz1GZ1sO1fL1GZ!0Zh1e81Rc2dD16w10l1e81vi1vi2bI29q*07!1/r1/r!!1RZ*0523I*032cj*051Mt1Mt!*022sg!!1jk!1q2!!1/v2sg2sg!!1YV28v28v1Iq1Iq!1m423S!!1au1CX2hA2Ge!!1m4*032nC1m41m41GV*03!!2sg*04!!2sg2sg!2sg*04!!2sg!2sg!!2sg*0j!!2sg*04!*0526B!*032sg2sg!2sg2sg!2sg!2sg2BO!27m1/v!*052sg!2sg2sg!1R2!1/F!1/F1/F27d*03!1GB1KX2a6!2aO*031/v1/v!1/v*0622D2aO2aO!!2aO*0e!2aO2aO!2aO*03!1/m!2af*03!*022aO!0CW0N415m0Lo0Lo1hq1hq0Lo1hq1oi1cW!!1Hn1Rc2d50La0La0MM0MM0L/0L/1g21g21441440La0La0Uf0Uf2XR*022XW2XR*051/v*0j2sg!*021SJ2sg1SJ26Q2sg*04!2l/2l/2sg*021uR2sg*041Tg1Tg2sg!2sg1/v2sg*0b!",
				fonts: "-*230*0b-1*0L-11-*0a1*07-*071*0c-*0A2-2*08-2*02-2*02-2*02-2*02-2*06-2*06-2*06-2*06-2*0e3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*07-*0253*03-533-3*02-3-3*02-3*02-3*04-*0233-3*07--3*0b-3*0j-*033-*043*08-33-33--33-3*03-33-3--33-3*02-3*02--3*07-*043*02-3-3*04-*0b3*0a--33-3--3-3--3*02-3*0a-33--3*0h-*026--3-3--3*02--3*04-33--3*03--3*0a--3*04--33-3*04--3-3--3*0j--3*04-*053-*0333-33-3-33-33-*053-33-3-3-3*05-3*02-3*05-3*09--3*0e-33-3*03-3-3*03-*023-3*0a--3*0g5*093*0k-*023*08-3*0d-3*0d-"
			},
			boldItalic: {
				widths: "!000*0I15Q0000KN0000000Q20000000Yi000!*071r11pZ17l1lW1v/0GG10z1wd1xV0GG1hu1cH1dx1vt1yr0GG0Yi1vR1kW1sN1rK1e31f+1pw1hu1LJ1Fd!*041lj*020Hc1eQ!*0u11a1vH1hu*09!1Gi1Jh1Ma1Hr1Hr1On1k/1ws1E+1Qh1Uu2jY2ly1IT1IT1uo23I2tk2wD1Hr1Hr1Gi1NM1tj1G81Gr1Gr1O41O41Z81Z81IT1ER1DX1i11Gi1Av1IT1iY1Hw1KE1Av1KX20q1yU1yU1n+1ap0001iY1iY000*06!*031Hc0RA1yB1b91b91hU1iX1kS000*071wC1yK1LS1Vp1Ku1VS1VS1Gr2mX1UX24H1VS2z8!*0z1KJ2vj1xG2vj1hb*071KJ1hb1hb2vj1KJ1hb1hb2vj1KJ1hb1hb2vj1KJ1hb1hb2vj1KJ2vj1hb1hb2vj1hb1hb2vj1KJ2vj1hb1hb2vj1hb1hb2vj1KJ1hb1hb2vj2vj1hb1hb2vj1KJ1hb1hb2vj2vj1hb1hb2vj1KJ1hb1hb2vj1hb1hb2vj1hb*072vj1hg*031KJ*0s1hg*032vo*021hg*0b1KJ2782lI2lI1KJ2lI*021KJ23a1MI1ua1KJ0V90CD0k91KJ*021NW2lI*0b1uo1uo29K*070Tp0Tp2sg2gG2vo*032qG1Qd29K29K!29K*022qG29K2qG29K*02!29K*022qG29K*041dd1uo1sS29K29K1uo29K*071uo1uo29K*0b0Tp29K*072Ot29K*0a!*0329K!*0425j25j1gA1Zd26Q1W91W91iu1Fd!2vo29K!29K1OH!!1V11V1!2gh27Z*02!27Z1hg!1QK!!1d/1iO!1xG1yr28F!1V11V61VS!!2fs*07!!2vy2Ar2fd1sk1sk1pc1Rc1pc1Rc1Xj1mM1O423W1qF!*0b2vo*0a!1j11K61K61Cz1K61sO1fL1K6!10p1e81Rc2gL19E13s1e81yr1yr2eR2cy*07!22y22y!!1V6*0526Q*032fs*051PC1PC!*022vo!!1ms!1ta!!22D2vo2vo!!2012bE2bE1Lz1Lz!1pc26+!!1dB1G32kJ2Jm!!1pc*032qL1pc1pc1K1*03!!2vo*04!!2vo2vo!2vo*04!!2vo!2vo!!2vo*0j!!2vo*04!*0529K!*032vo2vo!2vo2vo!2vo!2vo2EX!2au22D!*052vo!2vo2vo!1Ua!22N!22N22N2ak*03!1JK1O42de!2dW*0322D22D!22D*0625M2dW2dW!!2dW*0e!2dW2dW!2dW*03!22t!2do*03!*022dW!0G20Qc18v0Ox0Ox1ky1ky0Ox1ky1rp1g2!!1Ku1Uk2gc0Oi0Oi0PU0PU0P80P81ja1ja17c17c0Oi0Oi0Xn0Xn2++*022/32++*0522D*0j2vo!*021VS2vo1VS29Y2vo*04!2p82p82vo*021x+2vo*041Wo1Wo2vo!2vo22D2vo*0b!",
				fonts: "-*230*0b-1*0L-11-*0a1*07-*071*0c-*0A2-2*08-2*02-2*02-2*02-2*02-2*06-2*06-2*06-2*06-2*0e3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*07-*0253*03-533-3*02-3-3*02-3*02-3*04-*0233-3*07--3*0b-3*0j-*033-*043*08-33-33--33-3*03-33-3--33-3*02-3*02--3*07-*043*02-3-3*04-*0b3*0a--33-3--3-3--3*02-3*0a-33--3*0h-*026--3-3--3*02--3*04-33--3*03--3*0a--3*04--33-3*04--3-3--3*0j--3*04-*053-*0333-33-3-33-33-*053-33-3-3-3*05-3*02-3*05-3*09--3*0e-33-3*03-3-3*03-*023-3*0a--3*0g5*093*0k-*023*08-3*0d-3*0d-"
			}
		},
		{
			name: "Times New Roman",
			regular: {
				widths: "!000*0I0TD0000Ju0000000Hq0000000LD000!*071be1770Qr11t19E0HA0IK1au1ak0FG16G13C13s1fh1bS0GU0LD1af16Z16Z14Q1bo17U1a119f1vn1e8!*041n31le1jk0wG0W4!*0a1ib*0j!*0c0ZU0+c16Z0+c0+v1bC0Nd0Tu12U0/i14L1f51hz11D12r0X31hU1hq1jr0+v0+F0ZK16k0Xn17U16k16k0Z70Z718x18x10J11D0RC0Rs0ZK0ZK10S0Tk0YX14V14M18+1770ZA0V+0+v0TX0000Iy0Iy000*06!*0314O0qf0WW0Rs0LP0RM0JE12r000*0712U0+R0/81oN1fJ1g01ix12K1jL1es0/L19B1/v!*0z1KJ2sg1KJ2sg1e8*071KJ1e81e82sg1KJ1e81e82sg1KJ1e81e82sg1KJ1e81e82sg1KJ2sg1e81e82sg1e81e82sg1KJ2sg1e81e82sg1e81e82sg1KJ1e81e82sg2sg1e81e82sg1KJ1e81e82sg2sg1e81e82sg1KJ1e81e82sg1e81e82sg1e8*072sg1e8*031KJ*0s1e8*032sg*021e8*0b1KJ23/2iz2iz1KJ2iz*021KJ2011JA1r11KJ0S10zu0h11KJ*021NW2iz*0b1uo1uo26B*070Tp0Tp2sg2dy2sg*032qG1N426B26B2sg26B*022qG26B2qG26B*022sg26B*022qG26B*041dd1uo1sS26B26B1uo26B*071uo1uo26B*0b0Tp26B*072Ll26B*0a2sg*0326B2sg*0422a22a1ds1W523I1T21T21fm1C52sg2sg26B2sg26B1Lz2sg2sg1RU1RU2sg2da24S*022sg24S1e82sg1ND2sg2sg1aS1fG2sg1uy1vi25x2sg1RU1RZ1SJ2sg2sg2cj*072sg2sg2vy2Ar2fd1pc1pc1m41Rc1m41Rc1Ua1jE1KX20O1nw2sg*0n1j11GZ1GZ1Cz1GZ1sO1fL1GZ2sg0Zh1e81Rc2dD16w10l1e81vi1vi2bI29q*072sg1/r1/r2sg2sg1RZ*0523I*032cj*051Mt1Mt2sg*051jk2sg1q22sg2sg1/v2sg*031YV28v28v1Iq1Iq2sg1m423S2sg2sg1au1CX2hA2Ge2sg2sg1m4*032nC1m41m41GV*032sg*0U26B2sg*08!2sg*022BO2sg27m1/v2sg*0a1R22sg1/F2sg1/F1/F27d*032sg1GB1KX2a62sg2aO*031/v1/v2sg1/v*0622D2aO2aO2sg2sg2aO*0e2sg2aO2aO2sg2aO*032sg1/m2sg2af*032sg*022aO2sg0CW0N415m0Lo0Lo1hq1hq0Lo1hq1oi1cW2sg2sg1Hn1Rc2d50La0La0MM0MM0L/0L/1g21g21441440La0La0Uf0Uf2XR*022XW2XR*051/v*0j2sg*031SJ2sg1SJ26Q2sg*052l/2l/2sg*021uR2sg*041Tg1Tg2sg*021/v2sg*0c",
				fonts: "-*2g8*0L-88-*0a8*07-*078*0c-*0A9-9*08-9*02-9*02-9*02-9*02-9*06-9*06-9*06-9*06-9*0e3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*07-*0253*03-53363*02-3-3*0263*02-3*04-*0233-3*07--3*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*0766-*023*02-3-3*046*0b3*0a6-33-3--363--3*02-3*0a633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g5*093*0k6*023*0863*0d63*0d6"
			},
			bold: {
				widths: "!000*0I0UN0000Q20000000Q20000000Nn000!*071il17J0Vj18A1g20KE0NC1eQ1iJ0My17v15K13/1fV1jk0OV0Nn1aI1fh1c/17q1od1gr1bt18v1HB1gZ!*041te1v91x30DV17U!*0a1nM*0j!*0c0XS10S16N0/811t1d/0OE0Xn12A0+/19r1in1l915p16a0Yk1ib1nH1kS10d11k0+c15T0XS17U15315p10J10J1db1db13H13/0VR0SA0Yu0XS14i0Uh11a15311D18b1oN0XS0Wt14M0SJ0000Io0Io000*06!*0314O0rd0TD0De0Af0Ju0KV0QP000*070TN0Xn0TX1iH1dR1dx1fo0TD1gt1eB0YE1cK20i!*0z1KJ2vj1KJ2vj1hb*071KJ1hb1hb2vj1KJ1hb1hb2vj1KJ1hb1hb2vj1KJ1hb1hb2vj1KJ2vj1hb1hb2vj1hb1hb2vj1KJ2vj1hb1hb2vj1hb1hb2vj1KJ1hb1hb2vj2vj1hb1hb2vj1KJ1hb1hb2vj2vj1hb1hb2vj1KJ1hb1hb2vj1hb1hb2vj1hb*072vj1hg*031KJ*0s1hg*032vo*021hg*0b1KJ2782lI2lI1KJ2lI*021KJ23a1MI1ua1KJ0V90CD0k91KJ*021NW2lI*0b1uo1uo29K*070Tp0Tp2sg2gG2vo*032qG1Qd29K29K2vo29K*022qG29K2qG29K*022vo29K*022qG29K*041dd1uo1sS29K29K1uo29K*071uo1uo29K*0b0Tp29K*072Ot29K*0a2vo*0329K2vo*0425j25j1gA1Zd26Q1W91W91iu1Fd2vo2vo29K2vo29K1OH2vo2vo1V11V12vo2gh27Z*022vo27Z1hg2vo1QK2vo2vo1d/1iO2vo1xG1yr28F2vo1V11V61VS2vo2vo2fs*072vo2vo2vy2Ar2fd1sk1sk1pc1Rc1pc1Rc1Xj1mM1O423W1qF2vo*0n1j11K61K61Cz1K61sO1fL1K62vo10p1e81Rc2gL19E13s1e81yr1yr2eR2cy*072vo22y22y2vo2vo1V6*0526Q*032fs*051PC1PC2vo*051ms2vo1ta2vo2vo22D2vo*032012bE2bE1Lz1Lz2vo1pc26+2vo2vo1dB1G32kJ2Jm2vo2vo1pc*032qL1pc1pc1K1*032vo*0U29K2vo*08!2vo*022EX2vo2au22D2vo*0a1Ua2vo22N2vo22N22N2ak*032vo1JK1O42de2vo2dW*0322D22D2vo22D*0625M2dW2dW2vo2vo2dW*0e2vo2dW2dW2vo2dW*032vo22t2vo2do*032vo*022dW2vo0G20Qc18v0Ox0Ox1ky1ky0Ox1ky1rp1g22vo2vo1Ku1Uk2gc0Oi0Oi0PU0PU0P80P81ja1ja17c17c0Oi0Oi0Xn0Xn2++*022/32++*0522D*0j2vo*031VS2vo1VS29Y2vo*052p82p82vo*021x+2vo*041Wo1Wo2vo*0222D2vo*0c",
				fonts: "-*2ga*0L-aa-*0aa*07-*07a*0c-*0A9-9*08-9*02-9*02-9*02-9*02-9*06-9*06-9*06-9*06-9*0e3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*07-*0253*03-53363*02-3-3*0263*02-3*04-*0233-3*07--3*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*0766-*023*02-3-3*046*0b3*0a6-33-3--363--3*02-3*0a633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g5*093*0k6*023*0863*0d63*0d6"
			},
			italic: {
				widths: "!000*0I0VW0000Q20000000Q20000000LD000!*071aI14i0O911f1ak0Fd0DH19z1aI0BN14n10b13919T19u0DV0HF18714C13i12/15B16815r15+1wQ1a6!*041iq1e+1by0tM0Vt!*0H0ZU0+c16Z0+c0+v1bC0Nd0Tu12U0/i14L1f51hz11D12r0X31hU1hq1jr0+v0+F0ZA16k0Xn17U16k16k0Z70YX18x18x10J11D0RC0Rs0ZK0ZK10S0Tk0YX14V14M18+1770ZA0V+0+v0TX0000Iy0Iy000*06!*0314M0qf0WW0Rs0LP0RM0JE12r000*0712U0+R0/81oN1fJ1g01ix12K1jL1es0/L19B1/v!*0z1KJ2sg1wd2sg1e8*071KJ1e81e82sg1KJ1e81e82sg1KJ1e81e82sg1KJ1e81e82sg1KJ2sg1e81e82sg1e81e82sg1KJ2sg1e81e82sg1e81e82sg1KJ1e81e82sg2sg1e81e82sg1KJ1e81e82sg2sg1e81e82sg1KJ1e81e82sg1e81e82sg1e8*072sg1e8*031KJ*0s1e8*032sg*021e8*0b1KJ23/2iz2iz1KJ2iz*021KJ2011JA1r11KJ0S10zu0h11KJ*021NW2iz*0b1uo1uo26B*070Tp0Tp2sg2dy2sg*032qG1N426B26B!26B*022qG26B2qG26B*02!26B*022qG26B*041dd1uo1sS26B26B1uo26B*071uo1uo26B*0b0Tp26B*072Ll26B*0a!*0326B!*0422a22a1ds1W523I1T21T21fm1C5!2sg26B!26B1Lz!!1RU1RU!2da24S*02!24S1e8!1ND!!1aS1fG!1uy1vi25x!1RU1RZ1SJ!!2cj*07!!2vy2Ar2fd1pc1pc1m41Rc1m41Rc1Ua1jE1KX20O1nw!*0b2sg*0a!1j11GZ1GZ1Cz1GZ1sO1fL1GZ!0Zh1e81Rc2dD16w10l1e81vi1vi2bI29q*07!1/r1/r!!1RZ*0523I*032cj*051Mt1Mt!*022sg!!1jk!1q2!!1/v2sg2sg!!1YV28v28v1Iq1Iq!1m423S!!1au1CX2hA2Ge!!1m4*032nC1m41m41GV*03!!2sg*04!!2sg2sg!2sg*04!!2sg!2sg!!2sg*0j!!2sg*04!*0526B!*032sg2sg!2sg2sg!2sg!2sg2BO!27m1/v!*052sg!2sg2sg!1R2!1/F!1/F1/F27d*03!1GB1KX2a6!2aO*031/v1/v!1/v*0622D2aO2aO!!2aO*0e!2aO2aO!2aO*03!1/m!2af*03!*022aO!0CW0N415m0Lo0Lo1hq1hq0Lo1hq1oi1cW!!1Hn1Rc2d50La0La0MM0MM0L/0L/1g21g21441440La0La0Uf0Uf2XR*022XW2XR*051/v*0j2sg!*021SJ2sg1SJ26Q2sg*04!2l/2l/2sg*021uR2sg*041Tg1Tg2sg!2sg1/v2sg*0b!",
				fonts: "-*2gc*0L-cc-*0ac*07-*07c*0c-*0A9-9*08-9*02-9*02-9*02-9*02-9*06-9*06-9*06-9*06-9*0e3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*07-*0253*03-533-3*02-3-3*02-3*02-3*04-*0233-3*07--3*0b-3*0j-*033-*043*08-33-33--33-3*03-33-3--33-3*02-3*02--3*07-*043*02-3-3*04-*0b3*0a--33-3--3-3--3*02-3*0a-33--3*0h-*026--3-3--3*02--3*04-33--3*03--3*0a--3*04--33-3*04--3-3--3*0j--3*04-*053-*0333-33-3-33-33-*053-33-3-3-3*05-3*02-3*05-3*09--3*0e-33-3*03-3-3*03-*023-3*0a--3*0g5*093*0k-*023*08-3*0d-3*0d-"
			},
			boldItalic: {
				widths: "!000*0I0WC0000Q20000000Q20000000Od000!*071gU1910W+14C1g20Me0Oi1f+1gA0HO15V14Q15h1be1ib0LD0Od17g1fm1ce16U1m41c516U19f1FM1eG!*041ws1s11nC0zE13C!*0H0XS10S16N0/811t1d/0OE0Xn12A0+/19r1in1l915p16a0UL1ib1nH1kS10d11k0+c15T0XS17U15315p10J10J1db1cq13H13/0VR0SA0Yu0XS14i0Uh11a15311D18b1oN0XS0Wt14M0SJ0000Io0Io000*06!*031600rd0TD0De0Af0Ju0KV0QP000*070TN0Xn0TX1iH1dR1dx1fo0TD1gt1eB0YE1cK20i!*0z1KJ2vj1wd2vj1hb*071KJ1hb1hb2vj1KJ1hb1hb2vj1KJ1hb1hb2vj1KJ1hb1hb2vj1KJ2vj1hb1hb2vj1hb1hb2vj1KJ2vj1hb1hb2vj1hb1hb2vj1KJ1hb1hb2vj2vj1hb1hb2vj1KJ1hb1hb2vj2vj1hb1hb2vj1KJ1hb1hb2vj1hb1hb2vj1hb*072vj1hg*031KJ*0s1hg*032vo*021hg*0b1KJ2782lI2lI1KJ2lI*021KJ23a1MI1ua1KJ0V90CD0k91KJ*021NW2lI*0b1uo1uo29K*070Tp0Tp2sg2gG2vo*032qG1Qd29K29K!29K*022qG29K2qG29K*02!29K*022qG29K*041dd1uo1sS29K29K1uo29K*071uo1uo29K*0b0Tp29K*072Ot29K*0a!*0329K!*0425j25j1gA1Zd26Q1W91W91iu1Fd!2vo29K!29K1OH!!1V11V1!2gh27Z*02!27Z1hg!1QK!!1d/1iO!1xG1yr28F!1V11V61VS!!2fs*07!!2vy2Ar2fd1sk1sk1pc1Rc1pc1Rc1Xj1mM1O423W1qF!*0b2vo*0a!1j11K61K61Cz1K61sO1fL1K6!10p1e81Rc2gL19E13s1e81yr1yr2eR2cy*07!22y22y!!1V6*0526Q*032fs*051PC1PC!*022vo!!1ms!1ta!!22D2vo2vo!!2012bE2bE1Lz1Lz!1pc26+!!1dB1G32kJ2Jm!!1pc*032qL1pc1pc1K1*03!!2vo*04!!2vo2vo!2vo*04!!2vo!2vo!!2vo*0j!!2vo*04!*0529K!*032vo2vo!2vo2vo!2vo!2vo2EX!2au22D!*052vo!2vo2vo!1Ua!22N!22N22N2ak*03!1JK1O42de!2dW*0322D22D!22D*0625M2dW2dW!!2dW*0e!2dW2dW!2dW*03!22t!2do*03!*022dW!0G20Qc18v0Ox0Ox1ky1ky0Ox1ky1rp1g2!!1Ku1Uk2gc0Oi0Oi0PU0PU0P80P81ja1ja17c17c0Oi0Oi0Xn0Xn2++*022/32++*0522D*0j2vo!*021VS2vo1VS29Y2vo*04!2p82p82vo*021x+2vo*041Wo1Wo2vo!2vo22D2vo*0b!",
				fonts: "-*2gd*0L-dd-*0ad*07-*07d*0c-*0A9-9*08-9*02-9*02-9*02-9*02-9*06-9*06-9*06-9*06-9*0e3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*07-*0253*03-533-3*02-3-3*02-3*02-3*04-*0233-3*07--3*0b-3*0j-*033-*043*08-33-33--33-3*03-33-3--33-3*02-3*02--3*07-*043*02-3-3*04-*0b3*0a--33-3--3-3--3*02-3*0a-33--3*0h-*026--3-3--3*02--3*04-33--3*03--3*0a--3*04--33-3*04--3-3--3*0j--3*04-*053-*0333-33-3-33-33-*053-33-3-3-3*05-3*02-3*05-3*09--3*0e-33-3*03-3-3*03-*023-3*0a--3*0g5*093*0k-*023*08-3*0d-3*0d-"
			}
		},
		{
			name: "Courier New",
			regular: {
				widths: "!000*0I1tN0001tN0000001tN0000001tN000!*071tN*0q!*041tN*04!*0a1tN*0j11a1vH1hu*09!1t01vM1Ck1w91w91F81cW1mV1wV1x+1Hw26G2201x31x31mV1+r28g25j1w91w91rp1LS1kp1vD1yr1yr1yK1yK1KE1J61x31tE1qv1341oB1wi1x31bN1w91Qh1u/1EH1LJ1t01t01iE1630001bN1bN000*06!*031s10PU1su1cW1531fV1bN1d/000*071u51u51yK1H21Hw1Ox1Ox1AY1UX1UX1LJ1Iq2Cq!*0z1tN2sg1tN2sg1e8*071tN1e81e82sg1tN1e81e82sg1tN1e81e82sg1tN1e81e82sg1tN2sg1e81e82sg1e81e82sg1tN2sg1e81e82sg1e81e82sg1tN1e81e82sg2sg1e81e82sg1tN1e81e82sg2sg1e81e82sg1tN1e81e82sg1e81e82sg1e8*072sg1e8*031tN*0s1e8*032sg*021e8*0b1tN23/2iz2iz1tN2iz*021tN2011JA1r11tN0S10zu0h11tN*032iz*0b1tN1tN26B*071tN*022dy2sg*031tN1N426B26B2sg26B*021tN26B1tN26B*022sg26B*021tN26B*041tN*0226B26B1tN26B*071tN1tN26B*0b1tN26B*072Ll26B*0a2sg*0326B2sg*0422a22a1ds1W523I1T21T21fm1C52sg2sg26B2sg26B1Lz2sg2sg1RU1RU2sg2da24S*022sg24S1e82sg1ND2sg2sg1aS1fG2sg1uy1vi25x2sg1RU1RZ1SJ2sg2sg2cj*072sg2sg1tN*021pc1pc1m41tN1m41tN1Ua1jE1KX20O1nw2sg*0n1tN1GZ1GZ1tN1GZ1tN1tN1GZ2sg0Zh1tN1tN2dD16w10l1tN1vi1vi2bI29q*072sg1/r1/r2sg2sg1RZ*0523I*032cj*051Mt1Mt2sg*051jk2sg1q22sg2sg1/v2sg*031YV28v28v1Iq1Iq2sg1m423S2sg2sg1au1CX2hA2Ge2sg2sg1m4*032nC1m41m41GV*032sg*0U26B2sg*08!2sg*022BO2sg27m1/v2sg*0a1R22sg1/F2sg1/F1/F27d*032sg1GB1KX2a62sg2aO*031/v1/v2sg1/v*0622D2aO2aO2sg2sg2aO*0e2sg2aO2aO2sg2aO*032sg1/m2sg2af*032sg*022aO2sg0CW0N415m0Lo0Lo1hq1hq0Lo1hq1oi1cW2sg2sg1Hn1Rc2d50La0La0MM0MM0L/0L/1g21g21441440La0La0Uf0Uf2XR*022XW2XR*051/v*0j2sg*031SJ2sg1SJ26Q2sg*052l/2l/2sg*021uR2sg*041Tg1Tg2sg*021/v2sg*0c",
				fonts: "-*230*0b-1*0L-11-*0a1*07-*071*0c-*0A9-9*08-9*02-9*02-9*02-9*02-9*06-9*06-9*06-9*06-9*0e3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*07-*0253*03-53363*02-3-3*0263*02-3*04-*0233-3*07--3*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*0766-*023*02-3-3*046*0b3*0a6-33-3--363--3*02-3*0a633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g5*093*0k6*023*0863*0d63*0d6"
			},
			bold: {
				widths: "!000*0I1tN0001tN0000001tN0000001tN000!*071tN*0q!*041tN*04!*0a1tN*0j11a1vH1hu*09!1Gi1Jh1Ma1Hr1Hr1On1k/1ws1E+1Qh1Uu2jY2ly1IT1IT1uo23I2tk2wD1Hr1Hr1Gi1NM1tj1G81Gr1Gr1O41O41Z81Z81IT1ER1DX1i11Gi1Av1IT1iX1Hw1KE1Av1KX20q1yU1yU1n+1ap0001iY1iY000*06!*031Hc0RA1yB1b91b91hU1iX1kS000*071wC1yK1LS1Vp1Ku1VS1VS1Gr2mX1UX24H1VS2z8!*0z1tN2vj1tN2vj1hb*071tN1hb1hb2vj1tN1hb1hb2vj1tN1hb1hb2vj1tN1hb1hb2vj1tN2vj1hb1hb2vj1hb1hb2vj1tN2vj1hb1hb2vj1hb1hb2vj1tN1hb1hb2vj2vj1hb1hb2vj1tN1hb1hb2vj2vj1hb1hb2vj1tN1hb1hb2vj1hb1hb2vj1hb*072vj1hg*031tN*0s1hg*032vo*021hg*0b1tN2782lI2lI1tN2lI*021tN23a1MI1ua1tN0V90CD0k91tN*032lI*0b1tN1tN29K*071tN*022gG2vo*031tN1Qd29K29K2vo29K*021tN29K1tN29K*022vo29K*021tN29K*041tN*0229K29K1tN29K*071tN1tN29K*0b1tN29K*072Ot29K*0a2vo*0329K2vo*0425j25j1gA1Zd26Q1W91W91iu1Fd2vo2vo29K2vo29K1OH2vo2vo1V11V12vo2gh27Z*022vo27Z1hg2vo1QK2vo2vo1d/1iO2vo1xG1yr28F2vo1V11V61VS2vo2vo2fs*072vo2vo1tN*021sk1sk1pc1tN1pc1tN1Xj1mM1O423W1qF2vo*0n1tN1K61K61tN1K61tN1tN1K62vo10p1tN1tN2gL19E13s1tN1yr1yr2eR2cy*072vo22y22y2vo2vo1V6*0526Q*032fs*051PC1PC2vo*051ms2vo1ta2vo2vo22D2vo*032012bE2bE1Lz1Lz2vo1pc26+2vo2vo1dB1G32kJ2Jm2vo2vo1pc*032qL1pc1pc1K1*032vo*0U29K2vo*08!2vo*022EX2vo2au22D2vo*0a1Ua2vo22N2vo22N22N2ak*032vo1JK1O42de2vo2dW*0322D22D2vo22D*0625M2dW2dW2vo2vo2dW*0e2vo2dW2dW2vo2dW*032vo22t2vo2do*032vo*022dW2vo0G20Qc18v0Ox0Ox1ky1ky0Ox1ky1rp1g22vo2vo1Ku1Uk2gc0Oi0Oi0PU0PU0P80P81ja1ja17c17c0Oi0Oi0Xn0Xn2++*022/32++*0522D*0j2vo*031VS2vo1VS29Y2vo*052p82p82vo*021x+2vo*041Wo1Wo2vo*0222D2vo*0c",
				fonts: "-*230*0b-1*0L-11-*0a1*07-*071*0c-*0A9-9*08-9*02-9*02-9*02-9*02-9*06-9*06-9*06-9*06-9*0e3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*07-*0253*03-53363*02-3-3*0263*02-3*04-*0233-3*07--3*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*0766-*023*02-3-3*046*0b3*0a6-33-3--363--3*02-3*0a633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g5*093*0k6*023*0863*0d63*0d6"
			},
			italic: {
				widths: "!000*0I1tN0001tN0000001tN000*03!*071tN*0q!*041tN*04!*0u11a1vH1hu*09!1t01vM1Ck1w91w91F81cW1mV1wV1x+1Hw26G2201x31x31mV1+r28g25j1w91w91rp1LS1kp1vD1yr1yr1yK1yK1KE1J61x31tE1qv1341oB1wi1x31bN1w91Qh1u/1EH1LJ1t01t01iE1630001bN1bN000*06!*031s10PU1su1cW1531fV1bN1d/000*071u51u51yK1H21Hw1Ox1Ox1AY1UX1UX1LJ1Iq2Cq!*0z1tN2sg1tN2sg1e8*071tN1e81e82sg1tN1e81e82sg1tN1e81e82sg1tN1e81e82sg1tN2sg1e81e82sg1e81e82sg1tN2sg1e81e82sg1e81e82sg1tN1e81e82sg2sg1e81e82sg1tN1e81e82sg2sg1e81e82sg1tN1e81e82sg1e81e82sg1e8*072sg1e8*031tN*0s1e8*032sg*021e8*0b1tN23/2iz2iz1tN2iz*021tN2011JA1r11tN0S10zu0h11tN*032iz*0b1tN1tN26B*071tN*022dy2sg*031tN1N426B26B!26B*021tN26B1tN26B*02!26B*021tN26B*041tN*0226B26B1tN26B*071tN1tN26B*0b1tN26B*072Ll26B*0a!*0326B!*0422a22a1ds1W523I1T21T21fm1C5!2sg26B!26B1Lz!!1RU1RU!2da24S*02!24S1e8!1ND!!1aS1fG!1uy1vi25x!1RU1RZ1SJ!!2cj*07!!1tN*021pc1pc1m41tN1m41tN1Ua1jE1KX20O1nw!*0b2sg*0a!1tN1GZ1GZ1tN1GZ1tN1tN1GZ!0Zh1tN1tN2dD16w10l1tN1vi1vi2bI29q*07!1/r1/r!!1RZ*0523I*032cj*051Mt1Mt!*022sg!!1jk!1q2!!1/v2sg2sg!!1YV28v28v1Iq1Iq!1m423S!!1au1CX2hA2Ge!!1m4*032nC1m41m41GV*03!!2sg*04!!2sg2sg!2sg*04!!2sg!2sg!!2sg*0j!!2sg*04!*0526B!*032sg2sg!2sg2sg!2sg!2sg2BO!27m1/v!*052sg!2sg2sg!1R2!1/F!1/F1/F27d*03!1GB1KX2a6!2aO*031/v1/v!1/v*0622D2aO2aO!!2aO*0e!2aO2aO!2aO*03!1/m!2af*03!*022aO!0CW0N415m0Lo0Lo1hq1hq0Lo1hq1oi1cW!!1Hn1Rc2d50La0La0MM0MM0L/0L/1g21g21441440La0La0Uf0Uf2XR*022XW2XR*051/v*0j2sg!*021SJ2sg1SJ26Q2sg*04!2l/2l/2sg*021uR2sg*041Tg1Tg2sg!2sg1/v2sg*0b!",
				fonts: "-*230*0b-1*0L-11-*0a1*07-*071*0c-*0A9-9*08-9*02-9*02-9*02-9*02-9*06-9*06-9*06-9*06-9*0e3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*07-*0253*03-533-3*02-3-3*02-3*02-3*04-*0233-3*07--3*0b-3*0j-*033-*043*08-33-33--33-3*03-33-3--33-3*02-3*02--3*07-*043*02-3-3*04-*0b3*0a--33-3--3-3--3*02-3*0a-33--3*0h-*026--3-3--3*02--3*04-33--3*03--3*0a--3*04--33-3*04--3-3--3*0j--3*04-*053-*0333-33-3-33-33-*053-33-3-3-3*05-3*02-3*05-3*09--3*0e-33-3*03-3-3*03-*023-3*0a--3*0g5*093*0k-*023*08-3*0d-3*0d-"
			},
			boldItalic: {
				widths: "!000*0I1tN0001tN0000001tN000*03!*071tN*0q!*041tN*04!*0u11a1vH1hu*09!1Gi1Jh1Ma1Hr1Hr1On1k/1ws1E+1Qh1Uu2jY2ly1IT1IT1uo23I2tk2wD1Hr1Hr1Gi1NM1tj1G81Gr1Gr1O41O41Z81Z81IT1ER1DX1i11Gi1Av1IT1iX1Hw1KE1Av1KX20q1yU1yU1n+1ap0001iY1iY000*06!*031Hc0RA1yB1b91b91hU1iX1kS000*071wC1yK1LS1Vp1Ku1VS1VS1Gr2mX1UX24H1VS2z8!*0z1tN2vj1tN2vj1hb*071tN1hb1hb2vj1tN1hb1hb2vj1tN1hb1hb2vj1tN1hb1hb2vj1tN2vj1hb1hb2vj1hb1hb2vj1tN2vj1hb1hb2vj1hb1hb2vj1tN1hb1hb2vj2vj1hb1hb2vj1tN1hb1hb2vj2vj1hb1hb2vj1tN1hb1hb2vj1hb1hb2vj1hb*072vj1hg*031tN*0s1hg*032vo*021hg*0b1tN2782lI2lI1tN2lI*021tN23a1MI1ua1tN0V90CD0k91tN*032lI*0b1tN1tN29K*071tN*022gG2vo*031tN1Qd29K29K!29K*021tN29K1tN29K*02!29K*021tN29K*041tN*0229K29K1tN29K*071tN1tN29K*0b1tN29K*072Ot29K*0a!*0329K!*0425j25j1gA1Zd26Q1W91W91iu1Fd!2vo29K!29K1OH!!1V11V1!2gh27Z*02!27Z1hg!1QK!!1d/1iO!1xG1yr28F!1V11V61VS!!2fs*07!!1tN*021sk1sk1pc1tN1pc1tN1Xj1mM1O423W1qF!*0b2vo*0a!1tN1K61K61tN1K61tN1tN1K6!10p1tN1tN2gL19E13s1tN1yr1yr2eR2cy*07!22y22y!!1V6*0526Q*032fs*051PC1PC!*022vo!!1ms!1ta!!22D2vo2vo!!2012bE2bE1Lz1Lz!1pc26+!!1dB1G32kJ2Jm!!1pc*032qL1pc1pc1K1*03!!2vo*04!!2vo2vo!2vo*04!!2vo!2vo!!2vo*0j!!2vo*04!*0529K!*032vo2vo!2vo2vo!2vo!2vo2EX!2au22D!*052vo!2vo2vo!1Ua!22N!22N22N2ak*03!1JK1O42de!2dW*0322D22D!22D*0625M2dW2dW!!2dW*0e!2dW2dW!2dW*03!22t!2do*03!*022dW!0G20Qc18v0Ox0Ox1ky1ky0Ox1ky1rp1g2!!1Ku1Uk2gc0Oi0Oi0PU0PU0P80P81ja1ja17c17c0Oi0Oi0Xn0Xn2++*022/32++*0522D*0j2vo!*021VS2vo1VS29Y2vo*04!2p82p82vo*021x+2vo*041Wo1Wo2vo!2vo22D2vo*0b!",
				fonts: "-*230*0b-1*0L-11-*0a1*07-*071*0c-*0A9-9*08-9*02-9*02-9*02-9*02-9*06-9*06-9*06-9*06-9*0e3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*07-*0253*03-533-3*02-3-3*02-3*02-3*04-*0233-3*07--3*0b-3*0j-*033-*043*08-33-33--33-3*03-33-3--33-3*02-3*02--3*07-*043*02-3-3*04-*0b3*0a--33-3--3-3--3*02-3*0a-33--3*0h-*026--3-3--3*02--3*04-33--3*03--3*0a--3*04--33-3*04--3-3--3*0j--3*04-*053-*0333-33-3-33-33-*053-33-3-3-3*05-3*02-3*05-3*09--3*0e-33-3*03-3-3*03-*023-3*0a--3*0g5*093*0k-*023*08-3*0d-3*0d-"
			}
		},
		{
			name: "Calibri Light",
			regular: {
				widths: "!000*0I0LR0000zl0000000F30000000Uf000!*071iO1cR0UN14+1oB0yF0HP1pw1ls0yF15r1af13n1qT1pZ0yF0Uf1n81gF1g71jO11y1aa1hZ15r1FR1tN!*0415h*020Ce0/Y!*0a1fm*0j11a1vH1hu*09!1t01vM1Ck1w91w91F81cW1mV1wV1x+1Hw26G2201x31x31mV1+r28h25j1w91w91rp1LS1kp1vD1yr1yr1yK1yK1KE1J61x31tE1qv1341oB1wi1x31bN1w91Qh1u/1EH1LJ1t01t01iE1630001bN1bN000*06!*031pL0PU1su1cW1531fV1bN1d/000*071u51u51yK1H21Hw1Ox1Ox1AY1UX1UX1LJ1Iq2Cq!*0z1e82sg1e82sg1e8*0a2sg1e8*022sg1e8*022sg1e8*022sg*021e81e82sg1e81e82sg*021e81e82sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg1e81e82sg1e8*072sg1e8*031KJ*0s1e8*032sg*021e8*0b1KJ23/2iz2iz1KJ2iz*021KJ2011JA1r11KJ0S10zu0h11KJ*021NW2iz*0b1uo1uo26B*0711k11k2sg2dy2sg*032qG1N426B26B2sg26B*022qG26B2qG26B*022sg26B*022qG26B*041dR1lW1sS26B26B1uo26B*071uo1uo26B*0b11k26B*072Ll26B*0a2sg*0326B2sg*0422a22a1ds1W523I1T21T21fm1C52sg2sg26B2sg26B1Lz2sg2sg1RU1RU2sg2da24S*022sg24S1e82sg1ND2sg2sg1aS1fG2sg1uy1vi25x2sg1RU1RZ1SJ2sg2sg2cj*072sg*0323I1pc1pc1m42sg1m42sg1Ua1jE1KX20O1nw2sg*0o1GZ1GZ2sg1GZ2sg2sg1GZ2sg0Zh1iX2352dD16w10l13n1vi1vi2bI29q*072sg1/r1/r2sg2sg1RZ*0523I*032cj*051Mt1Mt2sg*051jk2sg1q22sg2sg1/v2sg*031YV28v28v1Iq1Iq2sg1m423S2sg2sg1au1CX2hA2Ge2sg2sg1m4*032nC1m41m41GV*032sg*0U26B2sg*08!2sg*022BO2sg27m1/v2sg*0a1R22sg1/F2sg1/F1/F27d*032sg1GB1KX2a62sg2aO*031/v1/v2sg1/v*0622D2aO2aO2sg2sg2aO*0e2sg2aO2aO2sg2aO*032sg1/m2sg2af*032sg*022aO2sg0CW0N415m0Lo0Lo1hq1hq0Lo1hq1oi1cW2sg2sg1Hn1Rc2d50La0La0MM0MM0L/0L/1g21g21441440La0La0Uf0Uf3fx*091/v*0j2sg*031SJ2sg1SJ26Q2sg*052l/2l/2sg*021uR2sg*041Tg1Tg2sg*021/v2sg*0c",
				fonts: "-*230*0b-1*0L-11-*0b1*06-*071*0c-*0A2-2*08-2*02-2*02-2*02-2*0O3*034*0s3*0i453343*0243*0243*024*033*0b4-3*07--453*03453363*024343*0263*0243*04-*0233-3*07443*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*076*023*046363*046*0b3*0a66336366363*0h633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g-*093*0k6*023*0863*0d63*0d6"
			},
			bold: {
				widths: "!000*0I0O+0000Ct0000000Ib0000000Xn000!*071lW1f+0XV1871rK0BN0KX1sE1oB0BN18A1dn16w1u01t50BN0Xn1qh1jO1jf1mV14H1di1l418A1IY1wV!*0418q*020Fm134!*0a1iu*0j11a1vH1hu*09!1Gi1Jh1Ma1Hr1Hr1On1k/1ws1E+1Qh1Uu2jY2ly1IT1IT1uo23I2tk2wD1Hr1Hr1Gi1NM1tj1G81Gr1Gr1O41O41Z81Z81IT1ER1DX1i11Gi1Av1IT1iY1Hw1KE1Av1KX20q1yU1yU1n+1ap0001iY1iY000*06!*031sS0RA1yB1b91b91hU1iX1kS000*071wC1yK1LS1Vp1Ku1VS1VS1Gr2mX1UX24H1VS2z8!*0z1hg2vj1hg2vj1hb*071hg1hb1hb2vj1hg1hb1hb2vj1hg1hb1hb2vj1hg1hb1hb2vj*021hb1hb2vj1hb1hb2vj*021hb1hb2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj1hb1hb2vj1hb*072vj1hg*031KJ*0s1hg*032vo*021hg*0b1KJ2782lI2lI1KJ2lI*021KJ23a1MI1ua1KJ0V90CD0k91KJ*021NW2lI*0b1uo1xx29K*0714s14s2sg2gG2vo*032qG1Qd29K29K2vo29K*022qG29K2qG29K*022vo29K*022qG29K*041gZ1p21v/29K29K1xx29K*071uo1uo29K*0b14s29K*072Ot29K*0a2vo*0329K2vo*0425j25j1gA1Zd26Q1W91W91iu1Fd2vo2vo29K2vo29K1OH2vo2vo1V11V12vo2gh27Z*022vo27Z1hg2vo1QK2vo2vo1d/1iO2vo1xG1yr28F2vo1V11V61VS2vo2vo2fs*072vo*0326Q1sk1sk1pc2vo1pc2vo1Xj1mM1O423W1qF2vo*0o1K61K62vo1K62vo2vo1K62vo10p1m426d2gL19E13s16w1yr1yr2eR2cy*072vo22y22y2vo2vo1V6*0526Q*032fs*051PC1PC2vo*051ms2vo1ta2vo2vo22D2vo*032012bE2bE1Lz1Lz2vo1pc26+2vo2vo1dB1G32kJ2Jm2vo2vo1pc*032qL1pc1pc1K1*032vo*0U29K2vo*08!2vo*022EX2vo2au22D2vo*0a1Ua2vo22N2vo22N22N2ak*032vo1JK1O42de2vo2dW*0322D22D2vo22D*0625M2dW2dW2vo2vo2dW*0e2vo2dW2dW2vo2dW*032vo22t2vo2do*032vo*022dW2vo0G20Qc18v0Ox0Ox1ky1ky0Ox1ky1rp1g22vo2vo1Ku1Uk2gc0Oi0Oi0PU0PU0P80P81ja1ja17c17c0Oi0Oi0Xn0Xn3iF*0922D*0j2vo*031VS2vo1VS29Y2vo*052p82p82vo*021x+2vo*041Wo1Wo2vo*0222D2vo*0c",
				fonts: "-*230*0b-1*0L-11-*0b1*06-*071*0c-*0A2-2*08-2*02-2*02-2*02-2*0O3*034*0s3*0i453343*0243*0243*024*033*0b4-3*07--453*03453363*024343*0263*0243*04-*0233-3*07443*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*076*023*046363*046*0b3*0a66336366363*0h633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g-*093*0k6*023*0863*0d63*0d6"
			}
		},
		{
			name: "Aptos",
			regular: {
				widths: "!000*0I0XQ0000GZ0000000Hq0000000T5000!*071n+1kI0+m1fr1u50Cy0XL1tz1sb0Cy1fA18218l1tz1tX0Cy0T51pL1iJ1ow1lo1871aN1lW1fA1Iv1Aq!*041d41d41d30AT11a!*0a1ib*0j11a1vH1hu*09!1t01vM1Ck1w91w91F81cW1mV1wV1x+1Hw26G2201x31x31mV1+r28h25j1w91w91rp1LS1kp1vD1yr1yr1yK1yK1KE1J61x31tE1qv1341oB1wi1x31bN1w91Qh1u/1EH1LJ1t01t01iE1630001bN1bN000*06!*031jt0PU1su1cW1531fV1bN1d/000*071u51u51yK1H21Hw1Ox1Ox1AY1UX1UX1LJ1Iq2Cq!*0z1e82sg1e82sg1e8*0a2sg1e8*022sg1e8*022sg1e8*022sg*021e81e82sg1e81e82sg*021e81e82sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg1e81e82sg1e8*072sg1e8*031KJ*0s1e8*032sg*021e8*0b1KJ23/2iz2iz1KJ2iz*021KJ2011JA1r11KJ0S10zu0h11KJ*021NW2iz*0b1uo1Rc26B*0719p19p2sg2dy2sg*032qG1N426B26B2sg26B*022qG26B2qG26B*022sg26B*022qG26B*0415m1R21R226B26B1R226B*071uo1uo26B*0b19p26B*072Ll26B*0a2sg*0326B2sg*0422a22a1ds1W523I1T21T21fm1C52sg2sg1Rc1Rc26B1Lz2sg2sg1RU1RU2sg2da24S*022sg24S1e82sg1ND2sg2sg1aS1fG2sg1uy1vi25x2sg1RU1RZ1SJ2sg2sg2cj*072sg*0323I1pc1pc1m42sg1m42sg1Ua1jE1KX20O1nw2sg*0o1GZ1GZ2sg1GZ2sg2sg1GZ2sg0Zh1iX2352dD16w10l13n1vi1vi2bI29q*072sg1/r1/r2sg2sg1RZ*0523I*032cj*051Mt1Mt2sg*051jk2sg1q22sg2sg1/v2sg*031YV28v28v1Iq1Iq2sg1m423S2sg2sg1au1CX2hA2Ge2sg2sg1m4*032nC1m41m41GV*032sg*0U26B2sg*08!2sg*022BO2sg27m1/v2sg*0a1R22sg1/F2sg1/F1/F27d*032sg1GB1KX2a62sg2aO*031/v1/v2sg1/v*0622D2aO2aO2sg2sg2aO*0e2sg2aO2aO2sg2aO*032sg1/m2sg2af*032sg*022aO2sg0CW0N415m0Lo0Lo1hq1hq0Lo1hq1oi1cW2sg2sg1Hn1Ua2d50La0La0MM0MM0L/0L/1g21g21441440La0La0Uf0Uf1R2*091/v*0j2sg*031SJ2sg1SJ26Q2sg*052l/2l/2sg*021uR2sg*041Tg1Tg2sg*021/v2sg*0c",
				fonts: "-*0J4-4--4--4-*084*0q-*044*04-*0a4*0j0*0b-1*0L-11-*0b1*06-*071*0c-*0A2-2*08-2*02-2*02-2*02-2*0O3*034*0s3*0i453343*0243*0243*024*033*0b4-3*07--453*03453363*024343*0263*0243*04-*0233-3*07443*0b-3*0j6*0336*043*0863--33663363*0363363663363*0263*02663*076*023*046363*046*0b3*0a66336366363*0h633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*0536336-6363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663-3*0e-*093*0k6*023*0863*0d63*0d6"
			},
			bold: {
				widths: "!000*0I15Q0000KN0000000Q20000000Yi000!*071r11pZ17l1lW1v/0GG10z1wd1xV0GG1hu1cH1dx1vt1yr0GG0Yi1vR1kW1sN1rK1e31f+1pw1hu1LJ1Fd!*041lj*020Hc1eQ!*0a1nM*0j11a1vH1hu*09!1Gi1Jh1Ma1Hr1Hr1On1k/1ws1E+1Qh1Uu2jY2ly1IT1IT1uo23I2tk2wD1Hr1Hr1Gi1NM1tj1G81Gr1Gr1O41O41Z81Z81IT1ER1DX1i11Gi1Av1IT1iY1Hw1KE1Av1KX20q1yU1yU1n+1ap0001iY1iY000*06!*031jt0RA1yB1b91b91hU1iX1kS000*071wC1yK1LS1Vp1Ku1VS1VS1Gr2mX1UX24H1VS2z8!*0z1e82vj1e82vj1hb*071e81hb1hb2vj1e81hb1hb2vj1e81hb1hb2vj1e81hb1hb2vj*021hb1hb2vj1hb1hb2vj*021hb1hb2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj1hb1hb2vj1hb*072vj1hg*031KJ*0s1hg*032vo*021hg*0b1KJ2782lI2lI1KJ2lI*021KJ23a1MI1ua1KJ0V90CD0k91KJ*021NW2lI*0b1uo1Rc29K*071ce1ce2sg2gG2vo*032qG1Qd29K29K2vo29K*022qG29K2qG29K*022vo29K*022qG29K*041bo1R21R229K29K1R229K*071uo1uo29K*0b1ce29K*072Ot29K*0a2vo*0329K2vo*0425j25j1gA1Zd26Q1W91W91iu1Fd2vo2vo1Rc1Rc29K1OH2vo2vo1V11V12vo2gh27Z*022vo27Z1hg2vo1QK2vo2vo1d/1iO2vo1xG1yr28F2vo1V11V61VS2vo2vo2fs*072vo*0326Q1sk1sk1pc2vo1pc2vo1Xj1mM1O423W1qF2vo*0o1K61K62vo1K62vo2vo1K62vo10p1m426d2gL19E13s16w1yr1yr2eR2cy*072vo22y22y2vo2vo1V6*0526Q*032fs*051PC1PC2vo*051ms2vo1ta2vo2vo22D2vo*032012bE2bE1Lz1Lz2vo1pc26+2vo2vo1dB1G32kJ2Jm2vo2vo1pc*032qL1pc1pc1K1*032vo*0U29K2vo*08!2vo*022EX2vo2au22D2vo*0a1R22vo22N2vo22N22N2ak*032vo1JK1O42de2vo2dW*0322D22D2vo22D*0625M2dW2dW2vo2vo2dW*0e2vo2dW2dW2vo2dW*032vo22t2vo2do*032vo*022dW2vo0G20Qc18v0Ox0Ox1ky1ky0Ox1ky1rp1g22vo2vo1Ku1S22gc0Oi0Oi0PU0PU0P80P81ja1ja17c17c0Oi0Oi0Xn0Xn1R2*0922D*0j2vo*031VS2vo1VS29Y2vo*052p82p82vo*021x+2vo*041Wo1Wo2vo*0222D2vo*0c",
				fonts: "-*0J4-4--4--4-*084*0q-*044*04-*0a4*0j0*0b-1*0L-11-*0b1*06-*071*0c-*0A2-2*08-2*02-2*02-2*02-2*0O3*034*0s3*0i453343*0243*0243*024*033*0b4-3*07--453*03453363*024343*0263*0243*04-*0233-3*07443*0b-3*0j6*0336*043*0863--33663363*0363363663363*0263*02663*076*023*046363*046*0b3*0a66336366363*0h633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*0536336-6363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663-3*0e-*093*0k6*023*0863*0d63*0d6"
			}
		},
		{
			name: "Aptos Narrow",
			regular: {
				widths: "!000*0I0XQ0000GZ0000000Hq0000000T5000!*071n+1kI0+m1fr1u50Cy0XL1tz1sb0Cy1fA18218l1tz1tX0Cy0T51pL1iJ1ow1lo1871aN1lW1fA1Iv1Aq!*041d41d41d30AT11a!*0a1ib*0j11a1vH1hu*09!1t01vM1Ck1w91w91F81cW1mV1wV1x+1Hw26G2201x31x31mV1+r28h25j1w91w91rp1LS1kp1vD1yr1yr1yK1yK1KE1J61x31tE1qv1341oB1wi1x31bN1w91Qh1u/1EH1LJ1t01t01iE1630001bN1bN000*06!*031fc0PU1su1cW1531fV1bN1d/000*071u51u51yK1H21Hw1Ox1Ox1AY1UX1UX1LJ1Iq2Cq!*0z1e82sg1e82sg1e8*0a2sg1e8*022sg1e8*022sg1e8*022sg*021e81e82sg1e81e82sg*021e81e82sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg1e81e82sg1e8*072sg1e8*031KJ*0s1e8*032sg*021e8*0b1KJ23/2iz2iz1KJ2iz*021KJ2011JA1r11KJ0S10zu0h11KJ*021NW2iz*0b1uo1Rc26B*071by1by2sg2dy2sg*032qG1N426B26B2sg26B*022qG26B2qG26B*022sg26B*022qG26B*0414Q1R21R226B26B1R226B*071uo1uo26B*0b1by26B*072Ll26B*0a2sg*0326B2sg*0422a22a1ds1W523I1T21T21fm1C52sg2sg1Rc1Rc26B1Lz2sg2sg1RU1RU2sg2da24S*022sg24S1e82sg1ND2sg2sg1aS1fG2sg1uy1vi25x2sg1RU1RZ1SJ2sg2sg2cj*072sg*0323I1pc1pc1m42sg1m42sg1Ua1jE1KX20O1nw2sg*0o1GZ1GZ2sg1GZ2sg2sg1GZ2sg0Zh1iX2352dD16w10l13n1vi1vi2bI29q*072sg1/r1/r2sg2sg1RZ*0523I*032cj*051Mt1Mt2sg*051jk2sg1q22sg2sg1/v2sg*031YV28v28v1Iq1Iq2sg1m423S2sg2sg1au1CX2hA2Ge2sg2sg1m4*032nC1m41m41GV*032sg*0U26B2sg*08!2sg*022BO2sg27m1/v2sg*0a1R22sg1/F2sg1/F1/F27d*032sg1GB1KX2a62sg2aO*031/v1/v2sg1/v*0622D2aO2aO2sg2sg2aO*0e2sg2aO2aO2sg2aO*032sg1/m2sg2af*032sg*022aO2sg0CW0N415m0Lo0Lo1hq1hq0Lo1hq1oi1cW2sg2sg1Hn1Uk2d50La0La0MM0MM0L/0L/1g21g21441440La0La0Uf0Uf1R2*091/v*0j2sg*031SJ2sg1SJ26Q2sg*052l/2l/2sg*021uR2sg*041Tg1Tg2sg*021/v2sg*0c",
				fonts: "-*0J4-4--4--4-*084*0q-*044*04-*0a4*0j0*0b-1*0L-11-*0b1*06-*071*0c-*0A2-2*08-2*02-2*02-2*02-2*0O3*034*0s3*0i453343*0243*0243*024*033*0b4-3*07--453*03453363*024343*0263*0243*04-*0233-3*07443*0b-3*0j6*0336*043*0863--33663363*0363363663363*0263*02663*076*023*046363*046*0b3*0a66336366363*0h633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*0536336-6363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663-3*0e-*093*0k6*023*0863*0d63*0d6"
			},
			bold: {
				widths: "!000*0I15Q0000KN0000000Q20000000Yi000!*071r11pZ17l1lW1v/0GG10z1wd1xV0GG1hu1cH1dx1vt1yr0GG0Yi1vR1kW1sN1rK1e31f+1pw1hu1LJ1Fd!*041lj*020Hc1eQ!*0a1nM*0j11a1vH1hu*09!1Gi1Jh1Ma1Hr1Hr1On1k/1ws1E+1Qh1Uu2jY2ly1IT1IT1uo23I2tk2wD1Hr1Hr1Gi1NM1tj1G81Gr1Gr1O41O41Z81Z81IT1ER1DX1i11Gi1Av1IT1iY1Hw1KE1Av1KX20q1yU1yU1n+1ap0001iY1iY000*06!*031fc0RA1yB1b91b91hU1iX1kS000*071wC1yK1LS1Vp1Ku1VS1VS1Gr2mX1UX24H1VS2z8!*0z1e82vj1e82vj1hb*071e81hb1hb2vj1e81hb1hb2vj1e81hb1hb2vj1e81hb1hb2vj*021hb1hb2vj1hb1hb2vj*021hb1hb2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj1hb1hb2vj1hb*072vj1hg*031KJ*0s1hg*032vo*021hg*0b1KJ2782lI2lI1KJ2lI*021KJ23a1MI1ua1KJ0V90CD0k91KJ*021NW2lI*0b1uo1Rc29K*071d91dd2sg2gG2vo*032qG1Qd29K29K2vo29K*022qG29K2qG29K*022vo29K*022qG29K*0419z1R21R229K29K1R229K*071uo1uo29K*0b1d829K*072Ot29K*0a2vo*0329K2vo*0425j25j1gA1Zd26Q1W91W91iu1Fd2vo2vo1Rc1Rc29K1OH2vo2vo1V11V12vo2gh27Z*022vo27Z1hg2vo1QK2vo2vo1d/1iO2vo1xG1yr28F2vo1V11V61VS2vo2vo2fs*072vo*0326Q1sk1sk1pc2vo1pc2vo1Xj1mM1O423W1qF2vo*0o1K61K62vo1K62vo2vo1K62vo10p1m426d2gL19E13s16w1yr1yr2eR2cy*072vo22y22y2vo2vo1V6*0526Q*032fs*051PC1PC2vo*051ms2vo1ta2vo2vo22D2vo*032012bE2bE1Lz1Lz2vo1pc26+2vo2vo1dB1G32kJ2Jm2vo2vo1pc*032qL1pc1pc1K1*032vo*0U29K2vo*08!2vo*022EX2vo2au22D2vo*0a1R22vo22N2vo22N22N2ak*032vo1JK1O42de2vo2dW*0322D22D2vo22D*0625M2dW2dW2vo2vo2dW*0e2vo2dW2dW2vo2dW*032vo22t2vo2do*032vo*022dW2vo0G20Qc18v0Ox0Ox1ky1ky0Ox1ky1rp1g22vo2vo1Ku1Sq2gc0Oi0Oi0PU0PU0P80P81ja1ja17c17c0Oi0Oi0Xn0Xn1R2*0922D*0j2vo*031VS2vo1VS29Y2vo*052p82p82vo*021x+2vo*041Wo1Wo2vo*0222D2vo*0c",
				fonts: "-*0J4-4--4--4-*084*0q-*044*04-*0a4*0j0*0b-1*0L-11-*0b1*06-*071*0c-*0A2-2*08-2*02-2*02-2*02-2*0O3*034*0s3*0i453343*0243*0243*024*033*0b4-3*07--453*03453363*024343*0263*0243*04-*0233-3*07443*0b-3*0j6*0336*043*0863--33663363*0363363663363*0263*02663*076*023*046363*046*0b3*0a66336366363*0h633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*0536336-6363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663-3*0e-*093*0k6*023*0863*0d63*0d6"
			}
		},
		{
			name: "Trebuchet MS",
			regular: {
				widths: "!000*0I0XQ0000GZ0000000Hq0000000T5000!*071n+1kI0+m1fr1u50Cy0XL1tz1sb0Cy1fA18218l1tz1tX0Cy0T51pL1iJ1ow1lo1871aN1lW1fA1Iv1Aq!*041d41d41d30AT11a!*0a1ib*0j11a1vH1hu*09!1t01vM1Ck1w91w91F81cW1mV1wV1x+1Hw26G2201x31x31mV1+r28h25j1w91w91rp1LS1kp1vD1yr1yr1yK1yK1KE1J61x31tE1qv1341oB1wi1x31bN1w91Qh1u/1EH1LJ1t01t01iE1630001bN1bN000*06!*031s10PU1su1cW1531fV1bN1d/000*071u51u51yK1H21Hw1Ox1Ox1AY1UX1UX1LJ1Iq2Cq!*0z1KJ2sg*021e8*072sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg*021e81e82sg1e81e82sg*021e81e82sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg1e81e82sg1e8*072sg1e8*031KJ*0s1e8*032sg*021e8*0b1KJ23/2iz2iz1KJ2iz*021KJ2011JA1r11KJ0S10zu0h11KJ*021NW2iz*0b1uo1uo26B*070Tp0Tp2sg2dy2sg*032qG1N426B26B2sg26B*022qG26B2qG26B*022sg26B*022qG26B*041dd1uo1sS26B26B1uo26B*071uo1uo26B*0b0Tp26B*072Ll26B*0a2sg*0326B2sg*0422a22a1ds1W523I1T21T21fm1C52sg2sg26B2sg26B1Lz2sg2sg1RU1RU2sg2da24S*022sg24S1e82sg1ND2sg2sg1aS1fG2sg1uy1vi25x2sg1RU1RZ1SJ2sg2sg2cj*072sg*0323I1pc1pc1m42sg1m42sg1Ua1jE1KX20O1nw2sg*0o1GZ1GZ2sg1GZ2sg2sg1GZ2sg0Zh1iX2352dD16w10l13n1vi1vi2bI29q*072sg1/r1/r2sg2sg1RZ*0523I*032cj*051Mt1Mt2sg*051jk2sg1q22sg2sg1/v2sg*031YV28v28v1Iq1Iq2sg1m423S2sg2sg1au1CX2hA2Ge2sg2sg1m4*032nC1m41m41GV*032sg*0U26B2sg*08!2sg*022BO2sg27m1/v2sg*0a1R22sg1/F2sg1/F1/F27d*032sg1GB1KX2a62sg2aO*031/v1/v2sg1/v*0622D2aO2aO2sg2sg2aO*0e2sg2aO2aO2sg2aO*032sg1/m2sg2af*032sg*022aO2sg0CW0N415m0Lo0Lo1hq1hq0Lo1hq1oi1cW2sg2sg1Hn1Rc2d50La0La0MM0MM0L/0L/1g21g21441440La0La0Uf0Uf2XR*022XW2XR*051/v*0j2sg*031SJ2sg1SJ26Q2sg*052l/2l/2sg*021uR2sg*041Tg1Tg2sg*021/v2sg*0c",
				fonts: "-*0J4-4--4--4-*084*0q-*044*04-*0a4*0j0*0b-1*0L-11-*0a1*07-*071*0c-*0z42*1a3*034*0s3*0i453343*0243*0243*024*033*0b4-3*07--453*03453363*024343*0263*0243*04-4433-3*07443*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*076*023*046363*046*0b3*0a66336366363*0h633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g5*093*0k6*023*0863*0d63*0d6"
			},
			bold: {
				widths: "!000*0I15Q0000KN0000000Q20000000Yi000!*071r11pZ17l1lW1v/0GG10z1wd1xV0GG1hu1cH1dx1vt1yr0GG0Yi1vR1kW1sN1rK1e31f+1pw1hu1LJ1Fd!*041lj*020Hc1eQ!*0a1nM*0j11a1vH1hu*09!1Gi1Jh1Ma1Hr1Hr1On1k/1ws1E+1Qh1Uu2jY2ly1IT1IT1uo23I2tk2wD1Hr1Hr1Gi1NM1tj1G81Gr1Gr1O41O41Z81Z81IT1ER1DX1i11Gi1Av1IT1iY1Hw1KE1Av1KX20q1yU1yU1n+1ap0001iY1iY000*06!*031Hc0RA1yB1b91b91hU1iX1kS000*071wC1yK1LS1Vp1Ku1VS1VS1Gr2mX1UX24H1VS2z8!*0z1KJ2vj*021hb*072vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj*021hb1hb2vj1hb1hb2vj*021hb1hb2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj1hb1hb2vj1hb*072vj1hg*031KJ*0s1hg*032vo*021hg*0b1KJ2782lI2lI1KJ2lI*021KJ23a1MI1ua1KJ0V90CD0k91KJ*021NW2lI*0b1uo1uo29K*070Tp0Tp2sg2gG2vo*032qG1Qd29K29K2vo29K*022qG29K2qG29K*022vo29K*022qG29K*041tN1uo1sS29K29K1uo29K*071uo1uo29K*0b0Tp29K*072Ot29K*0a2vo*0329K2vo*0425j25j1gA1Zd26Q1W91W91iu1Fd2vo2vo29K2vo29K1OH2vo2vo1V11V12vo2gh27Z*022vo27Z1hg2vo1QK2vo2vo1d/1iO2vo1xG1yr28F2vo1V11V61VS2vo2vo2fs*072vo*0326Q1sk1sk1pc2vo1pc2vo1Xj1mM1O423W1qF2vo*0o1K61K62vo1K62vo2vo1K62vo10p1m426d2gL19E13s16w1yr1yr2eR2cy*072vo22y22y2vo2vo1V6*0526Q*032fs*051PC1PC2vo*051ms2vo1ta2vo2vo22D2vo*032012bE2bE1Lz1Lz2vo1pc26+2vo2vo1dB1G32kJ2Jm2vo2vo1pc*032qL1pc1pc1K1*032vo*0U29K2vo*08!2vo*022EX2vo2au22D2vo*0a1Ua2vo22N2vo22N22N2ak*032vo1JK1O42de2vo2dW*0322D22D2vo22D*0625M2dW2dW2vo2vo2dW*0e2vo2dW2dW2vo2dW*032vo22t2vo2do*032vo*022dW2vo0G20Qc18v0Ox0Ox1ky1ky0Ox1ky1rp1g22vo2vo1Ku1Uk2gc0Oi0Oi0PU0PU0P80P81ja1ja17c17c0Oi0Oi0Xn0Xn2++*022/32++*0522D*0j2vo*031VS2vo1VS29Y2vo*052p82p82vo*021x+2vo*041Wo1Wo2vo*0222D2vo*0c",
				fonts: "-*0J4-4--4--4-*084*0q-*044*04-*0a4*0j0*0b-1*0L-11-*0a1*07-*071*0c-*0z42*1a3*034*0s3*0i453343*0243*0243*024*033*0b4-3*07--453*03453363*024343*0263*0243*04-4433-3*07443*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*076*023*046363*046*0b3*0a66336366363*0h633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g5*093*0k6*023*0863*0d63*0d6"
			}
		},
		{
			name: "Georgia",
			regular: {
				widths: "!000*0I!000!000000!000000!000!*1o0ZU0+c16Z0+c0+v1bC0Nd0Tu12U0/i14L1f51hz11D12r0X31hU1hq1jr0+v0+F0ZK16k0Xn17U16k16k0Z70Z718x18x10J11D0RC0Rs0ZK0ZK10S0Tk0YX14V14M18+1770ZA0V+0+v0TX0000Iy0Iy000*06!*0314O0qf0WW0Rs0LP0RM0JE12r000*0712U0+R0/81oN1fJ1g01ix12K1jL1es0/L19B1/v!*0z1KJ2sg1KJ2sg1e8*071KJ1e81e82sg1KJ1e81e82sg1KJ1e81e82sg1KJ1e81e82sg*021e81e82sg1e81e82sg*021e81e82sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg1e81e82sg1e8*072sg1e8*03!*0s1e8*032sg*021e8*0b!23/2iz2iz!2iz*02!2011JA1r1!0S10zu0h1!*032iz*0b!1uo26B*070Tp0Tp!2dy2sg*03!1N426B26B2sg26B*02!26B!26B*022sg26B*02!26B*041nM!!26B26B1uo26B*07!!26B*0b0Tp26B*072Ll26B*0a2sg*0326B2sg*0422a22a1ds1W523I1T21T21fm1C52sg2sg26B2sg26B1Lz2sg2sg1RU1RU2sg2da24S*022sg24S1e82sg1ND2sg2sg1aS1fG2sg1uy1vi25x2sg1RU1RZ1SJ2sg2sg2cj*072sg*0323I1pc1pc1m42sg1m42sg1Ua1jE1KX20O1nw2sg*0o1GZ1GZ2sg1GZ2sg2sg1GZ2sg0Zh1e82352dD16w10l13n1vi1vi2bI29q*072sg1/r1/r2sg2sg1RZ*0523I*032cj*051Mt1Mt2sg*051jk2sg1q22sg2sg1/v2sg*031YV28v28v1Iq1Iq2sg1m423S2sg2sg1au1CX2hA2Ge2sg2sg1m4*032nC1m41m41GV*032sg*0U26B2sg*08!2sg*022BO2sg27m1/v2sg*0a1R22sg1/F2sg1/F1/F27d*032sg1GB1KX2a62sg2aO*031/v1/v2sg1/v*0622D2aO2aO2sg2sg2aO*0e2sg2aO2aO2sg2aO*032sg1/m2sg2af*032sg*022aO2sg0CW0N415m0Lo0Lo1hq1hq0Lo1hq1oi1cW2sg2sg1Hn1Rc2d50La0La0MM0MM0L/0L/1g21g21441440La0La0Uf0Uf2XR*022XW2XR*051/v*0j2sg*031SJ2sg1SJ26Q2sg*052l/2l/2sg*021uR2sg*041Tg1Tg2sg*021/v2sg*0c",
				fonts: "-*2g8*0L-88-*0a8*07-*078*0c-*0A9-9*08-9*02-9*02-9*02-9*0O3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*07-*0253*03-53363*02-3-3*0263*02-3*04-*0233-3*07--3*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*076*023*046363*046*0b3*0a66336366363-3*0f633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g5*093*0k6*023*0863*0d63*0d6"
			},
			bold: {
				widths: "!000*0I!000!000000!000000!000!*1o0XS10S16N0/811t1d/0OE0Xn12A0+/19r1in1l915p16a0Yk1ib1nH1kS10d11k0+c15T0XS17U15315p10J10J1db1db13H13/0VR0SA0Yu0XS14i0Uh11a15311D18b1oN0XS0Wt14M0SJ0000Io0Io000*06!*0314O0rd0TD0De0Af0Ju0KV0QP000*070TN0Xn0TX1iH1dR1dx1fo0TD1gt1eB0YE1cK20i!*0z1KJ2vj1KJ2vj1hb*071KJ1hb1hb2vj1KJ1hb1hb2vj1KJ1hb1hb2vj1KJ1hb1hb2vj*021hb1hb2vj1hb1hb2vj*021hb1hb2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj1hb1hb2vj1hb*072vj1hg*03!*0s1hg*032vo*021hg*0b!2782lI2lI!2lI*02!23a1MI1ua!0V90CD0k9!*032lI*0b!1uo29K*070Tp0Tp!2gG2vo*03!1Qd29K29K2vo29K*02!29K!29K*022vo29K*02!29K*041Ma!!29K29K1uo29K*07!!29K*0b0Tp29K*072Ot29K*0a2vo*0329K2vo*0425j25j1gA1Zd26Q1W91W91iu1Fd2vo2vo29K2vo29K1OH2vo2vo1V11V12vo2gh27Z*022vo27Z1hg2vo1QK2vo2vo1d/1iO2vo1xG1yr28F2vo1V11V61VS2vo2vo2fs*072vo*0326Q1sk1sk1pc2vo1pc2vo1Xj1mM1O423W1qF2vo*0o1K61K62vo1K62vo2vo1K62vo10p1e826d2gL19E13s16w1yr1yr2eR2cy*072vo22y22y2vo2vo1V6*0526Q*032fs*051PC1PC2vo*051ms2vo1ta2vo2vo22D2vo*032012bE2bE1Lz1Lz2vo1pc26+2vo2vo1dB1G32kJ2Jm2vo2vo1pc*032qL1pc1pc1K1*032vo*0U29K2vo*08!2vo*022EX2vo2au22D2vo*0a1Ua2vo22N2vo22N22N2ak*032vo1JK1O42de2vo2dW*0322D22D2vo22D*0625M2dW2dW2vo2vo2dW*0e2vo2dW2dW2vo2dW*032vo22t2vo2do*032vo*022dW2vo0G20Qc18v0Ox0Ox1ky1ky0Ox1ky1rp1g22vo2vo1Ku1Uk2gc0Oi0Oi0PU0PU0P80P81ja1ja17c17c0Oi0Oi0Xn0Xn2++*022/32++*0522D*0j2vo*031VS2vo1VS29Y2vo*052p82p82vo*021x+2vo*041Wo1Wo2vo*0222D2vo*0c",
				fonts: "-*2ga*0L-aa-*0aa*07-*07a*0c-*0A9-9*08-9*02-9*02-9*02-9*0O3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*07-*0253*03-53363*02-3-3*0263*02-3*04-*0233-3*07--3*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*076*023*046363*046*0b3*0a66336366363-3*0f633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g5*093*0k6*023*0863*0d63*0d6"
			}
		},
		{
			name: "Verdana",
			regular: {
				widths: "!000*0I0XQ0000GZ0000000Hq0000000T5000!*071n+1kI0+m1fr1u50Cy0XL1tz1sb0Cy1fA18218l1tz1tX0Cy0T51pL1iJ1ow1lo1871aN1lW1fA1Iv1Aq!*041d41d41d30AT11a!*0a1ib*0j11a1vH1hu*09!1t01vM1Ck1w91w91F81cW1mV1wV1x+1Hw26G2201x31x31mV1+r28h25j1w91w91rp1LS1kp1vD1yr1yr1yK1yK1KE1J61x31tE1qv1341oB1wi1x31bN1w91Qh1u/1EH1LJ1t01t01iE1630001bN1bN000*06!*031H70PU1su1cW1531fV1bN1d/000*071u51u51yK1H21Hw1Ox1Ox1AY1UX1UX1LJ1Iq2Cq!*0z1KJ2sg1KJ2sg1e8*071KJ1e81e82sg1KJ1e81e82sg1KJ1e81e82sg1KJ1e81e82sg*021e81e82sg1e81e82sg*021e81e82sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg1e81e82sg1e8*072sg1e8*031KJ*0s1e8*032sg*021e8*0b1KJ23/2iz2iz1KJ2iz*021KJ2011JA1r11KJ0S10zu0h11KJ*021NW2iz*0b1uo1uo26B*070Tp0Tp2sg2dy2sg*032qG1N426B26B2sg26B*022qG26B2qG26B*022sg26B*022qG26B*041/U1uo1sS26B26B1uo26B*071uo1uo26B*0b0Tp26B*072Ll26B*0a2sg*0326B2sg*0422a22a1ds1W523I1T21T21fm1C52sg2sg26B2sg26B1Lz2sg2sg1RU1RU2sg2da24S*022sg24S1e82sg1ND2sg2sg1aS1fG2sg1uy1vi25x2sg1RU1RZ1SJ2sg2sg2cj*072sg*0323I1pc1pc1m42sg1m42sg1Ua1jE1KX20O1nw2sg*0o1GZ1GZ2sg1GZ2sg2sg1GZ2sg0Zh1e82352dD16w10l13n1vi1vi2bI29q*072sg1/r1/r2sg2sg1RZ*0523I*032cj*051Mt1Mt2sg*051jk2sg1q22sg2sg1/v2sg*031YV28v28v1Iq1Iq2sg1m423S2sg2sg1au1CX2hA2Ge2sg2sg1m4*032nC1m41m41GV*032sg*0U26B2sg*08!2sg*022BO2sg27m1/v2sg*0a1R22sg1/F2sg1/F1/F27d*032sg1GB1KX2a62sg2aO*031/v1/v2sg1/v*0622D2aO2aO2sg2sg2aO*0e2sg2aO2aO2sg2aO*032sg1/m2sg2af*032sg*022aO2sg0CW0N415m0Lo0Lo1hq1hq0Lo1hq1oi1cW2sg2sg1Hn1Rc2d50La0La0MM0MM0L/0L/1g21g21441440La0La0Uf0Uf2XR*022XW2XR*051/v*0j2sg*031SJ2sg1SJ26Q2sg*052l/2l/2sg*021uR2sg*041Tg1Tg2sg*021/v2sg*0c",
				fonts: "-*0J4-4--4--4-*084*0q-*044*04-*0a4*0j0*0b-1*0L-11-*0b1*06-*071*0c-*0A2-2*08-2*02-2*02-2*02-2*0O3*034*0s3*0i453343*0243*0243*024*033*0b4-3*07--453*03453363*024343*0263*0243*04-4433-3*07443*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*076*023*046363*046*0b3*0a66336366363-3*0f633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g5*093*0k6*023*0863*0d63*0d6"
			},
			bold: {
				widths: "!000*0I15Q0000KN0000000Q20000000Yi000!*071r11pZ17l1lW1v/0GG10z1wd1xV0GG1hu1cH1dx1vt1yr0GG0Yi1vR1kW1sN1rK1e31f+1pw1hu1LJ1Fd!*041lj*020Hc1eQ!*0a1nM*0j11a1vH1hu*09!1Gi1Jh1Ma1Hr1Hr1On1k/1ws1E+1Qh1Uu2jY2ly1IT1IT1uo23I2tk2wD1Hr1Hr1Gi1NM1tj1G81Gr1Gr1O41O41Z81Z81IT1ER1DX1i11Gi1Av1IT1iY1Hw1KE1Av1KX20q1yU1yU1n+1ap0001iY1iY000*06!*031T20RA1yB1b91b91hU1iX1kS000*071wC1yK1LS1Vp1Ku1VS1VS1Gr2mX1UX24H1VS2z8!*0z1KJ2vj1KJ2vj1hb*071KJ1hb1hb2vj1KJ1hb1hb2vj1KJ1hb1hb2vj1KJ1hb1hb2vj*021hb1hb2vj1hb1hb2vj*021hb1hb2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj1hb1hb2vj1hb*072vj1hg*031KJ*0s1hg*032vo*021hg*0b1KJ2782lI2lI1KJ2lI*021KJ23a1MI1ua1KJ0V90CD0k91KJ*021NW2lI*0b1uo1uo29K*070Tp0Tp2sg2gG2vo*032qG1Qc29K29K2vo29K*022qG29K2qG29K*022vo29K*022qG29K*0427w1uo1sS29K29K1uo29K*071uo1uo29K*0b0Tp29K*072Ot29K*0a2vo*0329K2vo*0425j25j1gA1Zd26Q1W91W91iu1Fd2vo2vo29K2vo29K1OH2vo2vo1V11V12vo2gh27Z*022vo27Z1hg2vo1QK2vo2vo1d/1iO2vo1xG1yr28F2vo1V11V61VS2vo2vo2fs*072vo*0326Q1sk1sk1pc2vo1pc2vo1Xj1mM1O423W1qF2vo*0o1K61K62vo1K62vo2vo1K62vo10p1e826d2gL19E13s16w1yr1yr2eR2cy*072vo22y22y2vo2vo1V6*0526Q*032fs*051PC1PC2vo*051ms2vo1ta2vo2vo22D2vo*032012bE2bE1Lz1Lz2vo1pc26+2vo2vo1dB1G32kJ2Jm2vo2vo1pc*032qL1pc1pc1K1*032vo*0U29K2vo*08!2vo*022EX2vo2au22D2vo*0a1Ua2vo22N2vo22N22N2ak*032vo1JK1O42de2vo2dW*0322D22D2vo22D*0625M2dW2dW2vo2vo2dW*0e2vo2dW2dW2vo2dW*032vo22t2vo2do*032vo*022dW2vo0G20Qc18v0Ox0Ox1ky1ky0Ox1ky1rp1g22vo2vo1Ku1Uk2gc0Oi0Oi0PU0PU0P80P81ja1ja17c17c0Oi0Oi0Xn0Xn2++*022/32++*0522D*0j2vo*031VS2vo1VS29Y2vo*052p82p82vo*021x+2vo*041Wo1Wo2vo*0222D2vo*0c",
				fonts: "-*0J4-4--4--4-*084*0q-*044*04-*0a4*0j0*0b-1*0L-11-*0b1*06-*071*0c-*0A2-2*08-2*02-2*02-2*02-2*0O3*034*0s3*0i453343*0243*0243*024*033*0b4-3*07--453*03453363*024343*0263*0243*04-4433-3*07443*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*076*023*046363*046*0b3*0a66336366363-3*0f633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g5*093*0k6*023*0863*0d63*0d6"
			}
		},
		{
			name: "Tahoma",
			regular: {
				widths: "!000*0I0XQ0000zl0000000Tf0000000+F000!*071F81zZ19z1tS1GZ0GQ0MI1GZ1Jh0GQ1x3*021GZ1GZ0Uy0+F1O91Bl1Du1BT1ap1sp1FR1oZ1/r1KO!*041lD*020w+0+K!*0a1pl*0j11a1vH1hu*09!1t01vM1Ck1w91w91F81cW1mV1wV1x+1Hw26G2201x31x31mV1+r28h25j1w91w91rp1LS1kp1vD1yr1yr1yK1yK1KE1J61x31tE1qv1341oB1wi1x31bN1w91Qh1u/1EH1LJ1t01t01iE1630001bN1bN000*06!*031s10PU1su1cW1531fV1bN1d/000*071u51u51yK1H21Hw1Ox1Ox1AY1UX1UX1LJ1Iq2Cq!*0z1KJ2sg1KJ2sg1e8*071KJ1e81e82sg1KJ1e81e82sg1KJ1e81e82sg1KJ1e81e82sg1KJ2sg1e81e82sg1e81e82sg1KJ2sg1e81e82sg1e81e82sg1KJ1e81e82sg2sg1e81e82sg1KJ1e81e82sg2sg1e81e82sg1KJ1e81e82sg1e81e82sg1e8*072sg1e8*031KJ*0s1e8*032sg*021e8*0b1KJ23/2iz2iz1KJ2iz*021KJ2011JA1r11KJ0S10zu0h11KJ*021NW2iz*0b1uo1uo26B*070Tp0Tp2sg2dy2sg*032qG1N426B26B2sg26B*022qG26B2qG26B*022sg26B*022qG26B*041NI1uo1sS26B26B1uo26B*071uo1uo26B*0b0Tp26B*072Ll26B*0a2sg*0326B2sg*0422a22a1ds1W523I1T21T21fm1C52sg2sg26B2sg26B1Lz2sg2sg1RU1RU2sg2da24S*022sg24S1e82sg1ND2sg2sg1aS1fG2sg1uy1vi25x2sg1RU1RZ1SJ2sg2sg2cj*072sg2sg2vy2Ar2fd1pc1pc1m41Rc1m41Rc1Ua1jE1KX20O1nw2sg*0n1j11NI1GZ1Cz1GZ1sO1fL1GZ2sg0Zh1e81Rc2dD16w10l1mV1vi1vi2bI29q*072sg1/r1/r2sg2sg1RZ*0523I*032cj*051Mt1Mt2sg*051jk2sg1q22sg2sg1/v2sg*031YV28v28v1Iq1Iq2sg1m423S2sg2sg1au1CX2hA2Ge2sg2sg1m4*032nC1m41m41GV*032sg*0U26B2sg*08!2sg*022BO2sg27m1/v2sg*0a1R22sg1/F2sg1/F1/F27d*032sg1GB1KX2a62sg2aO*031/v1/v2sg1/v*0622D2aO2aO2sg2sg2aO*0e2sg2aO2aO2sg2aO*032sg1/m2sg2af*032sg*022aO2sg0CW0N415m0Lo0Lo1hq1hq0Lo1hq1oi1cW2sg2sg1Hn1Rc2d50La0La0MM0MM0L/0L/1g21g21441440La0La0Uf0Uf2XR*022XW2XR*051/v*0j2sg*031SJ2sg1SJ26Q2sg*052l/2l/2sg*021uR2sg*041Tg1Tg2sg*021/v2sg*0c",
				fonts: "-*230*0b-*202-2*08-2*02-2*02-2*02-2*02-2*06-2*06-2*06-2*06-2*0e3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*07-*0253*03-53363*02-3-3*0263*02-3*04-*0233-3*07--3*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*0766-*023*02-3-3*046*0b3*0a6--3-3--363--3*02-3*0a633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g5*093*0k6*023*0863*0d63*0d6"
			},
			bold: {
				widths: "!000*0I13C0000LD0000000UN0000001bC000!*071Tl1J61kD1C/1Tl0U00Wx1Tl1UI0RJ1FH1F31BY1Tl1Tl1201bC1Y81NR1IT1GL1oG1Eo1LX1Bf25x1Z8!*041M01Ku1IY0H21ct!*0a1vD*021zr*061vD*021zr*0611a1vH1hu*09!1Gi1Jh1Ma1Hr1Hr1On1k/1ws1E+1Qh1Uu2jY2ly1IT1IT1uo23I2tk2wD1Hr1Hr1Gi1NM1tj1G81Gr1Gr1O41O41Z81Z81IT1ER1DX1i11Gi1Av1IT1iY1Hw1KE1Av1KX20q1yU1yU1n+1ap0001iY1iY000*06!*031Hc0RA1yB1b91b91hU1iX1kS000*071wC1yK1LS1Vp1Ku1VS1VS1Gr2mX1UX24H1VS2z8!*0z1KJ2vj1KJ2vj1hb*071KJ1hb1hb2vj1KJ1hb1hb2vj1KJ1hb1hb2vj1KJ1hb1hb2vj1KJ2vj1hb1hb2vj1hb1hb2vj1KJ2vj1hb1hb2vj1hb1hb2vj1KJ1hb1hb2vj2vj1hb1hb2vj1KJ1hb1hb2vj2vj1hb1hb2vj1KJ1hb1hb2vj1hb1hb2vj1hb*072vj1hg*031KJ*0s1hg*032vo*021hg*0b1KJ2782lI2lI1KJ2lI*021KJ23a1MI1ua1KJ0V90CD0k91KJ*021NW2lI*0b1uo1uo29K*070Tp0Tp2sg2gG2vo*032qG1Qd29K29K2vo29K*022qG29K2qG29K*022vo29K*022qG29K*041/U1uo1sS29K29K1uo29K*071uo1uo29K*0b0Tp29K*072Ot29K*0a2vo*0329K2vo*0425j25j1gA1Zd26Q1W91W91iu1Fd2vo2vo29K2vo29K1OH2vo2vo1V11V12vo2gh27Z*022vo27Z1hg2vo1QK2vo2vo1d/1iO2vo1xG1yr28F2vo1V11V61VS2vo2vo2fs*072vo2vo2vy2Ar2fd1sk1sk1pc1Rc1pc1Rc1Xj1mM1O423W1qF2vo*0n1j11/U1K61Cz1K61sO1fL1K62vo10p1e81Rc2gL19E13s1mV1yr1yr2eR2cy*072vo22y22y2vo2vo1V6*0526Q*032fs*051PC1PC2vo*051ms2vo1ta2vo2vo22D2vo*032012bE2bE1Lz1Lz2vo1pc26+2vo2vo1dB1G32kJ2Jm2vo2vo1pc*032qL1pc1pc1K1*032vo*0U29K2vo*08!2vo*022EX2vo2au22D2vo*0a1Ua2vo22N2vo22N22N2ak*032vo1JK1O42de2vo2dW*0322D22D2vo22D*0625M2dW2dW2vo2vo2dW*0e2vo2dW2dW2vo2dW*032vo22t2vo2do*032vo*022dW2vo0G20Qc18v0Ox0Ox1ky1ky0Ox1ky1rp1g22vo2vo1Ku1Uk2gc0Oi0Oi0PU0PU0P80P81ja1ja17c17c0Oi0Oi0Xn0Xn2++*022/32++*0522D*0j2vo*031VS2vo1VS29Y2vo*052p82p82vo*021x+2vo*041Wo1Wo2vo*0222D2vo*0c",
				fonts: "-*230*0b-*202-2*08-2*02-2*02-2*02-2*02-2*06-2*06-2*06-2*06-2*0e3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*07-*0253*03-53363*02-3-3*0263*02-3*04-*0233-3*07--3*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*0766-*023*02-3-3*046*0b3*0a6--3-3--363--3*02-3*0a633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g5*093*0k6*023*0863*0d63*0d6"
			}
		},
		{
			name: "Century Gothic",
			regular: {
				widths: "!000*0I0XQ0000GZ0000000Hq0000000T5000!*071n+1kI0+m1fr1u50Cy0XL1tz1sb0Cy1fA18218l1tz1tX0Cy0T51pL1iJ1ow1lo1871aN1lW1fA1Iv1Aq!*041d41d41d30AT11a!*0a1ib*0j11a1vH1hu*09!1t01vM1Ck1w91w91F81cW1mV1wV1x+1Hw26G2201x31x31mV1+r28h25j1w91w91rp1LS1kp1vD1yr1yr1yK1yK1KE1J61x31tE1qv1341oB1wi1x31bN1w91Qh1u/1EH1LJ1t01t01iE1630001bN1bN000*06!*031s10PU1su1cW1531fV1bN1d/000*071u51u51yK1H21Hw1Ox1Ox1AY1UX1UX1LJ1Iq2Cq!*0z1Lp2sg1Lp2sg1e8*071Lp1e81e82sg1Lp1e81e82sg1Lp1e81e82sg1Lp1e81e82sg1Lp2sg1e81e82sg1e81e82sg1Lp2sg1e81e82sg1e81e82sg1Lp1e81e82sg2sg1e81e82sg1Lp1e81e82sg2sg1e81e82sg1Lp1e81e82sg1e81e82sg1e8*072sg1e8*031Lp*0s1e8*032sg*021e8*0b1Lp23/2iz2iz1Lp2iz*021Lp2011JA1r11Lp0S10zu0h11Lp*021O42iz*0b1uo1uo26B*070Tp0Tp2sg2dy2sg*032qG1N426B26B2sg26B*022qG26B2qG26B*022sg26B*022qG26B*041dd1tN1sS26B26B1uo26B*071tN1tN26B*0b0Tp26B*072Ll26B*0a2sg*0326B2sg*0422a22a1ds1W523I1T21T21fm1C52sg2sg26B2sg26B1Lz2sg2sg1RU1RU2sg2da24S*022sg24S1e82sg1ND2sg2sg1aS1fG2sg1uy1vi25x2sg1RU1RZ1SJ2sg2sg2cj*072sg2sg2vy2Ar2fi1pc1pc1m41mj1m41Ee1Ua1jE1KX20O1nw2sg*0n1jk1GZ1GZ1Dj1GZ1sk1fc1GZ2sg0Zh1Uu2sg2dD16w10l13n1vi1vi2bI29q*072sg1/r1/r2sg2sg1RZ*0523I*032cj*051Mt1Mt2sg*051jk2sg1q22sg2sg1/v2sg*031YV28v28v1Iq1Iq2sg1m423S2sg2sg1au1CX2hA2Ge2sg2sg1m4*032nC1m41m41GV*032sg*0U26B2sg*08!2sg*022BO2sg27m1/v2sg*0a1R22sg1/F2sg1/F1/F27d*032sg1GB1KX2a62sg2aO*031/v1/v2sg1/v*0622D2aO2aO2sg2sg2aO*0e2sg2aO2aO2sg2aO*032sg1/m2sg2af*032sg*022aO2sg0CW0N415m0Lo0Lo1hq1hq0Lo1hq1oi1cW2sg2sg1Hn1Rc2d50La0La0MM0MM0L/0L/1g21g21441440La0La0Uf0Uf2XR*022XW2XR*051/v*0j2sg*031SJ2sg1SJ26Q2sg*052l/2l/2sg*021uR2sg*041Tg1Tg2sg*021/v2sg*0c",
				fonts: "-*0J4-4--4--4-*084*0q-*044*04-*0a4*0j0*0b-1*0L-11-*0a1*07-*071*0c-*0A2-2*08-2*02-2*02-2*02-2*02-2*06-2*06-2*06-2*06-2*0e3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*07-*0253*03-53363*02-3-3*0263*02-3*04--433-3*07--3*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*0766-*023*02-3-3*046*0b3*0a6-33-3--363--3*0e633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g5*093*0k6*023*0863*0d63*0d6"
			},
			bold: {
				widths: "!000*0I15Q0000KN0000000Q20000000Yi000!*071r11pZ17l1lW1v/0GG10z1wd1xV0GG1hu1cH1dx1vt1yr0GG0Yi1vR1kW1sN1rK1e31f+1pw1hu1LJ1Fd!*041lj*020Hc1eQ!*0a1nM*0j11a1vH1hu*09!1Gi1Jh1Ma1Hr1Hr1On1k/1ws1E+1Qh1Uu2jY2ly1IT1IT1uo23I2tk2wD1Hr1Hr1Gi1NM1tj1G81Gr1Gr1O41O41Z81Z81IT1ER1DX1i11Gi1Av1IT1iY1Hw1KE1Av1KX20q1yU1yU1n+1ap0001iY1iY000*06!*031Hc0RA1yB1b91b91hU1iX1kS000*071wC1yK1LS1Vp1Ku1VS1VS1Gr2mX1UX24H1VS2z8!*0z1Lp2vj1wV2vj1hb*071Lp1hb1hb2vj1Lp1hb1hb2vj1Lp1hb1hb2vj1Lp1hb1hb2vj1Lp2vj1hb1hb2vj1hb1hb2vj1Lp2vj1hb1hb2vj1hb1hb2vj1Lp1hb1hb2vj2vj1hb1hb2vj1Lp1hb1hb2vj2vj1hb1hb2vj1Lp1hb1hb2vj1hb1hb2vj1hb*072vj1hg*031Lp*0s1hg*032vo*021hg*0b1Lp2782lI2lI1Lp2lI*021Lp23a1MI1ua1Lp0V90CD0k91Lp*021O42lI*0b1uo1uo29K*070Tp0Tp2sg2gG2vo*032qG1Qd29K29K2vo29K*022qG29K2qG29K*022vo29K*022qG29K*041dd1tN1sS29K29K1uo29K*071tN1tN29K*0b0Tp29K*072Ot29K*0a2vo*0329K2vo*0425j25j1gA1Zd26Q1W91W91iu1Fd2vo2vo29K2vo29K1OH2vo2vo1V11V12vo2gh27Z*022vo27Z1hg2vo1QK2vo2vo1d/1iO2vo1xG1yr28F2vo1V11V61VS2vo2vo2fs*072vo2vo2vy2Ar2fi1sk1sk1pc1mj1pc1Ee1Xj1mM1O423W1qF2vo*0n1jk1K61K61Dj1K61sk1fc1K62vo10p1Uu2sg2gL19E13s16w1yr1yr2eR2cy*072vo22y22y2vo2vo1V6*0526Q*032fs*051PC1PC2vo*051ms2vo1ta2vo2vo22D2vo*032012bE2bE1Lz1Lz2vo1pc26+2vo2vo1dB1G32kJ2Jm2vo2vo1pc*032qL1pc1pc1K1*032vo*0U29K2vo*08!2vo*022EX2vo2au22D2vo*0a1Ua2vo22N2vo22N22N2ak*032vo1JK1O42de2vo2dW*0322D22D2vo22D*0625M2dW2dW2vo2vo2dW*0e2vo2dW2dW2vo2dW*032vo22t2vo2do*032vo*022dW2vo0G20Qc18v0Ox0Ox1ky1ky0Ox1ky1rp1g22vo2vo1Ku1Uk2gc0Oi0Oi0PU0PU0P80P81ja1ja17c17c0Oi0Oi0Xn0Xn2++*022/32++*0522D*0j2vo*031VS2vo1VS29Y2vo*052p82p82vo*021x+2vo*041Wo1Wo2vo*0222D2vo*0c",
				fonts: "-*0J4-4--4--4-*084*0q-*044*04-*0a4*0j0*0b-1*0L-11-*0a1*07-*071*0c-*0A2-2*08-2*02-2*02-2*02-2*02-2*06-2*06-2*06-2*06-2*0e3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*07-*0253*03-53363*02-3-3*0263*02-3*04--433-3*07--3*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*0766-*023*02-3-3*046*0b3*0a6-33-3--363--3*0e633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g5*093*0k6*023*0863*0d63*0d6"
			}
		},
		{
			name: "Consolas",
			regular: {
				widths: "!000*0I1tN0001tN0000001tN0000001tN000!*071tN*0q!*041tN*04!*0a1tN*0j11a1vH1hu*09!1t01vM1Ck1w91w91F81cW1mV1wV1x+1Hw26G2201x31x31mV1+r28g25j1w91w91rp1LS1kp1vD1yr1yr1yK1yK1KE1J61x31tE1qv1341oB1wi1x31bN1w91Qh1u/1EH1LJ1t01t01iE1630001bN1bN000*06!*031lW0PU1su1cW1531fV1bN1d/000*071u51u51yK1H21Hw1Ox1Ox1AY1UX1UX1LJ1Iq2Cq!*0z1lW2sg1lW2sg1e8*071lW1e81e82sg1lW1e81e82sg1lW1e81e82sg1lW1e81e82sg1lW2sg1e81e82sg1e81e82sg1lW2sg1e81e82sg1e81e82sg1lW1e81e82sg2sg1e81e82sg1lW1e81e82sg2sg1e81e82sg1lW1e81e82sg1e81e82sg1e8*072sg1e8*031lW*0s1e8*032sg*021e8*0b1lW23/2iz2iz1lW2iz*021lW2011JA1r11lW0S10zu0h11lW*032iz*0b1lW1lW26B*071lW*022dy2sg*031lW1N41lW26B2sg26B1lW26B1lW26B1lW26B1lW26B2sg26B1lW26B1lW26B*041lW*0226B26B1lW26B*071lW1lW26B*0b1lW26B*072Ll26B*0a2sg*0326B2sg*0422a22a1ds1W523I1T21T21fm1C52sg2sg26B2sg26B1Lz2sg2sg1RU1RU2sg2da24S*022sg24S1e82sg1ND2sg2sg1aS1fG2sg1uy1vi25x2sg1RU1RZ1SJ2sg2sg2cj*072sg2sg1lW*021pc1pc1m41lW1m41lW1Ua1jE1KX20O1nw2sg*0n1lW1GZ1GZ1lW1GZ1lW1lW1GZ2sg0Zh1lW1lW2dD16w10l13n1vi1vi2bI29q*072sg1/r1/r2sg2sg1RZ*0523I*032cj*051Mt1Mt2sg*051jk2sg1q22sg2sg1/v2sg*031YV28v28v1Iq1Iq2sg1m423S2sg2sg1au1CX2hA2Ge2sg2sg1m4*032nC1m41m41GV*032sg*0U26B2sg*08!2sg*022BO2sg27m1/v2sg*0a1R22sg1/F2sg1/F1/F27d*032sg1GB1KX2a62sg2aO*031/v1/v2sg1/v*0622D2aO2aO2sg2sg2aO1lW2aO*0c2sg2aO2aO2sg2aO*032sg1/m2sg2af*032sg*022aO2sg0CW0N415m0Lo0Lo1hq1hq0Lo1hq1oi1cW2sg2sg1Hn1Rc2d50La0La0MM0MM0L/0L/1g21g21441440La0La0Uf0Uf1lW*091/v*0j2sg*031SJ2sg1SJ26Q2sg*052l/2l/2sg*021uR2sg*041Tg1Tg2sg*021/v2sg*0c",
				fonts: "-*0Jb-b--b--b-*08b*0q-*04b*04-*0ab*0j0*0b-1*0L-11-*0b1*06-*071*0c-*0A9-9*08-9*02-9*02-9*02-9*02-9*06-9*06-9*06-9*06-9*0e3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*07-*0253*03-5-363-3-3-3-363-3-3*04-*0233-3*07--3*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*0766-*023*02-3-3*046*0b3*0a6-33-3--363--3*0e633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663-3*0c63363*036363*036*02363*0a663*0g-*093*0k6*023*0863*0d63*0d6"
			},
			bold: {
				widths: "!000*0I1tN0001tN0000001tN0000001tN000!*071tN*0q!*041tN*04!*0a1tN*0j11a1vH1hu*09!1Gi1Jh1Ma1Hr1Hr1On1k/1ws1E+1Qh1Uu2jY2ly1IT1IT1uo23I2tk2wD1Hr1Hr1Gi1NM1tj1G81Gr1Gr1O41O41Z81Z81IT1ER1DX1i11Gi1Av1IT1iX1Hw1KE1Av1KX20q1yU1yU1n+1ap0001iY1iY000*06!*031lW0RA1yB1b91b91hU1iX1kS000*071wC1yK1LS1Vp1Ku1VS1VS1Gr2mX1UX24H1VS2z8!*0z1lW2vj1lW2vj1hb*071lW1hb1hb2vj1lW1hb1hb2vj1lW1hb1hb2vj1lW1hb1hb2vj1lW2vj1hb1hb2vj1hb1hb2vj1lW2vj1hb1hb2vj1hb1hb2vj1lW1hb1hb2vj2vj1hb1hb2vj1lW1hb1hb2vj2vj1hb1hb2vj1lW1hb1hb2vj1hb1hb2vj1hb*072vj1hg*031lW*0s1hg*032vo*021hg*0b1lW2782lI2lI1lW2lI*021lW23a1MI1ua1lW0V90CD0k91lW*032lI*0b1lW1lW29K*071lW*022gG2vo*031lW1Qd1lW29K2vo29K1lW29K1lW29K1lW29K1lW29K2vo29K1lW29K1lW29K*041lW*0229K29K1lW29K*071lW1lW29K*0b1lW29K*072Ot29K*0a2vo*0329K2vo*0425j25j1gA1Zd26Q1W91W91iu1Fd2vo2vo29K2vo29K1OH2vo2vo1V11V12vo2gh27Z*022vo27Z1hg2vo1QK2vo2vo1d/1iO2vo1xG1yr28F2vo1V11V61VS2vo2vo2fs*072vo2vo1lW*021sk1sk1pc1lW1pc1lW1Xj1mM1O423W1qF2vo*0n1lW1K61K61lW1K61lW1lW1K62vo10p1lW1lW2gL19E13s16w1yr1yr2eR2cy*072vo22y22y2vo2vo1V6*0526Q*032fs*051PC1PC2vo*051ms2vo1ta2vo2vo22D2vo*032012bE2bE1Lz1Lz2vo1pc26+2vo2vo1dB1G32kJ2Jm2vo2vo1pc*032qL1pc1pc1K1*032vo*0U29K2vo*08!2vo*022EX2vo2au22D2vo*0a1Ua2vo22N2vo22N22N2ak*032vo1JK1O42de2vo2dW*0322D22D2vo22D*0625M2dW2dW2vo2vo2dW1lW2dW*0c2vo2dW2dW2vo2dW*032vo22t2vo2do*032vo*022dW2vo0G20Qc18v0Ox0Ox1ky1ky0Ox1ky1rp1g22vo2vo1Ku1Uk2gc0Oi0Oi0PU0PU0P80P81ja1ja17c17c0Oi0Oi0Xn0Xn1lW*0922D*0j2vo*031VS2vo1VS29Y2vo*052p82p82vo*021x+2vo*041Wo1Wo2vo*0222D2vo*0c",
				fonts: "-*0Jb-b--b--b-*08b*0q-*04b*04-*0ab*0j0*0b-1*0L-11-*0b1*06-*071*0c-*0A9-9*08-9*02-9*02-9*02-9*02-9*06-9*06-9*06-9*06-9*0e3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*07-*0253*03-5-363-3-3-3-363-3-3*04-*0233-3*07--3*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*0766-*023*02-3-3*046*0b3*0a6-33-3--363--3*0e633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663-3*0c63363*036363*036*02363*0a663*0g-*093*0k6*023*0863*0d63*0d6"
			}
		},
		{
			name: "Candara",
			regular: {
				widths: "!000*0I0XQ0000GZ0000000Hq0000000T5000!*071n+1kI0+m1fr1u50Cy0XL1tz1sb0Cy1fA18218l1tz1tX0Cy0T51pL1iJ1ow1lo1871aN1lW1fA1Iv1Aq!*041d41d41d30AT11a!*0a1ib*0j11a1vH1hu*09!1t01vM1Ck1w91w91F81cW1mV1wV1x+1Hw26G2201x31x31mV1+r28h25j1w91w91rp1LS1kp1vD1yr1yr1yK1yK1KE1J61x31tE1qv1341oB1wi1x31bN1w91Qh1u/1EH1LJ1t01t01iE1630001bN1bN000*06!*031s10PU1su1cW1531fV1bN1d/000*071u51u51yK1H21Hw1Ox1Ox1AY1UX1UX1LJ1Iq2Cq!*0z1KJ2sg*021e8*072sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg*021e81e82sg1e81e82sg*021e81e82sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg1e81e82sg1e8*072sg1e8*031KJ*0s1e8*032sg*021e8*0b1KJ23/2iz2iz1KJ2iz*021KJ2011JA1r11KJ0S10zu0h11KJ*021NW2iz*0b1uo1uo26B*072sg*022dy2sg*032qG1N426B26B2sg26B*022qG26B2qG26B*022sg26B*022qG26B*041eQ1lW1sS26B26B1uo26B*071uo1uo26B*0b0Tp26B*072Ll26B*0a2sg*0326B2sg*0422a22a1ds1W523I1T21T21fm1C52sg2sg26B2sg26B1Lz2sg2sg1RU1RU2sg2da24S*022sg24S1e82sg1ND2sg2sg1aS1fG2sg1uy1vi25x2sg1RU1RZ1SJ2sg2sg2cj*072sg*0323I1pc1pc1m42sg1m42sg1Ua1jE1KX20O1nw2sg*0o1GZ1GZ2sg1GZ2sg2sg1GZ2sg0Zh1iX2352dD16w10l13n1vi1vi2bI29q*072sg1/r1/r2sg2sg1RZ*0523I*032cj*051Mt1Mt2sg*051jk2sg1q22sg2sg1/v2sg*031YV28v28v1Iq1Iq2sg1m423S2sg2sg1au1CX2hA2Ge2sg2sg1m4*032nC1m41m41GV*032sg*0U26B2sg*08!2sg*022BO2sg27m1/v2sg*0a1R22sg1/F2sg1/F1/F27d*032sg1GB1KX2a62sg2aO*031/v1/v2sg1/v*0622D2aO2aO2sg2sg2aO*0e2sg2aO2aO2sg2aO*032sg1/m2sg2af*032sg*022aO2sg0CW0N415m0Lo0Lo1hq1hq0Lo1hq1oi1cW2sg2sg1Hn1Rc2d50La0La0MM0MM0L/0L/1g21g21441440La0La0Uf0Uf2ap*091/v*0j2sg*031SJ2sg1SJ26Q2sg*052l/2l/2sg*021uR2sg*041Tg1Tg2sg*021/v2sg*0c",
				fonts: "-*0J4-4--4--4-*084*0q-*044*04-*0a4*0j0*0b-1*0L-11-*0a1*07-*071*0c-*0z42*1a3*034*0s3*0i453343*0243*0243*024*033*0b443*0766453*03453363*024343*0263*0243*04--43343*07443*0b43*0j6*0336*043*08633633663363*0363363663363*0263*02663*076*023*046363*046*0b3*0a66336366363*0h633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g-*093*0k6*023*0863*0d63*0d6"
			},
			bold: {
				widths: "!000*0I15Q0000KN0000000Q20000000Yi000!*071r11pZ17l1lW1v/0GG10z1wd1xV0GG1hu1cH1dx1vt1yr0GG0Yi1vR1kW1sN1rK1e31f+1pw1hu1LJ1Fd!*041lj*020Hc1eQ!*0a1nM*0j11a1vH1hu*09!1Gi1Jh1Ma1Hr1Hr1On1k/1ws1E+1Qh1Uu2jY2ly1IT1IT1uo23I2tk2wD1Hr1Hr1Gi1NM1tj1G81Gr1Gr1O41O41Z81Z81IT1ER1DX1i11Gi1Av1IT1iY1Hw1KE1Av1KX20q1yU1yU1n+1ap0001iY1iY000*06!*031Hc0RA1yB1b91b91hU1iX1kS000*071wC1yK1LS1Vp1Ku1VS1VS1Gr2mX1UX24H1VS2z8!*0z1KJ2vj*021hb*072vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj*021hb1hb2vj1hb1hb2vj*021hb1hb2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj1hb1hb2vj1hb*072vj1hg*031KJ*0s1hg*032vo*021hg*0b1KJ2782lI2lI1KJ2lI*021KJ23a1MI1ua1KJ0V90CD0k91KJ*021NW2lI*0b1uo1uo29K*072vo2vo2sg2gG2vo*032qG1Qc29K29K2vo29K*022qG29K2qG29K*022vo29K*022qG29K*041eQ1lW1sS29K29K1uo29K*071uo1uo29K*0b0Tp29K*072Ot29K*0a2vo*0329K2vo*0425j25j1gA1Zd26Q1W91W91iu1Fd2vo2vo29K2vo29K1OH2vo2vo1V11V12vo2gh27Z*022vo27Z1hg2vo1QK2vo2vo1d/1iO2vo1xG1yr28F2vo1V11V61VS2vo2vo2fs*072vo*0326Q1sk1sk1pc2vo1pc2vo1Xj1mM1O423W1qF2vo*0o1K61K62vo1K62vo2vo1K62vo10p1m426d2gL19E13s16w1yr1yr2eR2cy*072vo22y22y2vo2vo1V6*0526Q*032fs*051PC1PC2vo*051ms2vo1ta2vo2vo22D2vo*032012bE2bE1Lz1Lz2vo1pc26+2vo2vo1dB1G32kJ2Jm2vo2vo1pc*032qL1pc1pc1K1*032vo*0U29K2vo*08!2vo*022EX2vo2au22D2vo*0a1Ua2vo22N2vo22N22N2ak*032vo1JK1O42de2vo2dW*0322D22D2vo22D*0625M2dW2dW2vo2vo2dW*0e2vo2dW2dW2vo2dW*032vo22t2vo2do*032vo*022dW2vo0G20Qc18v0Ox0Ox1ky1ky0Ox1ky1rp1g22vo2vo1Ku1Uk2gc0Oi0Oi0PU0PU0P80P81ja1ja17c17c0Oi0Oi0Xn0Xn2ap*0922D*0j2vo*031VS2vo1VS29Y2vo*052p82p82vo*021x+2vo*041Wo1Wo2vo*0222D2vo*0c",
				fonts: "-*0J4-4--4--4-*084*0q-*044*04-*0a4*0j0*0b-1*0L-11-*0a1*07-*071*0c-*0z42*1a3*034*0s3*0i453343*0243*0243*024*033*0b443*0766453*03453363*024343*0263*0243*04--43343*07443*0b43*0j6*0336*043*08633633663363*0363363663363*0263*02663*076*023*046363*046*0b3*0a66336366363*0h633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g-*093*0k6*023*0863*0d63*0d6"
			}
		},
		{
			name: "Corbel",
			regular: {
				widths: "!000*0I0XQ0000GZ0000000Hq0000000T5000!*071n+1kI0+m1fr1u50Cy0XL1tz1sb0Cy1fA18218l1tz1tX0Cy0T51pL1iJ1ow1lo1871aN1lW1fA1Iv1Aq!*041d41d41d30AT11a!*0a1ib*0j11a1vH1hu*09!1t01vM1Ck1w91w91F81cW1mV1wV1x+1Hw26G2201x31x31mV1+r28h25j1w91w91rp1LS1kp1vD1yr1yr1yK1yK1KE1J61x31tE1qv1341oB1wi1x31bN1w91Qh1u/1EH1LJ1t01t01iE1630001bN1bN000*06!*031s10PU1su1cW1531fV1bN1d/000*071u51u51yK1H21Hw1Ox1Ox1AY1UX1UX1LJ1Iq2Cq!*0z1KJ2sg*021e8*072sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg*021e81e82sg1e81e82sg*021e81e82sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg1e81e82sg1e8*072sg1e8*031KJ*0s1e8*032sg*021e8*0b1KJ23/2iz2iz1KJ2iz*021KJ2011JA1r11KJ0S10zu0h11KJ*021NW2iz*0b1uo1uo26B*072sg*022dy2sg*032qG1N426B26B2sg26B*022qG26B2qG26B*022sg26B*022qG26B*041g71lW1sS26B26B1uo26B*071uo1uo26B*0b0Tp26B*072Ll26B*0a2sg*0326B2sg*0422a22a1ds1W523I1T21T21fm1C52sg2sg26B2sg26B1Lz2sg2sg1RU1RU2sg2da24S*022sg24S1e82sg1ND2sg2sg1aS1fG2sg1uy1vi25x2sg1RU1RZ1SJ2sg2sg2cj*072sg*0323I1pc1pc1m42sg1m42sg1Ua1jE1KX20O1nw2sg*0o1GZ1GZ2sg1GZ2sg2sg1GZ2sg0Zh1iX2352dD16w10l13n1vi1vi2bI29q*072sg1/r1/r2sg2sg1RZ*0523I*032cj*051Mt1Mt2sg*051jk2sg1q22sg2sg1/v2sg*031YV28v28v1Iq1Iq2sg1m423S2sg2sg1au1CX2hA2Ge2sg2sg1m4*032nC1m41m41GV*032sg*0U26B2sg*08!2sg*022BO2sg27m1/v2sg*0a1R22sg1/F2sg1/F1/F27d*032sg1GB1KX2a62sg2aO*031/v1/v2sg1/v*0622D2aO2aO2sg2sg2aO*0e2sg2aO2aO2sg2aO*032sg1/m2sg2af*032sg*022aO2sg0CW0N415m0Lo0Lo1hq1hq0Lo1hq1oi1cW2sg2sg1Hn1Rc2d50La0La0MM0MM0L/0L/1g21g21441440La0La0Uf0Uf2lf*091/v*0j2sg*031SJ2sg1SJ26Q2sg*052l/2l/2sg*021uR2sg*041Tg1Tg2sg*021/v2sg*0c",
				fonts: "-*0J4-4--4--4-*084*0q-*044*04-*0a4*0j0*0b-1*0L-11-*0a1*07-*071*0c-*0z42*1a3*034*0s3*0i453343*0243*0243*024*033*0b443*0766453*03453363*024343*0263*0243*04--43343*07443*0b43*0j6*0336*043*08633633663363*0363363663363*0263*02663*076*023*046363*046*0b3*0a66336366363*0h633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g-*093*0k6*023*0863*0d63*0d6"
			},
			bold: {
				widths: "!000*0I15Q0000KN0000000Q20000000Yi000!*071r11pZ17l1lW1v/0GG10z1wd1xV0GG1hu1cH1dx1vt1yr0GG0Yi1vR1kW1sN1rK1e31f+1pw1hu1LJ1Fd!*041lj*020Hc1eQ!*0a1nM*0j11a1vH1hu*09!1Gi1Jh1Ma1Hr1Hr1On1k/1ws1E+1Qh1Uu2jY2ly1IT1IT1uo23I2tk2wD1Hr1Hr1Gi1NM1tj1G81Gr1Gr1O41O41Z81Z81IT1ER1DX1i11Gi1Av1IT1iY1Hw1KE1Av1KX20q1yU1yU1n+1ap0001iY1iY000*06!*031Hc0RA1yB1b91b91hU1iX1kS000*071wC1yK1LS1Vp1Ku1VS1VS1Gr2mX1UX24H1VS2z8!*0z1KJ2vj*021hb*072vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj*021hb1hb2vj1hb1hb2vj*021hb1hb2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj1hb1hb2vj1hb*072vj1hg*031KJ*0s1hg*032vo*021hg*0b1KJ2782lI2lI1KJ2lI*021KJ23a1MI1ua1KJ0V90CD0k91KJ*021NW2lI*0b1uo1uo29K*072vo2vo2sg2gG2vo*032qG1Qc29K29K2vo29K*022qG29K2qG29K*022vo29K*022qG29K*041iq1lW1sS29K29K1uo29K*071uo1uo29K*0b0Tp29K*072Ot29K*0a2vo*0329K2vo*0425j25j1gA1Zd26Q1W91W91iu1Fd2vo2vo29K2vo29K1OH2vo2vo1V11V12vo2gh27Z*022vo27Z1hg2vo1QK2vo2vo1d/1iO2vo1xG1yr28F2vo1V11V61VS2vo2vo2fs*072vo*0326Q1sk1sk1pc2vo1pc2vo1Xj1mM1O423W1qF2vo*0o1K61K62vo1K62vo2vo1K62vo10p1m426d2gL19E13s16w1yr1yr2eR2cy*072vo22y22y2vo2vo1V6*0526Q*032fs*051PC1PC2vo*051ms2vo1ta2vo2vo22D2vo*032012bE2bE1Lz1Lz2vo1pc26+2vo2vo1dB1G32kJ2Jm2vo2vo1pc*032qL1pc1pc1K1*032vo*0U29K2vo*08!2vo*022EX2vo2au22D2vo*0a1Ua2vo22N2vo22N22N2ak*032vo1JK1O42de2vo2dW*0322D22D2vo22D*0625M2dW2dW2vo2vo2dW*0e2vo2dW2dW2vo2dW*032vo22t2vo2do*032vo*022dW2vo0G20Qc18v0Ox0Ox1ky1ky0Ox1ky1rp1g22vo2vo1Ku1Uk2gc0Oi0Oi0PU0PU0P80P81ja1ja17c17c0Oi0Oi0Xn0Xn2lf*0922D*0j2vo*031VS2vo1VS29Y2vo*052p82p82vo*021x+2vo*041Wo1Wo2vo*0222D2vo*0c",
				fonts: "-*0J4-4--4--4-*084*0q-*044*04-*0a4*0j0*0b-1*0L-11-*0a1*07-*071*0c-*0z42*1a3*034*0s3*0i453343*0243*0243*024*033*0b443*0766453*03453363*024343*0263*0243*04--43343*07443*0b43*0j6*0336*043*08633633663363*0363363663363*0263*02663*076*023*046363*046*0b3*0a66336366363*0h633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g-*093*0k6*023*0863*0d63*0d6"
			}
		},
		{
			name: "Constantia",
			regular: {
				widths: "!000*0I0TD0000Ju0000000Hq0000000LD000!*071be1770Qr11t19E0HA0IK1au1ak0FG16G13C13s1fh1bS0GU0LD1af16Z16Z14Q1bo17U1a119f1vn1e8!*041n31le1jk0wG0W4!*0a1ib*0j!*0c0ZU0+c16Z0+c0+v1bC0Nd0Tu12U0/i14L1f51hz11D12r0X31hU1hq1jr0+v0+F0ZK16k0Xn17U16k16k0Z70Z718x18x10J11D0RC0Rs0ZK0ZK10S0Tk0YX14V14L18+1770ZA0V+0+v0TX0000Iy0Iy000*06!*0314O0qf0WW0Rs0LP0RM0JE12r000*0712U0+R0/81oN1fJ1g01ix12K1jL1es0/L19B1/v!*0z1KJ2sg*021e8*072sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg*021e81e82sg1e81e82sg*021e81e82sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg1e81e82sg1e8*072sg1e8*031KJ*0s1e8*032sg*021e8*0b1KJ23/2iz2iz1KJ2iz*021KJ2011JA1r11KJ0S10zu0h11KJ*021NW2iz*0b1uo1uo26B*072sg*022dy2sg*032qG1N426B26B2sg26B*022qG26B2qG26B*022sg26B*022qG26B*041hU1tS1sS26B26B1uo26B*071uo1uo26B*0b0Tp26B*072Ll26B*0a2sg*0326B2sg*0422a22a1ds1W523I1T21T21fm1C52sg2sg26B2sg26B1Lz2sg2sg1RU1RU2sg2da24S*022sg24S1e82sg1ND2sg2sg1aS1fG2sg1uy1vi25x2sg1RU1RZ1SJ2sg2sg2cj*072sg*0323I1pc1pc1m42sg1m42sg1Ua1jE1KX20O1nw2sg*0o1GZ1GZ2sg1GZ2sg2sg1GZ2sg0Zh1iX2352dD16w10l13n1vi1vi2bI29q*072sg1/r1/r2sg2sg1RZ*0523I*032cj*051Mt1Mt2sg*051jk2sg1q22sg2sg1/v2sg*031YV28v28v1Iq1Iq2sg1m423S2sg2sg1au1CX2hA2Ge2sg2sg1m4*032nC1m41m41GV*032sg*0U26B2sg*08!2sg*022BO2sg27m1/v2sg*0a1R22sg1/F2sg1/F1/F27d*032sg1GB1KX2a62sg2aO*031/v1/v2sg1/v*0622D2aO2aO2sg2sg2aO*0e2sg2aO2aO2sg2aO*032sg1/m2sg2af*032sg*022aO2sg0CW0N415m0Lo0Lo1hq1hq0Lo1hq1oi1cW2sg2sg1Hn1Rc2d50La0La0MM0MM0L/0L/1g21g21441440La0La0Uf0Uf2XD*091/v*0j2sg*031SJ2sg1SJ26Q2sg*052l/2l/2sg*021uR2sg*041Tg1Tg2sg*021/v2sg*0c",
				fonts: "-*0J7-7--7--7-*087*0q-*047*04-*0a7*0j-*0c8*0L-88-*0a8*07-*078*0c-*0z79*1a3*037*0s3*0i753373*0273*0273*027*033*0b773*0766753*03753363*027373*0263*0273*04--73373*07773*0b73*0j6*0336*043*08633633663363*0363363663363*0263*02663*076*023*046363*046*0b3*0a66336366363*0h633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g-*093*0k6*023*0863*0d63*0d6"
			},
			bold: {
				widths: "!000*0I0UN0000Q20000000Q20000000Nn000!*071il17J0Vj18A1g20KE0NC1eQ1iJ0My17v15K13/1fV1jk0OV0Nn1aI1fh1c/17q1od1gr1bt18v1HB1gZ!*041te1v91x30DV17U!*0a1nM*0j!*0c0XS10S16N0/811t1d/0OE0Xn12A0+/19r1in1l915p16a0Yk1ib1nH1kS10d11k0+c15T0XS17U15315p10J10J1db1db13H13/0VR0SA0Yu0XS14i0Uh11a15311D18b1oN0XS0Wt14M0SJ0000Io0Io000*06!*0314O0rd0TD0De0Af0Ju0KV0QP000*070TN0Xn0TX1iH1dR1dx1fo0TD1gt1eB0YE1cK20i!*0z1KJ2vj*021hb*072vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj*021hb1hb2vj1hb1hb2vj*021hb1hb2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj1hb1hb2vj1hb*072vj1hg*031KJ*0s1hg*032vo*021hg*0b1KJ2782lI2lI1KJ2lI*021KJ23a1MI1ua1KJ0V90CD0k91KJ*021NW2lI*0b1uo1uo29K*072vo2vo2sg2gG2vo*032qG1Qc29K29K2vo29K*022qG29K2qG29K*022vo29K*022qG29K*041hU1tS1sS29K29K1uo29K*071uo1uo29K*0b0Tp29K*072Ot29K*0a2vo*0329K2vo*0425j25j1gA1Zd26Q1W91W91iu1Fd2vo2vo29K2vo29K1OH2vo2vo1V11V12vo2gh27Z*022vo27Z1hg2vo1QK2vo2vo1d/1iO2vo1xG1yr28F2vo1V11V61VS2vo2vo2fs*072vo*0326Q1sk1sk1pc2vo1pc2vo1Xj1mM1O423W1qF2vo*0o1K61K62vo1K62vo2vo1K62vo10p1m426d2gL19E13s16w1yr1yr2eR2cy*072vo22y22y2vo2vo1V6*0526Q*032fs*051PC1PC2vo*051ms2vo1ta2vo2vo22D2vo*032012bE2bE1Lz1Lz2vo1pc26+2vo2vo1dB1G32kJ2Jm2vo2vo1pc*032qL1pc1pc1K1*032vo*0U29K2vo*08!2vo*022EX2vo2au22D2vo*0a1Ua2vo22N2vo22N22N2ak*032vo1JK1O42de2vo2dW*0322D22D2vo22D*0625M2dW2dW2vo2vo2dW*0e2vo2dW2dW2vo2dW*032vo22t2vo2do*032vo*022dW2vo0G20Qc18v0Ox0Ox1ky1ky0Ox1ky1rp1g22vo2vo1Ku1Uk2gc0Oi0Oi0PU0PU0P80P81ja1ja17c17c0Oi0Oi0Xn0Xn2XD*0922D*0j2vo*031VS2vo1VS29Y2vo*052p82p82vo*021x+2vo*041Wo1Wo2vo*0222D2vo*0c",
				fonts: "-*0J7-7--7--7-*087*0q-*047*04-*0a7*0j-*0ca*0L-aa-*0aa*07-*07a*0c-*0z79*1a3*037*0s3*0i753373*0273*0273*027*033*0b773*0766753*03753363*027373*0263*0273*04--73373*07773*0b73*0j6*0336*043*08633633663363*0363363663363*0263*02663*076*023*046363*046*0b3*0a66336366363*0h633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g-*093*0k6*023*0863*0d63*0d6"
			}
		},
		{
			name: "Book Antiqua",
			regular: {
				widths: "!000*0I!000!000000!000000!000!*1o0ZU0+c16Z0+c0+v1bC0Nd0Tu12U0/i14L1f51hz11D12r0X31hU1hq1jr0+v0+F0ZK16k0Xn17U16k16k0Z70Z718x18x10J11D0RC0Rs0ZK0ZK10S0Tk0YX14V14M18+1770ZA0V+0+v0TX0000Iy0Iy000*06!*0314O0qf0WW0Rs0LP0RM0JE12r000*0712U0+R0/81oN1fJ1g01ix12K1jL1es0/L19B1/v!*0z1Lp2sg1Lp2sg1e8*071Lp1e81e82sg1Lp1e81e82sg1Lp1e81e82sg1Lp1e81e82sg1Lp2sg1e81e82sg1e81e82sg1Lp2sg1e81e82sg1e81e82sg1Lp1e81e82sg2sg1e81e82sg1Lp1e81e82sg2sg1e81e82sg1Lp1e81e82sg1e81e82sg1e8*072sg1e8*031Lp*0s1e8*032sg*021e8*0b1Lp23/2iz2iz1Lp2iz*021Lp2011JA1r11Lp0S10zu0h11Lp*021O42iz*0b1uo1uo26B*070Tp0Tp2sg2dy2sg*032qG1N426B26B2sg26B*022qG26B2qG26B*022sg26B*022qG26B*041dd1tN!26B26B1uo26B*071tN1tN26B*0b0Tp26B*072Ll26B*0a2sg*0326B2sg*0422a22a1ds1W523I1T21T21fm1C52sg2sg26B2sg26B1Lz2sg2sg1RU1RU2sg2da24S*022sg24S1e82sg1ND2sg2sg1aS1fG2sg1uy1vi25x2sg1RU1RZ1SJ2sg2sg2cj*072sg2sg2vy2Ar2fi1pc1pc1m41mj1m41Ee1Ua1jE1KX20O1nw2sg*0n1jk1GZ1GZ1Dj1GZ1sk1fc1GZ2sg0Zh1Uu2sg2dD16w10l13n1vi1vi2bI29q*072sg1/r1/r2sg2sg1RZ*0523I*032cj*051Mt1Mt2sg*051jk2sg1q22sg2sg1/v2sg*031YV28v28v1Iq1Iq2sg1m423S2sg2sg1au1CX2hA2Ge2sg2sg1m4*032nC1m41m41GV*032sg*0U26B2sg*08!2sg*022BO2sg27m1/v2sg*0a1R22sg1/F2sg1/F1/F27d*032sg1GB1KX2a62sg2aO*031/v1/v2sg1/v*0622D2aO2aO2sg2sg2aO*0e2sg2aO2aO2sg2aO*032sg1/m2sg2af*032sg*022aO2sg0CW0N415m0Lo0Lo1hq1hq0Lo1hq1oi1cW2sg2sg1Hn1Rc2d50La0La0MM0MM0L/0L/1g21g21441440La0La0Uf0Uf2XR*022XW2XR*051/v*0j2sg*031SJ2sg1SJ26Q2sg*052l/2l/2sg*021uR2sg*041Tg1Tg2sg*021/v2sg*0c",
				fonts: "-*2g8*0L-88-*0a8*07-*078*0c-*0A9-9*08-9*02-9*02-9*02-9*02-9*06-9*06-9*06-9*06-9*0e3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*07-*0253*03-53363*02-3-3*0263*02-3*04-*0233-3*07--3*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*0766-*023*02-3-3*046*0b3*0a6-33-3--363--3*0e633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g5*093*0k6*023*0863*0d63*0d6"
			},
			bold: {
				widths: "!000*0I!000!000000!000000!000!*1o0XS10S16N0/811t1d/0OE0Xn12A0+/19r1in1l915p16a0Yk1ib1nH1kS10d11k0+c15T0XS17U15315p10J10J1db1db13H13/0VR0SA0Yu0XS14i0Uh11a15311D18b1oN0XS0Wt14M0SJ0000Io0Io000*06!*0314O0rd0TD0De0Af0Ju0KV0QP000*070TN0Xn0TX1iH1dR1dx1fo0TD1gt1eB0YE1cK20i!*0z1Lp2vj1Lp2vj1hb*071Lp1hb1hb2vj1Lp1hb1hb2vj1Lp1hb1hb2vj1Lp1hb1hb2vj1Lp2vj1hb1hb2vj1hb1hb2vj1Lp2vj1hb1hb2vj1hb1hb2vj1Lp1hb1hb2vj2vj1hb1hb2vj1Lp1hb1hb2vj2vj1hb1hb2vj1Lp1hb1hb2vj1hb1hb2vj1hb*072vj1hg*031Lp*0s1hg*032vo*021hg*0b1Lp2782lI2lI1Lp2lI*021Lp23a1MI1ua1Lp0V90CD0k91Lp*021O42lI*0b1uo1uo29K*070Tp0Tp2sg2gG2vo*032qG1Qc29K29K2vo29K*022qG29K2qG29K*022vo29K*022qG29K*041dd1tN!29K29K1uo29K*071tN1tN29K*0b0Tp29K*072Ot29K*0a2vo*0329K2vo*0425j25j1gA1Zd26Q1W91W91iu1Fd2vo2vo29K2vo29K1OH2vo2vo1V11V12vo2gh27Z*022vo27Z1hg2vo1QK2vo2vo1d/1iO2vo1xG1yr28F2vo1V11V61VS2vo2vo2fs*072vo2vo2vy2Ar2fi1sk1sk1pc1mj1pc1Ee1Xj1mM1O423W1qF2vo*0n1jk1K61K61Dj1K61sk1fc1K62vo10p1Uu2sg2gL19E13s16w1yr1yr2eR2cy*072vo22y22y2vo2vo1V6*0526Q*032fs*051PC1PC2vo*051ms2vo1ta2vo2vo22D2vo*032012bE2bE1Lz1Lz2vo1pc26+2vo2vo1dB1G32kJ2Jm2vo2vo1pc*032qL1pc1pc1K1*032vo*0U29K2vo*08!2vo*022EX2vo2au22D2vo*0a1Ua2vo22N2vo22N22N2ak*032vo1JK1O42de2vo2dW*0322D22D2vo22D*0625M2dW2dW2vo2vo2dW*0e2vo2dW2dW2vo2dW*032vo22t2vo2do*032vo*022dW2vo0G20Qc18v0Ox0Ox1ky1ky0Ox1ky1rp1g22vo2vo1Ku1Uk2gc0Oi0Oi0PU0PU0P80P81ja1ja17c17c0Oi0Oi0Xn0Xn2++*022/32++*0522D*0j2vo*031VS2vo1VS29Y2vo*052p82p82vo*021x+2vo*041Wo1Wo2vo*0222D2vo*0c",
				fonts: "-*2ga*0L-aa-*0aa*07-*07a*0c-*0A9-9*08-9*02-9*02-9*02-9*02-9*06-9*06-9*06-9*06-9*0e3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*07-*0253*03-53363*02-3-3*0263*02-3*04-*0233-3*07--3*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*0766-*023*02-3-3*046*0b3*0a6-33-3--363--3*0e633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g5*093*0k6*023*0863*0d63*0d6"
			}
		},
		{
			name: "Franklin Gothic Book",
			regular: {
				widths: "!000*0I!000!000000!000000!000!*1b11a1vH1hu*09!1t01vM1Ck1w91w91F81cW1mV1wV1x+1Hw26G2201x31x31mV1+r28h25j1w91w91rp1LS1kp1vD1yr1yr1yK1yK1KE1J61x31tE1qv1341oB1wi1x31bN1w91Qh1u/1EH1LJ1t01t01iE1630001bN1bN000*06!*031s10PU1su1cW1531fV1bN1d/000*071u51u51yK1H21Hw1Ox1Ox1AY1UX1UX1LJ1Iq2Cq!*0z1KJ2sg1KJ2sg1e8*071KJ1e81e82sg1KJ1e81e82sg1KJ1e81e82sg1KJ1e81e82sg1KJ2sg1e81e82sg1e81e82sg1KJ2sg1e81e82sg1e81e82sg1KJ1e81e82sg2sg1e81e82sg1KJ1e81e82sg2sg1e81e82sg1KJ1e81e82sg1e81e82sg1e8*072sg1e8*031KJ*0s1e8*032sg*021e8*0b1KJ23/2iz2iz1KJ2iz*021KJ2011JA1r11KJ0S10zu0h11KJ*032iz*0b1uo1uo26B*070Tp0Tp2sg2dy2sg*032qG1N426B26B2sg26B*022qG26B2qG26B*022sg26B*022qG26B*041dd1uo!26B26B1uo26B*071uo1uo26B*0b0Tp26B*072Ll26B*0a2sg*0326B2sg*0422a22a1ds1W523I1T21T21fm1C52sg2sg26B2sg26B1Lz2sg2sg1RU1RU2sg2da24S*022sg24S1e82sg1ND2sg2sg1aS1fG2sg1uy1vi25x2sg1RU1RZ1SJ2sg2sg2cj*072sg*032fd1pc1pc1m41Rc1m41Rc1Ua1jE1KX20O1nw2sg*0n1Cz1GZ1GZ1Cz1GZ1Cz1Cz1GZ2sg0Zh1e81Rc2dD16w10l13n1vi1vi2bI29q*072sg1/r1/r2sg2sg1RZ*0523I*032cj*051Mt1Mt2sg*051jk2sg1q22sg2sg1/v2sg*031YV28v28v1Iq1Iq2sg1m423S2sg2sg1au1CX2hA2Ge2sg2sg1m4*032nC1m41m41GV*032sg*0U26B2sg*08!2sg*022BO2sg27m1/v2sg*0a1R22sg1/F2sg1/F1/F27d*032sg1GB1KX2a62sg2aO*031/v1/v2sg1/v*0622D2aO2aO2sg2sg2aO*0e2sg2aO2aO2sg2aO*032sg1/m2sg2af*032sg*022aO2sg0CW0N415m0Lo0Lo1hq1hq0Lo1hq1oi1cW2sg2sg1Hn1Rc2d50La0La0MM0MM0L/0L/1g21g21441440La0La0Uf0Uf2XR*022XW2XR*051/v*0j2sg*031SJ2sg1SJ26Q2sg*052l/2l/2sg*021uR2sg*041Tg1Tg2sg*021/v2sg*0c",
				fonts: "-*230*0b-1*0L-11-*0a1*07-*071*0c-*0A2-2*08-2*02-2*02-2*02-2*02-2*06-2*06-2*06-2*06-2*0e3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*07-*0253*03-53363*02-3-3*0263*02-3*04-*0233-3*07--3*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*0766-*023*02-3-3*046*0b3*0a6-33-3--363--3*0e633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g5*093*0k6*023*0863*0d63*0d6"
			},
			bold: {
				widths: "!000*0I!000!000000!000000!000!*1b11a1vH1hu*09!1Gi1Jh1Ma1Hr1Hr1On1k/1ws1E+1Qh1Uu2jY2ly1IT1IT1uo23I2tk2wD1Hr1Hr1Gi1NM1tj1G81Gr1Gr1O41O41Z81Z81IT1ER1DX1i11Gi1Av1IT1iY1Hw1KE1Av1KX20q1yU1yU1n+1ap0001iY1iY000*06!*031Hc0RA1yB1b91b91hU1iX1kS000*071wC1yK1LS1Vp1Ku1VS1VS1Gr2mX1UX24H1VS2z8!*0z1NR2vj1NR2vj1hb*071NR1hb1hb2vj1NR1hb1hb2vj1NR1hb1hb2vj1NR1hb1hb2vj1NR2vj1hb1hb2vj1hb1hb2vj1NR2vj1hb1hb2vj1hb1hb2vj1NR1hb1hb2vj2vj1hb1hb2vj1NR1hb1hb2vj2vj1hb1hb2vj1NR1hb1hb2vj1hb1hb2vj1hb*072vj1hg*031NR*0s1hg*032vo*021hg*0b1NR2782lI2lI1NR2lI*021NR23a1MI1ua1NR0V90CD0k91NR*032lI*0b1xx1xx29K*070Wx0Wx2vo2gG2vo*032tO1Qd29K29K2vo29K*022tO29K2tO29K*022vo29K*022tO29K*041gm1xx!29K29K1xx29K*071xx1xx29K*0b0Wx29K*072Ot29K*0a2vo*0329K2vo*0425j25j1gA1Zd26Q1W91W91iu1Fd2vo2vo29K2vo29K1OH2vo2vo1V11V12vo2gh27Z*022vo27Z1hg2vo1QK2vo2vo1d/1iO2vo1xG1yr28F2vo1V11V61VS2vo2vo2fs*072vo*032il1sk1sk1pc1Uk1pc1Uk1Xj1mM1O423W1qF2vo*0n1FH1K61K61FH1K61FH1FH1K62vo10p1hg1Uk2gL19E13s16w1yr1yr2eR2cy*072vo22y22y2vo2vo1V6*0526Q*032fs*051PC1PC2vo*051ms2vo1ta2vo2vo22D2vo*032012bE2bE1Lz1Lz2vo1pc26+2vo2vo1dB1G32kJ2Jm2vo2vo1pc*032qL1pc1pc1K1*032vo*0U29K2vo*08!2vo*022EX2vo2au22D2vo*0a1Ua2vo22N2vo22N22N2ak*032vo1JK1O42de2vo2dW*0322D22D2vo22D*0625M2dW2dW2vo2vo2dW*0e2vo2dW2dW2vo2dW*032vo22t2vo2do*032vo*022dW2vo0G20Qc18v0Ox0Ox1ky1ky0Ox1ky1rp1g22vo2vo1Ku1Uk2gc0Oi0Oi0PU0PU0P80P81ja1ja17c17c0Oi0Oi0Xn0Xn2++*022/32++*0522D*0j2vo*031VS2vo1VS29Y2vo*052p82p82vo*021x+2vo*041Wo1Wo2vo*0222D2vo*0c",
				fonts: "-*230*0b-1*0L-11-*0a1*07-*071*0c-*0A2-2*08-2*02-2*02-2*02-2*02-2*06-2*06-2*06-2*06-2*0e3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*07-*0253*03-53363*02-3-3*0263*02-3*04-*0233-3*07--3*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*0766-*023*02-3-3*046*0b3*0a6-33-3--363--3*0e633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g5*093*0k6*023*0863*0d63*0d6"
			}
		},
		{
			name: "Gill Sans MT",
			regular: {
				widths: "!000*0I!000!000000!000000!000!*1b11a1vH1hu*09!1t01vM1Ck1w91w91F81cW1mV1wV1x+1Hw26G2201x31x31mV1+r28h25j1w91w91rp1LS1kp1vD1yr1yr1yK1yK1KE1J61x31tE1qv1341oB1wi1x31bN1w91Qh1u/1EH1LJ1t01t01iE1630001bN1bN000*06!*031s10PU1su1cW1531fV1bN1d/000*071u51u51yK1H21Hw1Ox1Ox1AY1UX1UX1LJ1Iq2Cq!*0A2sg*021e8*072sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg*021e81e82sg1e81e82sg*021e81e82sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg2sg1e81e82sg1e81e82sg1e8*072sg1e8*03!*0s1e8*032sg*021e8*0b!23/2iz2iz!2iz*02!2011JA1r1!0S10zu0h1!*032iz*0b!!26B*072sg2sg!2dy2sg*03!1N426B26B2sg26B*02!26B!26B*022sg26B*02!26B*041dd!!26B26B!26B*07!!26B*0b!26B*072Ll26B*0a2sg*0326B2sg*0422a22a1ds1W523I1T21T21fm1C52sg2sg26B2sg26B1Lz2sg2sg1RU1RU2sg2da24S*022sg24S1e82sg1ND2sg2sg1aS1fG2sg1uy1vi25x2sg1RU1RZ1SJ2sg2sg2cj*072sg*0323I1pc1pc1m42sg1m42sg1Ua1jE1KX20O1nw2sg*0o1GZ1GZ2sg1GZ2sg2sg1GZ2sg0Zh1iX2352dD16w10l13n1vi1vi2bI29q*072sg1/r1/r2sg2sg1RZ*0523I*032cj*051Mt1Mt2sg*051jk2sg1q22sg2sg1/v2sg*031YV28v28v1Iq1Iq2sg1m423S2sg2sg1au1CX2hA2Ge2sg2sg1m4*032nC1m41m41GV*032sg*0U26B2sg*08!2sg*022BO2sg27m1/v2sg*0a1R22sg1/F2sg1/F1/F27d*032sg1GB1KX2a62sg2aO*031/v1/v2sg1/v*0622D2aO2aO2sg2sg2aO*0e2sg2aO2aO2sg2aO*032sg1/m2sg2af*032sg*022aO2sg0CW0N415m0Lo0Lo1hq1hq0Lo1hq1oi1cW2sg2sg1Hn1Rc2d50La0La0MM0MM0L/0L/1g21g21441440La0La0Uf0Uf2XR*022XW2XR*051/v*0j2sg*031SJ2sg1SJ26Q2sg*052l/2l/2sg*021uR2sg*041Tg1Tg2sg*021/v2sg*0c",
				fonts: "-*230*0b-1*0L-11-*0a1*07-*071*0c-*0A2*1a3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*0766-53*03-53363*02-3-3*0263*02-3*04-*0233-3*07--3*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*076*023*046363*046*0b3*0a66336366363*0h633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g5*093*0k6*023*0863*0d63*0d6"
			},
			bold: {
				widths: "!000*0I!000!000000!000000!000!*1b11a1vH1hu*09!1Gi1Jh1Ma1Hr1Hr1On1k/1ws1E+1Qh1Uu2jY2ly1IT1IT1uo23I2tk2wD1Hr1Hr1Gi1NM1tj1G81Gr1Gr1O41O41Z81Z81IT1ER1DX1i11Gi1Av1IT1iY1Hw1KE1Av1KX20q1yU1yU1n+1ap0001iY1iY000*06!*031Hc0RA1yB1b91b91hU1iX1kS000*071wC1yK1LS1Vp1Ku1VS1VS1Gr2mX1UX24H1VS2z8!*0A2vj*021hb*072vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj*021hb1hb2vj1hb1hb2vj*021hb1hb2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj2vj1hb1hb2vj1hb1hb2vj1hb*072vj1hg*03!*0s1hg*032vo*021hg*0b!2782lI2lI!2lI*02!23a1MI1ua!0V90CD0k9!*032lI*0b!!29K*072vo2vo!2gG2vo*03!1Qd29K29K2vo29K*02!29K!29K*022vo29K*02!29K*041dd!!29K29K!29K*07!!29K*0b!29K*072Ot29K*0a2vo*0329K2vo*0425j25j1gA1Zd26Q1W91W91iu1Fd2vo2vo29K2vo29K1OH2vo2vo1V11V12vo2gh27Z*022vo27Z1hg2vo1QK2vo2vo1d/1iO2vo1xG1yr28F2vo1V11V61VS2vo2vo2fs*072vo*0326Q1sk1sk1pc2vo1pc2vo1Xj1mM1O423W1qF2vo*0o1K61K62vo1K62vo2vo1K62vo10p1m426d2gL19E13s16w1yr1yr2eR2cy*072vo22y22y2vo2vo1V6*0526Q*032fs*051PC1PC2vo*051ms2vo1ta2vo2vo22D2vo*032012bE2bE1Lz1Lz2vo1pc26+2vo2vo1dB1G32kJ2Jm2vo2vo1pc*032qL1pc1pc1K1*032vo*0U29K2vo*08!2vo*022EX2vo2au22D2vo*0a1Ua2vo22N2vo22N22N2ak*032vo1JK1O42de2vo2dW*0322D22D2vo22D*0625M2dW2dW2vo2vo2dW*0e2vo2dW2dW2vo2dW*032vo22t2vo2do*032vo*022dW2vo0G20Qc18v0Ox0Ox1ky1ky0Ox1ky1rp1g22vo2vo1Ku1Uk2gc0Oi0Oi0PU0PU0P80P81ja1ja17c17c0Oi0Oi0Xn0Xn2++*022/32++*0522D*0j2vo*031VS2vo1VS29Y2vo*052p82p82vo*021x+2vo*041Wo1Wo2vo*0222D2vo*0c",
				fonts: "-*230*0b-1*0L-11-*0a1*07-*071*0c-*0A2*1a3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*0766-53*03-53363*02-3-3*0263*02-3*04-*0233-3*07--3*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*076*023*046363*046*0b3*0a66336366363*0h633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g5*093*0k6*023*0863*0d63*0d6"
			}
		},
		{
			name: "Impact",
			regular: {
				widths: "!000*0I0XQ0000GZ0000000Hq0000000T5000!*071n+1kI0+m1fr1u50Cy0XL1tz1sb0Cy1fA18218l1tz1tX0Cy0T51pL1iJ1ow1lo1871aN1lW1fA1Iv1Aq!*041d41d41d30AT11a!*0a1ib*0j11a1vH1hu*09!1t01vM1Ck1w91w91F81cW1mV1wV1x+1Hw26G2201x31x31mV1+r28h25j1w91w91rp1LS1kp1vD1yr1yr1yK1yK1KE1J61x31tE1qv1341oB1wi1x31bN1w91Qh1u/1EH1LJ1t01t01iE1630001bN1bN000*06!*031s10PU1su1cW1531fV1bN1d/000*071u51u51yK1H21Hw1Ox1Ox1AY1UX1UX1LJ1Iq2Cq!*0z1KJ2sg1KJ2sg1e8*071KJ1e81e82sg1KJ1e81e82sg1KJ1e81e82sg1KJ1e81e82sg1KJ2sg1e81e82sg1e81e82sg1KJ2sg1e81e82sg1e81e82sg1KJ1e81e82sg2sg1e81e82sg1KJ1e81e82sg2sg1e81e82sg1KJ1e81e82sg1e81e82sg1e8*072sg1e8*031KJ*0s1e8*032sg*021e8*0b1KJ23/2iz2iz1KJ2iz*021KJ2011JA1r11KJ0S10zu0h11KJ*032iz*0b1uo1uo26B*070Tp0Tp2sg2dy2sg*032qG1N426B26B2sg26B*022qG26B2qG26B*022sg26B*022qG26B*041dd1uo1sS26B26B1uo26B*071uo1uo26B*0b0Tp26B*072Ll26B*0a2sg*0326B2sg*0422a22a1ds1W523I1T21T21fm1C52sg2sg26B2sg26B1Lz2sg2sg1RU1RU2sg2da24S*022sg24S1e82sg1ND2sg2sg1aS1fG2sg1uy1vi25x2sg1RU1RZ1SJ2sg2sg2cj*072sg*032fd1pc1pc1m41Rc1m41Rc1Ua1jE1KX20O1nw2sg*0n1Cz1GZ1GZ1Cz1GZ1Cz1Cz1GZ2sg0Zh1e81Rc2dD16w10l13n1vi1vi2bI29q*072sg1/r1/r2sg2sg1RZ*0523I*032cj*051Mt1Mt2sg*051jk2sg1q22sg2sg1/v2sg*031YV28v28v1Iq1Iq2sg1m423S2sg2sg1au1CX2hA2Ge2sg2sg1m4*032nC1m41m41GV*032sg*0U26B2sg*08!2sg*022BO2sg27m1/v2sg*0a1R22sg1/F2sg1/F1/F27d*032sg1GB1KX2a62sg2aO*031/v1/v2sg1/v*0622D2aO2aO2sg2sg2aO*0e2sg2aO2aO2sg2aO*032sg1/m2sg2af*032sg*022aO2sg0CW0N415m0Lo0Lo1hq1hq0Lo1hq1oi1cW2sg2sg1Hn1Rc2d50La0La0MM0MM0L/0L/1g21g21441440La0La0Uf0Uf2XR*022XW2XR*051/v*0j2sg*031SJ2sg1SJ26Q2sg*052l/2l/2sg*021uR2sg*041Tg1Tg2sg*021/v2sg*0c",
				fonts: "-*0J4-4--4--4-*084*0q-*044*04-*0a4*0j0*0b-1*0L-11-*0a1*07-*071*0c-*0A2-2*08-2*02-2*02-2*02-2*02-2*06-2*06-2*06-2*06-2*0e3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*07-*0253*03-53363*02-3-3*0263*02-3*04--433-3*07--3*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*0766-*023*02-3-3*046*0b3*0a6-33-3--363--3*0e633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g5*093*0k6*023*0863*0d63*0d6"
			},
			bold: {
				widths: "!000*0I15Q0000KN0000000Q20000000Yi000!*071r11pZ17l1lW1v/0GG10z1wd1xV0GG1hu1cH1dx1vt1yr0GG0Yi1vR1kW1sN1rK1e31f+1pw1hu1LJ1Fd!*041lj*020Hc1eQ!*0a1nM*0j11a1vH1hu*09!1Gi1Jh1Ma1Hr1Hr1On1k/1ws1E+1Qh1Uu2jY2ly1IT1IT1uo23I2tk2wD1Hr1Hr1Gi1NM1tj1G81Gr1Gr1O41O41Z81Z81IT1ER1DX1i11Gi1Av1IT1iY1Hw1KE1Av1KX20q1yU1yU1n+1ap0001iY1iY000*06!*031Hc0RA1yB1b91b91hU1iX1kS000*071wC1yK1LS1Vp1Ku1VS1VS1Gr2mX1UX24H1VS2z8!*0z1NR2vj1NR2vj1hb*071NR1hb1hb2vj1NR1hb1hb2vj1NR1hb1hb2vj1NR1hb1hb2vj1NR2vj1hb1hb2vj1hb1hb2vj1NR2vj1hb1hb2vj1hb1hb2vj1NR1hb1hb2vj2vj1hb1hb2vj1NR1hb1hb2vj2vj1hb1hb2vj1NR1hb1hb2vj1hb1hb2vj1hb*072vj1hg*031NR*0s1hg*032vo*021hg*0b1NR2782lI2lI1NR2lI*021NR23a1MI1ua1NR0V90CD0k91NR*032lI*0b1xx1xx29K*070Wx0Wx2vo2gG2vo*032tO1Qc29K29K2vo29K*022tO29K2tO29K*022vo29K*022tO29K*041gm1xx1sS29K29K1xx29K*071xx1xx29K*0b0Wx29K*072Ot29K*0a2vo*0329K2vo*0425j25j1gA1Zd26Q1W91W91iu1Fd2vo2vo29K2vo29K1OH2vo2vo1V11V12vo2gh27Z*022vo27Z1hg2vo1QK2vo2vo1d/1iO2vo1xG1yr28F2vo1V11V61VS2vo2vo2fs*072vo*032il1sk1sk1pc1Uk1pc1Uk1Xj1mM1O423W1qF2vo*0n1FH1K61K61FH1K61FH1FH1K62vo10p1hg1Uk2gL19E13s16w1yr1yr2eR2cy*072vo22y22y2vo2vo1V6*0526Q*032fs*051PC1PC2vo*051ms2vo1ta2vo2vo22D2vo*032012bE2bE1Lz1Lz2vo1pc26+2vo2vo1dB1G32kJ2Jm2vo2vo1pc*032qL1pc1pc1K1*032vo*0U29K2vo*08!2vo*022EX2vo2au22D2vo*0a1Ua2vo22N2vo22N22N2ak*032vo1JK1O42de2vo2dW*0322D22D2vo22D*0625M2dW2dW2vo2vo2dW*0e2vo2dW2dW2vo2dW*032vo22t2vo2do*032vo*022dW2vo0G20Qc18v0Ox0Ox1ky1ky0Ox1ky1rp1g22vo2vo1Ku1Uk2gc0Oi0Oi0PU0PU0P80P81ja1ja17c17c0Oi0Oi0Xn0Xn2++*022/32++*0522D*0j2vo*031VS2vo1VS29Y2vo*052p82p82vo*021x+2vo*041Wo1Wo2vo*0222D2vo*0c",
				fonts: "-*0J4-4--4--4-*084*0q-*044*04-*0a4*0j0*0b-1*0L-11-*0a1*07-*071*0c-*0A2-2*08-2*02-2*02-2*02-2*02-2*06-2*06-2*06-2*06-2*0e3*03-*0s3*0i-533-3*02-3*02-3*02-*033*0b--3*07-*0253*03-53363*02-3-3*0263*02-3*04--433-3*07--3*0b-3*0j6*0336*043*08633633663363*0363363663363*0263*02663*0766-*023*02-3-3*046*0b3*0a6-33-3--363--3*0e633663*0h6*05363663*02663*04633663*03663*0a663*04663363*0466363663*0j663*046*0536*0333633-36336336*053633636363*0563*0263*0563*09663*0e63363*036363*036*02363*0a663*0g5*093*0k6*023*0863*0d63*0d6"
			}
		}
	];
	//#endregion
	//#region src/text-layout/text-width.ts
	/**
	* Estimates how much space text takes up, from the widths of the characters in common fonts.
	*
	* The estimate is close for the fonts in {@link FONT_WIDTHS}, and those made with the same widths, such as Carlito.
	* Other fonts are measured with the one most like them, so their estimates are rougher, and {@link unknownFont} says
	* which they are. {@link measureTextWidthAsDrawn} kerns text that asks for kerning, and joins its letters into
	* ligatures, as Word draws the fonts of the tables, from `font-kerning.ts`, and {@link unknownShaping} says where that
	* isn't known.
	*
	* @module
	*/
	var DEFAULT_FONT = "Times New Roman";
	var TAB_STOP = 36;
	var SAME_WIDTHS = [
		[/^carlito$/i, "Calibri"],
		[/^caladea$/i, "Cambria"],
		[/^(liberation sans|arimo|helvetica)$/i, "Arial"],
		[/^(liberation serif|tinos)$/i, "Times New Roman"],
		[/^(liberation mono|cousine)$/i, "Courier New"]
	];
	var SIMILAR_FONTS = [
		[/^segoe ui$/i, "Calibri"],
		[/mono|courier|code|typewriter/i, "Courier New"],
		[new RegExp("times|garamond|palatino|(?<!sans[ -]?)serif|roman", "i"), "Times New Roman"]
	];
	var CHARACTERS = FONT_WIDTH_RANGES.flatMap(([first, last]) => Array.from({ length: last - first + 1 }, (_, offset) => first + offset));
	var CHARACTER_INDEX = new Map(CHARACTERS.map((code, index) => [code, index]));
	var AVERAGE_LETTERS = [..."abcdefghijklmnopqrstuvwxyz"].map((letter) => CHARACTER_INDEX.get(letter.codePointAt(0)));
	var MORE_CHARACTER_INDEX = new Map(MORE_WIDTH_RANGES.flatMap(([first, last]) => Array.from({ length: last - first + 1 }, (_, offset) => first + offset)).map((code, index) => [code, index]));
	new RegExp("[\\p{Script=Arabic}\\p{Script=Devanagari}]", "u");
	var DIGITS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/";
	var decoded = /* @__PURE__ */ new Map();
	var decodedOwn = /* @__PURE__ */ new Map();
	var twoDigitsIn = (encoded, at) => DIGITS.indexOf(encoded[at]) * 64 + DIGITS.indexOf(encoded[at + 1]);
	/**
	* Reads what a string of `more-widths.ts` says of each character: tokens of `size` characters, or "!" for none, each with
	* "*" and two digits repeating it that many more times.
	*/
	var decodeTokens = (encoded, size, read) => {
		const values = [];
		let last;
		for (let at = 0; at < encoded.length;) if (encoded[at] === "*") {
			values.push(...new Array(twoDigitsIn(encoded, at + 1)).fill(last));
			at += 3;
		} else {
			last = encoded[at] === "!" ? void 0 : read(encoded.slice(at, at + size));
			values.push(last);
			at += encoded[at] === "!" ? 1 : size;
		}
		return values;
	};
	var decodedMore = /* @__PURE__ */ new Map();
	var decodeMore = ({ widths, fonts }) => {
		const known = decodedMore.get(widths + fonts);
		if (known) return known;
		const face = {
			widths: decodeTokens(widths, 3, (token) => (DIGITS.indexOf(token[0]) * 4096 + twoDigitsIn(token, 1)) / 10),
			fonts: decodeTokens(fonts, 1, (token) => token === "-" ? void 0 : DIGITS.indexOf(token))
		};
		decodedMore.set(widths + fonts, face);
		return face;
	};
	/**
	* Reads the widths of a font's face, as {@link FontWidths} writes them, but for the characters Word draws in another face
	* of the tables, which are undefined.
	*/
	var decodeOwnWidths = (encoded) => {
		const known = decodedOwn.get(encoded);
		if (known) return known;
		const twoDigitsAt = (at) => twoDigitsIn(encoded, at);
		const widths = [];
		const fallbacks = [];
		let token = 0;
		for (let at = 0; at < encoded.length;) {
			let count = 1;
			if (encoded[at] === "*") {
				count = twoDigitsAt(at + 1);
				at += 3;
			} else {
				token = at;
				at += encoded[at] === "=" || encoded[at] === "!" ? 1 : 2;
			}
			for (let repeat = 0; repeat < count; repeat++) {
				const code = CHARACTERS[widths.length];
				const width = encoded[token] === "!" || encoded[token] === "~" ? void 0 : encoded[token] === "=" ? widths[CHARACTER_INDEX.get(String.fromCodePoint(code).normalize("NFD").codePointAt(0))] : twoDigitsAt(token);
				widths.push(width);
				fallbacks.push(encoded[token] === "~" ? DIGITS.indexOf(encoded[token + 1]) : void 0);
			}
		}
		const face = {
			widths,
			fallbacks
		};
		decodedOwn.set(encoded, face);
		return face;
	};
	/**
	* Reads the widths of a font's face, as {@link FontWidths} writes them. A character Word draws in another face of the
	* tables is as wide as it is there, where the face has it itself.
	*/
	var decodeWidths = (encoded) => {
		const known = decoded.get(encoded);
		if (known) return known;
		const { widths, fallbacks } = decodeOwnWidths(encoded);
		const face = {
			widths: widths.map((width, index) => {
				const fallback = fallbacks[index];
				if (fallback === void 0) return width;
				const { font, bold, italic } = FALLBACK_FACES[fallback];
				return decodeOwnWidths(encodedFaceOf(widthsOf(font), bold, italic)).widths[index];
			}),
			fallbacks
		};
		decoded.set(encoded, face);
		return face;
	};
	var EAST_ASIAN_FONTS = [
		{
			name: "MS Mincho",
			aliases: ["ＭＳ 明朝", "MS 明朝"],
			lineHeight: 1297,
			descent: 289,
			monospaced: true,
			latin: "Times New Roman"
		},
		{
			name: "MS Gothic",
			aliases: ["ＭＳ ゴシック", "MS ゴシック"],
			lineHeight: 1297,
			descent: 289,
			monospaced: true,
			latin: "Arial"
		},
		{
			name: "MS PMincho",
			aliases: ["ＭＳ Ｐ明朝", "MS P明朝"],
			lineHeight: 1297,
			descent: 289,
			latin: "Times New Roman"
		},
		{
			name: "MS PGothic",
			aliases: ["ＭＳ Ｐゴシック", "MS Pゴシック"],
			lineHeight: 1297,
			descent: 289,
			latin: "Arial"
		},
		{
			name: "Yu Mincho",
			aliases: ["游明朝"],
			lineHeight: 1433,
			descent: 387,
			latin: "Times New Roman"
		},
		{
			name: "Yu Gothic",
			aliases: [
				"游ゴシック",
				"游ゴシック Light",
				"Yu Gothic Light"
			],
			lineHeight: 1434,
			descent: 388,
			latin: "Arial"
		},
		{
			name: "Meiryo",
			aliases: ["メイリオ"],
			lineHeight: 1950,
			descent: 665,
			latin: "Arial"
		},
		{
			name: "SimSun",
			aliases: ["宋体"],
			lineHeight: 1297,
			descent: 289,
			monospaced: true,
			latin: "Times New Roman"
		},
		{
			name: "NSimSun",
			aliases: ["新宋体"],
			lineHeight: 1296,
			descent: 290,
			monospaced: true,
			latin: "Times New Roman"
		},
		{
			name: "SimHei",
			aliases: ["黑体"],
			lineHeight: 1297,
			descent: 290,
			monospaced: true,
			latin: "Arial"
		},
		{
			name: "KaiTi",
			aliases: ["楷体"],
			lineHeight: 1297,
			descent: 289,
			monospaced: true,
			latin: "Times New Roman"
		},
		{
			name: "FangSong",
			aliases: ["仿宋"],
			lineHeight: 1297,
			descent: 290,
			monospaced: true,
			latin: "Times New Roman"
		},
		{
			name: "Microsoft YaHei",
			aliases: ["微软雅黑"],
			lineHeight: 1714.3,
			descent: 460,
			latin: "Arial"
		},
		{
			name: "DengXian",
			aliases: [
				"等线",
				"等线 Light",
				"DengXian Light"
			],
			lineHeight: 1354,
			descent: 388,
			latin: "Arial"
		},
		{
			name: "PMingLiU",
			aliases: ["新細明體"],
			lineHeight: 1300,
			descent: 350,
			latin: "Times New Roman"
		},
		{
			name: "MingLiU",
			aliases: ["細明體"],
			lineHeight: 1301,
			descent: 350,
			monospaced: true,
			latin: "Times New Roman"
		},
		{
			name: "Microsoft JhengHei",
			aliases: ["微軟正黑體"],
			lineHeight: 1730,
			descent: 454,
			latin: "Arial"
		},
		{
			name: "Malgun Gothic",
			aliases: ["맑은 고딕"],
			lineHeight: 1730,
			descent: 440,
			latin: "Arial"
		},
		{
			name: "Batang",
			aliases: ["바탕"],
			lineHeight: 1300,
			descent: 292,
			latin: "Times New Roman"
		},
		{
			name: "Gulim",
			aliases: ["굴림"],
			lineHeight: 1301,
			descent: 292,
			latin: "Arial"
		},
		{
			name: "Dotum",
			aliases: ["돋움"],
			lineHeight: 1301,
			descent: 292,
			latin: "Arial"
		}
	];
	var EAST_ASIAN_NAME = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]|hiragino|cjk|source han|pingfang|songti|heiti|kaiti|fangsong|mincho|mingliu|simhei|gungsuh|nanum/i;
	var EAST_ASIAN_SANS = /gothic|ゴシック|hei|黑|黒|sans|고딕|pingfang/i;
	/** The East Asian font in the table a font is, by any of its names. Undefined for other fonts */
	var knownEastAsianFontOf = (font) => {
		const name = font.toLowerCase();
		return EAST_ASIAN_FONTS.find((candidate) => [candidate.name, ...candidate.aliases].some((alias) => alias.toLowerCase() === name));
	};
	/**
	* The East Asian font a font is, or is measured as, by its name. Undefined for other fonts.
	*/
	var eastAsianFontOf = (font) => {
		var _knownEastAsianFontOf2;
		const similar = EAST_ASIAN_SANS.test(font) ? "MS Gothic" : "MS Mincho";
		return (_knownEastAsianFontOf2 = knownEastAsianFontOf(font)) !== null && _knownEastAsianFontOf2 !== void 0 ? _knownEastAsianFontOf2 : EAST_ASIAN_NAME.test(font) ? EAST_ASIAN_FONTS.find((candidate) => candidate.name === similar) : void 0;
	};
	/** Whether a font is one for Chinese, Japanese or Korean text */
	var isEastAsianFont = (font) => font !== void 0 && eastAsianFontOf(font) !== void 0;
	var named = (name) => FONT_WIDTHS.find((known) => known.name.toLowerCase() === name.toLowerCase());
	/** The widths of a font in the table, or of a font with the same widths as one. Undefined for other fonts */
	var exactWidthsOf = (font) => {
		const same = SAME_WIDTHS.find(([pattern]) => pattern.test(font));
		return named(same ? same[1] : font);
	};
	/**
	* The widths to measure a font with: its own, or those of the most similar font in the table.
	* Sans-serif fonts that aren't in the table, such as Roboto, are measured as Arial.
	*/
	var widthsOf = (font = DEFAULT_FONT) => {
		var _exactWidthsOf;
		const similar = SIMILAR_FONTS.find(([pattern]) => pattern.test(font));
		return (_exactWidthsOf = exactWidthsOf(font)) !== null && _exactWidthsOf !== void 0 ? _exactWidthsOf : named(similar ? similar[1] : "Arial");
	};
	/**
	* The widths of a font's face, as the table writes them. Bold in a font without a bold face, such as Calibri Light, is
	* the bold Word makes itself (`word-stops-office-fonts.docx` MB1). Italic in a font without an italic face, such as
	* Tahoma, is the upright face's, as Word slants it, as wide (`word-stops-font-italic-widths.docx`), and so is Trebuchet
	* MS's bold italic, which Word draws as its bold, slanted, and Impact's, its bold made from its regular face
	*/
	var encodedFaceOf = (widths, bold, italic) => {
		var _widths$boldItalic, _widths$italic;
		return bold ? italic ? (_widths$boldItalic = widths.boldItalic) !== null && _widths$boldItalic !== void 0 ? _widths$boldItalic : widths.bold : widths.bold : italic ? (_widths$italic = widths.italic) !== null && _widths$italic !== void 0 ? _widths$italic : widths.regular : widths.regular;
	};
	/** The widths of the face text is in: its font's, bold, italic, both or neither */
	var faceOf = ({ font, bold = false, italic = false }) => decodeWidths(encodedFaceOf(widthsOf(font), bold, italic));
	/**
	* The widths of Hebrew, the Arabic-Indic and Devanagari digits, Thai, box drawing, shapes, symbols and dingbats in the face
	* text is in, and the fonts Word draws them in, which every font of the width tables has. Undefined in the italics of
	* Office's other fonts, whose widths Word's PDFs don't show
	*/
	var moreFaceOf = ({ font, bold = false, italic = false }) => {
		const { name } = widthsOf(font);
		const more = MORE_WIDTHS.find((known) => known.name === name);
		const face = italic ? bold ? more.boldItalic : more.italic : bold ? more.bold : more.regular;
		return face === void 0 ? void 0 : decodeMore(face);
	};
	var isWide = (code) => code >= 4352 && code <= 4447 || code >= 11904 && code <= 42191 || code >= 44032 && code <= 55203 || code >= 63744 && code <= 64255 || code >= 65072 && code <= 65103 || code >= 65280 && code <= 65376 || code >= 65504 && code <= 65510 || code >= 127744;
	var isHalfWidth = (code) => code >= 65377 && code <= 65500;
	var takesNoRoom = (character) => new RegExp("[\\p{Mn}\\p{Me}\\p{Cf}]", "u").test(character);
	/**
	* The width of a character in thousandths of an em, from the tables, and those of Hebrew, the Arabic-Indic and Devanagari
	* digits, Thai, box drawing, shapes, symbols and dingbats (`more`), which Word draws in the font, or in another when the
	* font doesn't have them, such as Calibri's Thai in Tahoma, its Devanagari digits in Mangal and its ★ in Segoe UI Symbol
	* (scripts/layout-probes/stops2/word-stops-more-widths.ts).
	* Characters that aren't in them are as wide as an average lowercase letter, a whole em for wide characters and half an
	* em for half-width ones, and marks take no space. So are those the tables have, but whose width in the font isn't known.
	*/
	var characterWidth = (widths, more, character) => {
		const code = character.codePointAt(0);
		const index = CHARACTER_INDEX.get(code);
		const moreIndex = MORE_CHARACTER_INDEX.get(code);
		const width = index !== void 0 ? widths[index] : moreIndex !== void 0 ? more === null || more === void 0 ? void 0 : more.widths[moreIndex] : void 0;
		if (width !== void 0) return width;
		if (isWide(code)) return 1e3;
		if (isHalfWidth(code)) return 500;
		return takesNoRoom(character) ? 0 : AVERAGE_LETTERS.reduce((total, letter) => total + widths[letter], 0) / AVERAGE_LETTERS.length;
	};
	var FULL_WIDTH_SYMBOLS = /* @__PURE__ */ new Set([..."§¨°±´¶×÷‐―‖‘’“”†‡‥…‰′″※℃Å"]);
	/**
	* The width of a character of a monospaced East Asian font, in thousandths of an em: an em for ideographs and the symbols
	* of Japanese and Chinese, and half an em for the rest.
	*/
	var monospacedWidth = (character) => {
		const code = character.codePointAt(0);
		if (takesNoRoom(character)) return 0;
		return isWide(code) || FULL_WIDTH_SYMBOLS.has(character) || code >= 8592 && code <= 9983 ? 1e3 : 500;
	};
	var sizeOf$1 = ({ size = 10 }) => size;
	var lineSizeOf = (font) => {
		var _font$lineSize;
		return (_font$lineSize = font.lineSize) !== null && _font$lineSize !== void 0 ? _font$lineSize : sizeOf$1(font);
	};
	/**
	* How a font's characters are measured: an East Asian font's Latin letters with the widths of the font in the table they
	* are measured as, or all of a monospaced one's as half an em or an em, and other fonts with their own widths, or those of
	* the most similar font in the table
	*/
	var measuresOf = (font) => {
		var _font$font, _eastAsian$latin;
		const eastAsian = eastAsianFontOf((_font$font = font.font) !== null && _font$font !== void 0 ? _font$font : DEFAULT_FONT);
		const measured = _objectSpread2(_objectSpread2({}, font), {}, { font: (_eastAsian$latin = eastAsian === null || eastAsian === void 0 ? void 0 : eastAsian.latin) !== null && _eastAsian$latin !== void 0 ? _eastAsian$latin : font.font });
		return _objectSpread2(_objectSpread2({}, faceOf(measured)), {}, {
			more: moreFaceOf(measured),
			monospaced: (eastAsian === null || eastAsian === void 0 ? void 0 : eastAsian.monospaced) === true
		});
	};
	/**
	* How wide a line of text is, in points. Tabs move to the next half inch, counted from the start of the line.
	*
	* @param start - Where the text starts on its line, in points
	*/
	var measureTextWidth = (text, font = {}, start = 0) => {
		const { widths, more, monospaced } = measuresOf(font);
		const widthOf = monospaced ? monospacedWidth : (character) => characterWidth(widths, more, character);
		const size = sizeOf$1(font);
		const { characterSpacing = 0, scale = 100 } = font;
		return [...text].reduce((position, character) => character === "	" ? (Math.floor(position / TAB_STOP) + 1) * TAB_STOP : position + widthOf(character) * size * scale / 1e5 + characterSpacing, start) - start;
	};
	new RegExp("\\p{L}\\p{L}", "u");
	new RegExp("^\\p{Script=Latin}$", "u");
	/**
	* How tall a line of single-spaced text is, in points.
	*/
	var measureLineHeight = (font = {}) => {
		var _eastAsianFontOf2, _font$font5;
		return ((_eastAsianFontOf2 = eastAsianFontOf((_font$font5 = font.font) !== null && _font$font5 !== void 0 ? _font$font5 : "Times New Roman")) !== null && _eastAsianFontOf2 !== void 0 ? _eastAsianFontOf2 : widthsOf(font.font)).lineHeight * lineSizeOf(font) / 1e3;
	};
	/**
	* Splits spans into words and the spaces between them. A word can be made of pieces of several spans, such as a bold
	* letter in a plain word, so each token is a list of pieces.
	*/
	var tokenize = (spans) => spans.flatMap((span) => span.text.split(/([ \t]+)/).filter((text) => text.length > 0).map((text) => _objectSpread2(_objectSpread2({}, span), {}, { text }))).reduce((tokens, piece) => {
		const last = tokens[tokens.length - 1];
		const isSpace = (text) => /^[ \t]/.test(text);
		return last && !isSpace(piece.text) && !isSpace(last[0].text) ? [...tokens.slice(0, -1), [...last, piece]] : [...tokens, [piece]];
	}, []);
	var measurePieces = (pieces, start) => pieces.reduce((position, piece) => position + measureTextWidth(piece.text, piece, position), start) - start;
	/**
	* Lays out one line of a paragraph, up to a line break, wrapping it at `limit`. Positions are measured from the left
	* edge of the text, so tabs line up across lines.
	*
	* @param start - Where the line starts: the paragraph's left indent, and its first line indent on its first line
	* @param restart - Where the lines it wraps onto start
	* @param limit - Where lines wrap: the width of the text less the paragraph's right indent
	*/
	var wrapLine = (spans, height, start, restart, limit) => {
		const wraps = (position, width) => limit !== void 0 && position + width > limit;
		const room = limit === void 0 ? 0 : limit - restart;
		const { lines, end } = tokenize(spans).reduce((state, token) => {
			if (/^[ \t]/.test(token[0].text)) return _objectSpread2(_objectSpread2({}, state), {}, { position: state.position + measurePieces(token, state.position) });
			const wrapped = state.started && wraps(state.position, measurePieces(token, state.position));
			const done = wrapped ? [...state.lines, {
				width: state.end,
				height
			}] : state.lines;
			const position = wrapped ? restart : state.position;
			const width = measurePieces(token, position);
			if (room <= 0 || !wraps(position, width)) return {
				lines: done,
				position: position + width,
				end: position + width,
				started: true
			};
			const full = Math.ceil((position - restart + width) / room) - 1;
			const last = position + width - full * room;
			return {
				lines: [...done, ...Array.from({ length: full }, () => ({
					width: limit,
					height
				}))],
				position: last,
				end: last,
				started: true
			};
		}, {
			lines: [],
			position: start,
			end: start,
			started: false
		});
		return [...lines, {
			width: end,
			height
		}];
	};
	/**
	* How tall a paragraph's lines are: as tall as its tallest font, with its line spacing.
	*/
	var lineHeightOf = ({ spans, font = {}, format = {} }) => {
		const single = Math.max(...(spans.length > 0 ? spans : [font]).map(measureLineHeight));
		const { lineSpacing } = format;
		if (!lineSpacing) return single;
		if (lineSpacing.rule === "multiple") return single * lineSpacing.multiple;
		return lineSpacing.rule === "exact" ? lineSpacing.height : Math.max(single, lineSpacing.height);
	};
	/**
	* Splits a paragraph's spans at line breaks.
	*/
	var splitLines = (spans) => spans.reduce((parts, span) => span.text.split("\n").reduce((spanParts, text, index) => index === 0 ? [...spanParts.slice(0, -1), [...spanParts[spanParts.length - 1], _objectSpread2(_objectSpread2({}, span), {}, { text })]] : [...spanParts, [_objectSpread2(_objectSpread2({}, span), {}, { text })]], parts), [[]]);
	/**
	* The space above and below a paragraph. With contextual spacing, there is none next to a paragraph of the same style.
	*/
	var spacingOf = (paragraph, before, after) => {
		var _paragraph$format;
		const { spaceBefore = 0, spaceAfter = 0, contextualSpacing } = (_paragraph$format = paragraph.format) !== null && _paragraph$format !== void 0 ? _paragraph$format : {};
		const sameStyle = (other) => contextualSpacing === true && other !== void 0 && other.style === paragraph.style;
		return {
			above: sameStyle(before) ? 0 : spaceBefore,
			below: sameStyle(after) ? 0 : spaceAfter
		};
	};
	/**
	* Measures text that wraps at `maxWidth`, or only at line breaks when `maxWidth` isn't given. Words wider than a
	* line are broken across lines, as Word breaks them. Spaces at the ends of lines take no space. Paragraphs take their
	* space before and after, line spacing and indents from their `format`.
	*
	* @param paragraphs - Each paragraph, or just its spans. A paragraph without spans is one empty line
	* @param maxWidth - The width lines wrap at, in points
	*/
	var measureText = (paragraphs, maxWidth) => {
		const all = paragraphs.map((paragraph) => "spans" in paragraph ? paragraph : { spans: paragraph });
		const measured = all.map((paragraph, index) => {
			var _paragraph$format2;
			const { indentLeft = 0, indentRight = 0, firstLineIndent = 0 } = (_paragraph$format2 = paragraph.format) !== null && _paragraph$format2 !== void 0 ? _paragraph$format2 : {};
			const height = lineHeightOf(paragraph);
			const limit = maxWidth === void 0 ? void 0 : maxWidth - indentRight;
			const lines = splitLines(paragraph.spans).flatMap((line, lineIndex) => wrapLine(line, height, indentLeft + (lineIndex === 0 ? firstLineIndent : 0), indentLeft, limit));
			const { above, below } = spacingOf(paragraph, all[index - 1], all[index + 1]);
			return {
				width: Math.max(0, ...lines.map(({ width }) => width + indentRight)),
				height: above + lines.reduce((total, line) => total + line.height, 0) + below
			};
		});
		return {
			width: Math.max(0, ...measured.map(({ width }) => width)),
			height: measured.reduce((total, { height }) => total + height, 0)
		};
	};
	//#endregion
	//#region src/text-layout/line-break-rules.ts
	var EAST_ASIAN = new RegExp("[\\u1100-\\u11ff\\u2e80-\\u2fff\\u3000-\\u30ff\\u3130-\\u318f\\u31c0-\\u33ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\ua960-\\ua97f\\uac00-\\ud7ff\\uf900-\\ufaff\\ufe30-\\ufe4f\\uff00-\\uffef\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}\\p{Script=Hangul}]", "u");
	new RegExp("\\p{Script=Hangul}", "u");
	/** Whether a character is Chinese, Japanese or Korean, or East Asian punctuation, which Word draws in a run's East Asian font */
	var isEastAsian = (character) => EAST_ASIAN.test(character);
	//#endregion
	//#region src/text-layout/text-styles.ts
	var OFFICE_THEME_FONTS = {
		headings: "Calibri Light",
		body: "Calibri"
	};
	/**
	* Word's own defaults: 10pt Times New Roman with single spacing, Office's theme, and a Normal paragraph style with no
	* formatting as the default, as `docx` writes it.
	*/
	var WORD_DEFAULT_STYLES = {
		run: {},
		paragraph: {},
		styles: /* @__PURE__ */ new Map([["Normal", {
			type: "paragraph",
			run: {},
			paragraph: {}
		}]]),
		defaultParagraphStyle: "Normal",
		themeFonts: OFFICE_THEME_FONTS
	};
	var SMALL_CAPS_SCALE = .8;
	var SCRIPT_SCALE = .65;
	var EIGHTHS_PER_POINT = 8;
	var SINGLE_LINE = 240;
	/**
	* A context for formatting parts of the document to read them. Formatting paragraph properties that refer to a
	* numbering adds the numbering to the document, so this context's document leaves it out.
	*/
	var READING_CONTEXT = {
		stack: [],
		file: { Numbering: { createConcreteNumberingInstance: () => void 0 } }
	};
	var isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
	/**
	* The children of an element in a formatted tree. An element with children is an array, and one without is an object.
	*/
	var childrenOf = (element) => Array.isArray(element) ? element.filter(isObject) : [];
	var attributesOf = (element) => {
		const holder = Array.isArray(element) ? element.find((child) => isObject(child) && "_attr" in child) : element;
		return isObject(holder) && isObject(holder._attr) ? holder._attr : {};
	};
	var find = (children, name) => {
		var _children$find;
		return (_children$find = children.find((child) => name in child)) === null || _children$find === void 0 ? void 0 : _children$find[name];
	};
	var numberOf = (value) => {
		const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
		return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : void 0;
	};
	var stringOf = (value) => typeof value === "string" && value.length > 0 ? value : void 0;
	var scaled = (value, divisor) => value === void 0 ? void 0 : value / divisor;
	var POINTS_PER_UNIT = {
		mm: 72 / 25.4,
		cm: 72 / 2.54,
		in: 72,
		pt: 1,
		pc: 12,
		pi: 12
	};
	var METRIC = /* @__PURE__ */ new Set(["mm", "cm"]);
	var MEASURE = /^\s*(-?)(\d+)(\.\d+)?(mm|cm|in|pt|pc|pi)\s*$/;
	var ROUNDING = 1e-9;
	/**
	* A length in points, from an attribute in its own unit, `perPoint` of which make a point (20 for twips, 2 for
	* half-points), or in a unit of OOXML's universal measure, such as "1in", "2.5cm" or "12pt", as the schema allows for
	* every length docx writes from a string.
	*
	* Word reads a universal measure as a whole number of the attribute's unit (word-units and word-units2): rounded down
	* from inches, points and picas, so "240.7pt" is 4814 twips, and to the nearest from centimeters and millimeters, so
	* "84.67724mm" (4800.6 twips) is 4801. Its minus sign is the whole number's only, and the fraction is added to it:
	* "-10.7pt" is -10 points and 0.7 more, -186 twips, and "-0.16708in" is 240 twips.
	*/
	var pointsOf = (value, perPoint) => {
		const measure = typeof value === "string" ? MEASURE.exec(value) : null;
		if (!measure) return scaled(numberOf(value), perPoint);
		const [, minus, whole, fraction = "", unit] = measure;
		const inUnits = ((minus ? -Number(whole) : Number(whole)) + Number(`0${fraction}`)) * POINTS_PER_UNIT[unit] * perPoint;
		return (METRIC.has(unit) ? Math.round(inUnits) : Math.floor(inUnits + ROUNDING)) / perPoint;
	};
	/**
	* A run's size (`w:sz`, or `w:szCs` for complex scripts) in points, from half-points, or from a length in any unit, which
	* Word rounds down to a half-point, with or without a style that gives a size: "11.75pt" is 11.5, "0.4in" 28.5, "1cm" and
	* "10mm" 28, and "0.3cm" 8.5, as it reads centimeters and millimeters to the nearest twip first (word-units2.ts V3,
	* scripts/layout-probes/stops2/word-stops-text.ts RF27a to RF27c, word-stops-text2.ts RF27d to RF27g)
	*/
	var sizeOf = (value) => {
		var _MEASURE$exec;
		const unit = typeof value === "string" ? (_MEASURE$exec = MEASURE.exec(value)) === null || _MEASURE$exec === void 0 ? void 0 : _MEASURE$exec[4] : void 0;
		return unit === void 0 || !METRIC.has(unit) ? pointsOf(value, 2) : Math.floor(pointsOf(value, 20) * 2 + ROUNDING) / 2;
	};
	var isOff = (value) => value === false || value === 0 || value === "false" || value === "0" || value === "off";
	/**
	* An on/off property, such as `w:b`: on when present, unless its value says otherwise.
	*/
	var onOff = (children, name) => {
		const element = children.find((child) => name in child);
		return element ? !isOff(attributesOf(element[name])["w:val"]) : void 0;
	};
	/** An on/off property of Word 2010's (`w14`), such as `w14:cntxtAlts`, whose value is `w14:val` */
	var onOff14 = (children, name) => {
		const element = children.find((child) => name in child);
		return element ? !isOff(attributesOf(element[name])["w14:val"]) : void 0;
	};
	var withoutUndefined = (object) => Object.fromEntries(Object.entries(object).filter(([, value]) => value !== void 0));
	/**
	* Combines formatting, with later formatting overriding earlier formatting.
	*/
	var combine = (formats) => formats.reduce((all, format) => _objectSpread2(_objectSpread2({}, all), withoutUndefined(format)), {});
	var valueOf = (children, name) => stringOf(attributesOf(find(children, name))["w:val"]);
	/**
	* The font a theme font refers to: `majorHAnsi` and the other major fonts are the theme's font for headings, and the
	* minor fonts its font for body text.
	*/
	var themeFontOf = (theme, themeFonts) => {
		if (typeof theme !== "string") return;
		if (theme.startsWith("major")) return themeFonts.headings;
		return theme.startsWith("minor") ? themeFonts.body : void 0;
	};
	var readVerticalAlign = (value) => value === "superscript" || value === "subscript" ? value : value === void 0 ? void 0 : "baseline";
	/**
	* Reads run properties (`w:rPr`). A font of the theme (`w:asciiTheme`) takes the place of the font named beside it.
	*/
	var readRunFormat = (element, themeFonts) => {
		var _ref, _ref2, _themeFontOf, _themeFontOf2, _themeFontOf3;
		const children = childrenOf(element);
		const fonts = attributesOf(find(children, "w:rFonts"));
		return withoutUndefined({
			font: (_ref = (_ref2 = (_themeFontOf = themeFontOf(fonts["w:asciiTheme"], themeFonts)) !== null && _themeFontOf !== void 0 ? _themeFontOf : stringOf(fonts["w:ascii"])) !== null && _ref2 !== void 0 ? _ref2 : themeFontOf(fonts["w:hAnsiTheme"], themeFonts)) !== null && _ref !== void 0 ? _ref : stringOf(fonts["w:hAnsi"]),
			size: sizeOf(attributesOf(find(children, "w:sz"))["w:val"]),
			bold: onOff(children, "w:b"),
			italic: onOff(children, "w:i"),
			kerning: sizeOf(attributesOf(find(children, "w:kern"))["w:val"]),
			allCaps: onOff(children, "w:caps"),
			smallCaps: onOff(children, "w:smallCaps"),
			hidden: onOff(children, "w:vanish"),
			characterSpacing: pointsOf(attributesOf(find(children, "w:spacing"))["w:val"], 20),
			scale: numberOf(attributesOf(find(children, "w:w"))["w:val"]),
			eastAsiaFont: (_themeFontOf2 = themeFontOf(fonts["w:eastAsiaTheme"], themeFonts)) !== null && _themeFontOf2 !== void 0 ? _themeFontOf2 : stringOf(fonts["w:eastAsia"]),
			complexScriptFont: (_themeFontOf3 = themeFontOf(fonts["w:cstheme"], themeFonts)) !== null && _themeFontOf3 !== void 0 ? _themeFontOf3 : stringOf(fonts["w:cs"]),
			complexScriptSize: sizeOf(attributesOf(find(children, "w:szCs"))["w:val"]),
			complexScriptBold: onOff(children, "w:bCs"),
			complexScriptItalic: onOff(children, "w:iCs"),
			rightToLeft: onOff(children, "w:rtl"),
			complexScript: onOff(children, "w:cs"),
			eastAsianLanguage: stringOf(attributesOf(find(children, "w:lang"))["w:eastAsia"]),
			language: stringOf(attributesOf(find(children, "w:lang"))["w:val"]),
			noProof: onOff(children, "w:noProof"),
			ligatures: stringOf(attributesOf(find(children, "w14:ligatures"))["w14:val"]),
			numberForm: stringOf(attributesOf(find(children, "w14:numForm"))["w14:val"]),
			numberSpacing: stringOf(attributesOf(find(children, "w14:numSpacing"))["w14:val"]),
			stylisticSets: find(children, "w14:stylisticSets") === void 0 ? void 0 : childrenOf(find(children, "w14:stylisticSets")).length > 0,
			contextualAlternates: onOff14(children, "w14:cntxtAlts"),
			verticalAlign: readVerticalAlign(valueOf(children, "w:vertAlign")),
			position: pointsOf(attributesOf(find(children, "w:position"))["w:val"], 2),
			emphasisMark: valueOf(children, "w:em"),
			border: readBorder(find(children, "w:bdr")),
			snapToGrid: onOff(children, "w:snapToGrid")
		});
	};
	var readLineSpacing = (spacing) => {
		const line = pointsOf(spacing["w:line"], 20);
		if (line === void 0) return;
		const rule = spacing["w:lineRule"];
		return rule === "exact" || rule === "atLeast" ? {
			rule,
			height: line
		} : {
			rule: "multiple",
			multiple: line * 20 / SINGLE_LINE
		};
	};
	var TAB_ALIGNMENTS = {
		left: "left",
		start: "left",
		right: "right",
		end: "right",
		center: "center",
		decimal: "decimal",
		bar: "bar",
		clear: "clear",
		num: "left"
	};
	var ALIGNMENTS = {
		start: "left",
		left: "left",
		numTab: "left",
		center: "center",
		end: "right",
		right: "right",
		both: "justified",
		distribute: "distributed",
		lowKashida: "lowKashida",
		mediumKashida: "mediumKashida",
		highKashida: "highKashida",
		thaiDistribute: "thaiDistributed"
	};
	/**
	* Reads the tab stops of paragraph properties (`w:tabs`).
	*/
	var readTabs = (element) => {
		const tabs = childrenOf(element).filter((child) => "w:tab" in child);
		return tabs.length === 0 ? void 0 : tabs.map((tab) => {
			var _pointsOf, _TAB_ALIGNMENTS$Strin;
			const attributes = attributesOf(tab["w:tab"]);
			return {
				position: (_pointsOf = pointsOf(attributes["w:pos"], 20)) !== null && _pointsOf !== void 0 ? _pointsOf : 0,
				alignment: (_TAB_ALIGNMENTS$Strin = TAB_ALIGNMENTS[String(attributes["w:val"])]) !== null && _TAB_ALIGNMENTS$Strin !== void 0 ? _TAB_ALIGNMENTS$Strin : "left"
			};
		});
	};
	/**
	* Reads a border of a paragraph (`w:pBdr`), on one side, or of a run (`w:bdr`).
	*/
	var readBorder = (element) => {
		var _stringOf, _numberOf;
		if (element === void 0) return;
		const attributes = attributesOf(element);
		const on = (name) => attributes[name] !== void 0 && !isOff(attributes[name]);
		return withoutUndefined({
			style: (_stringOf = stringOf(attributes["w:val"])) !== null && _stringOf !== void 0 ? _stringOf : "none",
			size: numberOf(attributes["w:sz"]),
			space: (_numberOf = numberOf(attributes["w:space"])) !== null && _numberOf !== void 0 ? _numberOf : 0,
			shadow: on("w:shadow"),
			frame: on("w:frame"),
			key: JSON.stringify(Object.entries(attributes).map(([name, value]) => [name, String(value)]).sort(([a], [b]) => a < b ? -1 : 1))
		});
	};
	/**
	* Reads paragraph properties (`w:pPr`).
	*/
	var readParagraphFormat = (element) => {
		var _valueOf;
		const children = childrenOf(element);
		const spacing = attributesOf(find(children, "w:spacing"));
		const indent = attributesOf(find(children, "w:ind"));
		const borders = childrenOf(find(children, "w:pBdr"));
		const twips = (...names) => names.map((name) => pointsOf(indent[name], 20)).find((value) => value !== void 0);
		const chars = (...names) => names.map((name) => numberOf(indent[name])).find((value) => value !== void 0);
		const automatic = (name) => spacing[name] === void 0 ? void 0 : !isOff(spacing[name]);
		const border = (...names) => names.map((name) => readBorder(find(borders, name))).find((value) => value !== void 0);
		const hanging = twips("w:hanging");
		const hangingChars = chars("w:hangingChars");
		return withoutUndefined({
			spaceBefore: pointsOf(spacing["w:before"], 20),
			spaceAfter: pointsOf(spacing["w:after"], 20),
			spaceBeforeLines: numberOf(spacing["w:beforeLines"]),
			spaceAfterLines: numberOf(spacing["w:afterLines"]),
			autoSpaceBefore: automatic("w:beforeAutospacing"),
			autoSpaceAfter: automatic("w:afterAutospacing"),
			lineSpacing: readLineSpacing(spacing),
			indentLeft: twips("w:start", "w:left"),
			indentRight: twips("w:end", "w:right"),
			firstLineIndent: hanging === void 0 ? twips("w:firstLine") : -hanging,
			indentLeftChars: chars("w:startChars", "w:leftChars"),
			indentRightChars: chars("w:endChars", "w:rightChars"),
			firstLineChars: hangingChars === void 0 ? chars("w:firstLineChars") : -hangingChars,
			borderTop: border("w:top"),
			borderBottom: border("w:bottom"),
			borderLeft: border("w:start", "w:left"),
			borderRight: border("w:end", "w:right"),
			borderBetween: border("w:between"),
			borderBar: border("w:bar"),
			contextualSpacing: onOff(children, "w:contextualSpacing"),
			keepNext: onOff(children, "w:keepNext"),
			keepLines: onOff(children, "w:keepLines"),
			pageBreakBefore: onOff(children, "w:pageBreakBefore"),
			widowControl: onOff(children, "w:widowControl"),
			tabs: readTabs(find(children, "w:tabs")),
			kinsoku: onOff(children, "w:kinsoku"),
			wordWrap: onOff(children, "w:wordWrap"),
			suppressAutoHyphens: onOff(children, "w:suppressAutoHyphens"),
			snapToGrid: onOff(children, "w:snapToGrid"),
			alignment: ALIGNMENTS[(_valueOf = valueOf(children, "w:jc")) !== null && _valueOf !== void 0 ? _valueOf : ""]
		});
	};
	/**
	* Reads the fonts of a document's theme (`a:theme`), once it is formatted.
	*/
	var readThemeFonts = (xml) => {
		const scheme = childrenOf(find(childrenOf(find(childrenOf(xml["a:theme"]), "a:themeElements")), "a:fontScheme"));
		const latin = (name) => attributesOf(find(childrenOf(find(scheme, name)), "a:latin")).typeface;
		return {
			headings: latin("a:majorFont"),
			body: latin("a:minorFont")
		};
	};
	/**
	* Reads what a table style (`w:style` of type "table") gives its tables beyond paragraph and run formatting: the margins
	* of their cells, its table, row and cell properties, and the parts of its formatting for some of their cells.
	*/
	var readTableStyle = (children, themeFonts) => {
		const tableProperties = childrenOf(find(children, "w:tblPr"));
		return {
			cellMargins: readCellMargins(find(tableProperties, "w:tblCellMar")),
			tableProperties,
			rowProperties: childrenOf(find(children, "w:trPr")),
			cellProperties: childrenOf(find(children, "w:tcPr")),
			conditional: new Map(children.filter((child) => "w:tblStylePr" in child).map((child) => {
				const parts = childrenOf(child["w:tblStylePr"]);
				return [String(attributesOf(child["w:tblStylePr"])["w:type"]), {
					run: readRunFormat(find(parts, "w:rPr"), themeFonts),
					paragraph: readParagraphFormat(find(parts, "w:pPr")),
					tableProperties: childrenOf(find(parts, "w:tblPr")),
					rowProperties: childrenOf(find(parts, "w:trPr")),
					cellProperties: childrenOf(find(parts, "w:tcPr"))
				}];
			}))
		};
	};
	/**
	* Reads the document's defaults and styles from its styles part (`w:styles`), once it is formatted, with the fonts of
	* its theme.
	*/
	var readTextStyles = (xml, themeFonts = OFFICE_THEME_FONTS) => {
		const root = childrenOf(xml["w:styles"]);
		const defaults = root.filter((child) => "w:docDefaults" in child).map((child) => childrenOf(child["w:docDefaults"]));
		const styles = root.filter((child) => "w:style" in child).map((child) => {
			var _stringOf2;
			const children = childrenOf(child["w:style"]);
			const attributes = attributesOf(child["w:style"]);
			const paragraphProperties = childrenOf(find(children, "w:pPr"));
			const numbering = childrenOf(find(paragraphProperties, "w:numPr"));
			const frame = find(paragraphProperties, "w:framePr");
			const list = attributesOf(find(numbering, "w:numId"))["w:val"];
			const level = numberOf(attributesOf(find(numbering, "w:ilvl"))["w:val"]);
			const name = valueOf(children, "w:name");
			return {
				id: stringOf(attributes["w:styleId"]),
				isDefault: attributes["w:default"] !== void 0 && !isOff(attributes["w:default"]),
				definition: _objectSpread2(_objectSpread2(_objectSpread2(_objectSpread2({ type: (_stringOf2 = stringOf(attributes["w:type"])) !== null && _stringOf2 !== void 0 ? _stringOf2 : "paragraph" }, name === void 0 ? {} : { name }), {}, { basedOn: valueOf(children, "w:basedOn") }, list === void 0 && level === void 0 ? {} : { numbering: withoutUndefined({
					id: list === void 0 ? void 0 : String(list),
					level
				}) }), {}, {
					run: readRunFormat(find(children, "w:rPr"), themeFonts),
					paragraph: readParagraphFormat(find(children, "w:pPr"))
				}, frame === void 0 ? {} : { frame }), attributes["w:type"] === "table" ? readTableStyle(children, themeFonts) : {})
			};
		}).filter((style) => style.id !== void 0);
		const defaultStyle = (type) => {
			var _styles$find;
			return (_styles$find = styles.find((style) => style.isDefault && style.definition.type === type)) === null || _styles$find === void 0 ? void 0 : _styles$find.id;
		};
		const byId = new Map(styles.map((style) => [style.id, style.definition]));
		return {
			run: combine(defaults.map((children) => readRunFormat(find(childrenOf(find(children, "w:rPrDefault")), "w:rPr"), themeFonts))),
			paragraph: combine(defaults.map((children) => readParagraphFormat(find(childrenOf(find(children, "w:pPrDefault")), "w:pPr")))),
			styles: byId,
			defaultParagraphStyle: defaultStyle("paragraph"),
			defaultCharacterStyle: defaultStyle("character"),
			defaultTableStyle: defaultStyle("table"),
			themeFonts
		};
	};
	/**
	* Reads the margins of a table's cells (`w:tblCellMar`), or of one cell (`w:tcMar`), in points.
	*/
	var readCellMargins = (element) => {
		const children = childrenOf(element);
		const side = (...names) => names.map((name) => pointsOf(attributesOf(find(children, name))["w:w"], 20)).find((value) => value !== void 0);
		return Object.fromEntries(Object.entries({
			top: side("w:top"),
			bottom: side("w:bottom"),
			left: side("w:start", "w:left"),
			right: side("w:end", "w:right")
		}).filter(([, value]) => value !== void 0));
	};
	var stylesRead = /* @__PURE__ */ new WeakMap();
	/**
	* The styles of the document being written, with the fonts of its theme, or Word's defaults when the context has no
	* document.
	*/
	var getTextStyles = (context) => {
		var _stylesRead$get;
		const { file } = context;
		const styles = file === null || file === void 0 ? void 0 : file.Styles;
		if (!styles) return WORD_DEFAULT_STYLES;
		const read = (_stylesRead$get = stylesRead.get(styles)) !== null && _stylesRead$get !== void 0 ? _stylesRead$get : readTextStyles(styles.prepForXml(READING_CONTEXT), readThemeFonts(file.Theme.prepForXml(READING_CONTEXT)));
		stylesRead.set(styles, read);
		return read;
	};
	/**
	* A style and the styles it is based on, from the one at the bottom to the style itself. A style that isn't of the
	* given type, or that is based on itself, ends the chain.
	*/
	var styleChain = ({ styles }, id, type) => {
		const walk = (current, seen) => {
			const style = current === void 0 || seen.has(current) ? void 0 : styles.get(current);
			return (style === null || style === void 0 ? void 0 : style.type) === type ? [...walk(style.basedOn, /* @__PURE__ */ new Set([...seen, current])), style] : [];
		};
		return walk(id, /* @__PURE__ */ new Set());
	};
	/**
	* A share of a size in points, to the nearest half-point, and down from a quarter, as Word draws superscript and small
	* capitals: superscript is 3 points at 5, 9.5 at 15 and 16 at 25 (scripts/layout-probes/word-run-formatting.ts RF1)
	*/
	var nearestHalfPoint = (size, share) => Math.ceil(size * 2 * share - .5 - ROUNDING) / 2;
	/**
	* Text in superscript or subscript, drawn smaller, in a line of its own size: a superscript or subscript doesn't make a line
	* of its size taller, though Word raises its top above the line's (scripts/layout-probes/word-watertight-text.ts TX1a)
	*/
	var scripted = (font, { verticalAlign }) => {
		var _font$size;
		if (verticalAlign !== "superscript" && verticalAlign !== "subscript") return font;
		const size = (_font$size = font.size) !== null && _font$size !== void 0 ? _font$size : 10;
		return _objectSpread2(_objectSpread2({}, font), {}, {
			size: nearestHalfPoint(size, SCRIPT_SCALE),
			lineSize: size
		});
	};
	var BORDER_WIDTHS = _objectSpread2(_objectSpread2(_objectSpread2({}, Object.fromEntries([
		"single",
		"thick",
		"dotted",
		"dashed",
		"dotDash",
		"dotDotDash",
		"dashSmallGap",
		"inset",
		"outset"
	].map((style) => [style, (size) => size]))), {}, {
		double: (size) => 3 * size,
		triple: (size) => 5 * size,
		wave: () => 24,
		dashDotStroked: () => 24,
		doubleWave: () => 42
	}, Object.fromEntries([
		["thinThickSmallGap", 12],
		["thickThinSmallGap", 12],
		["threeDEmboss", 12],
		["threeDEngrave", 12],
		["thinThickThinSmallGap", 24]
	].map(([style, more]) => [style, (size) => size >= 4 && size <= 18 ? size + more : void 0]))), Object.fromEntries([
		[
			"thinThickMediumGap",
			2,
			0
		],
		[
			"thickThinMediumGap",
			2,
			0
		],
		[
			"thinThickThinMediumGap",
			3,
			0
		],
		[
			"thinThickLargeGap",
			1,
			18
		],
		[
			"thickThinLargeGap",
			1,
			18
		],
		[
			"thinThickThinLargeGap",
			2,
			24
		]
	].map(([style, times, more]) => [style, (size) => size >= 4 && size <= 24 ? times * size + more : void 0])));
	var LINE_BORDERS = /* @__PURE__ */ new Set([
		"nil",
		"none",
		...Object.keys(BORDER_WIDTHS),
		"custom"
	]);
	/** Whether a style of border is an art border's, of pictures, whose size is in points, rather than a line's */
	var isArtBorder = (style) => !LINE_BORDERS.has(style);
	var SEEN_RUN_BORDERS = { thickThinLargeGap: { 36: 54 } };
	/**
	* How wide a run's border is as Word draws it, in eighths of a point: as a paragraph's of its style. A border of no style
	* ("none") takes its space still, but no width (scripts/layout-probes/word-run-formatting.ts RF7h). An art border's size
	* is in points, so apples of 12 take 12 points (scripts/layout-probes/stops2/word-stops-text.ts RF25c), and Word draws a
	* single border of an eighth of a point, and a double one of none, as given (RF25f, RF25e). A shadow doubles a single
	* line, as a paragraph's (`word-paragraph-formats.docx` B6), and one drawn as a frame is as wide: one of 1.5 points 2
	* points from the text takes 100 twips beside and above and below it with a shadow, and 70 as a frame
	* (scripts/layout-probes/stops2/word-stops-text2.ts RF24c, RF24d). Undefined when Word hasn't been seen to draw it.
	*/
	var runBorderWidth = ({ style, size, shadow, frame }) => {
		var _BORDER_WIDTHS$style, _BORDER_WIDTHS$style2, _SEEN_RUN_BORDERS$sty;
		if (size === void 0) return style === "none" && !shadow && !frame ? 0 : void 0;
		if (shadow || frame) return style === "single" && size >= 2 && size <= 96 ? (shadow ? 2 : 1) * size : void 0;
		if (isArtBorder(style)) return size >= 1 && size <= 31 ? size * EIGHTHS_PER_POINT : void 0;
		if (style === "single" && size === 1 || style === "double" && size === 0) return BORDER_WIDTHS[style](size);
		return style === "none" ? 0 : size < 2 || size > 96 ? void 0 : (_BORDER_WIDTHS$style = (_BORDER_WIDTHS$style2 = BORDER_WIDTHS[style]) === null || _BORDER_WIDTHS$style2 === void 0 ? void 0 : _BORDER_WIDTHS$style2.call(BORDER_WIDTHS, size)) !== null && _BORDER_WIDTHS$style !== void 0 ? _BORDER_WIDTHS$style : (_SEEN_RUN_BORDERS$sty = SEEN_RUN_BORDERS[style]) === null || _SEEN_RUN_BORDERS$sty === void 0 ? void 0 : _SEEN_RUN_BORDERS$sty[size];
	};
	/**
	* The room a run's border takes, beside the run and above and below it: its space and its width, as Word gives it room (a
	* single border of half a point 4 points away takes 90 twips on each side and above and below, RF7a). Word keeps a space
	* in five bits, so one of 40 points is 8 (RF25d). Undefined when it takes none, as one of "nil" takes none at all
	* (word-run-formatting2.ts RF12), and when how much isn't known: see {@link unknownRunFormatting}.
	*/
	var textBorderOf = (border) => {
		const width = border === void 0 || border.style === "nil" ? void 0 : runBorderWidth(border);
		const room = width === void 0 ? 0 : width / EIGHTHS_PER_POINT + border.space % 32;
		return room > 0 ? {
			room,
			key: border.key
		} : void 0;
	};
	var EMPHASIS = {
		dot: "above",
		comma: "above",
		circle: "above",
		underDot: "below"
	};
	var plainFontOf = ({ font, size, bold, italic, kerning, ligatures, language, characterSpacing, scale, position, border, emphasisMark, snapToGrid }) => withoutUndefined({
		font,
		size,
		bold,
		italic,
		kerning,
		ligatures: ligatures === "none" ? void 0 : ligatures,
		language: kerning !== void 0 || ligatures !== void 0 && ligatures !== "none" ? language : void 0,
		characterSpacing,
		scale,
		raise: position === 0 ? void 0 : position,
		border: textBorderOf(border),
		emphasis: emphasisMark === void 0 ? void 0 : EMPHASIS[emphasisMark],
		snapToGrid: snapToGrid === false ? false : void 0
	});
	/**
	* The parts of run formatting that change the font text is measured in: its font, size, boldness, character spacing and
	* scale, superscript and subscript, which draw it smaller, how far it is raised, its border, and its emphasis marks.
	*/
	var fontOf = (format) => scripted(plainFontOf(format), format);
	/**
	* Which of a run's fonts Word draws a character in: the font for complex scripts, in their size, boldness and italics, for
	* all of a run that is right to left or of a complex script; the East Asian font for Chinese, Japanese and Korean; the
	* run's font for the rest. Hebrew in a run that isn't right to left is in the run's size, as Word lays it out. A mark is
	* drawn in the font of the character it is on.
	*/
	var slotOf = (character, previous, complexRun) => {
		if (complexRun) return "complex";
		if (isEastAsian(character)) return "eastAsian";
		return new RegExp("\\p{M}", "u").test(character) ? previous : "latin";
	};
	var FALLBACK_EAST_ASIAN_FONT = "MS Mincho";
	/**
	* The font of a character of a run, by the run's font Word draws it in. Complex scripts have their own size, boldness and
	* italics, and Word's defaults where the run doesn't give them.
	*/
	var fontOfSlot = (format, slot) => {
		const font = plainFontOf(format);
		if (slot === "latin") return scripted(font, format);
		const { eastAsiaFont, complexScriptFont, complexScriptSize, complexScriptBold, complexScriptItalic } = format;
		return scripted(slot === "eastAsian" ? _objectSpread2(_objectSpread2({}, font), {}, { font: isEastAsianFont(eastAsiaFont) ? eastAsiaFont : FALLBACK_EAST_ASIAN_FONT }) : withoutUndefined(_objectSpread2(_objectSpread2({}, font), {}, {
			font: complexScriptFont,
			size: complexScriptSize,
			bold: complexScriptBold,
			italic: complexScriptItalic
		})), format);
	};
	/**
	* A span of text in its formatting: in the run's font for its script, capitals for all caps, and smaller capitals for the
	* small letters of small caps.
	*/
	var spansOf = (text, format) => {
		const { allCaps, smallCaps, hidden, rightToLeft, complexScript } = format;
		if (hidden) return [];
		const complexRun = rightToLeft === true || complexScript === true;
		return [...text].reduce((all, character) => {
			var _last$slot;
			const last = all[all.length - 1];
			const slot = slotOf(character, (_last$slot = last === null || last === void 0 ? void 0 : last.slot) !== null && _last$slot !== void 0 ? _last$slot : "latin", complexRun);
			return (last === null || last === void 0 ? void 0 : last.slot) === slot ? [...all.slice(0, -1), {
				slot,
				text: last.text + character
			}] : [...all, {
				slot,
				text: character
			}];
		}, []).flatMap(({ slot, text: part }) => {
			var _font$size2, _font$lineSize;
			const font = fontOfSlot(format, slot);
			if (allCaps || !smallCaps) return [_objectSpread2(_objectSpread2({}, font), {}, { text: allCaps ? part.toUpperCase() : part })];
			const size = (_font$size2 = font.size) !== null && _font$size2 !== void 0 ? _font$size2 : 10;
			const small = _objectSpread2(_objectSpread2({}, font), {}, {
				size: nearestHalfPoint(size, SMALL_CAPS_SCALE),
				lineSize: (_font$lineSize = font.lineSize) !== null && _font$lineSize !== void 0 ? _font$lineSize : size
			});
			return part.split(new RegExp("(\\p{Ll}+)", "u")).filter((piece) => piece.length > 0).map((piece) => new RegExp("^\\p{Ll}", "u").test(piece) ? _objectSpread2(_objectSpread2({}, small), {}, { text: piece.toUpperCase() }) : _objectSpread2(_objectSpread2({}, font), {}, { text: piece }));
		});
	};
	/**
	* Whether a paragraph in the default style, without formatting of its own, has space before or after it.
	*/
	var hasDefaultParagraphSpacing = (styles) => {
		const { spaceBefore = 0, spaceAfter = 0 } = combine([styles.paragraph, ...styleChain(styles, styles.defaultParagraphStyle, "paragraph").map(({ paragraph }) => paragraph)]);
		return spaceBefore !== 0 || spaceAfter !== 0;
	};
	//#endregion
	//#region \0@oxc-project+runtime@0.152.0/helpers/esm/objectWithoutPropertiesLoose.js
	function _objectWithoutPropertiesLoose(r, e) {
		if (null == r) return {};
		var t = {};
		for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
			if (e.includes(n)) continue;
			t[n] = r[n];
		}
		return t;
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.152.0/helpers/esm/objectWithoutProperties.js
	function _objectWithoutProperties(e, t) {
		if (null == e) return {};
		var o, r, i = _objectWithoutPropertiesLoose(e, t);
		if (Object.getOwnPropertySymbols) {
			var s = Object.getOwnPropertySymbols(e);
			for (r = 0; r < s.length; r++) o = s[r], t.includes(o) || {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
		}
		return i;
	}
	//#endregion
	//#region src/shapes/shape-floating.ts
	/**
	* Floating shapes whose size or position is a percentage of the page, its margins or the space between them
	* (`wp14:sizeRelH`, `wp14:sizeRelV`, `wp14:pctPosHOffset` and `wp14:pctPosVOffset`), which Word keeps as percentages
	* when the page changes.
	*
	* Reference: [MS-ODRAWXML] 2.3.2, the wordprocessingDrawing 2010 schema
	*
	* @module
	*/
	var _excluded = [
		"horizontalPosition",
		"verticalPosition",
		"sizeRelativeTo"
	];
	/**
	* The sizes, in pixels, of the areas of the library's default page, A4 with 1-inch margins, which a percentage size or
	* offset is written with for applications that don't read percentages.
	*/
	var PAGE = {
		width: 11906 / 15,
		height: 16838 / 15,
		margin: 96
	};
	var BETWEEN_MARGINS = {
		width: PAGE.width - 2 * PAGE.margin,
		height: PAGE.height - 2 * PAGE.margin
	};
	var WIDTH_BASES = {
		betweenMargins: ["margin", BETWEEN_MARGINS.width],
		page: ["page", PAGE.width],
		leftMargin: ["leftMargin", PAGE.margin],
		rightMargin: ["rightMargin", PAGE.margin],
		insideMargin: ["insideMargin", PAGE.margin],
		outsideMargin: ["outsideMargin", PAGE.margin]
	};
	var HEIGHT_BASES = {
		betweenMargins: ["margin", BETWEEN_MARGINS.height],
		page: ["page", PAGE.height],
		topMargin: ["topMargin", PAGE.margin],
		bottomMargin: ["bottomMargin", PAGE.margin],
		insideMargin: ["insideMargin", PAGE.margin],
		outsideMargin: ["outsideMargin", PAGE.margin]
	};
	var POSITION_BASES = {
		[docx.HorizontalPositionRelativeFrom.MARGIN]: BETWEEN_MARGINS.width,
		[docx.HorizontalPositionRelativeFrom.PAGE]: PAGE.width,
		[docx.HorizontalPositionRelativeFrom.LEFT_MARGIN]: PAGE.margin,
		[docx.HorizontalPositionRelativeFrom.RIGHT_MARGIN]: PAGE.margin,
		[docx.HorizontalPositionRelativeFrom.INSIDE_MARGIN]: PAGE.margin,
		[docx.HorizontalPositionRelativeFrom.OUTSIDE_MARGIN]: PAGE.margin
	};
	var VERTICAL_POSITION_BASES = {
		[docx.VerticalPositionRelativeFrom.MARGIN]: BETWEEN_MARGINS.height,
		[docx.VerticalPositionRelativeFrom.PAGE]: PAGE.height,
		[docx.VerticalPositionRelativeFrom.TOP_MARGIN]: PAGE.margin,
		[docx.VerticalPositionRelativeFrom.BOTTOM_MARGIN]: PAGE.margin,
		[docx.VerticalPositionRelativeFrom.INSIDE_MARGIN]: PAGE.margin,
		[docx.VerticalPositionRelativeFrom.OUTSIDE_MARGIN]: PAGE.margin
	};
	var EMUS_PER_PIXEL$6 = 9525;
	/**
	* Reads a percentage, such as `"50%"`, as a number, such as 50.
	*
	* @returns The number, or nothing if the value is a number of pixels or EMUs
	* @throws If the value is a percentage that isn't a number of 0 or more
	*/
	var percentageOf = (value, option) => {
		if (typeof value === "number" || !value.endsWith("%")) return;
		const percentage = Number(value.slice(0, -1));
		if (!(value.length > 1 && percentage >= 0)) throw new Error(`Invalid ${option} "${value}". Expected a percentage of 0 or more, such as "50%"`);
		return percentage;
	};
	/**
	* The size, in pixels, of what a floating shape's percentage width and height are percentages of, on the library's
	* default page.
	*/
	var relativeSizeBase = (floating) => {
		var _floating$sizeRelativ, _floating$sizeRelativ2, _floating$sizeRelativ3, _floating$sizeRelativ4;
		return {
			width: WIDTH_BASES[(_floating$sizeRelativ = (_floating$sizeRelativ2 = floating.sizeRelativeTo) === null || _floating$sizeRelativ2 === void 0 ? void 0 : _floating$sizeRelativ2.width) !== null && _floating$sizeRelativ !== void 0 ? _floating$sizeRelativ : "betweenMargins"][1],
			height: HEIGHT_BASES[(_floating$sizeRelativ3 = (_floating$sizeRelativ4 = floating.sizeRelativeTo) === null || _floating$sizeRelativ4 === void 0 ? void 0 : _floating$sizeRelativ4.height) !== null && _floating$sizeRelativ3 !== void 0 ? _floating$sizeRelativ3 : "betweenMargins"][1]
		};
	};
	/**
	* An offset in EMUs, for a position given as a percentage: the percentage of the base on the library's default page.
	*
	* @throws If the percentage is of a base it can't be of, such as a column
	*/
	var offsetOf$1 = (offset, relative, bases) => {
		const percentage = offset === void 0 ? void 0 : percentageOf(offset, "offset");
		if (percentage === void 0) return offset;
		if (!(relative in bases)) throw new Error(`Invalid offset "${offset}". A percentage offset needs a position relative to the page, the space between its margins, or one of its margins`);
		return Math.round(bases[relative] * percentage / 100 * EMUS_PER_PIXEL$6);
	};
	/**
	* The floating options for a drawing, with percentage offsets turned into EMUs, as they are on the library's default page.
	*
	* @throws If a percentage offset is of a base it can't be of, such as a column
	*/
	var toImageFloating = (_ref) => {
		var _horizontalPosition$r, _verticalPosition$rel;
		let { horizontalPosition, verticalPosition, sizeRelativeTo: _ } = _ref;
		return _objectSpread2(_objectSpread2({}, _objectWithoutProperties(_ref, _excluded)), {}, {
			horizontalPosition: _objectSpread2(_objectSpread2({}, horizontalPosition), {}, { offset: offsetOf$1(horizontalPosition.offset, (_horizontalPosition$r = horizontalPosition.relative) !== null && _horizontalPosition$r !== void 0 ? _horizontalPosition$r : docx.HorizontalPositionRelativeFrom.PAGE, POSITION_BASES) }),
			verticalPosition: _objectSpread2(_objectSpread2({}, verticalPosition), {}, { offset: offsetOf$1(verticalPosition.offset, (_verticalPosition$rel = verticalPosition.relative) !== null && _verticalPosition$rel !== void 0 ? _verticalPosition$rel : docx.VerticalPositionRelativeFrom.PAGE, VERTICAL_POSITION_BASES) })
		});
	};
	var thousandths = (percentage) => percentage === void 0 ? void 0 : Math.round(percentage * 1e3);
	/**
	* A position with a percentage offset, for applications that read the Word 2010 drawing extensions, and its offset in
	* EMUs for those that don't, as Word writes a position that older versions can't read.
	*/
	var withPercentage = ([attributes, offset], name, percentage) => [attributes, { "mc:AlternateContent": [{ "mc:Choice": [{ _attr: { Requires: "wp14" } }, { [name]: [`${percentage}`] }] }, { "mc:Fallback": [offset] }] }];
	/**
	* Adds the percentages to a formatted drawing: offsets in place of the positions' offsets, and sizes after the graphic,
	* where Word writes them.
	*/
	var addPercentages = (xml, { width, height, horizontal, vertical }) => {
		const anchor = (children) => [
			...children.map((child) => {
				if ("wp:positionH" in child && horizontal !== void 0) return { "wp:positionH": withPercentage(child["wp:positionH"], "wp14:pctPosHOffset", horizontal) };
				return "wp:positionV" in child && vertical !== void 0 ? { "wp:positionV": withPercentage(child["wp:positionV"], "wp14:pctPosVOffset", vertical) } : child;
			}),
			...width ? [{ "wp14:sizeRelH": [{ _attr: { relativeFrom: width.relativeFrom } }, { "wp14:pctWidth": [`${width.percentage}`] }] }] : [],
			...height ? [{ "wp14:sizeRelV": [{ _attr: { relativeFrom: height.relativeFrom } }, { "wp14:pctHeight": [`${height.percentage}`] }] }] : []
		];
		const [floating] = xml["w:drawing"];
		return { "w:drawing": [{ "wp:anchor": anchor(floating["wp:anchor"]) }] };
	};
	/**
	* A floating drawing with a percentage size or position.
	*/
	var RelativeDrawing = class extends docx.XmlComponent {
		constructor(drawing, placement) {
			super("w:drawing");
			_defineProperty(this, "drawing", void 0);
			_defineProperty(this, "placement", void 0);
			this.drawing = drawing;
			this.placement = placement;
		}
		prepForXml(context) {
			return addPercentages(this.drawing.prepForXml(context), this.placement);
		}
	};
	/**
	* Writes a floating drawing's percentage size and position, if it has any, so Word keeps them as percentages.
	*
	* @param drawing - The drawing, with its size and position in pixels and EMUs on the library's default page
	* @param size - The width and height the shape was given
	*/
	var withRelativePlacement = (drawing, floating, size) => {
		var _floating$sizeRelativ5, _floating$sizeRelativ6, _floating$sizeRelativ7, _floating$sizeRelativ8;
		if (!floating) return drawing;
		const widthPercentage = percentageOf(size.width, "width");
		const heightPercentage = percentageOf(size.height, "height");
		const placement = {
			width: widthPercentage === void 0 ? void 0 : {
				relativeFrom: WIDTH_BASES[(_floating$sizeRelativ5 = (_floating$sizeRelativ6 = floating.sizeRelativeTo) === null || _floating$sizeRelativ6 === void 0 ? void 0 : _floating$sizeRelativ6.width) !== null && _floating$sizeRelativ5 !== void 0 ? _floating$sizeRelativ5 : "betweenMargins"][0],
				percentage: thousandths(widthPercentage)
			},
			height: heightPercentage === void 0 ? void 0 : {
				relativeFrom: HEIGHT_BASES[(_floating$sizeRelativ7 = (_floating$sizeRelativ8 = floating.sizeRelativeTo) === null || _floating$sizeRelativ8 === void 0 ? void 0 : _floating$sizeRelativ8.height) !== null && _floating$sizeRelativ7 !== void 0 ? _floating$sizeRelativ7 : "betweenMargins"][0],
				percentage: thousandths(heightPercentage)
			},
			horizontal: thousandths(floating.horizontalPosition.offset === void 0 ? void 0 : percentageOf(floating.horizontalPosition.offset, "offset")),
			vertical: thousandths(floating.verticalPosition.offset === void 0 ? void 0 : percentageOf(floating.verticalPosition.offset, "offset"))
		};
		return Object.values(placement).every((value) => value === void 0) ? drawing : new RelativeDrawing(drawing, placement);
	};
	//#endregion
	//#region src/shapes/shape-text-styles.ts
	/**
	* Reads the text and formatting of a shape's paragraphs, as the document's styles format them. Not part of the public
	* API.
	*
	* The formatting is read as it is written, with the readers docx/shapes shares with docx/layout.
	*
	* @module
	*/
	var componentChildren = (component) => component.root;
	/**
	* The text of a run, with tabs as `"\t"` and line breaks as `"\n"`, and its own formatting and character style.
	*/
	var readRun = (run, themeFonts) => {
		const children = run.prepForXml(READING_CONTEXT)["w:r"];
		const properties = find(children, "w:rPr");
		return {
			text: children.map((child) => {
				if ("w:t" in child) return child["w:t"].filter((part) => typeof part === "string").join("");
				if ("w:tab" in child) return "	";
				return "w:br" in child || "w:cr" in child ? "\n" : "";
			}).join(""),
			format: readRunFormat(properties, themeFonts),
			style: valueOf(childrenOf(properties), "w:rStyle")
		};
	};
	/**
	* The text runs in a paragraph, including those in hyperlinks. Pictures, shapes and other runs without text are left out.
	*/
	var runsIn = (children) => children.flatMap((child) => {
		if (child instanceof docx.TextRun) {
			var _child$writtenAs;
			return ((_child$writtenAs = child.writtenAs) !== null && _child$writtenAs !== void 0 ? _child$writtenAs : [child]).filter((part) => part instanceof docx.TextRun || part.constructor === docx.Run);
		}
		if (child instanceof docx.ExternalHyperlink) return runsIn(child.options.children);
		return child instanceof docx.XmlComponent && !(child instanceof docx.Run) ? runsIn(componentChildren(child)) : [];
	});
	/**
	* Reads a paragraph's text and formatting, as the document's styles format it.
	*/
	var readParagraph = (paragraph, styles) => {
		var _properties$prepForXm, _valueOf;
		const [properties, ...children] = componentChildren(paragraph);
		const propertyChildren = childrenOf((_properties$prepForXm = properties.prepForXml(READING_CONTEXT)) === null || _properties$prepForXm === void 0 ? void 0 : _properties$prepForXm["w:pPr"]);
		const style = (_valueOf = valueOf(propertyChildren, "w:pStyle")) !== null && _valueOf !== void 0 ? _valueOf : styles.defaultParagraphStyle;
		const paragraphStyles = styleChain(styles, style, "paragraph");
		const paragraphRun = combine([styles.run, ...paragraphStyles.map(({ run }) => run)]);
		return {
			spans: runsIn(children).flatMap((run) => {
				const { text, format, style: runStyle } = readRun(run, styles.themeFonts);
				const characterStyles = styleChain(styles, runStyle !== null && runStyle !== void 0 ? runStyle : styles.defaultCharacterStyle, "character");
				return spansOf(text, combine([
					paragraphRun,
					...characterStyles.map(({ run: styleRun }) => styleRun),
					format
				]));
			}),
			font: fontOf(combine([paragraphRun, readRunFormat(find(propertyChildren, "w:rPr"), styles.themeFonts)])),
			format: combine([
				styles.paragraph,
				...paragraphStyles.map(({ paragraph: format }) => format),
				readParagraphFormat(propertyChildren)
			]),
			style
		};
	};
	/**
	* Reads the text and formatting of a shape's paragraphs, as the document's styles format them.
	*/
	var readTextParagraphs = (paragraphs, styles) => paragraphs.map((paragraph) => readParagraph(paragraph, styles));
	//#endregion
	//#region src/shapes/connector/shape-guides.ts
	var ANGLE_UNITS_PER_RADIAN = 108e5 / Math.PI;
	var FULL_CIRCLE = 216e5;
	var OPERATORS = new Map(Object.entries({
		"*/": (x, y, z) => x * y / z,
		"+-": (x, y, z) => x + y - z,
		"+/": (x, y, z) => (x + y) / z,
		"?:": (x, y, z) => x > 0 ? y : z,
		abs: (x) => Math.abs(x),
		at2: (x, y) => Math.atan2(y, x) * ANGLE_UNITS_PER_RADIAN,
		cat2: (x, y, z) => x * Math.cos(Math.atan2(z, y)),
		cos: (x, y) => x * Math.cos(y / ANGLE_UNITS_PER_RADIAN),
		max: (x, y) => Math.max(x, y),
		min: (x, y) => Math.min(x, y),
		mod: (x, y, z) => Math.sqrt(x * x + y * y + z * z),
		pin: (x, y, z) => {
			if (y < x) return x;
			return y > z ? z : y;
		},
		sat2: (x, y, z) => x * Math.sin(Math.atan2(z, y)),
		sin: (x, y) => x * Math.sin(y / ANGLE_UNITS_PER_RADIAN),
		sqrt: (x) => Math.sqrt(x),
		tan: (x, y) => x * Math.tan(y / ANGLE_UNITS_PER_RADIAN),
		val: (x) => x
	}));
	/**
	* The value of a built-in guide, such as `w` (the width), `hc` (the horizontal centre),
	* `wd4` (a quarter of the width) or `3cd4` (three quarters of a circle).
	*/
	var builtInGuide = (name, width, height) => {
		const fixed = /* @__PURE__ */ new Map([
			["w", width],
			["h", height],
			["l", 0],
			["t", 0],
			["r", width],
			["b", height],
			["hc", width / 2],
			["vc", height / 2],
			["ss", Math.min(width, height)],
			["ls", Math.max(width, height)]
		]);
		if (fixed.has(name)) return fixed.get(name);
		const fraction = /^(wd|hd|ssd)(\d+)$/.exec(name);
		if (fraction) return {
			wd: width,
			hd: height,
			ssd: Math.min(width, height)
		}[fraction[1]] / Number(fraction[2]);
		const circle = /^(\d*)cd(\d+)$/.exec(name);
		return circle ? Number(circle[1] || 1) * FULL_CIRCLE / Number(circle[2]) : void 0;
	};
	/**
	* Evaluates a shape definition's guides for a shape of the given size, in EMUs.
	*
	* @param adjustments - Adjustment guide values (such as `{ adj: 25000 }`) that replace the defaults
	* @returns A function that gives the value of a guide name, built-in guide or number
	* @throws If a formula uses an unknown operator or guide
	*/
	var evaluateShapeGuides = ({ defaults = {}, guides }, width, height, adjustments = {}) => {
		const values = new Map(Object.entries(_objectSpread2(_objectSpread2({}, defaults), adjustments)));
		const value = (token) => {
			var _values$get;
			if (/^-?\d+$/.test(token)) return Number(token);
			const result = (_values$get = values.get(token)) !== null && _values$get !== void 0 ? _values$get : builtInGuide(token, width, height);
			if (result === void 0) throw new Error(`Unknown shape guide "${token}"`);
			return result;
		};
		for (const guide of guides ? guides.split("; ") : []) {
			const [name, operatorName, ...args] = guide.split(" ");
			const operator = OPERATORS.get(operatorName);
			if (!operator) throw new Error(`Unknown shape guide operator "${operatorName}"`);
			const [x = 0, y = 0, z = 0] = args.map(value);
			values.set(name, operator(x, y, z));
		}
		return value;
	};
	//#endregion
	//#region src/shapes/preset-shape/preset-shape-geometry.ts
	var PRESET_SHAPE_GEOMETRY = {
		line: { sites: "cd4 l t; 3cd4 r b" },
		inverseLine: { sites: "cd4 l b; 3cd4 r t" },
		elbowConnector: { defaults: { adj1: 5e4 } },
		elbowConnectorThreeBends: { defaults: {
			adj1: 5e4,
			adj2: 5e4
		} },
		elbowConnectorFourBends: { defaults: {
			adj1: 5e4,
			adj2: 5e4,
			adj3: 5e4
		} },
		curvedConnector: { defaults: { adj1: 5e4 } },
		curvedConnectorThreeBends: { defaults: {
			adj1: 5e4,
			adj2: 5e4
		} },
		curvedConnectorFourBends: { defaults: {
			adj1: 5e4,
			adj2: 5e4,
			adj3: 5e4
		} },
		triangle: {
			defaults: { adj: 5e4 },
			guides: "a pin 0 adj 100000; x1 */ w a 200000; x2 */ w a 100000; x3 +- x1 wd2 0",
			sites: "3cd4 x2 t; cd2 x1 vc; cd4 l b; cd4 x2 b; cd4 r b; 0 x3 vc",
			text: "x1 vc x3 b"
		},
		rightTriangle: {
			guides: "it */ h 7 12; ir */ w 7 12; ib */ h 11 12",
			sites: "3cd4 l t; cd2 l vc; cd4 l b; cd4 hc b; cd4 r b; 0 hc vc",
			text: "wd12 it ir ib"
		},
		diamond: {
			guides: "ir */ w 3 4; ib */ h 3 4",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "wd4 hd4 ir ib"
		},
		parallelogram: {
			defaults: { adj: 25e3 },
			guides: "maxAdj */ 100000 w ss; a pin 0 adj maxAdj; x1 */ ss a 200000; x2 */ ss a 100000; x6 +- r 0 x1; x5 +- r 0 x2; x3 */ x5 1 2; x4 +- r 0 x3; il */ wd2 a maxAdj; q1 */ 5 a maxAdj; q2 +/ 1 q1 12; il */ q2 w 1; it */ q2 h 1; ir +- r 0 il; ib +- b 0 it; q3 */ h hc x2; y1 pin 0 q3 h; y2 +- b 0 y1",
			sites: "3cd4 hc y2; 3cd4 x4 t; 0 x6 vc; cd4 x3 b; cd4 hc y1; cd2 x1 vc",
			text: "il it ir ib"
		},
		trapezoid: {
			defaults: { adj: 25e3 },
			guides: "maxAdj */ 50000 w ss; a pin 0 adj maxAdj; x1 */ ss a 200000; x4 +- r 0 x1; il */ wd3 a maxAdj; it */ hd3 a maxAdj; ir +- r 0 il",
			sites: "3cd4 hc t; cd2 x1 vc; cd4 hc b; 0 x4 vc",
			text: "il it ir b"
		},
		nonIsoscelesTrapezoid: {
			defaults: {
				adj1: 25e3,
				adj2: 25e3
			},
			guides: "maxAdj */ 50000 w ss; a1 pin 0 adj1 maxAdj; a2 pin 0 adj2 maxAdj; x1 */ ss a1 200000; dx3 */ ss a2 100000; x3 +- r 0 dx3; x4 +/ r x3 2; il */ wd3 a1 maxAdj; adjm max a1 a2; it */ hd3 adjm maxAdj; irt */ wd3 a2 maxAdj; ir +- r 0 irt",
			sites: "0 x4 vc; cd4 hc b; cd2 x1 vc; 3cd4 hc t",
			text: "il it ir b"
		},
		pentagon: {
			defaults: {
				hf: 105146,
				vf: 110557
			},
			guides: "swd2 */ wd2 hf 100000; shd2 */ hd2 vf 100000; svc */ vc vf 100000; dx1 cos swd2 1080000; dx2 cos swd2 18360000; dy1 sin shd2 1080000; dy2 sin shd2 18360000; x1 +- hc 0 dx1; x2 +- hc 0 dx2; x3 +- hc dx2 0; x4 +- hc dx1 0; y1 +- svc 0 dy1; y2 +- svc 0 dy2; it */ y1 dx2 dx1",
			sites: "3cd4 hc t; cd2 x1 y1; cd4 x2 y2; cd4 hc b; cd4 x3 y2; 0 x4 y1",
			text: "x2 it x3 y2"
		},
		hexagon: {
			defaults: {
				adj: 25e3,
				vf: 115470
			},
			guides: "maxAdj */ 50000 w ss; a pin 0 adj maxAdj; shd2 */ hd2 vf 100000; x1 */ ss a 100000; x2 +- r 0 x1; dy1 sin shd2 3600000; y1 +- vc 0 dy1; y2 +- vc dy1 0; q1 */ maxAdj -1 2; q2 +- a q1 0; q3 ?: q2 4 2; q4 ?: q2 3 2; q5 ?: q2 q1 0; q6 +/ a q5 q1; q7 */ q6 q4 -1; q8 +- q3 q7 0; il */ w q8 24; it */ h q8 24; ir +- r 0 il; ib +- b 0 it",
			sites: "0 r vc; cd4 x2 y2; cd4 x1 y2; cd2 l vc; 3cd4 x1 y1; 3cd4 x2 y1",
			text: "il it ir ib"
		},
		heptagon: {
			defaults: {
				hf: 102572,
				vf: 105210
			},
			guides: "swd2 */ wd2 hf 100000; shd2 */ hd2 vf 100000; svc */ vc vf 100000; dx1 */ swd2 97493 100000; dx2 */ swd2 78183 100000; dx3 */ swd2 43388 100000; dy1 */ shd2 62349 100000; dy2 */ shd2 22252 100000; dy3 */ shd2 90097 100000; x1 +- hc 0 dx1; x2 +- hc 0 dx2; x3 +- hc 0 dx3; x4 +- hc dx3 0; x5 +- hc dx2 0; x6 +- hc dx1 0; y1 +- svc 0 dy1; y2 +- svc dy2 0; y3 +- svc dy3 0; ib +- b 0 y1",
			sites: "0 x5 y1; 0 x6 y2; cd4 x4 y3; cd4 x3 y3; cd2 x1 y2; cd2 x2 y1; 3cd4 hc t",
			text: "x2 y1 x5 ib"
		},
		octagon: {
			defaults: { adj: 29289 },
			guides: "a pin 0 adj 50000; x1 */ ss a 100000; x2 +- r 0 x1; y2 +- b 0 x1; il */ x1 1 2; ir +- r 0 il; ib +- b 0 il",
			sites: "0 r x1; 0 r y2; cd4 x2 b; cd4 x1 b; cd2 l y2; cd2 l x1; 3cd4 x1 t; 3cd4 x2 t",
			text: "il il ir ib"
		},
		decagon: {
			defaults: { vf: 105146 },
			guides: "shd2 */ hd2 vf 100000; dx1 cos wd2 2160000; dx2 cos wd2 4320000; x1 +- hc 0 dx1; x2 +- hc 0 dx2; x3 +- hc dx2 0; x4 +- hc dx1 0; dy1 sin shd2 4320000; dy2 sin shd2 2160000; y1 +- vc 0 dy1; y2 +- vc 0 dy2; y3 +- vc dy2 0; y4 +- vc dy1 0",
			sites: "0 x4 y2; 0 r vc; 0 x4 y3; cd4 x3 y4; cd4 x2 y4; cd2 x1 y3; cd2 l vc; cd2 x1 y2; 3cd4 x2 y1; 3cd4 x3 y1",
			text: "x1 y2 x4 y3"
		},
		dodecagon: {
			guides: "x1 */ w 2894 21600; x2 */ w 7906 21600; x3 */ w 13694 21600; x4 */ w 18706 21600; y1 */ h 2894 21600; y2 */ h 7906 21600; y3 */ h 13694 21600; y4 */ h 18706 21600",
			sites: "0 x4 y1; 0 r y2; 0 r y3; 0 x4 y4; cd4 x3 b; cd4 x2 b; cd2 x1 y4; cd2 l y3; cd2 l y2; cd2 x1 y1; 3cd4 x2 t; 3cd4 x3 t",
			text: "x1 y1 x4 y4"
		},
		ellipse: {
			guides: "idx cos wd2 2700000; idy sin hd2 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "3cd4 hc t; 3cd4 il it; cd2 l vc; cd4 il ib; cd4 hc b; cd4 ir ib; 0 r vc; 3cd4 ir it",
			text: "il it ir ib"
		},
		teardrop: {
			defaults: { adj: 1e5 },
			guides: "a pin 0 adj 200000; r2 sqrt 2; tw */ wd2 r2 1; th */ hd2 r2 1; sw */ tw a 100000; sh */ th a 100000; dx1 cos sw 2700000; dy1 sin sh 2700000; x1 +- hc dx1 0; y1 +- vc 0 dy1; idx cos wd2 2700000; idy sin hd2 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "0 r vc; cd4 ir ib; cd4 hc b; cd4 il ib; cd2 l vc; 3cd4 il it; 3cd4 hc t; 3cd4 x1 y1",
			text: "il it ir ib"
		},
		pieWedge: {
			guides: "g1 cos w 13500000; g2 sin h 13500000; x1 +- r g1 0; y1 +- b g2 0",
			sites: "0 r vc; cd4 hc b",
			text: "x1 y1 r b"
		},
		pie: {
			defaults: {
				adj1: 0,
				adj2: 162e5
			},
			guides: "idx cos wd2 2700000; idy sin hd2 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t",
			text: "il ir it ib"
		},
		blockArc: {
			defaults: {
				adj1: 108e5,
				adj2: 0,
				adj3: 25e3
			},
			guides: "stAng pin 0 adj1 21599999; istAng pin 0 adj2 21599999; a3 pin 0 adj3 50000; sw11 +- istAng 0 stAng; sw12 +- sw11 21600000 0; swAng ?: sw11 sw11 sw12; wt1 sin wd2 stAng; ht1 cos hd2 stAng; wt3 sin wd2 istAng; ht3 cos hd2 istAng; dx1 cat2 wd2 ht1 wt1; dy1 sat2 hd2 ht1 wt1; dx3 cat2 wd2 ht3 wt3; dy3 sat2 hd2 ht3 wt3; x1 +- hc dx1 0; y1 +- vc dy1 0; x3 +- hc dx3 0; y3 +- vc dy3 0; dr */ ss a3 100000; iwd2 +- wd2 0 dr; ihd2 +- hd2 0 dr; wt2 sin iwd2 istAng; ht2 cos ihd2 istAng; wt4 sin iwd2 stAng; ht4 cos ihd2 stAng; dx2 cat2 iwd2 ht2 wt2; dy2 sat2 ihd2 ht2 wt2; dx4 cat2 iwd2 ht4 wt4; dy4 sat2 ihd2 ht4 wt4; x2 +- hc dx2 0; y2 +- vc dy2 0; x4 +- hc dx4 0; y4 +- vc dy4 0; sw0 +- 21600000 0 stAng; da1 +- swAng 0 sw0; g1 max x1 x2; g2 max x3 x4; g3 max g1 g2; ir ?: da1 r g3; sw1 +- cd4 0 stAng; sw2 +- 27000000 0 stAng; sw3 ?: sw1 sw1 sw2; da2 +- swAng 0 sw3; g5 max y1 y2; g6 max y3 y4; g7 max g5 g6; ib ?: da2 b g7; sw4 +- cd2 0 stAng; sw5 +- 32400000 0 stAng; sw6 ?: sw4 sw4 sw5; da3 +- swAng 0 sw6; g9 min x1 x2; g10 min x3 x4; g11 min g9 g10; il ?: da3 l g11; sw7 +- 3cd4 0 stAng; sw8 +- 37800000 0 stAng; sw9 ?: sw7 sw7 sw8; da4 +- swAng 0 sw9; g13 min y1 y2; g14 min y3 y4; g15 min g13 g14; it ?: da4 t g15; x5 +/ x1 x4 2; y5 +/ y1 y4 2; x6 +/ x3 x2 2; y6 +/ y3 y2 2; cang1 +- stAng 0 cd4; cang2 +- istAng cd4 0; cang3 +/ cang1 cang2 2",
			sites: "cang1 x5 y5; cang2 x6 y6; cang3 hc vc",
			text: "il it ir ib"
		},
		donut: {
			defaults: { adj: 25e3 },
			guides: "idx cos wd2 2700000; idy sin hd2 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "3cd4 hc t; 3cd4 il it; cd2 l vc; cd4 il ib; cd4 hc b; cd4 ir ib; 0 r vc; 3cd4 ir it",
			text: "il it ir ib"
		},
		noSymbol: {
			defaults: { adj: 18750 },
			guides: "idx cos wd2 2700000; idy sin hd2 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "3cd4 hc t; 3cd4 il it; cd2 l vc; cd4 il ib; cd4 hc b; cd4 ir ib; 0 r vc; 3cd4 ir it",
			text: "il it ir ib"
		},
		chord: {
			defaults: {
				adj1: 27e5,
				adj2: 162e5
			},
			guides: "stAng pin 0 adj1 21599999; enAng pin 0 adj2 21599999; sw1 +- enAng 0 stAng; sw2 +- sw1 21600000 0; swAng ?: sw1 sw1 sw2; wt1 sin wd2 stAng; ht1 cos hd2 stAng; dx1 cat2 wd2 ht1 wt1; dy1 sat2 hd2 ht1 wt1; wt2 sin wd2 enAng; ht2 cos hd2 enAng; dx2 cat2 wd2 ht2 wt2; dy2 sat2 hd2 ht2 wt2; x1 +- hc dx1 0; y1 +- vc dy1 0; x2 +- hc dx2 0; y2 +- vc dy2 0; x3 +/ x1 x2 2; y3 +/ y1 y2 2; midAng0 */ swAng 1 2; midAng +- stAng midAng0 cd2; idx cos wd2 2700000; idy sin hd2 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "stAng x1 y1; enAng x2 y2; midAng x3 y3",
			text: "il it ir ib"
		},
		arc: {
			defaults: {
				adj1: 162e5,
				adj2: 0
			},
			guides: "stAng pin 0 adj1 21599999; enAng pin 0 adj2 21599999; sw11 +- enAng 0 stAng; sw12 +- sw11 21600000 0; swAng ?: sw11 sw11 sw12; wt1 sin wd2 stAng; ht1 cos hd2 stAng; dx1 cat2 wd2 ht1 wt1; dy1 sat2 hd2 ht1 wt1; wt2 sin wd2 enAng; ht2 cos hd2 enAng; dx2 cat2 wd2 ht2 wt2; dy2 sat2 hd2 ht2 wt2; x1 +- hc dx1 0; y1 +- vc dy1 0; x2 +- hc dx2 0; y2 +- vc dy2 0; sw0 +- 21600000 0 stAng; da1 +- swAng 0 sw0; g1 max x1 x2; ir ?: da1 r g1; sw1 +- cd4 0 stAng; sw2 +- 27000000 0 stAng; sw3 ?: sw1 sw1 sw2; da2 +- swAng 0 sw3; g5 max y1 y2; ib ?: da2 b g5; sw4 +- cd2 0 stAng; sw5 +- 32400000 0 stAng; sw6 ?: sw4 sw4 sw5; da3 +- swAng 0 sw6; g9 min x1 x2; il ?: da3 l g9; sw7 +- 3cd4 0 stAng; sw8 +- 37800000 0 stAng; sw9 ?: sw7 sw7 sw8; da4 +- swAng 0 sw9; g13 min y1 y2; it ?: da4 t g13; cang1 +- stAng 0 cd4; cang2 +- enAng cd4 0; cang3 +/ cang1 cang2 2",
			sites: "cang1 x1 y1; cang3 hc vc; cang2 x2 y2",
			text: "il it ir ib"
		},
		frame: {
			defaults: { adj1: 12500 },
			guides: "a1 pin 0 adj1 50000; x1 */ ss a1 100000; x4 +- r 0 x1; y4 +- b 0 x1",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "x1 x1 x4 y4"
		},
		halfFrame: {
			defaults: {
				adj1: 33333,
				adj2: 33333
			},
			guides: "maxAdj2 */ 100000 w ss; a2 pin 0 adj2 maxAdj2; x1 */ ss a2 100000; g1 */ h x1 w; g2 +- h 0 g1; maxAdj1 */ 100000 g2 ss; a1 pin 0 adj1 maxAdj1; y1 */ ss a1 100000; dx2 */ y1 w h; x2 +- r 0 dx2; dy2 */ x1 h w; y2 +- b 0 dy2; cx1 */ x1 1 2; cy1 +/ y2 b 2; cx2 +/ x2 r 2; cy2 */ y1 1 2",
			sites: "0 cx2 cy2; cd4 cx1 cy1; cd2 l vc; 3cd4 hc t"
		},
		lShape: {
			defaults: {
				adj1: 5e4,
				adj2: 5e4
			},
			guides: "maxAdj1 */ 100000 h ss; maxAdj2 */ 100000 w ss; a1 pin 0 adj1 maxAdj1; a2 pin 0 adj2 maxAdj2; x1 */ ss a2 100000; dy1 */ ss a1 100000; y1 +- b 0 dy1; cx1 */ x1 1 2; cy1 +/ y1 b 2; d +- w 0 h; it ?: d y1 t; ir ?: d r x1",
			sites: "0 r cy1; cd4 hc b; cd2 l vc; 3cd4 cx1 t",
			text: "l it ir b"
		},
		diagonalStripe: {
			defaults: { adj: 5e4 },
			guides: "a pin 0 adj 100000; x2 */ w a 100000; x1 */ x2 1 2; x3 +/ x2 r 2; y2 */ h a 100000; y1 */ y2 1 2; y3 +/ y2 b 2",
			sites: "0 hc vc; cd2 l y3; cd2 x1 y1; 3cd4 x3 t",
			text: "l t x3 y3"
		},
		cross: {
			defaults: { adj: 25e3 },
			guides: "a pin 0 adj 50000; x1 */ ss a 100000; x2 +- r 0 x1; y2 +- b 0 x1; d +- w 0 h; il ?: d l x1; ir ?: d r x2; it ?: d x1 t; ib ?: d y2 b",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "il it ir ib"
		},
		plaque: {
			defaults: { adj: 16667 },
			guides: "a pin 0 adj 50000; x1 */ ss a 100000; il */ x1 70711 100000; ir +- r 0 il; ib +- b 0 il",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "il il ir ib"
		},
		cylinder: {
			defaults: { adj: 25e3 },
			guides: "maxAdj */ 50000 h ss; a pin 0 adj maxAdj; y1 */ ss a 200000; y2 +- y1 y1 0; y3 +- b 0 y1",
			sites: "3cd4 hc y2; 3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "l y2 r y3"
		},
		cube: {
			defaults: { adj: 25e3 },
			guides: "a pin 0 adj 100000; y1 */ ss a 100000; y4 +- b 0 y1; y2 */ y4 1 2; y3 +/ y1 b 2; x4 +- r 0 y1; x2 */ x4 1 2; x3 +/ y1 r 2",
			sites: "3cd4 x3 t; 3cd4 x2 y1; cd2 l y3; cd4 x2 b; 0 x4 y3; 0 r y2",
			text: "l y1 x4 b"
		},
		beveledRectangle: {
			defaults: { adj: 12500 },
			guides: "a pin 0 adj 50000; x1 */ ss a 100000; x2 +- r 0 x1; y2 +- b 0 x1",
			sites: "0 r vc; 0 x2 vc; cd4 hc b; cd4 hc y2; cd2 l vc; cd2 x1 vc; 3cd4 hc t; 3cd4 hc x1",
			text: "x1 x1 x2 y2"
		},
		foldedCorner: {
			defaults: { adj: 16667 },
			guides: "a pin 0 adj 50000; dy2 */ ss a 100000; y2 +- b 0 dy2",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "l t r y2"
		},
		smileyFace: {
			defaults: { adj: 4653 },
			guides: "idx cos wd2 2700000; idy sin hd2 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "3cd4 hc t; 3cd4 il it; cd2 l vc; cd4 il ib; cd4 hc b; cd4 ir ib; 0 r vc; 3cd4 ir it",
			text: "il it ir ib"
		},
		heart: {
			guides: "il */ w 1 6; ir */ w 5 6; ib */ h 2 3",
			sites: "3cd4 hc hd4; cd4 hc b",
			text: "il hd4 ir ib"
		},
		lightningBolt: {
			guides: "x1 */ w 5022 21600; x3 */ w 8472 21600; x4 */ w 8757 21600; x5 */ w 10012 21600; x8 */ w 12860 21600; x9 */ w 13917 21600; x11 */ w 16577 21600; y1 */ h 3890 21600; y2 */ h 6080 21600; y4 */ h 7437 21600; y6 */ h 9705 21600; y7 */ h 12007 21600; y10 */ h 14277 21600; y11 */ h 14915 21600",
			sites: "3cd4 x3 t; 3cd4 l y1; cd2 x1 y6; cd2 x5 y11; cd4 r b; 0 x11 y7; 0 x8 y2",
			text: "x4 y4 x9 y10"
		},
		sun: {
			defaults: { adj: 25e3 },
			guides: "a pin 12500 adj 46875; g0 +- 50000 0 a; g7 */ g0 23170 32768; g8 +- 50000 g7 0; g9 +- 50000 0 g7; x8 */ w g8 100000; x9 */ w g9 100000; y8 */ h g8 100000; y9 */ h g9 100000",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "x9 y9 x8 y8"
		},
		moon: {
			defaults: { adj: 5e4 },
			guides: "a pin 0 adj 87500; g0 */ ss a 100000; g0w */ g0 w ss; g12 */ g0 9598 32768; g12w */ g12 w ss; g13 +- ss 0 g12; q1 */ ss ss 1; q2 */ g13 g13 1; q3 +- q1 0 q2; q4 sqrt q3; dy4 */ q4 hd2 ss; g15h +- vc 0 dy4; g16h +- vc dy4 0",
			sites: "3cd4 r t; cd2 l vc; cd4 r b; 0 g0w vc",
			text: "g12w g15h g0w g16h"
		},
		cloud: {
			guides: "il */ w 2977 21600; it */ h 3262 21600; ir */ w 17087 21600; ib */ h 17337 21600; g27 */ w 67 21600; g28 */ h 21577 21600; g29 */ w 21582 21600; g30 */ h 1235 21600",
			sites: "0 g29 vc; cd4 hc g28; cd2 g27 vc; 3cd4 hc g30",
			text: "il it ir ib"
		},
		leftBracket: {
			defaults: { adj: 8333 },
			guides: "maxAdj */ 50000 h ss; a pin 0 adj maxAdj; y1 */ ss a 100000; dx1 cos w 2700000; dy1 sin y1 2700000; il +- r 0 dx1; it +- y1 0 dy1; ib +- b dy1 y1",
			sites: "cd4 r t; cd2 l vc; 3cd4 r b",
			text: "il it r ib"
		},
		rightBracket: {
			defaults: { adj: 8333 },
			guides: "maxAdj */ 50000 h ss; a pin 0 adj maxAdj; y1 */ ss a 100000; dx1 cos w 2700000; dy1 sin y1 2700000; ir +- l dx1 0; it +- y1 0 dy1; ib +- b dy1 y1",
			sites: "cd4 l t; 3cd4 l b; cd2 r vc",
			text: "l it ir ib"
		},
		leftBrace: {
			defaults: {
				adj1: 8333,
				adj2: 5e4
			},
			guides: "a2 pin 0 adj2 100000; q1 +- 100000 0 a2; q2 min q1 a2; q3 */ q2 1 2; maxAdj1 */ q3 h ss; a1 pin 0 adj1 maxAdj1; y1 */ ss a1 100000; y3 */ h a2 100000; dx1 cos wd2 2700000; dy1 sin y1 2700000; il +- r 0 dx1; it +- y1 0 dy1; ib +- b dy1 y1",
			sites: "cd4 r t; cd2 l y3; 3cd4 r b",
			text: "il it r ib"
		},
		rightBrace: {
			defaults: {
				adj1: 8333,
				adj2: 5e4
			},
			guides: "a2 pin 0 adj2 100000; q1 +- 100000 0 a2; q2 min q1 a2; q3 */ q2 1 2; maxAdj1 */ q3 h ss; a1 pin 0 adj1 maxAdj1; y1 */ ss a1 100000; y3 */ h a2 100000; dx1 cos wd2 2700000; dy1 sin y1 2700000; ir +- l dx1 0; it +- y1 0 dy1; ib +- b dy1 y1",
			sites: "cd4 l t; cd2 r y3; 3cd4 l b",
			text: "l it ir ib"
		},
		bracketPair: {
			defaults: { adj: 16667 },
			guides: "a pin 0 adj 50000; x1 */ ss a 100000; il */ x1 29289 100000; ir +- r 0 il; ib +- b 0 il",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "il il ir ib"
		},
		bracePair: {
			defaults: { adj: 8333 },
			guides: "a pin 0 adj 25000; x1 */ ss a 100000; it */ x1 29289 100000; il +- x1 it 0; ir +- r 0 il; ib +- b 0 it",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "il il ir ib"
		},
		rectangle: { sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc" },
		roundedRectangle: {
			defaults: { adj: 16667 },
			guides: "a pin 0 adj 50000; x1 */ ss a 100000; il */ x1 29289 100000; ir +- r 0 il; ib +- b 0 il",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "il il ir ib"
		},
		roundedCornerRectangle: {
			defaults: { adj: 16667 },
			guides: "a pin 0 adj 50000; dx1 */ ss a 100000; idx */ dx1 29289 100000; ir +- r 0 idx",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "l t ir b"
		},
		topRoundedCornersRectangle: {
			defaults: {
				adj1: 16667,
				adj2: 0
			},
			guides: "a1 pin 0 adj1 50000; a2 pin 0 adj2 50000; tx1 */ ss a1 100000; bx1 */ ss a2 100000; d +- tx1 0 bx1; tdx */ tx1 29289 100000; bdx */ bx1 29289 100000; il ?: d tdx bdx; ir +- r 0 il; ib +- b 0 bdx",
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t",
			text: "il tdx ir ib"
		},
		diagonalRoundedCornersRectangle: {
			defaults: {
				adj1: 16667,
				adj2: 0
			},
			guides: "a1 pin 0 adj1 50000; a2 pin 0 adj2 50000; x1 */ ss a1 100000; a */ ss a2 100000; dx1 */ x1 29289 100000; dx2 */ a 29289 100000; d +- dx1 0 dx2; dx ?: d dx1 dx2; ir +- r 0 dx; ib +- b 0 dx",
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t",
			text: "dx dx ir ib"
		},
		snippedCornerRectangle: {
			defaults: { adj: 16667 },
			guides: "a pin 0 adj 50000; dx1 */ ss a 100000; x1 +- r 0 dx1; it */ dx1 1 2; ir +/ x1 r 2",
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t",
			text: "l it ir b"
		},
		topSnippedCornersRectangle: {
			defaults: {
				adj1: 16667,
				adj2: 0
			},
			guides: "a1 pin 0 adj1 50000; a2 pin 0 adj2 50000; tx1 */ ss a1 100000; bx1 */ ss a2 100000; by1 +- b 0 bx1; d +- tx1 0 bx1; dx ?: d tx1 bx1; il */ dx 1 2; ir +- r 0 il; it */ tx1 1 2; ib +/ by1 b 2",
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t",
			text: "il it ir ib"
		},
		diagonalSnippedCornersRectangle: {
			defaults: {
				adj1: 0,
				adj2: 16667
			},
			guides: "a1 pin 0 adj1 50000; a2 pin 0 adj2 50000; lx1 */ ss a1 100000; rx1 */ ss a2 100000; d +- lx1 0 rx1; dx ?: d lx1 rx1; il */ dx 1 2; ir +- r 0 il; ib +- b 0 il",
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t",
			text: "il il ir ib"
		},
		roundedAndSnippedCornersRectangle: {
			defaults: {
				adj1: 16667,
				adj2: 16667
			},
			guides: "a1 pin 0 adj1 50000; a2 pin 0 adj2 50000; x1 */ ss a1 100000; dx2 */ ss a2 100000; x2 +- r 0 dx2; il */ x1 29289 100000; ir +/ x2 r 2",
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t",
			text: "il il ir b"
		},
		rightArrow: {
			defaults: {
				adj1: 5e4,
				adj2: 5e4
			},
			guides: "maxAdj2 */ 100000 w ss; a1 pin 0 adj1 100000; a2 pin 0 adj2 maxAdj2; dx1 */ ss a2 100000; x1 +- r 0 dx1; dy1 */ h a1 200000; y1 +- vc 0 dy1; y2 +- vc dy1 0; dx2 */ y1 dx1 hd2; x2 +- x1 dx2 0",
			sites: "3cd4 x1 t; cd2 l vc; cd4 x1 b; 0 r vc",
			text: "l y1 x2 y2"
		},
		leftArrow: {
			defaults: {
				adj1: 5e4,
				adj2: 5e4
			},
			guides: "maxAdj2 */ 100000 w ss; a1 pin 0 adj1 100000; a2 pin 0 adj2 maxAdj2; dx2 */ ss a2 100000; x2 +- l dx2 0; dy1 */ h a1 200000; y1 +- vc 0 dy1; y2 +- vc dy1 0; dx1 */ y1 dx2 hd2; x1 +- x2 0 dx1",
			sites: "3cd4 x2 t; cd2 l vc; cd4 x2 b; 0 r vc",
			text: "x1 y1 r y2"
		},
		upArrow: {
			defaults: {
				adj1: 5e4,
				adj2: 5e4
			},
			guides: "maxAdj2 */ 100000 h ss; a1 pin 0 adj1 100000; a2 pin 0 adj2 maxAdj2; dy2 */ ss a2 100000; y2 +- t dy2 0; dx1 */ w a1 200000; x1 +- hc 0 dx1; x2 +- hc dx1 0; dy1 */ x1 dy2 wd2; y1 +- y2 0 dy1",
			sites: "3cd4 hc t; cd2 l y2; cd4 hc b; 0 r y2",
			text: "x1 y1 x2 b"
		},
		downArrow: {
			defaults: {
				adj1: 5e4,
				adj2: 5e4
			},
			guides: "maxAdj2 */ 100000 h ss; a1 pin 0 adj1 100000; a2 pin 0 adj2 maxAdj2; dy1 */ ss a2 100000; y1 +- b 0 dy1; dx1 */ w a1 200000; x1 +- hc 0 dx1; x2 +- hc dx1 0; dy2 */ x1 dy1 wd2; y2 +- y1 dy2 0",
			sites: "3cd4 hc t; cd2 l y1; cd4 hc b; 0 r y1",
			text: "x1 t x2 y2"
		},
		leftRightArrow: {
			defaults: {
				adj1: 5e4,
				adj2: 5e4
			},
			guides: "maxAdj2 */ 50000 w ss; a1 pin 0 adj1 100000; a2 pin 0 adj2 maxAdj2; x2 */ ss a2 100000; x3 +- r 0 x2; dy */ h a1 200000; y1 +- vc 0 dy; y2 +- vc dy 0; dx1 */ y1 x2 hd2; x1 +- x2 0 dx1; x4 +- x3 dx1 0",
			sites: "0 r vc; cd4 x3 b; cd4 x2 b; cd2 l vc; 3cd4 x2 t; 3cd4 x3 t",
			text: "x1 y1 x4 y2"
		},
		upDownArrow: {
			defaults: {
				adj1: 5e4,
				adj2: 5e4
			},
			guides: "maxAdj2 */ 50000 h ss; a1 pin 0 adj1 100000; a2 pin 0 adj2 maxAdj2; y2 */ ss a2 100000; y3 +- b 0 y2; dx1 */ w a1 200000; x1 +- hc 0 dx1; x2 +- hc dx1 0; dy1 */ x1 y2 wd2; y1 +- y2 0 dy1; y4 +- y3 dy1 0",
			sites: "3cd4 hc t; cd2 l y2; cd2 x1 vc; cd2 l y3; cd4 hc b; 0 r y3; 0 x2 vc; 0 r y2",
			text: "x1 y1 x2 y4"
		},
		quadArrow: {
			defaults: {
				adj1: 22500,
				adj2: 22500,
				adj3: 22500
			},
			guides: "a2 pin 0 adj2 50000; maxAdj1 */ a2 2 1; a1 pin 0 adj1 maxAdj1; q1 +- 100000 0 maxAdj1; maxAdj3 */ q1 1 2; a3 pin 0 adj3 maxAdj3; x1 */ ss a3 100000; dx2 */ ss a2 100000; dx3 */ ss a1 200000; y3 +- vc 0 dx3; y4 +- vc dx3 0; il */ dx3 x1 dx2; ir +- r 0 il",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "il y3 ir y4"
		},
		leftRightUpArrow: {
			defaults: {
				adj1: 25e3,
				adj2: 25e3,
				adj3: 25e3
			},
			guides: "a2 pin 0 adj2 50000; maxAdj1 */ a2 2 1; a1 pin 0 adj1 maxAdj1; q1 +- 100000 0 maxAdj1; maxAdj3 */ q1 1 2; a3 pin 0 adj3 maxAdj3; x1 */ ss a3 100000; dx2 */ ss a2 100000; dx3 */ ss a1 200000; y4 +- b 0 dx2; y3 +- y4 0 dx3; y5 +- y4 dx3 0; il */ dx3 x1 dx2; ir +- r 0 il",
			sites: "3cd4 hc t; cd2 l y4; cd4 hc y5; 0 r y4",
			text: "il y3 ir y5"
		},
		bentArrow: {
			defaults: {
				adj1: 25e3,
				adj2: 25e3,
				adj3: 25e3,
				adj4: 43750
			},
			guides: "a2 pin 0 adj2 50000; maxAdj1 */ a2 2 1; a1 pin 0 adj1 maxAdj1; a3 pin 0 adj3 50000; th */ ss a1 100000; aw2 */ ss a2 100000; th2 */ th 1 2; dh2 +- aw2 0 th2; ah */ ss a3 100000; x4 +- r 0 ah; y3 +- dh2 th 0; y4 +- y3 dh2 0",
			sites: "3cd4 x4 t; cd4 x4 y4; cd4 th2 b; 0 r aw2"
		},
		uTurnArrow: {
			defaults: {
				adj1: 25e3,
				adj2: 25e3,
				adj3: 25e3,
				adj4: 43750,
				adj5: 75e3
			},
			guides: "a2 pin 0 adj2 25000; maxAdj1 */ a2 2 1; a1 pin 0 adj1 maxAdj1; q2 */ a1 ss h; q3 +- 100000 0 q2; maxAdj3 */ q3 h ss; a3 pin 0 adj3 maxAdj3; q1 +- a3 a1 0; minAdj5 */ q1 ss h; a5 pin minAdj5 adj5 100000; th */ ss a1 100000; aw2 */ ss a2 100000; th2 */ th 1 2; dh2 +- aw2 0 th2; y5 */ h a5 100000; ah */ ss a3 100000; y4 +- y5 0 ah; x8 +- r 0 aw2; x6 +- x8 0 aw2; x7 +- x6 dh2 0; cx +/ th x7 2",
			sites: "cd4 x6 y4; cd4 x8 y5; 0 r y4; 3cd4 cx t; cd4 th2 b"
		},
		leftUpArrow: {
			defaults: {
				adj1: 25e3,
				adj2: 25e3,
				adj3: 25e3
			},
			guides: "a2 pin 0 adj2 50000; maxAdj1 */ a2 2 1; a1 pin 0 adj1 maxAdj1; maxAdj3 +- 100000 0 maxAdj1; a3 pin 0 adj3 maxAdj3; x1 */ ss a3 100000; dx2 */ ss a2 50000; x2 +- r 0 dx2; y2 +- b 0 dx2; dx4 */ ss a2 100000; x4 +- r 0 dx4; y4 +- b 0 dx4; dx3 */ ss a1 200000; x5 +- x4 dx3 0; y3 +- y4 0 dx3; y5 +- y4 dx3 0; il */ dx3 x1 dx4; cx1 +/ x1 x5 2; cy1 +/ x1 y5 2",
			sites: "3cd4 x4 t; cd2 x2 x1; 3cd4 x1 y2; cd2 l y4; cd4 x1 b; cd4 cx1 y5; 0 x5 cy1; 0 r x1",
			text: "il y3 x4 y5"
		},
		bentUpArrow: {
			defaults: {
				adj1: 25e3,
				adj2: 25e3,
				adj3: 25e3
			},
			guides: "a1 pin 0 adj1 50000; a2 pin 0 adj2 50000; a3 pin 0 adj3 50000; y1 */ ss a3 100000; dx1 */ ss a2 50000; x1 +- r 0 dx1; dx3 */ ss a2 100000; x3 +- r 0 dx3; dx2 */ ss a1 200000; x4 +- x3 dx2 0; dy2 */ ss a1 100000; y2 +- b 0 dy2; x0 */ x4 1 2; y3 +/ y2 b 2; y15 +/ y1 b 2",
			sites: "3cd4 x3 t; cd2 x1 y1; cd2 l y3; cd4 x0 b; 0 x4 y15; 0 r y1",
			text: "l y2 x4 b"
		},
		curvedRightArrow: {
			defaults: {
				adj1: 25e3,
				adj2: 5e4,
				adj3: 25e3
			},
			guides: "maxAdj2 */ 50000 h ss; a2 pin 0 adj2 maxAdj2; a1 pin 0 adj1 a2; th */ ss a1 100000; aw */ ss a2 100000; q1 +/ th aw 4; hR +- hd2 0 q1; q7 */ hR 2 1; q8 */ q7 q7 1; q9 */ th th 1; q10 +- q8 0 q9; q11 sqrt q10; idx */ q11 w q7; maxAdj3 */ 100000 idx ss; a3 pin 0 adj3 maxAdj3; ah */ ss a3 100000; y3 +- hR th 0; q2 */ w w 1; q3 */ ah ah 1; q4 +- q2 0 q3; q5 sqrt q4; dy */ q5 hR w; y5 +- hR dy 0; y7 +- y3 dy 0; q6 +- aw 0 th; dh */ q6 1 2; y4 +- y5 0 dh; y8 +- y7 dh 0; aw2 */ aw 1 2; y6 +- b 0 aw2; x1 +- r 0 ah; iy +/ hR y3 2; q12 */ th 1 2",
			sites: "cd2 l iy; cd4 x1 y8; 0 r y6; 0 x1 y4; 0 r q12"
		},
		curvedLeftArrow: {
			defaults: {
				adj1: 25e3,
				adj2: 5e4,
				adj3: 25e3
			},
			guides: "maxAdj2 */ 50000 h ss; a2 pin 0 adj2 maxAdj2; a1 pin 0 adj1 a2; th */ ss a1 100000; aw */ ss a2 100000; q1 +/ th aw 4; hR +- hd2 0 q1; q7 */ hR 2 1; q8 */ q7 q7 1; q9 */ th th 1; q10 +- q8 0 q9; q11 sqrt q10; idx */ q11 w q7; maxAdj3 */ 100000 idx ss; a3 pin 0 adj3 maxAdj3; ah */ ss a3 100000; y3 +- hR th 0; q2 */ w w 1; q3 */ ah ah 1; q4 +- q2 0 q3; q5 sqrt q4; dy */ q5 hR w; y5 +- hR dy 0; y7 +- y3 dy 0; q6 +- aw 0 th; dh */ q6 1 2; y4 +- y5 0 dh; y8 +- y7 dh 0; aw2 */ aw 1 2; y6 +- b 0 aw2; x1 +- l ah 0; iy +/ hR y3 2; q12 */ th 1 2",
			sites: "cd2 l q12; cd2 x1 y4; cd3 l y6; cd4 x1 y8; 0 r iy"
		},
		curvedUpArrow: {
			defaults: {
				adj1: 25e3,
				adj2: 5e4,
				adj3: 25e3
			},
			guides: "maxAdj2 */ 50000 w ss; a2 pin 0 adj2 maxAdj2; a1 pin 0 adj1 100000; th */ ss a1 100000; aw */ ss a2 100000; q1 +/ th aw 4; wR +- wd2 0 q1; ah */ ss adj3 100000; x3 +- wR th 0; q2 */ h h 1; q3 */ ah ah 1; q4 +- q2 0 q3; q5 sqrt q4; dx */ q5 wR h; x5 +- wR dx 0; x7 +- x3 dx 0; q6 +- aw 0 th; dh */ q6 1 2; x4 +- x5 0 dh; x8 +- x7 dh 0; aw2 */ aw 1 2; x6 +- r 0 aw2; y1 +- t ah 0; ix +/ wR x3 2; q12 */ th 1 2",
			sites: "3cd4 x6 t; 3cd4 x4 y1; 3cd4 q12 t; cd4 ix b; 0 x8 y1"
		},
		curvedDownArrow: {
			defaults: {
				adj1: 25e3,
				adj2: 5e4,
				adj3: 25e3
			},
			guides: "maxAdj2 */ 50000 w ss; a2 pin 0 adj2 maxAdj2; a1 pin 0 adj1 100000; th */ ss a1 100000; aw */ ss a2 100000; q1 +/ th aw 4; wR +- wd2 0 q1; ah */ ss adj3 100000; x3 +- wR th 0; q2 */ h h 1; q3 */ ah ah 1; q4 +- q2 0 q3; q5 sqrt q4; dx */ q5 wR h; x5 +- wR dx 0; x7 +- x3 dx 0; q6 +- aw 0 th; dh */ q6 1 2; x4 +- x5 0 dh; x8 +- x7 dh 0; aw2 */ aw 1 2; x6 +- r 0 aw2; y1 +- b 0 ah; ix +/ wR x3 2; q12 */ th 1 2",
			sites: "3cd4 ix t; cd4 q12 b; cd4 x4 y1; cd4 x6 b; 0 x8 y1"
		},
		stripedRightArrow: {
			defaults: {
				adj1: 5e4,
				adj2: 5e4
			},
			guides: "maxAdj2 */ 84375 w ss; a1 pin 0 adj1 100000; a2 pin 0 adj2 maxAdj2; x4 */ ss 5 32; dx5 */ ss a2 100000; x5 +- r 0 dx5; dy1 */ h a1 200000; y1 +- vc 0 dy1; y2 +- vc dy1 0; dx6 */ dy1 dx5 hd2; x6 +- r 0 dx6",
			sites: "3cd4 x5 t; cd2 l vc; cd4 x5 b; 0 r vc",
			text: "x4 y1 x6 y2"
		},
		notchedRightArrow: {
			defaults: {
				adj1: 5e4,
				adj2: 5e4
			},
			guides: "maxAdj2 */ 100000 w ss; a1 pin 0 adj1 100000; a2 pin 0 adj2 maxAdj2; dx2 */ ss a2 100000; x2 +- r 0 dx2; dy1 */ h a1 200000; y1 +- vc 0 dy1; y2 +- vc dy1 0; x1 */ dy1 dx2 hd2; x3 +- r 0 x1",
			sites: "3cd4 x2 t; cd2 x1 vc; cd4 x2 b; 0 r vc",
			text: "x1 y1 x3 y2"
		},
		pentagonArrow: {
			defaults: { adj: 5e4 },
			guides: "maxAdj */ 100000 w ss; a pin 0 adj maxAdj; dx1 */ ss a 100000; x1 +- r 0 dx1; ir +/ x1 r 2; x2 */ x1 1 2",
			sites: "3cd4 x2 t; cd2 l vc; cd4 x1 b; 0 r vc",
			text: "l t ir b"
		},
		chevron: {
			defaults: { adj: 5e4 },
			guides: "maxAdj */ 100000 w ss; a pin 0 adj maxAdj; x1 */ ss a 100000; x2 +- r 0 x1; x3 */ x2 1 2; dx +- x2 0 x1; il ?: dx x1 l; ir ?: dx x2 r",
			sites: "3cd4 x3 t; cd2 x1 vc; cd4 x3 b; 0 r vc",
			text: "il t ir b"
		},
		rightArrowCallout: {
			defaults: {
				adj1: 25e3,
				adj2: 25e3,
				adj3: 25e3,
				adj4: 64977
			},
			guides: "maxAdj3 */ 100000 w ss; a3 pin 0 adj3 maxAdj3; q2 */ a3 ss w; maxAdj4 +- 100000 0 q2; a4 pin 0 adj4 maxAdj4; x2 */ w a4 100000; x1 */ x2 1 2",
			sites: "3cd4 x1 t; cd2 l vc; cd4 x1 b; 0 r vc",
			text: "l t x2 b"
		},
		downArrowCallout: {
			defaults: {
				adj1: 25e3,
				adj2: 25e3,
				adj3: 25e3,
				adj4: 64977
			},
			guides: "maxAdj3 */ 100000 h ss; a3 pin 0 adj3 maxAdj3; q2 */ a3 ss h; maxAdj4 +- 100000 0 q2; a4 pin 0 adj4 maxAdj4; y2 */ h a4 100000; y1 */ y2 1 2",
			sites: "3cd4 hc t; cd2 l y1; cd4 hc b; 0 r y1",
			text: "l t r y2"
		},
		leftArrowCallout: {
			defaults: {
				adj1: 25e3,
				adj2: 25e3,
				adj3: 25e3,
				adj4: 64977
			},
			guides: "maxAdj3 */ 100000 w ss; a3 pin 0 adj3 maxAdj3; q2 */ a3 ss w; maxAdj4 +- 100000 0 q2; a4 pin 0 adj4 maxAdj4; dx2 */ w a4 100000; x2 +- r 0 dx2; x3 +/ x2 r 2",
			sites: "3cd4 x3 t; cd2 l vc; cd4 x3 b; 0 r vc",
			text: "x2 t r b"
		},
		upArrowCallout: {
			defaults: {
				adj1: 25e3,
				adj2: 25e3,
				adj3: 25e3,
				adj4: 64977
			},
			guides: "maxAdj3 */ 100000 h ss; a3 pin 0 adj3 maxAdj3; q2 */ a3 ss h; maxAdj4 +- 100000 0 q2; a4 pin 0 adj4 maxAdj4; dy2 */ h a4 100000; y2 +- b 0 dy2",
			sites: "3cd4 hc t; cd2 l y2; cd4 hc b; 0 r y2",
			text: "l y2 r b"
		},
		leftRightArrowCallout: {
			defaults: {
				adj1: 25e3,
				adj2: 25e3,
				adj3: 25e3,
				adj4: 48123
			},
			guides: "maxAdj3 */ 50000 w ss; a3 pin 0 adj3 maxAdj3; q2 */ a3 ss wd2; maxAdj4 +- 100000 0 q2; a4 pin 0 adj4 maxAdj4; dx2 */ w a4 200000; x2 +- hc 0 dx2; x3 +- hc dx2 0",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "x2 t x3 b"
		},
		upDownArrowCallout: {
			defaults: {
				adj1: 25e3,
				adj2: 25e3,
				adj3: 25e3,
				adj4: 48123
			},
			guides: "maxAdj3 */ 50000 h ss; a3 pin 0 adj3 maxAdj3; q2 */ a3 ss hd2; maxAdj4 +- 100000 0 q2; a4 pin 0 adj4 maxAdj4; dy2 */ h a4 200000; y2 +- vc 0 dy2; y3 +- vc dy2 0",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "l y2 r y3"
		},
		quadArrowCallout: {
			defaults: {
				adj1: 18515,
				adj2: 18515,
				adj3: 18515,
				adj4: 48123
			},
			guides: "a2 pin 0 adj2 50000; maxAdj1 */ a2 2 1; a1 pin 0 adj1 maxAdj1; maxAdj3 +- 50000 0 a2; a3 pin 0 adj3 maxAdj3; q2 */ a3 2 1; maxAdj4 +- 100000 0 q2; a4 pin a1 adj4 maxAdj4; dx1 */ w a4 200000; dy1 */ h a4 200000; x2 +- hc 0 dx1; x7 +- hc dx1 0; y2 +- vc 0 dy1; y7 +- vc dy1 0",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "x2 y2 x7 y7"
		},
		circularArrow: {
			defaults: {
				adj1: 12500,
				adj2: 1142319,
				adj3: 20457681,
				adj4: 108e5,
				adj5: 12500
			},
			guides: "a5 pin 0 adj5 25000; maxAdj1 */ a5 2 1; a1 pin 0 adj1 maxAdj1; enAng pin 1 adj3 21599999; stAng pin 0 adj4 21599999; th */ ss a1 100000; thh */ ss a5 100000; th2 */ th 1 2; rw1 +- wd2 th2 thh; rh1 +- hd2 th2 thh; rw2 +- rw1 0 th; rh2 +- rh1 0 th; rw3 +- rw2 th2 0; rh3 +- rh2 th2 0; wtH sin rw3 enAng; htH cos rh3 enAng; dxH cat2 rw3 htH wtH; dyH sat2 rh3 htH wtH; xH +- hc dxH 0; yH +- vc dyH 0; rI min rw2 rh2; u1 */ dxH dxH 1; u2 */ dyH dyH 1; u3 */ rI rI 1; u4 +- u1 0 u3; u5 +- u2 0 u3; u6 */ u4 u5 u1; u7 */ u6 1 u2; u8 +- 1 0 u7; u9 sqrt u8; u10 */ u4 1 dxH; u11 */ u10 1 dyH; u12 +/ 1 u9 u11; u13 at2 1 u12; u14 +- u13 21600000 0; u15 ?: u13 u13 u14; u16 +- u15 0 enAng; u17 +- u16 21600000 0; u18 ?: u16 u16 u17; u19 +- u18 0 cd2; u20 +- u18 0 21600000; u21 ?: u19 u20 u18; maxAng abs u21; aAng pin 0 adj2 maxAng; ptAng +- enAng aAng 0; wtA sin rw3 ptAng; htA cos rh3 ptAng; dxA cat2 rw3 htA wtA; dyA sat2 rh3 htA wtA; xA +- hc dxA 0; yA +- vc dyA 0; dxG cos thh ptAng; dyG sin thh ptAng; xG +- xH dxG 0; yG +- yH dyG 0; dxB cos thh ptAng; dyB sin thh ptAng; xB +- xH 0 dxB 0; yB +- yH 0 dyB 0; sx1 +- xB 0 hc; sy1 +- yB 0 vc; sx2 +- xG 0 hc; sy2 +- yG 0 vc; rO min rw1 rh1; x1O */ sx1 rO rw1; y1O */ sy1 rO rh1; x2O */ sx2 rO rw1; y2O */ sy2 rO rh1; dxO +- x2O 0 x1O; dyO +- y2O 0 y1O; dO mod dxO dyO 0; q1 */ x1O y2O 1; q2 */ x2O y1O 1; DO +- q1 0 q2; q3 */ rO rO 1; q4 */ dO dO 1; q5 */ q3 q4 1; q6 */ DO DO 1; q7 +- q5 0 q6; q8 max q7 0; sdelO sqrt q8; ndyO */ dyO -1 1; sdyO ?: ndyO -1 1; q9 */ sdyO dxO 1; q10 */ q9 sdelO 1; q11 */ DO dyO 1; dxF1 +/ q11 q10 q4; q12 +- q11 0 q10; dxF2 */ q12 1 q4; adyO abs dyO; q13 */ adyO sdelO 1; q14 */ DO dxO -1; dyF1 +/ q14 q13 q4; q15 +- q14 0 q13; dyF2 */ q15 1 q4; q16 +- x2O 0 dxF1; q17 +- x2O 0 dxF2; q18 +- y2O 0 dyF1; q19 +- y2O 0 dyF2; q20 mod q16 q18 0; q21 mod q17 q19 0; q22 +- q21 0 q20; dxF ?: q22 dxF1 dxF2; dyF ?: q22 dyF1 dyF2; sdxF */ dxF rw1 rO; sdyF */ dyF rh1 rO; xF +- hc sdxF 0; yF +- vc sdyF 0; x1I */ sx1 rI rw2; y1I */ sy1 rI rh2; x2I */ sx2 rI rw2; y2I */ sy2 rI rh2; dxI +- x2I 0 x1I; dyI +- y2I 0 y1I; dI mod dxI dyI 0; v1 */ x1I y2I 1; v2 */ x2I y1I 1; DI +- v1 0 v2; v3 */ rI rI 1; v4 */ dI dI 1; v5 */ v3 v4 1; v6 */ DI DI 1; v7 +- v5 0 v6; v8 max v7 0; sdelI sqrt v8; v9 */ sdyO dxI 1; v10 */ v9 sdelI 1; v11 */ DI dyI 1; dxC1 +/ v11 v10 v4; v12 +- v11 0 v10; dxC2 */ v12 1 v4; adyI abs dyI; v13 */ adyI sdelI 1; v14 */ DI dxI -1; dyC1 +/ v14 v13 v4; v15 +- v14 0 v13; dyC2 */ v15 1 v4; v16 +- x1I 0 dxC1; v17 +- x1I 0 dxC2; v18 +- y1I 0 dyC1; v19 +- y1I 0 dyC2; v20 mod v16 v18 0; v21 mod v17 v19 0; v22 +- v21 0 v20; dxC ?: v22 dxC1 dxC2; dyC ?: v22 dyC1 dyC2; sdxC */ dxC rw2 rI; sdyC */ dyC rh2 rI; xC +- hc sdxC 0; yC +- vc sdyC 0; p1 +- xF 0 xC; p2 +- yF 0 yC; p3 mod p1 p2 0; p4 */ p3 1 2; p5 +- p4 0 thh; xGp ?: p5 xF xG; yGp ?: p5 yF yG; xBp ?: p5 xC xB; yBp ?: p5 yC yB; wtI sin rw3 stAng; htI cos rh3 stAng; dxI cat2 rw3 htI wtI; dyI sat2 rh3 htI wtI; xI +- hc dxI 0; yI +- vc dyI 0; aI +- stAng 0 cd4; aA +- ptAng cd4 0; aB +- ptAng cd2 0; idx cos rw1 2700000; idy sin rh1 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "aI xI yI; ptAng xGp yGp; aA xA yA; aB xBp yBp",
			text: "il it ir ib"
		},
		leftCircularArrow: {
			defaults: {
				adj1: 12500,
				adj2: -1142319,
				adj3: 1142319,
				adj4: 108e5,
				adj5: 12500
			},
			guides: "a5 pin 0 adj5 25000; maxAdj1 */ a5 2 1; a1 pin 0 adj1 maxAdj1; enAng pin 1 adj3 21599999; stAng pin 0 adj4 21599999; th */ ss a1 100000; thh */ ss a5 100000; th2 */ th 1 2; rw1 +- wd2 th2 thh; rh1 +- hd2 th2 thh; rw2 +- rw1 0 th; rh2 +- rh1 0 th; rw3 +- rw2 th2 0; rh3 +- rh2 th2 0; wtH sin rw3 enAng; htH cos rh3 enAng; dxH cat2 rw3 htH wtH; dyH sat2 rh3 htH wtH; xH +- hc dxH 0; yH +- vc dyH 0; rI min rw2 rh2; u1 */ dxH dxH 1; u2 */ dyH dyH 1; u3 */ rI rI 1; u4 +- u1 0 u3; u5 +- u2 0 u3; u6 */ u4 u5 u1; u7 */ u6 1 u2; u8 +- 1 0 u7; u9 sqrt u8; u10 */ u4 1 dxH; u11 */ u10 1 dyH; u12 +/ 1 u9 u11; u13 at2 1 u12; u14 +- u13 21600000 0; u15 ?: u13 u13 u14; u16 +- u15 0 enAng; u17 +- u16 21600000 0; u18 ?: u16 u16 u17; u19 +- u18 0 cd2; u20 +- u18 0 21600000; u21 ?: u19 u20 u18; u22 abs u21; minAng */ u22 -1 1; u23 abs adj2; a2 */ u23 -1 1; aAng pin minAng a2 0; ptAng +- enAng aAng 0; wtA sin rw3 ptAng; htA cos rh3 ptAng; dxA cat2 rw3 htA wtA; dyA sat2 rh3 htA wtA; xA +- hc dxA 0; yA +- vc dyA 0; dxG cos thh ptAng; dyG sin thh ptAng; xG +- xH dxG 0; yG +- yH dyG 0; dxB cos thh ptAng; dyB sin thh ptAng; xB +- xH 0 dxB 0; yB +- yH 0 dyB 0; sx1 +- xB 0 hc; sy1 +- yB 0 vc; sx2 +- xG 0 hc; sy2 +- yG 0 vc; rO min rw1 rh1; x1O */ sx1 rO rw1; y1O */ sy1 rO rh1; x2O */ sx2 rO rw1; y2O */ sy2 rO rh1; dxO +- x2O 0 x1O; dyO +- y2O 0 y1O; dO mod dxO dyO 0; q1 */ x1O y2O 1; q2 */ x2O y1O 1; DO +- q1 0 q2; q3 */ rO rO 1; q4 */ dO dO 1; q5 */ q3 q4 1; q6 */ DO DO 1; q7 +- q5 0 q6; q8 max q7 0; sdelO sqrt q8; ndyO */ dyO -1 1; sdyO ?: ndyO -1 1; q9 */ sdyO dxO 1; q10 */ q9 sdelO 1; q11 */ DO dyO 1; dxF1 +/ q11 q10 q4; q12 +- q11 0 q10; dxF2 */ q12 1 q4; adyO abs dyO; q13 */ adyO sdelO 1; q14 */ DO dxO -1; dyF1 +/ q14 q13 q4; q15 +- q14 0 q13; dyF2 */ q15 1 q4; q16 +- x2O 0 dxF1; q17 +- x2O 0 dxF2; q18 +- y2O 0 dyF1; q19 +- y2O 0 dyF2; q20 mod q16 q18 0; q21 mod q17 q19 0; q22 +- q21 0 q20; dxF ?: q22 dxF1 dxF2; dyF ?: q22 dyF1 dyF2; sdxF */ dxF rw1 rO; sdyF */ dyF rh1 rO; xF +- hc sdxF 0; yF +- vc sdyF 0; x1I */ sx1 rI rw2; y1I */ sy1 rI rh2; x2I */ sx2 rI rw2; y2I */ sy2 rI rh2; dxI +- x2I 0 x1I; dyI +- y2I 0 y1I; dI mod dxI dyI 0; v1 */ x1I y2I 1; v2 */ x2I y1I 1; DI +- v1 0 v2; v3 */ rI rI 1; v4 */ dI dI 1; v5 */ v3 v4 1; v6 */ DI DI 1; v7 +- v5 0 v6; v8 max v7 0; sdelI sqrt v8; v9 */ sdyO dxI 1; v10 */ v9 sdelI 1; v11 */ DI dyI 1; dxC1 +/ v11 v10 v4; v12 +- v11 0 v10; dxC2 */ v12 1 v4; adyI abs dyI; v13 */ adyI sdelI 1; v14 */ DI dxI -1; dyC1 +/ v14 v13 v4; v15 +- v14 0 v13; dyC2 */ v15 1 v4; v16 +- x1I 0 dxC1; v17 +- x1I 0 dxC2; v18 +- y1I 0 dyC1; v19 +- y1I 0 dyC2; v20 mod v16 v18 0; v21 mod v17 v19 0; v22 +- v21 0 v20; dxC ?: v22 dxC1 dxC2; dyC ?: v22 dyC1 dyC2; sdxC */ dxC rw2 rI; sdyC */ dyC rh2 rI; xC +- hc sdxC 0; yC +- vc sdyC 0; p1 +- xF 0 xC; p2 +- yF 0 yC; p3 mod p1 p2 0; p4 */ p3 1 2; p5 +- p4 0 thh; xGp ?: p5 xF xG; yGp ?: p5 yF yG; xBp ?: p5 xC xB; yBp ?: p5 yC yB; wtI sin rw3 stAng; htI cos rh3 stAng; dxI cat2 rw3 htI wtI; dyI sat2 rh3 htI wtI; xI +- hc dxI 0; yI +- vc dyI 0; aI +- stAng cd4 0; aA +- ptAng 0 cd4; aB +- ptAng cd2 0; idx cos rw1 2700000; idy sin rh1 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "aI xI yI; ptAng xGp yGp; aA xA yA; aB xBp yBp",
			text: "il it ir ib"
		},
		leftRightCircularArrow: {
			defaults: {
				adj1: 12500,
				adj2: 1142319,
				adj3: 20457681,
				adj4: 11942319,
				adj5: 12500
			},
			guides: "a5 pin 0 adj5 25000; maxAdj1 */ a5 2 1; a1 pin 0 adj1 maxAdj1; enAng pin 1 adj3 21599999; stAng pin 0 adj4 21599999; th */ ss a1 100000; thh */ ss a5 100000; th2 */ th 1 2; rw1 +- wd2 th2 thh; rh1 +- hd2 th2 thh; rw2 +- rw1 0 th; rh2 +- rh1 0 th; rw3 +- rw2 th2 0; rh3 +- rh2 th2 0; wtH sin rw3 enAng; htH cos rh3 enAng; dxH cat2 rw3 htH wtH; dyH sat2 rh3 htH wtH; xH +- hc dxH 0; yH +- vc dyH 0; rI min rw2 rh2; u1 */ dxH dxH 1; u2 */ dyH dyH 1; u3 */ rI rI 1; u4 +- u1 0 u3; u5 +- u2 0 u3; u6 */ u4 u5 u1; u7 */ u6 1 u2; u8 +- 1 0 u7; u9 sqrt u8; u10 */ u4 1 dxH; u11 */ u10 1 dyH; u12 +/ 1 u9 u11; u13 at2 1 u12; u14 +- u13 21600000 0; u15 ?: u13 u13 u14; u16 +- u15 0 enAng; u17 +- u16 21600000 0; u18 ?: u16 u16 u17; u19 +- u18 0 cd2; u20 +- u18 0 21600000; u21 ?: u19 u20 u18; maxAng abs u21; aAng pin 0 adj2 maxAng; ptAng +- enAng aAng 0; wtA sin rw3 ptAng; htA cos rh3 ptAng; dxA cat2 rw3 htA wtA; dyA sat2 rh3 htA wtA; xA +- hc dxA 0; yA +- vc dyA 0; dxG cos thh ptAng; dyG sin thh ptAng; xG +- xH dxG 0; yG +- yH dyG 0; dxB cos thh ptAng; dyB sin thh ptAng; xB +- xH 0 dxB 0; yB +- yH 0 dyB 0; sx1 +- xB 0 hc; sy1 +- yB 0 vc; sx2 +- xG 0 hc; sy2 +- yG 0 vc; rO min rw1 rh1; x1O */ sx1 rO rw1; y1O */ sy1 rO rh1; x2O */ sx2 rO rw1; y2O */ sy2 rO rh1; dxO +- x2O 0 x1O; dyO +- y2O 0 y1O; dO mod dxO dyO 0; q1 */ x1O y2O 1; q2 */ x2O y1O 1; DO +- q1 0 q2; q3 */ rO rO 1; q4 */ dO dO 1; q5 */ q3 q4 1; q6 */ DO DO 1; q7 +- q5 0 q6; q8 max q7 0; sdelO sqrt q8; ndyO */ dyO -1 1; sdyO ?: ndyO -1 1; q9 */ sdyO dxO 1; q10 */ q9 sdelO 1; q11 */ DO dyO 1; dxF1 +/ q11 q10 q4; q12 +- q11 0 q10; dxF2 */ q12 1 q4; adyO abs dyO; q13 */ adyO sdelO 1; q14 */ DO dxO -1; dyF1 +/ q14 q13 q4; q15 +- q14 0 q13; dyF2 */ q15 1 q4; q16 +- x2O 0 dxF1; q17 +- x2O 0 dxF2; q18 +- y2O 0 dyF1; q19 +- y2O 0 dyF2; q20 mod q16 q18 0; q21 mod q17 q19 0; q22 +- q21 0 q20; dxF ?: q22 dxF1 dxF2; dyF ?: q22 dyF1 dyF2; sdxF */ dxF rw1 rO; sdyF */ dyF rh1 rO; xF +- hc sdxF 0; yF +- vc sdyF 0; x1I */ sx1 rI rw2; y1I */ sy1 rI rh2; x2I */ sx2 rI rw2; y2I */ sy2 rI rh2; dxI +- x2I 0 x1I; dyI +- y2I 0 y1I; dI mod dxI dyI 0; v1 */ x1I y2I 1; v2 */ x2I y1I 1; DI +- v1 0 v2; v3 */ rI rI 1; v4 */ dI dI 1; v5 */ v3 v4 1; v6 */ DI DI 1; v7 +- v5 0 v6; v8 max v7 0; sdelI sqrt v8; v9 */ sdyO dxI 1; v10 */ v9 sdelI 1; v11 */ DI dyI 1; dxC1 +/ v11 v10 v4; v12 +- v11 0 v10; dxC2 */ v12 1 v4; adyI abs dyI; v13 */ adyI sdelI 1; v14 */ DI dxI -1; dyC1 +/ v14 v13 v4; v15 +- v14 0 v13; dyC2 */ v15 1 v4; v16 +- x1I 0 dxC1; v17 +- x1I 0 dxC2; v18 +- y1I 0 dyC1; v19 +- y1I 0 dyC2; v20 mod v16 v18 0; v21 mod v17 v19 0; v22 +- v21 0 v20; dxC ?: v22 dxC1 dxC2; dyC ?: v22 dyC1 dyC2; sdxC */ dxC rw2 rI; sdyC */ dyC rh2 rI; xC +- hc sdxC 0; yC +- vc sdyC 0; wtI sin rw3 stAng; htI cos rh3 stAng; dxI cat2 rw3 htI wtI; dyI sat2 rh3 htI wtI; xI +- hc dxI 0; yI +- vc dyI 0; lptAng +- stAng 0 aAng; wtL sin rw3 lptAng; htL cos rh3 lptAng; dxL cat2 rw3 htL wtL; dyL sat2 rh3 htL wtL; xL +- hc dxL 0; yL +- vc dyL 0; dxK cos thh lptAng; dyK sin thh lptAng; xK +- xI dxK 0; yK +- yI dyK 0; dxJ cos thh lptAng; dyJ sin thh lptAng; xJ +- xI 0 dxJ 0; yJ +- yI 0 dyJ 0; p1 +- xF 0 xC; p2 +- yF 0 yC; p3 mod p1 p2 0; p4 */ p3 1 2; p5 +- p4 0 thh; xGp ?: p5 xF xG; yGp ?: p5 yF yG; xBp ?: p5 xC xB; yBp ?: p5 yC yB; en0 at2 sdxF sdyF; en1 +- en0 21600000 0; en2 ?: en0 en0 en1; od0 +- en2 0 enAng; od1 +- od0 21600000 0; od2 ?: od0 od0 od1; st0 +- stAng 0 od2; st1 +- st0 21600000 0; st2 ?: st0 st0 st1; ist0 at2 sdxC sdyC; ist1 +- ist0 21600000 0; istAng ?: ist0 ist0 ist1; id0 +- istAng 0 enAng; id1 +- id0 0 21600000; id2 ?: id0 id1 id0; ien0 +- stAng 0 id2; ien1 +- ien0 0 21600000; ien2 ?: ien1 ien1 ien0; wtE sin rw1 st2; htE cos rh1 st2; dxE cat2 rw1 htE wtE; dyE sat2 rh1 htE wtE; xE +- hc dxE 0; yE +- vc dyE 0; wtD sin rw2 ien2; htD cos rh2 ien2; dxD cat2 rw2 htD wtD; dyD sat2 rh2 htD wtD; xD +- hc dxD 0; yD +- vc dyD 0; xKp ?: p5 xE xK; yKp ?: p5 yE yK; xJp ?: p5 xD xJ; yJp ?: p5 yD yJ; aL +- lptAng 0 cd4; aA +- ptAng cd4 0; aB +- ptAng cd2 0; aJ +- lptAng cd2 0; idx cos rw1 2700000; idy sin rh1 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "aL xL yL; lptAng xKp yKp; ptAng xGp yGp; aA xA yA; aB xBp yBp; aJ xJp yJp",
			text: "il it ir ib"
		},
		swooshArrow: {
			defaults: {
				adj1: 25e3,
				adj2: 16667
			},
			guides: "a1 pin 1 adj1 75000; maxAdj2 */ 70000 w ss; a2 pin 0 adj2 maxAdj2; ad1 */ h a1 100000; ad2 */ ss a2 100000; xB +- r 0 ad2; yB +- t ssd8 0; alfa */ cd4 1 14; dx0 tan ssd8 alfa; xC +- xB 0 dx0; dx1 tan ad1 alfa; yF +- yB ad1 0; xF +- xB dx1 0; xE +- xF dx0 0; yE +- yF ssd8 0; dy2 +- yE 0 t; dy22 */ dy2 1 2; dy3 */ h 1 20; yD +- t dy22 dy3",
			sites: "cd4 l b; 3cd4 xC t; 0 r yD; cd4 xE yE"
		},
		mathPlus: {
			defaults: { adj1: 23520 },
			guides: "a1 pin 0 adj1 73490; dx1 */ w 73490 200000; dy1 */ h 73490 200000; dx2 */ ss a1 200000; x1 +- hc 0 dx1; x4 +- hc dx1 0; y1 +- vc 0 dy1; y2 +- vc 0 dx2; y3 +- vc dx2 0; y4 +- vc dy1 0",
			sites: "0 x4 vc; cd4 hc y4; cd2 x1 vc; 3cd4 hc y1",
			text: "x1 y2 x4 y3"
		},
		mathMinus: {
			defaults: { adj1: 23520 },
			guides: "a1 pin 0 adj1 100000; dy1 */ h a1 200000; dx1 */ w 73490 200000; y1 +- vc 0 dy1; y2 +- vc dy1 0; x1 +- hc 0 dx1; x2 +- hc dx1 0",
			sites: "0 x2 vc; cd4 hc y2; cd2 x1 vc; 3cd4 hc y1",
			text: "x1 y1 x2 y2"
		},
		mathMultiply: {
			defaults: { adj1: 23520 },
			guides: "a1 pin 0 adj1 51965; th */ ss a1 100000; a at2 w h; sa sin 1 a; ca cos 1 a; dl mod w h 0; rw */ dl 51965 100000; lM +- dl 0 rw; xM */ ca lM 2; yM */ sa lM 2; dxAM */ sa th 2; dyAM */ ca th 2; xA +- xM 0 dxAM; yB +- yM 0 dyAM; xE +- r 0 xA; yH +- b 0 yB; xC2 +- r 0 xM; yC3 +- b 0 yM",
			sites: "cd2 xM yM; 3cd4 xC2 yM; 0 xC2 yC3; cd4 xM yC3",
			text: "xA yB xE yH"
		},
		mathDivide: {
			defaults: {
				adj1: 23520,
				adj2: 5880,
				adj3: 11760
			},
			guides: "a1 pin 1000 adj1 36745; ma1 +- 0 0 a1; ma3h +/ 73490 ma1 4; ma3w */ 36745 w h; maxAdj3 min ma3h ma3w; a3 pin 1000 adj3 maxAdj3; m4a3 */ -4 a3 1; maxAdj2 +- 73490 m4a3 a1; a2 pin 0 adj2 maxAdj2; dy1 */ h a1 200000; yg */ h a2 100000; rad */ h a3 100000; dx1 */ w 73490 200000; y3 +- vc 0 dy1; y4 +- vc dy1 0; a +- yg rad 0; y2 +- y3 0 a; y1 +- y2 0 rad; y5 +- b 0 y1; x1 +- hc 0 dx1; x3 +- hc dx1 0",
			sites: "0 x3 vc; cd4 hc y5; cd2 x1 vc; 3cd4 hc y1",
			text: "x1 y3 x3 y4"
		},
		mathEqual: {
			defaults: {
				adj1: 23520,
				adj2: 11760
			},
			guides: "a1 pin 0 adj1 36745; 2a1 */ a1 2 1; mAdj2 +- 100000 0 2a1; a2 pin 0 adj2 mAdj2; dy1 */ h a1 100000; dy2 */ h a2 200000; dx1 */ w 73490 200000; y2 +- vc 0 dy2; y3 +- vc dy2 0; y1 +- y2 0 dy1; y4 +- y3 dy1 0; x1 +- hc 0 dx1; x2 +- hc dx1 0; yC1 +/ y1 y2 2; yC2 +/ y3 y4 2",
			sites: "0 x2 yC1; 0 x2 yC2; cd4 hc y4; cd2 x1 yC1; cd2 x1 yC2; 3cd4 hc y1",
			text: "x1 y1 x2 y4"
		},
		mathNotEqual: {
			defaults: {
				adj1: 23520,
				adj2: 66e5,
				adj3: 11760
			},
			guides: "a1 pin 0 adj1 50000; crAng pin 4200000 adj2 6600000; 2a1 */ a1 2 1; maxAdj3 +- 100000 0 2a1; a3 pin 0 adj3 maxAdj3; dy1 */ h a1 100000; dy2 */ h a3 200000; dx1 */ w 73490 200000; x1 +- hc 0 dx1; x8 +- hc dx1 0; y2 +- vc 0 dy2; y3 +- vc dy2 0; y1 +- y2 0 dy1; y4 +- y3 dy1 0; cadj2 +- crAng 0 cd4; xadj2 tan hd2 cadj2; len mod xadj2 hd2 0; bhw */ len dy1 hd2; bhw2 */ bhw 1 2; x7 +- hc xadj2 bhw2; rx7 +- x7 bhw 0; dx7 */ dy1 hd2 len; rxt +- x7 dx7 0; lxt +- rx7 0 dx7; rx ?: cadj2 rxt rx7; lx ?: cadj2 x7 lxt; dy3 */ dy1 xadj2 len; dy4 +- 0 0 dy3; ry ?: cadj2 dy3 t; ly ?: cadj2 t dy4; dlx +- w 0 rx; drx +- w 0 lx; dly +- h 0 ry; dry +- h 0 ly; xC1 +/ rx lx 2; xC2 +/ drx dlx 2; yC1 +/ ry ly 2; yC2 +/ y1 y2 2; yC3 +/ y3 y4 2; yC4 +/ dry dly 2",
			sites: "0 x8 yC2; 0 x8 yC3; cd4 xC2 yC4; cd2 x1 yC2; cd2 x1 yC3; 3cd4 xC1 yC1",
			text: "x1 y1 x8 y4"
		},
		flowChartProcess: { sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc" },
		flowChartAlternateProcess: {
			guides: "il */ ssd6 29289 100000; ir +- r 0 il; ib +- b 0 il",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "il il ir ib"
		},
		flowChartDecision: {
			guides: "ir */ w 3 4; ib */ h 3 4",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "wd4 hd4 ir ib"
		},
		flowChartInputOutput: {
			guides: "x3 */ w 2 5; x4 */ w 3 5; x5 */ w 4 5; x6 */ w 9 10",
			sites: "3cd4 x4 t; 3cd4 hc t; cd2 wd10 vc; cd4 x3 b; cd4 hc b; 0 x6 vc",
			text: "wd5 t x5 b"
		},
		flowChartPredefinedProcess: {
			guides: "x2 */ w 7 8",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "wd8 t x2 b"
		},
		flowChartInternalStorage: {
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "wd8 hd8 r b"
		},
		flowChartDocument: {
			guides: "y1 */ h 17322 21600; y2 */ h 20172 21600",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc y2; 0 r vc",
			text: "l t r y1"
		},
		flowChartMultidocument: {
			guides: "y2 */ h 3675 21600; y8 */ h 20782 21600; x3 */ w 9298 21600; x4 */ w 12286 21600; x5 */ w 18595 21600",
			sites: "3cd4 x4 t; cd2 l vc; cd4 x3 y8; 0 r vc",
			text: "l y2 x5 y8"
		},
		flowChartTerminator: {
			guides: "il */ w 1018 21600; ir */ w 20582 21600; it */ h 3163 21600; ib */ h 18437 21600",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "il it ir ib"
		},
		flowChartPreparation: {
			guides: "x2 */ w 4 5",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "wd5 t x2 b"
		},
		flowChartManualInput: {
			sites: "3cd4 hc hd10; cd2 l vc; cd4 hc b; 0 r vc",
			text: "l hd5 r b"
		},
		flowChartManualOperation: {
			guides: "x3 */ w 4 5; x4 */ w 9 10",
			sites: "3cd4 hc t; cd2 wd10 vc; cd4 hc b; 0 x4 vc",
			text: "wd5 t x3 b"
		},
		flowChartConnector: {
			guides: "idx cos wd2 2700000; idy sin hd2 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "3cd4 hc t; 3cd4 il it; cd2 l vc; cd4 il ib; cd4 hc b; cd4 ir ib; 0 r vc; 3cd4 ir it",
			text: "il it ir ib"
		},
		flowChartOffpageConnector: {
			guides: "y1 */ h 4 5",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "l t r y1"
		},
		flowChartPunchedCard: {
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "l hd5 r b"
		},
		flowChartPunchedTape: {
			guides: "y2 */ h 9 10; ib */ h 4 5",
			sites: "3cd4 hc hd10; cd2 l vc; cd4 hc y2; 0 r vc",
			text: "l hd5 r ib"
		},
		flowChartSummingJunction: {
			guides: "idx cos wd2 2700000; idy sin hd2 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "3cd4 hc t; 3cd4 il it; cd2 l vc; cd4 il ib; cd4 hc b; cd4 ir ib; 0 r vc; 3cd4 ir it",
			text: "il it ir ib"
		},
		flowChartOr: {
			guides: "idx cos wd2 2700000; idy sin hd2 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "3cd4 hc t; 3cd4 il it; cd2 l vc; cd4 il ib; cd4 hc b; cd4 ir ib; 0 r vc; 3cd4 ir it",
			text: "il it ir ib"
		},
		flowChartCollate: {
			guides: "ir */ w 3 4; ib */ h 3 4",
			sites: "3cd4 hc t; 3cd4 hc vc; cd4 hc b",
			text: "wd4 hd4 ir ib"
		},
		flowChartSort: {
			guides: "ir */ w 3 4; ib */ h 3 4",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "wd4 hd4 ir ib"
		},
		flowChartExtract: {
			guides: "x2 */ w 3 4",
			sites: "3cd4 hc t; cd2 wd4 vc; cd4 hc b; 0 x2 vc",
			text: "wd4 vc x2 b"
		},
		flowChartMerge: {
			guides: "x2 */ w 3 4",
			sites: "3cd4 hc t; cd2 wd4 vc; cd4 hc b; 0 x2 vc",
			text: "wd4 t x2 vc"
		},
		flowChartOfflineStorage: {
			guides: "x4 */ w 3 4",
			sites: "0 x4 vc; cd4 hc b; cd2 wd4 vc; 3cd4 hc t",
			text: "wd4 t x4 vc"
		},
		flowChartOnlineStorage: {
			guides: "x2 */ w 5 6",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 x2 vc",
			text: "wd6 t x2 b"
		},
		flowChartDelay: {
			guides: "idx cos wd2 2700000; idy sin hd2 2700000; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "l it ir ib"
		},
		flowChartMagneticTape: {
			guides: "idx cos wd2 2700000; idy sin hd2 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "il it ir ib"
		},
		flowChartMagneticDisk: {
			guides: "y3 */ h 5 6",
			sites: "3cd4 hc hd3; 3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "l hd3 r y3"
		},
		flowChartMagneticDrum: {
			guides: "x2 */ w 2 3",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 x2 vc; 0 r vc",
			text: "wd6 t x2 b"
		},
		flowChartDisplay: {
			guides: "x2 */ w 5 6",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "wd6 t x2 b"
		},
		explosion12: {
			guides: "x5 */ w 4627 21600; x12 */ w 8485 21600; x21 */ w 16702 21600; x24 */ w 14522 21600; y3 */ h 6320 21600; y6 */ h 8615 21600; y9 */ h 13937 21600; y18 */ h 13290 21600",
			sites: "3cd4 x24 t; cd2 l y6; cd4 x12 b; 0 r y18",
			text: "x5 y3 x21 y9"
		},
		explosion14: {
			guides: "x2 */ w 9722 21600; x5 */ w 5372 21600; x16 */ w 11612 21600; x19 */ w 14640 21600; y2 */ h 1887 21600; y3 */ h 6382 21600; y8 */ h 12877 21600; y16 */ h 18842 21600; y17 */ h 15935 21600; y24 */ h 6645 21600",
			sites: "3cd4 x2 y2; cd2 l y8; cd4 x16 y16; 0 r y24",
			text: "x5 y3 x19 y17"
		},
		star4: {
			defaults: { adj: 12500 },
			guides: "a pin 0 adj 50000; iwd2 */ wd2 a 50000; ihd2 */ hd2 a 50000; sdx cos iwd2 2700000; sdy sin ihd2 2700000; sx1 +- hc 0 sdx; sx2 +- hc sdx 0; sy1 +- vc 0 sdy; sy2 +- vc sdy 0",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "sx1 sy1 sx2 sy2"
		},
		star5: {
			defaults: {
				adj: 19098,
				hf: 105146,
				vf: 110557
			},
			guides: "a pin 0 adj 50000; swd2 */ wd2 hf 100000; shd2 */ hd2 vf 100000; svc */ vc vf 100000; dx1 cos swd2 1080000; dx2 cos swd2 18360000; dy1 sin shd2 1080000; dy2 sin shd2 18360000; x1 +- hc 0 dx1; x2 +- hc 0 dx2; x3 +- hc dx2 0; x4 +- hc dx1 0; y1 +- svc 0 dy1; y2 +- svc 0 dy2; iwd2 */ swd2 a 50000; ihd2 */ shd2 a 50000; sdx1 cos iwd2 20520000; sdy1 sin ihd2 3240000; sx1 +- hc 0 sdx1; sx4 +- hc sdx1 0; sy1 +- svc 0 sdy1; sy3 +- svc ihd2 0",
			sites: "3cd4 hc t; cd2 x1 y1; cd4 x2 y2; cd4 x3 y2; 0 x4 y1",
			text: "sx1 sy1 sx4 sy3"
		},
		star6: {
			defaults: {
				adj: 28868,
				hf: 115470
			},
			guides: "a pin 0 adj 50000; swd2 */ wd2 hf 100000; dx1 cos swd2 1800000; x1 +- hc 0 dx1; x2 +- hc dx1 0; y2 +- vc hd4 0; iwd2 */ swd2 a 50000; ihd2 */ hd2 a 50000; sx1 +- hc 0 iwd2; sx4 +- hc iwd2 0; sdy1 sin ihd2 3600000; sy1 +- vc 0 sdy1; sy2 +- vc sdy1 0",
			sites: "0 x2 hd4; 0 x2 y2; cd4 hc b; cd2 x1 y2; cd2 x1 hd4; 3cd4 hc t",
			text: "sx1 sy1 sx4 sy2"
		},
		star7: {
			defaults: {
				adj: 34601,
				hf: 102572,
				vf: 105210
			},
			guides: "a pin 0 adj 50000; swd2 */ wd2 hf 100000; shd2 */ hd2 vf 100000; svc */ vc vf 100000; dx1 */ swd2 97493 100000; dx2 */ swd2 78183 100000; dx3 */ swd2 43388 100000; dy1 */ shd2 62349 100000; dy2 */ shd2 22252 100000; dy3 */ shd2 90097 100000; x1 +- hc 0 dx1; x2 +- hc 0 dx2; x3 +- hc 0 dx3; x4 +- hc dx3 0; x5 +- hc dx2 0; x6 +- hc dx1 0; y1 +- svc 0 dy1; y2 +- svc dy2 0; y3 +- svc dy3 0; iwd2 */ swd2 a 50000; ihd2 */ shd2 a 50000; sdx2 */ iwd2 78183 100000; sx2 +- hc 0 sdx2; sx5 +- hc sdx2 0; sdy1 */ ihd2 90097 100000; sdy3 */ ihd2 62349 100000; sy1 +- svc 0 sdy1; sy3 +- svc sdy3 0",
			sites: "0 x5 y1; 0 x6 y2; cd4 x4 y3; cd4 x3 y3; cd2 x1 y2; cd2 x2 y1; 3cd4 hc t",
			text: "sx2 sy1 sx5 sy3"
		},
		star8: {
			defaults: { adj: 37500 },
			guides: "a pin 0 adj 50000; dx1 cos wd2 2700000; x1 +- hc 0 dx1; x2 +- hc dx1 0; dy1 sin hd2 2700000; y1 +- vc 0 dy1; y2 +- vc dy1 0; iwd2 */ wd2 a 50000; ihd2 */ hd2 a 50000; sdx1 */ iwd2 92388 100000; sdy1 */ ihd2 92388 100000; sx1 +- hc 0 sdx1; sx4 +- hc sdx1 0; sy1 +- vc 0 sdy1; sy4 +- vc sdy1 0",
			sites: "0 r vc; cd4 x2 y2; cd4 hc b; cd4 x1 y2; cd2 l vc; 3cd4 x1 y1; 3cd4 hc t; 3cd4 x2 y1",
			text: "sx1 sy1 sx4 sy4"
		},
		star10: {
			defaults: {
				adj: 42533,
				hf: 105146
			},
			guides: "a pin 0 adj 50000; swd2 */ wd2 hf 100000; dx1 */ swd2 95106 100000; dx2 */ swd2 58779 100000; x1 +- hc 0 dx1; x2 +- hc 0 dx2; x3 +- hc dx2 0; x4 +- hc dx1 0; dy1 */ hd2 80902 100000; dy2 */ hd2 30902 100000; y1 +- vc 0 dy1; y2 +- vc 0 dy2; y3 +- vc dy2 0; y4 +- vc dy1 0; iwd2 */ swd2 a 50000; ihd2 */ hd2 a 50000; sdx1 */ iwd2 80902 100000; sdy2 */ ihd2 58779 100000; sx2 +- hc 0 sdx1; sx5 +- hc sdx1 0; sy2 +- vc 0 sdy2; sy3 +- vc sdy2 0",
			sites: "0 x4 y2; 0 x4 y3; cd4 x3 y4; cd4 hc b; cd4 x2 y4; cd2 x1 y3; cd2 x1 y2; 3cd4 x2 y1; 3cd4 hc t; 3cd4 x3 y1",
			text: "sx2 sy2 sx5 sy3"
		},
		star12: {
			defaults: { adj: 37500 },
			guides: "a pin 0 adj 50000; dx1 cos wd2 1800000; dy1 sin hd2 3600000; x1 +- hc 0 dx1; x3 */ w 3 4; x4 +- hc dx1 0; y1 +- vc 0 dy1; y3 */ h 3 4; y4 +- vc dy1 0; iwd2 */ wd2 a 50000; ihd2 */ hd2 a 50000; sdx2 cos iwd2 2700000; sdy2 sin ihd2 2700000; sx2 +- hc 0 sdx2; sx5 +- hc sdx2 0; sy2 +- vc 0 sdy2; sy5 +- vc sdy2 0",
			sites: "0 x4 hd4; 0 r vc; 0 x4 y3; cd4 x3 y4; cd4 hc b; cd4 wd4 y4; cd2 x1 y3; cd2 l vc; cd2 x1 hd4; 3cd4 wd4 y1; 3cd4 hc t; 3cd4 x3 y1",
			text: "sx2 sy2 sx5 sy5"
		},
		star16: {
			defaults: { adj: 37500 },
			guides: "a pin 0 adj 50000; dx1 */ wd2 92388 100000; dx2 */ wd2 70711 100000; dx3 */ wd2 38268 100000; dy1 */ hd2 92388 100000; dy2 */ hd2 70711 100000; dy3 */ hd2 38268 100000; x1 +- hc 0 dx1; x2 +- hc 0 dx2; x3 +- hc 0 dx3; x4 +- hc dx3 0; x5 +- hc dx2 0; x6 +- hc dx1 0; y1 +- vc 0 dy1; y2 +- vc 0 dy2; y3 +- vc 0 dy3; y4 +- vc dy3 0; y5 +- vc dy2 0; y6 +- vc dy1 0; iwd2 */ wd2 a 50000; ihd2 */ hd2 a 50000; idx cos iwd2 2700000; idy sin ihd2 2700000; il +- hc 0 idx; it +- vc 0 idy; ir +- hc idx 0; ib +- vc idy 0",
			sites: "0 x5 y2; 0 x6 y3; 0 r vc; 0 x6 y4; 0 x5 y5; cd4 x4 y6; cd4 hc b; cd4 x3 y6; cd2 x2 y5; cd2 x1 y4; cd2 l vc; cd2 x1 y3; cd2 x2 y2; 3cd4 x3 y1; 3cd4 hc t; 3cd4 x4 y1",
			text: "il it ir ib"
		},
		star24: {
			defaults: { adj: 37500 },
			guides: "a pin 0 adj 50000; iwd2 */ wd2 a 50000; ihd2 */ hd2 a 50000; idx cos iwd2 2700000; idy sin ihd2 2700000; il +- hc 0 idx; it +- vc 0 idy; ir +- hc idx 0; ib +- vc idy 0",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "il it ir ib"
		},
		star32: {
			defaults: { adj: 37500 },
			guides: "a pin 0 adj 50000; iwd2 */ wd2 a 50000; ihd2 */ hd2 a 50000; idx cos iwd2 2700000; idy sin ihd2 2700000; il +- hc 0 idx; it +- vc 0 idy; ir +- hc idx 0; ib +- vc idy 0",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc",
			text: "il it ir ib"
		},
		ribbonUp: {
			defaults: {
				adj1: 16667,
				adj2: 5e4
			},
			guides: "a1 pin 0 adj1 33333; a2 pin 25000 adj2 75000; x10 +- r 0 wd8; dx2 */ w a2 200000; x2 +- hc 0 dx2; x9 +- hc dx2 0; dy2 */ h a1 100000; y2 +- b 0 dy2; y4 +- t dy2 0; y3 +/ y4 b 2",
			sites: "3cd4 hc t; cd2 wd8 y3; cd4 hc y2; 0 x10 y3",
			text: "x2 t x9 y2"
		},
		ribbonDown: {
			defaults: {
				adj1: 16667,
				adj2: 5e4
			},
			guides: "a1 pin 0 adj1 33333; a2 pin 25000 adj2 75000; x10 +- r 0 wd8; dx2 */ w a2 200000; x2 +- hc 0 dx2; x9 +- hc dx2 0; y2 */ h a1 100000; y4 +- b 0 y2; y3 */ y4 1 2",
			sites: "3cd4 hc y2; cd2 wd8 y3; cd4 hc b; 0 x10 y3",
			text: "x2 y2 x9 b"
		},
		curvedRibbonUp: {
			defaults: {
				adj1: 25e3,
				adj2: 5e4,
				adj3: 12500
			},
			guides: "a1 pin 0 adj1 100000; a2 pin 25000 adj2 75000; q10 +- 100000 0 a1; q11 */ q10 1 2; q12 +- a1 0 q11; minAdj3 max 0 q12; a3 pin minAdj3 adj3 a1; dx2 */ w a2 200000; x2 +- hc 0 dx2; x3 +- x2 wd8 0; x5 +- r 0 x2; x6 +- r 0 wd8; dy1 */ h a3 100000; f1 */ 4 dy1 w; q1 */ x3 x3 w; q1 */ h a1 100000; dy3 +- q1 0 dy1; q3 */ x2 x2 w; q4 +- x2 0 q3; q5 */ f1 q4 1; u3 +- q5 dy3 0; rh +- b 0 q1; q8 */ dy1 14 16; u2 +/ q8 rh 2; y2 +- b 0 u2; u6 +- u3 rh 0; y6 +- b 0 u6",
			sites: "3cd4 hc t; cd2 wd8 y2; cd4 hc rh; 0 x6 y2",
			text: "x2 y6 x5 rh"
		},
		curvedRibbonDown: {
			defaults: {
				adj1: 25e3,
				adj2: 5e4,
				adj3: 12500
			},
			guides: "a1 pin 0 adj1 100000; a2 pin 25000 adj2 75000; q10 +- 100000 0 a1; q11 */ q10 1 2; q12 +- a1 0 q11; minAdj3 max 0 q12; a3 pin minAdj3 adj3 a1; dx2 */ w a2 200000; x2 +- hc 0 dx2; x3 +- x2 wd8 0; x5 +- r 0 x2; x6 +- r 0 wd8; dy1 */ h a3 100000; f1 */ 4 dy1 w; q1 */ x3 x3 w; q1 */ h a1 100000; dy3 +- q1 0 dy1; q3 */ x2 x2 w; q4 +- x2 0 q3; q5 */ f1 q4 1; y3 +- q5 dy3 0; rh +- b 0 q1; q8 */ dy1 14 16; y2 +/ q8 rh 2; y6 +- y3 rh 0",
			sites: "3cd4 hc q1; cd2 wd8 y2; cd4 hc b; 0 x6 y2",
			text: "x2 q1 x5 y6"
		},
		leftRightRibbon: {
			defaults: {
				adj1: 5e4,
				adj2: 5e4,
				adj3: 16667
			},
			guides: "a3 pin 0 adj3 33333; maxAdj1 +- 100000 0 a3; a1 pin 0 adj1 maxAdj1; w1 +- wd2 0 wd32; maxAdj2 */ 100000 w1 ss; a2 pin 0 adj2 maxAdj2; x1 */ ss a2 100000; x4 +- r 0 x1; dy1 */ h a1 200000; dy2 */ h a3 -200000; ly1 +- vc dy2 dy1; ry4 +- vc dy1 dy2; ly2 +- ly1 dy1 0; ry3 +- b 0 ly2; ly4 */ ly2 2 1; ry1 +- b 0 ly4",
			sites: "0 r ry3; cd4 x4 b; cd4 x1 ly4; cd2 l ly2; 3cd4 x1 t; 3cd4 x4 ry1",
			text: "x1 ly1 x4 ry4"
		},
		verticalScroll: {
			defaults: { adj: 12500 },
			guides: "a pin 0 adj 25000; ch */ ss a 100000; ch2 */ ch 1 2; x6 +- r 0 ch; y4 +- b 0 ch2",
			sites: "3cd4 hc t; 0 ch vc; cd4 hc b; cd2 x6 vc",
			text: "ch ch x6 y4"
		},
		horizontalScroll: {
			defaults: { adj: 12500 },
			guides: "a pin 0 adj 25000; ch */ ss a 100000; ch2 */ ch 1 2; y6 +- b 0 ch; x4 +- r 0 ch2",
			sites: "cd4 hc ch; cd2 l vc; 3cd4 hc y6; 0 r vc",
			text: "ch ch x4 y6"
		},
		wave: {
			defaults: {
				adj1: 12500,
				adj2: 0
			},
			guides: "a1 pin 0 adj1 20000; a2 pin -10000 adj2 10000; y1 */ h a1 100000; y4 +- b 0 y1; dx1 */ w a2 100000; of2 */ w a2 50000; x1 abs dx1; dx2 ?: of2 0 of2; x2 +- l 0 dx2; dx5 ?: of2 of2 0; x5 +- r 0 dx5; x6 +- l dx5 0; x10 +- r dx2 0; x9 +- r 0 x1; xAdj +- hc dx1 0; xAdj2 +- hc 0 dx1; il max x2 x6; ir min x5 x10; it */ h a1 50000; ib +- b 0 it",
			sites: "cd4 xAdj2 y1; cd2 x1 vc; 3cd4 xAdj y4; 0 x9 vc",
			text: "il it ir ib"
		},
		doubleWave: {
			defaults: {
				adj1: 6250,
				adj2: 0
			},
			guides: "a1 pin 0 adj1 12500; a2 pin -10000 adj2 10000; y1 */ h a1 100000; y4 +- b 0 y1; dx1 */ w a2 100000; of2 */ w a2 50000; x1 abs dx1; dx2 ?: of2 0 of2; x2 +- l 0 dx2; dx8 ?: of2 of2 0; x8 +- r 0 dx8; x5 +/ x2 x8 2; x9 +- l dx8 0; x15 +- r dx2 0; x12 +/ x9 x15 2; x16 +- r 0 x1; il max x2 x9; ir min x8 x15; it */ h a1 50000; ib +- b 0 it",
			sites: "cd4 x12 y1; cd2 x1 vc; 3cd4 x5 y4; 0 x16 vc",
			text: "il it ir ib"
		},
		rectangularCallout: {
			defaults: {
				adj1: -20833,
				adj2: 62500
			},
			guides: "dxPos */ w adj1 100000; dyPos */ h adj2 100000; xPos +- hc dxPos 0; yPos +- vc dyPos 0",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc; cd4 xPos yPos"
		},
		roundedRectangularCallout: {
			defaults: {
				adj1: -20833,
				adj2: 62500,
				adj3: 16667
			},
			guides: "dxPos */ w adj1 100000; dyPos */ h adj2 100000; xPos +- hc dxPos 0; yPos +- vc dyPos 0; u1 */ ss adj3 100000; il */ u1 29289 100000; ir +- r 0 il; ib +- b 0 il",
			sites: "3cd4 hc t; cd2 l vc; cd4 hc b; 0 r vc; cd4 xPos yPos",
			text: "il il ir ib"
		},
		ellipticalCallout: {
			defaults: {
				adj1: -20833,
				adj2: 62500
			},
			guides: "dxPos */ w adj1 100000; dyPos */ h adj2 100000; xPos +- hc dxPos 0; yPos +- vc dyPos 0; sdx */ dxPos h 1; sdy */ dyPos w 1; pang at2 sdx sdy; idx cos wd2 2700000; idy sin hd2 2700000; il +- hc 0 idx; ir +- hc idx 0; it +- vc 0 idy; ib +- vc idy 0",
			sites: "3cd4 hc t; 3cd4 il it; cd4 il ib; cd4 hc b; cd4 ir ib; 0 r vc; 3cd4 ir it; pang xPos yPos",
			text: "il it ir ib"
		},
		cloudCallout: {
			defaults: {
				adj1: -20833,
				adj2: 62500
			},
			guides: "dxPos */ w adj1 100000; dyPos */ h adj2 100000; xPos +- hc dxPos 0; yPos +- vc dyPos 0; il */ w 2977 21600; it */ h 3262 21600; ir */ w 17087 21600; ib */ h 17337 21600; g27 */ w 67 21600; g28 */ h 21577 21600; g29 */ w 21582 21600; g30 */ h 1235 21600; pang at2 dxPos dyPos",
			sites: "cd2 g27 vc; cd4 hc g28; 0 g29 vc; 3cd4 hc g30; pang xPos yPos",
			text: "il it ir ib"
		},
		lineCallout: {
			defaults: {
				adj1: 18750,
				adj2: -8333,
				adj3: 112500,
				adj4: -38333
			},
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t"
		},
		bentLineCallout: {
			defaults: {
				adj1: 18750,
				adj2: -8333,
				adj3: 18750,
				adj4: -16667,
				adj5: 112500,
				adj6: -46667
			},
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t"
		},
		doubleBentLineCallout: {
			defaults: {
				adj1: 18750,
				adj2: -8333,
				adj3: 18750,
				adj4: -16667,
				adj5: 1e5,
				adj6: -16667,
				adj7: 112963,
				adj8: -8333
			},
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t"
		},
		lineCalloutWithAccentBar: {
			defaults: {
				adj1: 18750,
				adj2: -8333,
				adj3: 112500,
				adj4: -38333
			},
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t"
		},
		bentLineCalloutWithAccentBar: {
			defaults: {
				adj1: 18750,
				adj2: -8333,
				adj3: 18750,
				adj4: -16667,
				adj5: 112500,
				adj6: -46667
			},
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t"
		},
		doubleBentLineCalloutWithAccentBar: {
			defaults: {
				adj1: 18750,
				adj2: -8333,
				adj3: 18750,
				adj4: -16667,
				adj5: 1e5,
				adj6: -16667,
				adj7: 112963,
				adj8: -8333
			},
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t"
		},
		lineCalloutWithNoBorder: {
			defaults: {
				adj1: 18750,
				adj2: -8333,
				adj3: 112500,
				adj4: -38333
			},
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t"
		},
		bentLineCalloutWithNoBorder: {
			defaults: {
				adj1: 18750,
				adj2: -8333,
				adj3: 18750,
				adj4: -16667,
				adj5: 112500,
				adj6: -46667
			},
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t"
		},
		doubleBentLineCalloutWithNoBorder: {
			defaults: {
				adj1: 18750,
				adj2: -8333,
				adj3: 18750,
				adj4: -16667,
				adj5: 1e5,
				adj6: -16667,
				adj7: 112963,
				adj8: -8333
			},
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t"
		},
		lineCalloutWithBorderAndAccentBar: {
			defaults: {
				adj1: 18750,
				adj2: -8333,
				adj3: 112500,
				adj4: -38333
			},
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t"
		},
		bentLineCalloutWithBorderAndAccentBar: {
			defaults: {
				adj1: 18750,
				adj2: -8333,
				adj3: 18750,
				adj4: -16667,
				adj5: 112500,
				adj6: -46667
			},
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t"
		},
		doubleBentLineCalloutWithBorderAndAccentBar: {
			defaults: {
				adj1: 18750,
				adj2: -8333,
				adj3: 18750,
				adj4: -16667,
				adj5: 1e5,
				adj6: -16667,
				adj7: 112963,
				adj8: -8333
			},
			sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t"
		},
		actionButtonBlank: { sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t" },
		actionButtonHome: { sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t" },
		actionButtonHelp: { sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t" },
		actionButtonInformation: { sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t" },
		actionButtonForwardNext: { sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t" },
		actionButtonBackPrevious: { sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t" },
		actionButtonEnd: { sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t" },
		actionButtonBeginning: { sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t" },
		actionButtonReturn: { sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t" },
		actionButtonDocument: { sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t" },
		actionButtonSound: { sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t" },
		actionButtonMovie: { sites: "0 r vc; cd4 hc b; cd2 l vc; 3cd4 hc t" },
		gear6: {
			defaults: {
				adj1: 15e3,
				adj2: 3526
			},
			guides: "a1 pin 0 adj1 20000; a2 pin 0 adj2 5358; th */ ss a1 100000; lFD */ ss a2 100000; th2 */ th 1 2; l2 */ lFD 1 2; l3 +- th2 l2 0; rh +- hd2 0 th; rw +- wd2 0 th; dr +- rw 0 rh; maxr ?: dr rh rw; ha at2 maxr l3; aA1 +- 19800000 0 ha; aD1 +- 19800000 ha 0; ta11 cos rw aA1; ta12 sin rh aA1; bA1 at2 ta11 ta12; cta1 cos rh bA1; sta1 sin rw bA1; ma1 mod cta1 sta1 0; na1 */ rw rh ma1; dxa1 cos na1 bA1; dya1 sin na1 bA1; xA1 +- hc dxa1 0; yA1 +- vc dya1 0; td11 cos rw aD1; td12 sin rh aD1; bD1 at2 td11 td12; ctd1 cos rh bD1; std1 sin rw bD1; md1 mod ctd1 std1 0; nd1 */ rw rh md1; dxd1 cos nd1 bD1; dyd1 sin nd1 bD1; xD1 +- hc dxd1 0; yD1 +- vc dyd1 0; xAD1 +- xA1 0 xD1; yAD1 +- yA1 0 yD1; a1 at2 yAD1 xAD1; dxF1 sin lFD a1; dyF1 cos lFD a1; xF1 +- xD1 dxF1 0; yF1 +- yD1 dyF1 0; xE1 +- xA1 0 dxF1; yE1 +- yA1 0 dyF1; yC1t sin th a1; xC1t cos th a1; yC1 +- yF1 yC1t 0; xC1 +- xF1 0 xC1t; yB1 +- yE1 yC1t 0; xB1 +- xE1 0 xC1t; aD6 +- 3cd4 ha 0; td61 cos rw aD6; td62 sin rh aD6; bD6 at2 td61 td62; ctd6 cos rh bD6; std6 sin rw bD6; md6 mod ctd6 std6 0; nd6 */ rw rh md6; dyd6 sin nd6 bD6; yD6 +- vc dyd6 0; yC6 +- yD6 0 th; yD2 +- h 0 yA1; yB3 +- h 0 yC6; xD5 +- w 0 xA1; xCxn1 +/ xB1 xC1 2; yCxn1 +/ yB1 yC1 2; yCxn2 +- b 0 yCxn1; xCxn4 +/ r 0 xCxn1",
			sites: "19800000 xCxn1 yCxn1; 1800000 xCxn1 yCxn2; cd4 hc yB3; 9000000 xCxn4 yCxn2; 12600000 xCxn4 yCxn1; 3cd4 hc yC6",
			text: "xD5 yA1 xA1 yD2"
		},
		gear9: {
			defaults: {
				adj1: 1e4,
				adj2: 1763
			},
			guides: "a1 pin 0 adj1 20000; a2 pin 0 adj2 2679; th */ ss a1 100000; lFD */ ss a2 100000; th2 */ th 1 2; l2 */ lFD 1 2; l3 +- th2 l2 0; rh +- hd2 0 th; rw +- wd2 0 th; dr +- rw 0 rh; maxr ?: dr rh rw; ha at2 maxr l3; aA1 +- 18600000 0 ha; aD1 +- 18600000 ha 0; ta11 cos rw aA1; ta12 sin rh aA1; bA1 at2 ta11 ta12; cta1 cos rh bA1; sta1 sin rw bA1; ma1 mod cta1 sta1 0; na1 */ rw rh ma1; dxa1 cos na1 bA1; dya1 sin na1 bA1; xA1 +- hc dxa1 0; yA1 +- vc dya1 0; td11 cos rw aD1; td12 sin rh aD1; bD1 at2 td11 td12; ctd1 cos rh bD1; std1 sin rw bD1; md1 mod ctd1 std1 0; nd1 */ rw rh md1; dxd1 cos nd1 bD1; dyd1 sin nd1 bD1; xD1 +- hc dxd1 0; yD1 +- vc dyd1 0; xAD1 +- xA1 0 xD1; yAD1 +- yA1 0 yD1; a1 at2 yAD1 xAD1; dxF1 sin lFD a1; dyF1 cos lFD a1; xF1 +- xD1 dxF1 0; yF1 +- yD1 dyF1 0; xE1 +- xA1 0 dxF1; yE1 +- yA1 0 dyF1; yC1t sin th a1; xC1t cos th a1; yC1 +- yF1 yC1t 0; xC1 +- xF1 0 xC1t; yB1 +- yE1 yC1t 0; xB1 +- xE1 0 xC1t; aA2 +- 21000000 0 ha; aD2 +- 21000000 ha 0; ta21 cos rw aA2; ta22 sin rh aA2; bA2 at2 ta21 ta22; cta2 cos rh bA2; sta2 sin rw bA2; ma2 mod cta2 sta2 0; na2 */ rw rh ma2; dxa2 cos na2 bA2; dya2 sin na2 bA2; xA2 +- hc dxa2 0; yA2 +- vc dya2 0; td21 cos rw aD2; td22 sin rh aD2; bD2 at2 td21 td22; ctd2 cos rh bD2; std2 sin rw bD2; md2 mod ctd2 std2 0; nd2 */ rw rh md2; dxd2 cos nd2 bD2; dyd2 sin nd2 bD2; xD2 +- hc dxd2 0; yD2 +- vc dyd2 0; xAD2 +- xA2 0 xD2; yAD2 +- yA2 0 yD2; a2 at2 yAD2 xAD2; dxF2 sin lFD a2; dyF2 cos lFD a2; xF2 +- xD2 dxF2 0; yF2 +- yD2 dyF2 0; xE2 +- xA2 0 dxF2; yE2 +- yA2 0 dyF2; yC2t sin th a2; xC2t cos th a2; yC2 +- yF2 yC2t 0; xC2 +- xF2 0 xC2t; yB2 +- yE2 yC2t 0; xB2 +- xE2 0 xC2t; aA3 +- 1800000 0 ha; aD3 +- 1800000 ha 0; ta31 cos rw aA3; ta32 sin rh aA3; bA3 at2 ta31 ta32; cta3 cos rh bA3; sta3 sin rw bA3; ma3 mod cta3 sta3 0; na3 */ rw rh ma3; dxa3 cos na3 bA3; dya3 sin na3 bA3; xA3 +- hc dxa3 0; yA3 +- vc dya3 0; td31 cos rw aD3; td32 sin rh aD3; bD3 at2 td31 td32; ctd3 cos rh bD3; std3 sin rw bD3; md3 mod ctd3 std3 0; nd3 */ rw rh md3; dxd3 cos nd3 bD3; dyd3 sin nd3 bD3; xD3 +- hc dxd3 0; yD3 +- vc dyd3 0; xAD3 +- xA3 0 xD3; yAD3 +- yA3 0 yD3; a3 at2 yAD3 xAD3; dxF3 sin lFD a3; dyF3 cos lFD a3; xF3 +- xD3 dxF3 0; yF3 +- yD3 dyF3 0; xE3 +- xA3 0 dxF3; yE3 +- yA3 0 dyF3; yC3t sin th a3; xC3t cos th a3; yC3 +- yF3 yC3t 0; xC3 +- xF3 0 xC3t; yB3 +- yE3 yC3t 0; xB3 +- xE3 0 xC3t; aA4 +- 4200000 0 ha; aD4 +- 4200000 ha 0; ta41 cos rw aA4; ta42 sin rh aA4; bA4 at2 ta41 ta42; cta4 cos rh bA4; sta4 sin rw bA4; ma4 mod cta4 sta4 0; na4 */ rw rh ma4; dxa4 cos na4 bA4; dya4 sin na4 bA4; xA4 +- hc dxa4 0; yA4 +- vc dya4 0; td41 cos rw aD4; td42 sin rh aD4; bD4 at2 td41 td42; ctd4 cos rh bD4; std4 sin rw bD4; md4 mod ctd4 std4 0; nd4 */ rw rh md4; dxd4 cos nd4 bD4; dyd4 sin nd4 bD4; xD4 +- hc dxd4 0; yD4 +- vc dyd4 0; xAD4 +- xA4 0 xD4; yAD4 +- yA4 0 yD4; a4 at2 yAD4 xAD4; dxF4 sin lFD a4; dyF4 cos lFD a4; xF4 +- xD4 dxF4 0; yF4 +- yD4 dyF4 0; xE4 +- xA4 0 dxF4; yE4 +- yA4 0 dyF4; yC4t sin th a4; xC4t cos th a4; yC4 +- yF4 yC4t 0; xC4 +- xF4 0 xC4t; yB4 +- yE4 yC4t 0; xB4 +- xE4 0 xC4t; xA8 +- w 0 xD1; aD9 +- 3cd4 ha 0; td91 cos rw aD9; td92 sin rh aD9; bD9 at2 td91 td92; ctd9 cos rh bD9; std9 sin rw bD9; md9 mod ctd9 std9 0; nd9 */ rw rh md9; dyd9 sin nd9 bD9; yD9 +- vc dyd9 0; yC9 +- yD9 0 th; xCxn1 +/ xB1 xC1 2; yCxn1 +/ yB1 yC1 2; xCxn2 +/ xB2 xC2 2; yCxn2 +/ yB2 yC2 2; xCxn3 +/ xB3 xC3 2; yCxn3 +/ yB3 yC3 2; xCxn4 +/ xB4 xC4 2; yCxn4 +/ yB4 yC4 2; xCxn5 +/ r 0 xCxn4; xCxn6 +/ r 0 xCxn3; xCxn7 +/ r 0 xCxn2; xCxn8 +/ r 0 xCxn1",
			sites: "18600000 xCxn1 yCxn1; 21000000 xCxn2 yCxn2; 1800000 xCxn3 yCxn3; 4200000 xCxn4 yCxn4; 6600000 xCxn5 yCxn4; 9000000 xCxn6 yCxn3; 11400000 xCxn7 yCxn2; 13800000 xCxn8 yCxn1; 3cd4 hc yC9",
			text: "xA8 yD1 xD1 yD3"
		},
		cornerTabs: {
			guides: "md mod w h 0; dx */ 1 md 20; y1 +- 0 b dx; x1 +- 0 r dx",
			sites: "cd2 l t; cd2 l dx; cd2 l y1; cd2 l b; 3cd4 dx t; 3cd4 x1 t; cd4 dx b; cd4 x1 b; 0 r t; 0 r dx; 0 r y1; 0 r b",
			text: "dx dx x1 y1"
		},
		squareTabs: {
			guides: "md mod w h 0; dx */ 1 md 20; y1 +- 0 b dx; x1 +- 0 r dx",
			sites: "cd2 l t; cd2 l dx; cd2 l y1; cd2 l b; cd2 dx dx; cd2 dx x1; 3cd4 dx t; 3cd4 x1 t; cd4 dx b; cd4 x1 b; 0 r t; 0 r dx; 0 r y1; 0 r b; 0 x1 dx; 0 x1 y1",
			text: "dx dx x1 y1"
		},
		plaqueTabs: {
			guides: "md mod w h 0; dx */ 1 md 20; y1 +- 0 b dx; x1 +- 0 r dx",
			sites: "cd2 l t; cd2 l dx; cd2 l y1; cd2 l b; 3cd4 dx t; 3cd4 x1 t; cd4 dx b; cd4 x1 b; 0 r t; 0 r dx; 0 r y1; 0 r b",
			text: "dx dx x1 y1"
		}
	};
	//#endregion
	//#region src/shapes/text-metrics/text-rectangle.ts
	/**
	* The box a preset shape's text is written in, such as the middle of an ellipse or a diamond.
	*
	* Reference: ECMA-376 Part 1, 20.1.9.22 rect (Shape Text Rectangle)
	*
	* @module
	*/
	/**
	* The box a preset shape of the given size writes its text in, before the text's margins. Shapes without
	* a text box of their own, and custom shapes, write their text across the whole shape.
	*
	* @param adjustments - The shape's adjustment guide values, such as `{ adj: 25000 }`. Missing values take their defaults
	*/
	var getTextRectangle = (type, width, height, adjustments) => {
		const definition = type === "custom" ? void 0 : PRESET_SHAPE_GEOMETRY[type];
		if (!(definition === null || definition === void 0 ? void 0 : definition.text)) return {
			left: 0,
			top: 0,
			right: width,
			bottom: height
		};
		const value = evaluateShapeGuides(definition, width, height, adjustments);
		const [left, top, right, bottom] = definition.text.split(" ").map(value);
		return {
			left,
			top,
			right,
			bottom
		};
	};
	//#endregion
	//#region src/shapes/shape-text-size.ts
	/**
	* Sizes shapes to fit their text: reads the text and fonts of a shape's paragraphs, and finds the width or height
	* at which the text fits inside the shape's text box. Not part of the public API.
	*
	* @module
	*/
	var EMUS_PER_PIXEL$5 = 9525;
	var POINTS_PER_PIXEL = .75;
	var DEFAULT_MARGINS = {
		top: 3.6,
		right: 7.2,
		bottom: 3.6,
		left: 7.2
	};
	var FIT_ALLOWANCE = 2;
	/**
	* Creates the paragraphs for a shape's `text`: one centred paragraph for each line. When the document's paragraphs
	* have space before or after them, these don't, so the text stays in the middle of the shape.
	*/
	var createTextParagraphs = (text, styles = WORD_DEFAULT_STYLES) => {
		const spacing = hasDefaultParagraphSpacing(styles) ? {
			before: 0,
			after: 0
		} : void 0;
		return text.split("\n").map((line) => new docx.Paragraph({
			alignment: docx.AlignmentType.CENTER,
			spacing,
			children: [new docx.TextRun(line)]
		}));
	};
	/**
	* Finds the length of a shape's side at which its text box is `needed` long. Most text boxes are a fixed part of the
	* shape, or the shape less a fixed length, so this settles in a few steps.
	*/
	var solveLength = (needed, textLength) => {
		let length = Math.max(needed, 1);
		for (let step = 0; step < 10; step++) {
			const current = textLength(length);
			if (Math.abs(current - needed) < .01) break;
			length = current > 0 ? length * (needed / current) : length + needed;
		}
		return length;
	};
	/**
	* A size in pixels, or `"fitText"`: a percentage becomes the pixels it is of `base`.
	*
	* @throws If the size is a percentage and there is nothing it can be a percentage of
	*/
	var resolvePercentage = (size, option, base) => {
		const percentage = size === "fitText" ? void 0 : percentageOf(size, option);
		if (percentage === void 0) return size;
		if (base === void 0) throw new Error(`Invalid ${option} "${size}". Only a floating shape can be a percentage of the page`);
		return base * percentage / 100;
	};
	/**
	* Works out a shape's width or height when it is `"fitText"`, from its text, the document's styles, and the shape's
	* margins and text box. The size is an estimate: text is measured with the widths of common fonts.
	*
	* @param styles - The document's styles. Default is Word's own defaults
	* @param percentageBase - What a percentage width and height are percentages of, in pixels. Without it, a size can't be a percentage
	* @returns The transformation with both sizes in pixels
	* @throws If a size is a percentage without a `percentageBase`
	*/
	var resolveShapeSize = (options, styles = WORD_DEFAULT_STYLES, percentageBase) => {
		var _options$children;
		const transformation = _objectSpread2(_objectSpread2({}, options.transformation), {}, {
			width: resolvePercentage(options.transformation.width, "width", percentageBase === null || percentageBase === void 0 ? void 0 : percentageBase.width),
			height: resolvePercentage(options.transformation.height, "height", percentageBase === null || percentageBase === void 0 ? void 0 : percentageBase.height)
		});
		if (transformation.width !== "fitText" && transformation.height !== "fitText") return _objectSpread2(_objectSpread2({}, transformation), {}, {
			width: transformation.width,
			height: transformation.height
		});
		const written = [...options.text === void 0 ? [] : createTextParagraphs(options.text, styles), ...(_options$children = options.children) !== null && _options$children !== void 0 ? _options$children : []];
		const paragraphs = readTextParagraphs(written.length > 0 ? written : [new docx.Paragraph({})], styles);
		const { textOptions = {} } = options;
		const guides = options.type === "custom" ? void 0 : createShapeGuides(options.type, options.adjustments);
		const margins = _objectSpread2(_objectSpread2({}, DEFAULT_MARGINS), textOptions.margins);
		const turned = textOptions.direction !== void 0 && textOptions.direction !== "horizontal";
		const across = turned ? transformation.height : transformation.width;
		const along = turned ? transformation.width : transformation.height;
		const textBox = (acrossSize, alongSize) => {
			const [width, height] = turned ? [alongSize, acrossSize] : [acrossSize, alongSize];
			const box = options.type === "custom" ? getCustomTextRectangle(options, width * EMUS_PER_PIXEL$5, height * EMUS_PER_PIXEL$5) : getTextRectangle(options.type, width * EMUS_PER_PIXEL$5, height * EMUS_PER_PIXEL$5, guides);
			const size = {
				width: (box.right - box.left) / EMUS_PER_PIXEL$5,
				height: (box.bottom - box.top) / EMUS_PER_PIXEL$5
			};
			return turned ? {
				across: size.height,
				along: size.width
			} : {
				across: size.width,
				along: size.height
			};
		};
		const acrossMargins = (turned ? margins.top + margins.bottom : margins.left + margins.right) / POINTS_PER_PIXEL;
		const alongMargins = (turned ? margins.left + margins.right : margins.top + margins.bottom) / POINTS_PER_PIXEL;
		const natural = measureText(paragraphs);
		const guessAlong = typeof along === "number" ? along : natural.height / POINTS_PER_PIXEL + alongMargins;
		const fitAcross = (alongSize) => across === "fitText" ? Math.ceil(solveLength(natural.width / POINTS_PER_PIXEL + acrossMargins + FIT_ALLOWANCE, (length) => textBox(length, alongSize).across)) : across;
		const fitAlong = (acrossSize, alongSize) => {
			if (along !== "fitText") return along;
			const wrapWidth = textOptions.wrap === false ? void 0 : Math.max(0, textBox(acrossSize, alongSize).across - acrossMargins);
			const textHeight = measureText(paragraphs, wrapWidth === void 0 ? void 0 : wrapWidth * POINTS_PER_PIXEL).height;
			return Math.ceil(solveLength(textHeight / POINTS_PER_PIXEL + alongMargins, (length) => textBox(acrossSize, length).along));
		};
		let acrossLength = fitAcross(guessAlong);
		let alongLength = fitAlong(acrossLength, guessAlong);
		for (let step = 0; step < 5; step++) {
			const nextAcross = fitAcross(alongLength);
			const nextAlong = fitAlong(nextAcross, alongLength);
			if (nextAcross === acrossLength && nextAlong === alongLength) break;
			acrossLength = nextAcross;
			alongLength = nextAlong;
		}
		return _objectSpread2(_objectSpread2({}, transformation), {}, {
			width: turned ? alongLength : acrossLength,
			height: turned ? acrossLength : alongLength
		});
	};
	//#endregion
	//#region src/shapes/drawing/styled-drawing.ts
	/**
	* Drawings whose layout depends on the document's styles, such as a shape sized to fit its text.
	*
	* @module
	*/
	/**
	* Everything about a drawing's text that the document's styles can change: how its paragraphs, and those written for
	* `text`, are formatted, and whether `text` is written without paragraph spacing. Two styles with the same key lay
	* the drawing out the same way.
	*/
	var stylesKey = (paragraphs, styles) => JSON.stringify([hasDefaultParagraphSpacing(styles), readTextParagraphs([...createTextParagraphs("", styles), ...paragraphs], styles)]);
	/**
	* A drawing that is laid out again, in the document's styles, when it is written. A shape doesn't know which document
	* it is in until then.
	*
	* It is also laid out in Word's default styles when it is created, so mistakes in its options throw straight away,
	* and that layout is written when the document's styles format its text the same way. The drawing ids are given
	* before either layout, so both have the same ids.
	*/
	var StyledDrawing = class extends docx.XmlComponent {
		constructor(create, paragraphs) {
			super("w:drawing");
			_defineProperty(this, "create", void 0);
			_defineProperty(this, "paragraphs", void 0);
			_defineProperty(this, "drawings", /* @__PURE__ */ new WeakMap());
			_defineProperty(this, "defaultKey", void 0);
			this.create = create;
			this.paragraphs = paragraphs;
			this.drawings.set(WORD_DEFAULT_STYLES, create(WORD_DEFAULT_STYLES));
			this.defaultKey = stylesKey(paragraphs, WORD_DEFAULT_STYLES);
		}
		prepForXml(context) {
			var _this$drawings$get;
			const styles = getTextStyles(context);
			const drawing = (_this$drawings$get = this.drawings.get(styles)) !== null && _this$drawings$get !== void 0 ? _this$drawings$get : stylesKey(this.paragraphs, styles) === this.defaultKey ? this.drawings.get(WORD_DEFAULT_STYLES) : this.create(styles);
			this.drawings.set(styles, drawing);
			return drawing.prepForXml(context);
		}
	};
	/**
	* Creates a drawing, or a drawing that is laid out again in the document's styles when it is written if its layout
	* depends on them.
	*
	* @param create - Lays out and creates the drawing in the given styles
	* @param paragraphs - The paragraphs of text in the drawing, other than those written for `text`, or nothing if the
	* drawing's layout doesn't depend on the document's styles
	*/
	var createStyledDrawing = (create, paragraphs) => paragraphs ? new StyledDrawing(create, paragraphs) : create(WORD_DEFAULT_STYLES);
	//#endregion
	//#region src/shapes/connector/connection-sites.ts
	/**
	* Connection sites: the points on a preset shape where connectors attach.
	*
	* Reference: ECMA-376 Part 1, 20.1.9.9 cxn (Shape Connection Site)
	*
	* @module
	*/
	/**
	* The connection sites of a preset shape of the given size, in the order OOXML numbers them (`a:stCxn/@idx`).
	*
	* @param adjustments - The shape's adjustment guide values, such as `{ adj: 25000 }`. Missing values take their defaults
	* @returns No sites for shapes without any, such as lines and connectors
	*/
	var getConnectionSites = (type, width, height, adjustments) => {
		const definition = PRESET_SHAPE_GEOMETRY[type];
		if (!(definition === null || definition === void 0 ? void 0 : definition.sites)) return [];
		const value = evaluateShapeGuides(definition, width, height, adjustments);
		return definition.sites.split("; ").map((site) => {
			const [angle, x, y] = site.split(" ");
			return {
				x: value(x),
				y: value(y),
				angle: value(angle) / 6e4
			};
		});
	};
	//#endregion
	//#region src/shapes/connector/orthogonal-route.ts
	var unitOf = (angle) => {
		return [
			{
				x: 1,
				y: 0
			},
			{
				x: 0,
				y: 1
			},
			{
				x: -1,
				y: 0
			},
			{
				x: 0,
				y: -1
			}
		][(Math.round(angle / 90) % 4 + 4) % 4];
	};
	var sortedUnique = (values) => [...new Set(values.map(Math.round))].sort((a, b) => a - b);
	var passesThrough = (from, to, low, high) => Math.max(Math.min(from, to), low + 1) < Math.min(Math.max(from, to), high - 1);
	var isInside = (value, low, high) => value > low + 1 && value < high - 1;
	/**
	* The obstacles a route between two points might have to go around: those near the points, and those near them, and so on.
	*/
	var nearbyObstacles = (points, obstacles, margin) => {
		const grow = (region, found) => {
			const touching = obstacles.filter((obstacle) => !found.includes(obstacle) && obstacle.left <= region.right && region.left <= obstacle.right && obstacle.top <= region.bottom && region.top <= obstacle.bottom);
			if (touching.length === 0) return found;
			const all = [...found, ...touching];
			return grow({
				left: Math.min(region.left, ...touching.map(({ left }) => left - 2 * margin)),
				top: Math.min(region.top, ...touching.map(({ top }) => top - 2 * margin)),
				right: Math.max(region.right, ...touching.map(({ right }) => right + 2 * margin)),
				bottom: Math.max(region.bottom, ...touching.map(({ bottom }) => bottom + 2 * margin))
			}, all);
		};
		return grow({
			left: Math.min(...points.map(({ x }) => x)) - 2 * margin,
			top: Math.min(...points.map(({ y }) => y)) - 2 * margin,
			right: Math.max(...points.map(({ x }) => x)) + 2 * margin,
			bottom: Math.max(...points.map(({ y }) => y)) + 2 * margin
		}, []);
	};
	/**
	* The lines of the grid along one axis: through the ends, a margin outside each obstacle, and halfway between the
	* edges of obstacles, so routes can pass between shapes that are close together. A line a margin outside one obstacle
	* that is nearer than that to another is left out, and routes between them go halfway between.
	*/
	var gridLines = (ends, edges, margin) => {
		const sides = sortedUnique(edges.flat());
		const isClear = (line) => sides.every((side) => Math.abs(side - line) >= margin - 1);
		return sortedUnique([
			...ends,
			...edges.flatMap(([low, high]) => [low - margin, high + margin]).filter(isClear),
			...sides.slice(1).map((side, index) => (sides[index] + side) / 2)
		]);
	};
	/**
	* Finds a route with right-angled bends from one end to the other that goes through none of the obstacles. It leaves
	* each end at right angles to its shape and goes at least `margin` before turning.
	*
	* @returns The ends and corners of the route, or nothing if there is no such route
	*/
	var findOrthogonalRoute = (start, end, margin, allObstacles) => {
		const leaving = unitOf(start.angle);
		const arriving = unitOf(end.angle);
		const first = {
			x: start.point.x + leaving.x * margin,
			y: start.point.y + leaving.y * margin
		};
		const last = {
			x: end.point.x + arriving.x * margin,
			y: end.point.y + arriving.y * margin
		};
		const obstacles = nearbyObstacles([start.point, end.point], allObstacles, margin);
		const xs = gridLines([first.x, last.x], obstacles.map(({ left, right }) => [left, right]), margin);
		const ys = gridLines([first.y, last.y], obstacles.map(({ top, bottom }) => [top, bottom]), margin);
		const pointAt = (column, row) => ({
			x: xs[column],
			y: ys[row]
		});
		const blocked = (from, to) => obstacles.some((obstacle) => from.y === to.y ? isInside(from.y, obstacle.top, obstacle.bottom) && passesThrough(from.x, to.x, obstacle.left, obstacle.right) : isInside(from.x, obstacle.left, obstacle.right) && passesThrough(from.y, to.y, obstacle.top, obstacle.bottom));
		const ray = (from, axis, step) => {
			const reach = (current) => {
				const column = axis === "x" ? current.column + step : current.column;
				const row = axis === "y" ? current.row + step : current.row;
				if (column < 0 || row < 0 || column >= xs.length || row >= ys.length) return [];
				const here = pointAt(current.column, current.row);
				const there = pointAt(column, row);
				if (blocked(here, there)) return [];
				const next = {
					column,
					row,
					axis,
					step,
					length: current.length + Math.abs(there.x - here.x) + Math.abs(there.y - here.y),
					previous: from
				};
				return [next, ...reach(next)];
			};
			return reach(from);
		};
		const keyOf = ({ column, row, axis, step }) => `${column},${row},${axis},${step}`;
		const shortest = (reached) => [...new Map([...reached].sort((a, b) => b.length - a.length).map((point) => [keyOf(point), point])).values()];
		const leavingAxis = leaving.x === 0 ? "y" : "x";
		const leavingStep = leavingAxis === "x" ? leaving.x : leaving.y;
		const arrivingAxis = arriving.x === 0 ? "y" : "x";
		const arrivingStep = -(arrivingAxis === "x" ? arriving.x : arriving.y);
		const origin = {
			column: xs.indexOf(Math.round(first.x)),
			row: ys.indexOf(Math.round(first.y)),
			axis: leavingAxis,
			step: leavingStep,
			length: margin
		};
		const goal = {
			column: xs.indexOf(Math.round(last.x)),
			row: ys.indexOf(Math.round(last.y))
		};
		const search = (frontier, seen) => {
			if (frontier.length === 0) return;
			const arrived = frontier.filter(({ column, row, axis, step }) => column === goal.column && row === goal.row && (axis !== arrivingAxis || step === arrivingStep)).map((point) => ({
				point,
				bends: point.axis === arrivingAxis ? 0 : 1
			})).sort((a, b) => a.bends - b.bends || a.point.length - b.point.length);
			if (arrived.length > 0) return arrived[0].point;
			const next = shortest(frontier.flatMap((point) => {
				const across = point.axis === "x" ? "y" : "x";
				return [...ray(point, across, 1), ...ray(point, across, -1)];
			})).filter((point) => !seen.has(keyOf(point)));
			return search(next, /* @__PURE__ */ new Set([...seen, ...next.map(keyOf)]));
		};
		const leaves = shortest([origin, ...ray(origin, leavingAxis, leavingStep)]);
		const found = search(leaves, new Set(leaves.map(keyOf)));
		if (!found) return;
		const turns = (point) => point ? [...turns(point.previous), pointAt(point.column, point.row)] : [];
		const corners = [
			start.point,
			...turns(found),
			end.point
		];
		return corners.filter((point, index) => {
			const before = corners[index - 1];
			const after = corners[index + 1];
			return !before || !after || !(before.x === point.x && point.x === after.x || before.y === point.y && point.y === after.y);
		});
	};
	//#endregion
	//#region src/shapes/connector/connector-route.ts
	/**
	* Routes a connector between two points on two shapes, as Word does: it picks the connector preset,
	* the box the connector is drawn in, the rotation and flips that point it the right way, and where it bends.
	*
	* Every connector preset runs from the top-left corner of its box to the bottom-right corner, so the box is
	* spanned by the two ends. An elbow connector's bends are adjustments, measured along the box. A bend can be
	* outside the box, which is how a connector loops around a shape.
	*
	* When an elbow or curved connector's usual route would cross other shapes, the router looks for a route
	* with up to four bends that goes around them. An elbow connector that needs more bends is drawn as a freeform line.
	*
	* @module
	*/
	var DIRECTIONS = [
		{
			x: 1,
			y: 0
		},
		{
			x: 0,
			y: 1
		},
		{
			x: -1,
			y: 0
		},
		{
			x: 0,
			y: -1
		}
	];
	var DEFAULT_MARGIN = 228600;
	var MIN_BEND_LENGTH = 9525;
	var PRESETS = {
		elbow: [
			"elbowConnectorOneBend",
			"elbowConnector",
			"elbowConnectorThreeBends",
			"elbowConnectorFourBends"
		],
		curved: [
			"curvedConnectorOneBend",
			"curvedConnector",
			"curvedConnectorThreeBends",
			"curvedConnectorFourBends"
		]
	};
	var dot = (a, b) => a.x * b.x + a.y * b.y;
	var negate = (a) => ({
		x: -a.x,
		y: -a.y
	});
	var directionOf = (angle) => DIRECTIONS[(Math.round(angle / 90) % 4 + 4) % 4];
	var percentOf = (value, length) => length === 0 ? 50 : value / length * 100;
	var findDoubleBackPath = ({ ex, ey, width, height, leavingSign, arrivingSign, margin }) => {
		const w = Math.max(width, MIN_BEND_LENGTH);
		const x1 = leavingSign * margin;
		const x3 = w - arrivingSign * margin;
		const y2 = height / 2;
		return {
			ex,
			ey,
			width: w,
			height,
			points: [
				{
					x: 0,
					y: 0
				},
				{
					x: x1,
					y: 0
				},
				{
					x: x1,
					y: y2
				},
				{
					x: x3,
					y: y2
				},
				{
					x: x3,
					y: height
				},
				{
					x: w,
					y: height
				}
			],
			adjustments: {
				firstBendX: percentOf(x1, w),
				secondBendY: percentOf(y2, height),
				thirdBendX: percentOf(x3, w)
			}
		};
	};
	var findParallelPath = (frame) => {
		const { ex, ey, width, height, leavingSign, arrivingSign, margin } = frame;
		const facing = leavingSign === arrivingSign;
		if (facing && (leavingSign < 0 || width === 0)) return findDoubleBackPath(frame);
		const w = facing ? width : Math.max(width, MIN_BEND_LENGTH);
		const loop = leavingSign > 0 ? w + margin : -margin;
		const x1 = facing ? w / 2 : loop;
		return {
			ex,
			ey,
			width: w,
			height,
			points: [
				{
					x: 0,
					y: 0
				},
				{
					x: x1,
					y: 0
				},
				{
					x: x1,
					y: height
				},
				{
					x: w,
					y: height
				}
			],
			adjustments: { bendX: percentOf(x1, w) }
		};
	};
	var findRightAnglePath = ({ ex, ey, width, height, leavingSign, arrivingSign, margin }) => {
		if (leavingSign > 0 && arrivingSign > 0) return {
			ex,
			ey,
			width,
			height,
			points: [
				{
					x: 0,
					y: 0
				},
				{
					x: width,
					y: 0
				},
				{
					x: width,
					y: height
				}
			],
			adjustments: {}
		};
		const w = leavingSign > 0 ? width : Math.max(width, MIN_BEND_LENGTH);
		const h = arrivingSign > 0 ? height : Math.max(height, MIN_BEND_LENGTH);
		const x1 = leavingSign > 0 ? w / 2 : -margin;
		const y2 = arrivingSign > 0 ? h / 2 : h + margin;
		return {
			ex,
			ey,
			width: w,
			height: h,
			points: [
				{
					x: 0,
					y: 0
				},
				{
					x: x1,
					y: 0
				},
				{
					x: x1,
					y: y2
				},
				{
					x: w,
					y: y2
				},
				{
					x: w,
					y: h
				}
			],
			adjustments: {
				firstBendX: percentOf(x1, w),
				secondBendY: percentOf(y2, h)
			}
		};
	};
	/**
	* Finds the path of an elbow connector in box coordinates. Its first segment always runs along the box's x axis.
	*
	* - When the ends leave and arrive in parallel directions, the path has 3 segments (1 bend position),
	*   or 5 (3 bend positions) when it has to double back to arrive from behind.
	* - When the directions are at right angles, it has 2 segments (no adjustments), or 4 (2 bend positions).
	*/
	var findElbowFrame = (start, end, margin) => {
		const offset = {
			x: end.point.x - start.point.x,
			y: end.point.y - start.point.y
		};
		const leaving = directionOf(start.angle);
		const arriving = negate(directionOf(end.angle));
		const ex = dot(offset, leaving) >= 0 ? leaving : negate(leaving);
		const across = {
			x: -ex.y,
			y: ex.x
		};
		const ey = dot(offset, across) >= 0 ? across : negate(across);
		const parallel = dot(arriving, ex) !== 0;
		return {
			ex,
			ey,
			width: dot(offset, ex),
			height: dot(offset, ey),
			leavingSign: dot(leaving, ex),
			arrivingSign: parallel ? dot(arriving, ex) : dot(arriving, ey),
			parallel,
			margin
		};
	};
	var findElbowPath = (frame) => frame.parallel ? findParallelPath(frame) : findRightAnglePath(frame);
	/**
	* The obstacles a path goes through, or goes nearer to than `clearance`. A path that only touches an obstacle's edge,
	* as a connector does where it meets a shape, doesn't go through it.
	*/
	var countRouteCrossings = (points, obstacles, clearance = 0) => obstacles.filter((obstacle) => points.slice(1).some((to, index) => {
		const from = points[index];
		const overlaps = (a, b, low, high) => Math.max(Math.min(a, b), low + 1) < Math.min(Math.max(a, b), high - 1) || a === b && a > low + 1 && a < high - 1;
		return overlaps(from.x, to.x, obstacle.left - clearance, obstacle.right + clearance) && overlaps(from.y, to.y, obstacle.top - clearance, obstacle.bottom + clearance);
	})).length;
	var pathLength$1 = (points) => points.slice(1).reduce((length, to, index) => length + Math.abs(to.x - points[index].x) + Math.abs(to.y - points[index].y), 0);
	var unique = (values) => [...new Set(values.map((value) => Math.round(value)))];
	var MAX_OBSTACLES_TRIED = 12;
	/**
	* Finds an elbow path in the frame's box that goes through as few obstacles as it can, then is as short as it can be,
	* then bends as few times as it can.
	*
	* The path leaves along the box's x axis and arrives along the axis the frame gives. Its bends are tried on lines
	* a margin away from the ends and from each obstacle, and halfway between the ends.
	*/
	var findAvoidingPath = (frame, obstacles, toPage) => {
		var _best$;
		const { ex, ey, width, height, leavingSign, arrivingSign, parallel, margin } = frame;
		const origin = toPage({
			x: 0,
			y: 0
		});
		const inBox = obstacles.map((obstacle) => {
			const corners = [{
				x: obstacle.left,
				y: obstacle.top
			}, {
				x: obstacle.right,
				y: obstacle.bottom
			}].map((corner) => ({
				x: dot({
					x: corner.x - origin.x,
					y: corner.y - origin.y
				}, ex),
				y: dot({
					x: corner.x - origin.x,
					y: corner.y - origin.y
				}, ey)
			}));
			return {
				left: Math.min(corners[0].x, corners[1].x),
				right: Math.max(corners[0].x, corners[1].x),
				top: Math.min(corners[0].y, corners[1].y),
				bottom: Math.max(corners[0].y, corners[1].y)
			};
		});
		const distance = ({ left, right, top, bottom }) => Math.abs(left + right - width) + Math.abs(top + bottom - height);
		const nearest = [...inBox].sort((a, b) => distance(a) - distance(b)).slice(0, MAX_OBSTACLES_TRIED);
		const xs = unique([
			width / 2,
			-margin,
			margin,
			width - margin,
			width + margin,
			...nearest.flatMap(({ left, right }) => [left - margin, right + margin])
		]);
		const ys = unique([
			height / 2,
			-margin,
			margin,
			height - margin,
			height + margin,
			...nearest.flatMap(({ top, bottom }) => [top - margin, bottom + margin])
		]);
		const w = Math.max(width, MIN_BEND_LENGTH);
		const h = Math.max(height, MIN_BEND_LENGTH);
		const leaves = (x1) => x1 * leavingSign > 0;
		const onPage = (parallel ? [...xs.filter((x1) => leaves(x1) && (w - x1) * arrivingSign > 0).map((x1) => ({
			ex,
			ey,
			width: w,
			height,
			points: [
				{
					x: 0,
					y: 0
				},
				{
					x: x1,
					y: 0
				},
				{
					x: x1,
					y: height
				},
				{
					x: w,
					y: height
				}
			],
			adjustments: { bendX: percentOf(x1, w) }
		})), ...xs.filter(leaves).flatMap((x1) => ys.flatMap((y2) => xs.filter((x3) => (w - x3) * arrivingSign > 0).map((x3) => ({
			ex,
			ey,
			width: w,
			height: h,
			points: [
				{
					x: 0,
					y: 0
				},
				{
					x: x1,
					y: 0
				},
				{
					x: x1,
					y: y2
				},
				{
					x: x3,
					y: y2
				},
				{
					x: x3,
					y: h
				},
				{
					x: w,
					y: h
				}
			],
			adjustments: {
				firstBendX: percentOf(x1, w),
				secondBendY: percentOf(y2, h),
				thirdBendX: percentOf(x3, w)
			}
		}))))] : [...width * leavingSign > 0 && height * arrivingSign > 0 ? [{
			ex,
			ey,
			width,
			height,
			points: [
				{
					x: 0,
					y: 0
				},
				{
					x: width,
					y: 0
				},
				{
					x: width,
					y: height
				}
			],
			adjustments: {}
		}] : [], ...xs.filter(leaves).flatMap((x1) => ys.filter((y2) => (h - y2) * arrivingSign > 0).map((y2) => ({
			ex,
			ey,
			width: w,
			height: h,
			points: [
				{
					x: 0,
					y: 0
				},
				{
					x: x1,
					y: 0
				},
				{
					x: x1,
					y: y2
				},
				{
					x: w,
					y: y2
				},
				{
					x: w,
					y: h
				}
			],
			adjustments: {
				firstBendX: percentOf(x1, w),
				secondBendY: percentOf(y2, h)
			}
		})))]).map((path) => ({
			path,
			points: path.points.map(toPage)
		}));
		const reach = expandBounds(boundsOfPoints(onPage.flatMap(({ points }) => points)), margin);
		const near = obstacles.filter((obstacle) => boundsOverlap(obstacle, reach));
		return (_best$ = [
			({ points }) => countRouteCrossings(points, near),
			({ points }) => countRouteCrossings(points, near, margin),
			({ path }) => pathLength$1(path.points) + (path.points.length - 2) * margin
		].reduce((remaining, measure) => {
			const measured = remaining.map((candidate) => ({
				candidate,
				value: measure(candidate)
			}));
			const least = Math.min(...measured.map(({ value }) => value));
			return measured.filter(({ value }) => value === least).map(({ candidate }) => candidate);
		}, onPage)[0]) === null || _best$ === void 0 ? void 0 : _best$.path;
	};
	var boundsOfPoints = (points) => ({
		left: Math.min(...points.map(({ x }) => x)),
		top: Math.min(...points.map(({ y }) => y)),
		right: Math.max(...points.map(({ x }) => x)),
		bottom: Math.max(...points.map(({ y }) => y))
	});
	var expandBounds = ({ left, top, right, bottom }, by) => ({
		left: left - by,
		top: top - by,
		right: right + by,
		bottom: bottom + by
	});
	var boundsOverlap = (a, b) => a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom;
	var pageMapping = (start, ex, ey) => ({ x, y }) => ({
		x: start.point.x + ex.x * x + ey.x * y,
		y: start.point.y + ex.y * x + ey.y * y
	});
	/**
	* The usual elbow path between two ends, or one that goes around the obstacles the usual path goes through. An elbow
	* connector that can't get around them with four bends takes a route with more, if there is one.
	*
	* @returns The path in its box, or the corners of a route with more bends, on the page
	*/
	var findRoutedPath = (route, start, end, margin, obstacles) => {
		var _toBoxPath;
		const frame = findElbowFrame(start, end, margin);
		const path = findElbowPath(frame);
		const toPage = pageMapping(start, frame.ex, frame.ey);
		const crossings = countRouteCrossings(path.points.map(toPage), obstacles);
		if (crossings === 0) return path;
		const avoiding = findAvoidingPath(frame, obstacles, toPage);
		const best = avoiding && countRouteCrossings(avoiding.points.map(toPage), obstacles) < crossings ? avoiding : path;
		if (route === "curved" || countRouteCrossings(best.points.map(toPage), obstacles) === 0) return best;
		const detour = findOrthogonalRoute(start, end, margin, obstacles);
		return !detour || countRouteCrossings(detour, obstacles) > 0 ? best : (_toBoxPath = toBoxPath(frame, detour.map(toBox(start, frame)))) !== null && _toBoxPath !== void 0 ? _toBoxPath : detour;
	};
	var toBox = (start, { ex, ey }) => (point) => {
		const offset = {
			x: point.x - start.point.x,
			y: point.y - start.point.y
		};
		return {
			x: dot(offset, ex),
			y: dot(offset, ey)
		};
	};
	var BEND_ADJUSTMENTS = {
		2: ["bendX"],
		3: ["firstBendX", "secondBendY"],
		4: [
			"firstBendX",
			"secondBendY",
			"thirdBendX"
		]
	};
	/**
	* The elbow connector preset that draws a route with two to four bends. A route that leaves along the box's x axis and
	* arrives along the axis the frame gives bends as one of the presets does, with its bends where the preset's adjustments
	* put them. A route with one bend has its bend where the usual route does, so it is never a detour.
	*
	* @param points - The route's ends and corners, in box coordinates
	*/
	var toBoxPath = ({ ex, ey, width, height }, points) => {
		const corners = points.slice(1, -1);
		const names = BEND_ADJUSTMENTS[corners.length];
		if (!names) return;
		const w = Math.max(width, MIN_BEND_LENGTH);
		const h = Math.max(height, MIN_BEND_LENGTH);
		const last = corners[corners.length - 1];
		return {
			ex,
			ey,
			width: w,
			height: h,
			points: [
				...points.slice(0, -2),
				corners.length % 2 === 0 ? {
					x: last.x,
					y: h
				} : {
					x: w,
					y: last.y
				},
				{
					x: w,
					y: h
				}
			],
			adjustments: Object.fromEntries(names.map((name, index) => [name, index % 2 === 0 ? percentOf(corners[index].x, w) : percentOf(corners[index].y, h)]))
		};
	};
	var findStraightPath = (start, end) => {
		const offset = {
			x: end.point.x - start.point.x,
			y: end.point.y - start.point.y
		};
		const width = Math.abs(offset.x);
		const height = Math.abs(offset.y);
		return {
			ex: {
				x: offset.x < 0 ? -1 : 1,
				y: 0
			},
			ey: {
				x: 0,
				y: offset.y < 0 ? -1 : 1
			},
			width,
			height,
			points: [{
				x: 0,
				y: 0
			}, {
				x: width,
				y: height
			}],
			adjustments: {}
		};
	};
	/**
	* Finds the preset, box, rotation, flips and adjustments of a connector between two shapes.
	*
	* A straight connector joins the two points directly. Elbow and curved connectors leave and arrive
	* at right angles to the shapes, in the direction of each end's `angle`, and go around `obstacles` when they can.
	*
	* @throws If the margin is negative
	*/
	var routeConnector = (route, start, end, { margin = DEFAULT_MARGIN, obstacles = [] } = {}) => {
		if (!(margin >= 0)) throw new Error(`Invalid connector margin ${margin}. Expected a distance of 0 or more`);
		return toGeometry(route, start, route === "straight" ? findStraightPath(start, end) : findRoutedPath(route, start, end, margin, obstacles));
	};
	/**
	* The connector for a path in its box, or a freeform line through the corners of a route on the page.
	*/
	var toGeometry = (route, start, routed) => {
		if (!("ex" in routed)) {
			const box = boundsOfPoints(routed);
			return {
				type: "freeform",
				adjustments: {},
				offset: {
					x: box.left,
					y: box.top
				},
				width: box.right - box.left,
				height: box.bottom - box.top,
				rotation: 0,
				flip: {
					horizontal: false,
					vertical: false
				},
				points: routed
			};
		}
		const path = routed;
		const { ex, ey, width, height } = path;
		const toPage = pageMapping(start, ex, ey);
		const centre = toPage({
			x: width / 2,
			y: height / 2
		});
		const vertical = ex.x === 0;
		return {
			type: route === "straight" ? "straightConnector" : PRESETS[route][path.points.length - 3],
			adjustments: path.adjustments,
			offset: {
				x: centre.x - width / 2,
				y: centre.y - height / 2
			},
			width,
			height,
			rotation: vertical ? 90 : 0,
			flip: vertical ? {
				horizontal: ex.y < 0,
				vertical: ey.x > 0
			} : {
				horizontal: ex.x < 0,
				vertical: ey.y < 0
			},
			points: path.points.map(toPage)
		};
	};
	/**
	* The elbow connector that follows a route through the given corners, such as a route whose bends have been moved:
	* the preset whose bends are at those corners, or a freeform line if it has more than four bends.
	*
	* @param points - The ends and corners of the route, on the page, leaving and arriving as `start` and `end` do
	*/
	var fitElbowConnector = (start, end, points, margin) => {
		var _toBoxPath2;
		const frame = findElbowFrame(start, end, margin);
		return toGeometry("elbow", start, (_toBoxPath2 = toBoxPath(frame, points.map(toBox(start, frame)))) !== null && _toBoxPath2 !== void 0 ? _toBoxPath2 : points);
	};
	//#endregion
	//#region src/shapes/connector/connector-channels.ts
	var SAME_LINE = 9525;
	var segmentsOf = (route, routeIndex) => route.movable ? route.points.slice(1, -2).map((from, offset) => {
		const index = offset + 1;
		const to = route.points[index + 1];
		const axis = Math.abs(from.y - to.y) < 1 ? "x" : "y";
		const across = axis === "x" ? "y" : "x";
		const before = route.points[index - 1];
		const after = route.points[index + 2];
		return {
			route: routeIndex,
			index,
			axis,
			at: from[across],
			low: Math.min(from[axis], to[axis]),
			high: Math.max(from[axis], to[axis]),
			leaning: before[across] - from[across] + (after[across] - to[across])
		};
	}) : [];
	/**
	* Splits segments into groups that lie on top of each other: on the same line, and overlapping along it.
	*/
	var findChannels = (segments) => {
		return [...segments].sort((a, b) => a.axis === b.axis ? a.at - b.at : a.axis < b.axis ? -1 : 1).reduce((all, segment) => {
			const last = all[all.length - 1];
			return (last === null || last === void 0 ? void 0 : last[0].axis) === segment.axis && Math.abs(last[last.length - 1].at - segment.at) < SAME_LINE ? [...all.slice(0, -1), [...last, segment]] : [...all, [segment]];
		}, []).flatMap((line) => [...line].sort((a, b) => a.low - b.low).reduce((channels, segment) => {
			const last = channels[channels.length - 1];
			return last !== void 0 && segment.low < Math.max(...last.map(({ high }) => high)) - SAME_LINE ? [...channels.slice(0, -1), [...last, segment]] : [...channels, [segment]];
		}, [])).filter((channel) => new Set(channel.map(({ route }) => route)).size > 1);
	};
	var sameEnd = (a, b) => {
		const ends = (route) => [route.points[0], route.points[route.points.length - 1]];
		return ends(a).some((end) => ends(b).some((other) => Math.abs(end.x - other.x) < SAME_LINE && Math.abs(end.y - other.y) < SAME_LINE));
	};
	/**
	* Moves apart the lines of elbow connectors that lie on top of each other between their bends, `spacing` apart and
	* centred on where they were. Connectors that meet at one end, such as those fanning out from a box in an org chart,
	* stay together. The lines are ordered by where the lines before and after them go, so they cross as little as they can.
	*
	* @returns The routes, with the lines that were moved
	*/
	var separateChannels = (routes, spacing) => {
		const shifts = findChannels(routes.flatMap(segmentsOf)).flatMap((channel) => {
			const lanes = channel.reduce((all, segment) => {
				const lane = all.findIndex((members) => members.some((member) => sameEnd(routes[member.route], routes[segment.route])));
				return lane === -1 ? [...all, [segment]] : all.map((members, index) => index === lane ? [...members, segment] : members);
			}, []);
			const leaning = (lane) => lane.reduce((total, { leaning: value }) => total + value, 0);
			const ordered = [...lanes].sort((a, b) => leaning(a) - leaning(b) || a[0].route - b[0].route);
			return ordered.flatMap((lane, position) => lane.map((segment) => ({
				segment,
				by: (position - (ordered.length - 1) / 2) * spacing
			})));
		});
		return routes.map((route, routeIndex) => shifts.filter(({ segment }) => segment.route === routeIndex).reduce((points, { segment, by }) => points.map((point, index) => index === segment.index || index === segment.index + 1 ? segment.axis === "x" ? _objectSpread2(_objectSpread2({}, point), {}, { y: point.y + by }) : _objectSpread2(_objectSpread2({}, point), {}, { x: point.x + by }) : point), route.points));
	};
	//#endregion
	//#region src/shapes/shape-layout-coordinates.ts
	var pairKey = (a, b) => a < b ? `${a},${b}` : `${b},${a}`;
	var positionsOf = (levels) => new Map(levels.flatMap((level) => level.map((node, index) => [node, index])));
	/**
	* Finds the links that would cross the link between two points of a long connector. Lining shapes up along them
	* would bend the long connector, so they are left out.
	*/
	var findConflicts = ({ order, links, points }) => {
		const position = positionsOf(order);
		const isPoint = (node) => points.has(node);
		const predecessors = (node) => links.filter(({ to }) => to === node).map(({ from }) => from);
		return new Set(order.slice(1).flatMap((level, index) => {
			const boundaries = level.map((node, at) => ({
				at,
				upper: isPoint(node) ? predecessors(node).find(isPoint) : void 0
			})).filter(({ at, upper }) => upper !== void 0 || at === level.length - 1);
			const upperEnd = ({ upper }) => upper === void 0 ? order[index].length : position.get(upper);
			return boundaries.flatMap((boundary, which) => {
				const low = which === 0 ? 0 : upperEnd(boundaries[which - 1]);
				const high = upperEnd(boundary);
				return level.slice(which === 0 ? 0 : boundaries[which - 1].at + 1, boundary.at + 1).flatMap((node) => predecessors(node).filter((upper) => {
					const at = position.get(upper);
					return (at < low || high < at) && !(isPoint(upper) && isPoint(node));
				}).map((upper) => pairKey(upper, node)));
			});
		}));
	};
	/**
	* Joins nodes into blocks that are lined up: each node joins the block of the middle one of its neighbors on the level
	* before, unless an earlier node on its level has joined a block further along.
	*
	* @param levels - The levels in the order they are gone through, each in the order nodes are packed
	* @param neighbors - A node's neighbors on the level before
	* @returns The first node of the block each node is in
	*/
	var alignVertically = (levels, neighbors, conflicts) => {
		const position = positionsOf(levels);
		return levels.reduce((root, level) => {
			const { joined } = level.reduce(({ furthest, joined: done }, node) => {
				const sorted = [...neighbors(node)].sort((a, b) => position.get(a) - position.get(b));
				const middle = (sorted.length - 1) / 2;
				const neighbor = [sorted[Math.floor(middle)], sorted[Math.ceil(middle)]].find((candidate) => candidate !== void 0 && furthest < position.get(candidate) && !conflicts.has(pairKey(node, candidate)));
				return neighbor === void 0 ? {
					furthest,
					joined: done
				} : {
					furthest: position.get(neighbor),
					joined: new Map([...done, [node, neighbor]])
				};
			}, {
				furthest: -1,
				joined: /* @__PURE__ */ new Map()
			});
			return new Map([...root, ...level.map((node) => [node, joined.has(node) ? root.get(joined.get(node)) : node])]);
		}, /* @__PURE__ */ new Map());
	};
	/**
	* Places blocks as near the start of each level as the gaps allow, then moves each one as far along as it can go
	* without moving the blocks after it, so blocks that aren't pushed along stay next to the ones they are beside.
	*
	* @returns Each node's centre
	*/
	var compact = (levels, root, gap) => {
		const blockOf = (node) => root.get(node);
		const separations = [...new Map([...levels.flatMap((level) => level.slice(1).map((node, index) => ({
			before: blockOf(level[index]),
			after: blockOf(node),
			distance: gap(level[index], node)
		})))].sort((a, b) => a.distance - b.distance).map((separation) => [`${separation.before},${separation.after}`, separation])).values()];
		const blocks = [...new Set(levels.flat().map(blockOf))];
		const beforeOf = new Map(blocks.map((block) => [block, separations.filter(({ after }) => after === block)]));
		const afterOf = new Map(blocks.map((block) => [block, separations.filter(({ before }) => before === block)]));
		const visit = (state, block) => {
			if (state.seen.has(block)) return state;
			const visited = beforeOf.get(block).map(({ before }) => before).reduce(visit, {
				order: state.order,
				seen: /* @__PURE__ */ new Set([...state.seen, block])
			});
			return {
				order: [...visited.order, block],
				seen: visited.seen
			};
		};
		const sorted = blocks.reduce(visit, {
			order: [],
			seen: /* @__PURE__ */ new Set()
		}).order;
		const packed = sorted.reduce((positions, block) => new Map([...positions, [block, Math.max(0, ...beforeOf.get(block).map(({ before, distance }) => positions.get(before) + distance))]]), /* @__PURE__ */ new Map());
		const moved = [...sorted].reverse().reduce((positions, block) => {
			const furthest = Math.min(...afterOf.get(block).map(({ after, distance }) => positions.get(after) - distance));
			return Number.isFinite(furthest) ? new Map([...positions, [block, Math.max(positions.get(block), furthest)]]) : positions;
		}, packed);
		return new Map([...root].map(([node, block]) => [node, moved.get(block)]));
	};
	/**
	* Places the nodes on each level across the level.
	*
	* @returns Each node's centre, by node
	*/
	var assignLevelCoordinates = (graph) => {
		const { order, links, sizes, points, spacing } = graph;
		const size = (node) => sizes.get(node);
		const gap = (a, b) => (size(a) + size(b)) / 2 + (points.has(a) || points.has(b) ? spacing / 2 : spacing);
		const conflicts = findConflicts(graph);
		const aligning = links.filter(({ skipAlignment }) => !skipAlignment);
		const above = (node) => aligning.filter(({ to }) => to === node).map(({ from }) => from);
		const below = (node) => aligning.filter(({ from }) => from === node).map(({ to }) => to);
		const layouts = ["before", "after"].flatMap((vertical) => ["start", "end"].map((horizontal) => {
			const levels = (vertical === "before" ? order : [...order].reverse()).map((level) => horizontal === "start" ? level : [...level].reverse());
			const centres = compact(levels, alignVertically(levels, vertical === "before" ? above : below, conflicts), horizontal === "start" ? gap : (a, b) => gap(b, a));
			return {
				horizontal,
				centres: horizontal === "start" ? centres : new Map([...centres].map(([node, x]) => [node, -x]))
			};
		}));
		const nodes = order.flat();
		const extent = (centres) => ({
			start: Math.min(...nodes.map((node) => centres.get(node) - size(node) / 2)),
			end: Math.max(...nodes.map((node) => centres.get(node) + size(node) / 2))
		});
		const narrowest = extent(layouts.reduce((best, layout) => {
			const width = (centres) => extent(centres).end - extent(centres).start;
			return width(layout.centres) < width(best.centres) ? layout : best;
		}).centres);
		const aligned = layouts.map(({ horizontal, centres }) => {
			const shift = horizontal === "start" ? narrowest.start - extent(centres).start : narrowest.end - extent(centres).end;
			return new Map([...centres].map(([node, x]) => [node, x + shift]));
		});
		return new Map(nodes.map((node) => {
			const values = aligned.map((centres) => centres.get(node)).sort((a, b) => a - b);
			return [node, (values[1] + values[2]) / 2];
		}));
	};
	//#endregion
	//#region src/shapes/shape-layout.ts
	var EMUS_PER_PIXEL$4 = 9525;
	var LABEL_CLEARANCE = 8 * EMUS_PER_PIXEL$4;
	var ORDERING_PASSES = 24;
	var SIDE_WEIGHT = .5;
	var checkSpacing = (value, option) => {
		if (!(value >= 0)) throw new Error(`Invalid layout ${option} ${value}. Expected a number of pixels, 0 or more`);
		return value * EMUS_PER_PIXEL$4;
	};
	var normalize = (positions) => {
		const left = Math.min(...positions.map(({ x }) => x));
		const top = Math.min(...positions.map(({ y }) => y));
		return positions.map(({ x, y }) => ({
			x: x - left,
			y: y - top
		}));
	};
	var turn = (direction = "down") => {
		const vertical = direction === "down" || direction === "up";
		const mirror = direction === "up" || direction === "left" ? -1 : 1;
		return {
			across: (item) => vertical ? item.width : item.height,
			along: (item) => vertical ? item.height : item.width,
			item: (acrossLength, alongLength) => vertical ? {
				width: acrossLength,
				height: alongLength
			} : {
				width: alongLength,
				height: acrossLength
			},
			place: (positions, items) => normalize(positions.map(({ across, along }, index) => {
				const length = vertical ? items[index].height : items[index].width;
				const main = mirror > 0 ? along : -along - length;
				return vertical ? {
					x: across,
					y: main
				} : {
					x: main,
					y: across
				};
			}))
		};
	};
	/**
	* The start of each level along the direction the levels run in, from the length of the longest item on each level.
	*
	* @param spacing - The space after each level, or the same space after every level
	*/
	var levelStarts = (thickness, spacing) => thickness.reduce((starts, _, index) => index === 0 ? [0] : [...starts, starts[index - 1] + thickness[index - 1] + (typeof spacing === "number" ? spacing : spacing[index - 1])], []);
	/**
	* The space after each level: the level spacing, or more where a connector to the next level has a label that needs it.
	*/
	var spacingAfterLevels = (levelCount, levelSpacing, levelOf, edges) => range(levelCount).map((level) => Math.max(levelSpacing, ...edges.filter(({ from, to, labelLength }) => labelLength !== void 0 && levelOf(from) === level && levelOf(to) === level + 1).map(({ labelLength }) => labelLength + 2 * LABEL_CLEARANCE)));
	var range = (length, from = 0) => Array.from({ length: Math.max(0, length) }, (_, index) => from + index);
	var mean$1 = (values) => values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : void 0;
	/**
	* Finds the connectors that lead back to a shape the flow has already passed, by a depth-first search from the shapes
	* in the order they are given. Leaving them out leaves no cycles.
	*
	* @returns The indexes of the connectors that lead back
	*/
	var findBackEdges = (count, edges) => {
		const visit = (node, open, search) => {
			const visited = edges.reduce((current, edge, index) => {
				if (edge.from !== node) return current;
				if (open.has(edge.to)) return _objectSpread2(_objectSpread2({}, current), {}, { back: /* @__PURE__ */ new Set([...current.back, index]) });
				return current.done.has(edge.to) ? current : visit(edge.to, /* @__PURE__ */ new Set([...open, edge.to]), current);
			}, search);
			return _objectSpread2(_objectSpread2({}, visited), {}, { done: /* @__PURE__ */ new Set([...visited.done, node]) });
		};
		return range(count).reduce((search, node) => search.done.has(node) ? search : visit(node, /* @__PURE__ */ new Set([node]), search), {
			done: /* @__PURE__ */ new Set(),
			back: /* @__PURE__ */ new Set()
		}).back;
	};
	/**
	* Puts each shape on the level after the furthest shape that connects to it. A shape that only connects onwards
	* is moved down to the level just before the nearest shape it connects to.
	*
	* @param edges - Connectors without cycles
	*/
	var assignLevels = (count, edges) => {
		const before = range(count).map((node) => edges.filter(({ to }) => to === node).map(({ from }) => from));
		const after = range(count).map((node) => edges.filter(({ from }) => from === node).map(({ to }) => to));
		const settle = (current, rounds) => {
			const next = current.map((_, node) => Math.max(0, ...before[node].map((previous) => current[previous] + 1)));
			return rounds === 0 || next.every((level, node) => level === current[node]) ? next : settle(next, rounds - 1);
		};
		const levels = settle(new Array(count).fill(0), count);
		return levels.map((level, node) => before[node].length === 0 && after[node].length > 0 ? Math.min(...after[node].map((next) => levels[next])) - 1 : level);
	};
	var countCrossings = (upper, lower, edges) => {
		const upperIndex = new Map(upper.map((node, index) => [node, index]));
		const lowerIndex = new Map(lower.map((node, index) => [node, index]));
		const between = edges.filter(({ from, to }) => upperIndex.has(from) && lowerIndex.has(to)).map(({ from, to }) => [upperIndex.get(from), lowerIndex.get(to)]);
		return between.reduce((total, [a, b], index) => total + between.slice(index + 1).filter(([c, d]) => (a - c) * (b - d) < 0).length, 0);
	};
	/**
	* How many shapes are on the wrong side of their siblings: a shape that a connector leaves the side of its parent
	* for, placed on the other side of a shape the parent leads to without one.
	*/
	var countMisplaced = (upper, lower, edges) => {
		const lowerIndex = new Map(lower.map((node, index) => [node, index]));
		return upper.reduce((total, parent) => {
			const children = edges.filter(({ from, to }) => from === parent && lowerIndex.has(to));
			return total + children.reduce((count, child) => count + children.filter((other) => {
				var _child$across, _other$across;
				return ((_child$across = child.across) !== null && _child$across !== void 0 ? _child$across : 0) > ((_other$across = other.across) !== null && _other$across !== void 0 ? _other$across : 0) && lowerIndex.get(child.to) < lowerIndex.get(other.to);
			}).length, 0);
		}, 0);
	};
	/**
	* Orders the shapes on each level to reduce crossings: passes go down and up in turn, sorting each level by the
	* average position of the shapes it connects to on the level just done (the barycenter method). A connector that
	* leaves the side of a shape moves the shape it leads to that way. The order with the fewest crossings, then the
	* fewest shapes on the wrong side of their siblings, is kept. The shapes in each lane stay together.
	*/
	var orderLevels = (start, links, laneOf) => {
		const levelCount = start.length;
		const score = (order) => order.slice(1).reduce((total, lower, index) => ({
			crossings: total.crossings + countCrossings(order[index], lower, links),
			misplaced: total.misplaced + countMisplaced(order[index], lower, links)
		}), {
			crossings: 0,
			misplaced: 0
		});
		const sortLevel = (order, level, down) => {
			const fixed = new Map(order[down ? level - 1 : level + 1].map((node, index) => [node, index]));
			const sorted = [...order[level].map((node, index) => {
				var _mean;
				return {
					node,
					weight: (_mean = mean$1(links.filter((link) => down ? link.to === node && fixed.has(link.from) : link.from === node && fixed.has(link.to)).map((link) => {
						var _link$across;
						return fixed.get(down ? link.from : link.to) + (down ? 1 : -1) * ((_link$across = link.across) !== null && _link$across !== void 0 ? _link$across : 0) * SIDE_WEIGHT;
					}))) !== null && _mean !== void 0 ? _mean : index
				};
			})].sort((a, b) => laneOf(a.node) - laneOf(b.node) || a.weight - b.weight).map(({ node }) => node);
			return order.map((nodes, index) => index === level ? sorted : nodes);
		};
		return range(ORDERING_PASSES).reduce((ordering, pass) => {
			if (ordering.crossings === 0 && ordering.misplaced === 0) return ordering;
			const down = pass % 2 === 0;
			const order = (down ? range(levelCount - 1, 1) : range(levelCount - 1).map((index) => levelCount - 2 - index)).reduce((current, level) => sortLevel(current, level, down), ordering.order);
			const { crossings, misplaced } = score(order);
			return crossings < ordering.crossings || crossings === ordering.crossings && misplaced < ordering.misplaced ? {
				order,
				best: order,
				crossings,
				misplaced
			} : _objectSpread2(_objectSpread2({}, ordering), {}, { order });
		}, _objectSpread2({
			order: start,
			best: start
		}, score(start))).best;
	};
	/**
	* Lays out a flow in levels (the Sugiyama method): leaves out connectors that lead back, puts the shapes on levels,
	* adds points for connectors that skip levels, orders each level to reduce crossings, then lines each shape up with
	* the shapes it connects to (the Brandes–Köpf method). Connectors that lead back are routed around the shapes
	* afterwards, so they don't take up room in the layout.
	*/
	/**
	* Places the shapes on each level across it: lined up with the shapes they connect to, and in lanes when the flow
	* has them. Each lane is as wide as its shapes, or its header, need, and the lanes are side by side.
	*
	* @returns Each node's centre across its level, and where each lane starts and how wide it is
	*/
	var placeAcross = (order, nodes, links, spacing, lanes) => {
		const place = (lane) => {
			const inLane = (node) => lane === void 0 || nodes[node].lane === lane;
			return assignLevelCoordinates({
				order: order.map((level) => level.filter(inLane)),
				links: links.filter(({ from, to }) => inLane(from) && inLane(to)).map(({ from, to, across: side }) => ({
					from,
					to,
					skipAlignment: side !== void 0
				})),
				sizes: new Map(nodes.map(({ size }, node) => [node, size])),
				points: new Set(range(nodes.length).filter((node) => nodes[node].isPoint)),
				spacing
			});
		};
		if (!lanes) return {
			centres: place(),
			lanes: []
		};
		const placed = range(lanes.count).map((lane) => {
			var _lanes$widths$lane;
			const centres = place(lane);
			const edges = [...centres].flatMap(([node, centre]) => [centre - nodes[node].size / 2, centre + nodes[node].size / 2]);
			const low = edges.length > 0 ? Math.min(...edges) : 0;
			const high = edges.length > 0 ? Math.max(...edges) : 0;
			return {
				centres,
				low,
				high,
				width: Math.max(high - low + spacing, (_lanes$widths$lane = lanes.widths[lane]) !== null && _lanes$widths$lane !== void 0 ? _lanes$widths$lane : 0)
			};
		});
		const starts = levelStarts(placed.map(({ width }) => width), 0);
		return {
			centres: new Map(placed.flatMap(({ centres, low, high, width }, lane) => [...centres].map(([node, centre]) => [node, starts[lane] + (width - (high - low)) / 2 + centre - low]))),
			lanes: placed.map(({ width }, lane) => ({
				start: starts[lane],
				width
			}))
		};
	};
	/**
	* Lays out a flow in levels (the Sugiyama method): leaves out connectors that lead back, puts the shapes on levels,
	* adds points for connectors that skip levels, orders each level to reduce crossings, then lines each shape up with
	* the shapes it connects to (the Brandes–Köpf method). Connectors that lead back are routed around the shapes
	* afterwards, so they don't take up room in the layout.
	*
	* With lanes, the shapes in each lane stay together on each level, and the lanes' headers come before the first level.
	*/
	var layoutFlow = (layout, items, allEdges, headers) => {
		var _layout$spacing, _layout$levelSpacing, _layout$lanes$length, _layout$lanes;
		const spacing = checkSpacing((_layout$spacing = layout.spacing) !== null && _layout$spacing !== void 0 ? _layout$spacing : 40, "spacing");
		const levelSpacing = checkSpacing((_layout$levelSpacing = layout.levelSpacing) !== null && _layout$levelSpacing !== void 0 ? _layout$levelSpacing : 50, "levelSpacing");
		const { across, along, place, item: turnedItem } = turn(layout.direction);
		const backEdges = findBackEdges(items.length, allEdges);
		const edges = allEdges.filter((_, index) => !backEdges.has(index));
		const levels = assignLevels(items.length, edges);
		const lowest = Math.min(...levels);
		const laneCount = (_layout$lanes$length = (_layout$lanes = layout.lanes) === null || _layout$lanes === void 0 ? void 0 : _layout$lanes.length) !== null && _layout$lanes$length !== void 0 ? _layout$lanes$length : 0;
		const { nodes, links } = edges.reduce((graph, { from, to, across: side }) => {
			const skipped = range(graph.nodes[to].level - graph.nodes[from].level - 1, graph.nodes[from].level + 1).map((level) => ({
				level,
				size: 0,
				isPoint: true,
				lane: graph.nodes[from].lane
			}));
			const path = [
				from,
				...skipped.map((_, index) => graph.nodes.length + index),
				to
			];
			return {
				nodes: [...graph.nodes, ...skipped],
				links: [...graph.links, ...path.slice(1).map((node, index) => ({
					from: path[index],
					to: node,
					across: index === 0 ? side : void 0
				}))]
			};
		}, {
			nodes: items.map((item, index) => {
				var _item$lane;
				return {
					level: levels[index] - lowest,
					size: across(item),
					isPoint: false,
					lane: (_item$lane = item.lane) !== null && _item$lane !== void 0 ? _item$lane : 0
				};
			}),
			links: []
		});
		const levelCount = Math.max(...nodes.map(({ level }) => level)) + 1;
		const { centres, lanes } = placeAcross(orderLevels(range(levelCount).map((level) => range(nodes.length).filter((node) => nodes[node].level === level).sort((a, b) => nodes[a].lane - nodes[b].lane)), links, (node) => nodes[node].lane), nodes, links, spacing, laneCount > 0 ? {
			count: laneCount,
			widths: headers.widths
		} : void 0);
		const thickness = range(levelCount).map((level) => Math.max(0, ...items.map((item, index) => nodes[index].level === level ? along(item) : 0)));
		const before = laneCount > 0 ? headers.length + levelSpacing / 2 : 0;
		const starts = levelStarts(thickness, spacingAfterLevels(levelCount, levelSpacing, (item) => nodes[item].level, edges)).map((start) => start + before);
		const total = starts[levelCount - 1] + thickness[levelCount - 1] + levelSpacing / 2;
		const bands = lanes.flatMap(({ start, width }) => [{
			across: start,
			along: 0,
			item: turnedItem(width, total)
		}, {
			across: start,
			along: 0,
			item: turnedItem(width, headers.length)
		}]);
		const placed = place([...items.map((item, index) => ({
			across: centres.get(index) - across(item) / 2,
			along: starts[nodes[index].level] + (thickness[nodes[index].level] - along(item)) / 2
		})), ...bands.map(({ across: bandAcross, along: bandAlong }) => ({
			across: bandAcross,
			along: bandAlong
		}))], [...items, ...bands.map(({ item }) => item)]);
		const boxes = bands.map(({ item }, index) => _objectSpread2(_objectSpread2({}, placed[items.length + index]), {}, {
			width: item.width,
			height: item.height
		}));
		return {
			positions: placed.slice(0, items.length),
			levels: items.map((_, index) => nodes[index].level),
			lanes: laneCount > 0 ? lanes.map((_, lane) => ({
				band: boxes[2 * lane],
				header: boxes[2 * lane + 1]
			})) : void 0
		};
	};
	var shiftContour = (contour, by) => contour.map(({ left, right }) => ({
		left: left + by,
		right: right + by
	}));
	var mergeContours = (a, b) => range(Math.max(a.length, b.length)).map((level) => {
		var _a$level$left, _a$level, _b$level$left, _b$level, _a$level$right, _a$level2, _b$level$right, _b$level2;
		return {
			left: Math.min((_a$level$left = (_a$level = a[level]) === null || _a$level === void 0 ? void 0 : _a$level.left) !== null && _a$level$left !== void 0 ? _a$level$left : Infinity, (_b$level$left = (_b$level = b[level]) === null || _b$level === void 0 ? void 0 : _b$level.left) !== null && _b$level$left !== void 0 ? _b$level$left : Infinity),
			right: Math.max((_a$level$right = (_a$level2 = a[level]) === null || _a$level2 === void 0 ? void 0 : _a$level2.right) !== null && _a$level$right !== void 0 ? _a$level$right : -Infinity, (_b$level$right = (_b$level2 = b[level]) === null || _b$level2 === void 0 ? void 0 : _b$level2.right) !== null && _b$level$right !== void 0 ? _b$level$right : -Infinity)
		};
	});
	/**
	* Places subtrees side by side, each as near the one before it as their contours allow.
	*
	* @returns Each subtree's centre, from the first one's, and the contour of them all
	*/
	var packSubtrees = (subtrees, spacing) => subtrees.reduce((packed, subtree, index) => {
		if (index === 0) return {
			positions: [0],
			contour: subtree.contour
		};
		const shift = Math.max(...subtree.contour.slice(0, packed.contour.length).map(({ left }, level) => packed.contour[level].right - left + spacing));
		return {
			positions: [...packed.positions, shift],
			contour: mergeContours(packed.contour, shiftContour(subtree.contour, shift))
		};
	}, {
		positions: [],
		contour: []
	});
	/**
	* Lays out a tree (the Reingold–Tilford method, with shapes of different sizes): each subtree is laid out on its own,
	* then the subtrees are packed as close as their outlines allow, and their parent is centred over them.
	*/
	var layoutTree = (layout, items, edges) => {
		var _layout$spacing2, _layout$levelSpacing2;
		const spacing = checkSpacing((_layout$spacing2 = layout.spacing) !== null && _layout$spacing2 !== void 0 ? _layout$spacing2 : 20, "spacing");
		const levelSpacing = checkSpacing((_layout$levelSpacing2 = layout.levelSpacing) !== null && _layout$levelSpacing2 !== void 0 ? _layout$levelSpacing2 : 40, "levelSpacing");
		const { across, along, place } = turn(layout.direction);
		const isAncestor = (links, node, of) => of !== void 0 && (of === node || isAncestor(links, node, links[of]));
		const parents = edges.reduce((current, { from, to }) => current[to] === void 0 && !isAncestor(current, to, from) ? current.map((parent, node) => node === to ? from : parent) : current, new Array(items.length).fill(void 0));
		const childrenOf = (node) => edges.map(({ to }) => to).filter((to, index, all) => parents[to] === node && all.indexOf(to) === index);
		const layoutSubtree = (node, depth) => {
			const size = across(items[node]);
			const own = [{
				left: -size / 2,
				right: size / 2
			}];
			const children = childrenOf(node).map((child) => layoutSubtree(child, depth + 1));
			const { positions: childCentres, contour } = packSubtrees(children, spacing);
			const middle = children.length === 0 ? 0 : (childCentres[0] + childCentres[childCentres.length - 1]) / 2;
			return {
				centres: new Map([[node, 0], ...children.flatMap((subtree, index) => [...subtree.centres].map(([descendant, centre]) => [descendant, centre + childCentres[index] - middle]))]),
				depths: new Map([[node, depth], ...children.flatMap((subtree) => [...subtree.depths])]),
				contour: [...own, ...shiftContour(contour, -middle)]
			};
		};
		const trees = range(items.length).filter((node) => parents[node] === void 0).map((root) => layoutSubtree(root, 0));
		const { positions } = packSubtrees(trees, spacing);
		const centres = new Map(trees.flatMap((tree, index) => [...tree.centres].map(([node, centre]) => [node, centre + positions[index]])));
		const depths = range(items.length).map((node) => trees.map((tree) => tree.depths.get(node)).find((depth) => depth !== void 0));
		const thickness = range(Math.max(...depths) + 1).map((level) => Math.max(0, ...items.map((item, index) => depths[index] === level ? along(item) : 0)));
		const starts = levelStarts(thickness, spacingAfterLevels(thickness.length, levelSpacing, (item) => depths[item], edges));
		return {
			positions: place(items.map((item, index) => ({
				across: centres.get(index) - across(item) / 2,
				along: starts[depths[index]]
			})), items),
			levels: depths
		};
	};
	/**
	* Lays out a grid: each column is as wide as its widest shape and each row as tall as its tallest, and each shape
	* is centred in its cell.
	*/
	var layoutGrid = (layout, items) => {
		var _layout$spacing3, _layout$columns;
		const spacing = checkSpacing((_layout$spacing3 = layout.spacing) !== null && _layout$spacing3 !== void 0 ? _layout$spacing3 : 40, "spacing");
		const columns = (_layout$columns = layout.columns) !== null && _layout$columns !== void 0 ? _layout$columns : Math.ceil(Math.sqrt(items.length));
		if (!(Number.isInteger(columns) && columns >= 1)) throw new Error(`Invalid layout columns ${columns}. Expected a whole number, 1 or more`);
		const rows = Math.ceil(items.length / columns);
		const widths = range(columns).map((column) => Math.max(0, ...items.filter((_, index) => index % columns === column).map(({ width }) => width)));
		const heights = range(rows).map((row) => Math.max(0, ...items.slice(row * columns, (row + 1) * columns).map(({ height }) => height)));
		const lefts = levelStarts(widths, spacing);
		const tops = levelStarts(heights, spacing);
		return { positions: items.map(({ width, height }, index) => {
			const column = index % columns;
			const row = Math.floor(index / columns);
			return {
				x: lefts[column] + (widths[column] - width) / 2,
				y: tops[row] + (heights[row] - height) / 2
			};
		}) };
	};
	/**
	* Places items with a layout, starting at (0, 0).
	*
	* @param items - The boxes to place, in EMUs
	* @param edges - The connectors between them, which flow and tree layouts follow
	* @param headers - How big the headers of a flow's lanes are
	* @returns The top-left corner of each item's box, in EMUs, the level each is on in a flow or tree, and the boxes of a
	* flow's lanes
	* @throws If a spacing is negative, or a grid's number of columns isn't a whole number of 1 or more
	*/
	var layoutItems = (layout, items, edges, headers = {
		length: 0,
		widths: []
	}) => {
		if (items.length === 0) return { positions: [] };
		const links = edges.filter(({ from, to }, index) => from !== to && edges.findIndex((edge) => edge.from === from && edge.to === to) === index);
		switch (layout.type) {
			case "flow": return layoutFlow(layout, items, links, headers);
			case "tree": return layoutTree(layout, items, links);
			default: return layoutGrid(layout, items);
		}
	};
	//#endregion
	//#region src/shapes/shape-run-data.ts
	/**
	* Helpers shared by ShapeRun and ShapeGroupRun. Not part of the public API.
	*
	* @module
	*/
	/**
	* Maps shape options to the data used to write a `wps:wsp` element.
	*
	* @param styles - The document's styles, which `text` is written to suit
	*/
	var createPresetShapeData = (options, styles) => {
		var _options$children;
		return {
			geometry: options.type === "custom" ? {
				type: "custom",
				path: options.path,
				paths: options.paths,
				textArea: options.textArea,
				connectionPoints: options.connectionPoints
			} : {
				type: options.type,
				adjustments: options.adjustments
			},
			fill: options.fill,
			line: options.line,
			effects: options.effects,
			children: options.text === void 0 ? options.children : [...createTextParagraphs(options.text, styles), ...(_options$children = options.children) !== null && _options$children !== void 0 ? _options$children : []],
			textOptions: options.textOptions
		};
	};
	/**
	* The options of a drawing that don't depend on its layout, with the drawing's id. The id is given now, so a drawing
	* that is laid out again when it is written keeps it.
	*/
	var createDrawingProperties = ({ floating, altText, link, decorative }) => {
		var _altText$id;
		return {
			floating,
			docProperties: _objectSpread2(_objectSpread2({}, altText !== null && altText !== void 0 ? altText : {
				name: "",
				description: "",
				title: ""
			}), {}, { id: (_altText$id = altText === null || altText === void 0 ? void 0 : altText.id) !== null && _altText$id !== void 0 ? _altText$id : `${(0, docx.docPropertiesUniqueNumericId)()}` }),
			link,
			decorative
		};
	};
	/**
	* An effect extent reaching the same distance past every side of a drawing.
	*/
	var createUniformEffectExtent = (overhang) => ({
		top: overhang,
		right: overhang,
		bottom: overhang,
		left: overhang
	});
	var EMUS_PER_PIXEL$3 = 9525;
	/**
	* How far, in EMUs, a shape's line, arrowheads and effects reach past each side of its box, before it is rotated.
	*/
	var getShapeOverhang = ({ line, effects, transformation }) => {
		const lineOverhang = getShapeLineOverhang(line);
		const effectsOverhang = getShapeEffectsOverhang(effects, transformation.height * EMUS_PER_PIXEL$3, transformation.rotation);
		return {
			top: lineOverhang + effectsOverhang.top,
			right: lineOverhang + effectsOverhang.right,
			bottom: lineOverhang + effectsOverhang.bottom,
			left: lineOverhang + effectsOverhang.left
		};
	};
	/**
	* How far, in EMUs, a shape reaches past each side of its box: the corners of a rotated shape,
	* and its line, arrowheads and effects. As in Word, this is the drawing's `wp:effectExtent`.
	*/
	var getShapeEffectExtent = (options) => {
		const overhang = getShapeOverhang(options);
		const { width, height, rotation = 0 } = options.transformation;
		const radians = rotation * Math.PI / 180;
		const cos = Math.abs(Math.cos(radians));
		const sin = Math.abs(Math.sin(radians));
		const growX = Math.max(0, Math.ceil((width * cos + height * sin - width) * EMUS_PER_PIXEL$3 / 2));
		const growY = Math.max(0, Math.ceil((width * sin + height * cos - height) * EMUS_PER_PIXEL$3 / 2));
		return {
			top: overhang.top + growY,
			right: overhang.right + growX,
			bottom: overhang.bottom + growY,
			left: overhang.left + growX
		};
	};
	//#endregion
	//#region src/shapes/shape-drawing.ts
	/**
	* Lays out the children of a ShapeGroupRun or ShapeCanvasRun: positions the shapes, pictures and groups inside it,
	* gives each one a drawing id and a name, and routes the connectors between them. Not part of the public API.
	*
	* @module
	*/
	var EMUS_PER_PIXEL$2 = 9525;
	var PIXELS_PER_POINT = 4 / 3;
	var DEFAULT_CONNECTOR_MARGIN = 24;
	var LABEL_PADDING = {
		width: 8,
		height: 4
	};
	var LABEL_GAP = 4;
	var LABEL_STEP = 4;
	var CHANNEL_SPACING = 6;
	var LANE_LINE = {
		color: "A5A5A5",
		width: .75
	};
	var LANE_HEADER_FILL = "F2F2F2";
	var SIDE_ANGLES = {
		right: 0,
		bottom: 90,
		left: 180,
		top: 270
	};
	var IDENTITY = {
		a: 1,
		b: 0,
		c: 0,
		d: 1,
		e: 0,
		f: 0
	};
	var compose = (second, first) => ({
		a: second.a * first.a + second.c * first.b,
		b: second.b * first.a + second.d * first.b,
		c: second.a * first.c + second.c * first.d,
		d: second.b * first.c + second.d * first.d,
		e: second.a * first.e + second.c * first.f + second.e,
		f: second.b * first.e + second.d * first.f + second.f
	});
	var translation = (x, y) => _objectSpread2(_objectSpread2({}, IDENTITY), {}, {
		e: x,
		f: y
	});
	var scaling = (x, y) => _objectSpread2(_objectSpread2({}, IDENTITY), {}, {
		a: x,
		d: y
	});
	var rotation = (degrees) => {
		const radians = degrees * Math.PI / 180;
		return {
			a: Math.cos(radians),
			b: Math.sin(radians),
			c: -Math.sin(radians),
			d: Math.cos(radians),
			e: 0,
			f: 0
		};
	};
	var transformPoint = ({ a, b, c, d, e, f }, { x, y }) => ({
		x: a * x + c * y + e,
		y: b * x + d * y + f
	});
	var transformAngle = ({ a, b, c, d }, angle) => {
		const radians = angle * Math.PI / 180;
		return Math.atan2(b * Math.cos(radians) + d * Math.sin(radians), a * Math.cos(radians) + c * Math.sin(radians)) * 180 / Math.PI;
	};
	/**
	* Places something of the box's size: flips it about its centre, rotates it about its centre, then moves it into the box.
	*/
	var placement = (box, degrees = 0, flip) => [
		translation(-box.width / 2, -box.height / 2),
		scaling((flip === null || flip === void 0 ? void 0 : flip.horizontal) ? -1 : 1, (flip === null || flip === void 0 ? void 0 : flip.vertical) ? -1 : 1),
		rotation(degrees),
		translation(box.x + box.width / 2, box.y + box.height / 2)
	].reduce((matrix, step) => compose(step, matrix), IDENTITY);
	var boundsOf = (points) => ({
		left: Math.min(...points.map(({ x }) => x)),
		top: Math.min(...points.map(({ y }) => y)),
		right: Math.max(...points.map(({ x }) => x)),
		bottom: Math.max(...points.map(({ y }) => y))
	});
	var union = (all) => ({
		left: Math.min(...all.map(({ left }) => left)),
		top: Math.min(...all.map(({ top }) => top)),
		right: Math.max(...all.map(({ right }) => right)),
		bottom: Math.max(...all.map(({ bottom }) => bottom))
	});
	var cornersOf = ({ left, top, right, bottom }) => [
		{
			x: left,
			y: top
		},
		{
			x: right,
			y: top
		},
		{
			x: right,
			y: bottom
		},
		{
			x: left,
			y: bottom
		}
	];
	var transformBounds = (matrix, bounds) => boundsOf(cornersOf(bounds).map((corner) => transformPoint(matrix, corner)));
	var expand = (bounds, extent) => ({
		left: bounds.left - extent.left,
		top: bounds.top - extent.top,
		right: bounds.right + extent.right,
		bottom: bounds.bottom + extent.bottom
	});
	var uniformExtent = (overhang) => ({
		top: overhang,
		right: overhang,
		bottom: overhang,
		left: overhang
	});
	var boundsOfBox = ({ x, y, width, height }) => ({
		left: x,
		top: y,
		right: x + width,
		bottom: y + height
	});
	var offsetOf = (offset) => {
		var _offset$left, _offset$top;
		return offset && {
			x: Math.round(((_offset$left = offset.left) !== null && _offset$left !== void 0 ? _offset$left : 0) * EMUS_PER_PIXEL$2),
			y: Math.round(((_offset$top = offset.top) !== null && _offset$top !== void 0 ? _offset$top : 0) * EMUS_PER_PIXEL$2)
		};
	};
	var boxAt = (position, { width, height }) => _objectSpread2(_objectSpread2({}, position), {}, {
		width: Math.round(width * EMUS_PER_PIXEL$2),
		height: Math.round(height * EMUS_PER_PIXEL$2)
	});
	var leafBounds = ({ matrix, width, height }) => transformBounds(matrix, {
		left: 0,
		top: 0,
		right: width,
		bottom: height
	});
	var centreOf = ({ left, top, right, bottom }) => ({
		x: (left + right) / 2,
		y: (top + bottom) / 2
	});
	var overlaps = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
	var overlapArea = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
	var shrink = ({ left, top, right, bottom }, by) => ({
		left: left + by,
		top: top + by,
		right: right - by,
		bottom: bottom - by
	});
	var transformDirection = ({ a, b, c, d }, { x, y }) => ({
		x: a * x + c * y,
		y: b * x + d * y
	});
	/**
	* A name for a shape, as Word gives them: what it is, then its drawing id, such as "Rounded Rectangle 4".
	*/
	var defaultName = (kind, drawingId) => `${kind.replace(/([a-z\d])([A-Z])/g, "$1 $2").replace(/^./, (first) => first.toUpperCase())} ${drawingId}`;
	var createNonVisualDrawingProperties = (drawingId, kind, { altText, link, decorative }) => {
		var _altText$name;
		return {
			id: drawingId,
			name: (_altText$name = altText === null || altText === void 0 ? void 0 : altText.name) !== null && _altText$name !== void 0 ? _altText$name : defaultName(kind, drawingId),
			description: altText === null || altText === void 0 ? void 0 : altText.description,
			title: altText === null || altText === void 0 ? void 0 : altText.title,
			link,
			decorative
		};
	};
	var sideMiddles = (width, height) => [
		{
			x: width / 2,
			y: 0,
			angle: 270
		},
		{
			x: 0,
			y: height / 2,
			angle: 180
		},
		{
			x: width / 2,
			y: height,
			angle: 90
		},
		{
			x: width,
			y: height / 2,
			angle: 0
		}
	];
	var allSides = (width, height) => ({
		top: [0, width],
		right: [0, height],
		bottom: [0, width],
		left: [0, height]
	});
	var roundedSides = (width, height, radius) => ({
		top: [radius, width - radius],
		right: [radius, height - radius],
		bottom: [radius, width - radius],
		left: [radius, height - radius]
	});
	/**
	* The straight parts of the sides of shapes whose sides are mostly straight, from their preset definitions. Other
	* shapes have none, and connectors that meet them at the same connection site stay together.
	*/
	var straightSidesOf = (options, width, height) => {
		switch (options.type) {
			case "rectangle":
			case "flowChartProcess":
			case "flowChartPredefinedProcess":
			case "flowChartInternalStorage": return allSides(width, height);
			case "roundedRectangle":
				var _createShapeGuides$ad;
				return roundedSides(width, height, Math.min(width, height) * ((_createShapeGuides$ad = createShapeGuides(options.type, options.adjustments).adj) !== null && _createShapeGuides$ad !== void 0 ? _createShapeGuides$ad : 16667) / 1e5);
			case "flowChartAlternateProcess": return roundedSides(width, height, Math.min(width, height) / 6);
			case "flowChartTerminator": {
				const end = width * 3475 / 21600;
				return {
					top: [end, width - end],
					bottom: [end, width - end]
				};
			}
			case "flowChartDocument": return {
				top: [0, width],
				right: [0, height * 17322 / 21600],
				left: [0, height * 20172 / 21600]
			};
			default: return {};
		}
	};
	/**
	* A shape's connection sites, numbered as OOXML numbers them (`a:stCxn/@idx`).
	*/
	var shapeSites = (options, width, height) => {
		return (options.type === "custom" ? createCustomGeometryData(options, width, height).sites : getConnectionSites(options.type, width, height, createShapeGuides(options.type, options.adjustments))).map((site, index) => _objectSpread2(_objectSpread2({}, site), {}, { index }));
	};
	/**
	* Gives the band and header of each lane of a layout drawing ids.
	*/
	var assignLaneIds = (layout) => {
		var _layout$lanes;
		return (layout === null || layout === void 0 ? void 0 : layout.type) === "flow" ? ((_layout$lanes = layout.lanes) !== null && _layout$lanes !== void 0 ? _layout$lanes : []).map(() => [(0, docx.docPropertiesUniqueNumericId)(), (0, docx.docPropertiesUniqueNumericId)()]) : [];
	};
	/**
	* Gives every shape, picture, group, connector and label a drawing id, in the order they are written.
	*/
	var assignIds = (children) => children.map((options) => {
		switch (options.type) {
			case "connector": return {
				kind: "connector",
				options,
				drawingId: (0, docx.docPropertiesUniqueNumericId)(),
				labelId: options.label ? (0, docx.docPropertiesUniqueNumericId)() : void 0
			};
			case "picture": return {
				kind: "picture",
				options,
				drawingId: (0, docx.docPropertiesUniqueNumericId)()
			};
			case "group": return {
				kind: "group",
				options,
				drawingId: (0, docx.docPropertiesUniqueNumericId)(),
				laneIds: assignLaneIds(options.layout),
				children: assignIds(options.children)
			};
			default: return {
				kind: "shape",
				options,
				drawingId: (0, docx.docPropertiesUniqueNumericId)()
			};
		}
	});
	/**
	* The `id` of every shape and picture in the drawing.
	*
	* @throws If two shapes or pictures have the same `id`
	*/
	var idsOf = (node) => {
		if (node.kind === "group") return node.children.flatMap(idsOf);
		return node.kind !== "connector" && node.options.id !== void 0 ? [node.options.id] : [];
	};
	var collectIds = (nodes) => {
		const ids = nodes.flatMap(idsOf);
		const repeated = ids.find((id, index) => ids.indexOf(id) !== index);
		if (repeated !== void 0) throw new Error(`Invalid shape id "${repeated}". Each shape in a group or canvas needs a different id`);
		return new Set(ids);
	};
	/**
	* Places a shape with its box's top-left corner at `position`.
	*
	* @param transformation - The shape's transformation, with its size worked out if it fits its text
	*/
	var layoutShape = (options, transformation, drawingId, position, styles) => {
		const { rotation: degrees, flip } = transformation;
		const box = boxAt(position, transformation);
		const matrix = placement(box, degrees, flip);
		const sites = shapeSites(options, box.width, box.height);
		const leaf = {
			id: options.id,
			drawingId,
			width: box.width,
			height: box.height,
			sites: sites.length > 0 ? sites : sideMiddles(box.width, box.height),
			matrix,
			straightSides: straightSidesOf(options, box.width, box.height)
		};
		const kind = options.type === "custom" ? "freeform" : options.type;
		return {
			placed: {
				child: {
					type: "wps",
					box,
					rotation: degrees,
					flip,
					data: _objectSpread2(_objectSpread2({}, createPresetShapeData(options, styles)), {}, { nonVisualDrawingProperties: createNonVisualDrawingProperties(drawingId, kind, options) })
				},
				box: boundsOfBox(box),
				reach: expand(leafBounds(leaf), getShapeOverhang(_objectSpread2(_objectSpread2({}, options), {}, { transformation })))
			},
			leaves: [leaf]
		};
	};
	var layoutPicture = (options, drawingId, position) => {
		const { rotation: degrees, flip } = options.transformation;
		const box = boxAt(position, options.transformation);
		const leaf = {
			id: options.id,
			drawingId,
			width: box.width,
			height: box.height,
			sites: getConnectionSites("rectangle", box.width, box.height).map((site, index) => _objectSpread2(_objectSpread2({}, site), {}, { index })),
			matrix: placement(box, degrees, flip),
			straightSides: allSides(box.width, box.height)
		};
		const lineOverhang = options.line ? getShapeLineOverhang(options.line) : 0;
		const effectsOverhang = getShapeEffectsOverhang(options.effects, box.height, degrees);
		return {
			placed: {
				child: {
					type: "picture",
					box,
					rotation: degrees,
					flip,
					data: {
						image: options.image,
						crop: options.crop,
						line: options.line,
						effects: options.effects,
						nonVisualDrawingProperties: createNonVisualDrawingProperties(drawingId, "picture", options)
					}
				},
				box: boundsOfBox(box),
				reach: expand(leafBounds(leaf), {
					top: lineOverhang + effectsOverhang.top,
					right: lineOverhang + effectsOverhang.right,
					bottom: lineOverhang + effectsOverhang.bottom,
					left: lineOverhang + effectsOverhang.left
				})
			},
			leaves: [leaf]
		};
	};
	/**
	* The side of `from` that faces `to`.
	*/
	var facingSide = (from, to) => {
		const a = centreOf(from);
		const b = centreOf(to);
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "right" : "left";
		return dy >= 0 ? "bottom" : "top";
	};
	var angleBetween = (a, b) => {
		const difference = ((a - b) % 360 + 360) % 360;
		return Math.min(difference, 360 - difference);
	};
	var toPageSite = (leaf, { x, y, angle, index }) => ({
		point: transformPoint(leaf.matrix, {
			x,
			y
		}),
		angle: transformAngle(leaf.matrix, angle),
		index
	});
	/**
	* The connection site on a side of a shape: the one facing most nearly that way, then the one
	* furthest out on that side, then the one nearest the middle of the side.
	*/
	var pickSite = (leaf, side) => {
		const sites = leaf.sites.map((site) => toPageSite(leaf, site));
		const angle = SIDE_ANGLES[side];
		const direction = {
			x: Math.round(Math.cos(angle * Math.PI / 180)),
			y: Math.round(Math.sin(angle * Math.PI / 180))
		};
		const centre = centreOf(leafBounds(leaf));
		const along = ({ point }) => (point.x - centre.x) * direction.x + (point.y - centre.y) * direction.y;
		const across = ({ point }) => Math.abs((point.x - centre.x) * direction.y - (point.y - centre.y) * direction.x);
		const isBetter = (site, best) => {
			const angleDifference = angleBetween(site.angle, angle) - angleBetween(best.angle, angle);
			if (Math.abs(angleDifference) > .01) return angleDifference < 0;
			const alongDifference = along(site) - along(best);
			return Math.abs(alongDifference) > 1 ? alongDifference > 0 : across(site) < across(best);
		};
		return sites.reduce((best, site) => isBetter(site, best) ? site : best);
	};
	/**
	* The connection site nearest a point given as percentages of the shape's width and height. A shape without
	* connection sites is connected at the point itself, leaving in the direction, right, down, left or up, that the
	* point is furthest from the shape's middle in.
	*/
	var pickNearestSite = (leaf, point) => {
		if (!(point.x >= 0 && point.x <= 100 && point.y >= 0 && point.y <= 100)) throw new Error(`Invalid connector point { x: ${point.x}, y: ${point.y} }. Expected percentages from 0 to 100`);
		const target = {
			x: point.x / 100 * leaf.width,
			y: point.y / 100 * leaf.height
		};
		const sites = leaf.sites.filter((site) => site.index !== void 0);
		if (sites.length === 0) return toPageSite(leaf, _objectSpread2(_objectSpread2({}, target), {}, { angle: outwardAngle(target.x, target.y, leaf.width, leaf.height) }));
		const distance = (site) => Math.hypot(site.x - target.x, site.y - target.y);
		return toPageSite(leaf, sites.reduce((nearest, site) => distance(site) < distance(nearest) ? site : nearest));
	};
	var pathLength = (points) => points.slice(1).reduce((total, point, index) => total + Math.hypot(point.x - points[index].x, point.y - points[index].y), 0);
	/**
	* The point a distance along a path, and the direction of the path there as a unit vector.
	*/
	var pointAlong = (points, distance) => {
		const segments = points.slice(1).map((end, index) => ({
			start: points[index],
			end,
			size: Math.hypot(end.x - points[index].x, end.y - points[index].y)
		})).filter(({ size }) => size > 0);
		if (segments.length === 0) return {
			point: points[0],
			direction: {
				x: 1,
				y: 0
			}
		};
		const directionOf = ({ start, end, size }) => ({
			x: (end.x - start.x) / size,
			y: (end.y - start.y) / size
		});
		const ends = segments.map((_, index) => segments.slice(0, index + 1).reduce((total, { size }) => total + size, 0));
		const within = Math.min(distance, ends[ends.length - 1]);
		const found = ends.findIndex((end) => within <= end);
		const segment = segments[found];
		const along = within - (ends[found] - segment.size);
		const direction = directionOf(segment);
		return {
			point: {
				x: segment.start.x + direction.x * along,
				y: segment.start.y + direction.y * along
			},
			direction
		};
	};
	/**
	* The paragraphs a label is written with: centred lines of text given as a string, or the paragraphs it is given.
	*/
	var labelParagraphs = (label, styles) => {
		const text = typeof label === "string" ? label : label.text;
		return typeof text === "string" ? createTextParagraphs(text, styles) : text;
	};
	/**
	* The size of a connector's label in pixels: as big as its text, unless it is given a size.
	*
	* @param paragraphs - The label's paragraphs, as they are written
	*/
	var labelSize = (label, paragraphs, styles) => {
		const { width, height } = typeof label === "string" ? {
			width: void 0,
			height: void 0
		} : label;
		const measured = width === void 0 || height === void 0 ? measureText(readTextParagraphs(paragraphs, styles)) : {
			width: 0,
			height: 0
		};
		return {
			width: width !== null && width !== void 0 ? width : Math.ceil(measured.width * PIXELS_PER_POINT) + LABEL_PADDING.width,
			height: height !== null && height !== void 0 ? height : Math.ceil(measured.height * PIXELS_PER_POINT) + LABEL_PADDING.height
		};
	};
	/**
	* A connector's label: a text box without a line, centred on the connector's route. At the start or end of the
	* route it is just clear of the shape, and it moves along the route until it is off every shape and label, if it can,
	* or else beside the route.
	*/
	var layoutLabel = (label, points, drawingId, avoid, styles) => {
		var _places$find;
		const { fill = "none", line = "none", position = "middle" } = typeof label === "string" ? {} : label;
		const paragraphs = labelParagraphs(label, styles);
		const size = labelSize(label, paragraphs, styles);
		const half = {
			x: size.width * EMUS_PER_PIXEL$2 / 2,
			y: size.height * EMUS_PER_PIXEL$2 / 2
		};
		const reach = ({ x, y }) => Math.abs(x) * half.x + Math.abs(y) * half.y + LABEL_GAP * EMUS_PER_PIXEL$2;
		const total = pathLength(points);
		const wanted = {
			start: Math.min(total / 2, reach(pointAlong(points, 0).direction)),
			middle: total / 2,
			end: Math.max(total / 2, total - reach(pointAlong(points, total).direction))
		}[position];
		const labelBox = (distance, side) => {
			const { point, direction } = pointAlong(points, distance);
			const across = {
				x: -direction.y,
				y: direction.x
			};
			const offset = side * reach(across);
			return {
				x: Math.round(point.x + across.x * offset - half.x),
				y: Math.round(point.y + across.y * offset - half.y),
				width: Math.round(half.x * 2),
				height: Math.round(half.y * 2)
			};
		};
		const step = LABEL_STEP * EMUS_PER_PIXEL$2;
		const distances = [wanted, ...Array.from({ length: Math.ceil(total / step) }, (_, index) => [wanted + (index + 1) * step, wanted - (index + 1) * step]).flat()].filter((distance) => distance >= 0 && distance <= total);
		const crowding = (side) => {
			const { x, y, width, height } = labelBox(wanted, side);
			const around = {
				left: x - width,
				top: y - height,
				right: x + 2 * width,
				bottom: y + 2 * height
			};
			return avoid.boxes.reduce((taken, other) => taken + overlapArea(around, other), 0);
		};
		const places = [0, ...crowding(-1) < crowding(1) ? [-1, 1] : [1, -1]].flatMap((side) => distances.map((distance) => labelBox(distance, side)));
		const isClear = (place) => !avoid.boxes.some((other) => overlaps(shrink(boundsOfBox(place), 1), other)) && !avoid.lines.some((route) => route.slice(1).some((to, index) => crossesBox(route[index], to, boundsOfBox(place))));
		const box = (_places$find = places.find(isClear)) !== null && _places$find !== void 0 ? _places$find : places[0];
		return {
			child: {
				type: "wps",
				box,
				data: _objectSpread2(_objectSpread2({}, createPresetShapeData({
					type: "rectangle",
					transformation: size,
					fill,
					line,
					children: paragraphs,
					textOptions: {
						margins: {
							top: 0,
							right: 0,
							bottom: 0,
							left: 0
						},
						wrap: false,
						verticalAlignment: "center"
					}
				})), {}, { nonVisualDrawingProperties: createNonVisualDrawingProperties(drawingId, "textBox", {}) })
			},
			box: boundsOfBox(box),
			reach: expand(boundsOfBox(box), uniformExtent(line === "none" ? 0 : getShapeLineOverhang(line)))
		};
	};
	var ROUTE_NAMES = {
		straight: "straightConnector",
		elbow: "elbowConnector",
		curved: "curvedConnector"
	};
	var hasArrow = (line, end) => typeof line === "object" && !isThemeColor(line) && line[end] !== void 0;
	/**
	* Finds the shapes and connection sites a connector attaches to.
	*
	* @throws If an end names a shape that doesn't exist or isn't in the connector's group, or gives both a side and a point
	*/
	var resolveConnector = (node, leaves, allIds, sides = {}) => {
		const { options: connector } = node;
		const resolve = (connectorEnd) => {
			const { id, side, point } = typeof connectorEnd === "string" ? {
				id: connectorEnd,
				side: void 0,
				point: void 0
			} : connectorEnd;
			const leaf = leaves.find((candidate) => candidate.id === id);
			if (!leaf) throw new Error(allIds.has(id) ? `Invalid connector. The shape "${id}" is not in the connector's group. A connector in a group can only join shapes in that group` : `Invalid connector. No shape has the id "${id}"`);
			if (side && point) throw new Error(`Invalid connector end for "${id}". Give a side or a point, not both`);
			return {
				leaf,
				side,
				point
			};
		};
		const from = resolve(connector.from);
		const to = resolve(connector.to);
		const endOf = (end, other, arrow, side) => {
			var _ref, _end$side;
			return {
				leaf: end.leaf,
				site: end.point ? pickNearestSite(end.leaf, end.point) : pickSite(end.leaf, (_ref = (_end$side = end.side) !== null && _end$side !== void 0 ? _end$side : side) !== null && _ref !== void 0 ? _ref : facingSide(leafBounds(end.leaf), leafBounds(other.leaf))),
				byPoint: end.point !== void 0,
				arrow
			};
		};
		return {
			node,
			ends: [endOf(from, to, hasArrow(connector.line, "startArrow"), sides.from), endOf(to, from, hasArrow(connector.line, "endArrow"), sides.to)]
		};
	};
	var localSideOf = ({ x, y }, { width, height }) => {
		if (Math.abs(y) < 1) return "top";
		if (Math.abs(y - height) < 1) return "bottom";
		if (Math.abs(x) < 1) return "left";
		return Math.abs(x - width) < 1 ? "right" : void 0;
	};
	/**
	* Spreads out the ends of connectors that meet at the same connection site along the straight part of its side, so
	* arrowheads don't sit on top of each other, and connectors that join the same two shapes don't overlap. The ends are
	* ordered by where the connectors go, so they don't cross. Ends without arrowheads that fan out to different shapes
	* stay together, as the lines from a box in an org chart do.
	*
	* The ends keep their connection sites, so Word joins them at the site again if a shape is moved.
	*/
	var spreadEnds = (connectors) => {
		const groups = connectors.flatMap((connector, index) => connector.ends.map((end, which) => ({
			key: `${index}:${which}`,
			index,
			end,
			other: connector.ends[1 - which]
		}))).filter(({ end }) => !end.byPoint && end.site.index !== void 0).reduce((all, end) => {
			var _all$get;
			const key = `${end.end.leaf.drawingId}:${end.end.site.index}`;
			return new Map([...all, [key, [...(_all$get = all.get(key)) !== null && _all$get !== void 0 ? _all$get : [], end]]]);
		}, /* @__PURE__ */ new Map());
		const moved = new Map([...groups.values()].flatMap((members) => {
			const { leaf, site } = members[0].end;
			const local = leaf.sites.find(({ index }) => index === site.index);
			const side = localSideOf(local, leaf);
			const straight = side && leaf.straightSides[side];
			const needed = members.some(({ end }) => end.arrow) || members.some((member, index) => members.some((other, otherIndex) => otherIndex !== index && other.other.leaf === member.other.leaf));
			if (members.length < 2 || !straight || !needed) return [];
			const alongSide = side === "top" || side === "bottom" ? {
				x: 1,
				y: 0
			} : {
				x: 0,
				y: 1
			};
			const direction = transformDirection(leaf.matrix, alongSide);
			const towards = ({ end, other }) => (other.site.point.x - end.site.point.x) * direction.x + (other.site.point.y - end.site.point.y) * direction.y;
			const ordered = [...members].sort((a, b) => Math.abs(towards(a) - towards(b)) >= 1 ? towards(a) - towards(b) : a.index - b.index);
			return ordered.map(({ key, end }, index) => {
				const at = straight[0] + (straight[1] - straight[0]) * (index + 1) / (ordered.length + 1);
				const point = side === "top" || side === "bottom" ? {
					x: at,
					y: local.y
				} : {
					x: local.x,
					y: at
				};
				return [key, _objectSpread2(_objectSpread2({}, end.site), {}, { point: transformPoint(leaf.matrix, point) })];
			});
		}));
		return connectors.map((connector, index) => {
			var _moved$get, _moved$get2;
			return _objectSpread2(_objectSpread2({}, connector), {}, { ends: [_objectSpread2(_objectSpread2({}, connector.ends[0]), {}, { site: (_moved$get = moved.get(`${index}:0`)) !== null && _moved$get !== void 0 ? _moved$get : connector.ends[0].site }), _objectSpread2(_objectSpread2({}, connector.ends[1]), {}, { site: (_moved$get2 = moved.get(`${index}:1`)) !== null && _moved$get2 !== void 0 ? _moved$get2 : connector.ends[1].site })] });
		});
	};
	/**
	* Whether a straight line passes through a box. A line that only touches its edge, as a connector does where it
	* meets a shape, doesn't.
	*/
	var crossesBox = (from, to, bounds) => {
		const { left, top, right, bottom } = shrink(bounds, EMUS_PER_PIXEL$2);
		const dx = to.x - from.x;
		const dy = to.y - from.y;
		let low = 0;
		let high = 1;
		for (const [step, room] of [
			[-dx, from.x - left],
			[dx, right - from.x],
			[-dy, from.y - top],
			[dy, bottom - from.y]
		]) {
			if (step === 0) {
				if (room < 0) return false;
				continue;
			}
			const ratio = room / step;
			if (step < 0) low = Math.max(low, ratio);
			else high = Math.min(high, ratio);
		}
		return left < right && top < bottom && low < high;
	};
	/**
	* Routes a connector between the shapes it joins. A connector without a `route` is straight, unless a straight line
	* would go through another shape, when it bends around it.
	*/
	var routeResolved = (connector, leaves) => {
		var _options$route;
		const { node: { options }, ends: [start, finish] } = connector;
		const others = leaves.filter((leaf) => leaf !== start.leaf && leaf !== finish.leaf).map(leafBounds);
		const route = (_options$route = options.route) !== null && _options$route !== void 0 ? _options$route : others.some((shape) => crossesBox(start.site.point, finish.site.point, shape)) ? "elbow" : "straight";
		return _objectSpread2(_objectSpread2({}, connector), {}, {
			route,
			geometry: routeConnector(route, start.site, finish.site, {
				margin: marginOf(options),
				obstacles: leaves.map(leafBounds)
			})
		});
	};
	var marginOf = ({ margin }) => (margin !== null && margin !== void 0 ? margin : DEFAULT_CONNECTOR_MARGIN) * EMUS_PER_PIXEL$2;
	/**
	* Moves apart the lines of elbow connectors that would lie on top of each other, unless moving one would take it
	* through more shapes.
	*/
	var separateRoutes = (routed, leaves) => {
		const obstacles = leaves.map(leafBounds);
		const separated = separateChannels(routed.map(({ route, geometry }) => ({
			points: geometry.points,
			movable: route === "elbow"
		})), CHANNEL_SPACING * EMUS_PER_PIXEL$2);
		return routed.map((connector, index) => {
			const points = separated[index];
			if (points === connector.geometry.points) return connector;
			const [start, finish] = connector.ends;
			const geometry = fitElbowConnector(start.site, finish.site, points, marginOf(connector.node.options));
			return countRouteCrossings(geometry.points, obstacles) > countRouteCrossings(connector.geometry.points, obstacles) ? connector : _objectSpread2(_objectSpread2({}, connector), {}, { geometry });
		});
	};
	/**
	* Writes a routed connector, and places its label clear of the shapes, of `labels` and of the other connectors' `lines`.
	* A connector without a `route` is straight, unless a straight line would go through another shape, when it bends
	* around it.
	*/
	var layoutConnector = ({ node, ends: [start, finish], route, geometry }, leaves, avoid, styles) => {
		const { options: connector, drawingId, labelId } = node;
		const obstacles = leaves.map(leafBounds);
		const path = boundsOf(geometry.points);
		const data = geometry.type === "freeform" ? {
			geometry: {
				type: "custom",
				path: geometry.points.map(({ x, y }, index) => `${index === 0 ? "M" : "L"} ${x - path.left} ${y - path.top}`).join(" ")
			},
			line: connector.line,
			nonVisualDrawingProperties: createNonVisualDrawingProperties(drawingId, "freeform", connector)
		} : {
			geometry: {
				type: geometry.type,
				adjustments: geometry.adjustments
			},
			line: connector.line,
			connections: {
				start: start.site.index === void 0 ? void 0 : {
					id: start.leaf.drawingId,
					index: start.site.index
				},
				end: finish.site.index === void 0 ? void 0 : {
					id: finish.leaf.drawingId,
					index: finish.site.index
				}
			},
			nonVisualDrawingProperties: createNonVisualDrawingProperties(drawingId, ROUTE_NAMES[route], connector)
		};
		const placed = {
			child: {
				type: "wps",
				box: _objectSpread2(_objectSpread2({}, geometry.offset), {}, {
					width: geometry.width,
					height: geometry.height
				}),
				rotation: geometry.rotation,
				flip: {
					horizontal: geometry.flip.horizontal || void 0,
					vertical: geometry.flip.vertical || void 0
				},
				data
			},
			box: path,
			reach: expand(path, uniformExtent(getShapeLineOverhang(connector.line)))
		};
		return connector.label && labelId !== void 0 ? [placed, layoutLabel(connector.label, geometry.points, labelId, {
			boxes: [...obstacles, ...avoid.labels],
			lines: avoid.lines
		}, styles)] : [placed];
	};
	var layoutInnerGroup = (node, allIds, styles) => {
		var _node$options$transfo;
		const inner = layoutGroup(node.children, allIds, styles, node.options.layout, node.laneIds);
		const childOffset = {
			x: Math.round(inner.box.left),
			y: Math.round(inner.box.top)
		};
		const childExtent = {
			x: Math.round(inner.box.right) - childOffset.x,
			y: Math.round(inner.box.bottom) - childOffset.y
		};
		const { width, height } = (_node$options$transfo = node.options.transformation) !== null && _node$options$transfo !== void 0 ? _node$options$transfo : {};
		return {
			layout: inner,
			childOffset,
			childExtent,
			width: width === void 0 ? childExtent.x : Math.round(width * EMUS_PER_PIXEL$2),
			height: height === void 0 ? childExtent.y : Math.round(height * EMUS_PER_PIXEL$2)
		};
	};
	/**
	* Places a group inside the drawing, in the coordinates of the group it is in.
	*/
	var layoutNestedGroup = (node, inner, position) => {
		var _options$transformati;
		const { options, drawingId } = node;
		const { layout, childOffset, childExtent } = inner;
		const { rotation: degrees, flip } = (_options$transformati = options.transformation) !== null && _options$transformati !== void 0 ? _options$transformati : {};
		const box = _objectSpread2(_objectSpread2({}, position), {}, {
			width: inner.width,
			height: inner.height
		});
		const matrix = compose(placement(box, degrees, flip), compose(scaling(childExtent.x === 0 ? 1 : box.width / childExtent.x, childExtent.y === 0 ? 1 : box.height / childExtent.y), translation(-childOffset.x, -childOffset.y)));
		return {
			placed: {
				child: {
					type: "group",
					box,
					rotation: degrees,
					flip,
					childOffset,
					childExtent,
					children: layout.children,
					nonVisualDrawingProperties: createNonVisualDrawingProperties(drawingId, "group", options)
				},
				box: boundsOfBox(box),
				reach: transformBounds(matrix, layout.reach)
			},
			leaves: layout.leaves.map((leaf) => _objectSpread2(_objectSpread2({}, leaf), {}, { matrix: compose(matrix, leaf.matrix) }))
		};
	};
	/**
	* Places a shape, picture or group with the top-left corner of its box, before rotation, at a point.
	*/
	var placeSized = ({ node, transformation, inner }, position, styles) => {
		switch (node.kind) {
			case "shape": return layoutShape(node.options, transformation, node.drawingId, position, styles);
			case "picture": return layoutPicture(node.options, node.drawingId, position);
			default: return layoutNestedGroup(node, inner, position);
		}
	};
	var sizeNode = (node, allIds, styles) => {
		switch (node.kind) {
			case "shape": {
				const transformation = resolveShapeSize(node.options, styles);
				const { width, height } = boxAt({
					x: 0,
					y: 0
				}, transformation);
				return {
					node,
					offset: offsetOf(transformation.offset),
					width,
					height,
					rotation: transformation.rotation,
					transformation
				};
			}
			case "picture": {
				const { width, height } = boxAt({
					x: 0,
					y: 0
				}, node.options.transformation);
				return {
					node,
					offset: offsetOf(node.options.transformation.offset),
					width,
					height,
					rotation: node.options.transformation.rotation
				};
			}
			default: {
				var _node$options$transfo2, _node$options$transfo3;
				const inner = layoutInnerGroup(node, allIds, styles);
				return {
					node,
					offset: offsetOf((_node$options$transfo2 = node.options.transformation) === null || _node$options$transfo2 === void 0 ? void 0 : _node$options$transfo2.offset),
					width: inner.width,
					height: inner.height,
					rotation: (_node$options$transfo3 = node.options.transformation) === null || _node$options$transfo3 === void 0 ? void 0 : _node$options$transfo3.rotation,
					inner
				};
			}
		}
	};
	/**
	* Where to place each shape, picture and group: at its `offset`, or where the layout puts it. The layout places the
	* box around each rotated child, and follows the connectors between the children it places.
	*/
	var arrange = (sized, connectors, styles, layout) => {
		const origin = {
			x: 0,
			y: 0
		};
		const lanes = lanesOf(layout);
		const laneIndex = ({ node }) => {
			const { lane } = node.options;
			const index = lane === void 0 ? 0 : lanes.findIndex(({ name }) => name === lane);
			if (index === -1) throw new Error(`Invalid lane "${lane}". The layout has no lane with that name`);
			return index;
		};
		sized.forEach(laneIndex);
		if (!layout) return {
			positions: sized.map(({ offset }) => offset !== null && offset !== void 0 ? offset : origin),
			levels: /* @__PURE__ */ new Map(),
			lanes: []
		};
		const has = (item, connectorEnd) => idsOf(item.node).includes(endId$1(connectorEnd));
		const free = sized.filter((item) => item.offset === void 0);
		const anchors = sized.filter((item) => item.offset !== void 0 && connectors.some(({ options: { from, to } }) => has(item, from) && free.some((other) => has(other, to)) || has(item, to) && free.some((other) => has(other, from))));
		const placed = sized.filter((item) => item.offset === void 0 || anchors.includes(item));
		const turned = placed.map((item) => {
			var _item$rotation;
			const radians = ((_item$rotation = item.rotation) !== null && _item$rotation !== void 0 ? _item$rotation : 0) * Math.PI / 180;
			const cos = Math.abs(Math.cos(radians));
			const sin = Math.abs(Math.sin(radians));
			return {
				width: item.width * cos + item.height * sin,
				height: item.width * sin + item.height * cos,
				lane: laneIndex(item)
			};
		});
		const itemWith = (connectorEnd) => placed.findIndex((item) => has(item, connectorEnd));
		const vertical = layout.type === "grid" || layout.direction === void 0 || layout.direction === "down" || layout.direction === "up";
		const labelLength = ({ label }) => {
			if (label === void 0) return;
			const size = labelSize(label, labelParagraphs(label, styles), styles);
			return (vertical ? size.height : size.width) * EMUS_PER_PIXEL$2;
		};
		const edges = connectors.map(({ options }) => ({
			from: itemWith(options.from),
			to: itemWith(options.to),
			across: layout.type === "grid" ? void 0 : sideAcross(options, layout.direction),
			labelLength: layout.type === "grid" ? void 0 : labelLength(options)
		})).filter(({ from, to }) => from !== -1 && to !== -1);
		const headerParagraphs = lanes.map(({ name }) => createTextParagraphs(name, styles));
		const headerSizes = headerParagraphs.map((paragraphs) => {
			const { width, height } = measureText(readTextParagraphs(paragraphs, styles));
			const [along, across] = vertical ? [height, width] : [width, height];
			return {
				along: (Math.ceil(along * PIXELS_PER_POINT) + 12) * EMUS_PER_PIXEL$2,
				across: (Math.ceil(across * PIXELS_PER_POINT) + 12) * EMUS_PER_PIXEL$2
			};
		});
		const { positions, levels, lanes: laneBoxes = [] } = layoutItems(layout, turned, edges, {
			length: Math.max(0, ...headerSizes.map(({ along }) => along)),
			widths: headerSizes.map(({ across }) => across)
		});
		const snap = (centre, length) => Math.round(Math.round(centre / EMUS_PER_PIXEL$2) * EMUS_PER_PIXEL$2 - length / 2);
		const laidOut = new Map(placed.map((item, index) => [item, {
			x: snap(positions[index].x + turned[index].width / 2, item.width),
			y: snap(positions[index].y + turned[index].height / 2, item.height)
		}]));
		const shiftBy = (axis) => {
			var _mean;
			return Math.round(((_mean = mean(anchors.map((item) => item.offset[axis] - laidOut.get(item)[axis]))) !== null && _mean !== void 0 ? _mean : 0) / EMUS_PER_PIXEL$2) * EMUS_PER_PIXEL$2;
		};
		const shift = {
			x: shiftBy("x"),
			y: shiftBy("y")
		};
		const shifted = ({ x, y, width, height }) => ({
			x: Math.round(x + shift.x),
			y: Math.round(y + shift.y),
			width,
			height
		});
		return {
			positions: sized.map((item) => {
				var _item$offset;
				const position = laidOut.get(item);
				return (_item$offset = item.offset) !== null && _item$offset !== void 0 ? _item$offset : {
					x: position.x + shift.x,
					y: position.y + shift.y
				};
			}),
			levels: new Map(levels ? placed.map((item, index) => [item.node, levels[index]]) : []),
			lanes: laneBoxes.map(({ band, header }, index) => ({
				lane: lanes[index],
				band: shifted(band),
				header: shifted(header),
				paragraphs: headerParagraphs[index]
			}))
		};
	};
	var mean = (values) => values.length > 0 ? values.reduce((total, value) => total + value, 0) / values.length : void 0;
	/**
	* The lanes of a flow, with a name for each.
	*
	* @throws If two lanes have the same name
	*/
	var lanesOf = (layout) => {
		var _layout$lanes2;
		const lanes = (layout === null || layout === void 0 ? void 0 : layout.type) === "flow" ? ((_layout$lanes2 = layout.lanes) !== null && _layout$lanes2 !== void 0 ? _layout$lanes2 : []).map((lane) => typeof lane === "string" ? { name: lane } : lane) : [];
		const repeated = lanes.find(({ name }, index) => lanes.findIndex((other) => other.name === name) !== index);
		if (repeated) throw new Error(`Invalid lane "${repeated.name}". Each lane in a layout needs a different name`);
		return lanes;
	};
	/**
	* A lane's band, drawn behind the shapes in it, and its header, with its name in it.
	*/
	var layoutLane = ({ lane, band, header, paragraphs }, [bandId, headerId], styles) => {
		var _lane$line, _lane$headerFill;
		const line = (_lane$line = lane.line) !== null && _lane$line !== void 0 ? _lane$line : LANE_LINE;
		const overhang = uniformExtent(getShapeLineOverhang(line));
		const pixels = ({ width, height }) => ({
			width: width / EMUS_PER_PIXEL$2,
			height: height / EMUS_PER_PIXEL$2
		});
		return [{
			child: {
				type: "wps",
				box: band,
				data: _objectSpread2(_objectSpread2({}, createPresetShapeData({
					type: "rectangle",
					transformation: pixels(band),
					fill: lane.fill,
					line
				}, styles)), {}, { nonVisualDrawingProperties: createNonVisualDrawingProperties(bandId, "rectangle", {
					altText: { name: lane.name },
					decorative: true
				}) })
			},
			box: boundsOfBox(band),
			reach: expand(boundsOfBox(band), overhang)
		}, {
			child: {
				type: "wps",
				box: header,
				data: _objectSpread2(_objectSpread2({}, createPresetShapeData({
					type: "rectangle",
					transformation: pixels(header),
					fill: (_lane$headerFill = lane.headerFill) !== null && _lane$headerFill !== void 0 ? _lane$headerFill : LANE_HEADER_FILL,
					line,
					children: paragraphs,
					textOptions: {
						margins: {
							top: 0,
							right: 0,
							bottom: 0,
							left: 0
						},
						wrap: false,
						verticalAlignment: "center"
					}
				}, styles)), {}, { nonVisualDrawingProperties: createNonVisualDrawingProperties(headerId, "textBox", {}) })
			},
			box: boundsOfBox(header),
			reach: expand(boundsOfBox(header), overhang)
		}];
	};
	/**
	* Which way across the levels a connector with a side goes: leaving the right of a shape in a flow that runs down puts
	* the shape it leads to on the right, and so does arriving at the left of it.
	*/
	var sideAcross = (connector, direction = "down") => {
		const [before, after] = direction === "down" || direction === "up" ? ["left", "right"] : ["top", "bottom"];
		const sideOf = (connectorEnd) => typeof connectorEnd === "string" ? void 0 : connectorEnd.side;
		const from = sideOf(connector.from);
		if (from === before || from === after) return from === after ? 1 : -1;
		const to = sideOf(connector.to);
		if (to === before || to === after) return to === before ? 1 : -1;
	};
	var LEVEL_SIDES = {
		down: {
			leave: "bottom",
			arrive: "top",
			back: "right"
		},
		up: {
			leave: "top",
			arrive: "bottom",
			back: "right"
		},
		right: {
			leave: "right",
			arrive: "left",
			back: "bottom"
		},
		left: {
			leave: "left",
			arrive: "right",
			back: "bottom"
		}
	};
	var endId$1 = (connectorEnd) => typeof connectorEnd === "string" ? connectorEnd : connectorEnd.id;
	/**
	* The sides a connector between levels of a flow or tree attaches to, unless it gives its own: it leaves one level
	* towards the next and arrives from the one before. A connector back to the level before goes the other way between
	* the same sides, and one that leads further back goes out of the side of both shapes and loops round.
	*/
	var levelSides = (connector, levelOf, direction = "down") => {
		const from = levelOf(endId$1(connector.from));
		const to = levelOf(endId$1(connector.to));
		if (from === void 0 || to === void 0 || from === to) return {};
		const sides = LEVEL_SIDES[direction];
		if (to > from) return {
			from: sides.leave,
			to: sides.arrive
		};
		return to === from - 1 ? {
			from: sides.arrive,
			to: sides.leave
		} : {
			from: sides.back,
			to: sides.back
		};
	};
	/**
	* Lays out the children of a group: first the shapes, pictures and groups, then the connectors between them.
	*/
	var layoutGroup = (nodes, allIds, styles, layout, laneIds = []) => {
		if (nodes.length === 0) throw new Error("Invalid shape group. Expected at least 1 child shape");
		const connectors = nodes.filter((node) => node.kind === "connector");
		const sized = nodes.filter((node) => node.kind !== "connector").map((node) => sizeNode(node, allIds, styles));
		const { positions, levels, lanes } = arrange(sized, connectors, styles, layout);
		const shapes = new Map(sized.map((item, index) => [item.node, placeSized(item, positions[index], styles)]));
		const leaves = [...shapes.values()].flatMap(({ leaves: shapeLeaves }) => shapeLeaves);
		const levelOf = (id) => {
			const item = sized.find(({ node }) => idsOf(node).includes(id));
			return item && levels.get(item.node);
		};
		const separated = separateRoutes(spreadEnds(connectors.map((connector) => resolveConnector(connector, leaves, allIds, layout && layout.type !== "grid" ? levelSides(connector.options, levelOf, layout.direction) : {}))).map((connector) => routeResolved(connector, leaves)), leaves);
		const routed = separated.reduce(({ connectors: done, labels }, connector) => {
			const lines = separated.filter((other) => other !== connector).map(({ geometry }) => geometry.points);
			const pieces = layoutConnector(connector, leaves, {
				labels,
				lines
			}, styles);
			return {
				connectors: new Map([...done, [connector.node, pieces]]),
				labels: [...labels, ...pieces.slice(1).map(({ box }) => box)]
			};
		}, {
			connectors: /* @__PURE__ */ new Map(),
			labels: []
		}).connectors;
		const placed = [...lanes.flatMap((lane, index) => layoutLane(lane, laneIds[index], styles)), ...nodes.flatMap((node) => node.kind === "connector" ? routed.get(node) : [shapes.get(node).placed])];
		return {
			children: placed.map(({ child }) => child),
			box: union(placed.map(({ box }) => box)),
			reach: union(placed.map(({ reach }) => reach)),
			leaves
		};
	};
	var toMediaData = (child, shift) => {
		const x = Math.round(child.box.x + shift.x);
		const y = Math.round(child.box.y + shift.y);
		const width = Math.round(child.box.width);
		const height = Math.round(child.box.height);
		const transformation = {
			offset: {
				pixels: {
					x: Math.round(x / EMUS_PER_PIXEL$2),
					y: Math.round(y / EMUS_PER_PIXEL$2)
				},
				emus: {
					x,
					y
				}
			},
			pixels: {
				x: Math.round(width / EMUS_PER_PIXEL$2),
				y: Math.round(height / EMUS_PER_PIXEL$2)
			},
			emus: {
				x: width,
				y: height
			},
			flip: child.flip,
			rotation: child.rotation ? child.rotation * 6e4 : void 0
		};
		switch (child.type) {
			case "wps": return {
				type: "wps",
				transformation,
				data: child.data
			};
			case "picture": return {
				type: "picture",
				transformation,
				data: child.data
			};
			default: return {
				type: "group",
				transformation,
				childOffset: child.childOffset,
				childExtent: child.childExtent,
				children: child.children.map((grandchild) => toMediaData(grandchild, {
					x: 0,
					y: 0
				})),
				nonVisualDrawingProperties: child.nonVisualDrawingProperties
			};
		}
	};
	/**
	* Gives the children of a group or canvas their drawing ids. Every shape, picture, group and connector identifies
	* itself with a cNvPr, which needs an id that is unique in the document.
	*
	* @throws If two shapes or pictures have the same `id`
	*/
	var createShapeDrawingNodes = (children, layout) => {
		const laneIds = assignLaneIds(layout);
		const nodes = assignIds(children);
		return {
			nodes,
			ids: collectIds(nodes),
			laneIds
		};
	};
	/**
	* Lays out the shapes, pictures, groups and connectors of a group or canvas. They are drawn in the order given,
	* and connectors can attach to shapes that come after them.
	*
	* @param children - The children, or the children with their drawing ids
	* @param options.keepPositive - Moves everything right and down, if needed, so nothing that is drawn is above or to the left of (0, 0)
	* @param options.layout - Places the children that have no `offset`
	* @param options.styles - The document's styles, which text is measured in. Default is Word's own defaults
	* @throws If a group has no children, two shapes have the same `id`, a connector refers to an `id` no shape in its group has, or a shape to a lane the layout doesn't have
	*/
	var layoutShapeDrawing = (children, { keepPositive = false, layout: shapeLayout, styles = WORD_DEFAULT_STYLES } = {}) => {
		const { nodes, ids, laneIds } = "nodes" in children ? children : createShapeDrawingNodes(children, shapeLayout);
		const layout = layoutGroup(nodes, ids, styles, shapeLayout, laneIds);
		const shift = keepPositive ? {
			x: Math.max(0, -layout.reach.left),
			y: Math.max(0, -layout.reach.top)
		} : {
			x: 0,
			y: 0
		};
		const move = ({ left, top, right, bottom }) => ({
			left: left + shift.x,
			top: top + shift.y,
			right: right + shift.x,
			bottom: bottom + shift.y
		});
		return {
			children: layout.children.map((child) => toMediaData(child, shift)),
			bounds: move(layout.box),
			reach: move(layout.reach)
		};
	};
	/**
	* The paragraphs of text in a shape whose size or text depends on the document's styles, or nothing if they don't:
	* its size fits its text, or its `text` is written to suit them.
	*/
	var shapeStyledParagraphs = ({ transformation, text, children = [] }) => transformation.width === "fitText" || transformation.height === "fitText" || text !== void 0 ? children : void 0;
	/**
	* The paragraphs of text in a group or canvas whose layout depends on the document's styles, or nothing if it doesn't:
	* a shape in it fits its text or has `text`, a label is sized to its text or has text given as a string, or its layout
	* has lanes, whose headers fit their names.
	*/
	var drawingStyledParagraphs = (children, layout) => {
		const found = children.map((child) => {
			switch (child.type) {
				case "connector": {
					const label = typeof child.label === "string" ? { text: child.label } : child.label;
					if (label === void 0 || typeof label.text !== "string" && label.width !== void 0 && label.height !== void 0) return;
					return typeof label.text === "string" ? [] : label.text;
				}
				case "picture": return;
				case "group": return drawingStyledParagraphs(child.children, child.layout);
				default: return shapeStyledParagraphs(child);
			}
		});
		return (layout === null || layout === void 0 ? void 0 : layout.type) === "flow" && layout.lanes !== void 0 && layout.lanes.length > 0 || found.some((paragraphs) => paragraphs !== void 0) ? found.flatMap((paragraphs) => paragraphs !== null && paragraphs !== void 0 ? paragraphs : []) : void 0;
	};
	/**
	* How far, in EMUs, what a group draws reaches past each side of the group, once its children are scaled to the
	* group's size and the group is flipped and rotated.
	*
	* @param layout - The group's layout
	* @param childOffset - The top-left corner of the box its children are positioned in
	* @param childExtent - The size of the box its children are positioned in
	* @param transformation - The group's size in EMUs, rotation in degrees and flip
	*/
	var getGroupEffectExtent = ({ reach }, childOffset, childExtent, { width, height, rotation: degrees, flip }) => {
		const drawn = transformBounds(compose(placement({
			x: 0,
			y: 0,
			width,
			height
		}, degrees, flip), compose(scaling(childExtent.x === 0 ? 1 : width / childExtent.x, childExtent.y === 0 ? 1 : height / childExtent.y), translation(-childOffset.x, -childOffset.y))), reach);
		return {
			top: Math.max(0, Math.ceil(-drawn.top)),
			right: Math.max(0, Math.ceil(drawn.right - width)),
			bottom: Math.max(0, Math.ceil(drawn.bottom - height)),
			left: Math.max(0, Math.ceil(-drawn.left))
		};
	};
	//#endregion
	//#region src/shapes/shape-run.ts
	/**
	* Shape run module for WordprocessingML documents.
	*
	* This module provides support for preset DrawingML shapes, such as rectangles,
	* ellipses, lines and arrows, drawn inline with text or floating on the page.
	*
	* Reference: http://officeopenxml.com/drwSp.php
	*
	* @module
	*/
	/**
	* Represents a shape in a WordprocessingML document.
	*
	* A shape is one of the 187 DrawingML presets, such as a rectangle, ellipse, line,
	* arrow, star, callout or flowchart symbol. It can have a fill, a line with dashes
	* and arrowheads, and text inside it. It sits inline with text unless `floating` is set.
	*
	* Reference: http://officeopenxml.com/drwSp.php
	*
	* @publicApi
	*
	* @example
	* ```typescript
	* // A black bar inline with text
	* new Paragraph({
	*   children: [
	*     new TextRun("Name: "),
	*     new ShapeRun({ type: "rectangle", transformation: { width: 200, height: 4 }, fill: "000000", line: "none" }),
	*   ],
	* });
	*
	* // An arrow
	* new ShapeRun({
	*   type: "line",
	*   transformation: { width: 300, height: 0 },
	*   line: { color: "C00000", width: 2, endArrow: "triangle" },
	* });
	* ```
	*/
	var ShapeRun = class extends docx.Run {
		constructor(options) {
			super(_objectSpread2(_objectSpread2({}, options.run), {}, {
				break: void 0,
				text: void 0,
				children: void 0
			}));
			const floating = options.floating && toImageFloating(options.floating);
			const drawingOptions = createDrawingProperties(_objectSpread2(_objectSpread2({}, options), {}, { floating }));
			this.root.push(createStyledDrawing((styles) => {
				const transformation = resolveShapeSize(options, styles, options.floating && relativeSizeBase(options.floating));
				const drawingTransformation = (0, docx.createTransformation)(_objectSpread2(_objectSpread2({}, transformation), {}, { offset: void 0 }));
				return withRelativePlacement(new docx.Drawing({
					type: "graphic",
					uri: SHAPE_URI,
					transformation: drawingTransformation,
					content: createPresetShape(_objectSpread2(_objectSpread2({}, createPresetShapeData(options, styles)), {}, {
						textFlow: options.textFlow,
						transformation: drawingTransformation
					}))
				}, _objectSpread2(_objectSpread2({}, drawingOptions), {}, { effectExtent: getShapeEffectExtent(_objectSpread2(_objectSpread2({}, options), {}, { transformation })) })), options.floating, options.transformation);
			}, shapeStyledParagraphs(options)));
		}
	};
	//#endregion
	//#region src/shapes/shape-description.ts
	var textOf = (paragraphs) => readTextParagraphs(paragraphs, WORD_DEFAULT_STYLES).map(({ spans }) => spans.map(({ text }) => text).join("")).join(" ").replace(/\s+/g, " ").trim();
	var endId = (end) => typeof end === "string" ? end : end.id;
	/**
	* The shapes and pictures in a diagram that say something, and those in the groups inside it, in the order they are given.
	*/
	var stepsOf = (children) => children.flatMap((child) => {
		switch (child.type) {
			case "connector": return [];
			case "group": return stepsOf(child.children);
			case "picture":
				var _child$altText$name, _child$altText;
				return [{
					id: child.id,
					name: (_child$altText$name = (_child$altText = child.altText) === null || _child$altText === void 0 ? void 0 : _child$altText.name) !== null && _child$altText$name !== void 0 ? _child$altText$name : ""
				}];
			default: {
				var _child$text, _child$children, _child$altText$name2, _child$altText2;
				const text = [(_child$text = child.text) !== null && _child$text !== void 0 ? _child$text : "", textOf((_child$children = child.children) !== null && _child$children !== void 0 ? _child$children : [])].join(" ").replace(/\s+/g, " ").trim();
				return [{
					id: child.id,
					name: (_child$altText$name2 = (_child$altText2 = child.altText) === null || _child$altText2 === void 0 ? void 0 : _child$altText2.name) !== null && _child$altText$name2 !== void 0 ? _child$altText$name2 : text
				}];
			}
		}
	});
	var linksOf = (children) => children.flatMap((child) => {
		var _child$label, _child$label$text, _child$label2;
		if (child.type === "group") return linksOf(child.children);
		if (child.type !== "connector") return [];
		const label = typeof child.label === "string" ? child.label : typeof ((_child$label = child.label) === null || _child$label === void 0 ? void 0 : _child$label.text) === "string" ? child.label.text : textOf((_child$label$text = (_child$label2 = child.label) === null || _child$label2 === void 0 ? void 0 : _child$label2.text) !== null && _child$label$text !== void 0 ? _child$label$text : []);
		return [{
			from: endId(child.from),
			to: endId(child.to),
			label: label.trim() || void 0
		}];
	});
	var endsSentence = (text) => /[.?!]$/.test(text);
	/**
	* Describes a diagram: each flow of connected shapes from its start, such as "Start, then Write the draft, then
	* Approved? Yes: Publish. No: Fix it, then back to Write the draft.", then the shapes that aren't connected.
	* Shapes and pictures without text or alternative text are left out.
	*
	* @returns The description, or an empty string if nothing in the diagram says anything
	*/
	var describeDiagram = (children) => {
		const steps = stepsOf(children);
		const named = steps.filter(({ name }) => name.length > 0);
		const links = linksOf(children).filter(({ from, to }) => from !== to);
		const stepWith = (id) => steps.find((step) => step.id === id);
		const nameOf = (id) => {
			var _stepWith$name, _stepWith;
			return (_stepWith$name = (_stepWith = stepWith(id)) === null || _stepWith === void 0 ? void 0 : _stepWith.name) !== null && _stepWith$name !== void 0 ? _stepWith$name : "";
		};
		const sentence = (text) => endsSentence(text) ? text : `${text}.`;
		const tell = (id, path, seen) => {
			const name = nameOf(id);
			if (seen.has(id)) return {
				text: path.includes(id) ? `back to ${name}` : name,
				seen,
				after: []
			};
			const told = /* @__PURE__ */ new Set([...seen, id]);
			const next = links.filter(({ from, to }) => from === id && nameOf(to).length > 0);
			if (next.length === 0) return {
				text: name,
				seen: told,
				after: []
			};
			if (next.length === 1) {
				const rest = tell(next[0].to, [...path, id], told);
				return _objectSpread2(_objectSpread2({}, rest), {}, { text: `${name}, then ${rest.text}` });
			}
			if (next.every(({ label }) => label === void 0)) {
				const names = next.map(({ to }) => nameOf(to));
				const list = names.length === 2 ? names.join(" and ") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
				return next.reduce((done, { to }) => {
					const branch = tell(to, [...path, id], done.seen);
					const onward = branch.text === nameOf(to) ? [] : [sentence(branch.text)];
					return _objectSpread2(_objectSpread2({}, done), {}, {
						seen: branch.seen,
						after: [
							...done.after,
							...onward,
							...branch.after
						]
					});
				}, {
					text: `${name} leads to ${list}`,
					seen: told,
					after: []
				});
			}
			return next.reduce((done, { to, label }) => {
				const branch = tell(to, [...path, id], done.seen);
				return {
					text: `${done.text} ${sentence(`${label ? `${label}: ` : "Then "}${branch.text}`)}`,
					seen: branch.seen,
					after: [...done.after, ...branch.after]
				};
			}, {
				text: sentence(name),
				seen: told,
				after: []
			});
		};
		return [...named.filter(({ id }) => id === void 0 || !links.some(({ to }) => to === id)), ...named.filter(({ id }) => id !== void 0 && links.some(({ to }) => to === id))].reduce((done, step) => {
			if (step.id !== void 0 && done.seen.has(step.id)) return done;
			const told = step.id === void 0 ? {
				text: step.name,
				seen: done.seen,
				after: []
			} : tell(step.id, [], done.seen);
			return {
				seen: told.seen,
				sentences: [
					...done.sentences,
					sentence(told.text),
					...told.after
				]
			};
		}, {
			seen: /* @__PURE__ */ new Set(),
			sentences: []
		}).sentences.join(" ");
	};
	/**
	* The alternative text of a group or canvas: its own, with a description of the diagram when it has none and isn't
	* decorative.
	*/
	var describeDrawing = ({ altText, decorative, children }) => {
		if (decorative || (altText === null || altText === void 0 ? void 0 : altText.description)) return altText;
		const description = describeDiagram(children);
		if (description.length === 0) return altText;
		return altText ? _objectSpread2(_objectSpread2({}, altText), {}, { description }) : {
			name: "",
			description,
			title: ""
		};
	};
	//#endregion
	//#region src/shapes/shape-group-run.ts
	/**
	* Shape group run module for WordprocessingML documents.
	*
	* This module provides support for groups of preset shapes that are laid out,
	* moved and resized together as one drawing.
	*
	* Reference: http://officeopenxml.com/drwSp-group.php
	*
	* @module
	*/
	var EMUS_PER_PIXEL$1 = 9525;
	/**
	* Represents a group of shapes in a WordprocessingML document.
	*
	* The shapes are positioned with `transformation.offset`, in pixels, and the group is
	* as big as the box around them. Give the group its own `transformation` to scale,
	* rotate or flip all of them together.
	*
	* Connectors are drawn between the shapes they name. Word only keeps connectors attached
	* when shapes are moved on a {@link ShapeCanvasRun}; in a group they stay where they are drawn.
	*
	* Reference: http://officeopenxml.com/drwSp-group.php
	*
	* @publicApi
	*
	* @example
	* ```typescript
	* new ShapeGroupRun({
	*   children: [
	*     { id: "start", type: "rectangle", transformation: { width: 120, height: 48 }, fill: "4472C4" },
	*     { id: "end", type: "ellipse", transformation: { offset: { left: 160 }, width: 120, height: 48 }, fill: "ED7D31" },
	*     { type: "connector", from: "start", to: "end", line: { endArrow: "triangle" } },
	*   ],
	* });
	* ```
	*/
	var ShapeGroupRun = class extends docx.Run {
		constructor(options) {
			super(_objectSpread2(_objectSpread2({}, options.run), {}, {
				break: void 0,
				text: void 0,
				children: void 0
			}));
			const nodes = createShapeDrawingNodes(options.children, options.layout);
			const drawingOptions = createDrawingProperties(_objectSpread2(_objectSpread2({}, options), {}, { altText: describeDrawing(options) }));
			const create = (styles) => {
				var _options$transformati, _options$transformati2;
				const layout = layoutShapeDrawing(nodes, {
					layout: options.layout,
					styles
				});
				const { children, bounds } = layout;
				const childOffset = {
					x: Math.round(bounds.left),
					y: Math.round(bounds.top)
				};
				const childExtent = {
					x: Math.round(bounds.right) - childOffset.x,
					y: Math.round(bounds.bottom) - childOffset.y
				};
				const groupTransformation = options.transformation ? (0, docx.createTransformation)(_objectSpread2(_objectSpread2({}, options.transformation), {}, { offset: void 0 })) : {
					pixels: {
						x: Math.round(childExtent.x / EMUS_PER_PIXEL$1),
						y: Math.round(childExtent.y / EMUS_PER_PIXEL$1)
					},
					emus: childExtent
				};
				return new docx.Drawing({
					type: "graphic",
					uri: GROUP_URI,
					transformation: groupTransformation,
					content: createShapeGroup({
						transformation: groupTransformation,
						childOffset,
						childExtent,
						children: children.map((child) => createShapeDrawingChild(child, "wpg:grpSp"))
					})
				}, _objectSpread2(_objectSpread2({}, drawingOptions), {}, { effectExtent: getGroupEffectExtent(layout, childOffset, childExtent, {
					width: groupTransformation.emus.x,
					height: groupTransformation.emus.y,
					rotation: (_options$transformati = options.transformation) === null || _options$transformati === void 0 ? void 0 : _options$transformati.rotation,
					flip: (_options$transformati2 = options.transformation) === null || _options$transformati2 === void 0 ? void 0 : _options$transformati2.flip
				}) }));
			};
			this.root.push(createStyledDrawing(create, drawingStyledParagraphs(options.children, options.layout)));
		}
	};
	//#endregion
	//#region src/shapes/drawing/alternate-content.ts
	/**
	* Markup compatibility: content for applications that understand a namespace, with a fallback for those that don't.
	*
	* Reference: ECMA-376 Part 3, 10.2 (AlternateContent, Choice and Fallback)
	*
	* @module
	*/
	/**
	* Creates an `mc:AlternateContent` element. An application uses the choice if it understands the namespace
	* that `requires` names, and the fallback otherwise.
	*
	* ## XML
	* ```xml
	* <mc:AlternateContent>
	*   <mc:Choice Requires="wpc">…</mc:Choice>
	*   <mc:Fallback>…</mc:Fallback>
	* </mc:AlternateContent>
	* ```
	*/
	var createAlternateContent = ({ requires, choice, fallback }) => new docx.BuilderElement({
		name: "mc:AlternateContent",
		children: [new docx.BuilderElement({
			name: "mc:Choice",
			attributes: { requires: {
				key: "Requires",
				value: requires
			} },
			children: [choice]
		}), new docx.BuilderElement({
			name: "mc:Fallback",
			children: [fallback]
		})]
	});
	//#endregion
	//#region src/shapes/drawing/wpc-canvas.ts
	/**
	* Drawing canvases (`wpc:wpc`): an area of a document that holds shapes and pictures,
	* where connectors stay attached to the shapes they join.
	*
	* Reference: ECMA-376 Part 1, 20.4.2.19 wpc (WordprocessingML Drawing Canvas)
	*
	* @module
	*/
	/**
	* Creates a `wpc:wpc` element.
	*
	* The background (`wpc:bg`) and outline (`wpc:whole`) are always written, as Word does, and are empty
	* unless a fill or line is given.
	*
	* ## XSD Schema
	* ```xml
	* <xsd:complexType name="CT_WordprocessingCanvas">
	*   <xsd:sequence minOccurs="1" maxOccurs="1">
	*     <xsd:element name="bg" type="a:CT_BackgroundFormatting" minOccurs="0" maxOccurs="1"/>
	*     <xsd:element name="whole" type="a:CT_WholeE2oFormatting" minOccurs="0" maxOccurs="1"/>
	*     <xsd:choice minOccurs="0" maxOccurs="unbounded">
	*       <xsd:element ref="wps:wsp"/>
	*       <xsd:element ref="dpct:pic"/>
	*       <xsd:element name="contentPart" type="wp14:CT_WordContentPart"/>
	*       <xsd:element ref="wpg:wgp"/>
	*       <xsd:element name="graphicFrame" type="CT_GraphicFrame"/>
	*     </xsd:choice>
	*     <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
	*   </xsd:sequence>
	* </xsd:complexType>
	* ```
	*/
	var createWpcCanvas = ({ children, fill, line }) => new docx.BuilderElement({
		name: "wpc:wpc",
		children: [
			new docx.BuilderElement({
				name: "wpc:bg",
				children: fill ? [createShapeFill(fill)] : []
			}),
			new docx.BuilderElement({
				name: "wpc:whole",
				children: line ? [createShapeLine(line)] : []
			}),
			...children
		]
	});
	//#endregion
	//#region src/shapes/shape-canvas-run.ts
	/**
	* Shape canvas run module for WordprocessingML documents.
	*
	* This module provides support for drawing canvases: areas of a document that hold shapes,
	* where connectors stay attached to the shapes they join when the shapes are moved.
	*
	* @module
	*/
	var EMUS_PER_PIXEL = 9525;
	/**
	* Represents a drawing canvas in a WordprocessingML document.
	*
	* A canvas holds shapes like a {@link ShapeGroupRun}, but its shapes keep their own size, and Word
	* keeps connectors attached to their shapes when the shapes are moved. Use it for flowcharts and
	* diagrams that people will edit.
	*
	* The shapes are positioned with `transformation.offset`, in pixels from the canvas's top-left corner, or by a `layout`.
	*
	* Applications that can't draw canvases, such as Apple Pages, draw the same shapes as a group instead: the canvas is
	* written in `mc:AlternateContent`, with the group as its fallback, unless `fallback` is `false`.
	*
	* @publicApi
	*
	* @example
	* ```typescript
	* new ShapeCanvasRun({
	*   children: [
	*     { id: "start", type: "flowChartTerminator", transformation: { width: 120, height: 48 } },
	*     { id: "step", type: "flowChartProcess", transformation: { offset: { top: 100 }, width: 120, height: 48 } },
	*     { type: "connector", from: "start", to: "step", route: "elbow", line: { endArrow: "triangle" } },
	*   ],
	* });
	* ```
	*/
	var ShapeCanvasRun = class extends docx.Run {
		constructor(options) {
			super(_objectSpread2(_objectSpread2({}, options.run), {}, {
				break: void 0,
				text: void 0,
				children: void 0
			}));
			const altText = describeDrawing(options);
			const canvasNodes = createShapeDrawingNodes(options.children, options.layout);
			const canvasOptions = createDrawingProperties(_objectSpread2(_objectSpread2({}, options), {}, { altText }));
			const fallback = options.fallback === false ? void 0 : {
				nodes: createShapeDrawingNodes(options.children, options.layout),
				backgroundId: (0, docx.docPropertiesUniqueNumericId)(),
				options: createDrawingProperties(_objectSpread2(_objectSpread2({}, options), {}, { altText }))
			};
			const create = (styles) => {
				var _options$line;
				const { children, reach } = layoutShapeDrawing(canvasNodes, {
					keepPositive: true,
					layout: options.layout,
					styles
				});
				const emus = options.transformation ? {
					x: Math.round(options.transformation.width * EMUS_PER_PIXEL),
					y: Math.round(options.transformation.height * EMUS_PER_PIXEL)
				} : {
					x: Math.ceil(reach.right),
					y: Math.ceil(reach.bottom)
				};
				const transformation = {
					pixels: {
						x: Math.round(emus.x / EMUS_PER_PIXEL),
						y: Math.round(emus.y / EMUS_PER_PIXEL)
					},
					emus
				};
				const lineOverhang = options.line ? getShapeLineOverhang(options.line) : 0;
				const canvas = new docx.Drawing({
					type: "graphic",
					uri: CANVAS_URI,
					transformation,
					content: createWpcCanvas({
						children: children.map((child) => createShapeDrawingChild(child, "wpg:wgp")),
						fill: options.fill,
						line: options.line
					})
				}, _objectSpread2(_objectSpread2({}, canvasOptions), {}, { effectExtent: createUniformEffectExtent(lineOverhang) }));
				if (!fallback) return canvas;
				const { backgroundId } = fallback;
				const group = layoutShapeDrawing(fallback.nodes, {
					keepPositive: true,
					layout: options.layout,
					styles
				});
				const background = {
					type: "wps",
					transformation: _objectSpread2({ offset: {
						pixels: {
							x: 0,
							y: 0
						},
						emus: {
							x: 0,
							y: 0
						}
					} }, transformation),
					data: {
						geometry: { type: "rectangle" },
						fill: options.fill,
						line: (_options$line = options.line) !== null && _options$line !== void 0 ? _options$line : "none",
						nonVisualDrawingProperties: {
							id: backgroundId,
							name: `Canvas ${backgroundId}`,
							decorative: true
						}
					}
				};
				const groupReach = {
					left: Math.min(-lineOverhang, group.reach.left),
					top: Math.min(-lineOverhang, group.reach.top),
					right: Math.max(emus.x + lineOverhang, group.reach.right),
					bottom: Math.max(emus.y + lineOverhang, group.reach.bottom)
				};
				return createAlternateContent({
					requires: "wpc",
					choice: canvas,
					fallback: new docx.Drawing({
						type: "graphic",
						uri: GROUP_URI,
						transformation,
						content: createShapeGroup({
							transformation,
							childOffset: {
								x: 0,
								y: 0
							},
							childExtent: emus,
							children: [background, ...group.children].map((child) => createShapeDrawingChild(child, "wpg:grpSp"))
						})
					}, _objectSpread2(_objectSpread2({}, fallback.options), {}, { effectExtent: getGroupEffectExtent({ reach: groupReach }, {
						x: 0,
						y: 0
					}, emus, {
						width: emus.x,
						height: emus.y
					}) }))
				});
			};
			this.root.push(createStyledDrawing(create, drawingStyledParagraphs(options.children, options.layout)));
		}
	};
	//#endregion
	exports.ShapeCanvasRun = ShapeCanvasRun;
	exports.ShapeGroupRun = ShapeGroupRun;
	exports.ShapeRun = ShapeRun;
	return exports;
})({}, docx);
