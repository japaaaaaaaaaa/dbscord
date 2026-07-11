(function(y,N,o,B,f,u,d){"use strict";
const{ScrollView:w,Text:D,View:A,TextInput:G,Button:R}=N.General,{FormRow:I,FormIcon:h,FormDivider:E,FormSwitchRow:b}=N.Forms;
const T=function(n){return n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")};
const m=function(){return JSON.parse(o.storage.rules||"[]").map(function(n){try{return n.find===""||n.replace.includes(n.find)?null:{re:new RegExp(n.regex?n.find:T(n.find),n.ci?"gi":"g"),to:n.replace}}catch{return null}}).filter(Boolean)};
o.storage.rules??=JSON.stringify([{find:"old",replace:"new",regex:false,ci:false}]);
o.storage.enabled??=true;
o.storage.showEditor??=false;
o.storage.showJsonEditor??=false;
let i=[];
const S=function(){
  const C=u.findByName("RowManager");
  const n=u.findByName("UserProfilePrimaryInfo",false);
  const p=u.findByName("UserProfileAboutMeCard",false);
  const v=u.findByName("ChatViewWrapperBase",false);
  const x=u.findByStoreName("UserStore");
  x&&i.push(d.after("getUser",x,function([e],a){
    const t=m();
    for(const r of t){
      const s=r.re.source.replaceAll("\\",""),l=s.split("/");
      l.length>1&&l[0]===e&&(a.avatarDecorationData={asset:l[1],skuId:void 0,expiresAt:null});
      const c=s.split("%");
      c.length>1&&c[0]===e&&(a.displayNameStyles={fontId:c[1],effectId:c[2],colors:c.toSpliced(0,3)});
      const g=s.split("$");
      g.length>1&&g[0]===e&&(a.collectibles={nameplate:{asset:`nameplates/${g[1]}/${g[2]}/`,skuId:void 0,expiresAt:null,label:void 0,palette:g[3]}});
      a?.primaryGuild?.tag&&(a.primaryGuild.tag=a.primaryGuild.tag.replace(r.re,r.to));
    }
  }));
  C&&i.push(d.before("generate",C.prototype,function([e]){
    try{
      const a=m();
      for(const t of a){
        e?.message?.content&&(e.message.content=e.message.content.replace(t.re,t.to));
        e?.message?.author?.id&&(e.message.author.id=e.message.author.id.replace(t.re,t.to));
        e?.message?.author?.avatar&&(e.message.author.avatar=e.message.author.avatar.replace(t.re,t.to));
        e?.message?.author?.avatarDecorationData?.asset&&(e.message.author.avatarDecorationData.asset=e.message.author.avatarDecorationData.asset.replace(t.re,t.to));
        e?.message?.author?.primaryGuild?.tag&&(e.message.author.primaryGuild.tag=e.message.author.primaryGuild.tag.replace(t.re,t.to));
        e?.message?.author?.primaryGuild?.badge&&(e.message.author.primaryGuild.badge=e.message.author.primaryGuild.badge.replace(t.re,t.to));
        e?.message?.author?.primaryGuild?.identityGuildId&&(e.message.author.primaryGuild.identityGuildId=e.message.author.primaryGuild.identityGuildId.replace(t.re,t.to));
        e?.message?.author?.username&&(e.message.author.username=e.message.author.username.replace(t.re,t.to));
        e?.message?.author?.globalName&&(e.message.author.globalName=e.message.author.globalName.replace(t.re,t.to));
        e?.message?.attachments?.length&&e.message.attachments.forEach(function(r){r.url?.match(t.re)&&(r.url=t.to,r.proxy_url=t.to)});
      }
    }catch{}
  }));
  n&&i.push(d.after("default",n,function(e,a){
    try{
      const t=m();
      for(const r of t)a?.props?.children[1]?.props?.children[0]?.props?.userTag&&(a.props.children[1].props.children[0].props.userTag=a.props.children[1].props.children[0].props.userTag.replace(r.re,r.to));
    }catch{}
  }));
  p&&i.push(d.after("default",p,function(e,a){
    try{
      const t=m();
      for(const r of t)a?.props?.children[1]?.props?.userId&&(a.props.children[1].props.userId=a.props.children[1].props.userId.replace(r.re,r.to));
    }catch{}
  }));
  v&&i.push(d.after("default",v,function(e,a){
    try{
      const t=m();
      for(const r of t){
        const s=a.props.children.props.children.filter(function(l){return Boolean(l)})[0].props.children.props.channel.recipients;
        s.forEach(function(l,c){s[c]=l.replace(r.re,r.to)});
      }
    }catch{}
  }));
};
const _=function(){
  const n=JSON.parse(o.storage.rules||"[]");
  const p=function(a){o.storage.rules=JSON.stringify(a)};
  const v=function(){return p([...n,{find:"",replace:"",regex:false,ci:false}])};
  const x=function(a){return p(n.filter(function(t,r){return r!==a}))};
  const e=function(a,t){return p(n.map(function(r,s){return s===a?{...r,...t}:r}))};
  return React.createElement(w,{style:{paddingBottom:100}},
    React.createElement(D,{style:{margin:12,fontSize:16,fontWeight:"bold"}},"Replacement Rules"),
    n.map(function(a,t){
      return React.createElement(A,{key:t,style:{margin:8,padding:8,borderWidth:1,borderColor:"#666",borderRadius:6}},
        React.createElement(G,{placeholder:"Text to find",value:a.find,onChangeText:function(r){return e(t,{find:r})},style:{borderWidth:1,borderColor:"#888",padding:6,marginBottom:6,color:"#fff"}}),
        React.createElement(G,{placeholder:"Replace with",value:a.replace,onChangeText:function(r){return e(t,{replace:r})},style:{borderWidth:1,borderColor:"#888",padding:6,marginBottom:6,color:"#fff"}}),
        React.createElement(b,{label:"Case-insensitive",leading:React.createElement(h,{source:f.getAssetIDByName("ic_visibility_24px")}),value:a.ci,onValueChange:function(r){return e(t,{ci:r})}}),
        React.createElement(b,{label:"Regular expression",leading:React.createElement(h,{source:f.getAssetIDByName("ic_search_24px")}),value:a.regex,onValueChange:function(r){return e(t,{regex:r})}}),
        React.createElement(R,{title:"Delete rule",onPress:function(){return x(t)},color:"red"}),
        React.createElement(E,null)
      );
    }),
    React.createElement(R,{title:"Add rule",onPress:v})
  );
};
const J=function(){
  const[n,p]=React.useState("");
  const v=function(){
    try{
      const e=JSON.parse(n);
      if(!Array.isArray(e)){alert("Error: JSON must be an array of rules");return;}
      const a=e.map(function(t){return{find:t.find||"",replace:t.replace||"",regex:t.regex||false,ci:t.ci||false}});
      o.storage.rules=JSON.stringify(a);
      alert("Rules imported successfully!");
      p("");
    }catch(e){alert("Error parsing JSON: "+e.message);}
  };
  const x=function(){const e=JSON.parse(o.storage.rules||"[]");p(JSON.stringify(e,null,2))};
  return React.createElement(w,{style:{paddingBottom:100}},
    React.createElement(D,{style:{margin:12,fontSize:16,fontWeight:"bold"}},"JSON Configuration"),
    React.createElement(D,{style:{margin:12,fontSize:12,color:"#aaa"}},"Paste your JSON configuration below and click Save to import rules."),
    React.createElement(D,{style:{margin:12,fontSize:12,color:"#aaa"}},'Format: [{"find":"text1","replace":"text2","regex":false,"ci":false}]'),
    React.createElement(G,{placeholder:'[{"find":"old","replace":"new","regex":false,"ci":false}]',value:n,onChangeText:p,multiline:true,numberOfLines:15,style:{borderWidth:1,borderColor:"#888",padding:10,margin:12,color:"#fff",fontFamily:"monospace",fontSize:12,minHeight:300,textAlignVertical:"top"}}),
    React.createElement(A,{style:{flexDirection:"row",justifyContent:"space-around",margin:12}},
      React.createElement(R,{title:"Save JSON",onPress:v,color:"#5865F2"}),
      React.createElement(R,{title:"Export Current",onPress:x,color:"#57F287"})
    ),
    React.createElement(E,null),
    React.createElement(D,{style:{margin:12,fontSize:14,fontWeight:"bold"}},"Example JSON Format:"),
    React.createElement(G,{value:'[\n  {\n    "find": "old_text",\n    "replace": "new_text",\n    "regex": false,\n    "ci": false\n  },\n  {\n    "find": "case.*insensitive",\n    "replace": "replacement",\n    "regex": true,\n    "ci": true\n  }\n]',multiline:true,editable:false,numberOfLines:10,style:{borderWidth:1,borderColor:"#666",padding:10,margin:12,color:"#aaa",fontFamily:"monospace",fontSize:11,backgroundColor:"#1a1a1a",textAlignVertical:"top"}})
  );
};
var P={
  settings:function(){
    B.useProxy(o.storage);
    return React.createElement(w,null,
      React.createElement(b,{label:"Enable replacements",leading:React.createElement(h,{source:f.getAssetIDByName("ic_message_edit")}),value:o.storage.enabled,onValueChange:function(n){return o.storage.enabled=n}}),
      React.createElement(E,null),
      React.createElement(I,{label:"JSON Import/Export",subLabel:"Bulk manage rules with JSON configuration",leading:React.createElement(h,{source:f.getAssetIDByName("ic_add_24px")}),trailing:I.Arrow,onPress:function(){return o.storage.showJsonEditor=!o.storage.showJsonEditor}}),
      o.storage.showJsonEditor&&React.createElement(React.Fragment,null,React.createElement(E,null),React.createElement(J,null),React.createElement(R,{title:"Close JSON Editor",onPress:function(){return o.storage.showJsonEditor=false}})),
      React.createElement(E,null),
      React.createElement(I,{label:"Manage rules (manual)",subLabel:"Add, edit or delete replacement strings individually",leading:React.createElement(h,{source:f.getAssetIDByName("ic_settings_24px")}),trailing:I.Arrow,onPress:function(){return o.storage.showEditor=!o.storage.showEditor}}),
      o.storage.showEditor&&React.createElement(React.Fragment,null,React.createElement(E,null),React.createElement(_,null),React.createElement(R,{title:"Close editor",onPress:function(){return o.storage.showEditor=false}}))
    );
  },
  onLoad(){
    console.log("[TR] onLoad start");
    const k=function(){
      const n=u.findByName("UserProfilePrimaryInfo",false);
      const p=u.findByName("UserProfileAboutMeCard",false);
      const v=u.findByName("ChatViewWrapperBase",false);
      const x=u.findByStoreName("UserStore");
      const C=u.findByName("RowManager");
      if(!n||!p||!v||!x||!C){
        console.log("[TR] modules not ready, retrying...");
        return false;
      }
      S();
      return true;
    };
    if(!k()){
      let q=0;
      const z=setInterval(function(){
        q++;
        if(k()||q>30)clearInterval(z);
      },500);
    }
  },
  onUnload(){
    console.log("[TR] onUnload");
    i.forEach(function(n){return n&&n()});
  }
};
return y.default=P,Object.defineProperty(y,"__esModule",{value:true}),y;
})({},vendetta.ui.components,vendetta.plugin,vendetta.storage,vendetta.ui.assets,vendetta.metro,vendetta.patcher);
