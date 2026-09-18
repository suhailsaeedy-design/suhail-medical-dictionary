(function(){
  'use strict';
  const prefix='suhail-medical-v10';
  function rawAuth(){
    try{return JSON.parse(sessionStorage.getItem(prefix+':auth')||localStorage.getItem(prefix+':auth')||'null')}catch{return null}
  }
  function currentUserKey(){const u=rawAuth()?.user;return u?.id||u?.email||'guest'}
  const k=name=>`${prefix}:${currentUserKey()}:${name}`;
  function get(name,fallback){try{const v=localStorage.getItem(k(name));return v===null?fallback:JSON.parse(v)}catch{return fallback}}
  function set(name,value){localStorage.setItem(k(name),JSON.stringify(value));return value}
  function remove(name){localStorage.removeItem(k(name))}
  function toggleIn(name,id){const arr=new Set(get(name,[]));arr.has(id)?arr.delete(id):arr.add(id);set(name,[...arr]);return arr.has(id)}
  function addUnique(name,id,max=100){let arr=get(name,[]).filter(x=>x!==id);arr.unshift(id);arr=arr.slice(0,max);set(name,arr);return arr}
  window.SuhailStore={prefix,currentUserKey,get,set,remove,toggleIn,addUnique};
})();
