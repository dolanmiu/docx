var docxLayout = (function(exports) {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	//#region src/text-layout/font-widths.ts
	/**
	* The characters the widths are for, in order: printable ASCII, Latin-1, and common punctuation.
	*/
	var FONT_WIDTH_CHARACTERS = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\xA0¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ–—‘’“”•…€™";
	var FONT_WIDTHS = [
		{
			name: "Calibri",
			lineHeight: 1220.703125,
			regular: [
				226,
				326,
				401,
				498,
				507,
				715,
				682,
				221,
				303,
				303,
				498,
				498,
				250,
				306,
				252,
				386,
				507,
				507,
				507,
				507,
				507,
				507,
				507,
				507,
				507,
				507,
				268,
				268,
				498,
				498,
				498,
				463,
				894,
				579,
				544,
				533,
				615,
				488,
				459,
				631,
				623,
				252,
				319,
				520,
				420,
				855,
				646,
				662,
				517,
				673,
				543,
				459,
				487,
				642,
				567,
				890,
				519,
				487,
				468,
				307,
				386,
				307,
				498,
				498,
				291,
				479,
				525,
				423,
				525,
				498,
				305,
				471,
				525,
				229,
				239,
				455,
				229,
				799,
				525,
				527,
				525,
				525,
				349,
				391,
				335,
				525,
				452,
				715,
				433,
				453,
				395,
				314,
				460,
				314,
				498,
				226,
				326,
				498,
				507,
				498,
				507,
				498,
				498,
				393,
				834,
				402,
				512,
				498,
				507,
				507,
				394,
				339,
				498,
				336,
				334,
				292,
				550,
				586,
				252,
				307,
				246,
				422,
				512,
				636,
				671,
				675,
				463,
				579,
				579,
				579,
				579,
				579,
				579,
				763,
				533,
				488,
				488,
				488,
				488,
				252,
				252,
				252,
				252,
				625,
				646,
				662,
				662,
				662,
				662,
				662,
				498,
				664,
				642,
				642,
				642,
				642,
				487,
				517,
				527,
				479,
				479,
				479,
				479,
				479,
				479,
				773,
				423,
				498,
				498,
				498,
				498,
				229,
				229,
				229,
				229,
				525,
				525,
				527,
				527,
				527,
				527,
				527,
				498,
				529,
				525,
				525,
				525,
				525,
				453,
				525,
				453,
				498,
				905,
				250,
				250,
				418,
				418,
				498,
				690,
				507,
				705
			],
			bold: [
				226,
				326,
				438,
				498,
				507,
				729,
				705,
				233,
				312,
				312,
				498,
				498,
				258,
				306,
				267,
				430,
				507,
				507,
				507,
				507,
				507,
				507,
				507,
				507,
				507,
				507,
				276,
				276,
				498,
				498,
				498,
				463,
				898,
				606,
				561,
				529,
				630,
				488,
				459,
				637,
				631,
				267,
				331,
				547,
				423,
				874,
				659,
				676,
				532,
				686,
				563,
				473,
				495,
				653,
				591,
				906,
				551,
				520,
				478,
				325,
				430,
				325,
				498,
				498,
				300,
				494,
				537,
				418,
				537,
				503,
				316,
				474,
				537,
				246,
				255,
				480,
				246,
				813,
				537,
				538,
				537,
				537,
				355,
				399,
				347,
				537,
				473,
				745,
				459,
				474,
				397,
				344,
				475,
				344,
				498,
				226,
				326,
				498,
				507,
				498,
				507,
				498,
				498,
				415,
				834,
				416,
				539,
				498,
				507,
				507,
				390,
				342,
				498,
				338,
				336,
				301,
				563,
				598,
				268,
				303,
				252,
				435,
				539,
				658,
				691,
				702,
				463,
				606,
				606,
				606,
				606,
				606,
				606,
				775,
				529,
				488,
				488,
				488,
				488,
				267,
				267,
				267,
				267,
				639,
				659,
				676,
				676,
				676,
				676,
				676,
				498,
				681,
				653,
				653,
				653,
				653,
				520,
				532,
				555,
				494,
				494,
				494,
				494,
				494,
				494,
				775,
				418,
				503,
				503,
				503,
				503,
				246,
				246,
				246,
				246,
				537,
				537,
				538,
				538,
				538,
				538,
				538,
				498,
				544,
				537,
				537,
				537,
				537,
				474,
				537,
				474,
				498,
				905,
				258,
				258,
				435,
				435,
				498,
				711,
				507,
				720
			]
		},
		{
			name: "Cambria",
			lineHeight: 1172.36328125,
			regular: [
				220,
				286,
				393,
				619,
				506,
				890,
				687,
				237,
				382,
				382,
				427,
				554,
				205,
				332,
				205,
				490,
				554,
				554,
				554,
				554,
				554,
				554,
				554,
				554,
				554,
				554,
				264,
				264,
				554,
				554,
				554,
				422,
				885,
				623,
				611,
				562,
				662,
				575,
				537,
				611,
				687,
				324,
				307,
				629,
				537,
				815,
				681,
				653,
				568,
				653,
				621,
				496,
				593,
				648,
				604,
				921,
				571,
				570,
				538,
				350,
				490,
				350,
				554,
				371,
				285,
				488,
				547,
				441,
				555,
				488,
				303,
				494,
				552,
				278,
				266,
				524,
				271,
				832,
				558,
				531,
				556,
				547,
				414,
				430,
				338,
				552,
				504,
				774,
				483,
				504,
				455,
				387,
				316,
				387,
				712,
				220,
				286,
				441,
				528,
				544,
				609,
				316,
				500,
				285,
				851,
				417,
				488,
				554,
				332,
				851,
				285,
				375,
				554,
				407,
				407,
				285,
				544,
				588,
				282,
				285,
				407,
				428,
				488,
				865,
				890,
				865,
				422,
				623,
				623,
				623,
				623,
				623,
				623,
				866,
				562,
				575,
				575,
				575,
				575,
				324,
				324,
				324,
				324,
				665,
				681,
				653,
				653,
				653,
				653,
				653,
				554,
				653,
				648,
				648,
				648,
				648,
				570,
				574,
				605,
				488,
				488,
				488,
				488,
				488,
				488,
				752,
				441,
				488,
				488,
				488,
				488,
				278,
				278,
				278,
				278,
				530,
				558,
				531,
				531,
				531,
				531,
				531,
				554,
				531,
				552,
				552,
				552,
				552,
				504,
				547,
				504,
				500,
				1e3,
				221,
				221,
				375,
				375,
				443,
				752,
				628,
				679
			],
			bold: [
				220,
				335,
				422,
				618,
				543,
				976,
				740,
				251,
				408,
				408,
				453,
				592,
				232,
				337,
				232,
				505,
				592,
				592,
				592,
				592,
				592,
				592,
				592,
				592,
				592,
				592,
				280,
				280,
				592,
				592,
				592,
				452,
				921,
				652,
				651,
				573,
				705,
				578,
				551,
				646,
				722,
				350,
				341,
				682,
				551,
				846,
				679,
				695,
				614,
				695,
				662,
				513,
				639,
				676,
				634,
				961,
				619,
				604,
				566,
				368,
				505,
				368,
				592,
				371,
				285,
				535,
				591,
				469,
				597,
				531,
				326,
				520,
				597,
				314,
				302,
				592,
				308,
				890,
				604,
				569,
				597,
				591,
				461,
				459,
				365,
				597,
				531,
				798,
				525,
				531,
				479,
				393,
				320,
				393,
				592,
				220,
				335,
				469,
				556,
				587,
				641,
				320,
				533,
				285,
				851,
				420,
				522,
				592,
				337,
				851,
				285,
				378,
				592,
				437,
				437,
				285,
				605,
				588,
				276,
				285,
				437,
				436,
				522,
				941,
				976,
				941,
				452,
				652,
				652,
				652,
				652,
				652,
				652,
				880,
				573,
				578,
				578,
				578,
				578,
				350,
				350,
				350,
				350,
				709,
				679,
				695,
				695,
				695,
				695,
				695,
				592,
				695,
				676,
				676,
				676,
				676,
				604,
				617,
				677,
				535,
				535,
				535,
				535,
				535,
				535,
				794,
				469,
				531,
				531,
				531,
				531,
				314,
				314,
				314,
				314,
				572,
				604,
				569,
				569,
				569,
				569,
				569,
				592,
				569,
				597,
				597,
				597,
				597,
				531,
				591,
				531,
				500,
				1e3,
				235,
				235,
				398,
				398,
				443,
				772,
				640,
				684
			]
		},
		{
			name: "Arial",
			lineHeight: 1149.90234375,
			regular: [
				278,
				278,
				355,
				556,
				556,
				889,
				667,
				191,
				333,
				333,
				389,
				584,
				278,
				333,
				278,
				278,
				556,
				556,
				556,
				556,
				556,
				556,
				556,
				556,
				556,
				556,
				278,
				278,
				584,
				584,
				584,
				556,
				1015,
				667,
				667,
				722,
				722,
				667,
				611,
				778,
				722,
				278,
				500,
				667,
				556,
				833,
				722,
				778,
				667,
				778,
				722,
				667,
				611,
				722,
				667,
				944,
				667,
				667,
				611,
				278,
				278,
				278,
				469,
				556,
				333,
				556,
				556,
				500,
				556,
				556,
				278,
				556,
				556,
				222,
				222,
				500,
				222,
				833,
				556,
				556,
				556,
				556,
				333,
				500,
				278,
				556,
				500,
				722,
				500,
				500,
				500,
				334,
				260,
				334,
				584,
				278,
				333,
				556,
				556,
				556,
				556,
				260,
				556,
				333,
				737,
				370,
				556,
				584,
				333,
				737,
				552,
				400,
				549,
				333,
				333,
				333,
				576,
				537,
				333,
				333,
				333,
				365,
				556,
				834,
				834,
				834,
				611,
				667,
				667,
				667,
				667,
				667,
				667,
				1e3,
				722,
				667,
				667,
				667,
				667,
				278,
				278,
				278,
				278,
				722,
				722,
				778,
				778,
				778,
				778,
				778,
				584,
				778,
				722,
				722,
				722,
				722,
				667,
				667,
				611,
				556,
				556,
				556,
				556,
				556,
				556,
				889,
				500,
				556,
				556,
				556,
				556,
				278,
				278,
				278,
				278,
				556,
				556,
				556,
				556,
				556,
				556,
				556,
				549,
				611,
				556,
				556,
				556,
				556,
				500,
				556,
				500,
				556,
				1e3,
				222,
				222,
				333,
				333,
				350,
				1e3,
				556,
				1e3
			],
			bold: [
				278,
				333,
				474,
				556,
				556,
				889,
				722,
				238,
				333,
				333,
				389,
				584,
				278,
				333,
				278,
				278,
				556,
				556,
				556,
				556,
				556,
				556,
				556,
				556,
				556,
				556,
				333,
				333,
				584,
				584,
				584,
				611,
				975,
				722,
				722,
				722,
				722,
				667,
				611,
				778,
				722,
				278,
				556,
				722,
				611,
				833,
				722,
				778,
				667,
				778,
				722,
				667,
				611,
				722,
				667,
				944,
				667,
				667,
				611,
				333,
				278,
				333,
				584,
				556,
				333,
				556,
				611,
				556,
				611,
				556,
				333,
				611,
				611,
				278,
				278,
				556,
				278,
				889,
				611,
				611,
				611,
				611,
				389,
				556,
				333,
				611,
				556,
				778,
				556,
				556,
				500,
				389,
				280,
				389,
				584,
				278,
				333,
				556,
				556,
				556,
				556,
				280,
				556,
				333,
				737,
				370,
				556,
				584,
				333,
				737,
				552,
				400,
				549,
				333,
				333,
				333,
				576,
				556,
				333,
				333,
				333,
				365,
				556,
				834,
				834,
				834,
				611,
				722,
				722,
				722,
				722,
				722,
				722,
				1e3,
				722,
				667,
				667,
				667,
				667,
				278,
				278,
				278,
				278,
				722,
				722,
				778,
				778,
				778,
				778,
				778,
				584,
				778,
				722,
				722,
				722,
				722,
				667,
				667,
				611,
				556,
				556,
				556,
				556,
				556,
				556,
				889,
				556,
				556,
				556,
				556,
				556,
				278,
				278,
				278,
				278,
				611,
				611,
				611,
				611,
				611,
				611,
				611,
				549,
				611,
				611,
				611,
				611,
				611,
				556,
				611,
				556,
				556,
				1e3,
				278,
				278,
				500,
				500,
				350,
				1e3,
				556,
				1e3
			]
		},
		{
			name: "Times New Roman",
			lineHeight: 1149.90234375,
			regular: [
				250,
				333,
				408,
				500,
				500,
				833,
				778,
				180,
				333,
				333,
				500,
				564,
				250,
				333,
				250,
				278,
				500,
				500,
				500,
				500,
				500,
				500,
				500,
				500,
				500,
				500,
				278,
				278,
				564,
				564,
				564,
				444,
				921,
				722,
				667,
				667,
				722,
				611,
				556,
				722,
				722,
				333,
				389,
				722,
				611,
				889,
				722,
				722,
				556,
				722,
				667,
				556,
				611,
				722,
				722,
				944,
				722,
				722,
				611,
				333,
				278,
				333,
				469,
				500,
				333,
				444,
				500,
				444,
				500,
				444,
				333,
				500,
				500,
				278,
				278,
				500,
				278,
				778,
				500,
				500,
				500,
				500,
				333,
				389,
				278,
				500,
				500,
				722,
				500,
				500,
				444,
				480,
				200,
				480,
				541,
				250,
				333,
				500,
				500,
				500,
				500,
				200,
				500,
				333,
				760,
				276,
				500,
				564,
				333,
				760,
				500,
				400,
				549,
				300,
				300,
				333,
				576,
				453,
				333,
				333,
				300,
				310,
				500,
				750,
				750,
				750,
				444,
				722,
				722,
				722,
				722,
				722,
				722,
				889,
				667,
				611,
				611,
				611,
				611,
				333,
				333,
				333,
				333,
				722,
				722,
				722,
				722,
				722,
				722,
				722,
				564,
				722,
				722,
				722,
				722,
				722,
				722,
				556,
				500,
				444,
				444,
				444,
				444,
				444,
				444,
				667,
				444,
				444,
				444,
				444,
				444,
				278,
				278,
				278,
				278,
				500,
				500,
				500,
				500,
				500,
				500,
				500,
				549,
				500,
				500,
				500,
				500,
				500,
				500,
				500,
				500,
				500,
				1e3,
				333,
				333,
				444,
				444,
				350,
				1e3,
				500,
				980
			],
			bold: [
				250,
				333,
				555,
				500,
				500,
				1e3,
				833,
				278,
				333,
				333,
				500,
				570,
				250,
				333,
				250,
				278,
				500,
				500,
				500,
				500,
				500,
				500,
				500,
				500,
				500,
				500,
				333,
				333,
				570,
				570,
				570,
				500,
				930,
				722,
				667,
				722,
				722,
				667,
				611,
				778,
				778,
				389,
				500,
				778,
				667,
				944,
				722,
				778,
				611,
				778,
				722,
				556,
				667,
				722,
				722,
				1e3,
				722,
				722,
				667,
				333,
				278,
				333,
				581,
				500,
				333,
				500,
				556,
				444,
				556,
				444,
				333,
				500,
				556,
				278,
				333,
				556,
				278,
				833,
				556,
				500,
				556,
				556,
				444,
				389,
				333,
				556,
				500,
				722,
				500,
				500,
				444,
				394,
				220,
				394,
				520,
				250,
				333,
				500,
				500,
				500,
				500,
				220,
				500,
				333,
				747,
				300,
				500,
				570,
				333,
				747,
				500,
				400,
				549,
				300,
				300,
				333,
				576,
				540,
				333,
				333,
				300,
				330,
				500,
				750,
				750,
				750,
				500,
				722,
				722,
				722,
				722,
				722,
				722,
				1e3,
				722,
				667,
				667,
				667,
				667,
				389,
				389,
				389,
				389,
				722,
				722,
				778,
				778,
				778,
				778,
				778,
				570,
				778,
				722,
				722,
				722,
				722,
				722,
				611,
				556,
				500,
				500,
				500,
				500,
				500,
				500,
				722,
				444,
				444,
				444,
				444,
				444,
				278,
				278,
				278,
				278,
				500,
				556,
				500,
				500,
				500,
				500,
				500,
				549,
				500,
				556,
				556,
				556,
				556,
				500,
				556,
				500,
				500,
				1e3,
				333,
				333,
				500,
				500,
				350,
				1e3,
				500,
				1e3
			]
		},
		{
			name: "Courier New",
			lineHeight: 1132.8125,
			regular: [
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600
			],
			bold: [
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600,
				600
			]
		}
	];
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
	//#region \0@oxc-project+runtime@0.150.0/helpers/esm/objectSpread2.js
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
	//#region src/text-layout/text-width.ts
	/**
	* Estimates how much space text takes up, from the widths of the characters in common fonts.
	*
	* The estimate is close for the fonts in {@link FONT_WIDTHS}. Other fonts are measured with the one most like them,
	* so their estimates are rougher. Kerning and ligatures are left out, which makes text a little wider than Word draws it.
	*
	* @module
	*/
	var DEFAULT_FONT = "Times New Roman";
	var TAB_STOP$1 = 36;
	var SIMILAR_FONTS = [
		[/^(carlito|calibri light|segoe ui|candara|corbel)$/i, "Calibri"],
		[/^caladea$/i, "Cambria"],
		[/mono|courier|consolas|code|typewriter/i, "Courier New"],
		[new RegExp("times|tinos|liberation serif|georgia|garamond|palatino|book antiqua|(?<!sans[ -]?)serif|roman", "i"), "Times New Roman"]
	];
	var CHARACTER_INDEX = new Map([...FONT_WIDTH_CHARACTERS].map((character, index) => [character.codePointAt(0), index]));
	var AVERAGE_LETTER_INDEXES = [..."abcdefghijklmnopqrstuvwxyz"].map((letter) => CHARACTER_INDEX.get(letter.codePointAt(0)));
	/**
	* The widths to measure a font with: its own, or those of the most similar font in the table.
	* Sans-serif fonts that aren't in the table, such as Aptos and Helvetica, are measured as Arial.
	*/
	var widthsOf = (font = DEFAULT_FONT) => {
		var _named;
		const named = (name) => FONT_WIDTHS.find((known) => known.name.toLowerCase() === name.toLowerCase());
		const similar = SIMILAR_FONTS.find(([pattern]) => pattern.test(font));
		return (_named = named(font)) !== null && _named !== void 0 ? _named : named(similar ? similar[1] : "Arial");
	};
	var isWide = (code) => code >= 4352 && code <= 4447 || code >= 11904 && code <= 42191 || code >= 44032 && code <= 55203 || code >= 63744 && code <= 64255 || code >= 65072 && code <= 65103 || code >= 65280 && code <= 65376 || code >= 65504 && code <= 65510 || code >= 127744;
	/**
	* The width of a character in thousandths of an em. Characters that aren't in the table are as wide as an average
	* lowercase letter, or a whole em for wide characters, and combining accents take no space.
	*/
	var characterWidth = (widths, code) => {
		const index = CHARACTER_INDEX.get(code);
		if (index !== void 0) return widths[index];
		if (isWide(code)) return 1e3;
		return code >= 768 && code <= 879 ? 0 : AVERAGE_LETTER_INDEXES.reduce((total, letter) => total + widths[letter], 0) / AVERAGE_LETTER_INDEXES.length;
	};
	var sizeOf = ({ size = 10 }) => size;
	/**
	* How wide a line of text is, in points. Tabs move to the next half inch, counted from the start of the line.
	*
	* @param start - Where the text starts on its line, in points
	*/
	var measureTextWidth = (text, font = {}, start = 0) => {
		const { regular, bold } = widthsOf(font.font);
		const widths = font.bold ? bold : regular;
		const size = sizeOf(font);
		const { characterSpacing = 0, scale = 100 } = font;
		return [...text].reduce((position, character) => character === "	" ? (Math.floor(position / TAB_STOP$1) + 1) * TAB_STOP$1 : position + characterWidth(widths, character.codePointAt(0)) * size * scale / 1e5 + characterSpacing, start) - start;
	};
	/**
	* How tall a line of single-spaced text is, in points.
	*/
	var measureLineHeight = (font = {}) => widthsOf(font.font).lineHeight * sizeOf(font) / 1e3;
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
	var isOff = (value) => value === false || value === 0 || value === "false" || value === "0" || value === "off";
	/**
	* An on/off property, such as `w:b`: on when present, unless its value says otherwise.
	*/
	var onOff = (children, name) => {
		const element = children.find((child) => name in child);
		return element ? !isOff(attributesOf(element[name])["w:val"]) : void 0;
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
	/**
	* Reads run properties (`w:rPr`). A font of the theme (`w:asciiTheme`) takes the place of the font named beside it.
	*/
	var readRunFormat = (element, themeFonts) => {
		var _ref, _ref2, _themeFontOf;
		const children = childrenOf(element);
		const fonts = attributesOf(find(children, "w:rFonts"));
		return withoutUndefined({
			font: (_ref = (_ref2 = (_themeFontOf = themeFontOf(fonts["w:asciiTheme"], themeFonts)) !== null && _themeFontOf !== void 0 ? _themeFontOf : stringOf(fonts["w:ascii"])) !== null && _ref2 !== void 0 ? _ref2 : themeFontOf(fonts["w:hAnsiTheme"], themeFonts)) !== null && _ref !== void 0 ? _ref : stringOf(fonts["w:hAnsi"]),
			size: scaled(numberOf(attributesOf(find(children, "w:sz"))["w:val"]), 2),
			bold: onOff(children, "w:b"),
			italic: onOff(children, "w:i"),
			allCaps: onOff(children, "w:caps"),
			smallCaps: onOff(children, "w:smallCaps"),
			hidden: onOff(children, "w:vanish"),
			characterSpacing: scaled(numberOf(attributesOf(find(children, "w:spacing"))["w:val"]), 20),
			scale: numberOf(attributesOf(find(children, "w:w"))["w:val"])
		});
	};
	var readLineSpacing = (spacing) => {
		const line = numberOf(spacing["w:line"]);
		if (line === void 0) return;
		const rule = spacing["w:lineRule"];
		return rule === "exact" || rule === "atLeast" ? {
			rule,
			height: line / 20
		} : {
			rule: "multiple",
			multiple: line / SINGLE_LINE
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
	/**
	* Reads the tab stops of paragraph properties (`w:tabs`).
	*/
	var readTabs = (element) => {
		const tabs = childrenOf(element).filter((child) => "w:tab" in child);
		return tabs.length === 0 ? void 0 : tabs.map((tab) => {
			var _numberOf, _TAB_ALIGNMENTS$Strin;
			const attributes = attributesOf(tab["w:tab"]);
			return {
				position: ((_numberOf = numberOf(attributes["w:pos"])) !== null && _numberOf !== void 0 ? _numberOf : 0) / 20,
				alignment: (_TAB_ALIGNMENTS$Strin = TAB_ALIGNMENTS[String(attributes["w:val"])]) !== null && _TAB_ALIGNMENTS$Strin !== void 0 ? _TAB_ALIGNMENTS$Strin : "left"
			};
		});
	};
	/**
	* Reads paragraph properties (`w:pPr`).
	*/
	var readParagraphFormat = (element) => {
		const children = childrenOf(element);
		const spacing = attributesOf(find(children, "w:spacing"));
		const indent = attributesOf(find(children, "w:ind"));
		const twips = (...names) => scaled(names.map((name) => numberOf(indent[name])).find((value) => value !== void 0), 20);
		const hanging = twips("w:hanging");
		return withoutUndefined({
			spaceBefore: scaled(numberOf(spacing["w:before"]), 20),
			spaceAfter: scaled(numberOf(spacing["w:after"]), 20),
			lineSpacing: readLineSpacing(spacing),
			indentLeft: twips("w:start", "w:left"),
			indentRight: twips("w:end", "w:right"),
			firstLineIndent: hanging === void 0 ? twips("w:firstLine") : -hanging,
			contextualSpacing: onOff(children, "w:contextualSpacing"),
			keepNext: onOff(children, "w:keepNext"),
			keepLines: onOff(children, "w:keepLines"),
			pageBreakBefore: onOff(children, "w:pageBreakBefore"),
			widowControl: onOff(children, "w:widowControl"),
			tabs: readTabs(find(children, "w:tabs"))
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
	* Reads the document's defaults and styles from its styles part (`w:styles`), once it is formatted, with the fonts of
	* its theme.
	*/
	var readTextStyles = (xml, themeFonts = OFFICE_THEME_FONTS) => {
		const root = childrenOf(xml["w:styles"]);
		const defaults = root.filter((child) => "w:docDefaults" in child).map((child) => childrenOf(child["w:docDefaults"]));
		const styles = root.filter((child) => "w:style" in child).map((child) => {
			var _stringOf;
			const children = childrenOf(child["w:style"]);
			const attributes = attributesOf(child["w:style"]);
			return {
				id: stringOf(attributes["w:styleId"]),
				isDefault: attributes["w:default"] !== void 0 && !isOff(attributes["w:default"]),
				definition: _objectSpread2({
					type: (_stringOf = stringOf(attributes["w:type"])) !== null && _stringOf !== void 0 ? _stringOf : "paragraph",
					basedOn: valueOf(children, "w:basedOn"),
					run: readRunFormat(find(children, "w:rPr"), themeFonts),
					paragraph: readParagraphFormat(find(children, "w:pPr"))
				}, attributes["w:type"] === "table" ? { cellMargins: readCellMargins(find(childrenOf(find(children, "w:tblPr")), "w:tblCellMar")) } : {})
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
		const side = (...names) => names.map((name) => scaled(numberOf(attributesOf(find(children, name))["w:w"]), 20)).find((value) => value !== void 0);
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
	* The parts of run formatting that change the font text is measured in.
	*/
	var fontOf = ({ font, size, bold, italic, characterSpacing, scale }) => withoutUndefined({
		font,
		size,
		bold,
		italic,
		characterSpacing,
		scale
	});
	/**
	* A span of text in its formatting: capitals for all caps, and smaller capitals for the small letters of small caps.
	*/
	var spansOf = (text, format) => {
		var _font$size;
		const { allCaps, smallCaps, hidden } = format;
		const font = fontOf(format);
		if (hidden) return [];
		if (allCaps || !smallCaps) return [_objectSpread2(_objectSpread2({}, font), {}, { text: allCaps ? text.toUpperCase() : text })];
		const small = _objectSpread2(_objectSpread2({}, font), {}, { size: ((_font$size = font.size) !== null && _font$size !== void 0 ? _font$size : 10) * SMALL_CAPS_SCALE });
		return text.split(new RegExp("(\\p{Ll}+)", "u")).filter((part) => part.length > 0).map((part) => new RegExp("^\\p{Ll}", "u").test(part) ? _objectSpread2(_objectSpread2({}, small), {}, { text: part.toUpperCase() }) : _objectSpread2(_objectSpread2({}, font), {}, { text: part }));
	};
	//#endregion
	//#region src/text-layout/line-breaking.ts
	/**
	* Breaks a paragraph into lines as Word breaks it, for laying out pages: where each line wraps, how tall it is, and
	* which bookmarks start on it.
	*
	* Lines break at spaces, after hyphens, and between Chinese, Japanese and Korean characters. Tabs move to the
	* paragraph's tab stops, or to the document's default ones. Each line is as tall as the tallest text or picture on
	* it, with the paragraph's line spacing.
	*
	* @module
	*/
	var DEFAULT_MEASURER = {
		measureWidth: (text, font) => measureTextWidth(text, font),
		measureLineHeight
	};
	var DEFAULT_TAB_STOP = 36;
	var TOLERANCE$1 = .01;
	var CJK_LETTER = new RegExp("[\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}\\p{Script=Hangul}]", "u");
	var NO_LINE_START = /* @__PURE__ */ new Set([..."、。，．：；？！）」』】〕〉》ー々ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ,.:;?!)]}"]);
	var NO_LINE_END = /* @__PURE__ */ new Set([..."（「『【〔〈《([{"]);
	/**
	* Whether a line can break between two characters with no space between them: after a hyphen that isn't before a
	* digit, and before or after a Chinese, Japanese or Korean letter.
	*/
	var canBreakBetween = (before, after) => !NO_LINE_START.has(after) && !NO_LINE_END.has(before) && (before === "-" && !/[\d-]/.test(after) || CJK_LETTER.test(before) || CJK_LETTER.test(after));
	var splitText = (text) => text.split(/( +)/).filter((part) => part.length > 0).flatMap((part) => {
		if (part.startsWith(" ")) return [{
			text: part,
			isSpace: true
		}];
		const characters = [...part];
		return characters.reduce((words, character, index) => {
			var _words;
			return index > 0 && canBreakBetween(characters[index - 1], character) ? [...words, character] : [...words.slice(0, -1), `${(_words = words[words.length - 1]) !== null && _words !== void 0 ? _words : ""}${character}`];
		}, []).map((word) => ({
			text: word,
			isSpace: false
		}));
	});
	var lastCharacter = (text) => [...text].pop();
	/**
	* Turns a part of a paragraph into tokens. Pieces of words next to each other in different fonts are one word, unless
	* the line can break between them.
	*/
	var tokenize = (items) => items.reduce((tokens, item) => {
		if (item.type === "text") return splitText(item.text).reduce((all, { text, isSpace }) => {
			const last = all[all.length - 1];
			const type = isSpace ? "space" : "word";
			return (last === null || last === void 0 ? void 0 : last.type) === type && (isSpace || !canBreakBetween(lastCharacter(last.pieces[last.pieces.length - 1].text), [...text][0])) ? [...all.slice(0, -1), {
				type,
				pieces: [...last.pieces, {
					text,
					font: item.font
				}]
			}] : [...all, {
				type,
				pieces: [{
					text,
					font: item.font
				}]
			}];
		}, tokens);
		return [...tokens, item];
	}, []);
	/**
	* Splits a paragraph's content at its breaks.
	*/
	var segmentsOf = (items) => {
		const breaks = items.flatMap((item, index) => item.type === "break" ? [index] : []);
		return [0, ...breaks.map((index) => index + 1)].map((start, index) => {
			const end = breaks[index];
			return {
				tokens: tokenize(items.slice(start, end)),
				end: end === void 0 ? void 0 : items[end]
			};
		});
	};
	var widthOf = (pieces, measurer) => pieces.reduce((total, { text, font }) => total + measurer.measureWidth(text, font), 0);
	/**
	* The height of single-spaced lines, with this line spacing. Word doesn't round it: Calibri 11 is 268.55 twips, and
	* 289.82 at 259 twips' multiple spacing, where LibreOffice rounds them to whole twips, 269 and 290.
	*/
	var spaced = (natural, spacing) => {
		if (!spacing) return natural;
		if (spacing.rule === "multiple") return natural * spacing.multiple;
		return spacing.rule === "exact" ? spacing.height : Math.max(natural, spacing.height);
	};
	/**
	* Where a tab moves to: the next of the paragraph's tab stops, or the next default one past the last of them. On the
	* first line of a paragraph with a hanging indent, the indent is a stop too. Undefined when the next stop is past the
	* end of the line.
	*/
	var nextStop = (position, stops, defaultStop, limit) => {
		var _stops$find;
		const stop = (_stops$find = stops.find((given) => given.position > position + TOLERANCE$1)) !== null && _stops$find !== void 0 ? _stops$find : {
			position: (Math.floor((position + TOLERANCE$1) / defaultStop) + 1) * defaultStop,
			alignment: "left"
		};
		return stop.position > limit + TOLERANCE$1 ? void 0 : stop;
	};
	/**
	* The width of the text after a tab, up to the next tab or the end of the part: what lines up with a right or centered
	* stop. Spaces at its end aren't counted.
	*/
	var widthAfterTab = (tokens, measurer) => {
		const next = tokens.findIndex((token) => token.type === "tab");
		const text = next === -1 ? tokens : tokens.slice(0, next);
		const lastWord = text.findLastIndex((token) => token.type !== "space" && token.type !== "marker");
		return text.slice(0, lastWord + 1).reduce((total, token) => {
			if (token.type === "box") return total + token.width;
			return token.type === "word" || token.type === "space" ? total + widthOf(token.pieces, measurer) : total;
		}, 0);
	};
	/**
	* A paragraph's tab stops in order, and those of its first line, where a hanging indent is a stop too.
	*/
	var stopsOf = (tabStops, { indentLeft = 0, firstLineIndent = 0 }) => {
		const stops = [...tabStops].sort((a, b) => a.position - b.position);
		return {
			stops,
			firstLineStops: firstLineIndent < 0 ? [...stops, {
				position: indentLeft,
				alignment: "left"
			}].sort((a, b) => a.position - b.position) : stops
		};
	};
	/**
	* Measures how narrow and how wide a paragraph can be, which Word sizes the columns of tables whose cells have no widths
	* by. Spaces at the end of a line take no room, as they don't when it wraps.
	*
	* @param items - The paragraph's content, in order
	*/
	var measureContentWidths = (items, { format = {}, tabStops = [], defaultTabStop = DEFAULT_TAB_STOP, measurer = DEFAULT_MEASURER }) => {
		const { indentLeft = 0, indentRight = 0, firstLineIndent = 0 } = format;
		const { stops, firstLineStops } = stopsOf(tabStops, format);
		return segmentsOf(items).reduce((widths, { tokens }, segmentIndex) => {
			const first = segmentIndex === 0;
			let position = indentLeft + (first ? firstLineIndent : 0);
			let end = position;
			let { min } = widths;
			for (const [index, token] of tokens.entries()) {
				if (token.type === "marker") continue;
				if (token.type === "space") {
					position += widthOf(token.pieces, measurer);
					continue;
				}
				if (token.type === "tab") {
					const stop = nextStop(position, first ? firstLineStops : stops, defaultTabStop, Infinity);
					const after = widthAfterTab(tokens.slice(index + 1), measurer);
					const shift = stop.alignment === "left" ? 0 : stop.alignment === "center" ? after / 2 : after;
					position = Math.max(position, stop.position - shift);
					end = position;
					continue;
				}
				const tokenWidth = token.type === "box" ? token.width : widthOf(token.pieces, measurer);
				const start = end === indentLeft + (first ? firstLineIndent : 0) ? position : indentLeft;
				min = Math.max(min, start + tokenWidth + indentRight);
				position += tokenWidth;
				end = position;
			}
			return {
				min,
				max: Math.max(widths.max, min, end + indentRight)
			};
		}, {
			min: 0,
			max: 0
		});
	};
	/**
	* Breaks a paragraph into lines, as Word breaks it.
	*
	* @param items - The paragraph's content, in order
	*/
	var layoutLines = (items, { width, format = {}, tabStops = [], defaultTabStop = DEFAULT_TAB_STOP, markFont = {}, measurer = DEFAULT_MEASURER }) => {
		const { indentLeft = 0, indentRight = 0, firstLineIndent = 0, lineSpacing } = format;
		const markHeight = measurer.measureLineHeight(markFont);
		const { stops, firstLineStops } = stopsOf(tabStops, format);
		const parts = segmentsOf(items);
		const [previous, last] = parts.slice(-2);
		const segments = parts.length > 1 && previous.end.kind === "page" && last.tokens.every((token) => token.type === "marker") ? [...parts.slice(0, -2), {
			tokens: [...previous.tokens, ...last.tokens],
			end: previous.end
		}] : parts;
		const lines = [];
		/** Where a line ends, from its index: where the line being filled ends, unless another is given */
		const limitOf = (line = lines.length) => (typeof width === "number" ? width : width(line)) - indentRight;
		let first = true;
		for (const [segmentIndex, { tokens, end }] of segments.entries()) {
			const isLast = segmentIndex === segments.length - 1;
			let line = {
				position: indentLeft + (first ? firstLineIndent : 0),
				natural: 0,
				markers: [],
				pending: [],
				started: false,
				first
			};
			const finish = (state, breakAfter, extra = 0) => {
				const natural = Math.max(state.started ? state.natural : markHeight, extra);
				lines.push(_objectSpread2({
					height: spaced(natural, lineSpacing),
					markers: [...state.markers, ...state.pending]
				}, breakAfter ? { breakAfter } : {}));
			};
			const wrap = (state) => {
				finish(_objectSpread2(_objectSpread2({}, state), {}, { pending: [] }));
				return {
					position: indentLeft,
					natural: 0,
					markers: [],
					pending: state.pending,
					started: false,
					first: false
				};
			};
			/** Puts the bookmarks waiting for the next word, picture or tab on the line it is on */
			const place = (state) => _objectSpread2(_objectSpread2({}, state), {}, {
				markers: [...state.markers, ...state.pending],
				pending: []
			});
			for (const [index, token] of tokens.entries()) {
				if (token.type === "marker") {
					line = _objectSpread2(_objectSpread2({}, line), {}, { pending: [...line.pending, token.name] });
					continue;
				}
				if (token.type === "space") {
					const height = Math.max(...token.pieces.map(({ font }) => measurer.measureLineHeight(font)));
					line = _objectSpread2(_objectSpread2({}, line), {}, {
						position: line.position + widthOf(token.pieces, measurer),
						natural: Math.max(line.natural, height)
					});
					continue;
				}
				if (token.type === "tab") {
					var _nextStop;
					const height = measurer.measureLineHeight(token.font);
					const stop = (_nextStop = nextStop(line.position, line.first ? firstLineStops : stops, defaultTabStop, limitOf())) !== null && _nextStop !== void 0 ? _nextStop : line.started ? nextStop(indentLeft, stops, defaultTabStop, limitOf(lines.length + 1)) : void 0;
					if (stop === void 0) {
						line = _objectSpread2(_objectSpread2({}, line), {}, {
							natural: Math.max(line.natural, height),
							started: true
						});
						continue;
					}
					if (stop.position <= line.position + TOLERANCE$1) line = wrap(line);
					line = place(line);
					const after = widthAfterTab(tokens.slice(index + 1), measurer);
					const shift = stop.alignment === "left" ? 0 : stop.alignment === "center" ? after / 2 : after;
					line = _objectSpread2(_objectSpread2({}, line), {}, {
						position: Math.max(line.position, stop.position - shift),
						natural: Math.max(line.natural, height),
						started: true
					});
					continue;
				}
				const tokenWidth = token.type === "box" ? token.width : widthOf(token.pieces, measurer);
				const tokenHeight = token.type === "box" ? token.height : Math.max(...token.pieces.map(({ font }) => measurer.measureLineHeight(font)));
				if (line.started && line.position + tokenWidth > limitOf() + TOLERANCE$1) line = wrap(line);
				line = place(line);
				let rest = tokenWidth;
				while (token.type === "word" && line.position + rest > limitOf() + TOLERANCE$1 && limitOf() - indentLeft > 0) {
					rest -= limitOf() - line.position;
					line = wrap(_objectSpread2(_objectSpread2({}, line), {}, {
						natural: Math.max(line.natural, tokenHeight),
						started: true
					}));
				}
				line = _objectSpread2(_objectSpread2({}, line), {}, {
					position: line.position + rest,
					natural: Math.max(line.natural, tokenHeight),
					started: true
				});
			}
			if (!end) finish(line);
			else {
				const breakHeight = isLast && !line.started ? markHeight : measurer.measureLineHeight(end.font);
				finish(_objectSpread2(_objectSpread2({}, line), {}, {
					natural: Math.max(line.started ? line.natural : 0, breakHeight),
					started: true
				}), end.kind === "line" ? void 0 : end.kind);
			}
			first = false;
		}
		return lines;
	};
	//#endregion
	//#region src/layout/measure-width.ts
	/**
	* Measuring text with other widths than those of the width tables, such as with the fonts a browser has, through
	* Pretext.
	*
	* @module
	*/
	var PIXELS_PER_POINT = 96 / 72;
	var TAB_STOP = 36;
	/** A font's name as a CSS font family, in quotes */
	var quoted = (name) => `"${name.replace(/["\\]/g, "\\$&")}"`;
	/**
	* Measures text with Pretext, in the fonts the page has, for laying out a document's pages in a browser. Pretext needs
	* a canvas to measure with, an `OffscreenCanvas` or a page's, so it doesn't work in Node.
	*
	* Load the fonts first, such as with `document.fonts.load("11pt Calibri")`: until a font has loaded, the browser
	* measures text in another, and Pretext keeps the widths it measured.
	*
	* ```ts
	* import * as pretext from "@chenglou/pretext";
	* import { estimatePageNumbersWith, measureWithPretext } from "docx/layout";
	*
	* new Document({ pageNumbers: estimatePageNumbersWith({ measureWidth: measureWithPretext(pretext) }), sections: [...] });
	* ```
	*
	* @param pretext - Pretext's module, or the two functions of it that are used
	* @publicApi
	*/
	var measureWithPretext = ({ prepareWithSegments, measureNaturalWidth }, { fontFamilies = {} } = {}) => {
		const families = new Map(Object.entries(fontFamilies));
		const widths = /* @__PURE__ */ new Map();
		return (text, { name, size, bold, italic }) => {
			var _families$get;
			const family = (_families$get = families.get(name)) !== null && _families$get !== void 0 ? _families$get : quoted(name);
			const font = `${italic ? "italic " : ""}${bold ? "bold " : ""}${size * PIXELS_PER_POINT}px ${family}`;
			const key = `${font}\n${text}`;
			const known = widths.get(key);
			if (known !== void 0) return known;
			const width = measureNaturalWidth(prepareWithSegments(text, font, { whiteSpace: "pre-wrap" })) / PIXELS_PER_POINT;
			widths.set(key, width);
			return width;
		};
	};
	/**
	* A measurer that measures widths with a function, and lines' heights with the width tables, as Word works them out
	* from the font's height and the paragraph's spacing.
	*/
	var measurerOf = (measureWidth) => ({
		measureWidth: (text, { font = DEFAULT_FONT, size = 10, bold = false, italic = false, characterSpacing = 0, scale = 100 }) => {
			const widthOf = (part) => part.length === 0 ? 0 : measureWidth(part, {
				name: font,
				size,
				bold,
				italic
			}) * scale / 100 + characterSpacing * [...part].length;
			return text.split("	").reduce((position, part, index) => (index === 0 ? 0 : (Math.floor(position / TAB_STOP) + 1) * TAB_STOP) + widthOf(part), 0);
		},
		measureLineHeight
	});
	//#endregion
	//#region src/layout/column-widths.ts
	var sum$1 = (values) => values.reduce((total, value) => total + value, 0);
	/**
	* Narrows columns to fit the room, toward their widest words, each by its share of the width they would give up. Columns
	* whose widest words don't fit are as narrow as those.
	*/
	var narrowed = (columns, room) => {
		const total = sum$1(columns.map(({ width }) => width));
		const least = sum$1(columns.map(({ min }) => min));
		return total <= room ? columns.map(({ width }) => width) : columns.map(({ min, width }) => least >= room ? min : min + (width - min) * (room - least) / (total - least));
	};
	/**
	* Sizes the columns of a table whose cells don't all have widths, as Word does, and gives each cell the width of its
	* column, less its margins. A column is as wide as its cells give it, or, without, as its widest line of text, and never
	* narrower than its widest word. A table with a width of its own has its columns widened in proportion to fill it.
	* When the columns are too wide for the room, those sized to their text are narrowed toward their widest words, each by
	* its share of the width they would give up, and those given widths keep them unless that isn't enough.
	*
	* A table whose cells all have widths keeps them, unless a word is longer than its cell gives it. Word then widens that
	* column to the word. A table with no width of its own grows, up to the room, and one with a width keeps it, and the
	* other columns are narrowed toward their widest words, each by its share of the width they would give up, as columns
	* given widths are in a table sized to its text.
	*
	* @param available - The width the table is in, in points: the page's text, a column's, or a table cell's
	* @param measure - How narrow and how wide the content of a cell can be, in points
	*/
	var fitColumns = (table, available, measure) => {
		var _tableWidth$width;
		const { fit, widen, rows } = table;
		if (!fit && !widen) return table;
		const cells = rows.flatMap((row) => row.cells);
		const content = new Map(cells.map((cell) => {
			const text = measure(cell.blocks);
			const margins = cell.marginLeft + cell.marginRight;
			return [cell, {
				min: text.min + margins,
				max: text.max + margins
			}];
		}));
		if (widen) {
			if (!cells.some((cell) => content.get(cell).min > cell.ownWidth)) return table;
			if (widen.acrossColumns) return _objectSpread2(_objectSpread2({}, table), {}, { unsupported: "a word longer than its cell in a table with cells merged across columns" });
		}
		const count = Math.max(0, ...cells.map(({ column }) => column + 1));
		const columns = Array.from({ length: count }, (_, column) => {
			const inColumn = cells.filter((cell) => cell.column === column).map((cell) => _objectSpread2({ cell }, content.get(cell)));
			const min = Math.max(0, ...inColumn.map((cell) => cell.min));
			const own = inColumn.flatMap(({ cell }) => cell.ownWidth === void 0 ? [] : [cell.ownWidth]);
			return {
				min,
				width: own.length > 0 ? Math.max(min, ...own) : Math.max(min, ...inColumn.map((cell) => cell.max)),
				given: own.length > 0
			};
		});
		const total = sum$1(columns.map(({ width }) => width));
		const tableWidth = fit !== null && fit !== void 0 ? fit : widen;
		const target = (_tableWidth$width = tableWidth.width) !== null && _tableWidth$width !== void 0 ? _tableWidth$width : tableWidth.share === void 0 ? void 0 : tableWidth.share * available;
		const room = target !== null && target !== void 0 ? target : available;
		if (widen) {
			if (sum$1(columns.map(({ min }) => min)) > room) return _objectSpread2(_objectSpread2({}, table), {}, { unsupported: "a word longer than its table can make room for" });
			if (target !== void 0 && total < target) return _objectSpread2(_objectSpread2({}, table), {}, { unsupported: "a long word in a table wider than its cells" });
		}
		const given = columns.filter((column) => column.given);
		const sized = columns.filter((column) => !column.given);
		const givenWidths = narrowed(given, room - sum$1(sized.map(({ min }) => min)));
		const sizedWidths = narrowed(sized, room - sum$1(givenWidths));
		const widths = columns.map((column) => {
			if (target !== void 0 && total < target && total > 0) return column.width * target / total;
			return column.given ? givenWidths[given.indexOf(column)] : sizedWidths[sized.indexOf(column)];
		});
		return _objectSpread2(_objectSpread2({}, table), {}, { rows: rows.map((row) => _objectSpread2(_objectSpread2({}, row), {}, { cells: row.cells.map((cell) => _objectSpread2(_objectSpread2({}, cell), {}, { width: widths[cell.column] - cell.marginLeft - cell.marginRight })) })) });
	};
	//#endregion
	//#region src/layout/number-format.ts
	/**
	* Writes numbers as Word writes page and list numbers in each of its formats (`ST_NumberFormat`).
	*
	* @module
	*/
	var ROMAN = [
		[1e3, "m"],
		[900, "cm"],
		[500, "d"],
		[400, "cd"],
		[100, "c"],
		[90, "xc"],
		[50, "l"],
		[40, "xl"],
		[10, "x"],
		[9, "ix"],
		[5, "v"],
		[4, "iv"],
		[1, "i"]
	];
	var roman = (value) => ROMAN.reduce(({ rest, text }, [amount, numeral]) => ({
		rest: rest % amount,
		text: text + numeral.repeat(Math.floor(rest / amount))
	}), {
		rest: value,
		text: ""
	}).text;
	/** Letters as Word writes them: a to z, then aa to zz, then aaa and so on */
	var letters = (value) => String.fromCharCode(97 + (value - 1) % 26).repeat(Math.ceil(value / 26));
	var ordinalSuffix = (value) => {
		var _ref;
		return value % 100 >= 11 && value % 100 <= 13 ? "th" : (_ref = [
			"th",
			"st",
			"nd",
			"rd"
		][value % 10]) !== null && _ref !== void 0 ? _ref : "th";
	};
	/**
	* A number in one of Word's number formats, such as `"iv"` for 4 in `lowerRoman`, or undefined for formats it doesn't
	* write, such as those of other languages' scripts. Word writes numbers that are zero or less in the letter and roman
	* formats as decimal numbers.
	*/
	var formatNumber = (value, format = "decimal") => {
		const positive = value > 0;
		switch (format) {
			case "decimal": return String(value);
			case "decimalZero": return value >= 0 && value < 10 ? `0${value}` : String(value);
			case "numberInDash": return `- ${value} -`;
			case "ordinal": return positive ? `${value}${ordinalSuffix(value)}` : String(value);
			case "lowerRoman": return positive ? roman(value) : String(value);
			case "upperRoman": return positive ? roman(value).toUpperCase() : String(value);
			case "lowerLetter": return positive ? letters(value) : String(value);
			case "upperLetter": return positive ? letters(value).toUpperCase() : String(value);
			case "none": return "";
			default: return;
		}
	};
	//#endregion
	//#region src/layout/paginate.ts
	/**
	* Lays out a document's pages as Word does, to find the page each bookmark starts on.
	*
	* Each page's body is filled from the top, between the page's margins, or its header and footer where they are taller,
	* and in columns, the first column and then the next, with each line broken at the width of the column it is in. The
	* columns on the page before a continuous section break are balanced, as short as what is in them fits in. A section
	* that starts in the next column starts in the next column of the page when the section before has as many columns and
	* one is left, and on a new page otherwise.
	* Paragraphs break into lines, and pages break between lines, as their keep and widow control settings allow. Table
	* rows break across pages between the lines of their cells, unless they are kept whole, and the table's header rows are
	* repeated at the top of each page and column. The footnotes of each page's lines take room at its bottom, laid out in
	* the section's columns in a section in columns, and one that doesn't fit below its reference continues at the bottom of
	* the next page, or pages, broken as the body is. The endnotes follow the body.
	* It stops at the first thing it can't lay out yet, and the bookmarks after it aren't placed.
	*
	* @module
	*/
	var TOLERANCE = .01;
	/**
	* The lines of paragraphs without page references, by the measurer and widths they were laid out with. They are the same
	* each time the pages are laid out again with the page numbers worked out before.
	*/
	var laidOutLines = /* @__PURE__ */ new WeakMap();
	/** How a table in a table cell is placed when its row breaks across pages: whole, as a line that can't be broken */
	var UNBROKEN = {
		spaceBefore: 0,
		spaceAfter: 0,
		keepNext: false,
		keepLines: true,
		widowControl: false,
		pageBreakBefore: false
	};
	/** Thrown to stop laying out at something that can't be laid out yet */
	var Unsupported = class extends Error {};
	/** Thrown to stop laying out columns being balanced in a height they don't fit in */
	var Overflow = class extends Error {};
	/**
	* Thrown to lay out the columns of a page again when its footnotes take more room than the columns before the one being
	* filled were laid out above (`area`)
	*/
	var NotesGrew = class extends Error {
		constructor(area) {
			super();
			_defineProperty(this, "area", void 0);
			this.area = area;
		}
	};
	var sum = (values) => values.reduce((total, value) => total + value, 0);
	/**
	* How many of a paragraph's lines, from one of them, fit in the room left on a page (`fits`), and how many of those go on
	* it (`count`): with widow control, a paragraph's first line isn't left alone at the bottom of a page, nor its last line
	* at the top of the next, and with keepLines, a paragraph that doesn't fit moves to the next page whole. The first lines
	* can need room below them too, for their footnotes, or for the space after a paragraph that ends in a table cell
	* (`roomBelow`, from the number of lines).
	*/
	var linesThatFit = (lines, room, { keepLines, widowControl }, isFirstLine, roomBelow = () => 0) => {
		const fits = lines.map((_, line) => sum(lines.slice(0, line + 1).map(({ height }) => height))).findIndex((end, line) => end + roomBelow(line + 1) > room + TOLERANCE);
		return fits === -1 ? {
			fits: lines.length,
			count: lines.length
		} : {
			fits,
			count: linesKept(lines.length, fits, {
				keepLines,
				widowControl
			}, isFirstLine)
		};
	};
	/** How many of a paragraph's lines (`total`, from one of them) go on a page where some of them fit (`fits`) */
	var linesKept = (total, fits, { keepLines, widowControl }, isFirstLine) => {
		if (keepLines && isFirstLine) return 0;
		if (!widowControl || total < 2) return fits;
		const withoutWidow = total - fits === 1 ? fits - 1 : fits;
		return isFirstLine && withoutWidow === 1 ? 0 : withoutWidow;
	};
	/**
	* Lays out a document's pages, and finds the page each bookmark starts on.
	*/
	var paginate = (content, { pageNumbers = /* @__PURE__ */ new Map(), pageCount: givenPageCount, sectionPageCounts: givenSectionPageCounts = [], measurer = DEFAULT_MEASURER } = {}) => {
		var _laidOutLines$get;
		const { sections, defaultTabStop, evenAndOddHeaders, addsParagraphSpacing, footnotes, footnoteSeparator, footnoteContinuationSeparator, endnotes } = content;
		const blocks = [...content.blocks, ...endnotes.map((block) => ({
			block,
			section: sections.length - 1
		}))];
		/** The space between two paragraphs: the larger of the space after the first and before the second, or both */
		const between = (after, before) => addsParagraphSpacing ? after + before : Math.max(after, before);
		let sectionIndex = 0;
		/** The text of the results of fields that depend on the pages, from the numbers given */
		const itemsOf = (items) => items.map((item) => {
			if (item.type === "pageReference") {
				var _pageNumbers$get;
				return {
					type: "text",
					text: (_pageNumbers$get = pageNumbers.get(item.bookmark)) !== null && _pageNumbers$get !== void 0 ? _pageNumbers$get : "",
					font: item.font
				};
			}
			if (item.type === "pageCount") {
				const count = item.scope === "document" ? givenPageCount : givenSectionPageCounts[sectionIndex];
				return {
					type: "text",
					text: count === void 0 ? "" : String(count),
					font: item.font
				};
			}
			return item;
		});
		const byParagraph = (_laidOutLines$get = laidOutLines.get(measurer)) !== null && _laidOutLines$get !== void 0 ? _laidOutLines$get : /* @__PURE__ */ new WeakMap();
		laidOutLines.set(measurer, byParagraph);
		/** A paragraph's lines, broken at a width, or at the width of each line from those given on */
		const linesOf = (paragraph, widths) => {
			var _byParagraph$get, _byWidths$get;
			const given = typeof widths === "number" ? [{
				from: 0,
				width: widths
			}] : widths;
			const key = given.map(({ from, width }) => `${from}:${width}`).join(" ");
			const layOut = () => layoutLines(itemsOf(paragraph.items), {
				width: given.length === 1 ? given[0].width : (line) => given.findLast(({ from }) => from <= line).width,
				format: paragraph.format,
				tabStops: paragraph.tabStops,
				defaultTabStop,
				markFont: paragraph.markFont,
				measurer
			});
			if (paragraph.items.some(({ type }) => type === "pageReference" || type === "pageCount")) return layOut();
			const byWidths = (_byParagraph$get = byParagraph.get(paragraph)) !== null && _byParagraph$get !== void 0 ? _byParagraph$get : /* @__PURE__ */ new Map();
			byParagraph.set(paragraph, byWidths);
			const lines = (_byWidths$get = byWidths.get(key)) !== null && _byWidths$get !== void 0 ? _byWidths$get : layOut();
			byWidths.set(key, lines);
			return lines;
		};
		const measureParagraph = (paragraph, width, before, after) => {
			var _format$spaceBefore, _before$format$spaceA, _format$spaceAfter;
			const { format } = paragraph;
			const lines = linesOf(paragraph, width);
			const contextual = (one, other) => one.format.contextualSpacing === true && (other === null || other === void 0 ? void 0 : other.type) === "paragraph" && other.style === one.style;
			const spaceBefore = (_format$spaceBefore = format.spaceBefore) !== null && _format$spaceBefore !== void 0 ? _format$spaceBefore : 0;
			const shareBefore = (before === null || before === void 0 ? void 0 : before.type) === "paragraph" && !before.sectionBreak && contextual(before, paragraph) && !addsParagraphSpacing ? Math.max(0, spaceBefore - ((_before$format$spaceA = before.format.spaceAfter) !== null && _before$format$spaceA !== void 0 ? _before$format$spaceA : 0)) : spaceBefore;
			return {
				lines,
				spaceBefore: contextual(paragraph, before) ? 0 : shareBefore,
				spaceAfter: contextual(paragraph, after) ? 0 : (_format$spaceAfter = format.spaceAfter) !== null && _format$spaceAfter !== void 0 ? _format$spaceAfter : 0,
				keepNext: format.keepNext === true,
				keepLines: format.keepLines === true,
				widowControl: format.widowControl !== false,
				pageBreakBefore: format.pageBreakBefore === true
			};
		};
		const linesHeight = (lines) => sum(lines.map(({ height }) => height));
		/** How narrow and how wide the paragraphs in a table cell can be */
		const contentWidths = (stack) => stack.filter((block) => block.type === "paragraph").reduce((widths, block) => {
			const { min, max } = measureContentWidths(itemsOf(block.items), {
				format: block.format,
				tabStops: block.tabStops,
				defaultTabStop,
				measurer
			});
			return {
				min: Math.max(widths.min, min),
				max: Math.max(widths.max, max)
			};
		}, {
			min: 0,
			max: 0
		});
		const fittedTables = /* @__PURE__ */ new Map();
		/**
		* A table as it is laid out in a width: with its columns sized to their text, or widened for words longer than its
		* cells give them, when Word sizes them so. It says why when Word's sizing of it isn't known
		*/
		const fitted = (table, width) => {
			var _fittedTables$get, _byWidth$get;
			if (!table.fit && !table.widen) return table;
			const byWidth = (_fittedTables$get = fittedTables.get(table)) !== null && _fittedTables$get !== void 0 ? _fittedTables$get : /* @__PURE__ */ new Map();
			fittedTables.set(table, byWidth);
			const sized = (_byWidth$get = byWidth.get(width)) !== null && _byWidth$get !== void 0 ? _byWidth$get : fitColumns(table, width, contentWidths);
			byWidth.set(width, sized);
			return sized;
		};
		/** A table sized to be laid out in a width, which stops the layout when Word's sizing of it isn't known */
		const sizedToPlace = (table, width) => {
			const sized = fitted(table, width);
			if (sized.unsupported) throw new Unsupported(sized.unsupported);
			return sized;
		};
		/** The heights of blocks stacked in a width, with the space before and after each */
		const stackParts = (stack, width) => stack.map((block, index) => {
			if (block.type === "table") return {
				height: sum(rowHeights(sizedToPlace(block, width))),
				before: 0,
				after: 0
			};
			const { lines, spaceBefore: before, spaceAfter: after } = measureParagraph(block, width, stack[index - 1], stack[index + 1]);
			return {
				height: linesHeight(lines),
				before,
				after
			};
		});
		/**
		* The height of blocks stacked in a width, such as those in a table cell or a header, with the space before the
		* first and after the last, unless it is left out
		*/
		const stackHeight = (stack, width, withOuterSpace = true) => heightOf(stackParts(stack, width), withOuterSpace);
		/** The height of stacked parts, with the space between them, and before the first and after the last unless left out */
		const heightOf = (parts, withOuterSpace) => {
			var _parts$0$before, _parts$, _parts$after, _parts;
			const outer = withOuterSpace ? ((_parts$0$before = (_parts$ = parts[0]) === null || _parts$ === void 0 ? void 0 : _parts$.before) !== null && _parts$0$before !== void 0 ? _parts$0$before : 0) + ((_parts$after = (_parts = parts[parts.length - 1]) === null || _parts === void 0 ? void 0 : _parts.after) !== null && _parts$after !== void 0 ? _parts$after : 0) : 0;
			return sum(parts.map(({ height, before }, index) => height + (index === 0 ? 0 : between(parts[index - 1].after, before)))) + outer;
		};
		const cellHeight = (cell) => cell.marginTop + stackHeight(cell.blocks, cell.width) + cell.marginBottom;
		/** The cells merged down several rows of a table: the row each starts in, its last row, and the height its text needs */
		const mergesOf = ({ rows }) => rows.flatMap(({ cells }, first) => cells.filter(({ verticalMerge }) => verticalMerge === "restart").map((cell) => {
			const span = rows.slice(first + 1).findIndex((row) => {
				var _row$cells$find;
				return ((_row$cells$find = row.cells.find((other) => other.column === cell.column)) === null || _row$cells$find === void 0 ? void 0 : _row$cells$find.verticalMerge) !== "continue";
			});
			return {
				first,
				last: span === -1 ? rows.length - 1 : first + span,
				height: cellHeight(cell)
			};
		}));
		/**
		* The height of each row of a table: its tallest cell, with the cell's margins, or the row's own height, and its
		* borders. Cells merged down several rows make the last of them taller when their text needs more room.
		*/
		const rowHeights = (table, merges = mergesOf(table)) => {
			const { rows } = table;
			const heights = rows.map(({ cells, height, borderTop, borderBottom }) => {
				const natural = Math.max(0, ...cells.filter(({ verticalMerge }) => verticalMerge === void 0).map(cellHeight));
				return (height === void 0 ? natural : height.rule === "exact" ? height.value : Math.max(height.value, natural)) + borderTop + borderBottom;
			});
			return merges.reduce((current, { first, last, height }) => {
				var _rows$last$height;
				const missing = height - sum(current.slice(first, last + 1));
				return missing > 0 && ((_rows$last$height = rows[last].height) === null || _rows$last$height === void 0 ? void 0 : _rows$last$height.rule) !== "exact" ? current.map((value, index) => index === last ? value + missing : value) : current;
			}, heights);
		};
		const markersOf = (block) => block.type === "paragraph" ? block.items.flatMap((item) => item.type === "marker" ? [item.name] : []) : block.rows.flatMap(({ cells }) => cells.flatMap((cell) => cell.blocks.flatMap(markersOf)));
		const bookmarks = /* @__PURE__ */ new Map();
		const markedOn = /* @__PURE__ */ new Map();
		const headerHeights = /* @__PURE__ */ new Map();
		let pageCount = 0;
		let pageNumber = 0;
		const firstPages = /* @__PURE__ */ new Map([[0, 1]]);
		const lastPages = /* @__PURE__ */ new Map();
		const sharingPages = /* @__PURE__ */ new Set();
		let top = 0;
		let pageBottom = 0;
		let bottom = 0;
		let position = 0;
		let column = 0;
		let columnTop = 0;
		let placedInColumn = false;
		let deepest = 0;
		let columnBroken = false;
		let balancing;
		let pageNotes = [];
		let noteArea = 0;
		let notesInColumns;
		let filledEnd = 0;
		const reserves = /* @__PURE__ */ new Map();
		let continued;
		let carried;
		let held = [];
		let spaceAfter = 0;
		let sectionSpaceAfter = 0;
		let sectionColumn = 0;
		/** Whether nothing of the section is placed yet, in the column it starts in or the first of a page */
		const atSectionStart = () => sectionSpaceAfter !== void 0 && (column === 0 || column === sectionColumn);
		/**
		* The space above a paragraph with this space before, below what is above it. At the start of a section, that is only
		* as much of it as is more than the space after the section's last paragraph. When that is the empty paragraph that
		* ends the section, its space after isn't on the page itself, in Word: 0 after the section's last line, 200 after the
		* empty paragraph and 0 before leave none (`word-rules2.docx` Q6b and Q7b, `word-contextual.docx` X1). When it is a
		* paragraph of text, its space after is still to come, and the larger of the two goes there, as between any two
		*/
		const spaceAboveOf = (spaceBefore) => atSectionStart() ? spaceAfter + between(sectionSpaceAfter, spaceBefore) - sectionSpaceAfter : between(spaceAfter, spaceBefore);
		/** Where the layout is at the start of a block, to lay out the blocks from it again */
		const snapshot = (index) => ({
			index,
			pageCount,
			pageNumber,
			top,
			pageBottom,
			position,
			column,
			columnTop,
			placedInColumn,
			deepest,
			columnBroken,
			pageNotes,
			noteArea,
			notesInColumns,
			filledEnd,
			continued,
			carried,
			held,
			spaceAfter,
			sectionSpaceAfter
		});
		let blockStart;
		let columnsStart;
		/** The bottom of the page's columns: the page's, or less when they are being balanced */
		const columnsBottom = () => (balancing === null || balancing === void 0 ? void 0 : balancing.page) === pageCount ? Math.min(pageBottom, columnTop + balancing.height) : pageBottom;
		/**
		* Goes back to where the layout was at the start of a block. The bookmarks placed since are kept, as laying the blocks
		* out again only moves them between the columns of the same page
		*/
		const restore = (state) => {
			({pageCount, pageNumber, top, pageBottom, position, column, columnTop, placedInColumn, deepest, columnBroken, pageNotes, noteArea, notesInColumns, filledEnd, continued, carried, held, spaceAfter, sectionSpaceAfter} = state);
			bottom = columnsBottom();
			noteArea = Math.max(noteArea, reserved());
		};
		/** Stops laying out columns being balanced where they are too short for what has to go at the top of one */
		const stopIfBalancing = () => {
			if ((balancing === null || balancing === void 0 ? void 0 : balancing.page) === pageCount) throw new Overflow();
		};
		/**
		* Stops at something on the page that Word might lay out differently, without its bookmarks, as Word might put some
		* of them on the next page
		*/
		const stopOnPage = (reason) => {
			for (const [name, page] of markedOn) if (page === pageCount) bookmarks.delete(name);
			throw new Unsupported(reason);
		};
		const section = () => sections[sectionIndex];
		/** The width of the text across the page, as its headers, footers and footnotes are, unless those are in columns */
		const textWidth = (current = section()) => current.pageWidth - current.marginLeft - current.marginRight - current.gutter;
		/**
		* The columns the page's footnotes are laid out in, when they are in columns: those of the section of its first
		* footnote, as Word lays them out, or of the section being laid out until it has one. Those of a page whose first
		* footnote is referred to from text across it are across it, whatever the columns of those after
		* (`word-footnotes-in-columns.docx` N8)
		*/
		const noteColumns = () => {
			const first = pageNotes.length > 0 || continued !== void 0 ? notesInColumns : sectionIndex;
			return first !== void 0 && sections[first].columns.length > 1 ? sections[first].columns : void 0;
		};
		/** The width the page's footnotes are laid out in */
		const noteWidth = () => {
			var _noteColumns$, _noteColumns;
			return (_noteColumns$ = (_noteColumns = noteColumns()) === null || _noteColumns === void 0 ? void 0 : _noteColumns[0]) !== null && _noteColumns$ !== void 0 ? _noteColumns$ : textWidth();
		};
		/** The room kept at the bottom of the page for its footnotes, when its columns were laid out again for them */
		const reserved = () => {
			var _reserves$get;
			return (_reserves$get = reserves.get(pageCount)) !== null && _reserves$get !== void 0 ? _reserves$get : 0;
		};
		/**
		* How far down the column being filled its lines go: to the footnotes at the bottom of the page, with more that take
		* this much more room (`more`), or the bottom of columns being balanced, which are above them
		*/
		const linesBottom = (more = 0) => Math.min(bottom, pageBottom - noteArea - more);
		/** How much higher the lines of the column being filled end for more footnotes that take this much more room */
		const noteCost = (more) => linesBottom() - linesBottom(more);
		const partHeight = (parts, isFirst) => {
			var _headerHeights$get, _bySection$get;
			const part = section().titlePage && isFirst ? parts.first : evenAndOddHeaders && pageNumber % 2 === 0 ? parts.even : parts.default;
			if (!part) return 0;
			if (part.some((block) => block.unsupported !== void 0)) throw new Unsupported(part.find((block) => block.unsupported !== void 0).unsupported);
			const bySection = (_headerHeights$get = headerHeights.get(part)) !== null && _headerHeights$get !== void 0 ? _headerHeights$get : /* @__PURE__ */ new Map();
			const height = (_bySection$get = bySection.get(sectionIndex)) !== null && _bySection$get !== void 0 ? _bySection$get : stackHeight(part, textWidth());
			headerHeights.set(part, bySection.set(sectionIndex, height));
			return height;
		};
		const startPage = (isFirstOfSection = false) => {
			if (balancing !== void 0 && pageCount >= balancing.page) throw new Overflow();
			checkReserve();
			const current = section();
			pageNumber = isFirstOfSection && current.firstNumber !== void 0 ? current.firstNumber : pageNumber + 1;
			const headerBottom = current.header + partHeight(current.headers, isFirstOfSection);
			const footerTop = current.footer + partHeight(current.footers, isFirstOfSection);
			pageCount++;
			top = current.marginTop < 0 ? -current.marginTop : Math.max(current.marginTop, headerBottom);
			pageBottom = current.pageHeight - (current.marginBottom < 0 ? -current.marginBottom : Math.max(current.marginBottom, footerTop));
			position = top;
			column = 0;
			columnTop = top;
			bottom = columnsBottom();
			placedInColumn = false;
			deepest = 0;
			columnBroken = false;
			columnsStart = blockStart;
			spaceAfter = 0;
			pageNotes = [];
			notesInColumns = void 0;
			filledEnd = 0;
			continued = carried;
			carried = void 0;
			noteArea = Math.max(areaOf([], void 0, continued), reserved());
			if (continued !== void 0 && current.columns.length > 1) throw new Unsupported("a footnote across pages in columns");
			if (continued !== void 0 && noteArea > bottom - top + TOLERANCE) {
				if (isFirstOfSection) throw new Unsupported("a footnote continued across a section break onto a page of its own");
				const { name, from } = continued;
				const to = fillNote(name, from, (point) => areaOf([], void 0, {
					name,
					from,
					to: point
				}) <= bottom - top + TOLERANCE);
				if (to.block === from.block && to.line === from.line) throw new Unsupported("a footnote line taller than a page");
				carried = {
					name,
					from: to
				};
				startPage();
			}
		};
		/** Moves to the top of the next column, or of the next page after the last column */
		const nextColumn = () => {
			if (column + 1 >= section().columns.length) {
				startPage();
				return;
			}
			deepest = Math.max(deepest, position + spaceAfter);
			filledEnd = Math.max(filledEnd, position);
			column++;
			position = columnTop;
			placedInColumn = false;
			spaceAfter = 0;
		};
		/** Whether a section starts on the page the section before it ends on: a continuous one, on pages of the same size */
		const continuesOnPage = (previous, current) => current.start === "continuous" && previous.pageWidth === current.pageWidth && previous.pageHeight === current.pageHeight;
		/**
		* Whether a section starts in the next column of the page the section before it ends on, as Word starts one that
		* starts in the next column when the section before has as many columns, on pages of the same size, and one is left
		* after the column it ends in (`word-rules2.docx` Q5a, `word-next-column.docx` N4 and N5). Otherwise it starts on a
		* new page: after 2 columns into 3, 3 into 2, 1 into 2, or the last column started (Q5b to Q5d, N3)
		*/
		const startsInNextColumn = (previous, current) => current.start === "nextColumn" && previous.pageWidth === current.pageWidth && previous.pageHeight === current.pageHeight && previous.columns.length === current.columns.length && column + 1 < current.columns.length;
		/** Whether the columns on the page start with a section that started in the next column */
		const startedInColumn = () => columnsStart.pageCount === pageCount && columnsStart.column > 0;
		/**
		* Ends the columns on the page before a continuous section break, as Word does. Unless a column break is in them, they
		* are balanced: what is in them, up to the section's next block (`end`), is laid out again in the shortest columns it
		* fits in, filled from the first, which halving the height tried finds. Nor are they when a section in them started
		* in the next column, which Word leaves as they are (`word-next-column.docx` N6). The next section starts below the
		* lowest of the columns and the space after the paragraph each ends with, and its space before is only as much as is
		* more than the space after the section's last paragraph: the empty one that ends it, when there is one, whose space
		* after is not below the columns itself (`word-rules2.docx` Q7b). Their footnotes stay at the bottom of the page, in
		* their columns, below what follows (`word-rules2.docx` Q6b, `word-footnotes-in-columns.docx` N6).
		*/
		const endColumns = (end) => {
			if (!columnBroken && !startedInColumn()) balanceColumns(end);
			position = Math.max(deepest, position + spaceAfter) - spaceAfter;
		};
		const balanceColumns = (end) => {
			const from = columnsStart;
			const page = pageCount;
			const balanced = endsAfterTable(end - 1) ? end - 1 : end;
			const layOut = (height) => {
				balancing = {
					page,
					height
				};
				restore(from);
				placeBlocks(from.index, balanced);
			};
			const fitsIn = (height) => {
				try {
					layOut(height);
					return true;
				} catch (error) {
					if (error instanceof Overflow) return false;
					throw error;
				}
			};
			let short = 0;
			let tall = pageBottom - columnTop;
			while (tall - short > TOLERANCE) {
				const middle = (short + tall) / 2;
				if (fitsIn(middle)) tall = middle;
				else short = middle;
			}
			layOut(tall);
			balancing = void 0;
			bottom = pageBottom;
			placeBlocks(balanced, end);
		};
		/**
		* Starts a section, from its first block (`firstBlock`): on a new page, or below what is on the page for a continuous
		* one, after the columns before it are ended
		*/
		const startSection = (index, firstBlock) => {
			var _end$format$spaceAfte, _current$firstNumber;
			const previous = section();
			const current = sections[index];
			lastPages.set(sectionIndex, pageCount);
			for (let skipped = sectionIndex + 1; skipped < index; skipped++) sharingPages.add(skipped);
			if (current.unsupported) throw new Unsupported(current.unsupported);
			const continuous = continuesOnPage(previous, current);
			if (continuous && previous.columns.length > 1 && (placedInColumn || column > 0)) {
				if (startedInColumn() && columnsStart.column < previous.columns.length - 1) throw new Unsupported("columns evened out after a section that starts in the next column");
				endColumns(firstBlock);
			}
			const inNextColumn = startsInNextColumn(previous, current);
			if (inNextColumn && previous.columns.some((width, at) => width !== current.columns[at])) throw new Unsupported("a section that starts in the next column of columns of other widths");
			filledEnd = inNextColumn ? Math.max(filledEnd, position) : 0;
			const end = blocks[firstBlock - 1].block;
			sectionSpaceAfter = end.type === "paragraph" && end.sectionBreak ? (_end$format$spaceAfte = end.format.spaceAfter) !== null && _end$format$spaceAfte !== void 0 ? _end$format$spaceAfte : 0 : spaceAfter;
			sectionColumn = 0;
			const before = sectionIndex;
			sectionIndex = index;
			if (continuous) {
				column = 0;
				columnTop = position;
				firstPages.set(index, pageCount);
				sharingPages.add(before).add(index);
				return;
			}
			if (inNextColumn) {
				deepest = Math.max(deepest, position);
				column++;
				sectionColumn = column;
				position = columnTop;
				placedInColumn = false;
				spaceAfter = 0;
				firstPages.set(index, pageCount);
				sharingPages.add(before).add(index);
				return;
			}
			const nextNumber = (_current$firstNumber = current.firstNumber) !== null && _current$firstNumber !== void 0 ? _current$firstNumber : pageNumber + 1;
			if (current.start === "evenPage" && nextNumber % 2 !== 0 || current.start === "oddPage" && nextNumber % 2 === 0) {
				pageCount++;
				pageNumber++;
				sharingPages.add(before).add(index);
			}
			startPage(true);
			firstPages.set(index, pageCount);
		};
		/**
		* The height of the tallest of the columns footnotes are laid out in when they fit in columns of a height, or
		* undefined when they don't: one paragraph after the other from the first column, breaking between lines as widow
		* control and keepLines let them, below the separator at the top of each (`separator`, with the space after it,
		* `separatorAfter`)
		*/
		const fillNoteColumns = (paragraphs, count, separator, separatorAfter, height) => {
			let noteColumn = 0;
			let used = separator;
			let above = separatorAfter;
			let tallest = separator;
			for (const paragraph of paragraphs) {
				let from = 0;
				while (from < paragraph.lines.length) {
					const space = above === void 0 ? 0 : between(above, from === 0 ? paragraph.spaceBefore : 0);
					const rest = paragraph.lines.slice(from);
					const placed = linesThatFit(rest, height - used - space, paragraph, from === 0).count;
					used += placed > 0 ? space + linesHeight(rest.slice(0, placed)) : 0;
					tallest = Math.max(tallest, used);
					from += placed;
					if (from < paragraph.lines.length) {
						noteColumn++;
						if (noteColumn >= count) return;
						used = separator;
						above = separatorAfter;
					}
				}
				above = paragraph.spaceAfter;
			}
			return tallest;
		};
		/** The blocks of a part of a footnote, each with the first of its lines or rows in the part, and the one after the last */
		const piecesOf = ({ name, from = {
			block: 0,
			line: 0
		}, to }) => footnotes.get(name).flatMap((block, index) => index < from.block || to !== void 0 && (index > to.block || index === to.block && to.line === 0) ? [] : [{
			block,
			start: index === from.block ? from.line : 0,
			end: to !== void 0 && index === to.block ? to.line : void 0
		}]);
		/**
		* The room footnotes take at the bottom of the page: the separator's line above them, the rest of a footnote
		* continued from the page before (`from`), their blocks, and the first part of one continued on the next page
		* (`split`), without the space before the first or after the last, as LibreOffice lays them out. In columns
		* (`columns`), Word lays them out in the columns, one after the other from the first, with the separator at the top of
		* each, and evens them out, as it evens out columns before a continuous section break: the room is the tallest, in the
		* shortest height they fit in (`word-footnotes-in-columns.docx` N2, N4 and N9)
		*/
		const areaOf = (notes, split, from, columns = noteColumns()) => {
			var _pieces$find, _columns$;
			if (notes.length === 0 && split === void 0 && from === void 0) return 0;
			const separator = from === void 0 ? footnoteSeparator : footnoteContinuationSeparator;
			const pieces = [
				...separator.map((block) => ({
					block,
					start: 0,
					end: void 0
				})),
				...from === void 0 ? [] : piecesOf(from),
				...notes.flatMap((name) => piecesOf({ name })),
				...split === void 0 ? [] : piecesOf(split)
			];
			const unsupported = (_pieces$find = pieces.find(({ block }) => block.unsupported !== void 0)) === null || _pieces$find === void 0 ? void 0 : _pieces$find.block.unsupported;
			if (unsupported) throw new Unsupported(unsupported);
			if (columns === null || columns === void 0 ? void 0 : columns.some((columnWidth) => columnWidth !== columns[0])) stopOnPage("footnotes in columns of different widths");
			const width = (_columns$ = columns === null || columns === void 0 ? void 0 : columns[0]) !== null && _columns$ !== void 0 ? _columns$ : textWidth();
			/** A piece's paragraph, with only its lines in the piece, or its table's rows as a line that doesn't break */
			const measured = ({ block, start, end }, index) => {
				var _pieces, _pieces2;
				if (block.type === "table") return _objectSpread2(_objectSpread2({}, UNBROKEN), {}, { lines: [{
					height: sum(rowHeights(sizedToPlace(block, width)).slice(start, end)),
					markers: []
				}] });
				const paragraph = measureParagraph(block, width, (_pieces = pieces[index - 1]) === null || _pieces === void 0 ? void 0 : _pieces.block, (_pieces2 = pieces[index + 1]) === null || _pieces2 === void 0 ? void 0 : _pieces2.block);
				return _objectSpread2(_objectSpread2({}, paragraph), {}, { lines: paragraph.lines.slice(start, end) });
			};
			const parts = pieces.map((piece, index) => {
				const { lines, spaceBefore, spaceAfter: after } = measured(piece, index);
				return {
					height: linesHeight(lines),
					before: from !== void 0 && index === separator.length ? 0 : spaceBefore,
					after
				};
			});
			if (columns !== void 0) {
				var _separatorParts;
				const separatorParts = parts.slice(0, separator.length);
				const paragraphs = pieces.slice(separator.length).map((piece, index) => measured(piece, separator.length + index));
				const separatorHeight = heightOf(separatorParts, false);
				const separatorAfter = (_separatorParts = separatorParts[separatorParts.length - 1]) === null || _separatorParts === void 0 ? void 0 : _separatorParts.after;
				const fill = (height) => fillNoteColumns(paragraphs, columns.length, separatorHeight, separatorAfter, height);
				let short = separatorHeight;
				let tall = fill(Infinity);
				while (tall - short > TOLERANCE) {
					const middle = (short + tall) / 2;
					if (fill(middle) === void 0) short = middle;
					else tall = middle;
				}
				return fill(tall);
			}
			return heightOf(parts, false);
		};
		const notesIn = (markers) => markers.filter((name) => footnotes.has(name));
		/** The room footnotes take at the bottom of the page, or the room kept for them there, when that is more */
		const pageArea = (notes, split) => Math.max(reserved(), areaOf(notes, split, continued));
		/**
		* The room footnotes take below those on the page already. It stops at one referred to from another section than
		* the page's first, when that is in columns, which Word hasn't been seen to lay out
		*/
		const moreNoteRoom = (notes) => {
			if (notes.length === 0) return 0;
			if (notesInColumns !== void 0 && notesInColumns !== sectionIndex) stopOnPage("a footnote on a page whose footnotes are in another section's columns");
			return pageArea([...pageNotes, ...notes]) - noteArea;
		};
		/**
		* Puts footnotes at the bottom of the page. Every column of the page ends above them, whichever it is they are
		* referred to from, as in Word (`word-footnotes-in-columns.docx` N1 and N3), so the columns before the one being
		* filled are laid out again when they go down further than these leave room for
		*/
		const addNotes = (notes) => {
			if (notes.length > 0) {
				if (pageNotes.length === 0 && continued === void 0 && section().columns.length > 1) notesInColumns = sectionIndex;
				pageNotes = [...pageNotes, ...notes];
				noteArea = pageArea(pageNotes);
				if (noteArea > reserved() + TOLERANCE && filledEnd > pageBottom - noteArea + TOLERANCE) {
					if (startedInColumn()) stopOnPage("a footnote in a section that starts in the next column, below a longer column");
					throw new NotesGrew(noteArea);
				}
			}
		};
		/**
		* Stops at a page whose columns were laid out again to leave room for footnotes that moved a reference to one of
		* them on to the next page, so the room left is more than the footnotes on the page take: what Word does then isn't
		* known
		*/
		const checkReserve = () => {
			if (reserved() > areaOf(pageNotes, void 0, continued) + TOLERANCE) stopOnPage("a footnote in columns that moves its reference to the next page");
		};
		/**
		* Whether a table row could break across pages between the lines of its cells: one not kept whole, with more than a
		* line in a cell
		*/
		const canSplit = (row) => {
			var _row$height;
			return !row.cantSplit && ((_row$height = row.height) === null || _row$height === void 0 ? void 0 : _row$height.rule) !== "exact" && row.cells.some(({ blocks: stack, width }) => stack.length > 1 || stack.some((block) => block.type === "table" || linesOf(block, width).length > 1));
		};
		/**
		* Where the least of a footnote that goes on a page with its reference ends, when the rest of it can continue on the
		* next page, as Word continues it: the first lines of its first paragraph that can't be left alone at the bottom of a
		* page, 2 with widow control, or all of a paragraph of 3 lines or fewer, or 1 without it, or the first row of a table
		* (`word-probes.docx` U2a to U2h). Undefined when that is all of it. In columns, where how Word continues a footnote
		* hasn't been seen, a line that fits with it stops when its footnote is placed
		*/
		const leastPart = (name) => {
			const note = footnotes.get(name);
			const [first] = note;
			if (first === void 0) return;
			if (first.type === "table") {
				const { rows } = fitted(first, noteWidth());
				const firstRows = rows.slice(0, 1).some(canSplit) ? 0 : 1;
				return note.length === 1 && firstRows >= rows.length ? void 0 : {
					block: 0,
					line: firstRows
				};
			}
			const { lines, widowControl } = measureParagraph(first, noteWidth());
			const count = !widowControl ? 1 : lines.length <= 3 ? lines.length : 2;
			return note.length === 1 && count === lines.length ? void 0 : {
				block: 0,
				line: count
			};
		};
		/**
		* The room footnotes take at the bottom of a page, below the rest of one continued from the page before (`from`),
		* with the last continued on the next page after the least of it that can go on this one, when it can be
		*/
		const leastAreaOf = (notes, from, columns = noteColumns()) => {
			const name = notes[notes.length - 1];
			const to = name === void 0 ? void 0 : leastPart(name);
			return to === void 0 ? areaOf(notes, void 0, from, columns) : areaOf(notes.slice(0, -1), {
				name,
				to
			}, from, columns);
		};
		/**
		* The least room footnotes take below those on the page: all of them, but the last only as far as it has to go on the
		* page, when it can continue on the next
		*/
		const leastNoteRoom = (notes) => {
			const room = moreNoteRoom(notes);
			return notes.length === 0 ? room : Math.max(reserved(), leastAreaOf([...pageNotes, ...notes], continued)) - noteArea;
		};
		/**
		* Where the part of a footnote on a page ends, from where it starts (`from`), when not all of it fits (`fits`, up to
		* a point): after as many of its lines and table rows as fit, less those its paragraphs' widow and orphan control
		* hold back, as the body's are, so it breaks between its paragraphs and rows, or in a paragraph with 2 lines or more
		* on each page (`word-probes.docx` U2a to U2h). Whether Word keeps a footnote's paragraph together or with the next
		* across pages, or breaks a row of more than a line or repeats header rows in one, isn't known, so it stops there.
		*/
		const fillNote = (name, from, fits) => {
			const note = footnotes.get(name);
			const width = noteWidth();
			const { block: index, line } = note.flatMap((part, at) => Array.from({ length: part.type === "table" ? part.rows.length : linesOf(part, width).length }, (_, unit) => ({
				block: at,
				line: unit
			}))).filter((point) => point.block > from.block || point.block === from.block && point.line >= from.line).find((point) => !fits({
				block: point.block,
				line: point.line + 1
			}));
			const block = note[index];
			const previous = note[index - 1];
			/** The point the part ends at, before a line or row of the block */
			const breakBefore = (at) => {
				if (at === 0 && index > from.block && previous.type === "paragraph" && previous.format.keepNext === true) throw new Unsupported("a paragraph kept together or with the next in a footnote across pages");
				return {
					block: index,
					line: at
				};
			};
			if (block.type === "table") {
				if (canSplit(fitted(block, width).rows[line])) throw new Unsupported("a table row of more than one line in a footnote across pages");
				if (line > 0 && block.rows[0].header) throw new Unsupported("a table's header rows in a footnote across pages");
				return breakBefore(line);
			}
			const begin = index === from.block ? from.line : 0;
			const { lines, widowControl, keepLines } = measureParagraph(block, width);
			const count = linesKept(lines.length - begin, line - begin, {
				keepLines: false,
				widowControl
			}, begin === 0);
			if (keepLines && count > 0) throw new Unsupported("a paragraph kept together or with the next in a footnote across pages");
			return breakBefore(begin + count);
		};
		/**
		* Puts the footnotes of the lines placed at the bottom of the page: all of them, or where they don't fit, the last as
		* far as it fits below the others, as the body's blocks fill a page, with the rest of it continued at the bottom of the
		* next page, as Word continues it. The footnote takes the rest of the page then, so what follows goes on the next. How
		* Word continues one in columns hasn't been seen.
		*/
		const placeNotes = (notes) => {
			if (notes.length === 0 || position <= linesBottom(moreNoteRoom(notes)) + TOLERANCE) {
				addNotes(notes);
				return;
			}
			if (section().columns.length > 1) stopOnPage("a footnote across pages in columns");
			const whole = [...pageNotes, ...notes.slice(0, -1)];
			const name = notes[notes.length - 1];
			const to = fillNote(name, {
				block: 0,
				line: 0
			}, (point) => areaOf(whole, {
				name,
				to: point
			}, continued) <= bottom - position + TOLERANCE);
			pageNotes = [...whole, name];
			noteArea = bottom - position;
			carried = {
				name,
				from: to
			};
		};
		/**
		* Stops where a line in columns fits without its footnotes (`notes`), which don't fit below it (`below`, less those of
		* the lines before, `before`), and part of one would: how Word continues a footnote in columns hasn't been seen. When
		* none of it would, the line goes on in the next column or on the next page with it
		*/
		const stopAtPartOfFootnote = (before, notes, below) => {
			const index = notes.findIndex((_, note) => noteCost(moreNoteRoom([...before, ...notes.slice(0, note + 1)])) > below + TOLERANCE);
			const name = notes[index];
			if (name === void 0 || footnotes.get(name).length === 0) return;
			const firstLine = {
				name,
				to: {
					block: 0,
					line: 1
				}
			};
			if (noteCost(pageArea([
				...pageNotes,
				...before,
				...notes.slice(0, index)
			], firstLine) - noteArea) <= below + TOLERANCE) stopOnPage("a footnote across pages in columns");
		};
		/** Whether a footnote could continue on the next page: one of more than a line */
		const canBreak = (name) => {
			const [first, ...rest] = footnotes.get(name);
			return rest.length > 0 || (first === null || first === void 0 ? void 0 : first.type) === "table" || first !== void 0 && measureParagraph(first, noteWidth()).lines.length > 1;
		};
		const mark = (names) => {
			const text = formatNumber(pageNumber, section().numberFormat);
			for (const name of names) if (!bookmarks.has(name) && !footnotes.has(name)) {
				bookmarks.set(name, text);
				markedOn.set(name, pageCount);
			}
		};
		/** The lines from one (`from`) up to the next that ends with a page or column break, or to the paragraph's end */
		const linesToBreak = (lines, from) => {
			const end = lines.findIndex((line, index) => index >= from && line.breakAfter !== void 0);
			return lines.slice(from, end === -1 ? lines.length : end + 1);
		};
		/**
		* Places a paragraph's lines, breaking pages and columns between them where they don't fit, and at its page and
		* column breaks. Its lines are broken at the width of the column each goes in, so the part of it that goes on into a
		* column of another width is broken again there, as Word breaks it (`word-rules2.docx` Q7). A paragraph's first or
		* last line isn't left alone on a page with widow control, and its lines stay together with keepLines. Widow control
		* counts the lines left for the next column as they are broken in this one, as Word counts them, so the rest can still
		* go on one line of a wider column, where LibreOffice moves more lines on (`word-column-widths.docx` R1 to R4). The
		* space before a paragraph at the top of a page is left out, unless it is the first of the document or of its
		* section. Its footnotes go at the bottom of the page below its lines, unless they are held back to go below the
		* lines of the next paragraph (`holdNotes`).
		*/
		const placeParagraph = (block, paragraph, keptWithPrevious, holdNotes) => {
			if (paragraph.pageBreakBefore && (placedInColumn || column > 0)) startPage();
			const { columns } = section();
			/** Whether its lines up to its first break are taller than a column, at a column's width */
			const tallerThanColumn = (width) => linesHeight(linesToBreak(linesOf(block, width), 0)) > pageBottom - top + TOLERANCE;
			const keptTall = paragraph.keepLines && columns.length > 1 && columns.some(tallerThanColumn);
			if (keptTall && columns.some((width) => width !== columns[0])) throw new Unsupported("a paragraph kept together taller than a column, in columns of different widths");
			if (keptTall && (column > 0 || position > top + TOLERANCE)) {
				if (keptWithPrevious) throw new Unsupported("a paragraph kept with the next before a paragraph kept together taller than a column");
				startPage();
			}
			const firstColumnsOnly = keptTall ? linesToBreak(linesOf(block, columns[0]), 0).length : 0;
			/**
			* The space above the paragraph's first line: at the top of a page, or of the column its section starts in, only
			* the first of a section has any
			*/
			const spaceAbove = () => placedInColumn || atSectionStart() ? spaceAboveOf(paragraph.spaceBefore) : 0;
			let widths = [];
			/** The widths with the lines from one (`from`) on at the width of a column, broken again there when it is another */
			const widthsFrom = (from, width) => {
				var _widths$findLast;
				return ((_widths$findLast = widths.findLast((given) => given.from <= from)) === null || _widths$findLast === void 0 ? void 0 : _widths$findLast.width) === width ? widths : [...widths.filter((given) => given.from < from), {
					from,
					width
				}];
			};
			let index = 0;
			for (;;) {
				widths = widthsFrom(index, section().columns[column]);
				const lines = linesOf(block, widths);
				const remaining = linesToBreak(lines, index);
				const isFirstLine = index === 0;
				const space = isFirstLine ? spaceAbove() : 0;
				const heldNotes = held;
				const notesOf = (upTo) => [...heldNotes, ...notesIn(remaining.slice(0, upTo).flatMap(({ markers }) => markers))];
				const room = linesBottom() - position - space;
				const { fits, count: kept } = linesThatFit(remaining, room, paragraph, isFirstLine, (upTo) => noteCost(leastNoteRoom(notesOf(upTo))));
				if (section().columns.length > 1 && linesThatFit(remaining, room, paragraph, isFirstLine).fits > fits) {
					const above = room - linesHeight(remaining.slice(0, fits));
					stopAtPartOfFootnote(notesOf(fits), notesIn(remaining[fits].markers), above - remaining[fits].height);
				}
				let count = kept;
				if (count === 0 && !placedInColumn && continued === void 0) {
					if (fits === 0 && notesOf(1).length > 0) {
						stopIfBalancing();
						throw new Unsupported("a line and its footnote taller than a page");
					}
					if (linesThatFit(remaining, pageBottom - noteArea - position - space, paragraph, isFirstLine).count > 0) stopIfBalancing();
					count = Math.max(1, fits);
				}
				if (count > 0) {
					position += space;
					for (const line of remaining.slice(0, count)) {
						mark(line.markers);
						position += line.height;
					}
					spaceAfter = 0;
					const notes = notesOf(count);
					if (holdNotes && index + count === lines.length) held = notes;
					else {
						held = [];
						placeNotes(notes);
					}
					placedInColumn = true;
					index += count;
				}
				const breakAfter = count === remaining.length ? remaining[count - 1].breakAfter : void 0;
				if (breakAfter === "column") {
					columnBroken = true;
					nextColumn();
				} else if (breakAfter === "page" || index < firstColumnsOnly) startPage();
				else if (index < lines.length) nextColumn();
				if (index === lines.length) break;
			}
			({spaceAfter} = paragraph);
		};
		/**
		* Fills a cell's part of a row that breaks across pages: as many of the lines left of its paragraphs as fit in the
		* room. The space before a paragraph at the top of the part on the next page is left out, as it is at the top of a
		* page.
		*/
		const fillCell = (paragraphs, room, isFirstPart) => {
			var _previousAfter;
			let used = 0;
			let previousAfter;
			let placed = [];
			for (const [index, { paragraph, from }] of paragraphs.entries()) {
				const space = from > 0 ? 0 : previousAfter === void 0 ? isFirstPart ? paragraph.spaceBefore : 0 : between(previousAfter, paragraph.spaceBefore);
				const remaining = paragraph.lines.slice(from);
				const { count } = linesThatFit(remaining, room - used - space, paragraph, from === 0, (upTo) => upTo === remaining.length ? paragraph.spaceAfter : 0);
				if (count > 0) {
					used += space + linesHeight(remaining.slice(0, count));
					placed = [...placed, ...remaining.slice(0, count)];
				}
				if (count < remaining.length) return {
					height: used,
					lines: placed,
					rest: [{
						paragraph,
						from: from + count
					}, ...paragraphs.slice(index + 1)]
				};
				previousAfter = paragraph.spaceAfter;
			}
			return {
				height: used + ((_previousAfter = previousAfter) !== null && _previousAfter !== void 0 ? _previousAfter : 0),
				lines: placed,
				rest: []
			};
		};
		/**
		* Places a row that doesn't fit on the page by breaking it across pages between the lines of its cells, as Word
		* breaks a row unless it is kept whole. A row none of whose lines fit moves to the next page. The table's header rows
		* are repeated above the rest of it on each page and in each column.
		*
		* @param breakBorder - The border below the row on a page where the table breaks: the table's bottom border, which the
		* last row has counted already
		*/
		const splitRow = (row, height, breakBorder, startTablePage) => {
			let parts = row.cells.map((cell) => cell.blocks.map((block, index) => ({
				paragraph: block.type === "paragraph" ? measureParagraph(block, cell.width, cell.blocks[index - 1], cell.blocks[index + 1]) : _objectSpread2(_objectSpread2({}, UNBROKEN), {}, { lines: [{
					height: sum(rowHeights(sizedToPlace(block, cell.width))),
					markers: markersOf(block)
				}] }),
				from: 0
			})));
			let isFirstPart = true;
			for (;;) {
				const borders = row.borderTop + row.borderBottom;
				const room = linesBottom() - position - borders - breakBorder;
				const first = isFirstPart;
				const filled = parts.map((paragraphs, cell) => fillCell(paragraphs, room - row.cells[cell].marginTop - row.cells[cell].marginBottom, first));
				const placesLines = (!isFirstPart || row.height === void 0 || row.height.value <= room + TOLERANCE) && filled.some(({ lines }) => lines.length > 0) && parts.every((paragraphs, cell) => paragraphs.length === 0 || filled[cell].lines.length > 0);
				const isLastPart = filled.every(({ rest }) => rest.length === 0);
				if (placesLines && !isLastPart) {
					if (row.cells.some(({ verticalMerge }) => verticalMerge !== void 0)) throw new Unsupported("a table row with merged cells across pages");
					if (row.cells.some((cell) => cell.blocks.some(({ type }) => type === "table"))) throw new Unsupported("a table in a table row across pages");
				}
				const fitsWhole = !isFirstPart || position + height + breakBorder <= linesBottom() + TOLERANCE;
				if ((!placesLines || !fitsWhole) && !placedInColumn && continued === void 0) {
					stopIfBalancing();
					throw new Unsupported("a table row taller than a page");
				}
				if (placesLines && (fitsWhole || !isLastPart)) mark(filled.flatMap(({ lines }) => lines.flatMap(({ markers }) => markers)));
				const tallest = Math.max(...filled.map((part, cell) => row.cells[cell].marginTop + part.height + row.cells[cell].marginBottom));
				if (placesLines && isLastPart && fitsWhole) {
					position += (isFirstPart ? height - borders : tallest) + borders;
					placedInColumn = true;
					return;
				}
				if (placesLines && !isLastPart) {
					position += tallest + borders + breakBorder;
					parts = filled.map(({ rest }) => rest);
					isFirstPart = false;
				}
				startTablePage();
			}
		};
		/** Whether the cells of a table are as wide as those of the same table laid out in another width */
		const sameWidths = (table, other) => table.rows.every(({ cells }, row) => cells.every(({ width }, cell) => other.rows[row].cells[cell].width === width));
		const placeTable = (block) => {
			var _table$rows$borderBot, _table$rows;
			const width = section().columns[column];
			const table = sizedToPlace(block, width);
			const merges = mergesOf(table);
			const heights = rowHeights(table, merges);
			const headerRows = table.rows.findIndex(({ header }) => !header);
			const repeated = headerRows > 0 ? sum(heights.slice(0, headerRows)) : 0;
			position += spaceAfter;
			spaceAfter = 0;
			const startTablePage = (index) => {
				nextColumn();
				const next = section().columns[column];
				if (next < width && !sameWidths(table, fitted(block, next))) throw new Unsupported("a table sized to its text that goes on into a narrower column");
				if (index >= headerRows) position += repeated;
			};
			/** Whether a row fits on the page, with its footnotes */
			const rowFits = (height, notes) => position + height <= linesBottom(moreNoteRoom(notes)) + TOLERANCE;
			const markersIn = (row) => row.cells.flatMap((cell) => cell.blocks.flatMap(markersOf));
			const bottomBorder = (_table$rows$borderBot = (_table$rows = table.rows[table.rows.length - 1]) === null || _table$rows === void 0 ? void 0 : _table$rows.borderBottom) !== null && _table$rows$borderBot !== void 0 ? _table$rows$borderBot : 0;
			for (const [index, row] of table.rows.entries()) {
				var _row$height2;
				const breakBorder = index < table.rows.length - 1 ? bottomBorder : 0;
				const height = heights[index];
				const roomNeeded = height + breakBorder;
				const markers = markersIn(row);
				const notes = notesIn(markers);
				if (!rowFits(roomNeeded, notes) && position + roomNeeded <= linesBottom() + TOLERANCE && notes.some(canBreak)) throw new Unsupported("a footnote in a table row across pages");
				const keptWhole = row.cantSplit || ((_row$height2 = row.height) === null || _row$height2 === void 0 ? void 0 : _row$height2.rule) === "exact";
				while (!rowFits(roomNeeded, notes) && keptWhole && (placedInColumn || continued !== void 0)) startTablePage(index);
				for (const { last, height: needed } of merges.filter(({ first }) => first === index)) {
					const reached = heights.slice(index, last + 1).findIndex((_, offset) => sum(heights.slice(index, index + offset + 1)) >= needed - TOLERANCE);
					const rows = table.rows.slice(index, reached === -1 ? last + 1 : index + reached + 1);
					if (rows.length > 1 && !rowFits(sum(heights.slice(index, index + rows.length)), notesIn(rows.flatMap(markersIn)))) throw new Unsupported("a table row with merged cells across pages");
				}
				if (!rowFits(roomNeeded, notes) && !keptWhole) {
					if (notes.length > 0) throw new Unsupported("a footnote in a table row across pages");
					splitRow(row, height, breakBorder, () => startTablePage(index));
					continue;
				}
				if (!rowFits(roomNeeded, notes)) {
					stopIfBalancing();
					throw new Unsupported(notes.length > 0 ? "a footnote across pages" : "a table row taller than a page");
				}
				mark(markers);
				addNotes(notes);
				position += height;
				placedInColumn = true;
			}
		};
		/**
		* The room the paragraphs kept with the next one, from this one, need on the page: all of them, and the start of
		* the block they are kept with, from where the next line would go. With the footnotes of all their lines (`notes`)
		* and of the paragraphs kept with the next alone (`kept`), and what they are kept with: nothing in their section, all
		* of a paragraph's lines, or the first lines of a longer one, or a table's first row.
		*/
		const keptHeight = (index, width) => {
			var _kept$spaceAfter, _kept;
			const chain = blocks.slice(index).findIndex(({ block, section: blockSection }, offset) => {
				const following = blocks[index + offset + 1];
				return !(block.type === "paragraph" && block.format.keepNext === true && following && following.section === blockSection);
			});
			const measured = (offset) => {
				var _blocks, _blocks2;
				return measureParagraph(blocks[offset].block, width, (_blocks = blocks[offset - 1]) === null || _blocks === void 0 ? void 0 : _blocks.block, (_blocks2 = blocks[offset + 1]) === null || _blocks2 === void 0 ? void 0 : _blocks2.block);
			};
			const kept = Array.from({ length: chain }, (_, offset) => measured(index + offset));
			const keptLines = sum(kept.map(({ lines, spaceBefore }, offset) => linesHeight(lines) + (offset === 0 ? spaceAboveOf(spaceBefore) : between(kept[offset - 1].spaceAfter, spaceBefore))));
			const lastAfter = (_kept$spaceAfter = (_kept = kept[kept.length - 1]) === null || _kept === void 0 ? void 0 : _kept.spaceAfter) !== null && _kept$spaceAfter !== void 0 ? _kept$spaceAfter : spaceAfter;
			const keptNotes = notesIn(kept.flatMap(({ lines }) => lines.flatMap(({ markers }) => markers)));
			const anchor = blocks[index + chain].block;
			if (anchor.type === "paragraph" && anchor.sectionBreak) return {
				height: keptLines,
				notes: keptNotes,
				kept: keptNotes,
				keptWith: "nothing"
			};
			if (anchor.type === "table") {
				var _rowHeights$;
				const [firstRow] = anchor.rows;
				const sized = anchor.unsupported ? anchor : fitted(anchor, width);
				return {
					height: keptLines + lastAfter + (sized.unsupported ? 0 : (_rowHeights$ = rowHeights(sized)[0]) !== null && _rowHeights$ !== void 0 ? _rowHeights$ : 0),
					notes: [...keptNotes, ...notesIn(firstRow ? firstRow.cells.flatMap((cell) => cell.blocks.flatMap(markersOf)) : [])],
					kept: keptNotes,
					keptWith: "part"
				};
			}
			const next = measured(index + chain);
			const firstLines = next.keepLines || next.widowControl && next.lines.length <= 3 ? next.lines.length : next.widowControl ? 2 : 1;
			const nextLines = next.lines.slice(0, firstLines);
			return {
				height: keptLines + between(lastAfter, next.spaceBefore) + linesHeight(nextLines),
				notes: [...keptNotes, ...notesIn(nextLines.flatMap(({ markers }) => markers))],
				kept: keptNotes,
				keptWith: chain === 0 ? "nothing" : firstLines === next.lines.length && !next.pageBreakBefore ? "whole" : "part"
			};
		};
		/**
		* Whether a block is the empty paragraph that ends a section right after a table. Word gives it a line of its own, as
		* there is no line of a paragraph before it for its mark to go on (`word-header-columns.docx` H1 to H4, H7 and H8),
		* where LibreOffice gives it no room
		*/
		const endsAfterTable = (index) => {
			var _blocks$index, _blocks3;
			const block = (_blocks$index = blocks[index]) === null || _blocks$index === void 0 ? void 0 : _blocks$index.block;
			return (block === null || block === void 0 ? void 0 : block.type) === "paragraph" && block.sectionBreak === true && ((_blocks3 = blocks[index - 1]) === null || _blocks3 === void 0 ? void 0 : _blocks3.block.type) === "table";
		};
		const placeBlock = (block, index) => {
			var _blocks5, _blocks6;
			if (block.unsupported) throw new Unsupported(block.unsupported);
			const width = section().columns[column];
			if (block.type === "paragraph" && block.sectionBreak && !endsAfterTable(index)) {
				var _blocks4;
				const { spaceBefore } = measureParagraph(block, width, (_blocks4 = blocks[index - 1]) === null || _blocks4 === void 0 ? void 0 : _blocks4.block);
				if (placedInColumn) position += between(spaceAfter, spaceBefore);
				spaceAfter = 0;
				return;
			}
			if (block.type === "table") {
				placeTable(block);
				sectionSpaceAfter = void 0;
				return;
			}
			const paragraph = measureParagraph(block, width, (_blocks5 = blocks[index - 1]) === null || _blocks5 === void 0 ? void 0 : _blocks5.block, (_blocks6 = blocks[index + 1]) === null || _blocks6 === void 0 ? void 0 : _blocks6.block);
			let holdNotes = false;
			if (paragraph.keepNext) {
				/**
				* What is kept together, from where the next line goes, broken into lines at the width of the column it goes in,
				* with the footnotes held back from a paragraph kept with this one, which go below these lines too (`all`), and
				* whether it fits with its footnotes taking some room
				*/
				const keptHere = () => {
					const measured = keptHeight(index, section().columns[column]);
					return _objectSpread2(_objectSpread2({}, measured), {}, {
						all: [...held, ...measured.notes],
						fitsWith: (noteRoom) => position + measured.height <= linesBottom(noteRoom) + TOLERANCE
					});
				};
				if (placedInColumn) {
					const here = keptHere();
					const fitsHere = here.fitsWith(leastNoteRoom(here.all));
					const { columns } = section();
					const fitsBelow = (from, area, below) => from + keptHeight(index, below).height <= Math.min(bottom, pageBottom - area) + TOLERANCE;
					if (!fitsHere && column + 1 < columns.length && fitsBelow(columnTop, noteArea + moreNoteRoom(here.notes), columns[column + 1])) nextColumn();
					else if (!fitsHere && fitsBelow(top, leastAreaOf(here.notes, carried, columns.length > 1 ? columns : void 0), columns[0])) startPage();
				}
				const { notes, kept, keptWith, all, fitsWith } = keptHere();
				holdNotes = keptWith !== "nothing" && [...held, ...kept].length > 0 && notes.length === kept.length && fitsWith(leastNoteRoom(all)) && !fitsWith(moreNoteRoom(all));
				if (holdNotes && keptWith === "part") throw new Unsupported("a footnote continued below a paragraph kept with the next");
			}
			const previous = blocks[index - 1];
			const keptWithPrevious = (previous === null || previous === void 0 ? void 0 : previous.section) === blocks[index].section && previous.block.type === "paragraph" && previous.block.format.keepNext === true;
			placeParagraph(block, paragraph, keptWithPrevious, holdNotes);
			sectionSpaceAfter = void 0;
		};
		/** Lays out the blocks from one (`from`) to the one before another (`to`), starting their sections */
		const placeBlocks = (from, to) => {
			for (let index = from; index < to; index++) {
				const { block, section: blockSection } = blocks[index];
				const startsSection = blockSection !== sectionIndex;
				if (startsSection) startSection(blockSection, index);
				blockStart = snapshot(index);
				if (startsSection || columnsStart === void 0) columnsStart = blockStart;
				try {
					placeBlock(block, index);
				} catch (error) {
					if (!(error instanceof NotesGrew)) throw error;
					reserves.set(pageCount, error.area);
					restore(columnsStart);
					index = columnsStart.index - 1;
				}
			}
		};
		/** The number of pages of each section whose pages are its alone, and that was laid out to its end */
		const countsOf = () => sections.map((_, index) => {
			const first = firstPages.get(index);
			const last = lastPages.get(index);
			return first === void 0 || last === void 0 || sharingPages.has(index) ? void 0 : last - first + 1;
		});
		try {
			if (content.unsupported) throw new Unsupported(content.unsupported);
			if (section().unsupported) throw new Unsupported(section().unsupported);
			startPage(true);
			placeBlocks(0, blocks.length);
			checkReserve();
			if (carried !== void 0) startPage();
		} catch (error) {
			if (!(error instanceof Unsupported)) throw error;
			return {
				bookmarks,
				pageCount,
				sectionPageCounts: countsOf(),
				stoppedAt: error.message
			};
		}
		lastPages.set(sectionIndex, pageCount);
		return {
			bookmarks,
			pageCount,
			sectionPageCounts: countsOf()
		};
	};
	//#endregion
	//#region \0@oxc-project+runtime@0.150.0/helpers/esm/objectWithoutPropertiesLoose.js
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
	//#region \0@oxc-project+runtime@0.150.0/helpers/esm/objectWithoutProperties.js
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
	//#region src/layout/read-document.ts
	var _excluded = ["text"];
	var DEFAULT_SECTION = {
		pageWidth: 612,
		pageHeight: 792,
		marginTop: 72,
		marginBottom: 72,
		marginLeft: 72,
		marginRight: 72,
		header: 36,
		footer: 36,
		gutter: 0,
		start: "nextPage",
		titlePage: false,
		numberFormat: "decimal"
	};
	var EMUS_PER_POINT = 12700;
	/** How far apart, in points, the widths two rows give a column can be before they differ: rounding, not a choice */
	var WIDTH_TOLERANCE = 1;
	var EIGHTHS_PER_POINT = 8;
	var FIFTIETHS_OF_A_PERCENT = 5e3;
	var PLAIN_FORMATS = /* @__PURE__ */ new Set([
		"mergeformat",
		"charformat",
		"mergeformatinet"
	]);
	var nameOf = (element) => Object.keys(element)[0];
	/** The content of an element, including its text. An element without content has its attributes, or nothing */
	var contentOf = (element) => {
		const content = element[nameOf(element)];
		return Array.isArray(content) ? content : [content];
	};
	var SUPERSCRIPT_WIDTH = .65;
	/**
	* The number of a footnote or endnote, at its reference or at the start of the note: as narrow as superscript, and as tall
	* as its font, as LibreOffice lays it out.
	*/
	var noteNumber = (text, font) => {
		var _font$scale;
		return {
			type: "text",
			text,
			font: _objectSpread2(_objectSpread2({}, font), {}, { scale: ((_font$scale = font.scale) !== null && _font$scale !== void 0 ? _font$scale : 100) * SUPERSCRIPT_WIDTH })
		};
	};
	var twips = (value) => {
		const amount = numberOf(value);
		return amount === void 0 ? void 0 : amount / 20;
	};
	/** Whether a field's switches give its number a format of its own, such as `\* roman`, or a picture, such as `\# "00"` */
	var hasOwnFormat = (switches) => {
		const formats = [...switches.matchAll(/\\\*\s*"?([^\s"\\]+)/g)].map(([, format]) => format.toLowerCase());
		return /\\#/.test(switches) || formats.some((format) => !PLAIN_FORMATS.has(format));
	};
	/**
	* The result of a field that depends on the pages being worked out, as docx writes it: the page of the bookmark a PAGEREF
	* field refers to, or the number of pages of the document (NUMPAGES) or of its section (SECTIONPAGES). Undefined for other
	* fields, and for those that show something else: a page's position relative to the bookmark (`\p`), or a number in a
	* format of its own.
	*/
	var workedOutResultOf = (instruction, font) => {
		const reference = /^\s*PAGEREF\s+("?)([^\s"\\]+)\1(.*)$/i.exec(instruction);
		if (reference) {
			const [, , bookmark, switches] = reference;
			return /\\p\b/i.test(switches) || hasOwnFormat(switches) ? void 0 : {
				type: "pageReference",
				bookmark,
				font
			};
		}
		const count = /^\s*(NUMPAGES|SECTIONPAGES)\b(.*)$/i.exec(instruction);
		return count && !hasOwnFormat(count[2]) ? {
			type: "pageCount",
			scope: count[1].toUpperCase() === "NUMPAGES" ? "document" : "section",
			font
		} : void 0;
	};
	/** Whether what is read now is shown: not in a field's instruction, nor in a result that is worked out */
	var isShown = ({ fields }) => fields.every((field) => field.inResult && !field.replaced);
	/** Adds the tab stops of a paragraph, or of its style, to those of the styles before */
	var addTabs = (stops, settings = []) => settings.reduce((all, setting) => [...all.filter((stop) => Math.abs(stop.position - setting.position) > .01), ...setting.alignment === "clear" ? [] : [setting]], stops);
	var tabStopsOf = (formats) => formats.reduce((stops, { tabs }) => addTabs(stops, tabs), []).filter((stop) => stop.alignment !== "bar" && stop.alignment !== "clear");
	/**
	* Reads a drawing in a run (`w:drawing`): a picture in the line is a box, and one that text doesn't flow around, such as
	* one behind the text, takes up no room.
	*/
	var readDrawing = (element, reader) => {
		const [drawing] = childrenOf(element["w:drawing"]);
		const inline = drawing["wp:inline"];
		if (inline !== void 0) {
			const children = childrenOf(inline);
			const extent = attributesOf(find(children, "wp:extent"));
			const effect = attributesOf(find(children, "wp:effectExtent"));
			const around = attributesOf(inline);
			const emus = (...values) => values.reduce((total, value) => {
				var _numberOf;
				return total + ((_numberOf = numberOf(value)) !== null && _numberOf !== void 0 ? _numberOf : 0);
			}, 0);
			return [{
				type: "box",
				width: emus(extent.cx, effect.l, effect.r, around.distL, around.distR) / EMUS_PER_POINT,
				height: emus(extent.cy, effect.t, effect.b, around.distT, around.distB) / EMUS_PER_POINT
			}];
		}
		return !childrenOf(drawing["wp:anchor"]).some((child) => "wp:wrapNone" in child) && !reader.inHeader ? "a drawing that text flows around" : [];
	};
	/**
	* Reads a field character (`w:fldChar`). The result of a field that depends on the pages is worked out, rather than read.
	*/
	var readFieldCharacter = (element, font, reader) => {
		const type = attributesOf(element["w:fldChar"])["w:fldCharType"];
		const { fields } = reader;
		const field = fields[fields.length - 1];
		if (type === "begin") fields.push({
			instruction: "",
			inResult: false,
			replaced: false
		});
		else if (type === "end") fields.pop();
		else if (type === "separate" && field) {
			const result = workedOutResultOf(field.instruction, font);
			field.inResult = true;
			if (result !== void 0 && isShown(reader)) {
				field.replaced = true;
				return [result];
			}
		}
		return [];
	};
	/**
	* Reads a run (`w:r`) in the paragraph's formatting, as its character style and its own formatting change it.
	*/
	var readRun = (element, paragraphRun, reader) => {
		var _valueOf;
		const { styles } = reader;
		const children = contentOf(element).filter(isObject);
		const properties = find(children, "w:rPr");
		const format = combine([
			paragraphRun,
			...styleChain(styles, (_valueOf = valueOf(childrenOf(properties), "w:rStyle")) !== null && _valueOf !== void 0 ? _valueOf : styles.defaultCharacterStyle, "character").map(({ run }) => run),
			readRunFormat(properties, styles.themeFonts)
		]);
		const font = fontOf(format);
		const items = children.map((child) => {
			const name = nameOf(child);
			if (name === "w:fldChar") return readFieldCharacter(child, font, reader);
			const field = reader.fields[reader.fields.length - 1];
			if (name === "w:instrText") {
				if (field && !field.inResult) field.instruction += contentOf(child).filter((part) => typeof part === "string").join("");
				return [];
			}
			if (!isShown(reader)) return [];
			switch (name) {
				case "w:t": return spansOf(contentOf(child).filter((part) => typeof part === "string").join(""), format).map((span) => {
					const { text } = span;
					return {
						type: "text",
						text,
						font: _objectWithoutProperties(span, _excluded)
					};
				});
				case "w:tab":
				case "w:ptab": return format.hidden ? [] : [{
					type: "tab",
					font
				}];
				case "w:br": {
					const kind = attributesOf(child["w:br"])["w:type"];
					return format.hidden ? [] : [{
						type: "break",
						kind: kind === "page" || kind === "column" ? kind : "line",
						font
					}];
				}
				case "w:cr": return format.hidden ? [] : [{
					type: "break",
					kind: "line",
					font
				}];
				case "w:noBreakHyphen": return [{
					type: "text",
					text: "‑",
					font
				}];
				case "w:sym": return [{
					type: "text",
					text: "■",
					font
				}];
				case "w:footnoteReference":
				case "w:endnoteReference": {
					var _reader$notes;
					const note = (_reader$notes = reader.notes) === null || _reader$notes === void 0 ? void 0 : _reader$notes.read(name === "w:footnoteReference" ? "footnote" : "endnote", String(attributesOf(child[name])["w:id"]));
					return note === void 0 ? [] : [...note.marker ? [{
						type: "marker",
						name: note.marker
					}] : [], noteNumber(note.label, font)];
				}
				case "w:footnoteRef":
				case "w:endnoteRef": return reader.noteNumber === void 0 ? [] : [noteNumber(reader.noteNumber, font)];
				case "w:drawing": return readDrawing(child, reader);
				case "mc:AlternateContent": {
					const choice = childrenOf(child["mc:AlternateContent"]).find((option) => "mc:Choice" in option);
					return choice ? readRun({ "w:r": [...childrenOf(choice["mc:Choice"])] }, paragraphRun, reader) : [];
				}
				case "w:pict":
				case "w:object": return reader.inHeader ? [] : "a VML drawing";
				default: return [];
			}
		});
		const unsupported = items.find((item) => typeof item === "string");
		return unsupported !== null && unsupported !== void 0 ? unsupported : items.flatMap((item) => item);
	};
	var RUN_CONTAINERS = /* @__PURE__ */ new Set([
		"w:hyperlink",
		"w:ins",
		"w:moveTo",
		"w:smartTag",
		"w:customXml",
		"w:dir",
		"w:bdo",
		"w:sdtContent"
	]);
	/**
	* Reads the content of a paragraph, or of an element in it, such as a hyperlink.
	*/
	var readInline = (elements, paragraphRun, reader) => {
		const parts = elements.filter(isObject).map((element) => {
			const name = nameOf(element);
			if (name === "w:r") return readRun(element, paragraphRun, reader);
			if (RUN_CONTAINERS.has(name)) return readInline(contentOf(element), paragraphRun, reader);
			if (name === "w:sdt") return readInline(childrenOf(find(childrenOf(element[name]), "w:sdtContent")), paragraphRun, reader);
			if (name === "w:fldSimple") {
				const result = workedOutResultOf(String(attributesOf(element[name])["w:instr"]), fontOf(paragraphRun));
				return result !== void 0 && isShown(reader) ? [result] : readInline(contentOf(element), paragraphRun, reader);
			}
			if (name === "w:bookmarkStart") {
				const bookmark = stringOf(attributesOf(element[name])["w:name"]);
				return bookmark === void 0 ? [] : [{
					type: "marker",
					name: bookmark
				}];
			}
			return name === "m:oMath" || name === "m:oMathPara" ? "an equation" : [];
		});
		const unsupported = parts.find((part) => typeof part === "string");
		return unsupported !== null && unsupported !== void 0 ? unsupported : parts.flatMap((part) => part);
	};
	/**
	* The number of a paragraph in a list, and what follows it, as its list's level writes it. The list's numbers move on.
	*/
	var readListNumber = (properties, paragraphRun, reader) => {
		var _valueOf2, _numberOf2, _numberOf3, _reader$counters$get, _counts$index;
		const numbering = childrenOf(find(properties, "w:numPr"));
		const id = (_valueOf2 = valueOf(numbering, "w:numId")) !== null && _valueOf2 !== void 0 ? _valueOf2 : String((_numberOf2 = numberOf(attributesOf(find(numbering, "w:numId"))["w:val"])) !== null && _numberOf2 !== void 0 ? _numberOf2 : "");
		const levels = reader.numbering.get(id);
		const index = (_numberOf3 = numberOf(attributesOf(find(numbering, "w:ilvl"))["w:val"])) !== null && _numberOf3 !== void 0 ? _numberOf3 : 0;
		const level = levels === null || levels === void 0 ? void 0 : levels[index];
		if (!levels || !level) return { items: [] };
		const counts = (_reader$counters$get = reader.counters.get(id)) !== null && _reader$counters$get !== void 0 ? _reader$counters$get : [];
		const current = [...counts.slice(0, index), ((_counts$index = counts[index]) !== null && _counts$index !== void 0 ? _counts$index : level.start - 1) + 1];
		reader.counters.set(id, current);
		const text = level.text.replace(/%([1-9])/g, (_, digit) => {
			var _formatNumber, _ref, _current;
			const other = levels[Number(digit) - 1];
			return (_formatNumber = formatNumber((_ref = (_current = current[Number(digit) - 1]) !== null && _current !== void 0 ? _current : other === null || other === void 0 ? void 0 : other.start) !== null && _ref !== void 0 ? _ref : 1, other === null || other === void 0 ? void 0 : other.format)) !== null && _formatNumber !== void 0 ? _formatNumber : "1";
		});
		const font = fontOf(combine([paragraphRun, level.run]));
		const suffix = level.suffix === "nothing" ? [] : level.suffix === "space" ? [{
			type: "text",
			text: " ",
			font
		}] : [{
			type: "tab",
			font
		}];
		return {
			items: [...text.length > 0 ? [{
				type: "text",
				text,
				font
			}] : [], ...suffix],
			level
		};
	};
	/**
	* Reads a paragraph (`w:p`), in the formatting of its styles, and of its table's style when it is in a table.
	*/
	var readParagraph = (element, reader, tableStyle) => {
		var _valueOf3;
		const { styles } = reader;
		const children = contentOf(element);
		const properties = childrenOf(find(children.filter(isObject), "w:pPr"));
		const style = (_valueOf3 = valueOf(properties, "w:pStyle")) !== null && _valueOf3 !== void 0 ? _valueOf3 : styles.defaultParagraphStyle;
		const paragraphStyles = [...styleChain(styles, tableStyle, "table"), ...styleChain(styles, style, "paragraph")];
		const paragraphRun = combine([styles.run, ...paragraphStyles.map(({ run }) => run)]);
		const list = readListNumber(properties, paragraphRun, reader);
		const formats = [
			styles.paragraph,
			...paragraphStyles.map(({ paragraph }) => paragraph),
			...list.level ? [list.level.paragraph] : [],
			readParagraphFormat(properties)
		];
		const items = readInline(children, paragraphRun, reader);
		const unsupported = find(properties, "w:framePr") === void 0 ? void 0 : "a text frame";
		return _objectSpread2({
			type: "paragraph",
			items: typeof items === "string" ? [] : [...list.items, ...items],
			format: combine(formats),
			tabStops: tabStopsOf(formats),
			markFont: fontOf(combine([paragraphRun, readRunFormat(find(properties, "w:rPr"), styles.themeFonts)])),
			style
		}, typeof items === "string" || unsupported ? { unsupported: typeof items === "string" ? items : unsupported } : {});
	};
	var borderWidth = (borders, name) => {
		var _numberOf4;
		const attributes = attributesOf(find(borders, name));
		const style = attributes["w:val"];
		return style === void 0 || style === "nil" || style === "none" ? 0 : ((_numberOf4 = numberOf(attributes["w:sz"])) !== null && _numberOf4 !== void 0 ? _numberOf4 : 0) / EIGHTHS_PER_POINT;
	};
	/** The rows of a table, or of a content control or custom XML in it */
	var rowsOf = (elements) => elements.filter(isObject).flatMap((element) => {
		const name = nameOf(element);
		if (name === "w:tr") return [element];
		if (name === "w:sdt") return rowsOf(childrenOf(find(childrenOf(element[name]), "w:sdtContent")));
		return name === "w:customXml" ? rowsOf(contentOf(element)) : [];
	});
	/** The cells of a row */
	var cellsOf = (elements) => elements.filter(isObject).flatMap((element) => {
		const name = nameOf(element);
		if (name === "w:tc") return [element];
		if (name === "w:sdt") return cellsOf(childrenOf(find(childrenOf(element[name]), "w:sdtContent")));
		return name === "w:customXml" ? cellsOf(contentOf(element)) : [];
	});
	/** A share of a width, as a fraction, from fiftieths of a percent or a percentage written with a % */
	var shareOf = (value) => {
		const amount = numberOf(value);
		if (amount === void 0) return;
		return typeof value === "string" && value.trim().endsWith("%") ? amount / 100 : amount / FIFTIETHS_OF_A_PERCENT;
	};
	/** A table's own width (`w:tblW`): in points, or as a share of the width it is in. Neither when it is sized to its content */
	var readTableWidth = (properties) => {
		const { "w:w": value, "w:type": type = "dxa" } = attributesOf(find(properties, "w:tblW"));
		const width = type === "dxa" ? twips(value) : void 0;
		const share = type === "pct" ? shareOf(value) : void 0;
		return _objectSpread2(_objectSpread2({}, width !== void 0 && width > 0 ? { width } : {}), share !== void 0 && share > 0 ? { share } : {});
	};
	/**
	* Reads a table (`w:tbl`): the width, margins and content of each cell, and the height and borders of each row. Word
	* sizes the columns of a table whose cells don't all have widths to their text, and widens a column of one whose cells
	* all have widths for a word longer than they give it, unless its layout is fixed, so those are worked out as it is laid
	* out.
	*/
	var readTable = (element, reader) => {
		var _ref2, _blocks$find;
		const children = contentOf(element).filter(isObject);
		const properties = childrenOf(find(children, "w:tblPr"));
		const style = valueOf(properties, "w:tblStyle");
		const ownStyles = styleChain(reader.styles, style, "table");
		const tableStyles = ownStyles.length > 0 ? ownStyles : styleChain(reader.styles, reader.styles.defaultTableStyle, "table");
		const tableMargins = _objectSpread2(_objectSpread2({
			top: 0,
			bottom: 0,
			left: 0,
			right: 0
		}, Object.assign({}, ...tableStyles.map(({ cellMargins }) => cellMargins))), readCellMargins(find(properties, "w:tblCellMar")));
		const borders = childrenOf(find(properties, "w:tblBorders"));
		const grid = childrenOf(find(children, "w:tblGrid")).filter((child) => "w:gridCol" in child).map((column) => {
			var _twips;
			return (_twips = twips(attributesOf(column["w:gridCol"])["w:w"])) !== null && _twips !== void 0 ? _twips : 0;
		});
		const rows = rowsOf(children);
		const gridWidth = (from, to) => grid.slice(from, to).reduce((total, value) => total + value, 0);
		const read = rows.map((row, rowIndex) => {
			var _numberOf5;
			const rowChildren = contentOf(row).filter(isObject);
			const rowProperties = childrenOf(find(rowChildren, "w:trPr"));
			const heightAttributes = attributesOf(find(rowProperties, "w:trHeight"));
			const height = twips(heightAttributes["w:val"]);
			const { "w:hRule": rule } = heightAttributes;
			const skipped = (_numberOf5 = numberOf(attributesOf(find(rowProperties, "w:gridBefore"))["w:val"])) !== null && _numberOf5 !== void 0 ? _numberOf5 : 0;
			const { cells, edges, acrossColumns } = cellsOf(rowChildren).reduce(({ column, cells: done, edges: before, acrossColumns: across }, cell) => {
				var _numberOf6, _twips2, _shareOf;
				const cellChildren = contentOf(cell).filter(isObject);
				const cellProperties = childrenOf(find(cellChildren, "w:tcPr"));
				const span = (_numberOf6 = numberOf(attributesOf(find(cellProperties, "w:gridSpan"))["w:val"])) !== null && _numberOf6 !== void 0 ? _numberOf6 : 1;
				const mergeElement = find(cellProperties, "w:vMerge");
				const merge = mergeElement === void 0 ? void 0 : attributesOf(mergeElement)["w:val"] === "restart" ? "restart" : "continue";
				const margins = _objectSpread2(_objectSpread2({}, tableMargins), readCellMargins(find(cellProperties, "w:tcMar")));
				const { "w:w": ownWidth, "w:type": widthType = "dxa" } = attributesOf(find(cellProperties, "w:tcW"));
				const inTwips = widthType === "dxa" ? (_twips2 = twips(ownWidth)) !== null && _twips2 !== void 0 ? _twips2 : 0 : 0;
				const hasWidth = inTwips > 0 || widthType === "pct" && ((_shareOf = shareOf(ownWidth)) !== null && _shareOf !== void 0 ? _shareOf : 0) > 0;
				const width = inTwips > 0 ? inTwips : gridWidth(column, column + span);
				return {
					column: column + span,
					edges: new Map([...before, [column + span, before.get(column) + width]]),
					acrossColumns: across || span > 1,
					cells: [...done, _objectSpread2(_objectSpread2({
						column,
						width: width - margins.left - margins.right
					}, hasWidth ? { ownWidth: width } : {}), {}, {
						blocks: readBlocks(cellChildren, reader, style),
						marginTop: margins.top,
						marginBottom: margins.bottom,
						marginLeft: margins.left,
						marginRight: margins.right
					}, merge ? { verticalMerge: merge } : {})]
				};
			}, {
				column: skipped,
				cells: [],
				edges: /* @__PURE__ */ new Map([[skipped, gridWidth(0, skipped)]]),
				acrossColumns: false
			});
			return {
				edges,
				acrossColumns,
				row: _objectSpread2(_objectSpread2({ cells }, height !== void 0 && rule !== "auto" ? { height: {
					value: height,
					rule: rule === "exact" ? "exact" : "atLeast"
				} } : {}), {}, {
					header: onOff(rowProperties, "w:tblHeader") === true,
					cantSplit: onOff(rowProperties, "w:cantSplit") === true,
					borderTop: borderWidth(borders, rowIndex === 0 ? "w:top" : "w:insideH"),
					borderBottom: rowIndex === rows.length - 1 ? borderWidth(borders, "w:bottom") : 0
				})
			};
		});
		const edgesAt = /* @__PURE__ */ new Map();
		const unequal = read.some(({ edges }) => [...edges].some(([column, edge]) => {
			var _edgesAt$get;
			const other = (_edgesAt$get = edgesAt.get(column)) !== null && _edgesAt$get !== void 0 ? _edgesAt$get : edge;
			edgesAt.set(column, other);
			return Math.abs(other - edge) > WIDTH_TOLERANCE;
		}));
		const tableCells = read.flatMap(({ row }) => row.cells);
		const blocks = tableCells.flatMap((cell) => cell.blocks);
		const fixed = attributesOf(find(properties, "w:tblLayout"))["w:type"] === "fixed";
		const fits = !fixed && tableCells.some(({ ownWidth }) => ownWidth === void 0);
		const unfitted = read.some(({ acrossColumns }) => acrossColumns) ? "cells merged across columns in a table given no widths" : blocks.some(({ type }) => type === "table") ? "a table in a table given no widths" : void 0;
		const unsupported = (_ref2 = fits ? unfitted : unequal ? "a table whose rows give a column different widths" : void 0) !== null && _ref2 !== void 0 ? _ref2 : (_blocks$find = blocks.find((block) => block.unsupported !== void 0)) === null || _blocks$find === void 0 ? void 0 : _blocks$find.unsupported;
		return _objectSpread2(_objectSpread2(_objectSpread2({
			type: "table",
			rows: read.map(({ row }) => row)
		}, fits ? { fit: readTableWidth(properties) } : {}), !fits && !fixed ? { widen: _objectSpread2(_objectSpread2({}, readTableWidth(properties)), {}, { acrossColumns: read.some(({ acrossColumns }) => acrossColumns) }) } : {}), unsupported ? { unsupported } : {});
	};
	/**
	* Reads the paragraphs and tables in a part of a document, such as a table cell or a header, and in the content controls
	* and custom XML in it.
	*/
	var readBlocks = (elements, reader, tableStyle) => elements.filter(isObject).flatMap((element) => {
		switch (nameOf(element)) {
			case "w:p": return [readParagraph(element, reader, tableStyle)];
			case "w:tbl": return [readTable(element, reader)];
			case "w:sdt": return readBlocks(childrenOf(find(childrenOf(element["w:sdt"]), "w:sdtContent")), reader, tableStyle);
			case "w:customXml": return readBlocks(contentOf(element), reader, tableStyle);
			case "w:altChunk": return [{
				type: "paragraph",
				items: [],
				format: {},
				tabStops: [],
				markFont: {},
				unsupported: "an imported document"
			}];
			default: return [];
		}
	});
	var START_TYPES = /* @__PURE__ */ new Set([
		"nextPage",
		"continuous",
		"evenPage",
		"oddPage",
		"nextColumn"
	]);
	/** The headers or footers a section refers to, by the pages they are on */
	var readReferences = (properties, name, readPart) => Object.fromEntries(properties.filter((child) => name in child).map((child) => {
		var _attributes$wType;
		const attributes = attributesOf(child[name]);
		return [String((_attributes$wType = attributes["w:type"]) !== null && _attributes$wType !== void 0 ? _attributes$wType : "default"), readPart(String(attributes["r:id"]))];
	}).filter(([type, blocks]) => blocks !== void 0 && [
		"default",
		"first",
		"even"
	].includes(type)));
	var DEFAULT_COLUMN_SPACE = 36;
	/**
	* The width of each of a section's columns (`w:cols`), from the width of its page's text: columns of the same width with
	* the same space between them, unless the section gives each column's width.
	*/
	var readColumns = (element, width) => {
		var _numberOf7, _twips4;
		const attributes = attributesOf(element);
		const given = childrenOf(element).filter((child) => "w:col" in child);
		if (isOff(attributes["w:equalWidth"]) && given.length > 0) return given.map((column) => {
			var _twips3;
			return (_twips3 = twips(attributesOf(column["w:col"])["w:w"])) !== null && _twips3 !== void 0 ? _twips3 : 0;
		});
		const count = Math.max(1, (_numberOf7 = numberOf(attributes["w:num"])) !== null && _numberOf7 !== void 0 ? _numberOf7 : 1);
		const space = (_twips4 = twips(attributes["w:space"])) !== null && _twips4 !== void 0 ? _twips4 : DEFAULT_COLUMN_SPACE;
		return Array.from({ length: count }, () => (width - space * (count - 1)) / count);
	};
	/**
	* Reads a section's properties (`w:sectPr`): its pages, how it starts, and its headers and footers. A section that
	* doesn't give a header or footer for a kind of page has the one of the section before.
	*/
	var readSection = (element, readPart, previous) => {
		var _stringOf, _twips5, _twips6, _margins$wLeft, _twips7, _margins$wRight, _twips8, _twips9, _twips10, _twips11, _twips12, _twips13;
		const properties = childrenOf(element);
		const size = attributesOf(find(properties, "w:pgSz"));
		const margins = attributesOf(find(properties, "w:pgMar"));
		const numbering = attributesOf(find(properties, "w:pgNumType"));
		const grid = attributesOf(find(properties, "w:docGrid"))["w:type"];
		const start = valueOf(properties, "w:type");
		const format = (_stringOf = stringOf(numbering["w:fmt"])) !== null && _stringOf !== void 0 ? _stringOf : "decimal";
		const firstNumber = numberOf(numbering["w:start"]);
		const pageWidth = (_twips5 = twips(size["w:w"])) !== null && _twips5 !== void 0 ? _twips5 : DEFAULT_SECTION.pageWidth;
		const marginLeft = (_twips6 = twips((_margins$wLeft = margins["w:left"]) !== null && _margins$wLeft !== void 0 ? _margins$wLeft : margins["w:start"])) !== null && _twips6 !== void 0 ? _twips6 : DEFAULT_SECTION.marginLeft;
		const marginRight = (_twips7 = twips((_margins$wRight = margins["w:right"]) !== null && _margins$wRight !== void 0 ? _margins$wRight : margins["w:end"])) !== null && _twips7 !== void 0 ? _twips7 : DEFAULT_SECTION.marginRight;
		const gutter = (_twips8 = twips(margins["w:gutter"])) !== null && _twips8 !== void 0 ? _twips8 : DEFAULT_SECTION.gutter;
		const columns = readColumns(find(properties, "w:cols"), pageWidth - marginLeft - marginRight - gutter);
		const unsupported = grid === "lines" || grid === "linesAndChars" || grid === "snapToChars" ? "a document grid" : numbering["w:chapStyle"] !== void 0 || formatNumber(1, format) === void 0 ? "page numbers in a format not yet written" : find(properties, "w:textDirection") !== void 0 ? "text that runs down the page" : void 0;
		const headers = readReferences(properties, "w:headerReference", readPart);
		const footers = readReferences(properties, "w:footerReference", readPart);
		return _objectSpread2(_objectSpread2({
			pageWidth,
			pageHeight: (_twips9 = twips(size["w:h"])) !== null && _twips9 !== void 0 ? _twips9 : DEFAULT_SECTION.pageHeight,
			marginTop: (_twips10 = twips(margins["w:top"])) !== null && _twips10 !== void 0 ? _twips10 : DEFAULT_SECTION.marginTop,
			marginBottom: (_twips11 = twips(margins["w:bottom"])) !== null && _twips11 !== void 0 ? _twips11 : DEFAULT_SECTION.marginBottom,
			marginLeft,
			marginRight,
			header: (_twips12 = twips(margins["w:header"])) !== null && _twips12 !== void 0 ? _twips12 : DEFAULT_SECTION.header,
			footer: (_twips13 = twips(margins["w:footer"])) !== null && _twips13 !== void 0 ? _twips13 : DEFAULT_SECTION.footer,
			gutter,
			start: start !== void 0 && START_TYPES.has(start) ? start : "nextPage",
			titlePage: onOff(properties, "w:titlePg") === true,
			columns,
			numberFormat: format
		}, firstNumber === void 0 ? {} : { firstNumber }), {}, {
			headers: _objectSpread2(_objectSpread2({}, previous === null || previous === void 0 ? void 0 : previous.headers), headers),
			footers: _objectSpread2(_objectSpread2({}, previous === null || previous === void 0 ? void 0 : previous.footers), footers)
		}, unsupported ? { unsupported } : {});
	};
	/**
	* Reads the levels of each list in the document's numbering (`w:numbering`), by the ids its paragraphs refer to it by:
	* its number, and the placeholder docx writes before it is given one.
	*/
	var readNumbering = (context, styles) => {
		const numbering = context.file.Numbering;
		const root = childrenOf(numbering.prepForXml(READING_CONTEXT)["w:numbering"]);
		const abstract = new Map(root.filter((child) => "w:abstractNum" in child).map((child) => {
			const byIndex = childrenOf(child["w:abstractNum"]).filter((level) => "w:lvl" in level).map((level) => {
				var _valueOf4, _stringOf2, _valueOf5;
				const levelChildren = childrenOf(level["w:lvl"]);
				return {
					index: numberOf(attributesOf(level["w:lvl"])["w:ilvl"]),
					level: {
						format: (_valueOf4 = valueOf(levelChildren, "w:numFmt")) !== null && _valueOf4 !== void 0 ? _valueOf4 : "decimal",
						text: (_stringOf2 = stringOf(attributesOf(find(levelChildren, "w:lvlText"))["w:val"])) !== null && _stringOf2 !== void 0 ? _stringOf2 : "",
						suffix: (_valueOf5 = valueOf(levelChildren, "w:suff")) !== null && _valueOf5 !== void 0 ? _valueOf5 : "tab",
						start: numberOf(attributesOf(find(levelChildren, "w:start"))["w:val"]),
						paragraph: readParagraphFormat(find(levelChildren, "w:pPr")),
						run: readRunFormat(find(levelChildren, "w:rPr"), styles.themeFonts)
					}
				};
			}).reduce((all, { index, level }) => {
				const copy = [...all];
				copy[index] = level;
				return copy;
			}, []);
			return [String(attributesOf(child["w:abstractNum"])["w:abstractNumId"]), byIndex];
		}));
		const byNumber = root.filter((child) => "w:num" in child).map((child) => {
			const abstractId = String(numberOf(attributesOf(find(childrenOf(child["w:num"]), "w:abstractNumId"))["w:val"]));
			return [String(attributesOf(child["w:num"])["w:numId"]), abstract.get(abstractId)];
		});
		const numbers = new Map(byNumber);
		const placeholders = numbering.ConcreteNumbering.map((concrete) => [`{${concrete.reference}-${concrete.instance}}`, numbers.get(String(concrete.numId))]);
		return new Map([...byNumber, ...placeholders]);
	};
	/**
	* Reads the parts of the document's settings (`w:settings`) that change how it is laid out.
	*/
	var readSettings = (context) => {
		var _twips14;
		const settings = childrenOf(context.file.Settings.prepForXml(READING_CONTEXT)["w:settings"]);
		return _objectSpread2({
			defaultTabStop: (_twips14 = twips(attributesOf(find(settings, "w:defaultTabStop"))["w:val"])) !== null && _twips14 !== void 0 ? _twips14 : 36,
			evenAndOddHeaders: onOff(settings, "w:evenAndOddHeaders") === true,
			addsParagraphSpacing: onOff(childrenOf(find(settings, "w:compat")), "w:doNotUseHTMLParagraphAutoSpacing") === true
		}, onOff(settings, "w:autoHyphenation") === true ? { unsupported: "hyphenation" } : {});
	};
	/**
	* Reads a document's body, as it is written, with its styles, lists, settings, headers and footers.
	*
	* @param body - The formatted body (`w:body`)
	* @param context - The context it was formatted in, with the document it is in
	*/
	var readDocument = (body, context) => {
		const styles = getTextStyles(context);
		const numbering = readNumbering(context, styles);
		const readerOf = (inHeader) => ({
			styles,
			numbering,
			inHeader,
			fields: [],
			counters: /* @__PURE__ */ new Map()
		});
		const parts = /* @__PURE__ */ new Map();
		const readPart = (id) => {
			if (!parts.has(id)) {
				const wrapper = [...context.file.Headers, ...context.file.Footers].find(({ View }) => `rId${View.ReferenceId}` === id);
				const xml = wrapper === null || wrapper === void 0 ? void 0 : wrapper.View.prepForXml(_objectSpread2(_objectSpread2({}, context), {}, {
					viewWrapper: wrapper,
					stack: []
				}));
				parts.set(id, xml && readBlocks(Object.values(xml)[0], readerOf(true)));
			}
			return parts.get(id);
		};
		const noteElements = (kind) => {
			const wrapper = kind === "footnote" ? context.file.FootNotes : context.file.Endnotes;
			const xml = wrapper.View.prepForXml(_objectSpread2(_objectSpread2({}, context), {}, {
				viewWrapper: wrapper,
				stack: []
			}));
			const notes = childrenOf(Object.values(xml)[0]).filter((child) => `w:${kind}` in child);
			return new Map(notes.map((note) => {
				const attributes = attributesOf(note[`w:${kind}`]);
				const type = attributes["w:type"];
				return [String(type === "separator" || type === "continuationSeparator" ? type : attributes["w:id"]), note];
			}));
		};
		const notesByKind = {
			footnote: noteElements("footnote"),
			endnote: noteElements("endnote")
		};
		const readNoteContent = (kind, id, label) => {
			const note = notesByKind[kind].get(id);
			return note === void 0 ? [] : readBlocks(contentOf(note), _objectSpread2(_objectSpread2({}, readerOf(false)), label === void 0 ? {} : { noteNumber: label }));
		};
		const footnotes = /* @__PURE__ */ new Map();
		const endnotes = [];
		const noteCounts = {
			footnote: 0,
			endnote: 0
		};
		const readNote = (kind, id) => {
			noteCounts[kind]++;
			const label = formatNumber(noteCounts[kind], kind === "footnote" ? "decimal" : "lowerRoman");
			const content = readNoteContent(kind, id, label);
			if (kind === "endnote") {
				endnotes.push(...content);
				return { label };
			}
			const marker = `footnote ${noteCounts[kind]}`;
			footnotes.set(marker, content);
			return {
				label,
				marker
			};
		};
		const reader = _objectSpread2(_objectSpread2({}, readerOf(false)), {}, { notes: { read: readNote } });
		const sections = [];
		const blocks = [];
		let bookmarks = [];
		const addSection = (element) => {
			sections.push(readSection(element, readPart, sections[sections.length - 1]));
		};
		const read = (elements) => {
			for (const element of elements.filter(isObject)) {
				const name = nameOf(element);
				if (name === "w:sdt") read(childrenOf(find(childrenOf(element[name]), "w:sdtContent")));
				else if (name === "w:customXml") read(contentOf(element));
				else if (name === "w:sectPr") addSection(element[name]);
				else if (name === "w:bookmarkStart") bookmarks = [...bookmarks, String(attributesOf(element[name])["w:name"])];
				else {
					const sectionProperties = name === "w:p" ? find(childrenOf(find(contentOf(element).filter(isObject), "w:pPr")), "w:sectPr") : void 0;
					for (const block of readBlocks([element], reader)) {
						const markers = bookmarks.map((marker) => ({
							type: "marker",
							name: marker
						}));
						const marked = block.type === "paragraph" && markers.length > 0;
						const sectionBreak = sectionProperties !== void 0 && block.type === "paragraph" && block.items.length === 0 && !marked;
						blocks.push({
							block: marked ? _objectSpread2(_objectSpread2({}, block), {}, { items: [...markers, ...block.items] }) : sectionBreak ? _objectSpread2(_objectSpread2({}, block), {}, { sectionBreak }) : block,
							section: sections.length
						});
						bookmarks = marked ? [] : bookmarks;
					}
					if (sectionProperties !== void 0) addSection(sectionProperties);
				}
			}
		};
		read(Object.values(body)[0]);
		if (sections.length === 0 || blocks.some(({ section }) => section >= sections.length)) addSection(void 0);
		return _objectSpread2({
			blocks,
			sections,
			footnotes,
			footnoteSeparator: footnotes.size > 0 ? readNoteContent("footnote", "separator") : [],
			footnoteContinuationSeparator: footnotes.size > 0 ? readNoteContent("footnote", "continuationSeparator") : [],
			endnotes: endnotes.length > 0 ? [...readNoteContent("endnote", "separator"), ...endnotes] : []
		}, readSettings(context));
	};
	//#endregion
	//#region src/layout/estimate-page-numbers.ts
	var PASSES = 3;
	var sameNumbers = (one, other) => one.bookmarks.size === other.bookmarks.size && [...one.bookmarks].every(([name, page]) => other.bookmarks.get(name) === page) && one.pageCount === other.pageCount && one.sectionPageCounts.length === other.sectionPageCounts.length && one.sectionPageCounts.every((count, index) => other.sectionPageCounts[index] === count);
	/** Lays out the pages until their page numbers stop changing, with a measurer */
	var estimateWith = (body, context, measurer) => {
		if (!context.file) return { bookmarks: /* @__PURE__ */ new Map() };
		const content = readDocument(body, context);
		const layOut = (before, pass) => {
			const { bookmarks, pageCount, sectionPageCounts, stoppedAt } = paginate(content, {
				measurer,
				pageNumbers: before.bookmarks,
				pageCount: before.pageCount,
				sectionPageCounts: before.sectionPageCounts
			});
			const estimate = _objectSpread2({
				bookmarks,
				sectionPageCounts
			}, stoppedAt === void 0 ? { pageCount } : {});
			return pass >= PASSES || sameNumbers(estimate, before) ? estimate : layOut(estimate, pass + 1);
		};
		return layOut({
			bookmarks: /* @__PURE__ */ new Map(),
			sectionPageCounts: []
		}, 1);
	};
	/**
	* Works out the page each bookmark of a document starts on, and how many pages the document and each of its sections
	* have, by laying out its pages as Word does, so the page numbers of its tables of contents and page references, and its
	* numbers of pages, are written with it. Give it to a document as its `pageNumbers`:
	*
	* ```ts
	* new Document({ pageNumbers: estimatePageNumbers, sections: [...] });
	* ```
	*
	* The pages are laid out with the widths and heights of the fonts Word documents use most, such as Calibri, Cambria,
	* Arial and Times New Roman. It follows paragraphs' spacing, indents, line spacing, tab stops and keep settings, widow
	* and orphan control, lists, pictures in the line, tables, whose rows break across pages, footnotes and endnotes, page,
	* column and section breaks, and each section's page size, margins, columns, headers, footers and page numbering.
	*
	* It stops at the first thing it can't lay out yet: a drawing that text flows around, a text box or frame, an equation,
	* a footnote that continues on the next page, columns evened out before a continuous section break, or a table row kept
	* whole that is taller than a page. The page references to bookmarks after it are left blank, for
	* Word to fill in when it updates the fields.
	*
	* @publicApi
	*/
	var estimatePageNumbers = (body, context) => estimateWith(body, context, DEFAULT_MEASURER);
	/**
	* Works out the page each bookmark of a document starts on, as {@link estimatePageNumbers} does, measuring text as the
	* options say. Give what it returns to a document as its `pageNumbers`:
	*
	* ```ts
	* new Document({ pageNumbers: estimatePageNumbersWith({ measureWidth: measureWithPretext(pretext) }), sections: [...] });
	* ```
	*
	* @publicApi
	*/
	var estimatePageNumbersWith = ({ measureWidth }) => {
		const measurer = measureWidth ? measurerOf(measureWidth) : DEFAULT_MEASURER;
		return (body, context) => estimateWith(body, context, measurer);
	};
	//#endregion
	exports.estimatePageNumbers = estimatePageNumbers;
	exports.estimatePageNumbersWith = estimatePageNumbersWith;
	exports.measureWithPretext = measureWithPretext;
	return exports;
})({});
