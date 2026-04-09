import { Eye, Gauge, Layers3, Sparkles } from "lucide-react";
import { NavLink, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LiveDemoPage from "./pages/LiveDemoPage";
import BenchmarksPage from "./pages/BenchmarksPage";
import AboutPage from "./pages/AboutPage";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: Eye },
  { to: "/live-demo", label: "Live Demo", icon: Gauge },
  { to: "/benchmarks", label: "Benchmarks", icon: Layers3 },
  { to: "/about", label: "Model Summary", icon: Sparkles },
];

const navLinkClass = ({ isActive }) =>
  `shell-nav-link${isActive ? " is-active" : ""}`;

function App() {
  return (
    <div className="app-shell">
      <header className="shell-header">
        <div className="shell-header-inner">
          <div className="shell-brand">
            <div className="shell-logo">
              <Eye size={20} aria-hidden="true" />
            </div>
            <div>
              <p className="shell-kicker">MPIIGaze Platform</p>
              <h1 className="font-display shell-title">
                Real-Time Gaze Intelligence
              </h1>
            </div>
          </div>

          <nav className="shell-nav" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={navLinkClass}
                >
                  <Icon className="shell-nav-icon" size={14} aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="page-wrap shell-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/live-demo" element={<LiveDemoPage />} />
          <Route path="/benchmarks" element={<BenchmarksPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
