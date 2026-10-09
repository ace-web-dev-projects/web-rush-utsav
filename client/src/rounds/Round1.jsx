function Round1({ round = 1 }) {
  return (
    <article className="active-round">
      <div className="active-round__header">
        <div><span className="active-round__eyebrow">ROUND 0{round} · LIVE</span><h2>Round {round}</h2></div>
        <span className="active-round__indicator">IN PROGRESS</span>
      </div>
      <div className="active-round__content"><span>ROUND {round} AREA</span><p>Round {round} is live. Add this round’s UI and behavior here.</p></div>
    </article>
  )
}

export default Round1
