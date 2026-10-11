/* Independent premium worlds. Existing ultimate builders remain separate. */
(() => {
    'use strict';
    const css='css/luxury-distinct-scenes.css?v=20261008.world3';
    const many=(n,f)=>Array.from({length:n},(_,i)=>f(i)).join('');
    const svg=(body,box='0 0 1200 800')=>`<svg viewBox="${box}" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
    const star=(x,y,r=8)=>`<path d="M${x} ${y-r}q0 ${r} ${r} ${r}q-${r} 0-${r} ${r}q0-${r}-${r}-${r}q${r} 0 ${r}-${r}Z" fill="currentColor"/>`;
    const rose=()=>svg(`<path d="M100 75C42 0 7 92 66 138C-8 167 110 230 146 164C211 209 249 96 177 78C191 4 108 4 100 75Z" fill="#702047"/><path d="M100 75Q150 32 177 78Q198 133 146 164Q86 180 66 138Q44 91 100 75ZM100 75Q160 75 146 135Q93 164 87 113Q118 83 136 117Q114 141 109 120"/><path d="M105 176Q100 216 80 240M98 210Q44 178 32 207Q64 237 98 210M100 195Q143 181 159 205Q120 222 100 195"/>`,'0 0 240 250');
    const feathers=()=>svg(many(9,i=>`<path d="M110 195Q${-15+i*13} ${40-i*4} ${30+i*12} ${12+i*7}Q${55+i*9} 110 110 195Z" fill="currentColor" fill-opacity=".14"/>`),'0 0 220 220');
    const city=()=>svg(many(15,i=>`<g transform="translate(${i*85-30} ${450-(i*47)%210})"><path d="M0 350V0H70V350" fill="#102433"/><path d="M8 0V-12H62V0"/>${many(5,j=>`<path d="M12 ${25+j*45}h12v17H12ZM44 ${25+j*45}h12v17H44Z" fill="#6fcbbd" fill-opacity=".2"/>`)}</g>`));
    const tarot=(symbol,i)=>`<div class="ds-tarot" style="--i:${i}"><div class="ds-card-back">${svg('<path d="M50 10 90 70 50 130 10 70Z M50 30 75 70 50 110 25 70Z"/><path d="M5 5H95V135H5Z"/>','0 0 100 140')}</div><div class="ds-card-face"><small>${['0 · THE FOOL','I · THE MAGICIAN','XXI · THE WORLD'][i%3]}</small><b>${symbol}</b><i>命 運</i></div></div>`;
    const wave=(count,cls)=>svg(`<g class="${cls}">${many(count,i=>`<path style="--i:${i}" d="M-100 ${480+i*16}C180 ${330+i*19} 400 ${680-i*12} 650 ${480+i*9}S1010 ${400+i*11} 1320 ${470+i*12}"/>`)}</g>`);
    // Persistent worlds: architecture at the edges, open reading space in the middle.
    const layer=(name,art)=>`<div class="dw-layer ${name}">${svg(art).replace('<svg ','<svg preserveAspectRatio="none" ')}</div>`;
    const flecks=(name,n)=>`<div class="${name}">${many(n,i=>`<i style="--i:${i};--x:${(i*73+11)%100}%;--y:${(i*41+7)%100}%"></i>`)}</div>`;
    function worldRose(){return `<div class="dw-rose">
        <div class="dw-rose-wash"></div>
        ${layer('dw-rose-lattice',many(2,side=>`<g transform="translate(${side?1200:0} 0) scale(${side?-1:1} 1)"><path d="M22 800V90Q22 25 120 25H400M48 800V120Q48 58 140 58H360"/>${many(13,i=>`<g transform="translate(35 ${125+i*51})"><path d="M0-23Q48 0 0 23Q-25 0 0-23ZM0-13Q28 0 0 13"/><circle cx="0" cy="0" r="3" fill="#ffd5b0"/></g>`)}<path d="M95 800Q5 660 90 550T80 290"/>${many(9,i=>`<path transform="translate(77 ${340+i*50}) rotate(${i%2?30:-35})" d="M0 0Q-40-35-48-4Q-25 20 0 0Q35-32 43-4Q20 20 0 0Z" fill="#9a416764"/>`)}</g>`))}
        ${layer('dw-rose-chains',many(3,i=>`<g style="--i:${i}"><path d="M${i*130} 0Q600 ${190+i*48} ${1200-i*130} 0"/>${many(19,j=>`<circle cx="${i*130+j*(1200-i*260)/18}" cy="${Math.sin(j/18*Math.PI)*(95+i*24)}" r="${j%3?2:4}" fill="#ffe0ad"/>`)}</g>`))}
        <div class="dw-rose-blooms">${many(8,i=>`<span style="--i:${i};--x:${i%2?94:0}%;--y:${5+Math.floor(i/2)*24}%">${rose()}</span>`)}</div>
        <div class="dw-rose-ribbons">${many(3,i=>layer('dw-rose-ribbon',`<path style="--i:${i}" d="M-100 ${710+i*20}C170 ${510+i*15} 250 950 650 740S1050 560 1300 ${760+i*12}" stroke-width="${12-i*3}"/>`))}</div>
        ${layer('dw-rose-score',many(5,i=>`<path d="M0 ${150+i*9}Q400 ${40+i*9} 800 ${150+i*9}T1400 ${150+i*9}"/>`)+many(12,i=>`<g transform="translate(${50+i*105} ${120+Math.sin(i)*40})"><ellipse rx="6" ry="4" fill="currentColor"/><path d="M5 0V-26l12 6"/></g>`))}
        ${flecks('dw-rose-petals',24)}${flecks('dw-rose-dust',22)}<div class="dw-response"></div></div>`;}
    function worldCat(){return `<div class="dw-cat"><div class="dw-cat-haze"></div>
        ${layer('dw-cat-far',many(25,i=>`<path d="M${i*51} 800V${420+(i*83)%190}h40V800" fill="#153445"/>`))}
        ${layer('dw-cat-near',many(2,s=>`<g transform="translate(${s?1200:0} 0) scale(${s?-1:1} 1)"><path d="M0 800V270H95V800M95 800V490H163V800" fill="#102632b0"/><path d="M10 270V248H84V270M25 248V195M0 405H100M0 410H100M99 492V470H155V492"/>${many(8,i=>`<g transform="translate(15 ${300+i*58})"><path d="M0 0h24v32H0ZM45 0h24v32H45Z" fill="#71e7cc22"/><path d="M0 12H24M45 12H69"/><path d="M88 0h48v20H88M92 0V-17M132 0V-17"/></g>`)}</g>`))}
        ${layer('dw-cat-cables','<path d="M0 35Q600 220 1200 25M0 55Q600 230 1200 47M0 260Q650 20 1200 215"/>'+many(10,i=>`<g transform="translate(${70+i*118} ${65+Math.sin(i/9*Math.PI)*80})"><path d="M0 0v18"/><rect x="-5" y="18" width="10" height="15" rx="4" fill="#9cfcdc"/></g>`))}
        <div class="dw-cat-sign"><b>夜</b><span>BLACK CAT</span><i>OPEN • 23:59</i></div>
        <div class="dw-cat-puddle">${svg(many(12,i=>`<ellipse style="--i:${i}" cx="${60+i*103}" cy="${700+i%3*28}" rx="${25+i%3*9}" ry="6"/>`))}</div>
        <div class="dw-cat-pass">${svg('<path d="M0 135 150 60H330L365 92H500V137Z" fill="#184250"/><path d="M160 72H320L344 94H137Z" fill="#8ee2ce55"/><circle cx="115" cy="135" r="22" fill="#142a33"/><circle cx="394" cy="135" r="22" fill="#142a33"/><path d="M490 116H580M-80 120H70" stroke="#dd6fc9" stroke-width="6"/>','0 0 600 180')}</div>
        ${layer('dw-cat-footsteps',many(12,i=>`<g style="--i:${i}" transform="translate(${100+i*86} ${750-Math.sin(i/11*Math.PI)*45}) rotate(-65)"><ellipse rx="6" ry="8" fill="currentColor"/><circle cx="-8" cy="-10" r="3"/><circle cx="0" cy="-14" r="3"/><circle cx="8" cy="-10" r="3"/></g>`))}
        ${flecks('dw-cat-rain',40)}<div class="dw-response"></div></div>`;}
    function worldCam(){return `<div class="dw-cam"><div class="dw-cam-mist"></div>
        ${layer('dw-cam-mountains',many(3,i=>`<path transform="translate(${i*330-100} ${i*30})" d="M0 800V625L90 440 150 510 260 195 350 400 440 330 600 720V800Z" fill="#438c8950"/><path transform="translate(${i*330-100} ${i*30})" d="M260 195 205 480 155 560M350 400 300 610M440 330 430 560"/>`))}
        ${layer('dw-cam-pavilion','<g transform="translate(880 505)"><path d="M-15 70Q75 50 115 0Q150 48 245 70L205 85H25Z" fill="#36636599"/><path d="M0 70Q115 115 230 70M35 85V235M195 85V235M60 92V235M170 92V235M15 235H215M25 245H205M55 145H175M55 200H175"/><path d="M62 150l22 22-22 22 22 22 22-22-22-22 22-22 22 22-22 22 22 22 22-22-22-22 22-22"/><path d="M-190 240Q-110 150-15 240M-175 240Q-110 180-30 240"/><path d="M-160 203v35M-130 189v31M-100 188v29M-70 199v24"/></g>')}
        ${layer('dw-cam-branches',many(2,s=>`<g transform="translate(${s?1200:0} 0) scale(${s?-1:1} 1)"><path d="M0 0Q130 145 200 245M45 55Q160 30 250 80M120 145Q80 260 135 325" stroke-width="5"/>${many(19,i=>`<path transform="translate(${20+(i*43)%200} ${25+(i*67)%240}) rotate(${i*28})" d="M0 0Q-28-30-33-9Q-17 7 0 0Q34-24 30-3Q14 10 0 0Z" fill="#83bc9c70"/>`)}</g>`))}
        ${layer('dw-cam-water',many(14,i=>`<path style="--i:${i}" d="M-20 ${680+i*9}Q180 ${640+i*9} 350 ${680+i*9}T750 ${680+i*9}T1250 ${680+i*9}"/>`))}
        ${layer('dw-cam-cranes',many(4,i=>`<g style="--i:${i}" transform="translate(${170+i*255} ${130+i%2*80})"><path d="M0 0Q-35-30-60-5Q-20-12 0 8Q28-24 65-30Q25-38 0 0Z" fill="#d9e9d3"/><path d="M0 4q15 13 22 3l10 4M-5 5l-15 20"/></g>`))}
        <div class="dw-cam-lanterns">${many(5,i=>`<span style="--i:${i};--x:${5+i*23}%">${svg('<path d="M50 0V60M25 60H75L85 110 75 160H25L15 110Z" fill="#f2dfa54a"/><path d="M25 60Q50 75 75 60M25 160Q50 145 75 160M35 67V154M65 67V154M50 160V200M43 180V204M57 180V204"/>','0 0 100 210')}</span>`)}</div>
        ${flecks('dw-cam-pollen',25)}<div class="dw-response"></div></div>`;}
    function worldKlein(){return `<div class="dw-klein"><div class="dw-klein-fog"></div>
        ${layer('dw-klein-arcade',many(2,s=>`<g transform="translate(${s?1200:0} 0) scale(${s?-1:1} 1)">${many(3,i=>`<g transform="translate(${i*55} ${i*55})"><path d="M10 800V190Q10 70 115 15Q215 70 215 190V800M25 800V195Q25 90 115 40Q200 90 200 195V800"/><path d="M45 600V210Q45 140 115 80Q185 140 185 210V600ZM115 80V600M45 230H185M45 360H185M45 490H185"/><path d="M115 100 155 210 115 285 75 210ZM115 305 155 390 115 470 75 390Z" fill="#75608f20"/></g>`)}</g>`))}
        ${layer('dw-klein-gears',many(4,i=>`<g transform="translate(${i%2?1130:60} ${190+Math.floor(i/2)*480})"><g class="dw-gear" style="--i:${i}"><circle r="65"/><circle r="49"/>${many(20,j=>`<path transform="rotate(${j*18})" d="M-5-62V-76H5V-62M0-48V-18"/>`)}<path d="M0-40V0L28 14" stroke-width="3"/></g></g>`))}
        ${layer('dw-klein-fate',many(11,i=>`<g style="--i:${i}"><path d="M${i*117} 0Q${i*117+35} 130 ${i*117+5} ${120+i%4*35}"/><path transform="translate(${i*117+5} ${120+i%4*35})" d="M0 0l-10 20 10 18 10-18ZM0 38v20m-13-8 13 5 13-5"/></g>`))}
        <div class="dw-klein-pages">${many(6,i=>`<span style="--i:${i};--x:${i%2?91:1}%;--y:${18+Math.floor(i/2)*26}%">${svg('<path d="M10 5H100V140H10Z" fill="#79698730"/><path d="M20 20H90M20 27H90M20 115H90M20 122H90M55 40 80 72 55 104 30 72ZM40 72H70M55 55V90"/>','0 0 110 145')}</span>`)}</div>
        ${layer('dw-klein-seals',many(7,i=>`<g transform="translate(${75+i*175} 760)"><path d="M0-30 25-15V15L0 30-25 15V-15ZM0-20 15 0 0 20-15 0Z"/><path d="M0-40V-30M-35 0H-25M25 0H35"/></g>`))}
        ${flecks('dw-klein-embers',26)}<div class="dw-response"></div></div>`;}
    function worldStarry(){return `<div class="dw-starry"><div class="dw-starry-pigment"></div>
        ${layer('dw-starry-vortex',many(3,j=>`<g transform="translate(${170+j*430} ${90+j%2*90})">${many(14,i=>`<path style="--i:${i}" d="M${-200-i*5} ${20+i*7}C-180 ${-160-i*8} 220 ${-130-i*4} ${160+i*3} ${25+i*8}S-40 180-70 70S70-20 100 40" stroke="${i%4?'#719fd3':'#e5c478'}" stroke-width="${i%3+1}"/>`)}</g>`))}
        ${layer('dw-starry-stars',many(22,i=>`<g transform="translate(${(i*173)%1200} ${20+(i*43)%280})" style="--i:${i}" class="dw-painted-star"><circle r="${9+i%4*4}" stroke="#d1b46b"/><circle r="${5+i%4*3}" stroke-dasharray="3 5"/>${star(0,0,5+i%4)}</g>`))}
        ${layer('dw-starry-hills','<path d="M0 800V650Q220 440 480 680Q760 480 1200 650V800Z" fill="#283e6c80"/><path d="M0 800V750Q400 620 650 720T1200 730V800Z" fill="#24325699"/>')}
        ${layer('dw-starry-village',many(18,i=>`<g transform="translate(${i*73-30} ${685+i%4*15})"><path d="M0 130V0L30-40 62 0V130Z" fill="#284769"/><path d="M-5 0 30-40 67 0M12 17h12v20H12ZM38 17h12v20H38ZM12 60h12v20H12Z" fill="#edc86555"/><path d="M40-26V-48h8v35"/></g>`))}
        ${layer('dw-starry-cypress','<path d="M0 800Q40 660 25 570Q60 610 65 490Q120 600 98 710Q145 650 130 790L145 800Z" fill="#1c3c5299"/><path d="M60 800Q80 700 66 580M40 760 58 700M90 730 110 685"/>')}
        ${layer('dw-starry-comets',many(3,i=>`<g style="--i:${i}"><path d="M${130+i*400} ${220+i*50}q95-90 190-40" stroke-dasharray="160"/><path d="M${155+i*400} ${230+i*50}q90-85 165-50" stroke-opacity=".4"/></g>`))}
        ${flecks('dw-starry-dabs',32)}<div class="dw-response"></div></div>`;}
    function worldAether(){return `<div class="dw-aether"><div class="dw-aether-sunrise"></div>
        ${layer('dw-aether-vault',many(2,s=>`<g transform="translate(${s?1200:0} 0) scale(${s?-1:1} 1)"><path d="M15 800V170Q30 30 310 0M55 800V185Q85 75 350 0M95 800V210Q120 115 390 0" stroke-width="2"/>${many(10,i=>`<path transform="translate(42 ${250+i*51})" d="M0-18 18 0 0 18-18 0ZM-27 24H27"/>`)}<path d="M130 800V290Q135 180 250 130V800M145 800V300Q150 210 235 157V800M165 800V330Q175 260 213 230V800"/></g>`))}
        ${layer('dw-aether-prisms',many(9,i=>`<g transform="translate(${65+i*135} ${50+i%3*32})" style="--i:${i}" class="dw-prism"><path d="M0-30 17 0 0 45-17 0Z" fill="#ffecb138"/><path d="M0-30V45M-17 0H17"/><path d="M-9 50-30 310H30L9 50" fill="#ffe5a20a" stroke="none"/></g>`))}
        ${layer('dw-aether-clouds',many(4,i=>`<path style="--i:${i}" d="M-100 ${640+i*36}Q80 ${550+i*32} 210 ${650+i*28}Q440 ${550+i*28} 660 ${650+i*30}Q870 ${560+i*24} 1300 ${630+i*38}" stroke-width="${15+i*10}" stroke="#fff5cb" stroke-opacity=".07"/>`))}
        ${layer('dw-aether-inscriptions',many(2,s=>`<g transform="translate(${s?1180:20} 0)">${many(14,i=>`<path transform="translate(0 ${65+i*49})" d="M0-10 6 0 0 10-6 0ZM-9-13H9M-9 13H9M0-18V-13M0 13V18"/>`)}</g>`))}
        <div class="dw-aether-plumes">${many(12,i=>`<span style="--i:${i};--x:${(i*47)%100}%">${feathers()}</span>`)}</div>
        ${layer('dw-aether-floor',many(10,i=>`<path d="M${600+(i-5)*16} 670L${(i-2)*200} 800"/>`)+many(5,i=>`<path d="M0 ${690+i*24}H1200"/>`))}
        ${flecks('dw-aether-motes',32)}<div class="dw-response"></div></div>`;}
    function worldNyx(){return `<div class="dw-nyx"><div class="dw-nyx-nebula"></div>
        ${layer('dw-nyx-lace',many(2,s=>`<g transform="translate(${s?1200:0} 0) scale(${s?-1:1} 1)"><path d="M15 800Q75 600 35 400T45 0M55 800Q115 600 75 400T85 0"/>${many(12,i=>`<g transform="translate(55 ${35+i*67})"><path d="M0-32Q55-25 30 0Q55 30 0 32Q-45 20-25 0Q-45-22 0-32ZM0-22Q30 0 0 22Q-20 0 0-22Z"/><circle r="4" fill="#b494d7"/></g>`)}</g>`))}
        ${layer('dw-nyx-aurora',many(15,i=>`<path style="--i:${i}" d="M-30 ${60+i*7}Q280 ${-130+i*13} 570 ${140+i*9}T1250 ${120+i*12}" stroke="${i%3?'#8273c6':'#70a3ba'}" stroke-width="${5+i%4}"/>`))}
        ${layer('dw-nyx-moon', '<circle cx="1040" cy="160" r="65" fill="#a98fc824"/><path d="M1070 100A65 65 0 1 0 1070 220A85 85 0 0 1 1070 100Z" fill="#d0b6eb55"/>'+many(18,i=>`<path transform="translate(1040 160) rotate(${i*20})" d="M0-78v-9"/>`))}
        ${layer('dw-nyx-map',many(12,i=>`<g style="--i:${i}" transform="translate(${(i*211)%1100+40} ${30+(i*127)%650})"><path d="M0 0 24-20 51 3 65-40" stroke-opacity=".35"/>${star(0,0,3)}${star(24,-20,2)}${star(51,3,4)}${star(65,-40,2)}</g>`))}
        ${layer('dw-nyx-tides',many(16,i=>`<path style="--i:${i}" d="M-100 ${660+i*9}C200 ${560+i*10} 350 ${830-i*3} 650 ${685+i*7}S950 ${600+i*9} 1300 ${700+i*7}" stroke="${i%3?'#8c76b4':'#b7a4dd'}"/>`))}
        <div class="dw-nyx-jellies">${many(5,i=>`<span style="--i:${i};--x:${i%2?91:1}%;--y:${22+i*13}%">${svg('<path d="M15 70Q10 0 60 10Q110 0 105 70Q60 45 15 70Z" fill="#b394eb24"/><path d="M23 66Q60 44 97 66M25 67Q5 100 35 120T20 180M45 61Q75 110 45 140T60 210M65 61Q90 100 68 160M85 65Q110 110 85 140T95 200"/>','0 0 120 220')}</span>`)}</div>
        ${flecks('dw-nyx-lights',35)}<div class="dw-response"></div></div>`;}

    const pentagram=(cx,cy,r)=>`<polygon points="${many(10,i=>{const a=i*Math.PI/5-Math.PI/2,d=i%2?r*.382:r;return `${cx+Math.cos(a)*d},${cy+Math.sin(a)*d} `})}"/>`;
    const maple=()=>svg('<path d="M60 12 69 43 92 28 87 55 115 51 95 74 104 84 73 88 60 111 48 89 17 87 27 75 5 54 33 56 26 29 51 44Z" fill="#c979344f"/><path d="M60 125V24M60 71 34 43M60 71 85 43M60 83 23 63M60 83 98 63M60 91 35 83M60 91 86 83"/>','0 0 120 130');
    const craneWing=()=>svg('<path d="M100 110Q80 90 73 65L25 30Q10 10 0 0Q65 15 91 65L110 86Q150 25 220 25Q195 58 155 75L126 100Q125 117 144 106L158 109 139 116Q113 133 100 110Z" fill="#e4f3e973"/><path d="M28 28 76 64M46 27 82 60M174 46 130 85M190 42 141 75M107 117 88 147M114 117 99 151"/>','0 0 225 160');
    function worldViet(){return `<div class="dw-viet"><div class="dv-atmosphere"></div>
        ${layer('dv-bronze',many(2,s=>`<g transform="translate(${s?1160:40} ${s?680:110})"><g class="dv-drum"><circle r="155" fill="#9e47271c"/><circle r="149"/><circle r="132"/><circle r="106"/><circle r="84"/>${many(32,i=>`<path transform="rotate(${i*11.25})" d="M-5-138 0-148 5-138ZM-4-112V-126H4V-112Z"/>`)}${many(14,i=>`<path transform="rotate(${i*360/14})" d="M0-73 6-30 0-11-6-30Z" fill="#c79f574a"/>`)}<circle r="14"/>${many(8,i=>`<g transform="rotate(${i*45}) translate(0 -94)"><path d="M-20 2-5-5 18-9 6-2 20 4 0 3-11 12-8 2Z" fill="#ac783c55"/></g>`)}</g></g>`))}
        ${layer('dv-silk',many(3,i=>`<path style="--i:${i}" d="M-50 ${i*17+5}Q230 ${180+i*13} 600 ${60+i*12}T1280 ${120+i*15}" stroke="#b63946" stroke-width="${20-i*5}"/>`))}
        ${layer('dv-rice',many(2,s=>`<g transform="translate(${s?1185:15} 800) scale(${s?-1:1} 1)"><path d="M0 0Q110-130 65-360"/>${many(12,i=>`<g transform="translate(${16+Math.sin(i/11*Math.PI)*55} ${-25-i*27})"><path d="M0 0Q-33-38-34-17Q-25 2 0 0Q31-36 34-16Q24 4 0 0Z" fill="#c8a45444"/></g>`)}</g>`))}
        ${layer('dv-lac-flight',many(7,i=>`<g style="--i:${i}" transform="translate(${80+i*180} ${170+i%3*30})"><path d="M-38 0-6-14 29-25 7-7 35 8 4 2-22 19-14 0Z" fill="#ad763556"/><path d="M-6-14-18-29 0-17M29-25 40-27"/></g>`))}
        ${layer('dv-horizon','<path d="M0 800V760L130 690 205 740 370 675 490 745 640 710 750 750 930 690 1100 735 1200 680V800Z" fill="#956e2b1c"/>'+many(9,i=>`<path d="M-20 ${744+i*9}Q300 ${700+i*9} 600 ${747+i*8}T1250 ${735+i*10}"/>`))}
        <div class="dv-pennants">${many(5,i=>`<span style="--i:${i};--x:${12+i*19}%">${svg('<path d="M50 0V35M18 35H82V135L50 115 18 135Z" fill="#ac294853"/>'+pentagram(50,72,18),'0 0 100 145')}</span>`)}</div>
        ${flecks('dv-gold',30)}<div class="dw-response"></div></div>`;}
    function worldHac(){return `<div class="dw-hac"><div class="dh-air"></div>
        ${layer('dh-islands',many(3,i=>`<g transform="translate(${i*450-45} ${500+i%2*110})"><path d="M0 0Q120-60 265 0L215 42 175 65 120 115 80 50 25 32Z" fill="#6fa2a34c"/><path d="M25 8 82 30 120 100M195 15 175 50 137 77M85-17V-140H115V-15M177-8V-140H207V-6"/><path d="M55-140Q138-158 146-184Q170-151 235-140L207-124H83Z" fill="#aad0c657"/><path d="M70-147Q146-133 220-147M93-118H200M93-98H199"/><path d="M95-20V-87H194V-14M143-87V-15"/><path d="M112 30Q138 100 112 320M127 38Q151 120 129 350M141 27Q165 130 144 335" stroke="#d2f1e2" stroke-opacity=".5"/></g>`))}
        ${layer('dh-bridges','<path d="M190 550Q365 490 485 645M190 564Q365 514 485 659M685 642Q840 442 955 525M685 656Q840 466 955 539"/>'+many(16,i=>`<path d="M${225+i*15} ${540+Math.pow(i/15,2)*90}v18"/>`))}
        ${layer('dh-cloud-rivers',many(12,i=>`<path style="--i:${i}" d="M-100 ${100+i*13}C150 ${280-i*3} 300 ${-120+i*20} 650 ${90+i*15}S1020 ${-10+i*13} 1300 ${160+i*11}"/>`))}
        <div class="dh-flock">${many(7,i=>`<span style="--i:${i};--x:${(i*19)%98}%;--y:${8+i%3*11}%">${craneWing()}</span>`)}</div>
        ${layer('dh-orchids',many(2,s=>`<g transform="translate(${s?1190:10} 800) scale(${s?-1:1} 1)"><path d="M0 0Q40-120 120-180M15 0Q15-180 65-260M35 0Q110-100 150-100"/>${many(5,i=>`<g transform="translate(${25+i*25} ${-100-i%3*55})"><path d="M0 0Q-50-50-33-60Q5-55 0 0Q15-80 34-50Q35-15 0 0Q-25 30-35 5Q-28-15 0 0Q50-25 47 4Q25 28 0 0Z" fill="#c6dfd57a"/></g>`)}</g>`))}
        ${flecks('dh-feather-seeds',24)}<div class="dw-response"></div></div>`;}
    function worldAcedia(){return `<div class="dw-acedia"><div class="da-dusk"></div>
        ${layer('da-sleep-drapes',many(2,s=>`<g transform="translate(${s?1200:0} 0) scale(${s?-1:1} 1)"><path d="M0 0H210Q185 140 72 290Q130 570 0 800Z" fill="#5b426633"/>${many(8,i=>`<path d="M${10+i*24} 0Q${180+i*4} 140 72 290Q${85+i*9} 530 ${i*4} 800"/>`)}<path d="M0 340Q65 310 85 267M0 356Q65 326 95 275" stroke-width="3"/>${many(8,i=>`<path d="M${i*10} ${340-i*8}v${25+i*2}l-3 8h6l-3-8"/>`)}</g>`))}
        ${layer('da-dream-web',many(9,i=>`<path style="--i:${i}" d="M${i*35} 0Q600 ${130+i*28} ${1200-i*35} 0M0 ${i*25}Q${100+i*20} 400 0 ${800-i*25}"/>`))}
        <div class="da-hourglasses">${many(7,i=>`<span style="--i:${i};--x:${6+i*14.5}%;--y:${i%2?70:15}px">${svg('<path d="M60 0V70M30 70H90M30 75Q30 105 56 118Q30 134 30 166H90Q90 134 64 118Q90 105 90 75ZM25 171H95"/><path d="M38 85H82L60 110Z M38 161 60 143 82 161Z" fill="#c7b6d660"/><path d="M60 115V143" stroke-dasharray="2 5"/>','0 0 120 180')}</span>`)}</div>
        ${layer('da-pillows',many(2,s=>`<g transform="translate(${s?1100:90} 690)"><path d="M-90-5Q0-55 95-5L75 38Q0 70-75 38Z" fill="#59466438"/><path d="M-78-5Q0-35 82-5M-65 30Q0 51 65 30"/><path d="M-25 0 0-15 25 0 0 15Z"/><path d="M-70 35v18M-45 45v18M-20 50v18M10 52v18M40 47v18M65 38v18"/></g>`))}
        ${layer('da-sleep-seals',many(7,i=>`<g style="--i:${i}" transform="translate(${85+i*170} 760)"><path d="M0-23 20-12V12L0 23-20 12V-12ZM-10 0Q0 12 10 0"/><text text-anchor="middle" y="-30" fill="currentColor" stroke="none" font-size="12">${['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ'][i]}</text></g>`))}
        <div class="da-moths">${many(8,i=>`<span style="--i:${i};--x:${i%2?90:3}%;--y:${18+Math.floor(i/2)*18}%">${svg('<path d="M60 65Q-5-20 5 45Q10 90 60 70Q115 92 115 45Q125-20 60 65Z" fill="#c2afce38"/><path d="M60 65Q5 85 30 115Q50 120 60 75Q75 125 94 110Q115 85 60 65M60 40V93M60 48 49 29M60 48 73 29"/><path d="M24 52 43 60 28 71 17 60ZM97 52 77 60 93 71 104 60Z"/>','0 0 120 130')}</span>`)}</div>
        ${flecks('da-dream-dust',32)}<div class="dw-response"></div></div>`;}
    function worldAutumn(){return `<div class="dw-autumn"><div class="dt-glow"></div>
        ${layer('dt-forest',many(2,s=>`<g transform="translate(${s?1200:0} 0) scale(${s?-1:1} 1)">${many(4,i=>`<path d="M${12+i*28} 800Q${5+i*20} 430 ${28+i*22} 20M${18+i*24} 310 ${100+i*40} 120M${12+i*24} 540 ${85+i*25} 375" stroke-width="${8-i}"/>`)}</g>`))}
        <div class="dt-canopy">${many(18,i=>`<span style="--i:${i};--x:${i%2?86+(i%3)*4:(i%3)*5}%;--y:${Math.floor(i/2)*8-5}%">${maple()}</span>`)}</div>
        ${layer('dt-brook',many(10,i=>`<path style="--i:${i}" d="M-100 ${710+i*10}Q300 ${580+i*12} 600 ${700+i*10}T1300 ${680+i*11}"/>`))}
        ${layer('dt-stones',many(12,i=>`<path transform="translate(${i*110} ${750+i%2*25})" d="M-35 10Q-25-30 5-18Q40-25 45 10Z" fill="#93674624"/>`))}
        <div class="dt-amber">${many(6,i=>`<span style="--i:${i};--x:${8+i*17}%">${svg('<path d="M50 0V62M50 62 75 95 65 142 37 145 25 101Z" fill="#bb792633"/><path d="M50 62 40 103 37 145M75 95 40 103 65 142M40 103 25 101M50 88Q67 117 45 130Q37 107 50 88Z"/>','0 0 100 160')}</span>`)}</div>
        <div class="dt-falling">${many(24,i=>`<span style="--i:${i};--x:${(i*47)%100}%">${maple()}</span>`)}</div>
        ${flecks('dt-fireflies',28)}<div class="dw-response"></div></div>`;}
    function worldSummer(){return `<div class="dw-summer"><div class="du-heat"></div>
        ${layer('du-colonnade',many(2,s=>`<g transform="translate(${s?1200:0} 0) scale(${s?-1:1} 1)"><path d="M10 800V170Q10 65 130 50Q245 65 245 170V800M27 800V170Q30 85 130 70Q225 85 228 170V800"/><path d="M48 800V200H89V800M175 800V200H216V800M35 192H100V210H35ZM165 192H226V210H165Z" fill="#c8a85822"/><path d="M57 230V780M67 230V780M78 230V780M187 230V780M197 230V780M207 230V780"/><path d="M48 156Q130-5 216 156H48Z" fill="#caa66117"/>${many(8,i=>`<path d="M130 82L${55+i*22} 155"/>`)}</g>`))}
        ${layer('du-solar-mosaic',many(2,s=>`<g transform="translate(${s?1120:80} ${s?650:130})"><circle r="75"/><circle r="58"/>${many(18,i=>`<g transform="rotate(${i*20})"><path d="M0-60 8-82 0-105-8-82Z" fill="#e5c56638"/><path d="M0-110v-12"/></g>`)}<circle r="26" fill="#efd28030"/>${many(12,i=>`<path transform="rotate(${i*30})" d="M0-30 5-45 0-55-5-45Z"/>`)}</g>`))}
        <div class="du-sunflowers">${many(4,i=>`<span style="--i:${i};--x:${i%2?89:0}%;--y:${50+Math.floor(i/2)*29}%">${svg(many(15,j=>`<path transform="rotate(${j*24} 80 80)" d="M80 60Q52 15 80 3Q108 15 80 60Z" fill="#d9ae5044"/>`)+'<circle cx="80" cy="80" r="25" fill="#8e6a4a50"/>'+many(19,j=>`<circle cx="${65+(j*7)%31}" cy="${64+(j*11)%32}" r="1.4"/>`),'0 0 160 160')}</span>`)}</div>
        ${layer('du-water-light',many(15,i=>`<path style="--i:${i}" d="M-50 ${680+i*8}Q120 ${620+i*10} 260 ${700+i*7}T650 ${675+i*9}T1250 ${700+i*7}"/>`))}
        ${layer('du-rays',many(8,i=>`<path style="--i:${i}" d="M600-50 ${-100+i*200} 800" stroke-width="${8+i%3*7}" stroke="#e4c570"/>`))}
        <div class="du-dragonflies">${many(6,i=>`<span style="--i:${i};--x:${10+i*17}%;--y:${18+i%3*15}%">${svg('<path d="M60 25V115M60 55Q0 0 5 35Q20 65 60 60Q-2 55 9 79Q35 86 60 66Q89 89 114 76Q121 52 60 60Q116 65 118 31Q105 0 60 55Z" fill="#e4d3a648"/><circle cx="60" cy="27" r="5"/>','0 0 125 125')}</span>`)}</div>
        ${flecks('du-pollen',30)}<div class="dw-response"></div></div>`;}

    const designs={
        viet:{world:worldViet}, hac:{world:worldHac}, acedia:{world:worldAcedia}, autumn:{world:worldAutumn}, summer:{world:worldSummer},
        rose:{
            title:'Bóng Hồng · Đêm Diễn Độc Tôn',stages:['Hậu trường','Mở màn','Encore','Hạ màn'],
            world:worldRose,
            ultimate:()=>`<div class="rose-show"><div class="rose-curtain curtain-l"></div><div class="rose-curtain curtain-r"></div><div class="rose-marquee"><i>ONE NIGHT ONLY</i><b>TAMON</b><span>THE ROSE ENCORE</span></div><div class="rose-spots">${many(5,i=>`<i style="--i:${i}"></i>`)}</div><div class="rose-runway"></div><div class="rose-microphone">${svg('<rect x="78" y="15" width="44" height="95" rx="22" fill="#48223d"/><path d="M70 65V90Q70 125 100 125Q130 125 130 90V65M100 125V270M65 278Q100 263 135 278" stroke-width="5"/><path d="M85 35H115M85 48H115M85 61H115M85 74H115M85 87H115"/>','0 0 200 300')}</div><div class="rose-bouquet">${many(6,i=>`<span style="--i:${i}">${rose()}</span>`)}</div><div class="rose-confetti">${many(32,i=>`<i style="--i:${i};--x:${(i*37)%100}%"></i>`)}</div></div>`,
            realm:()=>`<div class="rose-pet-bouquet">${rose()}${rose()}</div>`
        },
        cat:{
            title:'Hắc Miêu · Vệt Đêm Phản Chiếu',stages:['Tín hiệu đêm','Truy ảnh','Phá khung','Im lặng'],
            world:worldCat,
            ultimate:()=>`<div class="cat-comic"><div class="cat-panel panel-one"><span>23:59</span><div class="cat-eye"><i></i><i></i></div></div><div class="cat-panel panel-two">${svg('<path d="M80 440 290 350 370 180 500 170 575 90 640 160 710 155 770 240 680 285 560 240 460 390 300 430 180 580Z" fill="#111627"/><path d="M320 390Q200 170 130 240Q80 300 175 340" stroke-width="28"/><path d="M590 194 618 188M655 195 683 189" stroke="#b4ffe1" stroke-width="10"/>')}<b>影</b></div><div class="cat-panel panel-three"><b>BREAK<br>THE NIGHT</b><span>TAMON / BLACK CAT</span></div><div class="cat-claws">${many(3,i=>`<i style="--i:${i}"></i>`)}</div><div class="cat-speed">${many(12,i=>`<i style="--i:${i}"></i>`)}</div></div>`,
            realm:()=>`<div class="cat-pet-sign"><b>夜</b><i></i><i></i></div>`
        },
        cam:{
            title:'Lạc Thanh Huyền · Thất Huyền Hóa Cảnh',stages:['Trải lụa','Khảy đàn','Sơn thủy hiện','Dư âm'],
            world:worldCam,
            ultimate:()=>`<div class="cam-recital"><div class="cam-scroll"><i class="cam-roller roller-l"></i><i class="cam-roller roller-r"></i><div class="cam-ink-landscape">${svg('<path d="M50 620 190 250 270 355 390 120 500 320 600 260 735 455 845 205 1050 580 1160 410V780H50Z" fill="#184c56" fill-opacity=".38"/><path d="M390 120 355 430 305 495M845 205 790 545M270 355 230 520M500 320 450 540M600 260 610 500" stroke-width="4"/><path d="M0 680Q260 460 500 660T1200 660" stroke-width="8"/>')}</div><div class="cam-seal">清<br>玄</div></div><div class="cam-qin"><div class="cam-qin-body"></div>${many(7,i=>`<i class="cam-string" style="--i:${i}"></i>`)}${many(13,i=>`<b class="cam-inlay" style="--i:${i}"></b>`)}</div><div class="cam-notes">${many(9,i=>`<span style="--i:${i}">${svg('<path d="M5 75Q65-15 135 55Q185 105 235 20M5 88Q65-2 135 68Q185 118 235 33"/>','0 0 240 120')}</span>`)}</div></div>`
        },
        klein:{
            title:'Klein · Nghị Hội Trên Màn Sương',stages:['Triệu hồi','Lật vận mệnh','Nghị hội','Khép màn sương'],
            world:worldKlein,
            ultimate:()=>`<div class="klein-council"><div class="klein-door door-l">${svg('<path d="M20 780V170Q300-130 580 170V780ZM55 760V180Q300-50 545 180V760Z"/><path d="M120 650V250Q300 50 480 250V650ZM300 175V650M140 660H460"/><path d="M300 240 395 430 300 600 205 430Z"/>','0 0 600 800')}</div><div class="klein-door door-r"></div><div class="klein-table"><div class="klein-tabletop"></div>${many(12,i=>`<i class="klein-seat" style="--i:${i};--x:${i<6?15:77}%;--y:${15+(i%6)*13}%"></i>`)}<div class="klein-candles">${many(6,i=>`<i style="--i:${i}"></i>`)}</div></div><div class="klein-reveal">${tarot('♧',0)}${tarot('✦',1)}${tarot('∞',2)}</div><div class="klein-mist-floor"></div></div>`
        },
        starry:{
            title:'Tinh Dạ · Hải Trình Trong Tranh',stages:['Nét cọ đầu','Hạ thủy','Bắc cầu sao','Xa bến'],
            world:worldStarry,
            ultimate:()=>`<div class="starry-voyage"><div class="starry-canvas"><div class="starry-sea">${wave(16,'starry-currents')}</div><div class="starry-bridge">${svg('<path d="M80 420Q560 80 1110 320" pathLength="100" stroke-width="3"/>'+many(13,i=>star(80+i*83,420-Math.sin(i/12*Math.PI)*190-i*8,8+i%3)))}</div><div class="starry-boat">${svg('<path d="M20 155Q150 205 290 145L242 200H80Z" fill="#274979"/><path d="M155 155V12L265 132H165M142 35 55 141H142Z" fill="#e9d393" fill-opacity=".7"/><path d="M175 145V63M70 173Q155 196 250 166"/>','0 0 310 230')}</div><div class="starry-comet">${svg('<path d="M20 130Q220 40 520 70" stroke-width="3"/>'+star(520,70,18),'0 0 560 180')}</div><div class="starry-brush-tip"></div></div></div>`
        },
        aether:{
            title:'AETHER · Sáng Thế Thiên Dực',stages:['Bình minh','Thiên dực mở','Ban ánh sáng','Ngày mới'],
            world:worldAether,
            ultimate:()=>`<div class="aether-genesis"><div class="aether-horizon"></div><div class="aether-creation-line"></div><div class="aether-wing wing-l">${svg(many(14,i=>`<g style="--i:${i}"><path d="M570 600Q${350-i*17} ${440-i*15} ${35+i*18} ${30+i*22}Q${180+i*20} ${360+i*11} 570 600Z" fill="${i%2?'#edd99b':'#fff2c9'}" fill-opacity=".45"/><path d="M570 600Q${310-i*6} ${370+i*8} ${35+i*18} ${30+i*22}"/></g>`),'0 0 600 650')}</div><div class="aether-wing wing-r">${svg(many(14,i=>`<path style="--i:${i}" d="M570 600Q${350-i*17} ${440-i*15} ${35+i*18} ${30+i*22}Q${180+i*20} ${360+i*11} 570 600Z" fill="#fff1be" fill-opacity=".4"/>`),'0 0 600 650')}</div><div class="aether-core">${svg('<path d="M100 0 160 100 100 210 40 100Z" fill="#fff9dd"/><path d="M100 0V210M40 100H160M100 20 145 100 100 188 55 100Z"/>','0 0 200 220')}</div><div class="aether-blessing">${many(20,i=>`<span style="--i:${i};--x:${(i*31)%100}%">${feathers()}</span>`)}</div></div>`
        },
        nyx:{
            title:'NYX · Vương Miện Của Vĩnh Dạ',stages:['Tắt tinh tú','Triều đêm lên','Đăng miện','Vĩnh tĩnh'],
            world:worldNyx,
            ultimate:()=>`<div class="nyx-coronation"><div class="nyx-consuming-sky">${svg(many(45,i=>`<g style="--i:${i}">${star((i*151)%1200,(i*113)%650,3+i%4)}</g>`))}</div><div class="nyx-black-sea">${wave(15,'nyx-royal-waves')}</div><div class="nyx-crown">${svg('<path d="M100 500 45 195 190 300 240 105 350 275 450 40 550 275 660 105 710 300 855 195 800 500Z" fill="#241338" stroke-width="3"/><path d="M125 455 93 263 200 355 263 185 360 335 450 120 540 335 637 185 700 355 807 263 775 455Z" fill="#6d4888" fill-opacity=".35"/><path d="M100 500Q450 620 800 500M108 525Q450 645 792 525" stroke-width="5"/>'+many(7,i=>`<g transform="translate(${155+i*98} 435)"><path d="M0-55 24-20 0 25-24-20Z" fill="#c9a7ec" fill-opacity=".5"/><path d="M0-55V25M-24-20H24"/></g>`),'0 0 900 650')}</div><div class="nyx-velvet">${many(7,i=>`<i style="--i:${i}"></i>`)}</div><div class="nyx-afterstars">${svg(many(9,i=>star(180+i*100,150+(i%2)*70,8)))}</div></div>`
        }
    };
    class DistinctScene extends HTMLElement {
        connectedCallback(){
            if(this.started)return;this.started=true;this.events=new AbortController();this.timers=new Set();
            const update=()=>{
                const quiet=document.hidden||document.body.classList.contains('wfx-low-power')||window.isExamVisualItemsSuspended===true||Boolean(window.currentActiveExamId);
                this.quiet=quiet;
                this.style.setProperty('visibility',quiet?'hidden':'visible','important');
                this.shadowRoot.querySelector('.ds-scene')?.classList.toggle('ds-paused',quiet);
                if(quiet&&this.mode==='ultimate')this.remove();
            };
            document.addEventListener('visibilitychange',update,{signal:this.events.signal});
            this.observer=new MutationObserver(update);this.observer.observe(document.body,{attributes:true,attributeFilter:['class']});update();
            if(!this.isConnected)return;
            if(this.mode==='world'){
                const scene=this.shadowRoot.querySelector('.ds-scene');
                const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
                document.addEventListener('pointermove',event=>{
                    if(this.quiet||reduced()||event.pointerType!=='mouse')return;
                    this.point={x:event.clientX,y:event.clientY};
                    if(this.frame)return;
                    this.frame=requestAnimationFrame(()=>{this.frame=0;if(!this.isConnected||this.quiet)return;
                        scene.style.setProperty('--dx',((this.point.x/innerWidth-.5)*9)+'px');
                        scene.style.setProperty('--dy',((this.point.y/innerHeight-.5)*6)+'px');
                    });
                },{passive:true,signal:this.events.signal});
                document.addEventListener('pointerup',event=>{
                    if(this.quiet||reduced())return;
                    scene.style.setProperty('--touch-x',event.clientX+'px');scene.style.setProperty('--touch-y',event.clientY+'px');
                    this.response?.cancel();this.response=scene.querySelector('.dw-response')?.animate([{opacity:.6,scale:'.2'},{opacity:0,scale:'1.5'}],{duration:1300,easing:'ease-out'});
                },{passive:true,signal:this.events.signal});
            }
            if(this.mode==='ultimate'&&matchMedia('(prefers-reduced-motion: reduce)').matches){this.phase(2);return;}
            if(this.mode==='ultimate')for(const [phase,delay]of [[1,1600],[2,3900],[3,6500]]){
                const timer=setTimeout(()=>{this.timers.delete(timer);this.phase(phase);},delay);this.timers.add(timer);
            }
        }
        phase(value){this.shadowRoot.querySelector('.ds-scene').dataset.phase=value;const caption=this.shadowRoot.querySelector('.ds-caption small');if(caption)caption.textContent=designs[this.kind].stages[value];}
        disconnectedCallback(){cancelAnimationFrame(this.frame);this.frame=0;this.response?.cancel();this.events?.abort();this.observer?.disconnect();this.timers?.forEach(clearTimeout);this.timers?.clear();this.started=false;}
    }
    if(!customElements.get('luxury-distinct-scene'))customElements.define('luxury-distinct-scene',DistinctScene);
    window.LuxuryDistinctScenes={
        has:kind=>Object.hasOwn(designs,kind),
        create(kind,mode){
            const design=designs[kind];if(!design)throw Error('Unknown luxury scene: '+kind);
            const host=document.createElement('luxury-distinct-scene');host.kind=kind;host.mode=mode;
            host.setAttribute('aria-hidden','true');host.dataset.distinctScene=kind;host.dataset.distinctMode=mode;
            host.style.cssText=`all:initial!important;display:block!important;position:${mode==='realm'?'absolute':'fixed'}!important;inset:${mode==='realm'?'-15% -18%':'0'}!important;width:auto!important;height:auto!important;pointer-events:none!important;z-index:${mode==='ultimate'?2147482500:mode==='realm'?0:950}!important;overflow:hidden!important;opacity:1!important;transform:none!important;animation:none!important;`;
            const markup=mode==='ultimate'?design.ultimate():mode==='world'?design.world():design.realm?.()||'';
            host.attachShadow({mode:'open'}).innerHTML=`<link rel="stylesheet" href="${css}"><div class="ds-scene ds-${kind} ds-${mode}" data-phase="0">${markup}${mode==='ultimate'?`<div class="ds-caption"><strong>${design.title}</strong><small>${design.stages[0]}</small></div>`:''}</div>`;
            return host;
        }
    };
})();
