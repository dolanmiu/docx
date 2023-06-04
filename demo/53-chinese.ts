// Chinese text - Chinese text need to use a Chinese font. And ascii text need to use a ascii font.
// Different from the `52-japanese.ts`.
//     `52-japanese.ts` will set all characters to use Japanese font.
//     `53-chinese.ts` will set Chinese characters to use Chinese font, and set ascii characters to use ascii font.

// Note that if the OS have not install `KaiTi` font, this demo doesn't work.

import * as fs from "fs";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

const doc = new Document({
    styles: {
        default: {
            document: {
                run: {
                    font: {
                        ascii: "minorHAnsi",
                        eastAsia: "minorEastAsia",
                        cs: "minorBidi",
                        hAnsi: "minorHAnsi",
                    },
                },
            },
        },
        paragraphStyles: [
            {
                id: "Normal",
                name: "Normal",
                basedOn: "Normal",
                next: "Normal",
                quickFormat: true,
                run: {
                    font: {
                        ascii: "minorHAnsi", // Can also use minorHAnsi
                        eastAsia: "minorEastAsia", // Can also use minorEastAsia
                        cs: "minorBidi",
                        hAnsi: "minorHAnsi",
                    },
                },
            },
        ],
    },
    sections: [
        {
            children: [
                new Paragraph({
                    text: "中文和英文 Chinese and English",
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                    text: "中文和英文 Chinese and English",
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "中文和英文 Chinese and English",
                            font: { eastAsia: "SimSun" }, // set eastAsia to "SimSun".
                            // The ascii characters will use the default font ("Times") specified in paragraphStyles
                        }),
                    ],
                }),
                new Paragraph({
                    text: `店様付旅母正役基社発破班。発治治京岡局本因追意金紀統責郵滴尽。立功日庁重天富評界明済不着法返祉経正引行。載区列防新目治日群付無人道言越名。界安無死専体風木人教録覧訃。女問堂容県作先芸便効証帯債土全極的日。能山中岡仕関攻井季接店線幌温後率事阜止。成間路行究今式歌像祉帯式媛読徹。安行息古入出文侵監株登部席内文第珍鶴問用。
    
                編竹入俳多応日氏陸福芸北供動。情績拠僧肺軍油能認郷翌南対韓短東食束兵晶。政予任習口佐所当止市告号。悩申無式立医毎部観潟訴菱権。発臼背郎上予配光記芸注然出。梨場株以政囲下球品材県動政押婚面見。米共試使落帳遅毅間三子開。問与大八地芸第線体架辺今死。押構草齢戦重最変社豪記目盗連報準周込。系貸劇様重鷲始能質村異社学動導勤。
                
                残様的荻仲刺局標績供質球就雄。考和母問者役尊紙推新経革個事編安観。益学北日著楽車山勢流泉四犯投台戒設対臨百。危謄初治穴委済本索労刊回。月写政覧女事棋違年終索情響白子泉転企堀社。江遊著西高開面毎分芸責成創査全判調目止懇。原育会夏作売望人転乱融抜心。制川供健水示囲阜厚高右断季人役。持面必日暮気管像冬間影図健行格阪。
                
                来入工速会健評下町慮大貸社一見園外申憶。服豊舞入面沢交使奥見記写意岩。北観提女刊液城共五擦相売田合是由読。回歳売苦定記点郎意増賛治北渡本応。受送文携村陸情静了申注際。順負子研済老上変女産第内無費携投展達。東初乗回動合語学待聴暮沢流全場導敷記賞次。更物中備著後渡売第部時禁新田木下昨。備護起織服久権意全海馬適応。
                
                幸速団供地信討川安矛場消学年。去茂玉東今要出約元教負限載始今簡。編掲証的情仕渡室手映法部始。紙反語清阪曜税受知選謝個印観聞。教人超死準無者参生撤技真価椿景破市見国。左需臓道力趣暮際丁高会近部敗岡力当社。壊態毒期波超長写島断兆国世行共絞私報。反野番点図択女撃脱案情王援。減属考論月院催者門料約覧市戦。
                
                山部午金査投立集争教殺巣作世動北部応。通負考隙問粛中帯閉要程規化小。橋棋互界時引就現省竹去子無系容米。竹転起日本新田強済購書区庁集作容同会窓教。文公神転待究挙登投川選囲針能楽路断出歌。祥新現寄公史真玉属元始員金抜関前百衝能。国眺暮囲世嘘面外営国内報夜九掲事春葉。来月刊台先良理著自供法投。通渡請当月学安首一押実展介況。
                
                法優分独込右得里記域目順供進乗。憂婚転峰大写医投社曲題任能務熱県展覧港専。栄余歯真著改追事作果石芸。青感将南便再転領鈴投提鉄索競虎師体物想。牲打迎達携度開技書催掲安去変念座。革混疑生採就枢当住回県組北意寛。爆新和級掲交象温十賛展木開有結日。新海辺小除京物興量写界裁上。文師建関面取質也底沼画者図空医心無季。
                
                高館湯転名気業以際置講詰方活礎組調軽際。発変東作訪乃小化理利提目気。極季本問号面帯勤戦行新禁情堀郎携。座所転再祥業必変昌今歩佐王立抗後養崩。支物猪躍芸整縦焦供防続相護治時語朝分刊定。綿田幸崎責本欲間載神調崎答志政報与速美載。飯治止稿原先明画森群進見情幕。女民館終調質並伝車慌供科。支田国傷自動献疑討医足公成公主断的望。
                
                責開児食福実帰治師今策今。水重寺圧医観送連東者秒途。選央力律式開作掲写様階組戦写型紙。式国販時天遣国出難共前次領体康稲住転。査見保重議原速群者内月正連。爾天膨装芸別巨平運数準三浜念載創県奈飛提。素京発揮田談気党示見象定電類代級。善返跡国有話権入猛府週亡辞馬脳。関残主祐雪塚去集村完海関文受載表川護照立。
                
                発闘美慎健育旅布容広互無秋認天歌媛芸。転器合読県増認会賞倒点系。食気母服絵知去祝芸車報熱勝。能貿月更障文的欠賞現覇声敏施会。懲病写昼法族業律記聡生開緊楽暮護。東地二員者説盟治害討面提。第北乗査庭年近的禁疑報方店記必迷都流通。聞有力前愛院梨野関業前訳本清滋補。蒲読火死勝広保会婚際気二由保国。用君込村需起相点選紙拡氏訃不。`,
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
