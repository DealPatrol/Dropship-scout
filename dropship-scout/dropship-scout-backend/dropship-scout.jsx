import { useState, useEffect, useRef, useCallback } from "react";

// ─── Config ───────────────────────────────────────────────────────────────────
// When deployed, this hits your Next.js backend routes.
// Locally change to: const API = "http://localhost:3000"
const API = "";

const PLATFORMS = [
  { id:"aliexpress",    name:"AliExpress",    color:"#FF4444", icon:"🛒" },
  { id:"amazon",        name:"Amazon",        color:"#FF9900", icon:"📦" },
  { id:"temu",          name:"Temu",          color:"#FF6B2B", icon:"🏷️" },
  { id:"walmart",       name:"Walmart",       color:"#0071CE", icon:"🔵" },
  { id:"ebay",          name:"eBay",          color:"#E53238", icon:"🏪" },
  { id:"cjdropshipping",name:"CJ Dropship",   color:"#00C896", icon:"✈️" },
  { id:"spocket",       name:"Spocket",       color:"#7B2FBE", icon:"🌐" },
  { id:"zendrop",       name:"Zendrop",       color:"#1A73E8", icon:"⚡" },
];

const CATEGORIES  = ["All Categories","Electronics","Fashion","Home & Garden","Beauty","Toys","Sports","Pet Supplies","Jewelry","Kitchen"];
const SORT_OPTIONS = ["Best Selling","Highest Margin","Trending Now","Lowest Competition"];
const TABS = ["Search","Saved","History","Settings"];

