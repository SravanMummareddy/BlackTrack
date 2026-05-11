// v2 — merged direction canvas

const DEFAULTS = /*EDITMODE-BEGIN*/{
  "showNotes": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(DEFAULTS);

  const note = (txt) => t.showNotes ? (
    <div style={{
      maxWidth: 280, fontFamily: V.hand, fontSize: 16, color: '#5a4a2a',
      background: '#fef4a8', padding: '10px 12px', borderRadius: 4,
      boxShadow: '0 2px 8px rgba(0,0,0,.12)',
      transform: 'rotate(-1deg)', lineHeight: 1.3,
    }}>{txt}</div>
  ) : null;

  return (
    <>
      <TweaksPanel title="Tweaks">
        <TweakSection label="Display">
          <TweakToggle label="Show notes" value={t.showNotes}
                       onChange={(v)=>setTweak('showNotes', v)}/>
        </TweakSection>
      </TweaksPanel>

      <DesignCanvas>
        <DCSection id="intro" title="BlackStack — v2"
          subtitle="Merged direction per your picks. Premium gold + black, Fraunces display + Inter UI, Caveat handwriting for notes. Dashboard C base, Add A+B w/ multi-game, Analytics A+B w/ filters, Learn hub, Trainer with reasoning, Chart C.">
        </DCSection>

        <DCSection id="dashboard" title="Dashboard"
          subtitle="C base (budget ring + heatmap) → added period switcher (week/month/year/all), session count + W/L, recent sessions row.">
          <DCArtboard id="dash" label="Dashboard · home" width={320} height={660}>
            <Dashboard/>
          </DCArtboard>
          {note("Budget ring leads — keeps responsible-play context at the top. Period switcher recolors all the stats below. Recent row taps thru to History.")}
        </DCSection>

        <DCSection id="add" title="Add session"
          subtitle="A + B merged — fast capture form, but games is now a SUB-LEDGER. Add multiple games to one session (BJ + Poker + Roulette), each with its own buy-in / cash-out / net. Session total auto-sums.">
          <DCArtboard id="add" label="Add session · multi-game" width={320} height={660}>
            <AddSession/>
          </DCArtboard>
          {note("Multi-game answer: a session is a 'visit'. Inside, each game is a sub-row that expands to show buy-in & cash-out. Tap '+ ADD GAME' to add another. Session NET = sum of game nets. Lets you ask later: 'how much did I win at BJ specifically?'")}
        </DCSection>

        <DCSection id="analytics" title="Analytics"
          subtitle="A + B merged. Cumulative line (A) + Mood × Result scatter (B) + by-casino breakdown (A). Filter chips at top — casinos, games, tags. Period switcher above.">
          <DCArtboard id="analytics" label="Analytics · patterns" width={320} height={660}>
            <Analytics/>
          </DCArtboard>
          {note("Filter chips at the top apply to ALL panels below — same data, sliced by what you pick. Pattern callouts (\"Tilted sessions avg -$74\") turn raw data into self-awareness.")}
        </DCSection>

        <DCSection id="learn" title="Blackjack — learn (hub)"
          subtitle="Variant C: streak header + grid of Lessons / Trainer / Flashcards / Quiz / Chart / Mistakes. Mistakes tile pulls from wrong-trainer-hands.">
          <DCArtboard id="learn" label="Learn · hub" width={320} height={660}>
            <Learn/>
          </DCArtboard>
        </DCSection>

        <DCSection id="trainer" title="Blackjack — trainer"
          subtitle="Two states side-by-side: PROMPT (with optional hint + 'Why this hand?' panel) and FEEDBACK (after answer: explanation + rule-of-thumb + tags + add to review).">
          <DCArtboard id="trainer-prompt" label="Trainer · prompt + hint" width={320} height={660}>
            <Trainer/>
          </DCArtboard>
          <DCArtboard id="trainer-feedback" label="Trainer · feedback + reasoning" width={320} height={660}>
            <TrainerFeedback/>
          </DCArtboard>
          {note("'Show hint' is optional — doesn't break streak, but flags the hand. Reasoning is always shown after answer. 'Rule of thumb' = short memorable cue. Wrong hands flow to the Mistakes tile.")}
        </DCSection>

        <DCSection id="chart" title="Strategy chart"
          subtitle="Variant C: all three (Hard, Soft, Pairs) on one scrollable page with shared legend. Reference mode — quick-glance, no tabs.">
          <DCArtboard id="chart" label="Chart · all three" width={320} height={660}>
            <Chart/>
          </DCArtboard>
        </DCSection>
      </DesignCanvas>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
