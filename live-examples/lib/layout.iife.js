var docxLayout = (function(exports) {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
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
	var FONT_WIDTHS = [
		{
			name: "Calibri",
			lineHeight: 1220.703125,
			regular: "3y566h7O7XbbaG3t4L4L7O7O3W4O3Y627X*094c4c7O*027fd+938w8l9D7E7b9T9L3Y4/886Adna6am85ax8v7b7Da28TdW877D7k4P624P7O7O4z7v8d6D8d7O4N7n8d3B3L773Bcv8d8f8d8d5t675f8d74bb6N756b4W7c4W7O3y567O7X7O7X7O7O69d26i807O4O7X6a5j7O5g5e4A8C9a3Y4P3S6C809Yavaz7f=93*04bX==7E*02=3Y*029N==am*037Oao=a2*02=858f=7v*04c5==7O*02=3B*028d8d=8f*037O8h=8d*02=8d=*0f8U9N8E=*0jag8l=*083B8X7l=*0377=*036D488y5S6K3U=*05939Q8d=*05dzdi=*0g5q7D5m=*0m3P8E9D8q8d8j8d8A917e9NaL8q8d8b7Ea37q7b4N9U8Tcf4x4d88774q7fdLa68pamaV92c5af9z8d8v7b677a6L5D8j5f7Dbi9raoa28k7O7k6b7q*026F7X7X6G678d3Q6b8+56gXfOeobLak7lf4dRbZ=*0f7O=*059T8p=*087q=gNfOeo==d/9s=*0z7q7q==a39o7X7X7I6s=*0d4Z9D5f3LcScR938l6D6A7D676b6/6/8Eaj8Z7E7O594p9S8d8D5T927B7v8d*026D738d8d7O7O9+6D6D8e8h4q8d8d8s747t8d*024q4i4I5H5Q3B8Rcucucv8d8d8t8fb8aUab5t*044/4/7171673L4q3L4Z5f5f948K8u74bb756v6b7u7j7i6/*026D9Q7v8h8E8n4Z77638d6/6/cAdmdT9H7naJbQ998D7I7I8d8q5I5I2O3R3R3X4+7I4X3t6g3W*023y3y55557O7O8p8p6b6b4y6a4A4z4y6a4z4A4m4m3y3y5d*035Z3y514U727l5d5d4F2H4h4U555/*045d5d6b8/6y5d*03514z7l7l724c5d*038j8j5U7U6I7D633W3Wa28s!!4i6D*02=4/!*034Z7K93=7E9L3Y!am!7Dao4i938w6w8Q7E7k9Lam3Y888Zdna67Iam9L85!7a7D7DbT87bKao==8T788p4i8u8T8j6+8b785s8p8k4i777f8C715U8f8F7Z6r8k638uab6Gb4aU=*04878c8L7D8u=aecK9tam8f8l6r7b6O8x729393dLcv8x8b8I808l6z9q7Vax8k7p6a9t7Z6D3Lam6M6M858K8laX9k7Z8l*027E7E9N6K8z7b3Y3Y4/dEdI9G8va28f9I938q8w6Ka47Ecx7qa2a28v9zdn9Lam9K858l7D8faV879/8IdAdW9DbW8j8AdL8H7v8l7v5q8K7OaN6D8t8t7g7+aA8n8f898d6D63759M6N8u7lbpbJ8oaq7m6Xbi7q=7O8t=6Y673B3B3LbLc28l=*028dewaB9P87ceaa9S8dd0b6bj8PeabP7q6tbKb4am8c9e7u==gledam90ewceewaB8l6D9x00*06an8y8j7A858d6N5y6F5Q8k75d5bf7q6D957K8v7g8E7G9T8na38Hb79te6bDa68G8l6D7D637D747D748K7ebo9k8/7F8I7l8I7lbF9mbF9m3Y==8y7s9U849L8n9L8t8I7ldKba3Y=*03bXc5==a37O=*057q7j=*05am8c=*0b6w5q==6F5Q8R7d876N=*2p7v=4N4N8N8b=*0VaV92aV92aV92aV92aV92=*03bi9rbi9rbi9rbi9rbi9r=*079z6F8K7q8f747QfE7Oe94J3y2n8r3p381Z00*044O4O7X7Oe9e96b7O3W*036y*037O*02!*02aO!*0200*043yge!3s6g94!*02665j5j!8K7z7O!*045g!*0o4c3u00*04!00*09672J!!5B5b5D515E5D5I5D5w3p3p5G673S5g5e5B5b5D515E5D5I5D5w3p3p!5e5k5G4U5k!*0a9E8l8l7b7Xcva6eqchdWbF8E7X887DgW8g8P9b8Z7b8l!!7X*02a3ar7Xaf9a!*0f00*0w!*0jb+!*0c7S!!g1d2!*07b5!b1!*02=!*06bz!*027b!*0pb+5K!*03aAbjaAbjbabla7aKaqb0b0a660!*0y8l6D!*0ae9*03k8c9dO*03!*0d7o!*1o8l!*028Q!*07cv!8t7O!!5g!*023Y7O!*02dlaI!*08a+!5K!*0r7O!*0m=7O!!7O7O!*2p",
			bold: "3y566S7O7Xbpb13F4U4U7O7O424O4b6K7X*094k4k7O*027fe29u8N8h9S7E7b9Z9T4b5b8z6DdGajaA8kaK8P7p7Lad9fea8D887u556K557O7O4I7K8p6y8p7T4Y7q8p3S3/7w3ScJ8p8q8p8p5z6f5r8p7pbF7b7q6d5o7r5o7O3y567O7X7O7X7O7O6vd26w8r7O4O7X665m7O5i5g4J8P9m4c4L3Y6P8raiaPa+7f=9u*04c7==7E*02=4b*029/==aA*037OaF=ad*02=8k8H=7K*04c7==7T*02=3S*028p8p=8q*037O8w=8p*02=8p=*0f9l9/8V=*0jai8z=*083S9m7R=*037w=*036K4O8O6C6N48=*059Ka18p=*05dGdb=*0g5H7L5y=*0m428Xas8I8p8Y8y8d9v7g9/by8I8p8l7Eai7J7b4YaF9fcA4I4J8B7w4V7CdVaj8paAbZ9VcyaPa08p8P7s6j7m6+5K8x5r7LbVa7aFad8B827u6d7G7J7v6M7X7X6D698p487x9b56hkg4eCc2aC7Rfueico=*0f7T=*04c7a58J=*087a=h8g4eC==dR9A=*04c7=*0t7G7a==a29v8g837G6j=*0d5a9L5v3/cXcY9u8m6D6U7V6f6d6S6P8Zav9i7E7O5p4F9U8p915X9c7J7K8p*026D6V8p8z7T7Ta36H6H8r8f4A8y8o8o7v7A8p*024K4u576a6i3Y97cJ*028p8p8D8obfb3aX5z5z5A5z5z58587F7F6f3N4s3N585r5r9a988k7pbF7q7f6i7v7a7c6S*026ya77L8f8t8x5a7w6k8z6S6Sd6dGena27Ta/cu9H9h8d7I8x8y5R5R2Z3W3R405i815b3m6o42*023y3y55557O7O8p8p6h6h4y664J4I4y6a4I4J4m4m3y3y5d*03613H584X6Y7C5d*022T4m5d555/*045d5d6h8/6P5d*03584I7l7C6Y4k5d*038j8j5U8a757L7i4242ac8J!!4i6D6y6D=5b!*034Z7K9u=7E9T4b!aA!88aF4u9u8N6q927E7u9TaA4b8z9idGaj7IaA9T8k!7m7L88cx8DcEaF==9f7a8w4u8A9f8x7j8l7a5I8w8x4u7w7C8P7n618q938i6n8w698AaX73bybe=*048z8o9e8b*02b0de9zaA8q8d6q7b6+8E7o9o9qdPcJ8x8g8N897X6A957sas8s7T6j9t8g6y3/aA6/6/8k8y8hbe9E8i8u8h8u7E7E9Y6M8r7p4b4b5be0e09U8Pac8z9Q9u8I8N6Max7Ed17yacac8P9RdG9TaA9S8k8h7L8zbk8Dai8Ve1ev9/cu8F8rei8+7K8k7L5y967Tbx6H8J8J7L8eb98x8q8m8p6y667qaz7b8O7EbXcl8Kb87L6RbN7O=7T8F=6S6f3S3S3/c8cq8z=*028peObf9+8kcdadab8Zd/clbo9OeZd97J6FcEbyaA8o9A7N==hbeZbb9aeOcreObf866n9x00*06aP9d8U7T8k8p6O5L6V5W8G79dUcc7y6H9H8p9b8h907/a68Vax8Ybo9IembEak8Q8h6y7L65887s887s9t7RbM9A9n8i8V7T8V7Tcc9Pcc9P4b==987Yas8K9T8xau918V7Teibv4b=*03c7c7==ai7T=*057G7a=*05aA8q=*0b6H5y==6V5W9l7P8D7b=*2p7K=4Y4Y8Z8l=*0VaV9VaV9VaV9VaV9VaV9V=*03bVa7bVa7bVa7bVa7bVa7=*07a36+9n7S8z7q7QfE7Oe94J3y2n7X3p381Z00*044O4O7X7Oe9e97x7P42*036P*037O*02!*02b7!*0200*043ygC!3m6o9k!*02665o5o!9b7V7O!*045z!*0o4B3u00*04!00*096e2V!!5K5h5F575K5F5z5w5r3u3u5Q6e3Y5i5g5K5h5F575K5F5z5w5r3u3u!5n5k5O5d5r!*0aa68w8h7g7XcJaNeobXeSbY8V7X8N7Lhs8N9f9y9K878h!!7X*02b4bu8kaU9a!*0f00*0w!*0jc8!*0c8g!!gmd2!*07br!bg!*02=!*06bz!*027b!*0pb+5K!*03aVbHaVbHbAbNatb7aUbybyaE6c!*0y8h6D!*0ae9*03kuc1d7*03!*0d7o!*1o8p!*0292!*07ce!8C7O!!5Z!*024b7O!*02d6aI!*08a+!5T!*0r7O!*0m=7O!!7O7O!*2p"
		},
		{
			name: "Cambria",
			lineHeight: 1172.36328125,
			regular: "3s4u699H7WdWaL3J5+5+6H8G3d5c3d7G8G*0948488G*026CdR9L9z8Oam8/8p9zaL544P9R8pcLaFad8Uad9J7M9ha89sep8X8W8q5u7G5u8G5P4t7E8z6V8H7E4L7K8E4m4a8c4fd08K8j8I8z6u6K5i8E7Uc67z7U77634Y63b83s4u6V8g8w9x4Y7Q4tdj6x7E8G5cdj4t5T8G6n6n4t8w9c4q4t6n6I7EdxdWdx6C=9L*04dy==8/*02=54*02ap==ad*038Gad=a8*02=8+9t=7E*04bM==7E*02=4m*028i==8j*038G8j=8E*02=8z=*0faCap8H=*0jaP8E=*084m9T8w=*038j=*04619K5U8s4R=*05aOaF8D=*05excO=*0g739h5x=*0m4n8za+9n8z9l8H8O8O8hapbM9n8H8d94ad8v8p4K9z9GcF4X549R8c4Q7EemaF8Aadbm9ncOaHai8w977M6K8A4Z5n9h5i9hbO9La7a79J9Z8q768l8n786S7G8M7a6A8u3Z6o4A4diMhtfOdccz8qfsePcU=*0f7H=*059E7K=*0878=iMhtfO==eq9O=*0o6t=6t=*078v7u==aqaS97838q76=*0d6maZ6o4acOcO9L8O778p9h6K767N5/9za89t8/7E4O4Kaj8z9J6B8W7U7L8G8I8x7d7c8H8L7E7Max7h7aa2894U8w8w877U8I8x8E8w4U4m4s4+4G458WcWcOcV8K8I8X8gbZbBbi6n6n6g6p6t6e6i898c6K4c4A6d4n5i5i9a8c877Uc67U77767F78785H5B5V79ce8b878J9d4c85748z5H5BdhdldPaj8ebfd09m8/9881aBaB6q6q3l4W4S5n5X8+603I693t*023I3I41418G*034t4t2Y4t4e4e2Y4v4e4e4i3+49494f*034t*052N5x5X3n555H456g*045I5I5h6n5T5h4L3N3N4s4e6+6+562W4K*036S*02!*033333!*034s6R*0247!*044s4s9H3Qb2cJ72!bw!cabQ4s9L9z8o9k8/8qaLad549R9tcMaF8Yaday8U!8A9h9vch8XcfaD==8+6Y8v4s8t8+8H7X8d6Y6g8v8z4s8f7E8y7y6l8j9q8k6L8Y7u8tb87CbfbL=*04!8r8K9vca=b3cs8vad8j8i6J8p6M7o6M8I8zexbO9v8C9r897T6x8G729m7U8U7A8W8i6R4aad7979978C8Ocl8F8k8O*028/8/bz8m8W7M54544OeDeAbNaaaQ9oar9L9n9z8maf8/er8vaQaQaaaCcMaLaday8U8O9h9ocb8Xaw9Oevevbsdi9l8Zep9T7E8t8b6/8K7Eba7a9e9e8s8Lax9d8j8T8I6V7/7UaJ7z8W8jcxcx9FbI827mb/8j=7E8q=7m6K4m4m4abXcu8E=*028TdSaZbi9Kd3b59y8eencndna1hFea8o6Wcfbfad8gal8H==hrfFaM8Th6bHdSaZ8o6M6e00*06aQ9e9l878U8I7S6x8m769r85eNbo8v7aax8xaD8Uaa8fcfa7aM9gdKbpeScpaX8u8O6V9h7/8W7U8W7U9y7MdkbB9O8l9O8m9N8Ebh95bh9554==ar8KaE8LaC98aM9d9O8jcNax4f=*03dybM==ad7M=7H=*038l78=*05ad8g=*0b8m6/==8m768Q7s8X7z=*0u4K=*0tcM=cM=cM=*0l6t=6t=6t=6t=*0r9r=9r=*06eq=eq=*0776=76=76=*037E=!!ar!=*0Vbm9nbm9nbm9nbm9nbm9n=*03bO9LbO9LbO9LbO9LbO9L=*07!*057QfE7QfE5e3W2C8F3d2C0T00*045c5c8w7QfEbK8h5P3t3t3d3t5T5T5E5T85856X!*02bM!*0200*0439jL!426K9v!*034L4L!836H5G!*048G!*0o473u00*04!00*096n3r!!6n*084A4A6v6n*0c4A4A!5K5K6c5H5K!*0aal8G*03d08GjCfXdL8G8G9Q8G8Gie8G*029A8G8G!*02858Z!!8S!*0h00*0w!*0jfM!*0c86!!gfdjcaaPbY!*06aD!*02=!*06dn!*028p!*056d!*0if776!*03ew*0b!*0z8O7d!*0ad67kd67kep7kac*03=d6dRdReE7DeE7DdxdxdE7kdE7k7EcTcTdXdXiDeS938S*039X8RcFcFape8ceced6d66N6Md6d66N6Nd6cgd6d6cud6cud6d6dIgTdIdy9ady9agb9abr*03dVdVfkfk7D7DdO7kdO7kdududs9hds9h9h9x*039IdSc4c49xeNcgdtd6d6eSdTdTfDdXdXgM9Q8a8x9b9s9Q9k!9La08G9L9L8GcdcIcIb48GbHbH1O8G7z6X3Tah9Y9Ya/djaPaiaiaB4B5S7g8w9e9eaFaF6FerjJ9peSk69V9Uaa8Z8Z4M9hbjeDc8bvb8bwcDaL5J=bH*058GbwbHbwbH*07eDeDbH*06d7bHbH=bH*028G8GbH*03dXdX7v=bH*0bbt*03bwbw=btbH*099v*02bH*03bbbbfz*08fh*03ayam!!8787bgbNdWe9bgbgcK=8G8Gbj*03g2g2e9bj6k9e*02aPaYapapc3c3724q878Zc+bObObbbbbj9e9ebcbcbUbUaKa8bJbJjojobLbLbJbJbt*03=bH*04bwbwbzbzbIbP4Sdp9G9Gbt9M8H9M9M8H9M9Mbt9M8H9V8Hbq",
			bold: "3s5f6C9G8vfgbA3X6o6o759g3E5h3E7V9g*094o4o9g*0274epacab8Zb1928Da6bi5u5laG8DdeaDaT9CaTam819/aA9Wf19H9s8S5M7V5M9g5P4t8n9f7l9l8j56889l4W4K9g4QdW9s8V9l9f7d7b5J9l8jcu8d8j7v6950699g3s5f7l8I9ba1508l4tdj6A8a9g5hdj4t5W9g6R6R4t9t9c4k4t6R6Q8aeJfgeJ74=ac*04dM==92*02=5u*02b5==aT*039gaT=aA*02=9FaB=8n*04cq==8j*02=4W*028Y==8V*039g8V=9l*02=9f=*0fblb59l=*0jbn9l=*084WaO9F=*039m=*046Qav6X8I5m=*05bDaD9n=*05eUdp=*0g7O9/5U=*0m519fbOa49fa99n8+8Z99b5cDa49l8S97aT8r8D56a69+dF5D5taG9g5n8gfPaD9oaTcnaCeJd3bc9e9W8g7k9f5P5O9/5Q9/cKa/a/aVaGar8S7v8F8F7J7D8j8N876+9e4g7j5j4GjCiwgQdJdl9yfYfmea==5t=*0c8q=*03dN=aj88=*087y=jCiwgQ==ftaI=9r=*0d5t=5t=*0g8r7P==aRb+9L8O8S7v=*0d7tc87p4Kdwdwac8Z7u8I9/7b7u816MagaAac928i5l5ba+9faq7s9s8j8o9l9l9e7p7C9l9r8l8qc57C7vbn8O5b9d9f8w8j9b9f9j9f5n574Z6u5V4Ia4dQdKdS9r9q8Z8Vcicwb+777774777d6u6w8/8/7b4T5b6s545J5J9O8+918jcu8j857v8E7y7y6v6n6H7xc18J8V9o9H4U9a7i9k6v6neqeFfybn9zbQeiaA9U9e8Eb3b36W6W3I5s5p5X6z9e6j3X6C3H*023W3W4A4z9g9g9b9b4t4t3a4s4k4k3a4D4k4k4E4k4o4o4E*034t*053I9g6j3M5q684E6v*046c6c5w6R6e5w4+4v4v4s4f797b5o394Z*036S6J7f!*036g6g!*034s7g7f7g=!*044u4uac3Ebbds7G!c6!d8cC58acab8Da2928Sbib15taGacdeaD9faTaZ9C!9f9/akcy9Hd6bE==9H7J9n58949H9p8R8X7J789n94589s8g9w8H6Z8V9Q997u9A8J94bO8pcycv=*04!949sakd8=b+dy9saT8V8K7c8D7M877n8W8Dg3ct9X9map908O7f9F7Ma08ra08w9r8Z7f4KaT7w7w9u998ZcN9W998+8Z8+9292cF8y8T815t5t5lfjfyd0aybr9Gbiaca4ab8yaE92eJ8rbrbrayb8debiaTb39C8Z9/9Gco9HbgaGfUg5cjeNa28Xfeay8n8T8J7o9m8jch7v9S9S9f9xa/9H8V9p9l7l898jbJ8d9C9ldIdUa1cA8s7Jcn8Z=8j8X=7J7b4W4W4Kc+d89l=*029pfgcDcfa2dsbxam8WfodwdObIj1gf8h7hd6cyaT8Vb39d==iDgObl9dgHcvfgcD8A7d6y00*06bu9Sa28w9H9p8h778y7tae8KfpcJ8r7vbb9Eb99UaC9bcPaRbv9Oe7c0fQdabZ9y8Z7l9/899s8j9s8jas8ueycGaN9qaL9rax9lcN9VcN9V5t==b39tbb9xbd9xbk9HaG9ldha/4N=*03dNcq==aT8q=*058F7y=*05aT8V=*0b8y7o==8y7t9w8i9H8d=*0H5t=5t=*0l9r=9r=9r=9r=*0Vf2=f2=*0g8n=!!bb!=*0D5t=5t=*0ecnaCcnaCcnaCcnaCcnaC=*03cKa/cKa/cKa/cKa/cKa/=*07!*057QfE7QfE5e3W2C8F3e2C0T00*045h5h9g7QfEbK8l5P3H3H3E3H6e6e6b6e85856X!*02c4!*0200*0439lA!4h7iai!*035151!5f7d5V!*041V!*0o4w3u00*04!00*096R3R!!6R*084Q4Q6/6R*0c4Q4Q!6f6c6D686g!*0aaz9g*03dW9glrh9el9g9la0a29gkd9g*05!*028E9/!!a3!*0h00*0w!*0jfQ!*0c8R!!godj!*09aI!*02bh!*06dg!*028N!*0pfh7+!*03fz*0b!*0z8+7p!*0ad67Hd67Hep7I!*0h7I!*1o9f!*02a2!*07d4!br9g!!9g!*024Cb+!*02dBaP!*08aJ!6F!*0r9g!*0m=bH!!9g9g!*2p"
		},
		{
			name: "Arial",
			lineHeight: 1149.90234375,
			regular: "4m4m5z8I8IdVar2/5d5d65984m5d4m4m8I*094m4m98*028IfTararbibiar9zcabi4m7Qar8Id1bicaarcabiar9zbiareMarar9z4m*027l8I5d8I8I7Q8I8I4m8I8I3u3u7Q3ud18I*035d7Q4m8I7Qbi7Q*025e445e984m5d8I*03448I5dbx5O8I985dbx8E6g8B5d*02908p5d*025J8Id2*029z=ar*04fE==ar*02=4m*02bibi=ca*0398ca=bi*02=ar9z=8I*04dV==8I*024m*038I*068B9z=8I*02=8I=*0f9Dbi8I=*0jbi8I=4m*05==4mbv6Y=*037Q=*044A8I5e8I3u=*059sbj8I=*05fEeM=*0g5T9z4m=*0m3u8IbSag8Iag8Ibibi7QbicGag8I8JarbM9s9z8Ica9MdN3u4mar7Q3u7QdXbi8IcadpagdAarbO8Iarar7Q9G5Y4m9z4m9zdmatbIbic47Q9z7Q9z9z8x8x8I8I7a7D8I446t984mkRj6gpgCd173j6eMc3=*0f8I=*05ca8I=*088x=kRj6gp==ga9G=*0g4m*02=*0f8x6R==b2aG9s8R9z7Q=*0d5taJ5L3udTdTarbi7Q8I9z7Q7Q9575arbiasar8I7Q3ubx8Ibi5dar7Q8I*037Q7Q8I*03bz7a7a9T7X4m8I8I8L7R9F8I*023u3u5A574M3u8Yd1*028I8I8F8Icncd8C5d*068u8u7Q3u443u5t4m4m8I8U8z7Qbi7Q887Q8t8x8x7Q*03ca8j7X8L8E6d7Q6k8I7Q7Qf4eafJb86JbfbYal9U7B8faLaL5/5/2v3M*025I7x512/5z3u*025d5d5t5t98*035d*094m4m5d*0d522t5k585t5/*045d*0d4m5d*036d6d5d917r9z7a5d5dbf98!!5d7Q*02=!*045d5dar4mcgd660!c6!dnbM3uarar8Dasar9zbica4marasd1biaacabiar!9G9zarcuard3bI==926+8I3u8z928/7Q8J6+6V8I8I3u7Q7Q907Q708IaO8V7y9F6b8za88db9cd=*04ar8/8zc4e+=8Mcd9pca8Ibi7Q9z6k9N8hbQ91dXd1ay8Iay7Qarar9x9kbx8G7g6q9p8Z7Q3uca6W6War8Ibid1aM8Vbi*02arardx8ubfar4m4m7QgxfOdm97bf9Xbfaragar8uaBarer9sbfbf97agd1bicabfarbi9z9XbUarbAareleGcodRagbffObi8I8Z8j5J978Iat7a8L8L6S97aM8E8I8u8I7Q7a7QcT7Q8Z89cycT9Nbf897+bK8u=8I8I=7+7Q3u4m3ueacJ8I=*028EkW9Mca9BeSb9as7Qe1aTcZaJgtdz9s7acsaMca8Icz9T==gOe0d19AiDdkkW9Mbi7Q7T00*06bf8Lag89ar8I7F6r8u5Jau8Berat9s7a976S976S976SbC8obi8EdLa8hNdCbN89bi7Q9z7a8I7Q8I7Qar7QetaPar89ar89ar8Idtaqdtaq4m==ar8Dag97bi8Ebi8Ear89d1aM3u=*03fEdV==bM8I=*059s8x=*05ca8I=*0b8u5J==8u5Jar7Qar7Q=*0K4m=*0ed1*04=*1l8I=4m4ma/8J=*0Vdpagdpagdpagdpagdpag=*03dmatdmatdmatdmatdmat=*07b/6e9f8Jas907QfE8IfE5d3W2D8I4m381j00*04!5d8I8IfEfE6t8E3u*035d*038I8I5u!*02fE!*0200*0438fE!2Y5y5y!*035d5d!7Q8I5d!*042D!*0o4m3u00*04!00*095d!*025d*05!*045J!*0f5Q5Q5V585Q!*0a8Ibibi8I8Id1bih6iceMcM818Iar9zfE89arcaar8Ibi8Iar9z8I8I!*0k00*0w!*0jdR!*0c53!!gNbx!*09fE!*02c0!*069o!*0teL7G!*03d2d2!*05d2*03!*0A7Q!*0afE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b998!!2D!*024m8B!*02b9fj!*08bf!4i!*0r8B!*0m8B97!!8B8B!*2p",
			bold: "4m5d7q8I8IdVbi3K5d5d65984m5d4m4m8I*095d5d98*029zffbi*03ar9zcabi4m8Ibi9zd1bicaarcabiar9zbiareMarar9z5d4m5d988I5d8I9z8I9z8I5d9z9z4m4m8I4mdV9z*03658I5d9z8Ica8I8I7Q654o65984m5d8I*034o8I5dbx5O8I985dbx8E6g8B5d*02908I5d*025J8Id2*029z=bi*04fE==ar*02=4m*02bibi=ca*0398ca=bi*02=ar9z=8I*04dV=8I*03=4m*029z*068B9z*04=9z=*0fbfbi9z=*0jbi9z=4m*08ch8I8I=*028I=*04619z7v9z4m=*05b4bj9z=*05fEeM=*0g7v9z5d=*0m4m9zd4bf9zbf9zbibi8Ibid5bf9z9uarbm9O9z8Ica9Zez4m4mbi8I4m8Ifwbi9zcadlb7dTbEce9zarar8I9o5E5d9z5d9zc+bkcybic28I9z7Q9z9z8e8e8I8I7N939z4o7O985dkRj6hnifdV8Ij+fEdV=*024m=*0b8I=*05ca9z=*079z8e=kRj6hn==g9ap=*0g4m*02=*0f9188==a/d59T9T9z7Q=*0d7Pd17W4meWeWbibi8I9z9z8I7Qa57Abibiarar8I8I4mc79zbi65ar8I8I9z*028I8I9z9z8I8Ice7N7NaP8T5d9z9z9a8I9p9z*024m4m6l5c5A4m9sdV*029z9z9D9zd1ddbK65*0697978I5d*028s5d5d9z9J968Ica8I8X7QaE8e8e8I*03ca9D8T9a9s7a8I749z8I8Ig7eKiWcJ8mcUdBc8aQ8m8Pbpbp5M5M323Y*025T8b5E3K7q4m*025d5d5T5T98*035d*0p5K2d5U5K5T5/*045d*037Q5d*0d6d6d5d8t7e9z995d5dbf9W!!5d8I*02=!*045d7hbi=dlea7q!cV!evd64mbibi9pbfar9zbica4mbiard1bia4cabiar!9o9zarcRarcFcy==9D7q9z4m969D9y8I9u7r7c9z8t4m8K8I9A8I6Z9zb+9H88aI6+96bb90bNdd=*04bi9y96c2fF=bKddaAca9zbi8I9z74bL8hcA9yfwdVa/9za/9tarara39sbv927X6TaA9G8I4mca7v7var9zbid1bA9Hbi*02arardR9pb7ar4m4m8Ih6gDdH9ybf9Kbfbibfbi8Tb8are89Obfbf9ya+d1bicabfarbi9z9Kdmarbqa/fJfXdCfjbfb7g7bf8I9G9D6x9X8Ib57N9D9D7Q9XbA9s9z9s9z8I7G8IdH8I9D95d1dcbpdm9D8Edm97=8I9z=8E8I4m*02f9ea9z=*029sk0cadBa/fgcsar8IeucwcFbNgRfk9O7NcFbNca9zcLa6==hwfecK9+k0e5k0cabi8I9800*06bf9Dbf9Dar9z7D6/8T6xa/9me8b59O7N9y7Q9y7Q9y7QbV9Lbi9sdLbahCepbi92bi8I9z7G8I*03ar8IdlaNa/95a/95a/9zdoaCdoaC4m==a+9ma+9Xbi9sbi9sa/95d1bA4m=*03fEdV==bm8I=*059O8e=*05ca9z=*0b8T6x==8T6xar8Iar8I=*0I4m*02=*1F8I=5d5dbb9u=*0E4m*02=*0ddlb7dlb7dlb7dlb7dlb7=*03c+bkc+bkc+bkc+bkc+bk=*07d8819X9ub1ac7QfE8IfE5d3W2D8I4m381j00*04!5d8I8IfEfE7O8E4m*037Q*038I8I5u!*02fE!*0200*0438fE!3M7v7v!*035d5d!9s9z5d!*042D!*0o5d3u00*04!00*095d!*025d*05!*046c!*0f5V5U6q5K5U!*0a8Ibibi8I8IdVbih6j9eMcO818Ibi9zg+8Iarcabiarbi8Kar9z8I9j!*0k00*0w!*0jdR!*0c7F!!hrbx!*09fE!*02c0!*069o!*0tfE7Q!*03d2d2!*05d2*03!*0A8I!*0afE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b998!!2D!*024m8B!*02b9fj!*08bi!4i!*0r8B!*0m8B97!!8B8B!*2p"
		},
		{
			name: "Times New Roman",
			lineHeight: 1149.90234375,
			regular: "3W5d6o7Q7Qd1ca2Q5d5d7Q8Q3W5d3W4m7Q*094m4m8Q*026Yepbiararbi9z8Ibibi5d65bi9zdVbibi8Ibiar8I9zbibieMbibi9z5d4m5d7l7Q5d6Y7Q6Y7Q6Y5d7Q7Q4m4m7Q4mca7Q*035d654m7Q7Qbi7Q7Q6Y7w387w8t3W5d7Q*03387Q5dbU4k7Q8Q5dbU7Q6g8B4I4I5d90755d5d4I4S7QbK*026Y=bi*04dV==9z*02=5d*02bi*068Qbi*058I7Q=6Y*04ar=6Y*03=4m*027Q*068B7Q*07=*0ea6bi7Q=*0jbi7Q=*084mb48E=*037Q=*046m9z5o9z4m=*059sa+7L=*05dVbi=*0g6H9z4m=*0dbi=*074m7QbU8+7Q8+7Qarar6YbicL8+7Q7n9zbi7R8I7Qbibic23Z5dbi7Q4m7BcMbi7Qbibi8hetaPaa7Q8I8I65965o4m9z4m9zc88ubDbicd7Q9z6Y8r8r6Y6Y7Q7Q6X6C7Q384p3V5dkRieeMfEdV8IhnfEca=*0f6Y=*05bi7Q=*086Y=kRieeM==eS8M=*0z8P6b==aa7Q9s7Q9z6Y=*0d4m7Q4Z4mc6c4biar7Q9z9z656Y8m6darbibl9z6Y654ma+7Qar5dbi7Q6Y8b8b7Q6Y6Y7Q7Q6Y6Y9P6A6A9c6X5d7Q7Q757Q6Y7Q*024m4d4m*0392ca*027Q7Q7N7Q9Sai8F5d*067E7E655d5d6Q5d4m4m7Q8B7m7Qbi7Q7J6Y7M6Y*05bi7o6X758n4m7Q6K7Q6Y6Ycydddl8R7ca9ck8S8M827x9N9E51512r3p*024B6I4F3r5J5d*043U3U8Q*035d*094m4m5d*0c5+4B2C3k4x3U5/*045d*036Y5d*084m5d*036d6d5d8E6t9z6R5d5dbi8u!!5d6Y*02=65!*035d5dbi4maScE6r!bi!cMbD4dbiar92a39z9zbibi5dbibldVbia3bibi8I!969zbibrbibybD==8c6A8b4d7L8c7Z6W7n6A6u8b7v4d7U7B8o746+7Q7V7P6c8r6i7L916Y9Oai=*04ak7Z7LbidW=8eai8Mbi7Qar6A8I6/9073br8GcYca9E89al6Y8u8uag95aX7Z7r628M7Z6Y4mbi6l6l8I7QardV9V7Par*029z9zbM92ak8I5d5d65dEdEbBarbib4bibi8+ar92aG9ze07RbibiaraCdVbi*028Iar9zb4cmbibiaafNfNb2dE8+akg4ar6Y7Z7o6q7Z6YaP6b8n8n7C7P9V8n7Q8n7Q6Y6R7Qa87Q8n7Tc2c285aw786JbH7c=6Y7z=6J654m*02bnbj7Q=*028nik9Vav8vf8aBbi9eg9d2e0aPiUeD7R6bby9Obi7QcJ9d==h7dMbX8SiZcoik9Var6Y5e00*06bi8n8+7m8I7Q725v926q9T83e0aP7R6bar7Car7Car7Cci8Zbi8ndj9Lg8clar6Yar6Y9z6Rbi7Qbi7Qbi7Qct9raa7Taa7Taa7QdK8ydK8y5d==ar83aC7Pbi8nbi8naa7TdV9V4m=*03dVar==bi6Y=*057R6Y=*05bi7Q=*0b926q==926qbi7Qbi7Q=*29bi=*0e6Y=5d5db97n=*0W8h=8h=8h=8h=8h=*03c88uc88uc88uc88uc88u=*07dn8f8t7Mab8B7QfE7QfE5d3W2D7Q3W381j00*045d5d7Q7QfEfE4p7Q5d*036Y*037Q7Q5u5u5daqfE3W!!00*0438fEkJ3r6x6x3q6w6w4U5d5dfE8Z6Y5deZeZ56eH5d2D5d5ddkayat7E75*027Q4meZ7Q7Q8teZ7Q7P8I9D9/4hdP9/4h4m3u00*04!00*094I2C!!4I*055i*0237374X4I*095i*023737!4h404w4y404I4I2C7j4I4I3F2C!*029Farar7Q7Qcabif9heeMc8817Qbi9zfE7Q8Ibibi8Iar7Q7Q9z7Q7QaHbc7QbTar!*0f00*0w!*0ed2cHarg09zd1dK7Rareh7+eafsbi7Q7QaM8Fb47vcabieWbxbA8Ibievcrar*02ebiKfkbi9z6Yc0bDaW4d=bieva69o619DaM8Ihs6m9g8L6s8356ekiq8B6W92bib9ca8I8Iarbi7Q6Y4m4m9Xcac9dO6xgsbKbKfSbK*0b7g5da6f0gsbigolhqagtbigolh9zarbidV4m8cc3bz7QbVfMjDb+7QbTfK4m6Y7QcahBbihBar6YbsaMbihBbK7Q7Q!*03fE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b98Q!!2D!*023W8B!*02b9fj!*08bi!4i!*0r8B!*0m8B8Q!!8B8B!*2p",
			bold: "3W5d8H7Q7QfEd14m5d5d7Q8W3W5d3W4m7Q*095d5d8W*027Qeybiarbibiar9zcaca657QcaareMbica9zcabi8IarbibifEbibiar5d4m5d957Q5d7Q8I6Y8I6Y5d7Q8I4m5d8I4md18I7Q8I8I6Y655d8I7Qbi7Q7Q6Y6a3s6a883W5d7Q*033s7Q5dbH4I7Q8W5dbH7Q6g8B4I4I5d908s5d5d4I5a7QbK*027Q=bi*04fE==ar*02=65*02bibi=ca*038Wca=bi*039z8I=7Q*04bi=6Y*03=4m*027Q==7Q*038B7Q=8I*02=8I=*0fbtbi8I=*0jca8I=*084mcT8E=*038I=*047lar6car4m=*05bpc18I=*05fEbibi=*0f89ar5d=*0dbi=*074m8IbPal8Ial8Ibibi6YbicMal8I87arbz8g9z7Qcabice4P65ca8I4m7HeIbi8Icaca8Ggwc3aS8I9z8I65ae815dar5darcs9ocxaccn7Qar6Y96967a757Q7U615d9k3s544n5dlJiefEiffE9zj6gvdV=*0f6Y=*05ca7Q=*087a=lJiefE==faa6=*0v8I=*028G5S==bu8IaA7Rar6Y=*0d4m8I5F5dcTcTbibi7Qarar656Y8k7iarbibdar6Y7Q5dcV8Ibi6Ybi7Q7Q8/8/8I6Y6Y8I8I6Y6Y9P6H6H9h795d8D8D9f7Q868I*024m4S4w4m*029vd1*028I8I8b7QbTbrbi6Y*046h6h8/8/654K5d5v4/5d5d8I9F8b7Qbi7Q8l6Y817a7a6Y*027Oca8s799f905d8I7X8I6Y6YdtdEeya88pb4dh9K9k807xarar55552R3+3+4a5s6M4H4p7M5d*043X3X8W*035d*094m4m5d*0c5+4H2N3p4u3X5/*045d*037Q5d*0d6d6d5d9w7vaU8a5d5dca94!!5d6Y*02=7Q!*035d5dbi=cved8a!ca!dxcx4Sbiar9Y9Pararcaca65cabdeMbiaBcaca9z!aearbicZbicccx==8K6H8U4S878K8f7k876H6t8U8a4S8H7H8T6/6+7Q8A8n6C8w7d879M7eaMbr=*04ca8f9nbier=9Mbr94ca7Qbi6C9z8y9j7dbL8GdCd1bl9abA6Y9N9aaG9tbl848s72947Q6Y5dca6B6B9z8IbieMaF8nbi*02ararcw9YaC8I65657QfHfGcwblcabucabialar9YaMarft8gcacablbFeMca*029zbiarbudrbicabuhahabZfmalaChCbi7Q7Q8s767W6Ybl6i90*028NaF907Q908I6Y7H7QaQ7Q908Qdcdc97cd8h6MbY8t=6Y8p=6M654m4m5dccct8I=90=90jy9HbY9ofLaobi7Qhac5ftbllgfD8g6iccaMca7QcL9t==hQeocU99jkcEjy9Hbi6Y5i00*06ca90al8h9z8I88659Y76bi91ftbl8g6ibl90bl90bl90cZ9Sca90eparhrdcbp8mbi6Yar7Hbi7Qbi7Qbi7Qdz9xbu8Qbu8Qbu8IdM8QdM8Q65==bx9hbF8Nca90ca90bu8QeMaF4m=*03fEbi==bz6Y=*058g7a=*05ca7Q=*0b9Y76==9Y76bi7Qbi7Q=*29bi=*0e7Q=5d5dbS87=*0W8G=8G=8G=8G=8G=*03cs9ocs9ocs9ocs9ocs9o=*07fk8D8L7Mab8r7QfE7QfE5d3W2D7Q3W381j00*045d5d7Q7QfEfE547Q5d*037Q*055u5u5darfE3W!!00*0438fEkQ4p8E8E4p7M8E4U5d5dfE9s7Q5deZeZ5ueH5d2D5d5deAbPbL7E8s7K7K7Q5deZ7Q8W8veZ7Q8+bxadad5dgkad5d5d3u00*04!00*094I2C!!4I*0837375s4I*0c3737!4A434v4u43555g2N7I5d553p3k!*029Zbibi7Q7Qd1bif9iZfEbS817Qcaarht7Q9zcabi8Ibi8H8Iar7Q7Qa+cm7QbEar!*0f00*0w!*0ed1d1bigWbad1dT8CaCfi7+eafsca8I8IaM8Fb45TdtbifJbHbA9zcaevcrbi*02eSiPfEbiar7ac0cxb94S==eva69o619DaM9zhs6ma88Q738X56e6jn8A7k9Ycabpca9z9zarbi7Q6Y4m4ma+d1dQem7vlrbKbKfSbK*0b7b65bZhRhobihlndt5hpbihpngarbibieM4m8Gc+bT7QcagukOc57Qc3gn4m6Y8Id1gNbigNbi6YbKaMbigNbK7Q7Q!*03fE7QfE7QfE7Q!*0h7Q!*1o7K!*029A!*07cT!b98W!!2D!*023W8B!*02b9fj!*08bf!4i!*0r8B!*0m8B8W!!8B8B!*2p"
		},
		{
			name: "Courier New",
			lineHeight: 1132.8125,
			regular: "9o*4X!*0e9o*2G!9o*09!*0d9o*27!*059o*06!*069o*0j!*03=9o!*039o!*02=!*049o*06!9o!9o*0j!9o*0H!9o*0I!*049o*2000*069o*14!=9o*0E!*05=9o*2k!=9o*03!*03=9o*1o!*057QfE7QfE5d3W2D8G3d2D0U00*04!9o*04!9o*0b!*029o!*0200*04389o!9o*02!*039o9o!9o!9o!*049o!*0o9o3u00*04!00*09!*0e9o!*0f9o*04!*0a9o*0l!*0p00*0w!*0j9o!*0c9o!!9o!*0a9o!*02=!*069o!*0z9o9o!*059o*03!*0M9o*05!*0h9o!*1o9o!*029o!*079o!9o9o!!9o!*029o9o!*029o9o!*089o!9o!*0r9o!*0m=9o!!9o9o!*2p",
			bold: "9o*4X!*0e9o*2G!9o*09!*0d9o*27!*059o*06!*069o*0j!*03=9o!*039o!*02=!*049o*06!9o!9o*0j!9o*0H!9o*0I!*049o*2000*069o*14!=9o*0E!*05=9o*2k!=9o*03!*03=9o*1o!*057QfE88fY5k3/2G8G3d2D0U00*04!9o*04!9o*0b!*029o!*0200*04389o!9o*02!*039o9o!9o!9o!*049o!*0o9o3u00*04!00*09!*0e9o!*0f9o*04!*0a9o*0l!*0p00*0w!*0j9o!*0c9o!!9o!*0a9o!*02=!*069o!*0z9o9o!*059o*03!*0M9o*05!*0h9o!*1o9o!*029o!*079o!9o9o!!9o!*029o9o!*029o9o!*089o!9o!*0r9o!*0m=9o!!9o9o!*2p"
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
	var CHARACTERS = FONT_WIDTH_RANGES.flatMap(([first, last]) => Array.from({ length: last - first + 1 }, (_, offset) => first + offset));
	var CHARACTER_INDEX = new Map(CHARACTERS.map((code, index) => [code, index]));
	var AVERAGE_LETTERS = [..."abcdefghijklmnopqrstuvwxyz"].map((letter) => CHARACTER_INDEX.get(letter.codePointAt(0)));
	var DIGITS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/";
	var decoded = /* @__PURE__ */ new Map();
	/**
	* Reads the widths of a font's face, as {@link FontWidths} writes them: the width of each character of the tables, in
	* thousandths of an em, or undefined where its width in Word isn't known.
	*/
	var decodeWidths = (encoded) => {
		const known = decoded.get(encoded);
		if (known) return known;
		const twoDigitsAt = (at) => DIGITS.indexOf(encoded[at]) * 64 + DIGITS.indexOf(encoded[at + 1]);
		const widths = [];
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
				const width = encoded[token] === "!" ? void 0 : encoded[token] === "=" ? widths[CHARACTER_INDEX.get(String.fromCodePoint(code).normalize("NFD").codePointAt(0))] : twoDigitsAt(token);
				widths.push(width);
			}
		}
		decoded.set(encoded, widths);
		return widths;
	};
	var EAST_ASIAN_FONTS = [
		{
			name: "MS Mincho",
			aliases: ["ＭＳ 明朝", "MS 明朝"],
			lineHeight: 1297,
			monospaced: true,
			latin: "Times New Roman"
		},
		{
			name: "MS Gothic",
			aliases: ["ＭＳ ゴシック", "MS ゴシック"],
			lineHeight: 1297,
			monospaced: true,
			latin: "Arial"
		},
		{
			name: "MS PMincho",
			aliases: ["ＭＳ Ｐ明朝", "MS P明朝"],
			lineHeight: 1297,
			latin: "Times New Roman"
		},
		{
			name: "MS PGothic",
			aliases: ["ＭＳ Ｐゴシック", "MS Pゴシック"],
			lineHeight: 1297,
			latin: "Arial"
		},
		{
			name: "Yu Mincho",
			aliases: ["游明朝"],
			lineHeight: 1433,
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
			latin: "Arial"
		},
		{
			name: "Meiryo",
			aliases: ["メイリオ"],
			lineHeight: 1950,
			latin: "Arial"
		},
		{
			name: "SimSun",
			aliases: ["宋体"],
			lineHeight: 1297,
			monospaced: true,
			latin: "Times New Roman"
		},
		{
			name: "NSimSun",
			aliases: ["新宋体"],
			lineHeight: 1296,
			monospaced: true,
			latin: "Times New Roman"
		},
		{
			name: "SimHei",
			aliases: ["黑体"],
			lineHeight: 1297,
			monospaced: true,
			latin: "Arial"
		},
		{
			name: "KaiTi",
			aliases: ["楷体"],
			lineHeight: 1297,
			monospaced: true,
			latin: "Times New Roman"
		},
		{
			name: "FangSong",
			aliases: ["仿宋"],
			lineHeight: 1297,
			monospaced: true,
			latin: "Times New Roman"
		},
		{
			name: "Microsoft YaHei",
			aliases: ["微软雅黑"],
			lineHeight: 1714,
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
			latin: "Arial"
		},
		{
			name: "PMingLiU",
			aliases: ["新細明體"],
			lineHeight: 1300,
			latin: "Times New Roman"
		},
		{
			name: "MingLiU",
			aliases: ["細明體"],
			lineHeight: 1301,
			monospaced: true,
			latin: "Times New Roman"
		},
		{
			name: "Microsoft JhengHei",
			aliases: ["微軟正黑體"],
			lineHeight: 1730,
			latin: "Arial"
		},
		{
			name: "Malgun Gothic",
			aliases: ["맑은 고딕"],
			lineHeight: 1730,
			latin: "Arial"
		},
		{
			name: "Batang",
			aliases: ["바탕"],
			lineHeight: 1300,
			latin: "Times New Roman"
		},
		{
			name: "Gulim",
			aliases: ["굴림"],
			lineHeight: 1301,
			latin: "Arial"
		},
		{
			name: "Dotum",
			aliases: ["돋움"],
			lineHeight: 1301,
			latin: "Arial"
		}
	];
	var EAST_ASIAN_NAME = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]|hiragino|cjk|source han|pingfang|songti|heiti|kaiti|fangsong|mincho|mingliu|simhei|gungsuh|nanum/i;
	var EAST_ASIAN_SANS = /gothic|ゴシック|hei|黑|黒|sans|고딕|pingfang/i;
	/**
	* The East Asian font a font is, or is measured as, by its name. Undefined for other fonts.
	*/
	var eastAsianFontOf = (font) => {
		const name = font.toLowerCase();
		const known = EAST_ASIAN_FONTS.find((candidate) => [candidate.name, ...candidate.aliases].some((alias) => alias.toLowerCase() === name));
		const similar = EAST_ASIAN_SANS.test(font) ? "MS Gothic" : "MS Mincho";
		return known !== null && known !== void 0 ? known : EAST_ASIAN_NAME.test(font) ? EAST_ASIAN_FONTS.find((candidate) => candidate.name === similar) : void 0;
	};
	/** Whether a font is one for Chinese, Japanese or Korean text */
	var isEastAsianFont = (font) => font !== void 0 && eastAsianFontOf(font) !== void 0;
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
	/** The widths of the face text is in: its font's, bold or not */
	var faceOf = ({ font, bold }) => {
		const { regular, bold: heavy } = widthsOf(font);
		return decodeWidths(bold ? heavy : regular);
	};
	var isWide = (code) => code >= 4352 && code <= 4447 || code >= 11904 && code <= 42191 || code >= 44032 && code <= 55203 || code >= 63744 && code <= 64255 || code >= 65072 && code <= 65103 || code >= 65280 && code <= 65376 || code >= 65504 && code <= 65510 || code >= 127744;
	var isHalfWidth = (code) => code >= 65377 && code <= 65500;
	var takesNoRoom = (character) => new RegExp("[\\p{Mn}\\p{Me}\\p{Cf}]", "u").test(character);
	/**
	* The width of a character in thousandths of an em. Characters that aren't in the table are as wide as an average
	* lowercase letter, a whole em for wide characters and half an em for half-width ones, and marks take no space. So are
	* those the table has, but whose width in the font isn't known.
	*/
	var characterWidth = (widths, character) => {
		const code = character.codePointAt(0);
		const index = CHARACTER_INDEX.get(code);
		const width = index === void 0 ? void 0 : widths[index];
		if (width !== void 0) return width;
		if (isWide(code)) return 1e3;
		if (isHalfWidth(code)) return 500;
		return takesNoRoom(character) ? 0 : AVERAGE_LETTERS.reduce((total, letter) => total + widths[letter], 0) / AVERAGE_LETTERS.length;
	};
	var isPrivate = (code) => code >= 57344 && code <= 63743;
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
	var sizeOf = ({ size = 10 }) => size;
	/**
	* How a font's characters are measured: an East Asian font's Latin letters with the widths of the font in the table they
	* are measured as, or all of a monospaced one's as half an em or an em, and other fonts with their own widths, or those of
	* the most similar font in the table
	*/
	var measuresOf = (font) => {
		var _font$font, _eastAsian$latin;
		const eastAsian = eastAsianFontOf((_font$font = font.font) !== null && _font$font !== void 0 ? _font$font : DEFAULT_FONT);
		return {
			widths: faceOf(_objectSpread2(_objectSpread2({}, font), {}, { font: (_eastAsian$latin = eastAsian === null || eastAsian === void 0 ? void 0 : eastAsian.latin) !== null && _eastAsian$latin !== void 0 ? _eastAsian$latin : font.font })),
			monospaced: (eastAsian === null || eastAsian === void 0 ? void 0 : eastAsian.monospaced) === true
		};
	};
	/**
	* The first character of text whose width in its font isn't known, so isn't what Word lays out: one of the tables'
	* characters that Word draws in another font when the font doesn't have it, or whose width Word's PDF doesn't show, or a
	* symbol font's own character. Undefined when the widths of all of them are known, or are measured as before: those of
	* characters the tables don't have, as an average letter.
	*/
	var unknownCharacter = (text, font = {}) => {
		const { widths, monospaced } = measuresOf(font);
		return [...text].find((character) => {
			const code = character.codePointAt(0);
			const index = CHARACTER_INDEX.get(code);
			return index === void 0 || monospaced ? isPrivate(code) : widths[index] === void 0;
		});
	};
	/**
	* How wide a line of text is, in points. Tabs move to the next half inch, counted from the start of the line.
	*
	* @param start - Where the text starts on its line, in points
	*/
	var measureTextWidth = (text, font = {}, start = 0) => {
		const { widths, monospaced } = measuresOf(font);
		const widthOf = monospaced ? monospacedWidth : (character) => characterWidth(widths, character);
		const size = sizeOf(font);
		const { characterSpacing = 0, scale = 100 } = font;
		return [...text].reduce((position, character) => character === "	" ? (Math.floor(position / TAB_STOP$1) + 1) * TAB_STOP$1 : position + widthOf(character) * size * scale / 1e5 + characterSpacing, start) - start;
	};
	/**
	* How tall a line of single-spaced text is, in points.
	*/
	var measureLineHeight = (font = {}) => {
		var _eastAsianFontOf, _font$font2;
		return ((_eastAsianFontOf = eastAsianFontOf((_font$font2 = font.font) !== null && _font$font2 !== void 0 ? _font$font2 : "Times New Roman")) !== null && _eastAsianFontOf !== void 0 ? _eastAsianFontOf : widthsOf(font.font)).lineHeight * sizeOf(font) / 1e3;
	};
	//#endregion
	//#region src/text-layout/line-break-rules.ts
	var WORD_LISTS = {
		japanese: {
			noLineStart: "!%),.:;?]}¢°’”‰′″℃、。々〉》」』】〕゛゜ゝゞ・ヽヾ！％），．：；？］｝｡｣､･ﾞﾟ￠",
			noLineEnd: "$([\\{£¥‘“〈《「『【〔＄（［｛｢￡￥"
		},
		simplifiedChinese: {
			noLineStart: "!%),.:;?]}¢°·ˇˉ―‖’”…‰′″›℃∶、。〃〉》」』】〕〗〞︶︺︾﹀﹄﹚﹜﹞！＂％＇），．：；？］｀｜｝～￠",
			noLineEnd: "$([{£¥·‘“〈《「『【〔〖〝﹙﹛﹝＄（．［｛￡￥"
		},
		traditionalChinese: {
			noLineStart: "!),.:;?]}¢·’”•‥…‧′﹏﹐﹑﹒﹔﹕﹖﹗﹚﹜﹞！），．：；？］｝｜、。〉》」』】〕〞︰︱︳︴︶︸︺︼︾﹀﹂﹄､",
			noLineEnd: "([{£¥‘“‵〈《「『【〔〝﹙﹛﹝（｛"
		},
		korean: {
			noLineStart: "",
			noLineEnd: ""
		}
	};
	var EAST_ASIAN = new RegExp("[\\u1100-\\u11ff\\u2e80-\\u2fff\\u3000-\\u30ff\\u3130-\\u318f\\u31c0-\\u33ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\ua960-\\ua97f\\uac00-\\ud7ff\\uf900-\\ufaff\\ufe30-\\ufe4f\\uff00-\\uffef\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}\\p{Script=Hangul}]", "u");
	var HANGUL = new RegExp("\\p{Script=Hangul}", "u");
	var DASHES = /* @__PURE__ */ new Set([
		"-",
		"‐",
		"–",
		"—"
	]);
	var GLUE = /* @__PURE__ */ new Set([
		"\xA0",
		" ",
		" ",
		"⁠",
		"﻿"
	]);
	var isExtender = (character) => {
		const code = character.codePointAt(0);
		return new RegExp("\\p{M}", "u").test(character) || code === 8205 || code >= 65024 && code <= 65039 || code >= 127995 && code <= 127999 || code >= 917536 && code <= 917631;
	};
	var ZERO_WIDTH_SPACE = "​";
	/** Whether a character is Chinese, Japanese or Korean, or East Asian punctuation, which Word draws in a run's East Asian font */
	var isEastAsian = (character) => EAST_ASIAN.test(character);
	/** Whether a line can break before and after a character: Chinese and Japanese characters, but not Korean */
	var breaksAround = (character) => EAST_ASIAN.test(character) && !HANGUL.test(character);
	/** Whether a character belongs to the one before it, so a line never breaks between them */
	var extendsCharacter = isExtender;
	/** Whether a character joins the one after it to the one before it, as the zero-width joiner joins emoji */
	var joinsNext = (character) => character === "‍";
	/**
	* The list of Word's for a language, by its tag, such as `"zh-TW"`. Text in another language, or with none, has none: Word
	* lets any character start or end its lines.
	*/
	var kinsokuLanguageOf = (language) => {
		const tag = (language !== null && language !== void 0 ? language : "").toLowerCase();
		if (tag.startsWith("zh")) return /^zh-(tw|hk|mo|hant)/.test(tag) ? "traditionalChinese" : "simplifiedChinese";
		if (tag.startsWith("ja")) return "japanese";
		return tag.startsWith("ko") ? "korean" : void 0;
	};
	var NO_KINSOKU = {
		noLineStart: /* @__PURE__ */ new Set(),
		noLineEnd: /* @__PURE__ */ new Set()
	};
	var listOf = (language, { lists = {} }) => {
		var _lists$language;
		const { noLineStart = WORD_LISTS[language].noLineStart, noLineEnd = WORD_LISTS[language].noLineEnd } = (_lists$language = lists[language]) !== null && _lists$language !== void 0 ? _lists$language : {};
		return {
			noLineStart: new Set(noLineStart),
			noLineEnd: new Set(noLineEnd)
		};
	};
	/**
	* Where a line can break inside text that has no spaces in it: before which of its characters, by their index, counted
	* in characters rather than UTF-16 code units. A line can always break after spaces, which aren't in it.
	*
	* @param pieces - The text's pieces, with the language of their runs
	*/
	var findLineBreaks = (pieces, rules = {}) => {
		var _rules$kinsoku;
		const anywhere = rules.wordWrap === false && pieces.some(({ eastAsian }) => eastAsian);
		const text = pieces.map((piece) => piece.text).join("");
		if (!anywhere && ![...text].some((character) => character.codePointAt(0) > 767) && !text.includes("-")) return /* @__PURE__ */ new Set();
		const characters = pieces.flatMap(({ text: piece }) => [...piece]);
		const runs = pieces.flatMap(({ text: piece, language, eastAsian }) => [...piece].map(() => ({
			language: kinsokuLanguageOf(language),
			anywhere: rules.wordWrap === false && eastAsian === true
		})));
		const kinsoku = (_rules$kinsoku = rules.kinsoku) !== null && _rules$kinsoku !== void 0 ? _rules$kinsoku : true;
		const lists = /* @__PURE__ */ new Map([[void 0, NO_KINSOKU]]);
		const listAt = (index) => {
			const { language } = runs[index];
			if (!lists.has(language)) lists.set(language, listOf(language, rules));
			return lists.get(language);
		};
		const breaks = /* @__PURE__ */ new Set();
		for (let index = 1; index < characters.length; index++) {
			const before = characters[index - 1];
			const after = characters[index];
			if (isExtender(after) || joinsNext(before) || GLUE.has(before) || GLUE.has(after)) continue;
			if ((before === ZERO_WIDTH_SPACE || DASHES.has(before) && !/[\d-]/.test(after) || breaksAround(before) || breaksAround(after) || runs[index - 1].anywhere && runs[index].anywhere) && !(kinsoku && (listAt(index).noLineStart.has(after) || listAt(index - 1).noLineEnd.has(before)))) breaks.add(index);
		}
		return breaks;
	};
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
		var _ref, _ref2, _themeFontOf, _themeFontOf2, _themeFontOf3;
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
			scale: numberOf(attributesOf(find(children, "w:w"))["w:val"]),
			eastAsiaFont: (_themeFontOf2 = themeFontOf(fonts["w:eastAsiaTheme"], themeFonts)) !== null && _themeFontOf2 !== void 0 ? _themeFontOf2 : stringOf(fonts["w:eastAsia"]),
			complexScriptFont: (_themeFontOf3 = themeFontOf(fonts["w:cstheme"], themeFonts)) !== null && _themeFontOf3 !== void 0 ? _themeFontOf3 : stringOf(fonts["w:cs"]),
			complexScriptSize: scaled(numberOf(attributesOf(find(children, "w:szCs"))["w:val"]), 2),
			complexScriptBold: onOff(children, "w:bCs"),
			rightToLeft: onOff(children, "w:rtl"),
			complexScript: onOff(children, "w:cs"),
			eastAsianLanguage: stringOf(attributesOf(find(children, "w:lang"))["w:eastAsia"])
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
			tabs: readTabs(find(children, "w:tabs")),
			kinsoku: onOff(children, "w:kinsoku"),
			wordWrap: onOff(children, "w:wordWrap")
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
			const numbering = childrenOf(find(childrenOf(find(children, "w:pPr")), "w:numPr"));
			const list = attributesOf(find(numbering, "w:numId"))["w:val"];
			const level = numberOf(attributesOf(find(numbering, "w:ilvl"))["w:val"]);
			const name = valueOf(children, "w:name");
			return {
				id: stringOf(attributes["w:styleId"]),
				isDefault: attributes["w:default"] !== void 0 && !isOff(attributes["w:default"]),
				definition: _objectSpread2(_objectSpread2(_objectSpread2({ type: (_stringOf = stringOf(attributes["w:type"])) !== null && _stringOf !== void 0 ? _stringOf : "paragraph" }, name === void 0 ? {} : { name }), {}, { basedOn: valueOf(children, "w:basedOn") }, list === void 0 && level === void 0 ? {} : { numbering: withoutUndefined({
					id: list === void 0 ? void 0 : String(list),
					level
				}) }), {}, {
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
	* Which of a run's fonts Word draws a character in: the font for complex scripts, in their size and boldness, for all of a
	* run that is right to left or of a complex script; the East Asian font for Chinese, Japanese and Korean; the run's font
	* for the rest. Hebrew in a run that isn't right to left is in the run's size, as Word lays it out. A mark is drawn in the
	* font of the character it is on.
	*/
	var slotOf = (character, previous, complexRun) => {
		if (complexRun) return "complex";
		if (isEastAsian(character)) return "eastAsian";
		return new RegExp("\\p{M}", "u").test(character) ? previous : "latin";
	};
	var FALLBACK_EAST_ASIAN_FONT = "MS Mincho";
	/**
	* The font of a character of a run, by the run's font Word draws it in. Complex scripts have their own size and boldness,
	* and Word's defaults where the run doesn't give them.
	*/
	var fontOfSlot = (format, slot) => {
		const font = fontOf(format);
		if (slot === "latin") return font;
		const { eastAsiaFont, complexScriptFont, complexScriptSize, complexScriptBold } = format;
		return slot === "eastAsian" ? _objectSpread2(_objectSpread2({}, font), {}, { font: isEastAsianFont(eastAsiaFont) ? eastAsiaFont : FALLBACK_EAST_ASIAN_FONT }) : withoutUndefined(_objectSpread2(_objectSpread2({}, font), {}, {
			font: complexScriptFont,
			size: complexScriptSize,
			bold: complexScriptBold
		}));
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
			var _font$size;
			const font = fontOfSlot(format, slot);
			if (allCaps || !smallCaps) return [_objectSpread2(_objectSpread2({}, font), {}, { text: allCaps ? part.toUpperCase() : part })];
			const small = _objectSpread2(_objectSpread2({}, font), {}, { size: ((_font$size = font.size) !== null && _font$size !== void 0 ? _font$size : 10) * SMALL_CAPS_SCALE });
			return part.split(new RegExp("(\\p{Ll}+)", "u")).filter((piece) => piece.length > 0).map((piece) => new RegExp("^\\p{Ll}", "u").test(piece) ? _objectSpread2(_objectSpread2({}, small), {}, { text: piece.toUpperCase() }) : _objectSpread2(_objectSpread2({}, font), {}, { text: piece }));
		});
	};
	/**
	* Whether a run is East Asian, by its East Asian font or language, so its words break anywhere with word wrap off, as
	* Word breaks them.
	*/
	var isEastAsianRun = ({ eastAsiaFont, eastAsianLanguage }) => isEastAsianFont(eastAsiaFont) || kinsokuLanguageOf(eastAsianLanguage) !== void 0;
	//#endregion
	//#region src/text-layout/line-breaking.ts
	/**
	* Breaks a paragraph into lines as Word breaks it, for laying out pages: where each line wraps, how tall it is, and
	* which bookmarks start on it.
	*
	* Lines break at spaces, and at en, em, four-per-em and ideographic spaces, after hyphens, between Chinese, Japanese and
	* Korean characters, and between the words of Thai and the other scripts without spaces, as {@link findLineBreaks} finds.
	* Tabs move to the paragraph's tab stops, or to the document's default ones. Each line is as tall as the tallest text or
	* picture on it, with the paragraph's line spacing.
	*
	* @module
	*/
	var DEFAULT_MEASURER = {
		measureWidth: (text, font) => measureTextWidth(text, font),
		measureLineHeight,
		unknownCharacter
	};
	var DEFAULT_TAB_STOP = 36;
	var TOLERANCE$1 = .01;
	var SPACES = /* @__PURE__ */ new Set([
		" ",
		" ",
		" ",
		" ",
		"　"
	]);
	/**
	* Turns text next to each other into words and the spaces between them. Pieces of words next to each other in different
	* fonts are one word, unless the line can break between them.
	*/
	var tokenizeText = (items, rules) => {
		const breaks = findLineBreaks(items, rules);
		const tokens = [];
		let index = 0;
		for (const { text, font } of items) for (const character of text) {
			const type = SPACES.has(character) ? "space" : "word";
			const last = tokens[tokens.length - 1];
			if ((last === null || last === void 0 ? void 0 : last.type) !== type || type === "word" && breaks.has(index)) tokens.push({
				type,
				pieces: [{
					text: character,
					font
				}]
			});
			else {
				const piece = last.pieces[last.pieces.length - 1];
				last.pieces[last.pieces.length - 1 + (piece.font === font ? 0 : 1)] = {
					text: piece.font === font ? piece.text + character : character,
					font
				};
			}
			index++;
		}
		return tokens;
	};
	/**
	* Turns a part of a paragraph into tokens.
	*/
	var tokenize = (items, rules) => {
		const tokens = [];
		let text = [];
		for (const item of items) if (item.type === "text") text.push(item);
		else {
			tokens.push(...tokenizeText(text, rules), item);
			text = [];
		}
		return [...tokens, ...tokenizeText(text, rules)];
	};
	/**
	* Splits a paragraph's content at its breaks.
	*/
	var segmentsOf = (items, rules) => {
		const breaks = items.flatMap((item, index) => item.type === "break" ? [index] : []);
		return [0, ...breaks.map((index) => index + 1)].map((start, index) => {
			const end = breaks[index];
			return {
				tokens: tokenize(items.slice(start, end), rules),
				end: end === void 0 ? void 0 : items[end]
			};
		});
	};
	/**
	* A word's characters, each with the marks on it and anything a zero-width joiner joins to it, which a line never breaks
	* between, in the pieces of the fonts they are in.
	*/
	var charactersOf = (pieces) => pieces.reduce((all, { text, font }) => [...text].reduce((characters, character) => {
		const last = characters[characters.length - 1];
		const lastPiece = last === null || last === void 0 ? void 0 : last[last.length - 1];
		if (!lastPiece || !(extendsCharacter(character) || joinsNext([...lastPiece.text].pop()))) return [...characters, [{
			text: character,
			font
		}]];
		const joined = lastPiece.font === font ? [...last.slice(0, -1), {
			text: `${lastPiece.text}${character}`,
			font
		}] : [...last, {
			text: character,
			font
		}];
		return [...characters.slice(0, -1), joined];
	}, all), []);
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
	/** The rules for where a paragraph's lines break: the document's, with the paragraph's own */
	var rulesOf = ({ kinsoku, wordWrap }, rules = {}) => _objectSpread2(_objectSpread2(_objectSpread2({}, rules), kinsoku === void 0 ? {} : { kinsoku }), wordWrap === void 0 ? {} : { wordWrap });
	/**
	* Measures how narrow and how wide a paragraph can be, which Word sizes the columns of tables whose cells have no widths
	* by. Spaces at the end of a line take no room, as they don't when it wraps.
	*
	* @param items - The paragraph's content, in order
	*/
	var measureContentWidths = (items, { format = {}, tabStops = [], defaultTabStop = DEFAULT_TAB_STOP, measurer = DEFAULT_MEASURER, breakRules }) => {
		const { indentLeft = 0, indentRight = 0, firstLineIndent = 0 } = format;
		const { stops, firstLineStops } = stopsOf(tabStops, format);
		return segmentsOf(items, rulesOf(format, breakRules)).reduce((widths, { tokens }, segmentIndex) => {
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
	var layoutLines = (items, { width, format = {}, tabStops = [], defaultTabStop = DEFAULT_TAB_STOP, markFont = {}, measurer = DEFAULT_MEASURER, breakRules }) => {
		const { indentLeft = 0, indentRight = 0, firstLineIndent = 0, lineSpacing } = format;
		const markHeight = measurer.measureLineHeight(markFont);
		const { stops, firstLineStops } = stopsOf(tabStops, format);
		const parts = segmentsOf(items, rulesOf(format, breakRules));
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
				if (token.type === "word" && line.position + tokenWidth > limitOf() + TOLERANCE$1 && limitOf() - indentLeft > 0) {
					let placed = false;
					for (const character of charactersOf(token.pieces)) {
						const characterWidth = widthOf(character, measurer);
						if (placed && line.position + characterWidth > limitOf() + TOLERANCE$1 && limitOf(lines.length + 1) - indentLeft > 0) line = wrap(_objectSpread2(_objectSpread2({}, line), {}, {
							natural: Math.max(line.natural, tokenHeight),
							started: true
						}));
						line = _objectSpread2(_objectSpread2({}, line), {}, { position: line.position + characterWidth });
						placed = true;
					}
				} else line = _objectSpread2(_objectSpread2({}, line), {}, { position: line.position + tokenWidth });
				line = _objectSpread2(_objectSpread2({}, line), {}, {
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
	/** The largest of the values and the least given, without spreading them into `Math.max`, which takes too few for a long table */
	var largest = (values, least = 0) => values.reduce((most, value) => Math.max(most, value), least);
	/** How narrow and how wide the content of each cell of a table can be, with the cell's margins */
	var measureCells = (table, measure) => new Map(table.rows.flatMap(({ cells }) => cells.map((cell) => {
		const text = measure(cell.blocks);
		const margins = cell.marginLeft + cell.marginRight;
		return [cell, {
			min: text.min + margins,
			max: text.max + margins
		}];
	})));
	/**
	* Sizes the columns of a table to their text, as Word does (`word-probes.docx` U1), before they are fitted to the room. A
	* column is as wide as its cells across it alone give it, or, without, as their widest line, and never narrower than
	* their widest word. A column without a cell of its own is 0 wide (U1f). Then each cell across several columns, in the
	* rows' order (U1u), shares what its widest line, or the width it gives itself (U1h), needs beyond their widths among
	* them, in proportion to those. A column given a width shares by it, and is widened with the rest (U1g). Columns that
	* are all 0 wide share it equally, which Word's probes didn't show.
	*/
	var sizeColumns = (table, content) => {
		const cells = table.rows.flatMap((row) => row.cells);
		const spanOf = (cell) => {
			var _cell$span;
			return (_cell$span = cell.span) !== null && _cell$span !== void 0 ? _cell$span : 1;
		};
		const count = largest(cells.map((cell) => cell.column + spanOf(cell)));
		const columns = Array.from({ length: count }, (_, column) => {
			const inColumn = cells.filter((cell) => cell.column === column && spanOf(cell) === 1);
			const widths = inColumn.map((cell) => content.get(cell));
			const min = largest(widths.map((cell) => cell.min));
			const own = inColumn.flatMap(({ ownWidth }) => ownWidth === void 0 ? [] : [ownWidth]);
			return {
				min,
				width: largest(own.length > 0 ? own : widths.map((cell) => cell.max), min),
				given: own.length > 0
			};
		});
		return cells.filter((cell) => spanOf(cell) > 1).reduce(({ columns: before, unsettled }, cell) => {
			const { min, max } = content.get(cell);
			const from = cell.column;
			const to = from + spanOf(cell);
			const covered = before.slice(from, to);
			const widest = sum$1(covered.map(({ width }) => width));
			const needed = cell.ownWidth === void 0 ? max : Math.max(min, cell.ownWidth);
			const sharing = covered.filter(({ width }) => width > 0).length > 1;
			const longWord = min > sum$1(covered.map((column) => column.min)) ? [min > widest && sharing ? "always" : "narrowed"] : [];
			const share = (column) => widest > 0 ? column.width / widest : 1 / covered.length;
			return {
				columns: needed > widest ? before.map((column, index) => index >= from && index < to ? _objectSpread2(_objectSpread2({}, column), {}, { width: column.width + (needed - widest) * share(column) }) : column) : before,
				unsettled: [...unsettled, ...longWord]
			};
		}, {
			columns,
			unsettled: []
		});
	};
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
	* columns, less its margins. A column is as wide as its cells across it alone give it, or, without, as their widest
	* line of text, and never narrower than their widest word. A cell across several columns widens them, in proportion to
	* their widths, where its widest line, or its own width, needs more. A table with a width of its own has its columns
	* widened in proportion to fill it. When the columns are too wide for the room, those sized to their text are narrowed
	* toward their widest words, each by its share of the width they would give up, and those given widths keep them unless
	* that isn't enough.
	*
	* Word shares a word in a cell across several columns that is wider than their widest words together in a way not yet
	* followed, when it is wider than their widest lines too, or when the columns are narrowed to the room. The table is
	* then returned as unsupported.
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
		const content = measureCells(table, measure);
		if (widen) {
			if (!rows.some(({ cells }) => cells.some((cell) => content.get(cell).min > cell.ownWidth))) return table;
			if (widen.acrossColumns) return _objectSpread2(_objectSpread2({}, table), {}, { unsupported: "a word longer than its cell in a table with cells merged across columns" });
		}
		const { columns, unsettled } = sizeColumns(table, content);
		const total = sum$1(columns.map(({ width }) => width));
		const tableWidth = fit !== null && fit !== void 0 ? fit : widen;
		const target = (_tableWidth$width = tableWidth.width) !== null && _tableWidth$width !== void 0 ? _tableWidth$width : tableWidth.share === void 0 ? void 0 : tableWidth.share * available;
		const room = target !== null && target !== void 0 ? target : available;
		if (widen) {
			if (sum$1(columns.map(({ min }) => min)) > room) return _objectSpread2(_objectSpread2({}, table), {}, { unsupported: "a word longer than its table can make room for" });
			if (target !== void 0 && total < target) return _objectSpread2(_objectSpread2({}, table), {}, { unsupported: "a long word in a table wider than its cells" });
		}
		if (unsettled.includes("always") || unsettled.length > 0 && total > room) return _objectSpread2(_objectSpread2({}, table), {}, { unsupported: "a long word in cells merged across columns" });
		const given = columns.filter((column) => column.given);
		const sized = columns.filter((column) => !column.given);
		const givenWidths = narrowed(given, room - sum$1(sized.map(({ min }) => min)));
		const sizedWidths = narrowed(sized, room - sum$1(givenWidths));
		const widths = columns.map((column) => {
			if (target !== void 0 && total < target && total > 0) return column.width * target / total;
			return column.given ? givenWidths[given.indexOf(column)] : sizedWidths[sized.indexOf(column)];
		});
		return _objectSpread2(_objectSpread2({}, table), {}, { rows: rows.map((row) => _objectSpread2(_objectSpread2({}, row), {}, { cells: row.cells.map((cell) => {
			var _cell$span2;
			return _objectSpread2(_objectSpread2({}, cell), {}, { width: sum$1(widths.slice(cell.column, cell.column + ((_cell$span2 = cell.span) !== null && _cell$span2 !== void 0 ? _cell$span2 : 1))) - cell.marginLeft - cell.marginRight });
		}) })) });
	};
	/**
	* How narrow and how wide a table in a table cell is, as Word counts it to size the cell's column (`word-probes.docx` U1n
	* to U1t): its own width in points, or, sized to its text, its columns' widest words and widest lines added up, or the
	* widths of its cells added up. Half of each of its left and right borders is outside its columns.
	*
	* @param measure - How narrow and how wide the content of a cell can be, in points
	*/
	var tableWidths = (table, measure) => {
		var _fit$width;
		const { fit, rows, borderLeft = 0, borderRight = 0 } = table;
		const borders = (borderLeft + borderRight) / 2;
		if (fit !== void 0 && fit.width === void 0) {
			const { columns } = sizeColumns(table, measureCells(table, measure));
			return {
				min: sum$1(columns.map(({ min }) => min)) + borders,
				max: sum$1(columns.map((column) => column.width)) + borders
			};
		}
		const width = (_fit$width = fit === null || fit === void 0 ? void 0 : fit.width) !== null && _fit$width !== void 0 ? _fit$width : largest(rows.map(({ cells }) => sum$1(cells.map((cell) => cell.width + cell.marginLeft + cell.marginRight))));
		return {
			min: width + borders,
			max: width + borders
		};
	};
	//#endregion
	//#region src/layout/number-format.ts
	/**
	* Writes numbers as Word writes list and page numbers in each of its formats (`ST_NumberFormat`). What Word writes was
	* read from PDFs Word saved of the probes in `scripts/layout-probes/word-page-number-formats*.ts`.
	*
	* @module
	*/
	/**
	* The largest number written in any format but decimal. Word's list numbers start over past it (32768 is "I" in roman
	* numerals), and its page numbers past it haven't been seen
	*/
	var LARGEST = 32767;
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
	/**
	* Letters of an alphabet as Word writes them: each letter in turn, then each twice, then three times and so on, as a to
	* z, aa to zz, aaa. Characters of more than one code point, such as the Devanagari vowels with a sign, are strings
	*/
	var repeated = (alphabet) => (value) => alphabet[(value - 1) % alphabet.length].repeat(Math.ceil(value / alphabet.length));
	/** Letters of an alphabet in turn, starting from the first again after the last */
	var cycled = (alphabet) => (value) => alphabet[(value - 1) % alphabet.length];
	/** Each decimal digit of the number written with the digits given, from 0 to 9 */
	var digits = (set) => (value) => [...String(value)].map((digit) => set[Number(digit)]).join("");
	/** The first of a run of characters for 1 to the last number given, such as ① to ⑳, and decimal numbers past them */
	var enclosed = (first, last) => (value) => value >= 1 && value <= last ? String.fromCodePoint(first + value - 1) : String(value);
	/** One of the characters given for 1 to the last of them, and decimal numbers past them */
	var listed = (set) => (value) => value >= 1 && value <= set.length ? set[value - 1] : String(value);
	var ordinalSuffix = (value) => {
		var _ref;
		return value % 100 >= 11 && value % 100 <= 13 ? "th" : (_ref = [
			"th",
			"st",
			"nd",
			"rd"
		][value % 10]) !== null && _ref !== void 0 ? _ref : "th";
	};
	var ONES = [
		"zero",
		"one",
		"two",
		"three",
		"four",
		"five",
		"six",
		"seven",
		"eight",
		"nine",
		"ten",
		"eleven",
		"twelve",
		"thirteen",
		"fourteen",
		"fifteen",
		"sixteen",
		"seventeen",
		"eighteen",
		"nineteen"
	];
	var TENS = [
		"",
		"",
		"twenty",
		"thirty",
		"forty",
		"fifty",
		"sixty",
		"seventy",
		"eighty",
		"ninety"
	];
	/** A number in English words, as "one hundred one" and "twenty-one", without "and" */
	var words = (value) => {
		if (value < 20) return ONES[value];
		if (value < 100) return TENS[Math.floor(value / 10)] + (value % 10 > 0 ? `-${ONES[value % 10]}` : "");
		const [amount, name] = value < 1e3 ? [100, "hundred"] : [1e3, "thousand"];
		const rest = value % amount;
		return `${words(Math.floor(value / amount))} ${name}${rest > 0 ? ` ${words(rest)}` : ""}`;
	};
	var ORDINAL_WORDS = {
		one: "first",
		two: "second",
		three: "third",
		five: "fifth",
		eight: "eighth",
		nine: "ninth",
		twelve: "twelfth"
	};
	/** A number in English ordinal words, such as "twenty-first": the last word made ordinal */
	var ordinalWords = (value) => words(value).replace(/[a-z]+$/, (last) => {
		var _ORDINAL_WORDS$last;
		return (_ORDINAL_WORDS$last = ORDINAL_WORDS[last]) !== null && _ORDINAL_WORDS$last !== void 0 ? _ORDINAL_WORDS$last : last.endsWith("y") ? `${last.slice(0, -1)}ieth` : `${last}th`;
	});
	/** A group of up to four digits in a counting system. A 1 before ten is left out of a number that starts with 10 to 19 */
	var countGroup = (value, counting, startsNumber) => {
		const { digits: set, units, omitOne, zero } = counting;
		const places = [
			3,
			2,
			1,
			0
		].map((place) => ({
			place,
			digit: Math.floor(value / Math.pow(10, place)) % 10
		})).filter(({ digit }, index, all) => digit > 0 || all.slice(0, index).some((before) => before.digit > 0));
		return places.map(({ place, digit }, index) => {
			if (digit === 0) {
				const next = places.slice(index + 1).find((other) => other.digit > 0);
				return zero && next && places[index - 1].digit > 0 ? set[0] : "";
			}
			return (digit === 1 && place > 0 && (omitOne === "always" || omitOne === "teens" && place === 1 && startsNumber && index === 0) ? "" : set[digit]) + (place > 0 ? units[place - 1] : "");
		}).join("");
	};
	var count = (counting) => (value) => {
		if (value === 0) return counting.digits[0];
		const high = Math.floor(value / 1e4);
		const low = value % 1e4;
		return (high === 0 ? "" : (high === 1 && counting.omitOneMyriad ? "" : countGroup(high, counting, true)) + counting.myriad) + (high > 0 && low > 0 && low < 1e3 && counting.zero ? counting.digits[0] : "") + (low > 0 ? countGroup(low, counting, high === 0) : "");
	};
	var CJK_DIGITS = [..."〇一二三四五六七八九"];
	var TAIWANESE_DIGITS = [..."○一二三四五六七八九"];
	var JAPANESE_COUNTING = {
		digits: CJK_DIGITS,
		units: [..."十百千"],
		myriad: "万",
		omitOne: "always"
	};
	var CHINESE_COUNTING = {
		digits: CJK_DIGITS,
		units: [..."十百千"],
		myriad: "万",
		omitOne: "teens",
		zero: true
	};
	var KOREAN_COUNTING = {
		digits: [..."영일이삼사오육칠팔구"],
		units: [..."십백천"],
		myriad: "만",
		omitOne: "always",
		omitOneMyriad: true
	};
	/** Chinese counting under 100, and digits from 100, as Word writes chineseCounting and taiwaneseCounting */
	var countingUnderHundred = (set) => (value) => value < 100 ? count(_objectSpread2(_objectSpread2({}, CHINESE_COUNTING), {}, { digits: set }))(value) : digits(set)(value);
	var KOREAN_ONES = [
		"",
		"하나",
		"둘",
		"셋",
		"넷",
		"다섯",
		"여섯",
		"일곱",
		"여덟",
		"아홉"
	];
	var KOREAN_TENS = [
		"",
		"열",
		"스물",
		"서른",
		"마흔",
		"쉰",
		"예순",
		"일흔",
		"여든",
		"아흔"
	];
	/** Korean's own words for 1 to 99, and Sino-Korean numbers from 100 */
	var koreanLegal = (value) => value === 0 ? "0" : value < 100 ? KOREAN_TENS[Math.floor(value / 10)] + KOREAN_ONES[value % 10] : count(KOREAN_COUNTING)(value);
	var VIETNAMESE = [
		"không",
		"một",
		"hai",
		"ba",
		"bốn",
		"năm",
		"sáu",
		"bảy",
		"tám",
		"chín"
	];
	/** A number up to 1000 in Vietnamese words */
	var vietnamese = (value) => {
		if (value === 1e3) return "một ngàn";
		const ones = value % 10;
		const tens = Math.floor(value / 10) % 10;
		if (value >= 100) {
			const rest = value % 100;
			const restText = rest === 0 ? "" : rest < 10 ? ` lẻ ${VIETNAMESE[rest]}` : ` ${vietnamese(rest)}`;
			return `${VIETNAMESE[Math.floor(value / 100)]} trăm${restText}`;
		}
		if (value < 10) return VIETNAMESE[value];
		const onesText = ones === 0 ? "" : ` ${ones === 5 ? "lăm" : ones === 1 && tens > 1 ? "mốt" : VIETNAMESE[ones]}`;
		return (tens === 1 ? "mười" : `${VIETNAMESE[tens]} mươi`) + onesText;
	};
	var HEBREW_HUNDREDS = [
		"",
		"ק",
		"ר",
		"ש",
		"ת",
		"תק",
		"תר",
		"תש",
		"תת",
		"תתק"
	];
	var HEBREW_TENS = [
		"",
		"י",
		"כ",
		"ל",
		"מ",
		"נ",
		"ס",
		"ע",
		"פ",
		"צ"
	];
	var HEBREW_ONES = [
		"",
		"א",
		"ב",
		"ג",
		"ד",
		"ה",
		"ו",
		"ז",
		"ח",
		"ט"
	];
	/** Hebrew numerals, in which 15 and 16 are written ט״ו and ט״ז, without the marks */
	var hebrewNumerals = (value) => {
		const rest = value % 100;
		const tensAndOnes = rest === 15 ? "טו" : rest === 16 ? "טז" : HEBREW_TENS[Math.floor(rest / 10)] + HEBREW_ONES[rest % 10];
		return HEBREW_HUNDREDS[Math.floor(value / 100)] + tensAndOnes;
	};
	var HEBREW_LETTERS = [..."אבגדהוזחטיכלמנסעפצקרשת"];
	/** The Hebrew alphabet, and past its end, a tav for each time through it before the letter */
	var hebrewLetters = (value) => "ת".repeat(Math.floor((value - 1) / HEBREW_LETTERS.length)) + HEBREW_LETTERS[(value - 1) % HEBREW_LETTERS.length];
	/** Writes nothing for 0, as Word does in the formats of letters and symbols that repeat */
	var orNothing = (write) => (value) => value === 0 ? "" : write(value);
	/** Writes the decimal 0 for 0, as Word does in the formats of syllables that go round */
	var orZero = (write) => (value) => value === 0 ? "0" : write(value);
	var format = (write, smallest = 0, largest = LARGEST) => [
		write,
		smallest,
		largest
	];
	var LOWER_LETTERS = [..."abcdefghijklmnopqrstuvwxyz"];
	var UPPER_LETTERS = LOWER_LETTERS.map((letter) => letter.toUpperCase());
	var RUSSIAN = [..."абвгдежзиклмнопрстуфхцчшщыэюя"];
	var capitalized = (text) => text.charAt(0).toUpperCase() + text.slice(1);
	/**
	* Each format's numbers, as Word writes them in lists. 0 is written in each as Word writes it, which is nothing in
	* roman numerals and letters, and the decimal 0 in the formats of letters that go round. Word's lists of letters start
	* over past 30 times through the alphabet (780 is 30 z's, and 1234 is 18 l's), except the Arabic and Hebrew ones, which
	* start over from 784, and the Hindi ones, from 912.
	*/
	var FORMATS = {
		decimal: format(String, 0, Infinity),
		decimalZero: format((value) => value < 10 ? `0${value}` : String(value)),
		numberInDash: format((value) => `- ${value} -`),
		ordinal: format((value) => `${value}${ordinalSuffix(value)}`),
		cardinalText: format((value) => capitalized(words(value))),
		ordinalText: format((value) => capitalized(ordinalWords(value))),
		hex: format((value) => value.toString(16).toUpperCase(), 0, 65535),
		upperRoman: format((value) => roman(value).toUpperCase()),
		lowerRoman: format(roman),
		upperLetter: format(orNothing(repeated(UPPER_LETTERS)), 0, 780),
		lowerLetter: format(orNothing(repeated(LOWER_LETTERS)), 0, 780),
		russianUpper: format(orNothing(repeated(RUSSIAN.map((letter) => letter.toUpperCase()))), 0, 870),
		russianLower: format(orNothing(repeated(RUSSIAN)), 0, 870),
		arabicAlpha: format(orNothing(repeated([..."أبتثجحخدذرزسشصضطظعغفقكلمنهوي"])), 0, 783),
		arabicAbjad: format(orNothing(repeated([..."أبجدهوزحطيكلمنسعفصقرشتثخذضظغ"])), 0, 783),
		hindiVowels: format(orNothing(repeated([..."कखगघङचछजझञटठडढणतथदधनऩपफबभमयरऱलळऴवशषसह"])), 0, 911),
		hindiConsonants: format(orNothing(repeated([
			..."अआइईउऊऋऌऍऎएऐऑऒओऔ",
			"अं",
			"अः"
		])), 0, 911),
		thaiLetters: format(orNothing(repeated([..."กขคงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ"])), 0, 1230),
		hebrew1: format(orNothing(hebrewNumerals), 0, 783),
		hebrew2: format(orNothing(hebrewLetters), 0, 783),
		chicago: format(orNothing(repeated([..."*†‡§"])), 0, 120),
		aiueo: format(orZero(cycled([..."ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ"]))),
		aiueoFullWidth: format(orZero(cycled([..."アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン"]))),
		iroha: format(orZero(cycled([..."ｲﾛﾊﾆﾎﾍﾄﾁﾘﾇﾙｦﾜｶﾖﾀﾚｿﾂﾈﾅﾗﾑｳヰﾉｵｸﾔﾏｹﾌｺｴﾃｱｻｷﾕﾒﾐｼヱﾋﾓｾｽﾝ"]))),
		irohaFullWidth: format(orZero(cycled([..."イロハニホヘトチリヌルヲワカヨタレソツネナラムウヰノオクヤマケフコエテアサキユメミシヱヒモセスン"]))),
		ganada: format(orZero(cycled([..."가나다라마바사아자차카타파하"]))),
		chosung: format(orZero(cycled([..."ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ"]))),
		decimalHalfWidth: format(String),
		decimalFullWidth: format(digits([..."０１２３４５６７８９"])),
		decimalFullWidth2: format(digits([..."０１２３４５６７８９"])),
		hindiNumbers: format(digits([..."०१२३४५६७८९"])),
		thaiNumbers: format(digits([..."๐๑๒๓๔๕๖๗๘๙"])),
		ideographDigital: format(digits(CJK_DIGITS)),
		japaneseDigitalTenThousand: format(digits(CJK_DIGITS), 0, 9999),
		taiwaneseDigital: format(digits(TAIWANESE_DIGITS)),
		koreanDigital: format(digits([..."영일이삼사오육칠팔구"])),
		koreanDigital2: format((value) => value === 0 ? "零" : digits([..."零一二三四五六七八九"])(value)),
		japaneseCounting: format(count(JAPANESE_COUNTING)),
		japaneseLegal: format(count({
			digits: [..."〇壱弐参四伍六七八九"],
			units: [..."拾百阡"],
			myriad: "萬",
			omitOne: "never"
		})),
		chineseCountingThousand: format(count(CHINESE_COUNTING)),
		taiwaneseCountingThousand: format(count(_objectSpread2(_objectSpread2({}, CHINESE_COUNTING), {}, {
			digits: [..."零一二三四五六七八九"],
			myriad: "萬"
		}))),
		ideographLegalTraditional: format(count({
			digits: [..."零壹貳參肆伍陸柒捌玖"],
			units: [..."拾佰仟"],
			myriad: "萬",
			omitOne: "never",
			zero: true
		})),
		chineseLegalSimplified: format(count({
			digits: [..."零壹贰叁肆伍陆柒捌玖"],
			units: [..."拾佰仟"],
			myriad: "萬",
			omitOne: "never",
			zero: true
		})),
		chineseCounting: format(countingUnderHundred(TAIWANESE_DIGITS)),
		taiwaneseCounting: format(countingUnderHundred(TAIWANESE_DIGITS)),
		koreanCounting: format(count(KOREAN_COUNTING)),
		koreanLegal: format(koreanLegal),
		vietnameseCounting: format(vietnamese, 0, 1e3),
		decimalEnclosedCircle: format(enclosed(9312, 20)),
		decimalEnclosedFullstop: format(enclosed(9352, 20)),
		decimalEnclosedParen: format(enclosed(9332, 20)),
		decimalEnclosedCircleChinese: format(enclosed(9312, 10)),
		ideographEnclosedCircle: format(enclosed(12832, 10)),
		ideographTraditional: format(listed([..."甲乙丙丁戊己庚辛壬癸"])),
		ideographZodiac: format(listed([..."子丑寅卯辰巳午未申酉戍亥"])),
		ideographZodiacTraditional: format((value) => value === 0 ? "0" : [..."甲乙丙丁戊己庚辛壬癸"][(value - 1) % 10] + [..."子丑寅卯辰巳午未申酉戍亥"][(value - 1) % 12]),
		bahtText: format(String),
		dollarText: format(String),
		bullet: format(() => ""),
		none: format(() => "")
	};
	/**
	* Where Word writes a page number differently from a list number: words without a capital, digits in
	* taiwaneseCountingThousand, decimal numbers for bullets, and fewer numbers in some formats, past which it writes an
	* error ("Error! Number cannot be represented in specified format."), nothing, or other letters, none of which are
	* written here. That is any page number in none, 0 in Chicago's symbols, Hebrew, Arabic, Hindi and Thai digits, and the
	* page numbers in Hebrew and Hindi letters that are more than the most seen in Word: 100 of Hebrew's, 75 of hindiVowels
	* and 37 of hindiConsonants. Its pages in the other formats were the same as its lists.
	*/
	var PAGE_FORMATS = _objectSpread2(_objectSpread2({}, Object.fromEntries(Object.entries(FORMATS).filter(([name]) => name !== "none"))), {}, {
		cardinalText: format(words),
		ordinalText: format(ordinalWords),
		taiwaneseCountingThousand: format(digits(TAIWANESE_DIGITS)),
		bullet: format(String),
		chicago: format(FORMATS.chicago[0], 1, FORMATS.chicago[2]),
		hebrew1: format(FORMATS.hebrew1[0], 1, 100),
		hebrew2: format(FORMATS.hebrew2[0], 1, 100),
		arabicAlpha: format(FORMATS.arabicAlpha[0], 1, FORMATS.arabicAlpha[2]),
		arabicAbjad: format(FORMATS.arabicAbjad[0], 1, FORMATS.arabicAbjad[2]),
		hindiVowels: format(FORMATS.hindiVowels[0], FORMATS.hindiVowels[1], 75),
		hindiConsonants: format(FORMATS.hindiConsonants[0], FORMATS.hindiConsonants[1], 37),
		hindiNumbers: format(FORMATS.hindiNumbers[0], 1, FORMATS.hindiNumbers[2]),
		thaiNumbers: format(FORMATS.thaiNumbers[0], 1, FORMATS.thaiNumbers[2])
	});
	var writeIn = (formats, value, name) => {
		const found = formats[name];
		if (!found) return;
		const [write, smallest, largest] = found;
		return Number.isInteger(value) && value >= smallest && value <= largest ? write(value) : void 0;
	};
	/**
	* A number in one of Word's number formats as it writes list numbers, such as `"iv"` for 4 in `lowerRoman`, or
	* undefined for numbers and formats it doesn't write as Word does: those of formats whose text from Word isn't known,
	* such as Thai and Hindi words, and those past where Word's lists start over.
	*/
	var formatNumber = (value, name = "decimal") => writeIn(FORMATS, value, name);
	/**
	* A page number in one of Word's number formats, as it writes it in page numbers and page references, or undefined for
	* those it doesn't write as Word does.
	*/
	var formatPageNumber = (value, name = "decimal") => writeIn(PAGE_FORMATS, value, name);
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
	* repeated at the top of each page and column. The footnotes of each page's lines, of the text and of table rows alike,
	* take room at its bottom, laid out in the section's columns in a section in columns, and one that doesn't fit below its
	* reference continues at the bottom of the next page, or pages, broken as the body is. The endnotes follow the body.
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
	/** The headings in a block: a paragraph's own, and those in a table's cells, whose chapter numbers aren't known yet */
	var headingsIn = (block) => block.type === "paragraph" ? block.heading ? [block.heading] : [] : block.rows.flatMap(({ cells }) => cells.flatMap((cell) => cell.blocks.flatMap(headingsIn))).map(({ level }) => ({
		level,
		unsupported: "a chapter heading in a table"
	}));
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
		const { sections, defaultTabStop, evenAndOddHeaders, addsParagraphSpacing, footnotes, footnoteSeparator, footnoteContinuationSeparator, endnotes, breakRules } = content;
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
		/**
		* A paragraph's content, as it is measured, which stops the layout at a character whose width the measurer doesn't
		* know, such as a mathematical symbol in Calibri, which Word draws in Cambria Math
		*/
		const measurable = (items) => {
			const inline = itemsOf(items);
			if (inline.some((item) => {
				var _measurer$unknownChar;
				return item.type === "text" && ((_measurer$unknownChar = measurer.unknownCharacter) === null || _measurer$unknownChar === void 0 ? void 0 : _measurer$unknownChar.call(measurer, item.text, item.font)) !== void 0;
			})) throw new Unsupported("a character whose width in its font isn't known");
			return inline;
		};
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
			const layOut = () => layoutLines(measurable(paragraph.items), {
				width: given.length === 1 ? given[0].width : (line) => given.findLast(({ from }) => from <= line).width,
				format: paragraph.format,
				tabStops: paragraph.tabStops,
				defaultTabStop,
				markFont: paragraph.markFont,
				measurer,
				breakRules
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
		/** How narrow and how wide the paragraphs and tables in a table cell can be */
		const contentWidths = (stack) => stack.reduce((widths, block) => {
			const { min, max } = block.type === "table" ? tableWidths(block, contentWidths) : measureContentWidths(measurable(block.items), {
				format: block.format,
				tabStops: block.tabStops,
				defaultTabStop,
				measurer,
				breakRules
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
		let lastHeadings = [];
		const chapterHeadings = blocks.map(({ block }) => {
			for (const heading of headingsIn(block)) if (heading.chapter !== void 0 || heading.unsupported !== void 0) lastHeadings = Object.assign([...lastHeadings], { [heading.level - 1]: heading });
			return lastHeadings;
		});
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
		*
		* @param below - The room below the lines that the footnotes don't take: that of the bottom border of a table that
		* breaks across pages below them
		*/
		const placeNotes = (notes, below = 0) => {
			if (notes.length === 0 || position + below <= linesBottom(moreNoteRoom(notes)) + TOLERANCE) {
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
			}, continued) <= bottom - position - below + TOLERANCE);
			pageNotes = [...whole, name];
			noteArea = bottom - position - below;
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
		/** The number of the page as the section writes it, after the chapter number when it has one */
		const pageText = () => {
			const { numberFormat, chapters } = section();
			const page = formatPageNumber(pageNumber, numberFormat);
			if (page === void 0) throw new Unsupported("a page number its format isn't written for yet");
			const heading = chapters && chapterHeadings[blockStart.index][chapters.level - 1];
			if (heading === null || heading === void 0 ? void 0 : heading.unsupported) throw new Unsupported(heading.unsupported);
			return (heading === null || heading === void 0 ? void 0 : heading.chapter) === void 0 ? page : `${heading.chapter}${chapters.separator}${page}`;
		};
		const mark = (names) => {
			const text = pageText();
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
		* room, or as many up to a line (`limit`, counted from the part's first) as widow control lets the part end at. The
		* space before a paragraph at the top of the part on the next page is left out, as it is at the top of a page. It
		* says how many lines fit in the room too (`fits`), with those widow control and keepLines hold back.
		*/
		const fillCell = (paragraphs, room, isFirstPart, limit = Infinity) => {
			var _previousAfter;
			let used = 0;
			let previousAfter;
			let placed = [];
			for (const [index, { paragraph, from }] of paragraphs.entries()) {
				const space = from > 0 ? 0 : previousAfter === void 0 ? isFirstPart ? paragraph.spaceBefore : 0 : between(previousAfter, paragraph.spaceBefore);
				const remaining = paragraph.lines.slice(from);
				const { fits, count: kept } = linesThatFit(remaining, room - used - space, paragraph, from === 0, (upTo) => upTo === remaining.length ? paragraph.spaceAfter : 0);
				const upToLimit = limit - placed.length;
				const count = fits <= upToLimit ? kept : upToLimit > 0 ? linesKept(remaining.length, upToLimit, paragraph, from === 0) : 0;
				const before = placed.length;
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
					}, ...paragraphs.slice(index + 1)],
					fits: before + fits
				};
				previousAfter = paragraph.spaceAfter;
			}
			return {
				height: used + ((_previousAfter = previousAfter) !== null && _previousAfter !== void 0 ? _previousAfter : 0),
				lines: placed,
				rest: [],
				fits: placed.length
			};
		};
		/**
		* Places a row that doesn't fit on the page with its footnotes by breaking it across pages between the lines of its
		* cells, as Word breaks a row unless it is kept whole, with the footnotes of the lines on each page at its bottom. A
		* row none of whose lines fit with their footnotes moves to the next page. The table's header rows are repeated above
		* the rest of it on each page and in each column.
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
			const borders = row.borderTop + row.borderBottom;
			const margins = (cell) => row.cells[cell].marginTop + row.cells[cell].marginBottom;
			/** How tall the cells' parts make the row's, with their margins */
			const tallestOf = (cells) => Math.max(...cells.map((part, cell) => margins(cell) + part.height));
			const notesOf = (cells) => notesIn(cells.flatMap(({ lines }) => lines.flatMap(({ markers }) => markers)));
			const placesAny = (cells) => cells.some(({ lines }) => lines.length > 0);
			/** The room for the row's part on the page, above footnotes that take this much more room */
			const roomAbove = (more) => linesBottom(more) - position - borders - breakBorder;
			const fitsWith = (cells, more) => tallestOf(cells) <= roomAbove(more) + TOLERANCE;
			/**
			* The cells' parts on the page, from the lines left of them (`left`), with the footnotes of their lines and the room
			* those take, and the parts they would have without the footnotes (`whole`). The lines fit where their footnotes fit
			* below them, the last continued on the next page when it can be, as a line's do, so each line's footnote goes on
			* the page the line is on (`word-probes.docx` U3a to U3c, U3e). Where they don't, the part is cut higher, until they
			* do or none of its lines are left.
			*/
			const partOnPage = (left, isFirst) => {
				/** Each cell's part in a room for the row's, or the part given for one of them (`cut`) */
				const fill = (room, cut) => left.map((paragraphs, cell) => cell === (cut === null || cut === void 0 ? void 0 : cut.cell) ? cut.part : fillCell(paragraphs, room - margins(cell), isFirst));
				const whole = fill(roomAbove(0));
				let cutAt = roomAbove(0);
				let filled = whole;
				while (placesAny(filled) && !fitsWith(filled, leastNoteRoom(notesOf(filled)))) {
					if (section().columns.length > 1) stopAtPartOfFootnote([], notesOf(filled), roomAbove(0) - tallestOf(filled));
					cutAt = Math.max(...filled.map((part, cell) => part.lines.length > 0 ? margins(cell) + part.height : 0)) - 2 * TOLERANCE;
					filled = fill(cutAt);
				}
				const continues = placesAny(filled) && !fitsWith(filled, moreNoteRoom(notesOf(filled)));
				if (continues) {
					const name = notesOf(filled)[notesOf(filled).length - 1];
					const cell = filled.findLastIndex(({ lines }) => lines.some(({ markers }) => markers.includes(name)));
					const reference = filled[cell].lines.findIndex(({ markers }) => markers.includes(name)) + 1;
					let part = fillCell(left[cell], cutAt - margins(cell), isFirst, reference);
					for (let limit = reference + 1; part.lines.length < reference; limit++) part = fillCell(left[cell], cutAt - margins(cell), isFirst, limit);
					filled = fill(margins(cell) + part.height, {
						cell,
						part
					});
				}
				const notes = notesOf(filled);
				const noteRoom = fitsWith(filled, moreNoteRoom(notes)) ? moreNoteRoom(notes) : leastNoteRoom(notes);
				if (!fitsWith(whole, moreNoteRoom(notesOf(whole)))) {
					const referring = whole.flatMap((part, cell) => notesOf([part]).length > 0 ? [cell] : []);
					const heldRoom = continues ? tallestOf(filled) : roomAbove(noteRoom);
					const heldBack = (part, cell) => referring.some((other) => other !== cell) && fillCell(left[cell], heldRoom - margins(cell), isFirst).fits > part.lines.length;
					if (filled.some(heldBack)) throw new Unsupported("a footnote in a table row beside a cell whose lines it holds back");
				}
				return {
					whole,
					filled,
					notes,
					noteRoom
				};
			};
			for (;;) {
				var _row$height$value, _row$height2;
				const { whole, filled, notes, noteRoom } = partOnPage(parts, isFirstPart);
				const isLastPart = filled.every(({ rest }) => rest.length === 0);
				const placesLines = (!isFirstPart || (isLastPart ? height - borders : (_row$height$value = (_row$height2 = row.height) === null || _row$height2 === void 0 ? void 0 : _row$height2.value) !== null && _row$height$value !== void 0 ? _row$height$value : 0) <= roomAbove(noteRoom) + TOLERANCE) && placesAny(filled) && parts.every((paragraphs, cell) => paragraphs.length === 0 || filled[cell].lines.length > 0);
				if (placesLines && !isLastPart) {
					if (row.cells.some(({ verticalMerge }) => verticalMerge !== void 0)) throw new Unsupported("a table row with merged cells across pages");
					if (row.cells.some((cell) => cell.blocks.some(({ type }) => type === "table"))) throw new Unsupported("a table in a table row across pages");
				}
				const fitsWhole = !isFirstPart || position + height + breakBorder <= linesBottom() + TOLERANCE;
				if ((!placesLines || !fitsWhole) && !placedInColumn && continued === void 0) {
					stopIfBalancing();
					throw new Unsupported(fitsWhole && notesOf(whole).length > 0 ? "a table row and its footnote taller than a page" : "a table row taller than a page");
				}
				if (placesLines) {
					mark(filled.flatMap(({ lines }) => lines.flatMap(({ markers }) => markers)));
					position += isLastPart ? (isFirstPart ? height - borders : tallestOf(filled)) + borders : tallestOf(filled) + borders + breakBorder;
					placeNotes(notes, isLastPart ? breakBorder : 0);
					if (isLastPart) {
						placedInColumn = true;
						return;
					}
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
			/**
			* Whether a row stays on the page whole, with its footnotes, the last continued on the next page when it can be, as
			* a line's do: a row whose footnote doesn't fit below it moves to the next page with it, and one whose footnote can
			* continue stays (`word-probes.docx` U3a, U3b)
			*/
			const rowStays = (height, notes) => position + height <= linesBottom(leastNoteRoom(notes)) + TOLERANCE;
			const markersIn = (row) => row.cells.flatMap((cell) => cell.blocks.flatMap(markersOf));
			const bottomBorder = (_table$rows$borderBot = (_table$rows = table.rows[table.rows.length - 1]) === null || _table$rows === void 0 ? void 0 : _table$rows.borderBottom) !== null && _table$rows$borderBot !== void 0 ? _table$rows$borderBot : 0;
			for (const [index, row] of table.rows.entries()) {
				var _row$height3;
				const breakBorder = index < table.rows.length - 1 ? bottomBorder : 0;
				const height = heights[index];
				const roomNeeded = height + breakBorder;
				const markers = markersIn(row);
				const notes = notesIn(markers);
				const keptWhole = row.cantSplit || ((_row$height3 = row.height) === null || _row$height3 === void 0 ? void 0 : _row$height3.rule) === "exact";
				while (keptWhole && !rowStays(roomNeeded, notes) && (placedInColumn || continued !== void 0)) {
					if (section().columns.length > 1) stopAtPartOfFootnote([], notes, linesBottom() - position - roomNeeded);
					startTablePage(index);
				}
				for (const { last, height: needed } of merges.filter(({ first }) => first === index)) {
					const reached = heights.slice(index, last + 1).findIndex((_, offset) => sum(heights.slice(index, index + offset + 1)) >= needed - TOLERANCE);
					const rows = table.rows.slice(index, reached === -1 ? last + 1 : index + reached + 1);
					if (rows.length > 1 && !rowFits(sum(heights.slice(index, index + rows.length)), notesIn(rows.flatMap(markersIn)))) throw new Unsupported("a table row with merged cells across pages");
				}
				if (!rowFits(roomNeeded, notes) && !keptWhole) {
					splitRow(row, height, breakBorder, () => startTablePage(index));
					continue;
				}
				if (!rowStays(roomNeeded, notes)) {
					stopIfBalancing();
					throw new Unsupported(notes.length > 0 && position + roomNeeded <= linesBottom() + TOLERANCE ? "a table row and its footnote taller than a page" : "a table row taller than a page");
				}
				mark(markers);
				position += height;
				placeNotes(notes, breakBorder);
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
	/** What goes between a chapter number and a page number, by `w:chapSep`. Word puts a hyphen when it isn't given */
	var CHAPTER_SEPARATORS = {
		hyphen: "-",
		period: ".",
		colon: ":",
		emDash: "—",
		enDash: "–"
	};
	var EMUS_PER_POINT = 12700;
	/** How far apart, in points, the widths two rows give a column can be before they differ: rounding, not a choice */
	var WIDTH_TOLERANCE = 1;
	/** The most columns a table in Word can have */
	var MOST_COLUMNS = 63;
	var EIGHTHS_PER_POINT = 8;
	var FIFTIETHS_OF_A_PERCENT = 5e3;
	var PLAIN_FORMATS = /* @__PURE__ */ new Set([
		"mergeformat",
		"charformat",
		"mergeformatinet"
	]);
	var nameOf = (element) => Object.keys(element)[0];
	/** The content of an element, including its text. An element without content has its attributes, or nothing */
	var contentOf$2 = (element) => {
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
		const children = contentOf$2(element).filter(isObject);
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
				if (field && !field.inResult) field.instruction += contentOf$2(child).filter((part) => typeof part === "string").join("");
				return [];
			}
			if (!isShown(reader)) return [];
			switch (name) {
				case "w:t": return spansOf(contentOf$2(child).filter((part) => typeof part === "string").join(""), format).map((_ref) => {
					let { text } = _ref;
					return _objectSpread2(_objectSpread2({
						type: "text",
						text,
						font: _objectWithoutProperties(_ref, _excluded)
					}, format.eastAsianLanguage === void 0 ? {} : { language: format.eastAsianLanguage }), isEastAsianRun(format) ? { eastAsian: true } : {});
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
				case "w:sym": {
					const { "w:font": symbolFont, "w:char": character } = attributesOf(child["w:sym"]);
					const code = String(character);
					return /^[0-9a-f]{4}$/i.test(code) ? [{
						type: "text",
						text: String.fromCodePoint(parseInt(code, 16)),
						font: symbolFont === void 0 ? font : _objectSpread2(_objectSpread2({}, font), {}, { font: String(symbolFont) })
					}] : "a symbol whose character isn't four hexadecimal digits";
				}
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
			if (RUN_CONTAINERS.has(name)) return readInline(contentOf$2(element), paragraphRun, reader);
			if (name === "w:sdt") return readInline(childrenOf(find(childrenOf(element[name]), "w:sdtContent")), paragraphRun, reader);
			if (name === "w:fldSimple") {
				const result = workedOutResultOf(String(attributesOf(element[name])["w:instr"]), fontOf(paragraphRun));
				return result !== void 0 && isShown(reader) ? [result] : readInline(contentOf$2(element), paragraphRun, reader);
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
	* The number of a paragraph in a list, and what follows it, as its list's level writes it, and its number as a chapter
	* number. A paragraph is in the list it gives, or else in its style's. The list's numbers move on.
	*/
	var readListNumber = (properties, style, paragraphRun, reader) => {
		var _valueOf2, _numberOf2, _ref2, _levels$findIndex, _ref3, _reader$counters$get, _counts$index, _exec;
		const numbering = childrenOf(find(properties, "w:numPr"));
		const ownId = (_valueOf2 = valueOf(numbering, "w:numId")) !== null && _valueOf2 !== void 0 ? _valueOf2 : (_numberOf2 = numberOf(attributesOf(find(numbering, "w:numId"))["w:val"])) === null || _numberOf2 === void 0 ? void 0 : _numberOf2.toString();
		const ownLevel = numberOf(attributesOf(find(numbering, "w:ilvl"))["w:val"]);
		const fromStyle = styleChain(reader.styles, style, "paragraph").reduce((inherited, { numbering: given }) => _objectSpread2(_objectSpread2({}, inherited), given), {});
		const id = (_ref2 = ownId !== null && ownId !== void 0 ? ownId : fromStyle.id) !== null && _ref2 !== void 0 ? _ref2 : "";
		const levels = reader.numbering.get(id);
		const linked = (_levels$findIndex = levels === null || levels === void 0 ? void 0 : levels.findIndex((other) => (other === null || other === void 0 ? void 0 : other.style) !== void 0 && other.style === style)) !== null && _levels$findIndex !== void 0 ? _levels$findIndex : -1;
		const index = (_ref3 = ownLevel !== null && ownLevel !== void 0 ? ownLevel : ownId === void 0 ? fromStyle.level : void 0) !== null && _ref3 !== void 0 ? _ref3 : Math.max(linked, 0);
		const level = levels === null || levels === void 0 ? void 0 : levels[index];
		if (!levels || !level) return { items: [] };
		const counts = (_reader$counters$get = reader.counters.get(id)) !== null && _reader$counters$get !== void 0 ? _reader$counters$get : [];
		const current = [...counts.slice(0, index), ((_counts$index = counts[index]) !== null && _counts$index !== void 0 ? _counts$index : level.start - 1) + 1];
		reader.counters.set(id, current);
		const numberAt = (at) => {
			var _formatNumber, _ref4, _current$at;
			const other = levels[at];
			return (_formatNumber = formatNumber((_ref4 = (_current$at = current[at]) !== null && _current$at !== void 0 ? _current$at : other === null || other === void 0 ? void 0 : other.start) !== null && _ref4 !== void 0 ? _ref4 : 1, other === null || other === void 0 ? void 0 : other.format)) !== null && _formatNumber !== void 0 ? _formatNumber : "1";
		};
		const text = level.text.replace(/%([1-9])/g, (_, digit) => numberAt(Number(digit) - 1));
		const numbers = (_exec = /%[1-9](?:.*%[1-9])?/.exec(level.text)) === null || _exec === void 0 ? void 0 : _exec[0];
		const font = fontOf(combine([paragraphRun, level.run]));
		const suffix = level.suffix === "nothing" ? [] : level.suffix === "space" ? [{
			type: "text",
			text: " ",
			font
		}] : [{
			type: "tab",
			font
		}];
		return _objectSpread2({
			items: [...text.length > 0 ? [{
				type: "text",
				text,
				font
			}] : [], ...suffix],
			level,
			from: ownId === void 0 ? "style" : "paragraph"
		}, withoutUndefined({ chapter: numbers === null || numbers === void 0 ? void 0 : numbers.replace(/%([1-9])/g, (_, digit) => numberAt(Number(digit) - 1)) }));
	};
	/**
	* Reads a paragraph (`w:p`), in the formatting of its styles, and of its table's style when it is in a table.
	*/
	var readParagraph = (element, reader, tableStyle) => {
		var _valueOf3, _exec2, _styleChain$slice$0$n, _styleChain$slice$;
		const { styles } = reader;
		const children = contentOf$2(element);
		const properties = childrenOf(find(children.filter(isObject), "w:pPr"));
		const style = (_valueOf3 = valueOf(properties, "w:pStyle")) !== null && _valueOf3 !== void 0 ? _valueOf3 : styles.defaultParagraphStyle;
		const paragraphStyles = [...styleChain(styles, tableStyle, "table"), ...styleChain(styles, style, "paragraph")];
		const paragraphRun = combine([styles.run, ...paragraphStyles.map(({ run }) => run)]);
		const list = readListNumber(properties, style, paragraphRun, reader);
		const headingLevel = (_exec2 = /^heading ([1-9])$/i.exec((_styleChain$slice$0$n = (_styleChain$slice$ = styleChain(styles, style, "paragraph").slice(-1)[0]) === null || _styleChain$slice$ === void 0 ? void 0 : _styleChain$slice$.name) !== null && _styleChain$slice$0$n !== void 0 ? _styleChain$slice$0$n : "")) === null || _exec2 === void 0 ? void 0 : _exec2[1];
		const formats = [
			styles.paragraph,
			...paragraphStyles.map(({ paragraph }) => paragraph),
			...list.level ? [list.level.paragraph] : [],
			readParagraphFormat(properties)
		];
		const items = readInline(children, paragraphRun, reader);
		const unsupported = find(properties, "w:framePr") === void 0 ? void 0 : "a text frame";
		return _objectSpread2(_objectSpread2({
			type: "paragraph",
			items: typeof items === "string" ? [] : [...list.items, ...items],
			format: combine(formats),
			tabStops: tabStopsOf(formats),
			markFont: fontOf(combine([paragraphRun, readRunFormat(find(properties, "w:rPr"), styles.themeFonts)])),
			style
		}, headingLevel === void 0 ? {} : { heading: _objectSpread2({ level: Number(headingLevel) }, withoutUndefined({ chapter: list.from === "style" ? list.chapter : void 0 })) }), typeof items === "string" || unsupported ? { unsupported: typeof items === "string" ? items : unsupported } : {});
	};
	var borderWidth = (borders, name) => {
		var _numberOf3;
		const attributes = attributesOf(find(borders, name));
		const style = attributes["w:val"];
		return style === void 0 || style === "nil" || style === "none" ? 0 : ((_numberOf3 = numberOf(attributes["w:sz"])) !== null && _numberOf3 !== void 0 ? _numberOf3 : 0) / EIGHTHS_PER_POINT;
	};
	/** The rows of a table, or of a content control or custom XML in it */
	var rowsOf = (elements) => elements.filter(isObject).flatMap((element) => {
		const name = nameOf(element);
		if (name === "w:tr") return [element];
		if (name === "w:sdt") return rowsOf(childrenOf(find(childrenOf(element[name]), "w:sdtContent")));
		return name === "w:customXml" ? rowsOf(contentOf$2(element)) : [];
	});
	/** The cells of a row */
	var cellsOf = (elements) => elements.filter(isObject).flatMap((element) => {
		const name = nameOf(element);
		if (name === "w:tc") return [element];
		if (name === "w:sdt") return cellsOf(childrenOf(find(childrenOf(element[name]), "w:sdtContent")));
		return name === "w:customXml" ? cellsOf(contentOf$2(element)) : [];
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
		var _ref5, _blocks$find;
		const children = contentOf$2(element).filter(isObject);
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
			var _numberOf4;
			const rowChildren = contentOf$2(row).filter(isObject);
			const rowProperties = childrenOf(find(rowChildren, "w:trPr"));
			const heightAttributes = attributesOf(find(rowProperties, "w:trHeight"));
			const height = twips(heightAttributes["w:val"]);
			const { "w:hRule": rule } = heightAttributes;
			const skipped = (_numberOf4 = numberOf(attributesOf(find(rowProperties, "w:gridBefore"))["w:val"])) !== null && _numberOf4 !== void 0 ? _numberOf4 : 0;
			const { cells, edges, column: end } = cellsOf(rowChildren).reduce(({ column, cells: done, edges: before }, cell) => {
				var _numberOf5, _twips2, _shareOf;
				const cellChildren = contentOf$2(cell).filter(isObject);
				const cellProperties = childrenOf(find(cellChildren, "w:tcPr"));
				const span = (_numberOf5 = numberOf(attributesOf(find(cellProperties, "w:gridSpan"))["w:val"])) !== null && _numberOf5 !== void 0 ? _numberOf5 : 1;
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
					cells: [...done, _objectSpread2(_objectSpread2(_objectSpread2({ column }, span > 1 ? { span } : {}), {}, { width: width - margins.left - margins.right }, hasWidth ? { ownWidth: width } : {}), {}, {
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
				edges: /* @__PURE__ */ new Map([[skipped, gridWidth(0, skipped)]])
			});
			return {
				edges,
				end,
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
		const unfitted = read.reduce((most, { end }) => Math.max(most, end), 0) > MOST_COLUMNS ? `a table given no widths of more than ${MOST_COLUMNS} columns` : void 0;
		const unsupported = (_ref5 = fits ? unfitted : unequal ? "a table whose rows give a column different widths" : void 0) !== null && _ref5 !== void 0 ? _ref5 : (_blocks$find = blocks.find((block) => block.unsupported !== void 0)) === null || _blocks$find === void 0 ? void 0 : _blocks$find.unsupported;
		return _objectSpread2(_objectSpread2(_objectSpread2({
			type: "table",
			rows: read.map(({ row }) => row)
		}, fits ? { fit: readTableWidth(properties) } : {}), !fits && !fixed ? { widen: _objectSpread2(_objectSpread2({}, readTableWidth(properties)), {}, { acrossColumns: tableCells.some(({ span }) => span !== void 0) }) } : {}), {}, {
			borderLeft: borderWidth(borders, "w:left"),
			borderRight: borderWidth(borders, "w:right")
		}, unsupported ? { unsupported } : {});
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
			case "w:customXml": return readBlocks(contentOf$2(element), reader, tableStyle);
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
		var _numberOf6, _twips4;
		const attributes = attributesOf(element);
		const given = childrenOf(element).filter((child) => "w:col" in child);
		if (isOff(attributes["w:equalWidth"]) && given.length > 0) return given.map((column) => {
			var _twips3;
			return (_twips3 = twips(attributesOf(column["w:col"])["w:w"])) !== null && _twips3 !== void 0 ? _twips3 : 0;
		});
		const count = Math.max(1, (_numberOf6 = numberOf(attributes["w:num"])) !== null && _numberOf6 !== void 0 ? _numberOf6 : 1);
		const space = (_twips4 = twips(attributes["w:space"])) !== null && _twips4 !== void 0 ? _twips4 : DEFAULT_COLUMN_SPACE;
		return Array.from({ length: count }, () => (width - space * (count - 1)) / count);
	};
	/**
	* Reads a section's properties (`w:sectPr`): its pages, how it starts, and its headers and footers. A section that
	* doesn't give a header or footer for a kind of page has the one of the section before.
	*/
	var readSection = (element, readPart, previous) => {
		var _stringOf, _twips5, _twips6, _margins$wLeft, _twips7, _margins$wRight, _twips8, _twips9, _twips10, _twips11, _twips12, _twips13, _CHAPTER_SEPARATORS$S;
		const properties = childrenOf(element);
		const size = attributesOf(find(properties, "w:pgSz"));
		const margins = attributesOf(find(properties, "w:pgMar"));
		const numbering = attributesOf(find(properties, "w:pgNumType"));
		const grid = attributesOf(find(properties, "w:docGrid"))["w:type"];
		const start = valueOf(properties, "w:type");
		const format = (_stringOf = stringOf(numbering["w:fmt"])) !== null && _stringOf !== void 0 ? _stringOf : "decimal";
		const firstNumber = numberOf(numbering["w:start"]);
		const chapterLevel = numberOf(numbering["w:chapStyle"]);
		const pageWidth = (_twips5 = twips(size["w:w"])) !== null && _twips5 !== void 0 ? _twips5 : DEFAULT_SECTION.pageWidth;
		const marginLeft = (_twips6 = twips((_margins$wLeft = margins["w:left"]) !== null && _margins$wLeft !== void 0 ? _margins$wLeft : margins["w:start"])) !== null && _twips6 !== void 0 ? _twips6 : DEFAULT_SECTION.marginLeft;
		const marginRight = (_twips7 = twips((_margins$wRight = margins["w:right"]) !== null && _margins$wRight !== void 0 ? _margins$wRight : margins["w:end"])) !== null && _twips7 !== void 0 ? _twips7 : DEFAULT_SECTION.marginRight;
		const gutter = (_twips8 = twips(margins["w:gutter"])) !== null && _twips8 !== void 0 ? _twips8 : DEFAULT_SECTION.gutter;
		const columns = readColumns(find(properties, "w:cols"), pageWidth - marginLeft - marginRight - gutter);
		const unsupported = grid === "lines" || grid === "linesAndChars" || grid === "snapToChars" ? "a document grid" : formatPageNumber(1, format) === void 0 ? "page numbers in a format not yet written" : find(properties, "w:textDirection") !== void 0 ? "text that runs down the page" : void 0;
		const headers = readReferences(properties, "w:headerReference", readPart);
		const footers = readReferences(properties, "w:footerReference", readPart);
		return _objectSpread2(_objectSpread2(_objectSpread2({
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
		}, chapterLevel === void 0 || chapterLevel < 1 || chapterLevel > 9 ? {} : { chapters: {
			level: chapterLevel,
			separator: (_CHAPTER_SEPARATORS$S = CHAPTER_SEPARATORS[String(numbering["w:chapSep"])]) !== null && _CHAPTER_SEPARATORS$S !== void 0 ? _CHAPTER_SEPARATORS$S : "-"
		} }), firstNumber === void 0 ? {} : { firstNumber }), {}, {
			headers: _objectSpread2(_objectSpread2({}, previous === null || previous === void 0 ? void 0 : previous.headers), headers),
			footers: _objectSpread2(_objectSpread2({}, previous === null || previous === void 0 ? void 0 : previous.footers), footers)
		}, unsupported ? { unsupported } : {});
	};
	/**
	* Reads the levels of each list in the document's numbering (`w:numbering`), by the ids its paragraphs refer to it by:
	* its number, and any other name it has, such as the placeholder docx writes before it is given one.
	*/
	var readNumbering = (xml, styles, otherIds) => {
		const root = childrenOf(xml === null || xml === void 0 ? void 0 : xml["w:numbering"]);
		const abstract = new Map(root.filter((child) => "w:abstractNum" in child).map((child) => {
			const byIndex = childrenOf(child["w:abstractNum"]).filter((level) => "w:lvl" in level).map((level) => {
				var _numberOf7, _valueOf4, _stringOf2, _valueOf5, _numberOf8;
				const levelChildren = childrenOf(level["w:lvl"]);
				return {
					index: (_numberOf7 = numberOf(attributesOf(level["w:lvl"])["w:ilvl"])) !== null && _numberOf7 !== void 0 ? _numberOf7 : 0,
					level: _objectSpread2(_objectSpread2({}, withoutUndefined({ style: valueOf(levelChildren, "w:pStyle") })), {}, {
						format: (_valueOf4 = valueOf(levelChildren, "w:numFmt")) !== null && _valueOf4 !== void 0 ? _valueOf4 : "decimal",
						text: (_stringOf2 = stringOf(attributesOf(find(levelChildren, "w:lvlText"))["w:val"])) !== null && _stringOf2 !== void 0 ? _stringOf2 : "",
						suffix: (_valueOf5 = valueOf(levelChildren, "w:suff")) !== null && _valueOf5 !== void 0 ? _valueOf5 : "tab",
						start: (_numberOf8 = numberOf(attributesOf(find(levelChildren, "w:start"))["w:val"])) !== null && _numberOf8 !== void 0 ? _numberOf8 : 0,
						paragraph: readParagraphFormat(find(levelChildren, "w:pPr")),
						run: readRunFormat(find(levelChildren, "w:rPr"), styles.themeFonts)
					})
				};
			}).reduce((all, { index, level }) => {
				const copy = [...all];
				copy[index] = level;
				return copy;
			}, []);
			return [String(attributesOf(child["w:abstractNum"])["w:abstractNumId"]), byIndex];
		}));
		const numbers = new Map(root.filter((child) => "w:num" in child).flatMap((child) => {
			const abstractId = String(numberOf(attributesOf(find(childrenOf(child["w:num"]), "w:abstractNumId"))["w:val"]));
			const levels = abstract.get(abstractId);
			return levels ? [[String(attributesOf(child["w:num"])["w:numId"]), levels]] : [];
		}));
		return new Map([...numbers, ...[...otherIds].flatMap(([other, id]) => {
			const levels = numbers.get(id);
			return levels ? [[other, levels]] : [];
		})]);
	};
	var CURRENT_COMPATIBILITY_MODE = 15;
	/**
	* The document's own lists of the characters that can't start a line (`w:noLineBreaksBefore`) and can't end one
	* (`w:noLineBreaksAfter`), which take the place of Word's for their language.
	*/
	var readKinsokuLists = (settings) => settings.reduce((lists, child) => {
		var _attributes$wVal;
		const name = nameOf(child);
		const attributes = attributesOf(child[name]);
		const language = kinsokuLanguageOf(stringOf(attributes["w:lang"]));
		if (name !== "w:noLineBreaksBefore" && name !== "w:noLineBreaksAfter" || language === void 0) return lists;
		const list = { [name === "w:noLineBreaksBefore" ? "noLineStart" : "noLineEnd"]: String((_attributes$wVal = attributes["w:val"]) !== null && _attributes$wVal !== void 0 ? _attributes$wVal : "") };
		return _objectSpread2(_objectSpread2({}, lists), {}, { [language]: _objectSpread2(_objectSpread2({}, lists[language]), list) });
	}, {});
	/**
	* Reads the parts of the document's settings (`w:settings`) that change how it is laid out.
	*/
	var readSettings = (xml) => {
		var _compatibility$find, _twips14;
		const settings = childrenOf(xml === null || xml === void 0 ? void 0 : xml["w:settings"]);
		const compatibility = childrenOf(find(settings, "w:compat"));
		const lists = readKinsokuLists(settings);
		const spacingControl = valueOf(settings, "w:characterSpacingControl");
		const mode = numberOf(attributesOf((_compatibility$find = compatibility.find((child) => "w:compatSetting" in child && attributesOf(child["w:compatSetting"])["w:name"] === "compatibilityMode")) === null || _compatibility$find === void 0 ? void 0 : _compatibility$find["w:compatSetting"])["w:val"]);
		const unsupported = onOff(settings, "w:autoHyphenation") === true ? "hyphenation" : onOff(settings, "w:strictFirstAndLastChars") === true ? "the strict rules for the characters that can't start a line" : spacingControl !== void 0 && spacingControl !== "doNotCompress" ? "punctuation compressed" : mode === void 0 || mode < CURRENT_COMPATIBILITY_MODE ? "a document in compatibility mode" : void 0;
		return _objectSpread2(_objectSpread2({
			defaultTabStop: (_twips14 = twips(attributesOf(find(settings, "w:defaultTabStop"))["w:val"])) !== null && _twips14 !== void 0 ? _twips14 : 36,
			evenAndOddHeaders: onOff(settings, "w:evenAndOddHeaders") === true,
			addsParagraphSpacing: onOff(compatibility, "w:doNotUseHTMLParagraphAutoSpacing") === true
		}, Object.keys(lists).length > 0 ? { breakRules: { lists } } : {}), unsupported ? { unsupported } : {});
	};
	/**
	* The parts of the document being written, formatted to be read.
	*/
	var partsOfFile = (context) => {
		const { file } = context;
		const styles = getTextStyles(context);
		for (const style of styles.styles.values()) {
			var _style$numbering$id, _style$numbering;
			const placeholder = /^\{(.+)-(\d+)\}$/.exec((_style$numbering$id = (_style$numbering = style.numbering) === null || _style$numbering === void 0 ? void 0 : _style$numbering.id) !== null && _style$numbering$id !== void 0 ? _style$numbering$id : "");
			if (placeholder) file.Numbering.createConcreteNumberingInstance(placeholder[1], Number(placeholder[2]));
		}
		const format = (wrapper) => wrapper.View.prepForXml(_objectSpread2(_objectSpread2({}, context), {}, {
			viewWrapper: wrapper,
			stack: []
		}));
		return {
			styles,
			numbering: file.Numbering.prepForXml(READING_CONTEXT),
			otherListIds: new Map(file.Numbering.ConcreteNumbering.map((concrete) => [`{${concrete.reference}-${concrete.instance}}`, String(concrete.numId)])),
			settings: file.Settings.prepForXml(READING_CONTEXT),
			headersAndFooters: new Map([...file.Headers, ...file.Footers].map((wrapper) => [`rId${wrapper.View.ReferenceId}`, Object.values(format(wrapper))[0]])),
			footnotes: format(file.FootNotes),
			endnotes: format(file.Endnotes)
		};
	};
	/**
	* Reads a document's body, as it is written, with its styles, lists, settings, headers and footers.
	*
	* @param body - The formatted body (`w:body`)
	* @param context - The context it was formatted in, with the document it is in
	*/
	var readDocument = (body, context) => readContent(body, partsOfFile(context));
	/**
	* Reads a document's body (`w:body`), with the other parts of the document.
	*/
	var readContent = (body, parts) => {
		var _parts$otherListIds;
		const { styles } = parts;
		const numbering = readNumbering(parts.numbering, styles, (_parts$otherListIds = parts.otherListIds) !== null && _parts$otherListIds !== void 0 ? _parts$otherListIds : /* @__PURE__ */ new Map());
		const readerOf = (inHeader) => ({
			styles,
			numbering,
			inHeader,
			fields: [],
			counters: /* @__PURE__ */ new Map()
		});
		const headersAndFooters = /* @__PURE__ */ new Map();
		const readPart = (id) => {
			if (!headersAndFooters.has(id)) {
				const content = parts.headersAndFooters.get(id);
				headersAndFooters.set(id, content && readBlocks(content, readerOf(true)));
			}
			return headersAndFooters.get(id);
		};
		const noteElements = (kind) => {
			const xml = kind === "footnote" ? parts.footnotes : parts.endnotes;
			const notes = childrenOf(xml && Object.values(xml)[0]).filter((child) => `w:${kind}` in child);
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
			return note === void 0 ? [] : readBlocks(contentOf$2(note), _objectSpread2(_objectSpread2({}, readerOf(false)), label === void 0 ? {} : { noteNumber: label }));
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
				else if (name === "w:customXml") read(contentOf$2(element));
				else if (name === "w:sectPr") addSection(element[name]);
				else if (name === "w:bookmarkStart") bookmarks = [...bookmarks, String(attributesOf(element[name])["w:name"])];
				else {
					const sectionProperties = name === "w:p" ? find(childrenOf(find(contentOf$2(element).filter(isObject), "w:pPr")), "w:sectPr") : void 0;
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
		read(contentOf$2(body));
		if (sections.length === 0 || blocks.some(({ section }) => section >= sections.length)) addSection(void 0);
		return _objectSpread2({
			blocks,
			sections,
			footnotes,
			footnoteSeparator: footnotes.size > 0 ? readNoteContent("footnote", "separator") : [],
			footnoteContinuationSeparator: footnotes.size > 0 ? readNoteContent("footnote", "continuationSeparator") : [],
			endnotes: endnotes.length > 0 ? [...readNoteContent("endnote", "separator"), ...endnotes] : []
		}, readSettings(parts.settings));
	};
	//#endregion
	//#region src/layout/read-docx.ts
	var DEFAULT_DOCUMENT = "word/document.xml";
	/**
	* An element as xml-js parses it, formatted as docx formats elements: `{ "w:p": [{ _attr: {...} }, ...content] }`, with
	* text as strings.
	*/
	var formatted = (element) => {
		var _element$elements;
		if (element.type === "text" || element.type === "cdata") return String(element.type === "text" ? element.text : element.cdata);
		return { [String(element.name)]: [...element.attributes === void 0 ? [] : [{ _attr: element.attributes }], ...((_element$elements = element.elements) !== null && _element$elements !== void 0 ? _element$elements : []).filter(({ type }) => type === "element" || type === "text" || type === "cdata").map(formatted)] };
	};
	/** The content of a formatted element: its attributes, the elements in it and its text */
	var contentOf$1 = (element) => Object.values(element)[0];
	/** The root element of a part, such as `w:document`, formatted */
	var rootOf = (part) => {
		var _part$elements;
		const root = part === null || part === void 0 || (_part$elements = part.elements) === null || _part$elements === void 0 ? void 0 : _part$elements.find(({ type }) => type === "element");
		return root && formatted(root);
	};
	var folderOf = (path) => path.slice(0, path.lastIndexOf("/") + 1);
	/**
	* The path of the part a relationship's target refers to: relative to the folder of the part the relationship belongs to,
	* or from the package's root if it starts with "/".
	*/
	var resolveTarget = (from, target) => (target.startsWith("/") ? target : `${folderOf(from)}${target}`).split("/").reduce((segments, segment) => {
		if (segment === "" || segment === ".") return segments;
		return segment === ".." ? segments.slice(0, -1) : [...segments, segment];
	}, []).join("/");
	/** The relationships of the part at the path to the other parts of the package, from its relationships part */
	var relationshipsOf = (parts, from) => {
		const relationshipsPath = `${folderOf(from)}_rels/${from.slice(folderOf(from).length)}.rels`;
		const root = rootOf(parts.get(relationshipsPath));
		return childrenOf(root && contentOf$1(root)).filter((child) => "Relationship" in child).flatMap((child) => {
			const { Id: id, Type: type, Target: target, TargetMode: mode } = attributesOf(child.Relationship);
			return typeof id !== "string" || typeof target !== "string" || mode === "External" ? [] : [{
				id,
				type: String(type).slice(String(type).lastIndexOf("/") + 1),
				path: resolveTarget(from, target)
			}];
		});
	};
	/**
	* Reads a .docx's main document, with the parts it refers to.
	*
	* @param parts - The XML parts of its package, parsed by xml-js's `xml2js`, not compact and keeping the spaces between
	* elements, by their paths, such as "word/document.xml"
	*/
	var readDocx = (parts) => {
		var _relationshipsOf$find, _relationshipsOf$find2, _partOf, _find;
		const documentPath = (_relationshipsOf$find = (_relationshipsOf$find2 = relationshipsOf(parts, "").find(({ type }) => type === "officeDocument")) === null || _relationshipsOf$find2 === void 0 ? void 0 : _relationshipsOf$find2.path) !== null && _relationshipsOf$find !== void 0 ? _relationshipsOf$find : DEFAULT_DOCUMENT;
		const relationships = relationshipsOf(parts, documentPath);
		const partOf = (type) => {
			const relationship = relationships.find((candidate) => candidate.type === type);
			return relationship && rootOf(parts.get(relationship.path));
		};
		const theme = partOf("theme");
		const documentParts = {
			styles: readTextStyles((_partOf = partOf("styles")) !== null && _partOf !== void 0 ? _partOf : { "w:styles": [] }, theme && readThemeFonts(theme)),
			numbering: partOf("numbering"),
			settings: partOf("settings"),
			headersAndFooters: new Map(relationships.flatMap(({ id, type, path }) => {
				const part = type === "header" || type === "footer" ? rootOf(parts.get(path)) : void 0;
				return part ? [[id, contentOf$1(part)]] : [];
			})),
			footnotes: partOf("footnotes"),
			endnotes: partOf("endnotes")
		};
		const document = rootOf(parts.get(documentPath));
		return readContent({ "w:body": (_find = find(childrenOf(document && contentOf$1(document)), "w:body")) !== null && _find !== void 0 ? _find : [] }, documentParts);
	};
	//#endregion
	//#region src/layout/estimate-page-numbers.ts
	var PASSES = 3;
	var sameNumbers = (one, other) => one.bookmarks.size === other.bookmarks.size && [...one.bookmarks].every(([name, page]) => other.bookmarks.get(name) === page) && one.pageCount === other.pageCount && one.sectionPageCounts.length === other.sectionPageCounts.length && one.sectionPageCounts.every((count, index) => other.sectionPageCounts[index] === count);
	/** What a document is read into: a template patchDocument patched, or the body of a document being written */
	var contentOf = (document, context) => "parts" in document ? readDocx(document.parts) : (context === null || context === void 0 ? void 0 : context.file) && readDocument(document, context);
	/** Lays out the pages until their page numbers stop changing, with a measurer */
	var estimateWith = (content, measurer) => {
		if (!content) return { bookmarks: /* @__PURE__ */ new Map() };
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
	* numbers of pages, are written with it. Give it to a document as its `pageNumbers`, or to `patchDocument` as its
	* `pageNumbers` to write a template's once it is patched:
	*
	* ```ts
	* new Document({ pageNumbers: estimatePageNumbers, sections: [...] });
	* await patchDocument({ outputType: "nodebuffer", data, patches, pageNumbers: estimatePageNumbers });
	* ```
	*
	* The pages are laid out with the widths and heights of the fonts Word documents use most, such as Calibri, Cambria,
	* Arial and Times New Roman. It follows paragraphs' spacing, indents, line spacing, tab stops and keep settings, widow
	* and orphan control, lists, pictures in the line, tables, whose rows break across pages, footnotes and endnotes, page,
	* column and section breaks, and each section's page size, margins, columns, headers, footers and page numbering.
	*
	* It stops at the first thing it can't lay out yet: a drawing that text flows around, a text box or frame, an equation,
	* a footnote that continues on the next page, columns evened out before a continuous section break, a table row kept
	* whole that is taller than a page, or a character whose width in its font isn't known, such as a mathematical symbol in
	* Calibri, which Word draws in Cambria Math. The page references to bookmarks after it are left blank, for Word to fill
	* in when it updates the fields. A document in compatibility mode, which Word lays out as an older version of Word did,
	* isn't laid out at all.
	*
	* Page references and tables of contents are written clean, so Word shows the numbers as they are written, and the
	* page numbers it left blank stay blank, without asking to update the fields, unless the document has `updateFields`
	* on.
	*
	* @publicApi
	*/
	var estimatePageNumbers = (document, context) => estimateWith(contentOf(document, context), DEFAULT_MEASURER);
	/**
	* Works out the page each bookmark of a document starts on, as {@link estimatePageNumbers} does, measuring text as the
	* options say. Give what it returns to a document as its `pageNumbers`, or to `patchDocument` as its `pageNumbers`:
	*
	* ```ts
	* new Document({ pageNumbers: estimatePageNumbersWith({ measureWidth: measureWithPretext(pretext) }), sections: [...] });
	* ```
	*
	* @publicApi
	*/
	var estimatePageNumbersWith = ({ measureWidth }) => {
		const measurer = measureWidth ? measurerOf(measureWidth) : DEFAULT_MEASURER;
		return (document, context) => estimateWith(contentOf(document, context), measurer);
	};
	//#endregion
	exports.estimatePageNumbers = estimatePageNumbers;
	exports.estimatePageNumbersWith = estimatePageNumbersWith;
	exports.measureWithPretext = measureWithPretext;
	return exports;
})({});
