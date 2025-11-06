import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { GanacheProvider } from './hooks/useGanache'
import { Web3Provider } from './hooks/useWeb3'

createRoot(document.getElementById("root")!).render(
  <Web3Provider>
    <GanacheProvider>
      <App />
    </GanacheProvider>
  </Web3Provider>
);
