// Top-level prototype app — state, routing, sheets

function App() {
  const [tab, setTab] = React.useState('home');
  const [period, setPeriod] = React.useState('Month');
  const [addOpen, setAddOpen] = React.useState(false);
  const [overlay, setOverlay] = React.useState(null); // 'analytics' | 'chart' | 'bankroll' | 'trainer' | 'session'
  const [session, setSession] = React.useState(null);
  const [trainerStats, setTrainerStats] = React.useState({ total: 0, correct: 0, streak: 0 });

  const openSession = (s) => { setSession(s); setOverlay('session'); };

  const trainerStat = (wasCorrect) => {
    setTrainerStats(s => ({
      total: s.total + 1,
      correct: s.correct + (wasCorrect ? 1 : 0),
      streak: wasCorrect ? s.streak + 1 : 0,
    }));
  };

  const tabs = {
    home:  <HomeScreen
             period={period} setPeriod={setPeriod}
             onOpenSession={openSession}
             onGoTo={(s) => setOverlay(s)}/>,
    log:   <LogScreen onOpenSession={openSession}/>,
    learn: <LearnScreen
             onOpenTrainer={() => setOverlay('trainer')}
             onOpenChart={() => setOverlay('chart')}
             onOpenLesson={() => {}}/>,
    me:    <MeScreen onGoTo={(s) => setOverlay(s)}/>,
  };

  const overlayContent = {
    analytics: <AnalyticsScreen onBack={() => setOverlay(null)}
                  period={period} setPeriod={setPeriod}/>,
    chart:     <ChartScreen onBack={() => setOverlay(null)}/>,
    bankroll:  <BankrollScreen onBack={() => setOverlay(null)}/>,
    trainer:   <TrainerScreen
                  stats={trainerStats}
                  onStat={trainerStat}
                  onBack={() => setOverlay(null)}/>,
  };

  return (
    <PhoneShell>
      {/* Base screen layer */}
      <ScreenStack screen={tab} navStack={tabs}/>

      {/* Bottom nav */}
      <BottomNav active={tab} onChange={setTab} onFab={() => setAddOpen(true)}/>

      {/* Full-screen overlay (slides in from right) */}
      {overlay && overlay !== 'session' && (
        <div className="anim-slideR" style={{
          position: 'absolute', inset: 0, background: V.bg, zIndex: 25,
          paddingBottom: 78, display: 'flex', flexDirection: 'column',
        }}>
          {overlayContent[overlay]}
        </div>
      )}

      {/* Session detail sheet */}
      <Sheet open={overlay === 'session'} onClose={() => setOverlay(null)}>
        <SessionDetail session={session} onClose={() => setOverlay(null)}/>
      </Sheet>

      {/* Add sheet */}
      <AddSheet open={addOpen} onClose={() => setAddOpen(false)}/>
    </PhoneShell>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
