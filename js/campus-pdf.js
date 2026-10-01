(() => {
 'use strict';
 let busy=false;
 window.CampusPDF={async exportHTML(html,options){
  if(busy)return;
  busy=true;
  const buttons=[...document.querySelectorAll('button[onclick*="RoadmapPDF"]')];
  const previous=buttons.map(b=>({b,text:b.textContent,disabled:b.disabled}));
  buttons.forEach(b=>{b.disabled=true;b.textContent='Đang tạo PDF…';});
  const frame=document.createElement('iframe');
  frame.title='Xuất PDF';frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;left:-12000px;top:0;width:794px;height:1123px;border:0;pointer-events:none';
  try{
   // Clone only the printable document, never the live dashboard and its effects.
   document.body.append(frame);
   const doc=frame.contentDocument;
   doc.open();doc.write('<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:white;color:#222;font-family:Arial,sans-serif}*{box-sizing:border-box}tr{break-inside:avoid}thead{display:table-header-group}</style></head><body></body></html>');doc.close();
   const content=doc.createElement('div');content.innerHTML=html;
   content.querySelectorAll('script,iframe,object,embed').forEach(n=>n.remove());
   content.querySelectorAll('*').forEach(n=>{for(const attr of [...n.attributes])if(attr.name.startsWith('on'))n.removeAttribute(attr.name);});
   doc.body.append(content);
   const source=[...document.scripts].find(s=>s.src.includes('html2pdf'));
   if(!source)throw new Error('Không tìm thấy thư viện xuất PDF.');
   await new Promise((resolve,reject)=>{const script=doc.createElement('script');const timeout=setTimeout(()=>reject(new Error('Tải bộ xuất PDF quá lâu. Hãy kiểm tra kết nối.')),20000);script.onload=()=>{clearTimeout(timeout);resolve();};script.onerror=()=>{clearTimeout(timeout);reject(new Error('Không tải được bộ xuất PDF.'));};script.src=source.src;doc.head.append(script);});
   await new Promise(resolve=>setTimeout(resolve,60));
   const blob = await frame.contentWindow.html2pdf().set({...options,image:{type:'jpeg',quality:.9},html2canvas:{scale:1.25,useCORS:true,logging:false},pagebreak:{mode:['css','legacy'],avoid:'tr'}}).from(content).outputPdf('blob');
   const url=URL.createObjectURL(blob);
   const link=document.createElement('a');link.href=url;link.download=options?.filename||'bang-diem.pdf';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }catch(error){await window.AppDialog.alert('Không xuất được PDF: '+error.message);}
  finally{frame.remove();previous.forEach(({b,text,disabled})=>{b.disabled=disabled;b.textContent=text;});busy=false;}
 }};
})();
