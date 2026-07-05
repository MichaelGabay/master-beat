import { useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { Toaster } from '@/components/ui/toaster'
import { useHostDisconnected } from '@/hooks/useHostDisconnected'
import { getSocket } from '@/lib/socket'
import { CreateGame } from '@/pages/CreateGame'
import { HomeScreen } from '@/pages/HomeScreen'
import { JoinGame } from '@/pages/JoinGame'

function HostDisconnectedListener() {
  useHostDisconnected()
  return null
}

function App() {
  useEffect(() => {
    getSocket()
  }, [])

  return (
    <BrowserRouter>
      <HostDisconnectedListener />
      <Toaster />
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/create" element={<CreateGame />} />
        <Route path="/join" element={<JoinGame />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
