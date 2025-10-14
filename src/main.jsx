import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import VoiceAgent from './pages/VoiceAgent.jsx'
import ChatChannel from './pages/ChatChannel.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
   <BrowserRouter>
    <Routes>
    <Route index element={<App />} />
    <Route path="/voice" element={<VoiceAgent />} />
    <Route path="/chat" element={<ChatChannel />} />
  </Routes>
   </BrowserRouter>
  </StrictMode>,
)
