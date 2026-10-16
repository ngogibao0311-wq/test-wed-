/* Presentation only: preserve the exact saved grading text and amounts. */
(() => {
    'use strict';
    const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const styles = `
        :host{display:block;color:#26344b;font:14px/1.6 'Segoe UI',system-ui,sans-serif;min-width:0}*{box-sizing:border-box}
        .overview{display:grid;grid-template-columns:104px 1fr;gap:14px;margin-bottom:16px}.score{background:#edf0ff;border:1px solid #dbe1ff;border-radius:16px;padding:14px;text-align:center;display:flex;flex-direction:column;justify-content:center}.score small{color:#596689;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em}.score strong{font-size:32px;line-height:1.3;color:#4855bd}.score span{font-size:12px;color:#68758a}.total{padding:16px 18px;background:#eef8f4;border:1px solid #cee8dc;border-radius:16px;display:flex;flex-direction:column;justify-content:center}.total small{color:#37775f;font-size:11px;text-transform:uppercase;letter-spacing:.05em;font-weight:700}.total strong{font-size:19px;color:#155c46;margin-top:5px;line-height:1.4}.total.negative{background:#fff3f0;border-color:#f0d2c9}.total.negative strong,.total.negative small{color:#963d2b}
        .section{border:1px solid #e3e8ef;border-radius:14px;margin:10px 0;background:#fff;overflow:hidden}.section h3{font-size:12px;letter-spacing:.02em;margin:0;padding:11px 15px;background:#f6f8fc;color:#4b5870}.section.penalties h3{background:#fff5f0;color:#9a5834}.row{padding:10px 15px;border-top:1px solid #edf0f5;white-space:pre-line;overflow-wrap:anywhere}.row b{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.03em;color:#788397;margin-bottom:2px}.row span{display:block}.note{font-size:12px;color:#64728a;padding:9px 0;white-space:pre-line;overflow-wrap:anywhere}details{border-top:1px solid #e3e8ef;margin-top:13px;padding-top:10px}summary{cursor:pointer;font-size:12px;font-weight:600;color:#63718a}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-family:inherit;font-size:12px;line-height:1.65;color:#59677c;margin-bottom:0}.plain{white-space:pre-wrap;overflow-wrap:anywhere}
        @media(max-width:420px){.overview{grid-template-columns:80px 1fr;gap:9px}.score{padding:10px}.score strong{font-size:27px}.total{padding:12px}.total strong{font-size:17px}.row{padding:10px 12px}}
    `;
    function render(message) {
        const lines = String(message).split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
        const scoreLine = lines.find(s=>/^(Điểm:|Bài được chấm )/.test(s));
        const score = scoreLine?.match(/(?:Điểm:|Bài được chấm)\s*(\d+(?:[.,]\d+)?)/)?.[1];
        const total = lines.find(s=>s.startsWith('Kết quả thưởng trừ phạt:'));
        if (!score || !total) return `<div class="plain">${escape(message)}</div>`;
        const groups = {reward:[],timing:[],penalties:[],adjustment:[],notes:[]};
        for (const line of lines) {
            if (line===scoreLine || line===total || line==='XEM TRƯỚC THƯỞNG – PHẠT' || line==='Xác nhận lưu điểm và đối soát?') continue;
            if (/^Thưởng theo điểm:/.test(line)) groups.reward.push(line);
            else if (/^(Bắt đầu tính:|Chưa đủ ngày giờ:|Chia khoảng|Bài không hạn:|Tỷ lệ Coin:)/.test(line)) groups.timing.push(line);
            else if (/^(Đã đối soát trước đó:|Lần này:|Chênh lệch so với lần trước:)/.test(line)) groups.adjustment.push(line);
            else if (/trừ .*vé.*Coin|^Tổng phạt:|^Không có khoản phạt/.test(line)) groups.penalties.push(line);
            else groups.notes.push(line);
        }
        const row = line => {
            const colon=line.indexOf(':');
            return colon>0 && colon<45 ? `<div class="row"><b>${escape(line.slice(0,colon))}</b><span>${escape(line.slice(colon+1).trim())}</span></div>` : `<div class="row">${escape(line)}</div>`;
        };
        const section=(key,title)=>groups[key].length?`<section class="section ${key}"><h3>${title}</h3>${groups[key].map(row).join('')}</section>`:'';
        return `<div class="overview"><div class="score"><small>Điểm bài làm</small><strong>${escape(score)}</strong><span>trên 10 điểm</span></div><div class="total ${/-\d/.test(total)?'negative':''}"><small>Kết quả sau thưởng / phạt</small><strong>${escape(total.slice(total.indexOf(':')+1).trim().replace(/\.$/,''))}</strong></div></div>`+
            section('adjustment','CẬP NHẬT SỐ DƯ')+section('reward','THƯỞNG THEO ĐIỂM')+section('timing','THỜI GIAN NỘP BÀI')+section('penalties','CÁC KHOẢN PHẠT')+
            groups.notes.map(line=>`<div class="note">${escape(line)}</div>`).join('')+
            `<details><summary>Xem nội dung đầy đủ</summary><pre>${escape(message)}</pre></details>`;
    }
    class GradeResultSummary extends HTMLElement {
        connectedCallback() {
            if(this.shadowRoot)return;
            const message=this.textContent;
            this.attachShadow({mode:'open'}).innerHTML=`<style>${styles}</style>${render(message)}`;
        }
    }
    class StudentInboxLetter extends HTMLElement {
        connectedCallback() {
            if(this.shadowRoot)return;
            const root=this.attachShadow({mode:'open'});
            root.innerHTML=`<style>
                :host{display:block;margin-bottom:18px;min-width:0;color:#26344b;font:14px/1.65 'Segoe UI',system-ui,sans-serif}*{box-sizing:border-box}article{border:1px solid #dfe5ef;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 5px 18px #24344b08}header{padding:18px 20px;display:flex;gap:12px;align-items:center;border-bottom:1px solid #e8ecf3;background:linear-gradient(120deg,#f4f6ff,#fff)}.icon{display:grid;place-items:center;width:42px;height:42px;flex:0 0 42px;border-radius:13px;background:#e9edff;color:#5663bb;font-size:21px}small{display:block;color:#7b86a0;font-size:10px;font-weight:700;letter-spacing:.09em}h3{margin:2px 0 0;font-size:17px;color:#253659}time{display:block;font-size:12px;color:#7b8799;margin-top:3px}.body{padding:20px}.message{white-space:pre-wrap;overflow-wrap:anywhere}.gift{margin-top:14px}footer{padding:14px 20px;background:#f8f9fc;border-top:1px solid #e8ecf3}::slotted([slot=actions]){display:grid;gap:8px}::slotted([slot=message]){margin:0!important;color:#344259!important;font:14px/1.7 'Segoe UI',system-ui,sans-serif!important}@media(max-width:420px){header{padding:15px}.body{padding:14px}footer{padding:12px 14px}h3{font-size:16px}}
            </style><article><header><div class="icon" aria-hidden="true">✉</div><div><small>HỘP THƯ HỌC TẬP</small><h3></h3><time></time></div></header><div class="body"><div class="message"><slot name="message"></slot></div><slot name="summary"></slot><div class="gift"><slot name="gift"></slot></div></div><footer><slot name="actions"></slot></footer></article>`;
            root.querySelector('h3').textContent=this.getAttribute('subject')||'Thông báo mới';
            root.querySelector('time').textContent=this.getAttribute('sent-at')||'';
        }
    }
    if(!customElements.get('grade-result-summary'))customElements.define('grade-result-summary',GradeResultSummary);
    if(!customElements.get('student-inbox-letter'))customElements.define('student-inbox-letter',StudentInboxLetter);
})();
