import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react' // 1. Importez PersistGate
import { store, persistor } from './store/index.js' // 2. Importez aussi le persistor
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}> {/* 3. Enveloppez l'App */}
        <App />
      </PersistGate>
    </Provider>
  </StrictMode>,
)