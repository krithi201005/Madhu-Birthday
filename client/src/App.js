import React, { useState, useEffect, useRef, useCallback } from 'react';

const API = process.env.REACT_APP_API_URL || '';
const NOTE_COLORS = ['#FFD166','#FF6B9D','#06D6A0','#74B9FF','#A29BFE'];
const ROTATIONS   = [-3,-1.5,1,2.5,-2,1.5,-1,3,2,-2.5];
const PALETTE     = ['#FF6B9D','#FFD166','#06D6A0','#74B9FF','#A29BFE','#FF7675'];

/* ─── CONFETTI ──────────────────────────────────────────────────────────── */
function Confetti() {
  const pieces = Array.from({length:40},(_,i)=>({
    id:i, left:Math.random()*100,
    delay:Math.random()*5, dur:4+Math.random()*4,
    color:PALETTE[i%PALETTE.length],
    size:7+Math.random()*7, round:Math.random()>.5,
  }));
  return (
    <div className="confetti-wrap" aria-hidden>
      {pieces.map(p=>(
        <div key={p.id} className="confetti-piece" style={{
          left:`${p.left}%`, background:p.color,
          width:p.size, height:p.size,
          borderRadius:p.round?'50%':'2px',
          animationDelay:`${p.delay}s`,
          animationDuration:`${p.dur}s`,
        }}/>
      ))}
    </div>
  );
}

/* ─── BALLOON ───────────────────────────────────────────────────────────── */
function Balloon({color,style}){
  return (
    <div className="balloon" style={style}>
      <svg width="54" height="74" viewBox="0 0 54 74">
        <ellipse cx="27" cy="27" rx="24" ry="27" fill={color}/>
        <ellipse cx="20" cy="16" rx="7" ry="9" fill="rgba(255,255,255,.22)"/>
        <polygon points="27,54 24,60 30,60" fill={color}/>
        <line x1="27" y1="60" x2="27" y2="74" stroke="#888" strokeWidth="1.5"/>
      </svg>
    </div>
  );
}

/* ─── CAKE ──────────────────────────────────────────────────────────────── */
function Cake(){
  const [blown,setBlown] = useState(Array(6).fill(false));
  const allOut = blown.every(Boolean);
  const candleColors=['#FF6B9D','#FFD166','#06D6A0','#74B9FF','#A29BFE','#FF7675'];
  const dotColors=['#FF6B9D','#06D6A0','#74B9FF','#A29BFE','#FF6B9D','#FFD166','#06D6A0','#FF7675'];
  return (
    <div className="cake-card">
      <div className="candles-row">
        {candleColors.map((c,i)=>(
          <div key={i} className="candle"
            onClick={()=>setBlown(b=>{const n=[...b];n[i]=!n[i];return n;})}>
            {!blown[i]&&<div className="flame"/>}
            <div className="candle-body" style={{background:c}}/>
          </div>
        ))}
      </div>
      <div className="cake-top"/>
      <div className="cake-mid">
        {dotColors.map((c,i)=><span key={i} className="dot" style={{background:c}}/>)}
      </div>
      <div className="cake-base">For Madhu 🎂</div>
      <p className="cake-hint">
        {allOut?'🎉 Wishes are coming true!':'Tap each candle to blow it out →'}
      </p>
    </div>
  );
}

