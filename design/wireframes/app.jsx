// Top-level app: tweaks panel + design canvas of all screens

const DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#3a6df0",
  "showNotes": true,
  "density": "comfy"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(DEFAULTS);

  // Apply accent override
  React.useEffect(() => {
    WF.accent = t.accent;
  }, [t.accent]);

  const note = (txt) => t.showNotes ? (
    <div style={{
      maxWidth: 260, fontFamily: WF.hand, fontSize: 16, color: '#5a4a2a',
      background: '#fef4a8', padding: '8px 10px', borderRadius: 4,
      boxShadow: '0 2px 6px rgba(0,0,0,.08)',
      transform: 'rotate(-1deg)',
    }}>{txt}</div>
  ) : null;

  return (
    <>
      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme">
          <TweakColor
            label="Accent"
            value={t.accent}
            options={['#3a6df0','#4a7a4a','#b08838','#a14a4a','#7a4aa1']}
            onChange={(v) => setTweak('accent', v)}
          />
        </TweakSection>
        <TweakSection label="Display">
          <TweakToggle label="Show notes" value={t.showNotes}
                       onChange={(v)=>setTweak('showNotes', v)}/>
          <TweakRadio label="Density" value={t.density}
                      options={['cozy','comfy']}
                      onChange={(v)=>setTweak('density', v)}/>
        </TweakSection>
      </TweaksPanel>

      <DesignCanvas key={t.accent}>
        <DCSection id="intro" title="BlackStack — wireframes"
          subtitle="7 screens × 3 variations. Light = paper, dark = night. Subtle blue accent, hand-drawn labels, finance-app density. Drag artboards to reorder; tap ⤢ to focus.">
        </DCSection>

        <DCSection id="dashboard" title="Dashboard"
          subtitle="Where the user lands. Tracker home, period switcher, or bankroll-budget-first.">
          <DCArtboard id="dash-a" label="A · Net hero + stat grid" width={300} height={620}>
            <DashA/>
          </DCArtboard>
          <DCArtboard id="dash-b" label="B · Period switcher" width={300} height={620}>
            <DashB/>
          </DCArtboard>
          <DCArtboard id="dash-c" label="C · Budget ring · dark" width={300} height={620}>
            <DashC/>
          </DCArtboard>
          {note("Pick a 'spine' — net P/L (A), period (B), or budget (C). I'd lean C — keeps responsible-play context at the top.")}
        </DCSection>

        <DCSection id="add" title="Add session"
          subtitle="Fast capture is critical. Three takes: scrolling form, step wizard, live in-casino mode.">
          <DCArtboard id="add-a" label="A · Single form" width={300} height={620}>
            <AddA/>
          </DCArtboard>
          <DCArtboard id="add-b" label="B · Step wizard + numpad" width={300} height={620}>
            <AddB/>
          </DCArtboard>
          <DCArtboard id="add-c" label="C · Live session · dark" width={300} height={620}>
            <AddC/>
          </DCArtboard>
          {note("B is the fastest one-handed; C adds the responsible-play angle (reality checks, time alerts).")}
        </DCSection>

        <DCSection id="analytics" title="Analytics"
          subtitle="Rich viz: cumulative line, mood vs result, calendar heatmap, breakdowns.">
          <DCArtboard id="an-a" label="A · Cumulative + top casinos" width={300} height={620}>
            <AnalyticsA/>
          </DCArtboard>
          <DCArtboard id="an-b" label="B · Mood × Result + heatmap" width={300} height={620}>
            <AnalyticsB/>
          </DCArtboard>
          <DCArtboard id="an-c" label="C · Game breakdown · dark" width={300} height={620}>
            <AnalyticsC/>
          </DCArtboard>
          {note("B is the differentiator vs every other tracker — pattern-finding for self-awareness, not bragging.")}
        </DCSection>

        <DCSection id="bankroll" title="Bankroll & limits"
          subtitle="Setup, ongoing status, and the warning state when you blow past a limit.">
          <DCArtboard id="bk-a" label="A · Status dashboard" width={300} height={620}>
            <BankrollA/>
          </DCArtboard>
          <DCArtboard id="bk-b" label="B · Slider setup" width={300} height={620}>
            <BankrollB/>
          </DCArtboard>
          <DCArtboard id="bk-c" label="C · Limit-reached · dark" width={300} height={620}>
            <BankrollC/>
          </DCArtboard>
          {note("C is the moment that actually matters. Soft language, reflection prompts, help link — never a hard block.")}
        </DCSection>

        <DCSection id="learn" title="Blackjack — learn"
          subtitle="Onboarding into basic strategy. Course flow, single lesson, and hub view.">
          <DCArtboard id="ln-a" label="A · Course outline" width={300} height={620}>
            <LearnA/>
          </DCArtboard>
          <DCArtboard id="ln-b" label="B · Lesson reader" width={300} height={620}>
            <LearnB/>
          </DCArtboard>
          <DCArtboard id="ln-c" label="C · Learn hub · dark" width={300} height={620}>
            <LearnC/>
          </DCArtboard>
        </DCSection>

        <DCSection id="trainer" title="Blackjack — trainer"
          subtitle="Interactive practice: decide a hand, get feedback, build accuracy.">
          <DCArtboard id="tr-a" label="A · Practice prompt" width={300} height={620}>
            <TrainerA/>
          </DCArtboard>
          <DCArtboard id="tr-b" label="B · Feedback after wrong" width={300} height={620}>
            <TrainerB/>
          </DCArtboard>
          <DCArtboard id="tr-c" label="C · Speed drill · dark" width={300} height={620}>
            <TrainerC/>
          </DCArtboard>
          {note("Three modes: untimed teaching (A), reflective feedback (B), arcade-style drill (C). Could ship all three.")}
        </DCSection>

        <DCSection id="chart" title="Strategy chart"
          subtitle="Reference. Full grid vs. quick lookup vs. all-three compact.">
          <DCArtboard id="ch-a" label="A · Tabbed full grid" width={300} height={620}>
            <ChartA/>
          </DCArtboard>
          <DCArtboard id="ch-b" label="B · Lookup picker" width={300} height={620}>
            <ChartB/>
          </DCArtboard>
          <DCArtboard id="ch-c" label="C · All charts · dark" width={300} height={620}>
            <ChartC/>
          </DCArtboard>
        </DCSection>
      </DesignCanvas>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
