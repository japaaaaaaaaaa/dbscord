(function(u,y,a,w,l,d,b,s){"use strict";
const{ScrollView:x,Text:F,View:S,TextInput:_,Button:f}=y.General,{FormRow:v,FormIcon:i,FormDivider:g,FormSwitchRow:m}=y.Forms;

// Escape string for use in RegExp
const T=function(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");};

// Build active rule list from storage — fixed: removed the broken .replace.includes(.find) guard
const E=function(){
  if(!a.storage.enabled)return[];
  return JSON.parse(a.storage.rules||"[]").map(function(t){
    try{
      if(t.find==="")return null;
      return{re:new RegExp(t.regex?t.find:T(t.find),t.ci?"gi":"g"),to:t.replace};
    }catch{return null;}
  }).filter(Boolean);
};

// Defaults
a.storage.rules??=JSON.stringify([{find:"old",replace:"new",regex:false,ci:false}]);
a.storage.enabled??=true;
a.storage.showEditor??=false;
a.storage.defaultFind??="";

let h=[];

const U=function(){
  // RowManager is not a named default export — find it by its props
  const RowManagerModule=d.findByProps("RowManager");
  const B=RowManagerModule&&RowManagerModule.RowManager;
  if(!B||!B.prototype||typeof B.prototype.generate!=="function"){
    console.log("[TR] RowManager not ready, retrying...");
    setTimeout(U,500);
    return;
  }

  const t=d.findByStoreName("UserStore");
  const c=d.findByProps("put","del","post");

  // Patch RowManager.prototype.generate to rewrite messages before rendering
  h.push(b.before("generate",B.prototype,function([r]){
    try{
      const o=E();
      if(!o.length)return;
      for(const e of o){
        if(r?.message?.content)
          r.message.content=r.message.content.replace(e.re,e.to);
        if(r?.message?.author?.username)
          r.message.author.username=r.message.author.username.replace(e.re,e.to);
        if(r?.message?.author?.globalName)
          r.message.author.globalName=r.message.author.globalName.replace(e.re,e.to);
        if(r?.message?.author?.avatar)
          r.message.author.avatar=r.message.author.avatar.replace(e.re,e.to);
        if(r?.message?.author?.primaryGuild?.tag)
          r.message.author.primaryGuild.tag=r.message.author.primaryGuild.tag.replace(e.re,e.to);
        if(r?.message?.author?.primaryGuild?.badge)
          r.message.author.primaryGuild.badge=r.message.author.primaryGuild.badge.replace(e.re,e.to);
        if(r?.message?.author?.primaryGuild?.identityGuildId)
          r.message.author.primaryGuild.identityGuildId=r.message.author.primaryGuild.identityGuildId.replace(e.re,e.to);
        if(r?.message?.attachments?.length)
          r.message.attachments.forEach(function(n){
            if(n.url?.match(e.re)){n.url=e.to;n.proxy_url=e.to;}
          });
        // Author ID replacement
        if(r?.message?.author?.id){
          const newId=r.message.author.id.replace(e.re,e.to);
          if(newId!==r.message.author.id&&/^\d+$/.test(newId)){
            const target=t&&t.getUser(newId);
            if(target){r.message.author=target;}
            else{r.message.author.id=newId;}
          }
        }
      }
    }catch(err){console.log("[TR] generate patch error",err);}
  }));

  console.log("[TR] RowManager patched successfully");
};

// Settings UI — rule editor
const A=function(){
  const t=JSON.parse(a.storage.rules||"[]");
  const c=function(o){a.storage.rules=JSON.stringify(o);};
  const R=function(){return c([...t,{find:a.storage.defaultFind||"",replace:"",regex:false,ci:false}]);};
  const p=function(o){return c(t.filter(function(e,n){return n!==o;}));};
  const r=function(o,e){return c(t.map(function(n,D){return D===o?{...n,...e}:n;}));};
  return React.createElement(x,{style:{paddingBottom:100}},
    React.createElement(F,{style:{margin:12,fontSize:16,fontWeight:"bold"}},"Replacement Rules"),
    t.map(function(o,e){
      return React.createElement(S,{key:e,style:{margin:8,padding:8,borderWidth:1,borderColor:"#666",borderRadius:6}},
        React.createElement(_,{placeholder:"Text to find",value:o.find,onChangeText:function(n){return r(e,{find:n});},style:{borderWidth:1,borderColor:"#888",padding:6,marginBottom:6,color:"#fff"}}),
        React.createElement(_,{placeholder:"Replace with",value:o.replace,onChangeText:function(n){return r(e,{replace:n});},style:{borderWidth:1,borderColor:"#888",padding:6,marginBottom:6,color:"#fff"}}),
        React.createElement(m,{label:"Case-insensitive",leading:React.createElement(i,{source:l.getAssetIDByName("ic_visibility_24px")}),value:o.ci,onValueChange:function(n){return r(e,{ci:n});}}),
        React.createElement(m,{label:"Regular expression",leading:React.createElement(i,{source:l.getAssetIDByName("ic_search_24px")}),value:o.regex,onValueChange:function(n){return r(e,{regex:n});}}),
        React.createElement(f,{title:"Delete rule",onPress:function(){return p(e);},color:"red"}),
        React.createElement(g,null)
      );
    }),
    React.createElement(f,{title:"Add rule",onPress:R})
  );
};

var C={
  settings:function(){
    w.useProxy(a.storage);
    return React.createElement(x,null,
      React.createElement(m,{label:"Enable replacements",leading:React.createElement(i,{source:l.getAssetIDByName("ic_message_edit")}),value:a.storage.enabled,onValueChange:function(t){a.storage.enabled=t;}}),
      React.createElement(g,null),
      React.createElement(S,{style:{margin:8,padding:8,borderWidth:1,borderColor:"#444",borderRadius:6}},
        React.createElement(F,{style:{color:"#aaa",fontSize:13,marginBottom:4}},'Default "Find" text'),
        React.createElement(F,{style:{color:"#888",fontSize:11,marginBottom:6}},"New rules will be pre-filled with this value"),
        React.createElement(_,{placeholder:"e.g. 123456789",value:a.storage.defaultFind,onChangeText:function(t){a.storage.defaultFind=t;},style:{borderWidth:1,borderColor:"#888",padding:6,color:"#fff",borderRadius:4}})
      ),
      React.createElement(g,null),
      React.createElement(v,{label:"Manage rules",subLabel:"Add, edit or delete replacement strings",leading:React.createElement(i,{source:l.getAssetIDByName("ic_settings_24px")}),trailing:v.Arrow,onPress:function(){a.storage.showEditor=!a.storage.showEditor;}}),
      a.storage.showEditor&&React.createElement(React.Fragment,null,
        React.createElement(g,null),
        React.createElement(A,null),
        React.createElement(f,{title:"Close editor",onPress:function(){a.storage.showEditor=false;}})
      )
    );
  },
  onLoad(){
    console.log("[TR] onLoad");
    U();
  },
  onUnload(){
    console.log("[TR] onUnload");
    h.forEach(function(t){try{t&&t();}catch{}});
    h=[];
  }
};

return u.default=C,Object.defineProperty(u,"__esModule",{value:!0}),u;
})({},vendetta.ui.components,vendetta.plugin,vendetta.storage,vendetta.ui.assets,vendetta.metro,vendetta.patcher,vendetta.metro.common);
