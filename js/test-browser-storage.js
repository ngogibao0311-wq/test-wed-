/* Test-only browser state. Production keeps its existing keys and sessions. */
(() => {
    'use strict';
    const prefix = 'web-chan-doan-test:';
    function scoped(native) {
        const keys = () => Array.from({length:native.length}, (_,i)=>native.key(i)).filter(k=>k?.startsWith(prefix));
        return Object.freeze({
            get length() { return keys().length; },
            key(index) { return keys()[index]?.slice(prefix.length) ?? null; },
            getItem(key) { return native.getItem(prefix+String(key)); },
            setItem(key,value) { native.setItem(prefix+String(key),String(value)); },
            removeItem(key) { native.removeItem(prefix+String(key)); },
            clear() { for(const key of keys())native.removeItem(key); }
        });
    }
    const nativeLocks=navigator.locks;
    const locks=nativeLocks ? Object.freeze({
        request(name,...args) { return nativeLocks.request(prefix+name,...args); },
        async query() { const state=await nativeLocks.query();return Object.fromEntries(Object.entries(state).map(([kind,rows])=>[kind,rows.filter(r=>r.name.startsWith(prefix)).map(r=>({...r,name:r.name.slice(prefix.length)}))])); }
    }) : undefined;
    const Channel=window.BroadcastChannel;
    window.TestBrowserStorage=Object.freeze({
        localStorage:scoped(window.localStorage),
        sessionStorage:scoped(window.sessionStorage),
        locks,
        BroadcastChannel:Channel ? class extends Channel { constructor(name) { super(prefix+name); } } : undefined,
        eventKey(event) { return typeof event.key==='string'&&event.key.startsWith(prefix)?event.key.slice(prefix.length):undefined; }
    });
})();