// ─── CSV helper ───────────────────────────────────────────────────────────────
function buildShopifyCSV(products) {
  const H = ["Handle","Title","Body (HTML)","Vendor","Product Category","Type","Tags","Published","Option1 Name","Option1 Value","Variant SKU","Variant Grams","Variant Inventory Tracker","Variant Inventory Qty","Variant Inventory Policy","Variant Fulfillment Service","Variant Price","Variant Compare At Price","Variant Requires Shipping","Variant Taxable","Image Src","Image Position","Image Alt Text","SEO Title","SEO Description","Status"];
  const rows = [H.join(",")];
  products.forEach(p => {
    const h = p.name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
    const cp = (parseFloat(p.sellPrice)*1.3).toFixed(2);
    const sku = "DS-"+h.slice(0,12).toUpperCase()+"-001";
    const tags = [...(p.tags||[]),p.category,"dropship"].join(", ");
    const body = "<h2>"+p.name+"</h2><p>"+(p.aiInsight||"")+"</p><p><strong>Rating:</strong> "+p.rating+"/5 | <strong>Monthly Sales:</strong> "+p.monthlySales+"</p>";
    rows.push([h,'"'+p.name.replace(/"/g,'""')+'"','"'+body.replace(/"/g,'""')+'"',"DropShip Scout",p.category,p.category,'"'+tags+'"',"TRUE","Title","Default Title",sku,"500","shopify","99","deny","manual",p.sellPrice,cp,"TRUE","TRUE",p.imageUrl||"","1",'"'+p.name.replace(/"/g,'""')+'"','"'+p.name.replace(/"/g,'""')+' - Best Deal"','"'+(p.aiInsight||"").slice(0,155).replace(/"/g,'""')+'"',"active"].join(","));
  });
  return rows.join("\n");
}
function downloadCSV(content, name) {
  const a = Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([content],{type:"text/csv"})),download:name});
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
const inp = (extra={}) => ({
  style:{ width:"100%", background:"#0d0d1f", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"10px", padding:"10px 13px", color:"#E8E8FF", fontSize:"13px", outline:"none", boxSizing:"border-box", transition:"border 0.18s", ...extra.style },
  onFocus:e=>{ e.target.style.border="1px solid rgba(123,47,190,0.5)"; },
  onBlur:e=>{ e.target.style.border="1px solid rgba(255,255,255,0.08)"; },
  ...extra,
});

function Spinner({ size=16 }) {
  return <span style={{ width:size, height:size, border:"2px solid rgba(255,255,255,0.2)", borderTop:"2px solid white", borderRadius:"50%", display:"inline-block", animation:"spin 0.8s linear infinite", flexShrink:0 }} />;
}
function StarRating({ rating }) {
  return <div style={{ display:"flex", gap:"2px", alignItems:"center" }}>{[1,2,3,4,5].map(i=><span key={i} style={{ color:i<=Math.round(rating)?"#FFB800":"#252540", fontSize:"11px" }}>★</span>)}<span style={{ color:"#666", fontSize:"11px", marginLeft:"3px" }}>{rating}</span></div>;
}
function TrendBadge({ trend }) {
  const m={"🔥 Hot":{bg:"rgba(255,68,68,0.15)",c:"#FF6B6B",b:"rgba(255,68,68,0.3)"},"📈 Rising":{bg:"rgba(0,200,150,0.15)",c:"#00C896",b:"rgba(0,200,150,0.3)"},"✅ Stable":{bg:"rgba(100,100,255,0.15)",c:"#8888FF",b:"rgba(100,100,255,0.3)"},"⚡ Viral":{bg:"rgba(255,183,0,0.15)",c:"#FFB700",b:"rgba(255,183,0,0.3)"}};
  const s=m[trend]||m["✅ Stable"];
  return <span style={{ background:s.bg, color:s.c, border:"1px solid "+s.b, borderRadius:"20px", padding:"2px 10px", fontSize:"11px", fontWeight:600 }}>{trend}</span>;
}
function Pill({ children, color="#A67CFF", bg="rgba(123,47,190,0.15)", border="rgba(123,47,190,0.25)" }) {
  return <span style={{ background:bg, color, border:"1px solid "+border, borderRadius:"20px", padding:"3px 10px", fontSize:"11px" }}>{children}</span>;
}
function SectionLabel({ children }) {
  return <div style={{ color:"#555", fontSize:"10px", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:"8px" }}>{children}</div>;
}
function Card({ children, style={} }) {
  return <div style={{ background:"linear-gradient(135deg,#12122a,#1a1a35)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"14px", padding:"16px", ...style }}>{children}</div>;
}
function PrimaryBtn({ children, onClick, disabled, loading:ld, style={} }) {
  return (
    <button onClick={onClick} disabled={disabled||ld}
      style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", padding:"12px 20px", background:(disabled||ld)?"rgba(123,47,190,0.2)":"linear-gradient(135deg,#7B2FBE,#4F46E5)", border:"none", borderRadius:"11px", color:(disabled||ld)?"#555":"white", fontSize:"13px", fontWeight:700, fontFamily:"'Syne',sans-serif", cursor:(disabled||ld)?"not-allowed":"pointer", transition:"all 0.2s", ...style }}
      onMouseEnter={e=>{ if(!disabled&&!ld) e.currentTarget.style.transform="translateY(-1px)"; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; }}
    >
      {ld && <Spinner />}{children}
    </button>
  );
}
function GhostBtn({ children, onClick, style={} }) {
  return <button onClick={onClick} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"9px", color:"#888", padding:"8px 14px", fontSize:"12px", cursor:"pointer", transition:"all 0.18s", ...style }} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.08)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"}>{children}</button>;
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────
function AuthModal({ onClose, onLogin }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async () => {
    if (!email || !password) { setError("Please fill in both fields."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      // Import Supabase client — works when this runs inside the Next.js app
      const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm");
      const supabase = createClient(
        window.__SUPABASE_URL__ || "",
        window.__SUPABASE_ANON_KEY__ || ""
      );
      let result;
      if (mode === "signup") {
        result = await supabase.auth.signUp({ email, password });
        if (!result.error) setSuccess("Account created! Check your email to confirm, then log in.");
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
        if (!result.error && result.data?.user) {
          onLogin({ id: result.data.user.id, email: result.data.user.email });
          onClose();
        }
      }
      if (result.error) setError(result.error.message);
    } catch (e) {
      setError("Auth unavailable in preview. Connect your Supabase keys to enable login.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px", backdropFilter:"blur(8px)", animation:"fadeIn 0.2s ease" }}>
      <div style={{ background:"#12122a", border:"1px solid rgba(123,47,190,0.3)", borderRadius:"20px", padding:"28px", width:"100%", maxWidth:"380px", boxShadow:"0 40px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"22px" }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"18px" }}>{mode==="login"?"Welcome back":"Create account"}</div>
            <div style={{ color:"#555", fontSize:"12px", marginTop:"3px" }}>Save products, push history, secure credentials</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.06)", border:"none", borderRadius:"8px", color:"#777", width:"30px", height:"30px", cursor:"pointer", fontSize:"16px" }}>×</button>
        </div>
        <div style={{ display:"flex", gap:"8px", marginBottom:"20px" }}>
          {["login","signup"].map(m=>(
            <button key={m} onClick={()=>setMode(m)} style={{ flex:1, padding:"9px", background:mode===m?"linear-gradient(135deg,#7B2FBE,#4F46E5)":"rgba(255,255,255,0.04)", border:"none", borderRadius:"9px", color:mode===m?"white":"#666", fontSize:"12px", fontWeight:600, cursor:"pointer" }}>
              {m==="login"?"Log In":"Sign Up"}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:"11px", marginBottom:"14px" }}>
          <input {...inp()} type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} />
          <input {...inp()} type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} />
        </div>
        {error && <div style={{ color:"#FF8888", fontSize:"12px", marginBottom:"12px", padding:"9px", background:"rgba(255,68,68,0.08)", borderRadius:"8px", border:"1px solid rgba(255,68,68,0.2)" }}>{error}</div>}
        {success && <div style={{ color:"#00C896", fontSize:"12px", marginBottom:"12px", padding:"9px", background:"rgba(0,200,150,0.08)", borderRadius:"8px", border:"1px solid rgba(0,200,150,0.2)" }}>{success}</div>}
        <PrimaryBtn onClick={submit} loading={loading} style={{ width:"100%" }}>
          {mode==="login"?"Log In":"Create Account"}
        </PrimaryBtn>
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, index, selected, onToggle, onSave, saving, saved, userId }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background:selected?"linear-gradient(135deg,#1a1535,#1e1a40)":"linear-gradient(135deg,#12122a,#1a1a35)", border:"1px solid "+(selected?"rgba(123,47,190,0.5)":"rgba(255,255,255,0.07)"), borderRadius:"16px", padding:"18px", transition:"all 0.2s", animation:"slideUp 0.45s ease "+(index*60)+"ms both", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:"13px", left:"13px", zIndex:2 }}>
        <div onClick={onToggle} style={{ width:"18px", height:"18px", borderRadius:"5px", cursor:"pointer", background:selected?"linear-gradient(135deg,#7B2FBE,#4F46E5)":"rgba(255,255,255,0.04)", border:"1px solid "+(selected?"transparent":"rgba(255,255,255,0.12)"), display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" }}>
          {selected&&<span style={{ color:"white", fontSize:"11px", fontWeight:700 }}>✓</span>}
        </div>
      </div>
      <div style={{ position:"absolute", top:0, right:0, background:"linear-gradient(135deg,#7B2FBE,#4F46E5)", borderRadius:"0 16px 0 16px", padding:"5px 13px", fontSize:"11px", fontWeight:700, color:"white" }}>#{index+1}</div>
      <div style={{ paddingLeft:"27px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"11px", paddingRight:"42px" }}>
          <div>
            <div style={{ color:"#E8E8FF", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"14px", marginBottom:"3px", lineHeight:1.3 }}>{product.name}</div>
            <div style={{ color:"#555", fontSize:"11px" }}>{product.category}</div>
          </div>
          <TrendBadge trend={product.trend} />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px", marginBottom:"12px" }}>
          {[{l:"Margin",v:product.margin+"%",c:"#00C896"},{l:"Sell Price",v:"$"+product.sellPrice,c:"#7B8FFF"},{l:"Mo. Sales",v:product.monthlySales,c:"#FFB700"}].map(m=>(
            <div key={m.l} style={{ background:"rgba(255,255,255,0.04)", borderRadius:"9px", padding:"9px", textAlign:"center" }}>
              <div style={{ color:m.c, fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"14px" }}>{m.v}</div>
              <div style={{ color:"#444", fontSize:"10px", marginTop:"2px", textTransform:"uppercase", letterSpacing:"0.07em" }}>{m.l}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <StarRating rating={product.rating} />
          <div style={{ display:"flex", gap:"5px" }}>
            {(product.platforms||[]).map(pid=>{ const pl=PLATFORMS.find(p=>p.id===pid); return pl?<span key={pid} title={pl.name} style={{ fontSize:"13px" }}>{pl.icon}</span>:null; })}
          </div>
          <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
            {userId && (
              <button onClick={onSave} disabled={saving||saved} style={{ background:saved?"rgba(0,200,150,0.1)":"rgba(255,255,255,0.04)", border:"1px solid "+(saved?"rgba(0,200,150,0.25)":"rgba(255,255,255,0.08)"), borderRadius:"7px", color:saved?"#00C896":"#666", padding:"4px 9px", fontSize:"11px", cursor:saved?"default":"pointer", transition:"all 0.2s" }}>
                {saving?<Spinner size={10}/>:saved?"✓ Saved":"+ Save"}
              </button>
            )}
            <button onClick={()=>setExpanded(!expanded)} style={{ background:"none", border:"none", color:"#444", fontSize:"11px", cursor:"pointer", padding:"4px 6px" }}>{expanded?"▲":"▼ Details"}</button>
          </div>
        </div>
        {expanded&&(
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:"12px", marginTop:"11px", animation:"fadeIn 0.2s ease" }}>
            <p style={{ color:"#aaa", fontSize:"13px", lineHeight:1.7, margin:"0 0 10px" }}>{product.aiInsight}</p>
            <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"10px" }}>
              {(product.tags||[]).map(t=><Pill key={t}>#{t}</Pill>)}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"7px" }}>
              {[{l:"Source Price",v:"$"+product.sourcePrice,c:"#00C896"},{l:"Competition",v:product.competition,c:product.competition==="Low"?"#00C896":product.competition==="Medium"?"#FFB700":"#FF6B6B"},{l:"Score",v:product.score+"/10",c:"#8888FF"}].map(s=>(
                <div key={s.l} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"8px", padding:"7px", textAlign:"center" }}>
                  <div style={{ color:"#555", fontSize:"10px", textTransform:"uppercase", letterSpacing:"0.07em" }}>{s.l}</div>
                  <div style={{ color:s.c, fontWeight:700, fontSize:"13px", marginTop:"2px" }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shopify Modal ────────────────────────────────────────────────────────────
function ShopifyModal({ onClose, onPush, pushing, pushResult, savedDomain, onSaveCreds }) {
  const [domain, setDomain] = useState(savedDomain||"");
  const [token, setToken] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!savedDomain);
  const canPush = domain.trim() && token.trim() && !pushing;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px", backdropFilter:"blur(8px)", animation:"fadeIn 0.2s ease" }}>
      <div style={{ background:"#12122a", border:"1px solid rgba(123,47,190,0.3)", borderRadius:"20px", padding:"26px", width:"100%", maxWidth:"420px", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 40px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
          <div><div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"17px" }}>🚀 Push to Shopify</div><div style={{ color:"#555", fontSize:"12px", marginTop:"3px" }}>Products go live in your store instantly</div></div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.06)", border:"none", borderRadius:"8px", color:"#777", width:"30px", height:"30px", cursor:"pointer", fontSize:"16px" }}>×</button>
        </div>

        {pushResult ? (
          <div style={{ background:pushResult.success?"rgba(0,200,150,0.08)":"rgba(255,68,68,0.08)", border:"1px solid "+(pushResult.success?"rgba(0,200,150,0.25)":"rgba(255,68,68,0.25)"), borderRadius:"14px", padding:"22px", textAlign:"center" }}>
            <div style={{ fontSize:"36px", marginBottom:"10px" }}>{pushResult.success?"✅":"❌"}</div>
            <div style={{ color:pushResult.success?"#00C896":"#FF6B6B", fontWeight:700, fontSize:"15px", marginBottom:"8px" }}>{pushResult.success?pushResult.pushed+" Products Live!":"Push Failed"}</div>
            <div style={{ color:"#888", fontSize:"13px", lineHeight:1.6, marginBottom:"14px" }}>{pushResult.success?"Your products are now active in your Shopify store.":pushResult.error||"Check your domain and token, then try again."}</div>
            {pushResult.success&&<a href={"https://"+domain+"/admin/products"} target="_blank" rel="noopener noreferrer" style={{ display:"inline-block", background:"linear-gradient(135deg,#7B2FBE,#4F46E5)", color:"white", borderRadius:"9px", padding:"9px 18px", textDecoration:"none", fontSize:"13px", fontWeight:600, marginBottom:"10px" }}>View in Shopify Admin →</a>}
            <GhostBtn onClick={onClose} style={{ width:"100%", marginTop:"8px" }}>Close</GhostBtn>
          </div>
        ) : (
          <>
            <div style={{ marginBottom:"13px" }}>
              <SectionLabel>Store Domain</SectionLabel>
              <input {...inp()} value={domain} onChange={e=>setDomain(e.target.value.replace(/https?:\/\//,""))} placeholder="your-store.myshopify.com" />
            </div>
            <div style={{ marginBottom:"10px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
                <SectionLabel>Admin API Token</SectionLabel>
                <button onClick={()=>setShowHelp(!showHelp)} style={{ background:"none", border:"none", color:"#A67CFF", fontSize:"11px", cursor:"pointer" }}>{showHelp?"Hide ▲":"How to get this ▼"}</button>
              </div>
              <input {...inp()} type="password" value={token} onChange={e=>setToken(e.target.value)} placeholder="shpat_xxxxxxxxxxxxxxxxxxxx" />
            </div>
            {showHelp&&(
              <div style={{ background:"rgba(123,47,190,0.07)", border:"1px solid rgba(123,47,190,0.18)", borderRadius:"10px", padding:"13px", marginBottom:"12px", fontSize:"12px", color:"#999", lineHeight:1.85 }}>
                <strong style={{ color:"#A67CFF" }}>2-minute setup:</strong><br/>
                1. Shopify Admin → <strong style={{ color:"#ccc" }}>Settings → Apps and sales channels</strong><br/>
                2. <strong style={{ color:"#ccc" }}>Develop apps → Create an app</strong> → name it "DropShip Scout"<br/>
                3. Configuration → enable <strong style={{ color:"#ccc" }}>write_products</strong><br/>
                4. <strong style={{ color:"#ccc" }}>Install app → Reveal token → Copy</strong>
              </div>
            )}
            <label style={{ display:"flex", alignItems:"center", gap:"9px", cursor:"pointer", marginBottom:"16px" }}>
              <div onClick={()=>setRememberMe(!rememberMe)} style={{ width:"17px", height:"17px", borderRadius:"5px", background:rememberMe?"linear-gradient(135deg,#7B2FBE,#4F46E5)":"rgba(255,255,255,0.04)", border:"1px solid "+(rememberMe?"transparent":"rgba(255,255,255,0.12)"), display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
                {rememberMe&&<span style={{ color:"white", fontSize:"10px", fontWeight:700 }}>✓</span>}
              </div>
              <span style={{ color:"#888", fontSize:"12px" }}>Remember my store credentials (saved securely to your account)</span>
            </label>
            <div style={{ background:"rgba(255,183,0,0.07)", border:"1px solid rgba(255,183,0,0.18)", borderRadius:"9px", padding:"10px", marginBottom:"15px", fontSize:"12px", color:"#cc9500", lineHeight:1.6 }}>
              🔒 Your token is sent to our secure backend and never stored in the browser.
            </div>
            <PrimaryBtn onClick={()=>{ if(rememberMe) onSaveCreds(domain,token); onPush(domain,token); }} disabled={!canPush} loading={pushing} style={{ width:"100%" }}>
              Push Products to Shopify
            </PrimaryBtn>
          </>
        )}
      </div>
    </div>
  );
}

// ─── CSV Guide Modal ──────────────────────────────────────────────────────────
function CSVGuideModal({ onClose, onDownload }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px", backdropFilter:"blur(8px)", animation:"fadeIn 0.2s ease" }}>
      <div style={{ background:"#12122a", border:"1px solid rgba(0,200,150,0.25)", borderRadius:"20px", padding:"26px", width:"100%", maxWidth:"390px", boxShadow:"0 40px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
          <div><div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"17px" }}>⬇️ Upload to Shopify</div><div style={{ color:"#555", fontSize:"12px", marginTop:"3px" }}>4 steps — no coding needed</div></div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.06)", border:"none", borderRadius:"8px", color:"#777", width:"30px", height:"30px", cursor:"pointer", fontSize:"16px" }}>×</button>
        </div>
        {[["⬇️","Download the CSV","Click below — saves as a Shopify-formatted file."],["🛍️","Open Shopify Admin","Go to Products → click Import (top right)."],["📂","Upload the File","Click Add file, select the CSV. Shopify previews it."],["✅","Confirm & Go Live","Click Import products — titles, prices, tags all auto-fill."]].map(([icon,title,desc],i)=>(
          <div key={i} style={{ display:"flex", gap:"12px", alignItems:"flex-start", background:"rgba(255,255,255,0.03)", borderRadius:"11px", padding:"13px", border:"1px solid rgba(255,255,255,0.05)", marginBottom:"9px" }}>
            <div style={{ width:"32px", height:"32px", borderRadius:"9px", flexShrink:0, background:"rgba(0,200,150,0.1)", border:"1px solid rgba(0,200,150,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px" }}>{icon}</div>
            <div><div style={{ color:"#E8E8FF", fontWeight:600, fontSize:"13px", marginBottom:"3px" }}>{i+1}. {title}</div><div style={{ color:"#666", fontSize:"12px", lineHeight:1.6 }}>{desc}</div></div>
          </div>
        ))}
        <button onClick={onDownload} style={{ width:"100%", marginTop:"4px", padding:"13px", background:"linear-gradient(135deg,#00C896,#00A877)", border:"none", borderRadius:"11px", color:"white", fontSize:"14px", fontWeight:700, fontFamily:"'Syne',sans-serif", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"7px" }}>⬇️ Download Shopify CSV</button>
        <GhostBtn onClick={onClose} style={{ width:"100%", marginTop:"8px" }}>Cancel</GhostBtn>
      </div>
    </div>
  );
}

// ─── Export Bar ───────────────────────────────────────────────────────────────
function ExportBar({ total, count, onSelectAll, onClearAll, onCSV, onShopify }) {
  if (total===0) return null;
  return (
    <div style={{ position:"sticky", bottom:"14px", zIndex:100, marginTop:"16px", background:"linear-gradient(135deg,#1a1535,#1e1a40)", border:"1px solid rgba(123,47,190,0.35)", borderRadius:"16px", padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"10px", flexWrap:"wrap", boxShadow:"0 20px 60px rgba(0,0,0,0.55)", backdropFilter:"blur(10px)", animation:"slideUp 0.4s ease" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"13px" }}><span style={{ color:"#A67CFF" }}>{count}</span><span style={{ color:"#444" }}> / {total}</span></div>
        <button onClick={count===total?onClearAll:onSelectAll} style={{ background:"none", border:"none", color:"#555", fontSize:"11px", cursor:"pointer", textDecoration:"underline" }}>{count===total?"Deselect all":"Select all"}</button>
      </div>
      <div style={{ display:"flex", gap:"7px" }}>
        <button onClick={onCSV} disabled={count===0} style={{ background:count>0?"rgba(0,200,150,0.1)":"rgba(255,255,255,0.03)", border:"1px solid "+(count>0?"rgba(0,200,150,0.28)":"rgba(255,255,255,0.05)"), borderRadius:"9px", padding:"7px 13px", color:count>0?"#00C896":"#333", fontSize:"12px", fontWeight:600, cursor:count>0?"pointer":"not-allowed", whiteSpace:"nowrap" }}>⬇️ CSV</button>
        <button onClick={onShopify} disabled={count===0} style={{ background:count>0?"linear-gradient(135deg,#7B2FBE,#4F46E5)":"rgba(255,255,255,0.03)", border:"none", borderRadius:"9px", padding:"7px 13px", color:count>0?"white":"#333", fontSize:"12px", fontWeight:700, fontFamily:"'Syne',sans-serif", cursor:count>0?"pointer":"not-allowed", boxShadow:count>0?"0 4px 18px rgba(123,47,190,0.38)":"none", whiteSpace:"nowrap" }}>🚀 Push to Shopify</button>
      </div>
    </div>
  );
}

// ─── Tab: Saved Products ──────────────────────────────────────────────────────
function SavedTab({ userId, onUnsave }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showShopify, setShowShopify] = useState(false);
  const [showCSV, setShowCSV] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState(null);
  const [savedDomain, setSavedDomain] = useState("");

  useEffect(()=>{
    if (!userId) { setLoading(false); return; }
    fetch(`${API}/api/products/saved?userId=${userId}`)
      .then(r=>r.json()).then(d=>{ setProducts(d.products||[]); setLoading(false); })
      .catch(()=>setLoading(false));
    fetch(`${API}/api/shopify/credentials?userId=${userId}`)
      .then(r=>r.json()).then(d=>setSavedDomain(d.domain||""));
  },[userId]);

  const toggleSelect = idx => setSelectedIds(s=>s.includes(idx)?s.filter(x=>x!==idx):[...s,idx]);
  const selected = selectedIds.map(i=>products[i]);

  const handlePush = async (domain, token) => {
    setPushing(true); setPushResult(null);
    try {
      const r = await fetch(`${API}/api/shopify/push`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({domain,token,products:selected,userId})});
      const d = await r.json();
      setPushResult(d);
    } catch(e){ setPushResult({success:false,error:e.message}); }
    setPushing(false);
  };

  const handleUnsave = async (id) => {
    await fetch(`${API}/api/products/saved?id=${id}&userId=${userId}`,{method:"DELETE"});
    setProducts(p=>p.filter(x=>x.id!==id));
    setSelectedIds(s=>s.filter(i=>products[i]?.id!==id));
    if (onUnsave) onUnsave();
  };

  if (!userId) return (
    <div style={{ textAlign:"center", marginTop:"60px" }}>
      <div style={{ fontSize:"40px", marginBottom:"12px" }}>🔐</div>
      <div style={{ color:"#555", fontSize:"13px" }}>Log in to save and view your products</div>
    </div>
  );

  if (loading) return <div style={{ textAlign:"center", marginTop:"50px" }}><Spinner size={24}/></div>;

  if (!products.length) return (
    <div style={{ textAlign:"center", marginTop:"60px" }}>
      <div style={{ fontSize:"40px", marginBottom:"12px" }}>📋</div>
      <div style={{ color:"#555", fontSize:"13px" }}>No saved products yet.<br/>Hit <span style={{ color:"#A67CFF" }}>+ Save</span> on any search result.</div>
    </div>
  );

  return (
    <>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"15px" }}>{products.length} Saved Products</div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
        {products.map((p,i)=>(
          <div key={p.id} style={{ background:"linear-gradient(135deg,#12122a,#1a1a35)", border:"1px solid "+(selectedIds.includes(i)?"rgba(123,47,190,0.5)":"rgba(255,255,255,0.07)"), borderRadius:"14px", padding:"15px", position:"relative" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"10px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <div onClick={()=>toggleSelect(i)} style={{ width:"17px", height:"17px", borderRadius:"5px", cursor:"pointer", background:selectedIds.includes(i)?"linear-gradient(135deg,#7B2FBE,#4F46E5)":"rgba(255,255,255,0.04)", border:"1px solid "+(selectedIds.includes(i)?"transparent":"rgba(255,255,255,0.12)"), display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {selectedIds.includes(i)&&<span style={{ color:"white", fontSize:"10px", fontWeight:700 }}>✓</span>}
                </div>
                <div>
                  <div style={{ color:"#E8E8FF", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"13px" }}>{p.name}</div>
                  <div style={{ color:"#555", fontSize:"11px" }}>{p.category}</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:"7px", alignItems:"center" }}>
                <TrendBadge trend={p.trend}/>
                <button onClick={()=>handleUnsave(p.id)} style={{ background:"rgba(255,68,68,0.08)", border:"1px solid rgba(255,68,68,0.2)", borderRadius:"7px", color:"#FF8888", padding:"4px 9px", fontSize:"11px", cursor:"pointer" }}>Remove</button>
              </div>
            </div>
            <div style={{ display:"flex", gap:"10px", fontSize:"12px" }}>
              <span style={{ color:"#00C896" }}>{p.margin}% margin</span>
              <span style={{ color:"#555" }}>·</span>
              <span style={{ color:"#7B8FFF" }}>${p.sellPrice} sell</span>
              <span style={{ color:"#555" }}>·</span>
              <span style={{ color:"#FFB700" }}>{p.monthlySales} sales/mo</span>
            </div>
          </div>
        ))}
      </div>
      <ExportBar total={products.length} count={selectedIds.length} onSelectAll={()=>setSelectedIds(products.map((_,i)=>i))} onClearAll={()=>setSelectedIds([])} onCSV={()=>{ if(selectedIds.length>0) setShowCSV(true); }} onShopify={()=>{ if(selectedIds.length>0){ setPushResult(null); setShowShopify(true); } }} />
      {showShopify&&<ShopifyModal onClose={()=>setShowShopify(false)} onPush={handlePush} pushing={pushing} pushResult={pushResult} savedDomain={savedDomain} onSaveCreds={(d,t)=>fetch(`${API}/api/shopify/credentials`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,domain:d,token:t})})} />}
      {showCSV&&<CSVGuideModal onClose={()=>setShowCSV(false)} onDownload={()=>{ downloadCSV(buildShopifyCSV(selected),"saved-products-"+Date.now()+".csv"); setShowCSV(false); }} />}
    </>
  );
}

// ─── Tab: Push History ────────────────────────────────────────────────────────
function HistoryTab({ userId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    if (!userId) { setLoading(false); return; }
    fetch(`${API}/api/shopify/history?userId=${userId}`)
      .then(r=>r.json()).then(d=>{ setHistory(d.history||[]); setLoading(false); })
      .catch(()=>setLoading(false));
  },[userId]);

  if (!userId) return (
    <div style={{ textAlign:"center", marginTop:"60px" }}>
      <div style={{ fontSize:"40px", marginBottom:"12px" }}>🔐</div>
      <div style={{ color:"#555", fontSize:"13px" }}>Log in to see your push history</div>
    </div>
  );

  if (loading) return <div style={{ textAlign:"center", marginTop:"50px" }}><Spinner size={24}/></div>;

  if (!history.length) return (
    <div style={{ textAlign:"center", marginTop:"60px" }}>
      <div style={{ fontSize:"40px", marginBottom:"12px" }}>📜</div>
      <div style={{ color:"#555", fontSize:"13px" }}>No pushes yet.<br/>Push products to Shopify and they'll appear here.</div>
    </div>
  );

  const total = history.length;
  const succeeded = history.filter(h=>h.status==="success").length;

  return (
    <>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"18px" }}>
        {[{l:"Total Pushed",v:total,c:"#E8E8FF"},{l:"Successful",v:succeeded,c:"#00C896"},{l:"Failed",v:total-succeeded,c:total-succeeded>0?"#FF6B6B":"#444"}].map(s=>(
          <Card key={s.l}>
            <div style={{ color:s.c, fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"20px" }}>{s.v}</div>
            <div style={{ color:"#555", fontSize:"10px", textTransform:"uppercase", letterSpacing:"0.07em", marginTop:"3px" }}>{s.l}</div>
          </Card>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"9px" }}>
        {history.map(h=>(
          <div key={h.id} style={{ background:"linear-gradient(135deg,#12122a,#1a1a35)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", padding:"14px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:"10px" }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ color:"#E8E8FF", fontSize:"13px", fontWeight:600, marginBottom:"3px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{h.productName}</div>
              <div style={{ color:"#555", fontSize:"11px" }}>{new Date(h.pushedAt).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</div>
              {h.errorMessage&&<div style={{ color:"#FF8888", fontSize:"11px", marginTop:"3px" }}>{h.errorMessage}</div>}
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"5px", flexShrink:0 }}>
              <span style={{ background:h.status==="success"?"rgba(0,200,150,0.12)":"rgba(255,68,68,0.12)", color:h.status==="success"?"#00C896":"#FF6B6B", border:"1px solid "+(h.status==="success"?"rgba(0,200,150,0.25)":"rgba(255,68,68,0.25)"), borderRadius:"20px", padding:"2px 10px", fontSize:"11px", fontWeight:600 }}>{h.status==="success"?"✓ Live":"✗ Failed"}</span>
              <span style={{ color:"#7B8FFF", fontSize:"12px", fontWeight:600 }}>${h.sellPrice}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Tab: Settings ────────────────────────────────────────────────────────────
function SettingsTab({ user, onLogout, onLogin, userId }) {
  const [domain, setDomain] = useState("");
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [hasCreds, setHasCreds] = useState(false);

  useEffect(()=>{
    if (!userId) return;
    fetch(`${API}/api/shopify/credentials?userId=${userId}`)
      .then(r=>r.json()).then(d=>{ if(d.domain){ setDomain(d.domain); setHasCreds(true); } });
  },[userId]);

  const saveCreds = async () => {
    if (!domain||!token) return;
    setSaving(true);
    await fetch(`${API}/api/shopify/credentials`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,domain,token})});
    setSaving(false); setSaved(true); setHasCreds(true);
    setTimeout(()=>setSaved(false),2500);
  };

  const clearCreds = async () => {
    setClearing(true);
    await fetch(`${API}/api/shopify/credentials?userId=${userId}`,{method:"DELETE"});
    setDomain(""); setToken(""); setHasCreds(false);
    setClearing(false); setCleared(true);
    setTimeout(()=>setCleared(false),2500);
  };

  if (!user) return (
    <div style={{ textAlign:"center", marginTop:"60px" }}>
      <div style={{ fontSize:"40px", marginBottom:"12px" }}>⚙️</div>
      <div style={{ color:"#555", fontSize:"13px", marginBottom:"18px" }}>Log in to manage your settings and saved credentials</div>
      <PrimaryBtn onClick={onLogin}>Log In / Sign Up</PrimaryBtn>
    </div>
  );

  return (
    <>
      {/* Account */}
      <Card style={{ marginBottom:"14px" }}>
        <SectionLabel>Account</SectionLabel>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ color:"#E8E8FF", fontSize:"13px", fontWeight:600 }}>{user.email}</div>
            <div style={{ color:"#555", fontSize:"11px", marginTop:"2px" }}>Logged in · data synced across devices</div>
          </div>
          <GhostBtn onClick={onLogout}>Log Out</GhostBtn>
        </div>
      </Card>

      {/* Shopify credentials */}
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
          <SectionLabel>Shopify Credentials</SectionLabel>
          {hasCreds&&<span style={{ fontSize:"11px", color:"#00C896", background:"rgba(0,200,150,0.1)", border:"1px solid rgba(0,200,150,0.2)", borderRadius:"20px", padding:"2px 9px" }}>✓ Saved</span>}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"13px" }}>
          <div>
            <SectionLabel>Store Domain</SectionLabel>
            <input {...inp()} value={domain} onChange={e=>setDomain(e.target.value.replace(/https?:\/\//,""))} placeholder="your-store.myshopify.com" />
          </div>
          <div>
            <SectionLabel>Admin API Token</SectionLabel>
            <input {...inp()} type="password" value={token} onChange={e=>setToken(e.target.value)} placeholder={hasCreds?"Token saved — enter new to update":"shpat_xxxxxxxxxxxxxxxxxxxx"} />
          </div>
        </div>
        <div style={{ display:"flex", gap:"9px" }}>
          <PrimaryBtn onClick={saveCreds} loading={saving} disabled={!domain||!token} style={{ flex:1 }}>
            {saved?"✓ Saved!":"Save Credentials"}
          </PrimaryBtn>
          {hasCreds&&<GhostBtn onClick={clearCreds} style={{ color:clearing?"#555":"#FF8888" }}>{clearing?<Spinner size={12}/>:cleared?"Cleared":"Clear"}</GhostBtn>}
        </div>
        <div style={{ marginTop:"12px", color:"#444", fontSize:"11px", lineHeight:1.7 }}>
          🔒 Your token is stored server-side in your encrypted Supabase account. It's never sent back to the browser after saving.
        </div>
      </Card>
    </>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("Search");
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  // Search state
  const [selectedPlatforms, setSelectedPlatforms] = useState(["aliexpress","amazon","zendrop"]);
  const [category, setCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState("Best Selling");
  const [customNiche, setCustomNiche] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [savingIds, setSavingIds] = useState({});
  const [savedIds, setSavedIds] = useState({});

  // Modals
  const [showShopify, setShowShopify] = useState(false);
  const [showCSV, setShowCSV] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState(null);
  const [savedDomain, setSavedDomain] = useState("");

  const abortRef = useRef(null);

  // Restore last session on login
  useEffect(()=>{
    if (!user) return;
    fetch(`${API}/api/auth/session?userId=${user.id}`)
      .then(r=>r.json()).then(d=>{
        if (d.session?.results?.length) {
          setProducts(d.session.results);
          setSelectedPlatforms(d.session.platforms||["aliexpress"]);
          setCategory(d.session.category||"All Categories");
          setSortBy(d.session.sortBy||"Best Selling");
          setCustomNiche(d.session.customNiche||"");
          setSearched(true);
        }
      }).catch(()=>{});
    fetch(`${API}/api/shopify/credentials?userId=${user.id}`)
      .then(r=>r.json()).then(d=>setSavedDomain(d.domain||""));
  },[user]);

  const togglePlatform = id => setSelectedPlatforms(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const toggleSelect = idx => setSelectedIds(s=>s.includes(idx)?s.filter(x=>x!==idx):[...s,idx]);
  const selectedProducts = selectedIds.map(i=>products[i]);

  const fetchProducts = async () => {
    if (!selectedPlatforms.length) return;
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true); setError(null); setProducts([]); setSelectedIds([]); setSavedIds({}); setSearched(true);
    try {
      const res = await fetch(`${API}/api/products/search`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({platforms:selectedPlatforms,category,sortBy,customNiche,userId:user?.id}),
        signal:abortRef.current.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error||"Search failed");
      setProducts(data.products||[]);
    } catch(e){
      if (e.name!=="AbortError") setError(e.message||"Search failed. Try again.");
    } finally { setLoading(false); }
  };

  const handleSave = async (idx) => {
    if (!user) { setShowAuth(true); return; }
    setSavingIds(s=>({...s,[idx]:true}));
    try {
      await fetch(`${API}/api/products/saved`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:user.id,product:products[idx]})});
      setSavedIds(s=>({...s,[idx]:true}));
    } finally { setSavingIds(s=>({...s,[idx]:false})); }
  };

  const handlePush = async (domain, token) => {
    setPushing(true); setPushResult(null);
    try {
      const r = await fetch(`${API}/api/shopify/push`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({domain,token,products:selectedProducts,userId:user?.id})});
      const d = await r.json();
      setPushResult(d);
    } catch(e){ setPushResult({success:false,error:e.message}); }
    setPushing(false);
  };

  const handleSaveCreds = (domain, token) => {
    if (!user) return;
    fetch(`${API}/api/shopify/credentials`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:user.id,domain,token})});
    setSavedDomain(domain);
  };

  const handleLogout = async () => {
    try {
      const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm");
      const supabase = createClient(window.__SUPABASE_URL__||"",window.__SUPABASE_ANON_KEY__||"");
      await supabase.auth.signOut();
    } catch(e){}
    setUser(null);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#080814", fontFamily:"'DM Sans',sans-serif", color:"#E8E8FF", paddingBottom:"80px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#0d0d22}::-webkit-scrollbar-thumb{background:#2a2a50;border-radius:3px}
        select{-webkit-appearance:none;appearance:none} input::placeholder{color:#333355}
      `}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(180deg,#0d0d22,#080814)", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"22px 18px 18px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:"500px", height:"1px", background:"linear-gradient(90deg,transparent,rgba(123,47,190,0.7),transparent)" }}/>
        <div style={{ maxWidth:"640px", margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:"6px", background:"rgba(123,47,190,0.1)", border:"1px solid rgba(123,47,190,0.22)", borderRadius:"30px", padding:"3px 11px 3px 8px", marginBottom:"8px", fontSize:"10px", color:"#A67CFF", fontWeight:500 }}>
              <span>🛸</span> AI-POWERED · SHOPIFY READY
            </div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(22px,4vw,30px)", fontWeight:800, margin:0, background:"linear-gradient(135deg,#fff 0%,#A67CFF 55%,#7B2FBE 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"-0.02em" }}>DropShip Scout</h1>
          </div>
          {user ? (
            <div style={{ display:"flex", alignItems:"center", gap:"9px" }}>
              <div style={{ textAlign:"right" }}>
                <div style={{ color:"#E8E8FF", fontSize:"12px", fontWeight:500 }}>{user.email.split("@")[0]}</div>
                <div style={{ color:"#555", fontSize:"10px" }}>Logged in</div>
              </div>
              <div style={{ width:"34px", height:"34px", borderRadius:"50%", background:"linear-gradient(135deg,#7B2FBE,#4F46E5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", fontWeight:700, color:"white" }}>
                {user.email[0].toUpperCase()}
              </div>
            </div>
          ) : (
            <GhostBtn onClick={()=>setShowAuth(true)}>Log In</GhostBtn>
          )}
        </div>
      </div>

      {/* Nav Tabs */}
      <div style={{ borderBottom:"1px solid rgba(255,255,255,0.06)", background:"#0a0a1a" }}>
        <div style={{ maxWidth:"640px", margin:"0 auto", display:"flex", padding:"0 18px" }}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:"12px 6px", background:"none", border:"none", borderBottom:"2px solid "+(tab===t?"#7B2FBE":"transparent"), color:tab===t?"#A67CFF":"#555", fontSize:"12px", fontWeight:tab===t?700:400, cursor:"pointer", transition:"all 0.18s", fontFamily:"'DM Sans',sans-serif" }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:"640px", margin:"0 auto", padding:"18px 14px 0" }}>

        {/* ── Search Tab ── */}
        {tab==="Search"&&(
          <>
            <div style={{ marginBottom:"16px" }}>
              <SectionLabel>Platforms</SectionLabel>
              <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                {PLATFORMS.map(p=>(
                  <button key={p.id} onClick={()=>togglePlatform(p.id)} style={{ background:selectedPlatforms.includes(p.id)?p.color+"1a":"rgba(255,255,255,0.03)", border:"1px solid "+(selectedPlatforms.includes(p.id)?p.color+"55":"rgba(255,255,255,0.07)"), borderRadius:"9px", padding:"6px 11px", color:selectedPlatforms.includes(p.id)?"#eee":"#555", cursor:"pointer", fontSize:"12px", fontWeight:selectedPlatforms.includes(p.id)?600:400, transition:"all 0.18s", display:"flex", alignItems:"center", gap:"5px" }}>
                    {p.icon} {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"11px", marginBottom:"13px" }}>
              {[{label:"Category",value:category,setter:setCategory,opts:CATEGORIES},{label:"Sort By",value:sortBy,setter:setSortBy,opts:SORT_OPTIONS}].map(f=>(
                <div key={f.label}>
                  <SectionLabel>{f.label}</SectionLabel>
                  <div style={{ position:"relative" }}>
                    <select value={f.value} onChange={e=>f.setter(e.target.value)} style={{ width:"100%", background:"#12122a", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"9px", padding:"9px 30px 9px 12px", color:"#E8E8FF", fontSize:"13px", cursor:"pointer" }}>
                      {f.opts.map(o=><option key={o}>{o}</option>)}
                    </select>
                    <span style={{ position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)", color:"#444", pointerEvents:"none", fontSize:"11px" }}>▾</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom:"14px" }}>
              <SectionLabel>Custom Niche (optional)</SectionLabel>
              <input {...inp()} value={customNiche} onChange={e=>setCustomNiche(e.target.value)} onKeyDown={e=>e.key==="Enter"&&fetchProducts()} placeholder="e.g. pet accessories, outdoor camping, home office..." />
            </div>

            <PrimaryBtn onClick={fetchProducts} loading={loading} disabled={!selectedPlatforms.length} style={{ width:"100%", padding:"14px", fontSize:"14px", letterSpacing:"0.04em" }}>
              {loading?"SCANNING PLATFORMS…":"🔍 FIND BEST SELLERS"}
            </PrimaryBtn>

            {error&&<div style={{ marginTop:"12px", background:"rgba(255,68,68,0.09)", border:"1px solid rgba(255,68,68,0.2)", borderRadius:"10px", padding:"12px", color:"#FF8888", fontSize:"13px", textAlign:"center" }}>{error}</div>}

            {loading&&(
              <div style={{ marginTop:"22px", display:"flex", flexDirection:"column", gap:"10px" }}>
                {[1,2,3].map(i=><div key={i} style={{ height:"115px", borderRadius:"14px", background:"linear-gradient(90deg,#12122a 25%,#1a1a35 50%,#12122a 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite "+(i*170)+"ms", border:"1px solid rgba(255,255,255,0.04)" }} />)}
                <div style={{ color:"#333355", fontSize:"12px", textAlign:"center" }}>AI scanning {selectedPlatforms.length} platforms…</div>
              </div>
            )}

            {!loading&&products.length>0&&(
              <>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"22px", marginBottom:"12px" }}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"14px" }}>{products.length} Products Found</div>
                  {!user&&<button onClick={()=>setShowAuth(true)} style={{ background:"none", border:"none", color:"#A67CFF", fontSize:"11px", cursor:"pointer" }}>Log in to save products →</button>}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                  {products.map((p,i)=>(
                    <ProductCard key={i} product={p} index={i} selected={selectedIds.includes(i)} onToggle={()=>toggleSelect(i)} userId={user?.id} onSave={()=>handleSave(i)} saving={!!savingIds[i]} saved={!!savedIds[i]} />
                  ))}
                </div>
                <ExportBar total={products.length} count={selectedIds.length} onSelectAll={()=>setSelectedIds(products.map((_,i)=>i))} onClearAll={()=>setSelectedIds([])} onCSV={()=>{ if(selectedIds.length>0) setShowCSV(true); }} onShopify={()=>{ if(selectedIds.length>0){ setPushResult(null); setShowShopify(true); } }} />
              </>
            )}

            {!loading&&searched&&products.length===0&&!error&&<div style={{ marginTop:"50px", textAlign:"center" }}><div style={{ fontSize:"40px", marginBottom:"12px" }}>🔭</div><div style={{ color:"#444", fontSize:"13px" }}>No results. Try adjusting your filters.</div></div>}
            {!searched&&!loading&&<div style={{ marginTop:"50px", textAlign:"center", animation:"fadeIn 1s ease" }}><div style={{ fontSize:"40px", marginBottom:"12px" }}>📡</div><div style={{ color:"#333355", fontSize:"13px", lineHeight:1.9 }}>Select platforms · hit <span style={{ color:"#A67CFF" }}>Find Best Sellers</span><br/>Select products · push straight to Shopify</div></div>}
          </>
        )}

        {tab==="Saved"&&<SavedTab userId={user?.id} />}
        {tab==="History"&&<HistoryTab userId={user?.id} />}
        {tab==="Settings"&&<SettingsTab user={user} userId={user?.id} onLogout={handleLogout} onLogin={()=>setShowAuth(true)} />}
      </div>

      {showShopify&&<ShopifyModal onClose={()=>setShowShopify(false)} onPush={handlePush} pushing={pushing} pushResult={pushResult} savedDomain={savedDomain} onSaveCreds={handleSaveCreds} />}
      {showCSV&&<CSVGuideModal onClose={()=>setShowCSV(false)} onDownload={()=>{ downloadCSV(buildShopifyCSV(selectedProducts),"dropship-scout-"+Date.now()+".csv"); setShowCSV(false); }} />}
      {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} onLogin={u=>{ setUser(u); setShowAuth(false); }} />}
    </div>
  );
}
