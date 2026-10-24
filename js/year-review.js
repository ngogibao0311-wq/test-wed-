/* Ôn lại năm cũ: display only. Rewards and progression are confirmed by Worker. */
(() => {
    'use strict';
    if(window.YearReview)return;
    const CONFIG = {testPreview:true, version:'20261022.review6'};
    const protocol = '1', labels = ['Dấu chân học tập','Những điểm số','Coin đã sử dụng','Những tấm vé','Bạn đồng hành','Món quà cuối năm'];
    let scene = null, activatedUid = null, nextUsageAt = 0, recovering = false;
    const observed = new Set();
    const auth = () => window.firebase?.auth?.().currentUser;
    const serverNow = () => Date.now() + (Number(window.__serverTimeOffset) || 0);
    function calendar(now = serverNow()) {
        const d = new Date(now+25200000);
        return {year:String(d.getUTCFullYear()),open:d.getUTCMonth()===11&&d.getUTCDate()===31};
    }
    const fmt = n => Number(n).toLocaleString('vi-VN',{maximumFractionDigits:2});
    const dateText = t => new Date(t).toLocaleDateString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'});
    const CSS = `
      :host{all:initial;display:block;height:100%;min-height:0;color:#f7f2e5;font:15px/1.6 'Segoe UI',Arial,sans-serif;color-scheme:dark}
      *{box-sizing:border-box}::selection{background:#e0c38b;color:#182e31}button{font:inherit;cursor:pointer;min-height:44px}button:disabled{cursor:default;opacity:.42}button:focus-visible{outline:3px solid #f2cf8b;outline-offset:3px}button:not(:disabled):hover{filter:brightness(1.1)}
      .yr-shell{position:relative;isolation:isolate;overflow:hidden;height:100%;min-height:0;display:flex;flex-direction:column;background:radial-gradient(ellipse at 95% 0,#345b502e,transparent 55%),#122d30;border-radius:20px}
      .yr-top{flex-shrink:0;display:flex;gap:14px;align-items:center;justify-content:space-between;padding:14px 28px;border-bottom:1px solid #b7c7bd26}.yr-brand{font-size:15px;font-weight:650;color:#eee7d3}.yr-close{border:1px solid #aebfb03d;color:#ede8d8;background:transparent;border-radius:50%;width:44px;height:44px;font-size:26px;line-height:1;flex-shrink:0}
      .yr-progress{flex-shrink:0;display:flex;gap:8px;padding:14px 28px 12px}.yr-dot{flex:1;min-width:0;border-top:2px solid #738a803b;padding-top:6px;font-size:11px;color:#b9c9c3;text-align:center}.yr-dot[data-active]{border-color:#ddc28c;color:#ebd7ae}.yr-dot[aria-current=step]{color:#ffe5b0;font-weight:700}
      .yr-scroll{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#647e73 #122d30}.yr-scroll:focus-visible{outline:2px solid #dabc85;outline-offset:-3px}
      .yr-content{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);align-content:start;align-items:start;column-gap:36px;padding:28px 36px 24px;min-height:100%}.yr-content>*{grid-column:1/-1;min-width:0}h1{grid-column:1!important;font-size:clamp(25px,3.4vw,34px);line-height:1.2;letter-spacing:-.025em;margin:0 0 10px;font-weight:720;text-wrap:balance}h2{font-size:23px;line-height:1.3;overflow-wrap:anywhere;margin:16px 0 4px;color:#f2dab0}p{margin:0}.yr-page-label{grid-column:1;color:#d9be8a;font-size:12px;margin-bottom:18px}.yr-sub{grid-column:1;color:#bccfc6;font-size:14px;max-width:65ch}
      .yr-score{grid-column:2;grid-row:1/4;align-self:center;border-left:1px solid #b8c6b52e;padding:6px 0 8px 32px}.yr-number{font-size:clamp(52px,8vw,80px);font-weight:700;letter-spacing:-.035em;font-variant-numeric:tabular-nums;line-height:1.05;color:#f2d5a1;overflow-wrap:anywhere}.yr-unit{color:#cedbd1;font-size:13px;margin-top:12px;max-width:24ch}.yr-note{font-size:12px;color:#b2c4b9;line-height:1.75;margin-top:26px;padding-top:16px;border-top:1px solid #b8c6b52e;max-width:75ch}.yr-metrics{display:flex;flex-wrap:wrap;gap:20px 48px;margin-top:28px;padding:20px 0 4px;border-top:1px solid #b8c6b52e}.yr-metric strong{display:block;color:#f1dcc0;font-size:27px;line-height:1.3}.yr-metric span{color:#b9cfc3;font-size:13px}
      .yr-chart-label{color:#d9e4da;font-size:12px;font-weight:600;margin-top:26px}.yr-bars{display:flex;align-items:end;gap:8px;height:112px;margin:12px 0 0}.yr-month{flex:1;min-width:0;display:flex;height:100%;flex-direction:column;justify-content:end;align-items:center;gap:5px;color:#a9c0b3;font-size:11px}.yr-bar{width:100%;max-width:28px;min-height:3px;background:#bba477;border-radius:4px 4px 0 0}.yr-month-value{color:#e9dbbd;font-size:10px;font-variant-numeric:tabular-nums}
      .yr-gift{grid-column:2;grid-row:1/4;align-self:center;text-align:center;padding:22px 8px;border:1px solid #d9be8a66;color:#f0d8a7;position:relative;margin:4px 12px;line-height:1.4;font-size:16px;font-weight:600}.yr-gift:before,.yr-gift:after{content:'';position:absolute;inset:5px;pointer-events:none;border:1px solid #d9be8a22}.yr-gift:after{inset:auto 35% -5px;height:9px;border:0;background:#d9be8a}.yr-result{padding:20px 0 0;border-top:1px solid #b8c6b52e;margin-top:26px;overflow-wrap:anywhere}.yr-result strong{font-size:23px;color:#f1d8a5;display:block;margin-bottom:8px}.yr-result p{color:#c7d6cb;font-size:14px}
      .yr-footer{flex-shrink:0;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px 28px;background:#0e2528;border-top:1px solid #b8c6b52e}.yr-back{border:0;background:transparent;color:#c7d8cc;padding:10px 6px}.yr-next{border:0;background:#e4c594;color:#203533;padding:12px 22px;border-radius:10px;font-weight:750;min-width:140px;max-width:65%;white-space:normal}.yr-status{flex-shrink:0;padding:10px 28px;background:#3c3028;color:#ffe0bb;font-size:13px;max-height:90px;overflow:auto}.yr-status:empty{display:none}.yr-demo{flex-shrink:0;padding:7px 28px;background:#23403d;color:#d1dfd4;font-size:11px;border-bottom:1px solid #b8c6b51a}
      @media(max-width:560px){.yr-shell{border-radius:16px}.yr-top{padding:10px 18px}.yr-brand{font-size:14px}.yr-progress{padding:10px 18px;gap:5px}.yr-dot{font-size:10px}.yr-content{grid-template-columns:minmax(0,1fr);gap:0;padding:22px}.yr-score{grid-column:1;grid-row:auto;padding:18px 0 0;border:0;margin-top:4px}.yr-number{font-size:62px}.yr-unit{max-width:none;margin-top:8px}.yr-gift{grid-column:1;grid-row:auto;margin:24px 0 0;padding:18px}.yr-sub{font-size:14px}.yr-note{margin-top:20px}.yr-page-label{margin-bottom:12px}.yr-footer{padding:12px 16px;gap:10px}.yr-back,.yr-next{font-size:13px}.yr-next{min-width:0;padding:12px 15px}.yr-status{padding:10px 22px}.yr-demo{padding:6px 18px;font-size:10px}.yr-bars{gap:5px}.yr-metrics{gap:20px 32px}}
      @media(max-height:500px){.yr-top{padding:6px 18px}.yr-progress{padding-top:7px;padding-bottom:7px}.yr-footer{padding:8px 18px}.yr-content{padding-top:18px}}
    `;
    const BACKDROP_CSS = `
      #year-review-dialog::backdrop{background:rgba(5,17,23,.68);backdrop-filter:blur(10px) saturate(.65);-webkit-backdrop-filter:blur(10px) saturate(.65)}
      #year-review-dialog[data-low-effects]::backdrop{background:rgba(5,17,23,.82);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}
      @supports not (backdrop-filter:blur(1px)){#year-review-dialog::backdrop{background:rgba(5,17,23,.88)}}
    `;
    const CARD_CSS = `
      :host{all:initial;display:block;font:16px/1.5 'Segoe UI',Arial,sans-serif;color:#263e35;color-scheme:light}*{box-sizing:border-box}::selection{background:#e3cc9c}
      .yr-invitation{display:grid;grid-template-columns:160px minmax(0,1fr);gap:20px 30px;padding:28px 32px;background:#fff8e9;position:relative;overflow:hidden;border-radius:20px}
      .yr-cover{grid-row:1/3;display:flex;flex-direction:column;align-items:center;justify-content:center;align-self:stretch;background:#284e40;border-radius:12px;padding:14px 12px;color:#fff3d8;transform:rotate(-3deg);pointer-events:none}.yr-cover img[hidden]{display:none}.yr-cover img{width:112px;height:112px;object-fit:contain;display:block}.yr-date{font-size:23px;font-weight:750;letter-spacing:.02em;font-variant-numeric:tabular-nums}.yr-copy{min-width:0;align-self:center}h3{font-size:clamp(24px,3vw,32px);line-height:1.2;letter-spacing:-.025em;margin:0 0 12px;color:#244c40}p{margin:0;color:#526758;max-width:65ch;font-size:15px;line-height:1.65}.yr-card-footer{display:flex;align-items:center;justify-content:space-between;gap:20px;border-top:1px solid #e0d6bd;padding-top:18px;min-width:0}.yr-schedule{font-size:12px;color:#616c55;max-width:45ch}.yr-open{flex-shrink:0;max-width:100%;border:0;border-radius:10px;min-height:44px;padding:12px 20px;background:#a34436;color:#fffaf1;font:700 14px/1.4 'Segoe UI',Arial,sans-serif;cursor:pointer}.yr-open:disabled{background:#e6dcc5;color:#596147;cursor:default}.yr-open:not(:disabled):hover{background:#8f392e}.yr-open:focus-visible{outline:3px solid #244c40;outline-offset:4px}
      @media(max-width:700px){.yr-invitation{grid-template-columns:82px minmax(0,1fr);gap:18px;padding:22px}.yr-cover{grid-row:1;padding:8px 4px;border-radius:9px}.yr-cover img{width:70px;height:70px}.yr-date{font-size:16px}h3{font-size:24px}p{font-size:14px}.yr-card-footer{grid-column:1/-1;flex-wrap:wrap;gap:14px}.yr-open{width:100%}.yr-schedule{max-width:none}}
    `;
    function node(tag, cls, text) {const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
    // Fixed local assets only; names from account/server data never become image URLs.
    function sticker(name) {
        const img=node('img','yr-sticker');img.src='assets/christmas/tickers/'+name+'.webp';
        img.alt='';img.width=img.height=320;img.decoding='async';img.draggable=false;
        img.addEventListener('error',()=>{img.hidden=true;},{once:true});return img;
    }
    function message(text) {if(scene)scene.status.textContent=text;}
    function errorText(error) {
        return ({YEAR_REVIEW_CLOSED:'Sự kiện chỉ mở ngày 31/12 theo giờ Việt Nam.',YEAR_REVIEW_PAUSED:'Sự kiện đang tạm bảo trì.',
            YEAR_REVIEW_REWARDS_NOT_READY:'Quà Giáng Sinh đang được chuẩn bị. Bạn có thể thử lại trong ngày 31/12.',
            YEAR_REVIEW_UPDATE_REQUIRED:'Hãy cập nhật trang để tham gia sự kiện.',YEAR_REVIEW_PAGE_ORDER:'Hãy xem lần lượt các trang tổng kết.',
            YEAR_REVIEW_START_REQUIRED:'Hãy đóng rồi mở lại sự kiện.',UNKNOWN_ACTION:'Worker chưa được cập nhật cho sự kiện này.',
            SERVER_REQUIRED:'Giao dịch máy chủ chưa sẵn sàng. Hãy thử lại sau.',SERVER_MONEY_NOT_READY:'Giao dịch máy chủ chưa sẵn sàng. Hãy thử lại sau.',
            READ_ONLY_SESSION:'Phiên này chỉ được xem. Hãy dùng phiên đăng nhập chính đã xác minh.',
            DEVICE_VERIFICATION_REQUIRED:'Hãy hoàn tất xác minh thiết bị bằng mã khôi phục trước khi nhận quà.'})[error?.code || error?.message]
            || 'Chưa xác nhận được kết quả. Bấm lại để kiểm tra giao dịch cũ; phần thưởng sẽ không được cộng trùng.';
    }
    async function activate() {
        const user=auth();if(!user)throw Error('AUTH_REQUIRED');
        if(window.ECONOMY_SERVER_ENABLED!==true||!window.EconomyClient)throw Error('SERVER_REQUIRED');
        if(activatedUid===user.uid)return user.uid;
        const r=await window.EconomyClient.execute('year_review_activate',{protocol},{slot:'year-review:activate',feedback:false});
        if(auth()?.uid!==user.uid||r?.protocol!==protocol||r.activated!==true)throw Error('ACCOUNT_CHANGED');
        activatedUid=user.uid;return user.uid;
    }
    function applyMotion() {
        if(!scene)return;
        const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const policy=window.WebPerformanceOptimizer?.getDecorationPolicy?.();
        scene.shell.classList.toggle('yr-still',!!reduced||document.hidden||policy?.animated===false);
        scene.dialog.toggleAttribute('data-low-effects',policy?.animated===false);
    }
    function close() {if(!scene)return;const s=scene;scene=null;clearInterval(s.timer);s.events.abort();s.dialog.close();s.dialog.remove();s.focus?.focus?.();}
    function mount(preview) {
        const dialog=document.createElement('dialog');dialog.id='year-review-dialog';
        dialog.setAttribute('aria-label','Ôn lại năm cũ');
        dialog.style.cssText='padding:0;border:0;background:#122d30;width:min(860px,calc(100vw - 32px));height:min(660px,calc(100vh - 32px));height:min(660px,calc(100dvh - 32px));max-width:860px;overflow:hidden;color-scheme:dark;border-radius:20px;box-shadow:0 24px 80px #0006;';
        const host=document.createElement('div'),shadow=host.attachShadow({mode:'open'}),style=node('style',null,CSS);
        const shell=node('div','yr-shell'),top=node('div','yr-top'),closeButton=node('button','yr-close','×');closeButton.type='button';closeButton.setAttribute('aria-label','Đóng tổng kết');
        top.append(node('span','yr-brand','Ôn lại năm cũ · 31 / 12'),closeButton);
        const progress=node('div','yr-progress');progress.setAttribute('aria-label','Tiến độ xem tổng kết');
        for(const label of ['Bài làm','Điểm số','Coin','Vé quay','Vật phẩm','Quà tặng'])progress.append(node('span','yr-dot',label));
        const content=node('div','yr-content'),status=node('div','yr-status'),footer=node('div','yr-footer'),back=node('button','yr-back','← Trang trước'),next=node('button','yr-next','Tiếp tục →');
        status.setAttribute('role','status');status.setAttribute('aria-live','polite');back.type=next.type='button';footer.append(back,next);
        shell.append(top,progress);if(preview)shell.append(node('div','yr-demo','BẢN XEM THỬ · Số liệu minh họa · Không cấp vật phẩm hoặc coin'));
        const scroll=node('div','yr-scroll');scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label','Nội dung tổng kết');scroll.append(content);
        shell.append(scroll,status,footer);shadow.append(style,shell);
        // ::backdrop belongs to the native dialog, outside its content Shadow DOM.
        dialog.append(node('style',null,BACKDROP_CSS),host);document.body.append(dialog);
        const events=new AbortController(),on=(target,event,fn)=>target.addEventListener(event,fn,{signal:events.signal});
        scene={dialog,shell,content,scroll,status,progress,back,next,events,preview,owner:auth()?.uid,focus:document.activeElement,page:0,data:null,busy:false};
        on(closeButton,'click',close);on(dialog,'cancel',e=>{e.preventDefault();close();});on(dialog,'close',()=>{if(scene?.dialog===dialog)close();});
        on(back,'click',()=>{if(scene&&!scene.busy&&scene.page>0){scene.page--;render();}});on(next,'click',advance);
        on(dialog,'keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();advance();}if(e.key==='ArrowLeft'&&!scene?.busy&&scene?.page>0){e.preventDefault();scene.page--;render();}});
        on(document,'visibilitychange',applyMotion);on(window,'web-performance-optimizer-change',applyMotion);on(window,'effect-quality-change',applyMotion);on(window,'pagehide',close);
        const motion=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(motion?.addEventListener)on(motion,'change',applyMotion);
        try {dialog.showModal();}catch(error){close();throw error;}
        scene.timer=setInterval(()=>{
            if(!scene)return;
            if(auth()?.uid!==scene.owner){close();return;}
            if(!scene.preview&&scene.data&&Date.now()+(scene.offset||0)>=scene.data.endsAt){scene.expired=true;render();message('Ngày 31/12 đã kết thúc. Hẹn gặp bạn trong sự kiện năm sau.');}
        },1000);
        applyMotion();return scene;
    }
    function render() {
        const s=scene;if(!s)return;
        if(s.renderedPage!==s.page){s.scroll.scrollTop=0;s.renderedPage=s.page;}
        s.content.replaceChildren();s.status.textContent='';
        [...s.progress.children].forEach((n,i)=>{n.toggleAttribute('data-active',i<=s.page);n.setAttribute('aria-current',i===s.page?'step':'false');});
        s.back.disabled=s.busy||s.page===0;s.next.disabled=s.busy||!s.data||!!(s.expired&&!s.claimAttempted);
        if(!s.data){s.content.append(node('h1',null,'Đang mở cuốn sổ năm cũ…'),node('p','yr-sub','Đang tổng hợp những dấu mốc của bạn.'));return;}
        const st=s.data.stats,p=s.page;
        s.next.textContent=p===5?(s.data.reward||s.preview?'Khép lại năm cũ':'Mở quà Giáng Sinh'):'Trang tiếp theo →';
        s.content.append(node('h1',null,labels[p]),node('p','yr-page-label',`Năm ${st.year} · Trang ${p+1} / 6`));
        const number=(v,unit)=>{const score=node('div','yr-score');score.append(node('div','yr-number',v),node('p','yr-unit',unit));s.content.append(score);};
        const note=t=>s.content.append(node('p','yr-note',t));
        if(p===0){
            s.content.append(node('p','yr-sub','Mỗi bài làm là một dấu chân trên hành trình trưởng thành.'));
            number(fmt(st.assignments),'bài nộp được ghi nhận trong năm');
            const bars=node('div','yr-bars'),max=Math.max(1,...st.months);
            st.months.forEach((v,i)=>{const month=node('div','yr-month'),bar=node('div','yr-bar');bar.style.height=`${Math.max(3,v/max*62)}px`;month.title=`Tháng ${i+1}: ${v} bài`;month.append(node('span','yr-month-value',fmt(v)),bar,node('span',null,String(i+1)));bars.append(month);});s.content.append(node('p','yr-chart-label','Bài nộp theo từng tháng'),bars);
            note('Dựa trên bài nộp hiện còn lưu, theo ngày nộp giờ Việt Nam; mỗi bản ghi bài nộp được tính một lần. '+(st.undated?`${st.undated} bài thiếu ngày hợp lệ chưa được tính.`:''));
        }else if(p===1){
            s.content.append(node('p','yr-sub','Nhìn lại những nỗ lực đã được ghi nhận.'));
            number(st.average===null?'—':fmt(st.average),'điểm trung bình · thang điểm 10');
            const metrics=node('div','yr-metrics');for(const [v,t] of [[fmt(st.graded),'bài đã chấm'],[st.bestScore===null?'—':fmt(st.bestScore),'điểm cao nhất']]){const m=node('div','yr-metric');m.append(node('strong',null,v),node('span',null,t));metrics.append(m);}s.content.append(metrics);
            note('Trung bình cộng điểm hợp lệ của các bài nộp trong năm, không phải điểm tổng kết do nhà trường quy định. Bài chưa chấm hoặc đang chấm lại không tính vào trung bình.');
        }else if(p===2||p===3){
            s.content.append(node('p','yr-sub',p===2?'Những lựa chọn đã làm hành trình của bạn thêm màu sắc.':'Những lượt thử vận may trong năm qua.'));
            number(fmt(p===2?st.coins:st.tickets),p===2?'Coin đã tiêu được ghi nhận':'vé quay đã sử dụng được ghi nhận');
            note('Chỉ cộng giao dịch chi tiêu có bằng chứng còn lưu và sổ thống kê mới; lịch sử cũ đã bị dọn không thể khôi phục. Đây có thể chưa phải toàn bộ năm. Không tính khoản giáo viên trừ hoặc thu hồi thưởng.'+(st.spendingSince?` Dữ liệu từ ${dateText(st.spendingSince)}.`:''));
        }else if(p===4){
            s.content.append(node('p','yr-sub','Món đồ đã cùng bạn xuất hiện trong nhiều ngày nhất.'));
            if(st.favorite){number(fmt(st.favorite.days),'ngày ghi nhận trang bị');s.content.append(node('h2',null,st.favorite.name));}
            else{number('—','Chưa đủ lịch sử trang bị');}
            note('Tính theo số ngày ghi nhận vật phẩm đang trang bị khi bạn mở web, mỗi món tối đa một lượt/ngày; không suy đoán từ ngày mua. Bắt đầu theo dõi từ khi cơ chế này được bật.'+(st.usageSince?` Đã ghi nhận từ ${dateText(st.usageSince)}.`:''));
        }else{
            s.content.append(node('p','yr-sub','Cảm ơn bạn đã cùng đi hết một năm. Chúc bạn một mùa Giáng Sinh ấm áp và một hành trình mới nhiều niềm vui!'));
            s.content.append(node('div','yr-gift','Một món quà Giáng Sinh dành cho bạn'));
            if(s.data.reward){const r=s.data.reward,box=node('div','yr-result');box.append(node('strong',null,r.duplicate?'Bạn nhận được 300 Coin':r.name),node('p',null,r.duplicate?`Bạn đã sở hữu ${r.name}. Món trùng được đổi thành 300 Coin.`:`Một vật phẩm Giáng Sinh ${r.tier==='luxury'?'sang trọng':'từ cửa hàng thường'} đã được thêm vào túi đồ.`));s.content.append(box);}
            else note(s.preview?'Trong sự kiện thật, trang này mở một món quà. Bản xem thử không thay đổi tài sản.':'Nhận ngẫu nhiên 1 vật phẩm tag Giáng Sinh. Nếu đã sở hữu vĩnh viễn món được chọn, bạn nhận 300 Coin. Mỗi tài khoản nhận một lần mỗi năm.');
        }
    }
    async function advance() {
        const s=scene;if(!s||s.busy||!s.data||(s.expired&&!s.claimAttempted))return;
        if(s.page===5&&(s.preview||s.data.reward)){close();return;}
        s.busy=true;render();
        try {
            if(!s.preview&&auth()?.uid!==s.owner){close();return;}
            if(s.page<5){
                const page=s.page+1;
                if(!s.preview)await window.EconomyClient.execute('year_review_next',{protocol,year:s.data.year,page:String(page)},{slot:`year-review:${s.data.year}:page:${page}`,feedback:false});
                if(scene===s)s.page=page;
            }else{
                s.claimAttempted=true;
                const result=await window.EconomyClient.execute('year_review_claim',{protocol,year:s.data.year},{slot:`year-review:${s.data.year}:claim`,feedback:false});
                if(scene===s&&auth()?.uid===s.owner)s.data.reward=result;
            }
            if(scene===s){s.busy=false;render();}
        }catch(error){if(scene===s){s.busy=false;render();message(errorText(error));}}
    }
    async function open(preview=false) {
        if(scene)return;
        if(!preview&&!calendar().open){
            window.AppDialog?.notify?.('Ôn lại năm cũ chỉ mở ngày 31/12 hằng năm theo giờ Việt Nam.');return;
        }
        if(!window.__studentStartupCompleted||window.currentActiveExamId||document.querySelector('dialog[open], .modal-overlay.active')) {
            window.AppDialog?.notify?.('Hãy hoàn tất hộp thoại hoặc bài làm đang mở trước khi xem tổng kết.');return;
        }
        let s;
        try{s=mount(preview);}catch(_){window.AppDialog?.notify?.('Trình duyệt chưa mở được màn tổng kết. Hãy cập nhật trình duyệt rồi thử lại.');return;}
        render();
        try {
            if(preview){s.data={year:calendar().year,stats:{year:calendar().year,assignments:84,graded:78,average:8.46,bestScore:10,undated:0,months:[4,6,7,8,5,3,4,9,12,10,9,7],coins:4280,tickets:36,spendingSince:null,favorite:{name:'Người bạn mùa tuyết',days:27},usageSince:null},reward:null};}
            else{
                await activate();if(scene!==s||auth()?.uid!==s.owner)return;
                const year=calendar().year;
                const data=await window.EconomyClient.execute('year_review_open',{protocol,year},{slot:`year-review:${year}:open`,feedback:false});
                if(scene!==s||auth()?.uid!==s.owner)return;
                s.data=data;s.offset=data.serverNow-Date.now();
            }
            if(scene===s)render();
        }catch(error){if(scene===s){s.content.replaceChildren(node('h1',null,'Chưa mở được cuốn sổ năm cũ'));message(errorText(error));}}
    }
    async function observeUsage() {
        if(document.hidden||!window.__studentStartupCompleted||window.currentActiveExamId||Date.now()<nextUsageAt||!auth()||window.ECONOMY_SERVER_ENABLED!==true)return;
        const inventory=typeof myInventory!=='undefined'&&Array.isArray(myInventory)?myInventory:[];
        const day=new Date(serverNow()+25200000).toISOString().slice(0,10),uid=auth().uid;
        const keys=inventory.filter(i=>i?.isEquipped===true).map(i=>`${uid}:${day}:${i.id}`);
        if(!keys.some(k=>!observed.has(k)))return;
        nextUsageAt=Date.now()+300000;
        try {await activate();if(auth()?.uid!==uid)return;
            await window.EconomyClient.execute('year_review_usage',{protocol},{slot:'year-review:usage',feedback:false});
            if(auth()?.uid===uid){keys.forEach(k=>observed.add(k));if(observed.size>2000)observed.clear();}
        }catch(_){/* Telemetry cannot block studying or equipment. Retry later. */}
    }
    async function recoverPending() {
        if(recovering||scene||document.hidden||!window.__studentStartupCompleted||window.currentActiveExamId||!auth()||window.ECONOMY_SERVER_ENABLED!==true||!window.EconomyClient?.canMutate?.())return;
        recovering=true;
        const uid=auth().uid,year=Number(calendar().year);
        try {
            // Resume only a saved request. No new draw is initiated here, even
            // on 1 January after a response was lost on 31 December.
            for(const y of [year,year-1]){
                if(auth()?.uid!==uid)return;
                const saved=await window.EconomyClient.resume(`year-review:${y}:claim`);
                if(saved&&auth()?.uid===uid)window.AppDialog?.notify?.('Quà Ôn lại năm cũ đã được xác nhận trong túi đồ hoặc lịch sử tài sản.');
            }
        }catch(_){/* Keep the pending operation intact for the next attempt. */}
        finally{recovering=false;}
    }
    function install() {
        const anchor=document.getElementById('gameActiveView');
        if(anchor&&!document.getElementById('year-review-card')){
            const card=node('div','card ui-theme-immune');card.id='year-review-card';
            card.style.cssText='display:block;padding:0;min-width:0;background:#fff8e9;overflow:hidden;';
            const root=card.attachShadow({mode:'open'}),invitation=node('section','yr-invitation');
            invitation.setAttribute('aria-label','Sự kiện Ôn lại năm cũ');
            const cover=node('div','yr-cover');cover.setAttribute('aria-hidden','true');
            cover.append(sticker('bear'),node('span','yr-date','31 / 12'));
            const copy=node('div','yr-copy');copy.append(node('h3',null,'Ôn lại năm cũ'),node('p',null,'Lật từng trang kỷ niệm học tập và mở món quà Giáng Sinh của riêng bạn.'));
            const footer=node('div','yr-card-footer'),schedule=node('p','yr-schedule');
            const btn=node('button','yr-open','Mở cuốn sổ năm cũ →');btn.type='button';btn.addEventListener('click',()=>open());
            footer.append(schedule,btn);invitation.append(cover,copy,footer);root.append(node('style',null,CARD_CSS),invitation);
            // Keep the introductory welcome card first, then event/game cards.
            anchor.insertBefore(card,anchor.children[1]||null);
            const update=()=>{
                const active=calendar().open;
                card.hidden=false;btn.disabled=!active;
                btn.textContent=active?'Mở cuốn sổ năm cũ →':'Mở vào ngày 31/12';
                schedule.textContent=active?'Sự kiện đang mở · Kết thúc lúc 00:00 ngày 01/01 (giờ Việt Nam).':'Hẹn bạn ngày 31/12 hằng năm · Sự kiện diễn ra trong 1 ngày, theo giờ Việt Nam.';
            };update();setInterval(update,1000);
        }
        if(CONFIG.testPreview){const settings=document.querySelector('#tab-settings .form-container');if(settings){const b=node('button',null,'Xem thử sự kiện Ôn lại năm cũ');b.type='button';b.id='year-review-preview';b.style.cssText='padding:12px 18px;border:1px solid #b5c8bd;border-radius:12px;background:#214f48;color:#fff5df;font:600 14px Segoe UI,Arial,sans-serif;display:block;margin-bottom:18px;';b.addEventListener('click',()=>open(true));settings.prepend(b);}}
        setInterval(observeUsage,30000);
        setInterval(recoverPending,30000);
        window.firebase?.auth?.().onAuthStateChanged(()=>{activatedUid=null;observed.clear();nextUsageAt=0;if(scene)close();});
    }
    window.YearReview=Object.freeze({open:()=>open(false),preview:()=>open(true),close,version:CONFIG.version});
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
