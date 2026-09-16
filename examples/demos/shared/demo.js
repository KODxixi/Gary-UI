(() => {
  "use strict";
  const script=document.currentScript, root=document.documentElement, data=window.GARY_PROJECT_DATA;
  const all=(s,scope=document)=>[...scope.querySelectorAll(s)];
  const q=s=>document.querySelector(s);
  const reducedQuery=matchMedia("(prefers-reduced-motion: reduce)");
  const base=new URL(".",script.src);
  const safeStore=(key,value)=>{try{localStorage.setItem(key,value)}catch{}};
  const getStore=key=>{try{return localStorage.getItem(key)}catch{return null}};
  const load=name=>new Promise((resolve,reject)=>{const s=document.createElement("script");s.src=new URL(name,base);s.onload=resolve;s.onerror=()=>reject(Error("本地资源加载失败 "+name));document.head.append(s)});
  load('../../../patterns/shared/web-bar.js').catch(error=>console.error(error));
  load('../../../patterns/shared/material.js').catch(error=>console.error(error));
  const scene=document.createElement("div");scene.className="gary-scene demo-global-scene";scene.dataset.garySceneEngine="dot-grid";scene.setAttribute("aria-hidden","true");document.body.prepend(scene);
  const sceneScript=document.createElement("script");sceneScript.src=new URL("../../../patterns/shared/dot-grid.js",base);document.head.append(sceneScript);
  let theme;
  function setTheme(next) {
    theme=next==="light"?"light":"dark";root.dataset.garyTheme=theme;root.dataset.theme=theme;safeStore("gary-demo-theme",theme);
    all("[data-theme-toggle]").forEach(b=>{b.setAttribute("aria-pressed",String(theme==="light"));b.setAttribute("aria-label",theme==="light"?"切换深色主题":"切换浅色主题");b.innerHTML='<span data-icon="'+(theme==="light"?"moon":"sun")+'"></span>';window.GaryDemoIcons?.(b)});
    all("[data-visual-id]").forEach(frame=>{const url=new URL("../visuals/outputs/"+frame.dataset.visualId+"-"+theme+".html?embed=1"+(frame.dataset.visualId==="delivery-architecture"?"&readable=1":""),base);if(frame.src!==url.href)frame.src=url.href;});
    all("[data-visual-open]").forEach(a=>a.href=new URL("../visuals/outputs/"+a.dataset.visualOpen+"-"+theme+".html",base));
    all("[data-export-id]").forEach(a=>a.href=new URL("../visuals/outputs/"+a.dataset.exportId+"-"+theme+"."+a.dataset.exportFormat,base));
    all("[data-preview]").forEach(img=>img.src=new URL("../evidence/edition-02/"+img.dataset.preview+"-"+theme+".png",base));
    all("[data-demo-entry]").forEach(a=>{const url=new URL(a.getAttribute("href"),location.href);url.searchParams.set("theme",theme);a.href=url.href});
    window.dispatchEvent(new CustomEvent("gary-theme-change",{detail:{theme}}));
  }
  setTheme(new URLSearchParams(location.search).get("theme")||getStore("gary-demo-theme")||root.dataset.garyTheme);
  all("[data-theme-toggle]").forEach(b=>b.addEventListener("click",()=>setTheme(theme==="dark"?"light":"dark")));
  all("[data-print]").forEach(b=>b.addEventListener("click",()=>print()));
  all('[data-visual-id="delivery-architecture"]').forEach(frame=>{
    const caption=frame.parentElement.querySelector('.visual-media__caption p');
    if(caption)caption.append(' · 图内可滚动浏览，独立查看可缩放');
  });
  if(matchMedia('(max-width:560px)').matches)all('.visual-text').forEach(details=>details.open=true);

  const panel=q("[data-detail-panel]"), backdrop=q("[data-detail-backdrop]");
  let returnFocus;
  function closeDetail() {
    if(!panel)return;panel.hidden=true;if(backdrop)backdrop.hidden=true;
    all("main,.demo-nav,.demo-footer").forEach(el=>el.inert=false);
    returnFocus?.focus();document.body.style.overflow="";
  }
  function openDetail(title,detail,trigger) {
    if(!panel)return;returnFocus=trigger||document.activeElement;
    panel.querySelector("h2").textContent=title;panel.querySelector("[data-detail-body]").textContent=detail;
    panel.hidden=false;if(backdrop)backdrop.hidden=false;all("main,.demo-nav,.demo-footer").forEach(el=>el.inert=true);
    document.body.style.overflow="hidden";panel.querySelector("button").focus();
  }
  document.addEventListener("click",e=>{
    const detail=e.target.closest("[data-detail-trigger]");if(detail)openDetail(detail.dataset.title||"事项详情",detail.dataset.detail||"暂无补充说明",detail);
    if(e.target.closest("[data-detail-close]")||e.target===backdrop)closeDetail();
  });
  document.addEventListener("keydown",e=>{
    if(!panel||panel.hidden)return;
    if(e.key==="Escape")closeDetail();
    if(e.key==="Tab"){const focusable=all("button,a,input,[tabindex]",panel);if(e.shiftKey&&document.activeElement===focusable[0]){e.preventDefault();focusable.at(-1).focus()}else if(!e.shiftKey&&document.activeElement===focusable.at(-1)){e.preventDefault();focusable[0].focus()}}
  });
  all("[data-source-drawer]").forEach(b=>b.addEventListener("click",()=>{const d=q("[data-source-list]");d.hidden=!d.hidden;b.setAttribute("aria-expanded",String(!d.hidden));b.textContent=d.hidden?"展开来源":"收起来源"}));
  all("[data-state-set]").forEach(b=>b.addEventListener("click",()=>{const host=q("[data-view-state]");if(host){host.dataset.viewState=b.dataset.stateSet;requestAnimationFrame(()=>charts.forEach(c=>c.resize()))}}));

  const stateLabels={todo:"待处理",doing:"进行中",blocked:"阻断",done:"已完成"};
  if(q(".kanban")){
    function paint(status="all"){
      all("[data-work-item]").forEach(el=>el.remove());
      const items=data.workItems.filter(x=>status==="all"||x.status===status);
      all("[data-column]").forEach(c=>{c.hidden=status!=="all"&&c.dataset.column!==status;});
      items.forEach(item=>{
        const card=document.createElement("article");card.className="work-card";card.dataset.workItem=item.id;
        const badge=document.createElement("span");badge.className="status status--"+item.risk;badge.textContent=item.id;
        const title=document.createElement("h3");title.textContent=item.title;
        const desc=document.createElement("p");desc.className="muted";desc.textContent=item.status==="blocked"?item.detail:"截止 "+item.due+" · "+data.regions[item.region].label;
        const footer=document.createElement("footer"),person=document.createElement("span"),avatar=document.createElement("span");avatar.className="avatar";avatar.textContent=item.owner.slice(-1);person.append(avatar,item.owner);
        const button=document.createElement("button");button.className="button";button.textContent="详情";button.dataset.detailTrigger="";button.dataset.title=item.id+" "+item.title;button.dataset.detail=item.owner+"负责 · 截止 "+item.due+"。"+item.detail;
        footer.append(person,button);card.append(badge,title,desc,footer);q('[data-column="'+item.status+'"]').append(card);
      });
      all("[data-column]").forEach(c=>c.querySelector("[data-count]").textContent=c.querySelectorAll("[data-work-item]").length);
      q("[data-board-status]").textContent="显示 "+items.length+" 个工作项 · "+(status==="all"?"全部状态":stateLabels[status]);
      all("[data-status]").forEach(b=>{b.classList.toggle("is-active",b.dataset.status===status);b.setAttribute("aria-pressed",String(b.dataset.status===status))});
    }
    all("[data-status]").forEach(b=>b.addEventListener("click",()=>paint(b.dataset.status)));paint();
  }
  if(q("[data-search]")){
    const list=q(".article-list");
    function select(article){
      q("[data-article-title]").textContent={decision:"为什么分阶段交付",evidence:"让每次交付可追溯",accessibility:"内容完整操作可达"}[article.id];q("[data-article-type]").textContent=article.type+" / PROJECT LIBRARY";q("[data-article-source]").textContent=article.source;q("[data-article-body]").textContent=article.body;
      q("[data-article-quote]").textContent=article.id==="decision"?"推进可以分阶段 完成必须有同一标准":article.id==="evidence"?"保留来源 才能解释每一次交付":"内容完整可读 操作始终可达";
      q("[data-article-application]").textContent=article.id==="decision"?"上海继续完善样板，江苏优先解决退款口径，浙江完成培训材料。三地按不同的准备情况推进，但每个完成节点都需要可核验的证据。":article.id==="evidence"?"本次生成从候选开始，成功才替换正式版本。出错时保留原生源和错误回执，上一有效报告及其导出继续成套提供。":"长篇中文保持完整语义。窄屏重排后仍能搜索、阅读来源和打开图示；开启减弱动态时直接呈现完整内容。";
      all("button",list).forEach(b=>b.setAttribute("aria-selected",String(b.dataset.id===article.id)));
    }
    function render(term=""){
      const items=data.articles.filter(a=>(a.title+a.body).includes(term));list.replaceChildren();
      items.forEach(a=>{const b=document.createElement("button");b.dataset.id=a.id;b.type="button";const title=document.createElement("strong"),tag=document.createElement("small");title.textContent=a.title;tag.textContent=a.type;b.append(title,tag);b.addEventListener("click",()=>select(a));list.append(b)});
      q("[data-search-status]").textContent=items.length?items.length+" 篇相关文档":"没有匹配的文档，试试其他关键词";
      q("[data-article-detail]").hidden=items.length===0;if(items[0])select(items[0]);
    }
    q("[data-search]").addEventListener("input",e=>render(e.target.value.trim()));render();
  }
  if(q("[data-execution-table]"))data.workItems.forEach(item=>{const row=document.createElement("tr");[item.id,item.title,item.owner,item.due,item.detail].forEach(value=>{const td=document.createElement("td");td.textContent=value;row.append(td)});q("[data-execution-table]").append(row)});

  const months=["3月","4月","5月","6月","7月","8月"];
  let regionKey="all",charts=[],policy,analysisChart;
  function refreshTrendExports(){
    if(!analysisChart)return;
    const background=policy.themes[theme].background;
    const svg=analysisChart.getDataURL({type:"svg",pixelRatio:1,backgroundColor:background});
    const pngSource=analysisChart.getDataURL({type:"svg",pixelRatio:2,backgroundColor:background});
    all('[data-export-id="delivery-trend"]').forEach(link=>{
      const format=link.dataset.exportFormat;
      if(!["svg","png"].includes(format))return;
      if(format==="svg")link.href=svg;
      link.download=`delivery-trend-${regionKey}-${theme}.${format}`;
      if(format!=="png")return;
      link.dataset.exportReady="false";
      const image=new Image();
      image.onload=()=>{
        const canvas=document.createElement("canvas");
        canvas.width=image.naturalWidth||analysisChart.getWidth()*2;
        canvas.height=image.naturalHeight||analysisChart.getHeight()*2;
        const context=canvas.getContext("2d");
        if(context){context.drawImage(image,0,0,canvas.width,canvas.height);link.href=canvas.toDataURL("image/png");link.dataset.exportReady="true";}
      };
      image.onerror=()=>{link.dataset.exportReady="error";};
      image.src=pngSource;
    });
  }
  function draw(region=data.regions[regionKey]){
    all("[data-trend-table]").forEach(body=>{body.replaceChildren(...months.map((m,i)=>{const tr=document.createElement("tr");[m,region.trend[i],region.target[i]].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.append(td)});return tr}))});
    if(!policy||!window.echarts)return;
    const palette=policy.palettes[theme],colors=policy.themes[theme],font=policy.fontFamily;
    charts.forEach(c=>c.setOption({animation:!reducedQuery.matches,animationDuration:350,animationDurationUpdate:350,color:palette,textStyle:{fontFamily:font,color:colors.text},aria:{enabled:true},tooltip:{trigger:"axis",confine:true,backgroundColor:colors.surface,borderColor:colors.border,textStyle:{color:colors.text,fontFamily:font}},legend:{top:0,right:0,itemWidth:18,itemHeight:7,textStyle:{color:colors.muted,fontFamily:font},data:["实际","目标"]},grid:{left:44,right:14,top:48,bottom:38},xAxis:{type:"category",data:months,boundaryGap:false,axisTick:{show:false},axisLine:{show:false},axisLabel:{color:colors.muted,margin:16}},yAxis:{type:"value",min:0,max:100,interval:25,axisLabel:{color:colors.muted,formatter:"{value}%"},splitLine:{lineStyle:{color:colors.border,type:"dashed"}}},series:[{name:"实际",type:"line",smooth:false,data:region.trend,symbol:"circle",symbolSize:6,lineStyle:{width:3},areaStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:palette[0]+"30"},{offset:1,color:palette[0]+"00"}])}},{name:"目标",type:"line",smooth:false,data:region.target,symbol:"none",lineStyle:{type:"dashed",width:1.5},itemStyle:{color:palette[1]}}]}));
    refreshTrendExports();
  }
  function updateRegion(key){
    regionKey=data.regions[key]?key:"all";const r=data.regions[regionKey];
    all("[data-region-value]").forEach(el=>{el.textContent=r[el.dataset.regionValue].toLocaleString("en-US")});
    all("[data-region-label]").forEach(el=>el.textContent=r.label);
    all("[data-filter-region]").forEach(b=>{b.classList.toggle("is-active",b.dataset.filterRegion===regionKey);b.setAttribute("aria-pressed",String(b.dataset.filterRegion===regionKey))});
    if(q("[data-region-delta]"))q("[data-region-delta]").textContent="+"+(r.completion-r.trend.at(-2))+"pp";
    if(q("[data-progress-evidence]"))q("[data-progress-evidence]").textContent="实际 "+r.completion+"% / 目标 "+r.target.at(-1)+"%";
    const judgments={all:["推进交付 保留发布门槛","江苏退款口径尚未书面确认。取得确认前，继续保留双口径。","1 项阻断管理层发布"],shanghai:["保持样板 持续验证","上海完成率已达 86%，继续完善证据归档，向其他区域提供稳定样板。","1 项风险 正在跟进"],jiangsu:["确认口径 再行发布","退款归属月份待书面确认。周野负责在 09-06 决策门前完成确认。","1 项阻断发布 1 项跟进"],zhejiang:["完善培训 逐项推进","浙江完成率 68%，优先将培训材料整理为任务导向章节，降低一线理解成本。","1 项培训风险"]};
    if(q("[data-judgement-title]")){q("[data-judgement-title]").textContent=judgments[regionKey][0];q("[data-judgement-body]").textContent=judgments[regionKey][1];q("[data-risk-caption]").textContent=judgments[regionKey][2];q("[data-judgement-status]").textContent=regionKey==="shanghai"?"按计划推进":"需关注";}
    const judgementDetail=q("#evidence [data-detail-trigger]");
    if(judgementDetail){judgementDetail.dataset.title=r.label+"交付详情";judgementDetail.dataset.detail=judgments[regionKey][1];}
    const table=q("[data-region-table]");
    if(table){table.replaceChildren();Object.entries(data.regions).filter(([k])=>k!=="all"&&(regionKey==="all"||k===regionKey)).forEach(([k,v])=>{
      const tr=document.createElement("tr");[v.label,v.revenue.toLocaleString("en-US"),v.completion+"%",v.risks].forEach((value,i)=>{const td=document.createElement("td");td.textContent=value;if(i)td.className="num";tr.append(td)});
      const state=document.createElement("td"),badge=document.createElement("span");badge.className="status status--"+({shanghai:"done",jiangsu:"high",zhejiang:"medium"}[k]);badge.textContent={shanghai:"稳定",jiangsu:"阻断",zhejiang:"追赶"}[k];state.append(badge);
      const action=document.createElement("td"),button=document.createElement("button");button.className="button button--ghost";button.textContent="详情";button.dataset.detailTrigger="";button.dataset.title=v.label+"交付详情";button.dataset.detail=judgments[k][1];action.append(button);tr.append(state,action);table.append(tr);
    })}
    const host=q("[data-view-state]");if(host)host.dataset.viewState="ready";draw(r);
  }
  all("[data-filter-region]").forEach(b=>b.addEventListener("click",()=>updateRegion(b.dataset.filterRegion)));
  if(q("[data-filter-region]"))updateRegion("all");else draw(data.regions.all);
  load("chart-policy.js").then(()=>{policy=window.GARY_DEMO_CHART_POLICY;all("#analysis-chart,#exec-chart,#report-chart").forEach(el=>{const c=echarts.init(el,null,{renderer:"svg"});charts.push(c);if(el.id==="analysis-chart")analysisChart=c;new ResizeObserver(()=>c.resize()).observe(el)});draw();window.__garyDemoReady=true}).catch(e=>{console.error(e);q("[data-view-state]")?.setAttribute("data-view-state","error")});
  load("icons.js").catch(console.error);
  addEventListener("gary-theme-change",()=>draw());

  // A bounded 2.4-second entrance for the focal cards; pause/resume retains currentTime.
  const motionItems=all("[data-motion-item]");let animations=[],run=0;
  const status=q("[data-motion-status]");
  function stopMotion(){run++;animations.forEach(a=>a.cancel());animations=[];if(status)status.textContent="完整呈现";const p=q("[data-motion-progress]");if(p)p.style.width="100%";}
  function play(replay=false){
    if(reducedQuery.matches||document.body.classList.contains("static-reading")||!motionItems.length)return;
    if(!replay&&animations.length&&animations.some(a=>a.playState==="paused")){animations.forEach(a=>a.play());if(status)status.textContent="播放中";return;}
    const token=++run;animations.forEach(a=>a.cancel());
    animations=motionItems.map((el,i)=>el.animate([{opacity:.15,transform:"translateY(20px)"},{opacity:1,transform:"translateY(0)"}],{duration:350,delay:i*350,fill:"backwards",easing:"cubic-bezier(.22,.68,0,1)"}));
    const progress=q("[data-motion-progress]");if(progress)animations.push(progress.animate([{width:"0%"},{width:"100%"}],{duration:2400,fill:"forwards"}));
    if(status)status.textContent="播放中";document.body.dataset.motion="playing";
    Promise.all(animations.map(a=>a.finished.catch(()=>null))).then(()=>{if(token===run){if(status)status.textContent="完整呈现";document.body.dataset.motion="complete"}});
  }
  all("[data-motion-action]").forEach(b=>b.addEventListener("click",()=>{if(b.dataset.motionAction==="pause"){animations.forEach(a=>a.pause());if(status)status.textContent="已暂停";document.body.dataset.motion="paused"}else play(b.dataset.motionAction==="replay")}));
  all("[data-static-reading]").forEach(b=>b.addEventListener("click",()=>{const active=document.body.classList.toggle("static-reading");b.setAttribute("aria-pressed",String(active));b.textContent=active?"演示模式":"静态阅读";stopMotion()}));
  reducedQuery.addEventListener("change",()=>{if(reducedQuery.matches)stopMotion()});
  addEventListener("pagehide",stopMotion);addEventListener("beforeprint",stopMotion);
  let printDetails=[];
  addEventListener('beforeprint',()=>{printDetails=all('.visual-text').map(el=>[el,el.open]);printDetails.forEach(([el])=>el.open=true)});
  addEventListener('afterprint',()=>{printDetails.forEach(([el,open])=>el.open=open);printDetails=[]});
  all("[data-gallery-filter]").forEach(b=>b.addEventListener("click",()=>{all("[data-gallery-filter]").forEach(x=>{x.classList.toggle("is-active",x===b);x.setAttribute("aria-pressed",String(x===b))});all("[data-category]").forEach(card=>card.hidden=b.dataset.galleryFilter!=="all"&&card.dataset.category!==b.dataset.galleryFilter)}));
  window.GaryDemo={setTheme,updateRegion,openDetail,reduced:reducedQuery.matches};
})();
