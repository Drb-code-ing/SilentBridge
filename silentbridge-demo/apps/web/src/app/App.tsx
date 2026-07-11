import { useState } from "react";
import { LandingPage } from "../features/landing/LandingPage";
import { DemoPage } from "../features/demo/DemoPage";
import { ErrorBoundary } from "../components/ErrorBoundary";

type View = "landing" | "demo";

function App() {
  const [view, setView] = useState<View>("landing");
  const [autoJudgeDemo, setAutoJudgeDemo] = useState(false);

  if (view === "landing") {
    return (
      <LandingPage
        onEnterDemo={() => {
          setAutoJudgeDemo(false);
          setView("demo");
        }}
        onEnterJudgeDemo={() => {
          setAutoJudgeDemo(true);
          setView("demo");
        }}
      />
    );
  }

  return (
    <ErrorBoundary onReset={() => setView("landing")}>
      <DemoPage
        onBackHome={() => {
          setAutoJudgeDemo(false);
          setView("landing");
        }}
        autoStartJudgeDemo={autoJudgeDemo}
      />
    </ErrorBoundary>
  );
}

export default App;
