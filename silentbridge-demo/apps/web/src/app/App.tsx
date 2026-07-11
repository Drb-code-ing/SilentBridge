import { useState } from "react";
import { LandingPage } from "../features/landing/LandingPage";
import { DemoPage } from "../features/demo/DemoPage";
import { ErrorBoundary } from "../components/ErrorBoundary";

type View = "landing" | "demo";

function App() {
  // 默认直接进入产品，而不是宣传落地页
  const [view, setView] = useState<View>("demo");
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
    <ErrorBoundary onReset={() => setView("demo")}>
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
