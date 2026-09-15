/* A graphical replay of the paper's GrailQA appendix example. */
(() => {
  'use strict';
  const root = document.getElementById('kbqa-trace');
  if (!root) return;
  const stories = [
    ['Helping Freddie','m.09gs5hv'],
    ['Rallying Round Old George','m.09gs5hy'],
    ['Absent Treatment','m.09gs5hr'],
    ['Disentangling Old Duggie','m.010r9gwy'],
    ['The Test Case','m.010rlht0'],
    ['Concealed Art','m.010rlh9d'],
    ['Doing Clarence a Bit of Good','m.09gs5j0']
  ];
  const steps = [
    {label:'Start',title:'Start from the story in the question',count:'1 topic entity',think:'Find other short stories that share a character with the given story.',action:'Ground the topic entity',observe:'Doing Clarence a Bit of Good is the starting point.',raw:"Topic entity: Doing Clarence a Bit of Good (m.09gs5j0)"},
    {label:'Find character',title:'Follow the first relation to a character',count:'1 character found',think:'Who appears in the original story?',action:'Find_relation → shared character',observe:'The knowledge base returns Reggie Pepper.',raw:'Find_relation [ m.09gs5j0 | book.book_character.character_appearing ]\n\nReturned: m.0dzx0p (Reggie Pepper)'},
    {label:'Find stories',title:'Expand from the character to seven stories',count:'7 candidates',think:'Which short stories feature Reggie Pepper?',action:'Find_relation → short stories',observe:'Seven stories are returned, including the original story.',raw:'Find_relation [ m.0dzx0p | book.short_story.characters ]\n\nReturned entities:\n'+stories.map(([name,id])=>id+' — '+name).join('\n')},
    {label:'Verify type',title:'Verify that all seven candidates are short stories',count:'7 type-checked',think:'Check the requested type against the knowledge base.',action:'Merge → book.short_story',observe:'All seven pass the type check. The original story is still present.',raw:"Merge [ expression2 | book.short_story ]\n\nexpression3 = START('book.short_story')\nexpression2 = AND(expression2, expression3)\n\nReturned: the same seven candidate entities."},
    {label:'Answer',title:'Exclude the original story and return six answers',count:'6 final answers',think:'The question asks for other stories, so omit the starting entity.',action:'Return the six remaining entity IDs',observe:'Six answers remain; they match the gold answer set.',raw:'Final answer (no additional tool call):\n'+stories.slice(0,6).map(([,id])=>id).join(' ')}
  ];
  const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  root.innerHTML = `
    <header class="kg-top"><div class="kg-brand"><span>KBQA-R1 / A REASONING TRACE</span><span>GrailQA · Freebase</span></div>
      <p class="kg-question">What short story has a character who also is in<br class="kg-question-break"> <em>Doing Clarence a Bit of Good</em>?</p></header>
    <nav class="kg-steps" aria-label="Reasoning steps">${steps.map((s,i)=>`<button class="kg-step" type="button" data-step="${i}"><span>${i+1}</span>${s.label}</button>`).join('')}</nav>
    <div class="kg-stage-head"><h3 id="kg-stage-title"></h3><span class="kg-count"></span></div>
    <svg class="kg-graph" role="img" aria-labelledby="kg-svg-title kg-svg-description"></svg>
    <div class="kg-state" aria-live="polite" aria-atomic="true"><div><h4>THINK</h4><p class="kg-think"></p></div><div><h4>ACT</h4><p class="kg-action"></p></div><div><h4>OBSERVE</h4><p class="kg-observe"></p></div></div>
    <footer class="kg-bottom"><div class="kg-legend"><span><i></i>Topic entity</span><span><i></i>Retrieved / retained</span><span><i></i>Excluded at the end</span></div><div class="kg-controls"><button type="button" class="kg-prev" aria-label="Previous step">← Back</button><button type="button" class="kg-play" aria-label="Play reasoning trace">▶ Play</button><button type="button" class="kg-next" aria-label="Next step">Next →</button><button type="button" class="kg-reset" aria-label="Reset reasoning trace">↺ Reset</button></div></footer>`;
  const svg = root.querySelector('svg');
  const media = matchMedia('(max-width:650px)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  let index=0, displayed=-1, playing=false, timer=null, frame=null;
  const colors={ink:'#183149',muted:'#768c9f',line:'#dce6ee',teal:'#087e82',blue:'#3268cc',amber:'#a3632f'};
  const text=(x,y,label,size=17,fill=colors.ink,weight=500,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${fill}" font-size="${size}" font-weight="${weight}">${escape(label)}</text>`;
  function node(x,y,w,h,lines,kind='neutral',sub='',opacity=1,status='') {
    const color=kind==='blue'?colors.blue:kind==='teal'?colors.teal:kind==='excluded'?colors.amber:colors.muted;
    const fill=kind==='blue'?'#edf3ff':kind==='teal'?'#eaf7f4':kind==='excluded'?'#fcf2e8':'#f5f8fb';
    const start=y+(h-(lines.length-1)*22-(sub?20:0))/2+6;
    return `<g opacity="${opacity}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="11" fill="${fill}" stroke="${kind==='neutral'?colors.line:color}" stroke-width="${kind==='neutral'?1:1.6}" ${kind==='excluded'?'stroke-dasharray="5 4"':''}/>${lines.map((l,i)=>text(x+w/2,start+i*22,l,17,kind==='neutral'?colors.muted:color,600)).join('')}${sub?text(x+w/2,start+lines.length*22,sub,12,color,400):''}${status?text(x+w-15,y+18,status,13,color,700):''}</g>`;
  }
  const line=(d,active=false,opacity=1)=>`<path d="${d}" fill="none" stroke="${active?colors.teal:colors.line}" stroke-width="${active?2.6:1.5}" ${active?'marker-end="url(#kg-arrow)"':'stroke-dasharray="5 5"'} opacity="${opacity}"/>`;
  function graph(step,progress=1) {
    const mobile=media.matches, transition=progress<1;
    const reveal1=step>=1?(step===1?progress:1):0;
    const reveal2=step>=2?(step===2?progress:1):0;
    const verify=step>=3, final=step===4;
    let out=`<title id="kg-svg-title">${escape(steps[step].title)}</title><desc id="kg-svg-description">${escape(steps[step].observe)} Edges show the traversal from the topic story to Reggie Pepper, then to candidate stories. The topic story is excluded only in the final step.</desc><defs><marker id="kg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="${colors.teal}"/></marker></defs>`;
    if (!mobile) {
      svg.setAttribute('viewBox','0 0 1140 470');
      out+=text(159,46,'TOPIC STORY',11,colors.muted,700)+text(471,46,'SHARED CHARACTER',11,colors.muted,700)+text(902,46,final?'FINAL ANSWER SET':verify?'VERIFIED SHORT STORIES':'CANDIDATE STORIES',11,colors.muted,700);
      out+=line('M286 240 L363 240',reveal1>0,reveal1||1);
      out+=text(325,205,'character',12,reveal1?colors.teal:colors.muted,500);
      const ys=stories.map((_,i)=>70+i*53);
      ys.forEach(y=>{out+=line(`M577 240 C655 240 645 ${y+22} 738 ${y+22}`,reveal2>0,reveal2||.7);});
      out+=text(661,442,'appears in stories',12,reveal2?colors.teal:colors.muted,500);
      out+=node(32,193,254,94,['Doing Clarence','a Bit of Good'],'blue','topic · m.09gs5j0');
      out+=node(363,200,214,80,[reveal1?'Reggie Pepper':'Shared character'],reveal1?'teal':'neutral',reveal1?'intermediate entity':'not retrieved yet',reveal1?.3+.7*reveal1:1);
      stories.forEach(([name],i)=>{
        const excluded=final&&i===6;
        out+=node(738,ys[i],330,44,[reveal2?name:'· · ·'],reveal2?(excluded?'excluded':'teal'):'neutral','',reveal2?.25+.75*reveal2:.7,excluded?'−':verify?'✓':'');
      });
      if(final) out+=text(902,461,'− Original story excluded · 6 answers retained',12,colors.amber,500);
      if(transition&&step===1)out+=`<circle cx="${286+77*progress}" cy="240" r="6" fill="#fff" stroke="${colors.teal}" stroke-width="3"/>`;
      if(transition&&step===2)ys.forEach(y=>{const p=progress, q=1-p;const x=q*q*q*577+3*q*q*p*655+3*q*p*p*645+p*p*p*738;const yy=q*q*q*240+3*q*q*p*240+3*q*p*p*(y+22)+p*p*p*(y+22);out+=`<circle cx="${x}" cy="${yy}" r="4" fill="${colors.teal}"/>`;});
    } else {
      svg.setAttribute('viewBox','0 0 650 760');
      out+=node(181,25,288,80,['Doing Clarence a Bit of Good'],'blue','topic entity');
      out+=line('M325 105 L325 179',reveal1>0);
      out+=text(342,146,'character',17,reveal1?colors.teal:colors.muted,500,'start');
      out+=node(205,179,240,72,[reveal1?'Reggie Pepper':'Shared character'],reveal1?'teal':'neutral');
      out+=line('M325 251 L325 301',reveal2>0);
      out+=text(325,332,'APPEARS IN STORIES',15,reveal2?colors.teal:colors.muted,600);
      out+=line('M325 347 L325 629',reveal2>0);
      stories.forEach(([name],i)=>{
        const x=i===6?171:i%2===0?26:338,y=365+Math.floor(i/2)*91,w=286;
        const cx=x+w/2;
        if(i<6)out+=line(`M325 ${y+35} L${i%2===0?314:336} ${y+35}`,reveal2>0);
        else out+=line(`M325 629 L325 ${y-3}`,reveal2>0);
        let lines=[name];if(name==='Rallying Round Old George')lines=['Rallying Round','Old George'];if(name==='Disentangling Old Duggie')lines=['Disentangling','Old Duggie'];if(i===6)lines=['Doing Clarence','a Bit of Good'];
        out+=node(x,y,w,70,reveal2?lines:['· · ·'],reveal2?(final&&i===6?'excluded':'teal'):'neutral','',1,final&&i===6?'−':verify?'✓':'');
      });
      if(final)out+=text(325,741,'Original story excluded · 6 answers retained',17,colors.amber,500);
    }
    svg.innerHTML=out;
  }
  function render(step,progress=1) {
    index=Math.max(0,Math.min(4,step));const s=steps[index];
    if(displayed!==index) {
    displayed=index;
    root.dataset.step=index;
    root.querySelector('#kg-stage-title').textContent=s.title;
    root.querySelector('.kg-count').textContent=s.count;
    root.querySelector('.kg-think').textContent=s.think;
    root.querySelector('.kg-action').textContent=s.action;
    root.querySelector('.kg-observe').textContent=s.observe;
    const raw=document.getElementById('kg-raw');if(raw)raw.textContent=s.raw;
    root.querySelectorAll('[data-step]').forEach((b,i)=>{b.classList.toggle('active',i===index);b.classList.toggle('done',i<index);if(i===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
    root.querySelector('.kg-prev').disabled=index===0;
    root.querySelector('.kg-next').disabled=index===4;
    }
    graph(index,progress);
  }
  function stop() { playing=false;clearTimeout(timer);cancelAnimationFrame(frame);root.querySelector('.kg-play').textContent='▶ Play';root.querySelector('.kg-play').setAttribute('aria-label','Play reasoning trace');render(index); }
  function advance() {
    if(!playing)return;
    if(index===4){stop();return;}
    const next=index+1,start=performance.now();
    const tick=now=>{if(!playing)return;const p=reduced.matches?1:Math.min(1,(now-start)/900);render(next,p);if(p<1)frame=requestAnimationFrame(tick);else timer=setTimeout(advance,3600);};
    frame=requestAnimationFrame(tick);
  }
  function play() { if(playing){stop();return;}if(index===4)render(0);playing=true;root.querySelector('.kg-play').textContent='Ⅱ Pause';root.querySelector('.kg-play').setAttribute('aria-label','Pause reasoning trace');timer=setTimeout(advance,2800); }
  root.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{stop();render(Number(b.dataset.step));}));
  root.querySelector('.kg-prev').addEventListener('click',()=>{const n=index-1;stop();render(n);});
  root.querySelector('.kg-next').addEventListener('click',()=>{const n=index+1;stop();render(n);});
  root.querySelector('.kg-reset').addEventListener('click',()=>{stop();render(0);});
  root.querySelector('.kg-play').addEventListener('click',play);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  media.addEventListener('change',()=>render(index));
  render(0);
  // Deterministic export of the same visualization, also useful for manual QA.
  window.kbqaTrace={setStep:(i,p=1)=>{stop();render(i,p);},getStep:()=>index,stories};
})();
