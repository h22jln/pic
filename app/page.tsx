export default function Home() {
  return <main className="landing-shell alert-landing">
    <section className="welcome-dialog" role="dialog" aria-labelledby="welcome-question">
      <div className="welcome-titlebar"><span>ONE STUDIO</span><button className="welcome-titlebar-icon" type="button" aria-label="idea by leche">?</button></div>
      <div className="welcome-dialog-body">
        <span className="welcome-question-icon" aria-hidden="true">?</span>
        <h1 id="welcome-question">사진을 찍어보시겠습니까?</h1>
      </div>
      <div className="welcome-dialog-actions">
        <a className="landing-start" href="/frames">예, 시작하기</a>
        <a className="landing-start welcome-no" href="/gallery">아니오</a>
      </div>
    </section>
  </main>;
}
