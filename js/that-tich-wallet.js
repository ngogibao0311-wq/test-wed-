/* Event wallet: only the authenticated Worker grants or spends Thất Tịch coins. */
(() => {
 'use strict';
 let user=null,ref=null,handler=null,timer=null,claimBusy=null,balance=null,ready=false;
 const busy=new Set();
 const errors={INSUFFICIENT_THAT_TICH_COINS:'Bạn chưa đủ Xu Thất Tịch.',STORE_CLOSED:'Cửa hàng đang đóng.',ITEM_NOT_FOR_SALE:'Vật phẩm đang bị khóa.',ITEM_SALE_CLOSED:'Vật phẩm chưa trong thời gian mở bán.',STORE_GAME_ACCESS_DISABLED:'Giáo viên đã khóa quyền sử dụng cửa hàng.',INVALID_THAT_TICH_ITEM:'Danh mục máy chủ chưa có vật phẩm này. Cần cập nhật Worker.'};
 function render(){
  for(const el of document.querySelectorAll('[data-that-tich-balance]'))el.textContent=balance===null?'…':String(balance);
 }
 function installBadge(){
  if(document.getElementById('thatTichWalletBadge'))return;
  const place=document.querySelector('#tab-store h2')?.parentElement||document.getElementById('tab-store');if(!place)return;
  const badge=document.createElement('div');badge.id='thatTichWalletBadge';badge.className='ui-theme-immune';badge.dataset.themeImmune='true';
  badge.style.cssText='display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:10px 0 18px;padding:10px 14px;border:1px solid #bea0c3;border-radius:12px;background:#f8eff8;color:#623e66;font:600 14px/1.5 Segoe UI,sans-serif';
  badge.innerHTML='🌌 Xu Thất Tịch: <b data-that-tich-balance>…</b>';
  place.prepend(badge);render();
 }
 async function claim(){
  if(!user||claimBusy===user||window.ECONOMY_SERVER_ENABLED!==true)return;
  const account=user;claimBusy=account;
  try{
   let result=await window.EconomyClient.execute('that_tich_auto',{}, {slot:'that-tich-annual'});
   // Finish any old pending request first, then check today's eligibility anew.
   if(result.replayed&&user===account)result=await window.EconomyClient.execute('that_tich_auto',{}, {slot:'that-tich-annual'});
   if(user!==account)return;ready=true;render();
   if(result.amount===1)window.showToast?.('🌌 Thất Tịch: bạn đã nhận 1 Xu Thất Tịch năm '+result.year+'.','success');
   clearTimeout(timer);
   // Recheck at the next Vietnam midnight, using the server clock rather than the device clock.
   const next=Math.floor((result.serverNow+25200000)/86400000)*86400000+86400000-25200000;
   timer=setTimeout(()=>void claim(),Math.max(1000,Math.min(86400000,next-result.serverNow+1000)));
  }catch(e){if(user===account){console.warn('[Xu Thất Tịch]',e.message);ready=false;clearTimeout(timer);timer=setTimeout(()=>void claim(),60000);}}
  finally{if(claimBusy===account)claimBusy=null;}
 }
 function stop(){if(ref&&handler)ref.off('value',handler);clearTimeout(timer);ref=handler=timer=null;user=null;ready=false;balance=null;render();}
 async function initialize(profile){
  stop();if(!profile?.username||profile.role!=='student')return;user=profile;installBadge();
  if(window.ECONOMY_SERVER_ENABLED!==true)return;
  ref=db.ref('that_tich_wallets/'+profile.username+'/balance');handler=s=>{
   if(user!==profile)return;
   const next=Number(s.val()||0),changed=next!==balance;balance=next;render();
   if(changed&&document.getElementById('studentBagModal')?.classList?.contains('active'))void window.renderStudentBag?.();
  };
  ref.on('value',handler,e=>console.warn('[Xu Thất Tịch] Chưa đọc được ví:',e.message));
  await claim();
 }
 async function redeem(itemId){
  if(busy.has(itemId))return;busy.add(itemId);let committed=false;
  try{
   if(window.ECONOMY_SERVER_ENABLED!==true)throw Error('Xu Thất Tịch cần máy chủ giao dịch; bản nháp chưa hỗ trợ đổi xu.');
   const item=StoreManager.getItemById(itemId);if(!item||item.currency!=='that_tich_coin')throw Error('Không tìm thấy vật phẩm Thất Tịch.');
   const account=firebase.auth().currentUser?.uid;if(!account)throw Error('Cần đăng nhập lại.');
   if(!await AppDialog.confirm(`Đổi ${item.price} Xu Thất Tịch lấy ${item.name}?`))return;
   const result=await window.EconomyClient.execute('that_tich_redeem',{itemId:String(itemId)},{slot:'that-tich:'+itemId});committed=true;
   if(firebase.auth().currentUser?.uid!==account)return;
   // The wallet subscription is authoritative even if another tab spends now.
   render();
   await window.StudentFeatureLoader?.ensureForItem?.(itemId);
   await StoreManager.applyItem(itemId);
   await AppDialog.alert(result.recovered?'Bạn đã sở hữu vật phẩm này; không trừ thêm xu.':`Đã đổi vật phẩm bằng ${result.amount} Xu Thất Tịch. Còn ${result.balance} xu.`);
  }catch(e){await AppDialog.alert(committed?'Vật phẩm đã vào kho. Hãy mở lại kho để đồng bộ, không cần đổi lại.':errors[e.message]||('Chưa xác nhận đổi vật phẩm: '+e.message));}
  finally{busy.delete(itemId);}
 }
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void claim();});
 window.addEventListener('pagehide',event=>{if(!event.persisted)stop();});
 window.addEventListener('pageshow',()=>{if(user)void claim();});
 window.ThatTichWallet={initialize,redeem,stop,getBalance:()=>balance,isReady:()=>ready};
})();