/* ─── PHOTOS ────────────────────────────────────────────────────────────── */
function Photos(){
  const [photos,setPhotos]   = useState([]);
  const [caption,setCaption] = useState('');
  const [uploading,setUploading] = useState(false);
  const [loading,setLoading] = useState(true);
  const fileRef = useRef();

  // Fetch & auto-refresh every 5 seconds so everyone sees updates in real time
  const fetchPhotos = useCallback(async()=>{
    try{
      const r = await fetch(`${API}/api/photos`);
      const d = await r.json();
      setPhotos(Array.isArray(d)?d:[]);
    }catch(_){}
    setLoading(false);
  },[]);

  useEffect(()=>{
    fetchPhotos();
    const t = setInterval(fetchPhotos, 5000);
    return ()=>clearInterval(t);
  },[fetchPhotos]);

  const handleUpload = async(file)=>{
    if(!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('photo',file);
    fd.append('caption',caption);
    try{
      const r = await fetch(`${API}/api/photos`,{method:'POST',body:fd});
      const p = await r.json();
      if(p.id) setPhotos(prev=>[p,...prev]);
      setCaption('');
    }catch(_){ alert('Upload failed, try again.'); }
    setUploading(false);
  };

  const deletePhoto = async(id)=>{
    if(!window.confirm('Remove this photo?')) return;
    await fetch(`${API}/api/photos/${id}`,{method:'DELETE'});
    setPhotos(prev=>prev.filter(p=>p.id!==id));
  };

  return (
    <section className="section photo-section" id="photos">
      <span className="pill" style={{background:'#06D6A0',color:'#000'}}>
        scrapbook of memories
      </span>
      <h2>Polaroids &amp; little moments</h2>
      <p className="sub">Drop a memory below — your photo joins the wall instantly.</p>

      <div className="upload-box"
        onDrop={e=>{e.preventDefault();handleUpload(e.dataTransfer.files[0]);}}
        onDragOver={e=>e.preventDefault()}>
        <input className="text-in" value={caption}
          onChange={e=>setCaption(e.target.value)}
          placeholder="Caption this memory..." maxLength={60}/>
        <button className="btn-pink"
          onClick={()=>fileRef.current.click()} disabled={uploading}>
          {uploading?'⏳ Uploading...':'📸 Drop a photo'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden
          onChange={e=>handleUpload(e.target.files[0])}/>
        <p className="hint">📷 Up to 5 MB · visible to everyone instantly</p>
      </div>

      {loading
        ? <p className="loading-txt">Loading memories...</p>
        : photos.length===0
          ? <p className="loading-txt">No photos yet — be the first! 📸</p>
          : (
            <div className="photos-grid">
              {photos.map((p,i)=>(
                <div key={p.id} className="polaroid"
                  style={{transform:`rotate(${ROTATIONS[i%ROTATIONS.length]}deg)`}}>
                  <button className="del-btn" onClick={()=>deletePhoto(p.id)}>✕</button>
                  <img src={p.url} alt={p.caption||'memory'}/>
                  <p className="pol-cap">{p.caption||'♥'}</p>
                </div>
              ))}
            </div>
          )
      }
    </section>
  );
}

/* ─── NOTES ─────────────────────────────────────────────────────────────── */
function Notes(){
  const [notes,setNotes]   = useState([]);
  const [name,setName]     = useState('');
  const [msg,setMsg]       = useState('');
  const [color,setColor]   = useState(NOTE_COLORS[0]);
  const [sending,setSending] = useState(false);
  const [loading,setLoading] = useState(true);

  const fetchNotes = useCallback(async()=>{
    try{
      const r = await fetch(`${API}/api/notes`);
      const d = await r.json();
      setNotes(Array.isArray(d)?d:[]);
    }catch(_){}
    setLoading(false);
  },[]);

  useEffect(()=>{
    fetchNotes();
    const t = setInterval(fetchNotes,5000);
    return ()=>clearInterval(t);
  },[fetchNotes]);

  const submit = async()=>{
    if(!name.trim()||!msg.trim()) return;
    setSending(true);
    try{
      const r = await fetch(`${API}/api/notes`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({name,message:msg,color}),
      });
      const n = await r.json();
      if(n.id) setNotes(prev=>[n,...prev]);
      setName(''); setMsg('');
    }catch(_){}
    setSending(false);
  };

  const deleteNote = async(id)=>{
    if(!window.confirm('Remove this wish?')) return;
    await fetch(`${API}/api/notes/${id}`,{method:'DELETE'});
    setNotes(prev=>prev.filter(n=>n.id!==id));
  };

  return (
    <section className="section notes-section" id="wishes">
      <span className="pill" style={{background:'#A29BFE'}}>sticky-note wishes</span>
      <h2>Leave a wish on the wall</h2>

      <div className="note-form">
        <div className="note-row">
          <input className="text-in" value={name}
            onChange={e=>setName(e.target.value)}
            placeholder="Your name" maxLength={40}/>
          <div className="color-pick">
            <span>Color</span>
            {NOTE_COLORS.map(c=>(
              <button key={c} className={`cdot${color===c?' active':''}`}
                style={{background:c}} onClick={()=>setColor(c)}/>
            ))}
          </div>
        </div>
        <textarea className="text-area" value={msg}
          onChange={e=>setMsg(e.target.value)}
          placeholder="Write a wish for Madhu..." maxLength={300} rows={3}/>
        <div className="note-foot">
          <span className="char-count">{msg.length}/300</span>
          <button className="btn-dark" onClick={submit} disabled={sending}>
            {sending?'✉️ Sending...':'📌 Stick it on'}
          </button>
        </div>
      </div>

      {loading
        ? <p className="loading-txt">Loading wishes...</p>
        : (
          <div className="notes-grid">
            {notes.map(n=>(
              <div key={n.id} className="sticky" style={{background:n.color}}>
                <div className="tape"/>
                <button className="del-btn note-del" onClick={()=>deleteNote(n.id)}>✕</button>
                <p className="sticky-msg">"{n.message}"</p>
                <p className="sticky-by">— {n.name}</p>
              </div>
            ))}
          </div>
        )
      }
    </section>
  );
}

/* ─── APP ───────────────────────────────────────────────────────────────── */
export default function App(){
  const [scrolled,setScrolled] = useState(false);
  useEffect(()=>{
    const h=()=>setScrolled(window.scrollY>60);
    window.addEventListener('scroll',h);
    return ()=>window.removeEventListener('scroll',h);
  },[]);

  const ticker=['MAKE A WISH','PASSIONATE','AFFECTIONATE','DEDICATED','PRETTY','EAT CAKE','SHINE BRIGHT','HAPPY BIRTHDAY MADHU'];

  return (
    <div className="app">
      {/* TICKER */}
      <div className="ticker">
        <div className="ticker-track">
          {[...ticker,...ticker].map((t,i)=>(
            <span key={i}>{t} <b>★</b> </span>
          ))}
        </div>
      </div>

      <Confetti/>

      {/* FLOATING NAV */}
      <nav className={`fnav${scrolled?' show':''}`}>
        <a href="#hero">🎂 Cake</a>
        <a href="#traits">💛 Amazing</a>
        <a href="#photos">📸 Photos</a>
        <a href="#wishes">📌 Wishes</a>
      </nav>

      {/* HERO */}
      <section className="hero" id="hero">
        <Balloon color="#FF6B9D" style={{position:'absolute',left:'5%',top:'12%',animation:'floatUp 6s ease-in-out infinite'}}/>
        <Balloon color="#FFD166" style={{position:'absolute',right:'6%',top:'28%',animation:'floatUp 8s ease-in-out infinite 1s'}}/>
        <Balloon color="#74B9FF" style={{position:'absolute',left:'10%',bottom:'8%',animation:'floatUp 7s ease-in-out infinite .5s'}}/>

        <span className="hero-pill">✦ A very special day</span>
        <h1 className="hero-h1">
          Happy Birthday,<br/>
          <span className="hero-name">Madhu!</span>
        </h1>
        <p className="hero-desc">
          For the most <b className="hl pink">passionate</b>, deeply{' '}
          <b className="hl blue">affectionate</b>, fiercely{' '}
          <b className="hl green">dedicated</b>, and absolutely{' '}
          <b className="hl yellow">pretty</b> human I know — today, the world celebrates you.
        </p>
        <Cake/>
      </section>

      {/* TRAITS */}
      <section className="section traits-bg" id="traits">
        <div className="dots"/>
        <span className="pill white">why you're amazing →</span>
        <h2>Four reasons (and a thousand more)</h2>
        <div className="traits-grid">
          {[
            {label:'Passionate',  icon:'🔥',bg:'#FF6B9D',tag:'on fire',    desc:'You light up every room with the fire you bring to everything you love.'},
            {label:'Affectionate',icon:'🤍',bg:'#FFD166',tag:'biggest hugs',desc:'Your warmth makes the world a softer, kinder, gentler place.'},
            {label:'Dedicated',   icon:'🏆',bg:'#06D6A0',tag:'unstoppable', desc:"You don't just start — you finish, you commit, you show up. Always."},
            {label:'Pretty',      icon:'✨',bg:'#A29BFE',tag:'stunning',    desc:"Inside and out — a kind of beautiful that words can't quite catch."},
          ].map(t=>(
            <div key={t.label} className="trait-card" style={{background:t.bg}}>
              <span className="trait-tag">{t.tag}</span>
              <span className="trait-icon">{t.icon}</span>
              <h3>{t.label}</h3>
              <p>{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Photos/>
      <Notes/>

      {/* FOOTER */}
      <footer className="footer">
        <div className="dots"/>
        <div className="footer-card">
          <p className="footer-title">Made with ♥ for you, Madhu</p>
          <p className="footer-sub">Today, tomorrow, always — keep shining.</p>
        </div>
      </footer>
    </div>
  );
}
