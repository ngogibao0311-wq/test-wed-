/* Separate event wallets: balances and purchases are authoritative on the Worker. */
(() => {
 'use strict';
 let user=null,timer=null,claimBusy=null,ready=false;
 const subscriptions=[],balances={that_tich_coin:null,love_coin:null};
 const currencyName=currency=>currency==='that_tich_coin'?'Xu Thất Tịch':'Xu tình yêu';
 const busy=new Set();
 const errors={INSUFFICIENT_THAT_TICH_COINS:'Bạn chưa đủ Xu Thất Tịch.',INSUFFICIENT_LOVE_COINS:'Bạn chưa đủ Xu tình yêu.',INVALID_EVENT_CURRENCY:'Loại xu này không dùng được cho vật phẩm đã chọn.',STORE_CLOSED:'Cửa hàng đang đóng.',ITEM_NOT_FOR_SALE:'Vật phẩm đang bị khóa.',ITEM_SALE_CLOSED:'Vật phẩm chưa trong thời gian mở bán.',STORE_GAME_ACCESS_DISABLED:'Giáo viên đã khóa quyền sử dụng cửa hàng.',INVALID_THAT_TICH_ITEM:'Danh mục máy chủ chưa có vật phẩm này. Cần cập nhật Worker.'};
 async function claim(){
  if(!user||claimBusy===user||window.ECONOMY_SERVER_ENABLED!==true)return;
  const account=user;claimBusy=account;
  try{
   let result=await window.EconomyClient.execute('that_tich_auto',{}, {slot:'that-tich-annual'});
   // Finish any old pending request first, then check today's eligibility anew.
   if(result.replayed&&user===account)result=await window.EconomyClient.execute('that_tich_auto',{}, {slot:'that-tich-annual'});
   if(user!==account)return;ready=true;
   if(result.amount===1)window.showToast?.('🌌 Thất Tịch: bạn đã nhận 1 Xu Thất Tịch năm '+result.year+'.','success');
   clearTimeout(timer);
   // Recheck at the next Vietnam midnight, using the server clock rather than the device clock.
   const next=Math.floor((result.serverNow+25200000)/86400000)*86400000+86400000-25200000;
   timer=setTimeout(()=>void claim(),Math.max(1000,Math.min(86400000,next-result.serverNow+1000)));
  }catch(e){if(user===account){console.warn('[Xu Thất Tịch]',e.message);ready=false;clearTimeout(timer);timer=setTimeout(()=>void claim(),60000);}}
  finally{if(claimBusy===account)claimBusy=null;}
 }
 function stop(){for(const {ref,handler} of subscriptions.splice(0))ref.off('value',handler);clearTimeout(timer);timer=null;user=null;ready=false;balances.that_tich_coin=balances.love_coin=null;}
 async function initialize(profile){
  stop();if(!profile?.username||profile.role!=='student')return;user=profile;
  if(window.ECONOMY_SERVER_ENABLED!==true)return;
  for(const [currency,root] of [['that_tich_coin','that_tich_wallets'],['love_coin','love_coin_wallets']]){
   const ref=db.ref(root+'/'+profile.username+'/balance'),handler=s=>{
    if(user!==profile)return;
    const next=Number(s.val()||0),changed=next!==balances[currency];balances[currency]=next;
    if(changed&&document.getElementById('studentBagModal')?.classList?.contains('active'))void window.renderStudentBag?.();
   };
   subscriptions.push({ref,handler});
   ref.on('value',handler,e=>console.warn('['+currencyName(currency)+'] Chưa đọc được ví:',e.message));
  }
  await claim();
 }
 async function redeem(itemId,currency='love_coin'){
  if(busy.has(itemId))return;busy.add(itemId);let committed=false;
  try{
   if(window.ECONOMY_SERVER_ENABLED!==true)throw Error('Đổi xu cần máy chủ giao dịch; bản test chưa hỗ trợ đổi xu.');
   const item=StoreManager.getItemById(itemId);if(!item||!['love_coin','that_tich_coin'].includes(item.currency))throw Error('Không tìm thấy vật phẩm Tình yêu.');
   const isThatTich=window.StoreTags?.has(item,'Thất Tịch')??[item.tag,...(Array.isArray(item.tags)?item.tags:[])].some(tag=>String(tag).normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('vi')==='thất tịch');
   if(!['love_coin','that_tich_coin'].includes(currency)||(currency==='that_tich_coin'&&!isThatTich))throw Error('INVALID_EVENT_CURRENCY');
   const account=firebase.auth().currentUser?.uid;if(!account)throw Error('Cần đăng nhập lại.');
   let args={itemId:String(itemId),currency};
   const slot='that-tich:'+itemId;
   const saved=typeof localStorage==='undefined'?null:JSON.parse(localStorage.getItem('economy_pending_v1:'+account+':'+slot)||'null');
   if(saved?.body?.action==='that_tich_redeem'&&saved.body.itemId===String(itemId)&&saved.body.currency===undefined){
    const legacyCurrency=isThatTich?'that_tich_coin':'love_coin';
    if(currency!==legacyCurrency)throw Error('Giao dịch cũ chưa xác nhận. Hãy chọn '+currencyName(legacyCurrency)+' để kiểm tra lại trước.');
    args={itemId:String(itemId)};
   }
   if(!await AppDialog.confirm(`Đổi ${item.price} ${currencyName(currency)} lấy ${item.name}?`))return;
   const result=await window.EconomyClient.execute('that_tich_redeem',args,{slot});committed=true;
   if(firebase.auth().currentUser?.uid!==account)return;
   // The wallet subscription is authoritative even if another tab spends now.
   
   await window.StudentFeatureLoader?.ensureForItem?.(itemId);
   await StoreManager.applyItem(itemId);
   await AppDialog.alert(result.recovered?'Bạn đã sở hữu vật phẩm này; không trừ thêm xu.':`Đã đổi vật phẩm bằng ${result.amount} ${currencyName(result.currency||currency)}. Còn ${result.balance} xu.`);
  }catch(e){await AppDialog.alert(committed?'Vật phẩm đã vào kho. Hãy mở lại kho để đồng bộ, không cần đổi lại.':errors[e.message]||('Chưa xác nhận đổi vật phẩm: '+e.message));}
  finally{busy.delete(itemId);}
 }
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void claim();});
 window.addEventListener('pagehide',event=>{if(!event.persisted)stop();});
 window.addEventListener('pageshow',()=>{if(user)void claim();});
 window.ThatTichWallet={initialize,redeem,stop,getBalance:(currency='that_tich_coin')=>balances[currency],isReady:()=>ready};
})();
