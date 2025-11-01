
import React from "react";

export default function Page() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(circle at 10% 10%, rgba(124,58,237,0.12), transparent 10%), linear-gradient(180deg,#0b0720,#13062e)",
      color: "white",
      padding: 24
    }}>
      <div style={{maxWidth:900, width:"100%", background:"rgba(255,255,255,0.03)", padding:28, borderRadius:14}}>
        <iv style={{display:"flex", gap:18, alignItems:"center"}}>
          <img src="/assets/logo.png" style={{width:120, height:120, borderRadius:12}} alt="logo" />
          <div>
            <h1 style={{margin:0}}>Farcaster Punks</h1>
            <p style={{margin:4, color:"#b9b6cb"}}>Official mint — Base network</p>
          </div>
        </div>

        <div style={{display:"flex", gap:24, marginTop:20, flexWrap:"wrap"}}>
          <div style={{flex:1}}>
            <p style={{color:"#b9b6cb"}}>Mint dirctly in Warpcast — press <strong>Mint Now</strong> in the frame.</p>
            <p style={{color:"#b9b6cb"}}><a style={{color:"#7c3aed"}} href="https://opensea.io/collection/farcaster-punks-59466883/overview" target="_blank" rel="noreferrer">View collection on OpenSea</a></p>
            <p style={{color:"#b9b6cb"}}>If you open this page in a normal browser, you can also connect wallet and mint directly here (UI coming).</p>
          </div>

          <div style={{width:260}}>
            <img src="/asets/logo.png" style={{width:"100%", borderRadius:12}} alt="preview" />
          </div>
        </div>
      </div>
    </main>
  );
}
