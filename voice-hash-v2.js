(()=>{
  const body=document.body;
  const target=body.dataset.voiceTarget||'';
  const mic=document.getElementById('voiceMic');
  const status=document.getElementById('voiceStatus');
  const text=document.getElementById('voiceText');
  const review=document.getElementById('voiceReview');
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  let recognition=null;
  let listening=false;
  let finalText='';

  const setStatus=(msg,kind='')=>{
    if(!status)return;
    status.textContent=msg;
    status.className='voice-status'+(kind?' '+kind:'');
  };
  const sync=()=>{
    const has=!!(text&&text.value.trim());
    if(review)review.disabled=!has;
  };
  const setListening=(on)=>{
    listening=!!on;
    if(mic){
      mic.classList.toggle('listening',listening);
      mic.setAttribute('aria-pressed',listening?'true':'false');
    }
  };
  const fallback=()=>{
    setListening(false);
    setStatus('Aquest navegador no ofereix reconeixement de veu directe. Toca el camp i usa el dictat del teclat.','warn');
    if(text)text.focus();
  };

  if(text)text.addEventListener('input',sync);

  if(mic)mic.addEventListener('click',()=>{
    if(listening&&recognition){
      try{recognition.stop();}catch(_e){}
      return;
    }
    if(!SR){fallback();return;}
    setStatus('Activant micròfon…');
    finalText='';
    const r=new SR();
    recognition=r;
    r.lang='ca-ES';
    r.continuous=false;
    r.interimResults=true;
    r.maxAlternatives=1;
    r.onstart=()=>{setListening(true);setStatus('Escoltant… parla ara.','live');};
    r.onresult=(ev)=>{
      let interim='';
      for(let i=ev.resultIndex;i<ev.results.length;i++){
        const t=(ev.results[i][0]&&ev.results[i][0].transcript)||'';
        if(ev.results[i].isFinal)finalText+=(finalText?' ':'')+t;
        else interim+=t;
      }
      if(text)text.value=(finalText+(interim?' '+interim:'')).trim();
      sync();
    };
    r.onerror=(ev)=>{
      setListening(false);
      recognition=null;
      const e=ev&&ev.error;
      if(e==='not-allowed'||e==='service-not-allowed') setStatus('No hi ha permís de micròfon. Activa’l per a aquesta web i torna-ho a provar.','error');
      else if(e==='no-speech') setStatus('No he detectat veu. Torna a prémer el micròfon i parla.','warn');
      else if(e==='audio-capture') setStatus('No s’ha pogut accedir al micròfon del dispositiu.','error');
      else if(e==='network') setStatus('El reconeixement de veu no està disponible ara mateix. Pots usar el dictat del teclat.','warn');
      else setStatus('No s’ha pogut iniciar el reconeixement de veu. Pots usar el dictat del teclat.','warn');
    };
    r.onend=()=>{
      recognition=null;
      setListening(false);
      if(text&&text.value.trim())setStatus('Text capturat. Revisa’l i continua.','ok');
      else if(!status.classList.contains('error')&&!status.classList.contains('warn'))setStatus('Toca el micròfon per tornar-ho a provar.');
      sync();
    };
    try{r.start();}catch(_e){
      recognition=null;
      setListening(false);
      setStatus('No s’ha pogut activar el micròfon. Pots usar el dictat del teclat.','warn');
    }
  });

  if(review)review.addEventListener('click',()=>{
    const transcript=text?text.value.trim():'';
    if(!transcript||!target)return;
    const u=new URL(target);
    u.searchParams.set('voice','1');
    u.hash='voiceText='+encodeURIComponent(transcript);
    setStatus('Obrint NEXUS per revisar la incidència…','ok');
    location.assign(u.toString());
  });

  if(!SR)setStatus('Micròfon directe no disponible en aquest navegador. Pots usar el dictat del teclat.','warn');
  else setStatus('Toca el micròfon per començar.');
  sync();
})();