import { useState } from "react";
import { LandingPage } from "../features/landing/LandingPage";
import { DemoPage } from "../features/demo/DemoPage";
import { ErrorBoundary } from "../components/ErrorBoundary";

type View = "landing" | "demo";

function App() {
  const [view, setView] = useState<View>("landing");

  if (view === "landing") {
    return <LandingPage onEnterDemo={() => setView("demo")} />;
  }

  return (
    <ErrorBoundary onReset={() => setView("landing")}>
      <DemoPage onBackHome={() => setView("landing")} />
    </ErrorBoundary>
  );
}

export default App;
