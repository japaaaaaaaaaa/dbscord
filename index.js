(function(u,y,a,w,l,d,b,s){"use strict";
const{ScrollView:x,Text:F,View:S,TextInput:_,Button:f}=y.General,{FormRow:v,FormIcon:i,FormDivider:g,FormSwitchRow:m}=y.Forms;

const T=function(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");};

const E=function(){
  if(!a.storage.enabled)return[];
  return JSON.parse(a.storage.rules||"[]").map(function(t){
    try{
      if(t.find==="")return null;
      return{re:new RegExp(t.regex?t.find:T(t.find),t.ci?"gi":"g"),to:t.replace};
    }catch{return null;}
  }).filter(Boolean);
};

a.storage.rules??=JSON.stringify([{find:"old",replace:"new",regex:false,ci:false}]);
a.storage.enabled??=true;
a.storage.showEditor??=false;
a.storage.defaultFind??="";

// unpatch functions and a flag to prevent double-patching
let h=[];
let patched=false;

function applyRules(rules,str){
  if(typeof str!=="string")return str;
  for(const e of rules)str=str.replace(e.re,e.to);
  return str;
}

function walkAST(rules,arr){
  if(!Array.isArray(arr))return;
  for(const node of arr){
    if(!node||typeof node!=="object")continue;
    if(typeof node.content==="string")node.content=applyRules(rules,node.content);
    if(Array.isArray(node.content))walkAST(rules,node.content);
  }
}

function processNode(rules,node){
  if(!node||typeof node!=="object")return;
  if(node.message){
    const msg=node.message;
    if(typeof msg.content==="string")msg.content=applyRules(rules,msg.content);
    if(Array.isArray(msg.content))walkAST(rules,msg.content);
    if(msg.author){
      if(msg.author.username)msg.author.username=applyRules(rules,msg.author.username);
      if(msg.author.globalName)msg.author.globalName=applyRules(rules,msg.author.globalName);
    }
    if(typeof msg.edited==="string")msg.edited=applyRules(rules,msg.edited);
  }
  if(typeof node.username==="string")node.username=applyRules(rules,node.username);
  if(typeof node.nick==="string")node.nick=applyRules(rules,node.nick);
  if(typeof node.text==="string")node.text=applyRules(rules,node.text);
}

const U=function(){
  // Guard: never register patches more than once
  if(patched){
    console.log("[TR] already patched, skipping");
    return;
  }

  let registered=false;

  // Strategy 1: DCDChatManager.updateRows (modern Discord mobile)
  const RN=y.General;
  const DCDChatManager=RN&&RN.NativeModules&&RN.NativeModules.DCDChatManager;
  if(DCDChatManager&&typeof DCDChatManager.updateRows==="function"){
    console.log("[TR] patching DCDChatManager.updateRows");
    h.push(b.before("updateRows",DCDChatManager,function(args){
      try{
        const rules=E();
        if(!rules.length)return;
        const rows=JSON.parse(args[1]);
        for(const row of rows)processNode(rules,row);
        args[1]=JSON.stringify(rows);
      }catch(err){console.log("[TR] updateRows error",err);}
    }));
    registered=true;
  }

  // Strategy 2: RowManager.generate via findByName (older Discord)
  const RM=d.findByName("RowManager");
  if(RM&&RM.prototype&&typeof RM.prototype.generate==="function"){
    console.log("[TR] patching RowManager.generate (findByName)");
    h.push(b.before("generate",RM.prototype,function([r]){
      try{
        const rules=E();
        if(!rules.length)return;
        processNode(rules,r);
      }catch(err){console.log("[TR] generate error",err);}
    }));
    registered=true;
  }

  // Strategy 3: RowManager via findByProps (older Discord fallback)
  if(!RM){
    const RMM=d.findByProps("RowManager");
    const RMC=RMM&&RMM.RowManager;
    if(RMC&&RMC.prototype&&typeof RMC.prototype.generate==="function"){
      console.log("[TR] patching RowManager.generate (findByProps)");
      h.push(b.before("generate",RMC.prototype,function([r]){
        try{
          const rules=E();
          if(!rules.length)return;
          processNode(rules,r);
        }catch(err){console.log("[TR] generate error (props)",err);}
      }));
      registered=true;
    }
  }

  if(registered){
    patched=true;
    console.log("[TR] patches registered, patched=true");
  }else{
    console.log("[TR] nothing found yet, retrying in 1s...");
    setTimeout(U,1000);
  }
};

// Settings UI
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
    // Reset state cleanly on each load, in case onUnload didn't fire
    h.forEach(function(t){try{t&&t();}catch{}});
    h=[];
    patched=false;
    U();
  },
  onUnload(){
    console.log("[TR] onUnload");
    h.forEach(function(t){try{t&&t();}catch{}});
    h=[];
    patched=false;
  }
};

return u.default=C,Object.defineProperty(u,"__esModule",{value:!0}),u;
})({},vendetta.ui.components,vendetta.plugin,vendetta.storage,vendetta.ui.assets,vendetta.metro,vendetta.patcher,vendetta.metro.common);
