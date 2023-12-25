// Page numbers

import * as fs from "fs";
import { AlignmentType, Document, Footer, Header, Packer, PageBreak, PageNumber, Paragraph, TextRun } from "docx";

// cspell: disable
const LOREM_IPSUM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam accumsan condimentum elit ut placerat. Integer vitae justo est. Quisque tempus augue eu diam pulvinar aliquam. Pellentesque neque sem, posuere eget augue pretium, feugiat mattis diam. Mauris libero arcu, elementum sit amet nunc sed, vestibulum posuere sapien. Nullam ultrices efficitur magna et commodo. Morbi vitae dolor vulputate, dapibus ipsum in, finibus enim. Aliquam dapibus tellus libero. Nullam nulla eros, ullamcorper eu risus at, luctus aliquet nunc. Nunc dictum turpis eu quam suscipit porta. In rutrum scelerisque nunc in consectetur. Pellentesque ut nibh eget neque congue auctor. Nunc dapibus massa elit, vel cursus metus condimentum et. Nunc venenatis dolor eu lobortis fringilla. Nulla sed risus id lectus scelerisque sollicitudin. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nulla lobortis et purus convallis ullamcorper. Nunc scelerisque, urna eu vestibulum feugiat, orci turpis pulvinar odio, vitae faucibus elit tortor et urna. Curabitur eros mauris, mollis a vestibulum nec, vestibulum sed velit. Nam semper metus ut felis ultricies rutrum. Cras hendrerit eros vel placerat vulputate. Proin placerat mollis lacus a ultricies. Mauris vel turpis vitae purus suscipit dignissim. Donec egestas molestie libero in suscipit. Aenean auctor tellus convallis eros porttitor, id vehicula risus commodo. Sed accumsan turpis elit, eget molestie tortor efficitur eget. Aliquam ut lectus quis augue pellentesque tincidunt id id quam. Maecenas auctor, lorem eu ornare tempor, lacus metus ultrices turpis, nec feugiat nibh purus id justo. Sed semper feugiat ante, sit amet accumsan lorem vulputate vel. Morbi interdum, mauris sit amet efficitur mattis, nunc sapien tempor ante, eget maximus ipsum arcu quis dolor. Suspendisse id consequat justo, quis sollicitudin nisi. Duis euismod, velit non faucibus placerat, eros sem fermentum lectus, ut egestas nisi ipsum eget mi. Donec vitae mollis libero. Etiam magna leo, auctor sit amet nibh sit amet, interdum finibus nunc. Quisque a pellentesque velit, a laoreet ante. Quisque fringilla orci quis dui facilisis, quis auctor urna cursus. Mauris eget justo lacus. Integer placerat, leo vitae ullamcorper varius, nulla mauris gravida massa, ac dignissim odio erat eu ante. Duis non dui semper, eleifend neque nec, ultricies ligula. Sed nec sem nec dolor ultrices finibus. Praesent rutrum iaculis mollis. Fusce accumsan dui tortor, quis feugiat urna efficitur sed. Fusce viverra tristique lacinia. Sed nec faucibus ipsum, vel pulvinar ligula. Curabitur ut viverra nisl. Nulla nisi tortor, imperdiet et ipsum sit amet, egestas lacinia leo. Quisque interdum mauris non nunc egestas tempor a vehicula diam. Vestibulum convallis quam sit amet tincidunt posuere. Mauris velit sem, fermentum a diam sit amet, pulvinar iaculis lectus. In dolor turpis, cursus id libero sit amet, aliquet ullamcorper urna. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Etiam tincidunt euismod nisi, ut dignissim neque blandit sit amet. Etiam vel velit rhoncus, tincidunt diam quis, dignissim felis. Integer dolor urna, rutrum vitae ultricies ut, sagittis quis felis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Donec pharetra aliquam augue. Donec imperdiet placerat augue, nec consequat leo placerat a. Mauris accumsan ornare massa vitae volutpat. Sed commodo purus ac fringilla ultricies. Donec quis urna hendrerit dolor efficitur sollicitudin. Pellentesque diam arcu, dapibus a nisl pretium, auctor lobortis augue. Aliquam libero lorem, scelerisque a volutpat ac, venenatis eu nisl. Maecenas turpis diam, consequat eget elementum eget, venenatis at lacus. In maximus erat magna, ut hendrerit erat malesuada vel. Suspendisse iaculis, lacus posuere convallis gravida, nisi purus blandit nunc, imperdiet tempor nunc turpis et sapien. Duis euismod id ligula ac laoreet. Ut facilisis massa quis turpis imperdiet, eu ornare lorem placerat. Vestibulum pharetra feugiat eleifend. Quisque ornare pretium urna, lacinia aliquam eros placerat et. Integer sit amet auctor ipsum. Morbi imperdiet dictum ex sed lacinia. Curabitur interdum mattis nunc non vestibulum. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Pellentesque odio libero, viverra ac quam eleifend, dignissim euismod nibh. Etiam sit amet semper ante. Morbi in tellus lacinia, bibendum dolor quis, viverra nisi. Proin condimentum purus ipsum, et accumsan sapien finibus ac. Maecenas congue in leo id faucibus. Etiam porta dapibus ultricies. Nunc ac volutpat magna. Nam pretium dolor ac ultrices tincidunt. Vestibulum pharetra elit vitae lacus pharetra euismod. Pellentesque fringilla lacus ac neque varius sagittis. Mauris tincidunt rutrum velit. Etiam pretium est vitae lacus ultricies, vitae viverra turpis auctor. Nulla at lectus pellentesque enim dapibus aliquet eleifend et quam. Suspendisse cursus sed velit et lobortis. Integer sed facilisis ligula, ultrices molestie neque. Nulla porta mauris vitae quam consequat, eget fringilla enim luctus. Integer vitae rhoncus nibh, ac ornare ligula. Sed sed placerat libero. Suspendisse laoreet erat lacus, et lacinia nibh maximus in. Maecenas vitae enim at urna gravida euismod. Interdum et malesuada fames ac ante ipsum primis in faucibus. Nullam lacinia lobortis tortor mollis venenatis. Sed sodales iaculis justo in rhoncus. Proin orci sapien, fermentum nec eleifend in, tristique vel mi. Donec vitae ornare justo, sed rhoncus nibh. Quisque a interdum est, in scelerisque odio. Ut luctus eget ex non fringilla. Morbi nec iaculis nisi. Donec porta libero ac ex sollicitudin, vitae interdum erat faucibus. Donec ornare, arcu ullamcorper pretium euismod, nibh nisi consectetur justo, ac aliquet sem eros non nibh. Nulla vitae elementum arcu. Aenean ut consectetur dui. Donec posuere condimentum velit ac hendrerit. Sed aliquet aliquet mi, sed rutrum justo ultrices eget. Donec volutpat libero dui, ac bibendum nunc eleifend a. Fusce ultricies ligula non sollicitudin lobortis. Integer sit amet elit sapien. Morbi rhoncus bibendum nibh et facilisis. Etiam consectetur elementum sem non elementum. Nunc rutrum sagittis ipsum non sodales. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Quisque porttitor nulla ultrices mollis porta. Cras non metus sed quam rutrum ultricies. Curabitur aliquet in sem eget auctor. Ut sodales quis leo bibendum venenatis. Etiam pellentesque eros ut metus dignissim commodo. Aliquam vitae sem gravida, convallis ipsum at, imperdiet tellus. Pellentesque consectetur odio sit amet sapien vestibulum aliquam nec id libero. Proin a maximus felis. Aenean molestie vulputate massa, eu eleifend sem consequat id. Etiam quis ante nec leo faucibus dignissim eu at mi. Nam nec ligula nec sapien rhoncus faucibus. Fusce vestibulum orci libero, vel commodo est congue iaculis. In hac habitasse platea dictumst. Sed lacinia magna eu arcu commodo pretium. Fusce id elementum enim. Mauris tristique tortor dolor, at pretium magna tempor nec. Vivamus non dui sit amet odio porttitor tincidunt. Nam pulvinar aliquet tortor tristique tempor. Duis finibus tincidunt elit, at viverra justo sagittis in. Morbi pellentesque gravida mi, in pulvinar metus molestie at. Fusce bibendum eleifend sapien a fermentum. Nam efficitur tellus dignissim, vehicula tortor ac, tristique enim. Aliquam pretium dui interdum varius elementum. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Donec a finibus elit. Phasellus cursus tortor at justo bibendum aliquam. Sed nec hendrerit nibh, eu finibus tortor. Aenean sit amet dui rutrum, sollicitudin justo eu, condimentum ipsum. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Maecenas dictum neque lacus, vel posuere eros pretium nec. Morbi ac ante at ex semper ultricies ac quis augue. In hac habitasse platea dictumst. Mauris laoreet porta nisl. Sed augue lorem, aliquet in volutpat ut, rhoncus eget nibh. Sed rhoncus arcu diam, accumsan rhoncus sem iaculis ac. Duis dolor magna, semper et tellus non, condimentum volutpat nisi. Donec eget metus eget elit eleifend vestibulum et ut purus. Nam a dui accumsan, efficitur ex at, commodo eros. Pellentesque sit amet nunc ac odio egestas suscipit id sodales ligula. Duis non mi vitae mi mollis fringilla at sit amet sem. Morbi laoreet mattis dolor sit amet tincidunt. Aliquam erat volutpat. Pellentesque porta sem odio, at lobortis quam commodo vitae. Curabitur ut urna dolor. Nulla vitae pretium ex. Nulla facilisi. Vestibulum placerat odio eget enim ultrices, et imperdiet tellus consequat. Sed dignissim, erat ut dignissim interdum, dui mi rhoncus nunc, id rhoncus turpis nunc eu risus. Mauris leo orci, euismod sit amet velit ac, condimentum dictum dui. Cras cursus dolor augue, et vestibulum lorem fringilla in. Nulla fermentum odio vehicula justo placerat, et aliquet velit vulputate. Sed aliquam auctor dictum. Phasellus sit amet sollicitudin elit. Cras eget gravida ex. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Duis tortor erat, ornare id feugiat eget, pellentesque at lectus. Sed vitae nisi ullamcorper, tincidunt augue vitae, accumsan ligula. Curabitur ut lobortis lacus, imperdiet placerat arcu. Sed vestibulum tempor nulla vel dignissim. Phasellus imperdiet, dolor nec mollis tempor, nulla nibh pretium nibh, nec elementum lacus neque in sapien. Nam et eleifend lorem. Nam pretium molestie enim quis porta. Proin eu pharetra enim. Etiam a velit eget augue congue tempor. Interdum et malesuada fames ac ante ipsum primis in faucibus. Sed urna tellus, euismod ac pharetra nec, ultrices vel nisi. Phasellus at arcu eget tellus mattis ultricies non quis urna. Vestibulum non eros fringilla, porttitor massa id, ornare metus. Quisque lacinia, massa a ornare vulputate, ex lectus ullamcorper ligula, eget facilisis mi turpis at dolor. Curabitur posuere elementum enim, non placerat tortor tincidunt sit amet. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Nam fermentum ut felis et dapibus. Ut consectetur finibus bibendum. Phasellus semper sapien neque, nec consequat nibh convallis et. Nunc nec egestas enim. Nulla facilisi. Quisque sed nibh sed lorem placerat ornare sed nec sapien. Morbi et risus vitae magna varius varius eget at leo. Curabitur a eleifend elit. Mauris augue nulla, convallis vel ante in, consequat feugiat orci. Donec sagittis risus nibh, eget porta purus faucibus non. Curabitur ultrices, ex et placerat rutrum, velit odio accumsan nulla, et elementum mi leo in velit. Pellentesque auctor egestas ultricies. In viverra est a mauris sollicitudin, a laoreet augue cursus. Vestibulum non sollicitudin massa. Curabitur ac tellus metus. Pellentesque hendrerit dolor sed mi vestibulum imperdiet. Nulla vitae odio ultrices, tempor enim sed, vestibulum eros. Cras libero ex, malesuada nec porttitor sit amet, efficitur sit amet ligula. Morbi pellentesque tempus felis, id iaculis quam euismod non. Sed scelerisque id massa eu elementum. Vestibulum id malesuada arcu. Maecenas eget placerat sem, at consectetur orci. Nullam interdum erat urna, ac rhoncus odio feugiat sed. Morbi rutrum auctor sem eget pulvinar. Suspendisse egestas tempor volutpat. Vivamus euismod, sem eget molestie rhoncus, metus dui laoreet lacus, et lobortis est metus ut felis. Aenean imperdiet lacus nunc, vitae molestie orci ultrices nec. Cras egestas maximus diam, vitae efficitur nisl luctus imperdiet. Nulla pellentesque sodales ante, nec facilisis turpis. Vivamus at hendrerit enim, ac dictum lorem. Cras congue accumsan dui, non pretium sem auctor quis. Nunc a mauris vehicula, elementum ex vitae, sollicitudin eros. Nunc non sapien vitae justo sodales condimentum. Praesent nisl felis, tristique ac odio at, rhoncus porttitor orci. Morbi egestas placerat iaculis. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In at lorem nec neque faucibus ultricies ut in ipsum. Suspendisse fermentum feugiat augue eu convallis. Maecenas eros velit, efficitur sit amet posuere sed, tristique sit amet nisi. Donec vel convallis justo, id tempor neque. Nunc pulvinar maximus nulla, vitae congue lacus cursus ut. Morbi at mollis est, a vehicula nisi. Cras venenatis nibh vel massa interdum commodo. Nulla mattis neque sed sem bibendum, iaculis hendrerit neque fringilla. Sed a lobortis orci. Morbi in est sed libero vestibulum semper. Suspendisse potenti. Aliquam pretium erat tellus, in suscipit lorem aliquet iaculis. Aenean ac viverra ipsum. Sed at diam luctus, pharetra lorem vel, aliquam magna. Donec mollis orci eget enim efficitur ultricies. Proin neque diam, dignissim euismod ex vel, sollicitudin sodales sapien. Sed a egestas nunc, a ullamcorper est. Aenean vulputate fringilla justo non vestibulum. Donec ac dolor in nisl finibus tristique. Donec sed turpis at felis congue porttitor sed sit amet metus. In in ex nulla. Donec sodales vel velit ut congue. Nullam vitae egestas purus. Vivamus non mi consequat, molestie enim nec, hendrerit mi.`;
// cspell: enable

const doc = new Document({
    sections: [
        {
            properties: {
                titlePage: true,
            },
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                                new TextRun("My Title "),
                                new TextRun({
                                    children: ["Page ", PageNumber.CURRENT],
                                }),
                            ],
                        }),
                    ],
                }),
                first: new Header({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                                new TextRun("First Page Header "),
                                new TextRun({
                                    children: ["Page ", PageNumber.CURRENT],
                                }),
                            ],
                        }),
                    ],
                }),
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                                new TextRun("My Title "),
                                new TextRun({
                                    children: ["Footer - Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES],
                                }),
                            ],
                        }),
                        new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                                new TextRun({
                                    children: [
                                        "Footer - Page in section ",
                                        PageNumber.CURRENT_PAGE_IN_SECTION,
                                        " of ",
                                        PageNumber.TOTAL_PAGES_IN_SECTION,
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
                first: new Footer({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                                new TextRun("First Page Footer "),
                                new TextRun({
                                    children: ["Page ", PageNumber.CURRENT],
                                }),
                            ],
                        }),
                    ],
                }),
            },
            children: [
                new Paragraph({
                    children: [new TextRun("First Page"), new PageBreak()],
                }),
                new Paragraph("Second Page"),
                new Paragraph(LOREM_IPSUM),
                new Paragraph({
                    children: [new TextRun("Next Page"), new PageBreak()],
                }),
                new Paragraph(LOREM_IPSUM),
            ],
        },
        {
            properties: {
                titlePage: true,
            },
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                                new TextRun("My Title "),
                                new TextRun({
                                    children: ["Page ", PageNumber.CURRENT],
                                }),
                            ],
                        }),
                    ],
                }),
                first: new Header({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                                new TextRun("First Page Header "),
                                new TextRun({
                                    children: ["Page ", PageNumber.CURRENT],
                                }),
                            ],
                        }),
                    ],
                }),
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                                new TextRun("My Title "),
                                new TextRun({
                                    children: ["Footer - Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES],
                                }),
                            ],
                        }),
                        new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                                new TextRun({
                                    children: [
                                        "Footer - Page in section ",
                                        PageNumber.CURRENT_PAGE_IN_SECTION,
                                        " of ",
                                        PageNumber.TOTAL_PAGES_IN_SECTION,
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
                first: new Footer({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                                new TextRun("First Page Footer "),
                                new TextRun({
                                    children: ["Page ", PageNumber.CURRENT],
                                }),
                            ],
                        }),
                    ],
                }),
            },
            children: [
                new Paragraph({
                    children: [new TextRun("First Page"), new PageBreak()],
                }),
                new Paragraph("Second Page"),
                new Paragraph(LOREM_IPSUM),
                new Paragraph({
                    children: [new TextRun("Next Page"), new PageBreak()],
                }),
                new Paragraph(LOREM_IPSUM),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
