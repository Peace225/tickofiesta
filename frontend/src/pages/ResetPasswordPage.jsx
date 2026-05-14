import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabaseClient'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase met le token dans l'URL, on le récupère automatiquement
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        toast.success('Tu peux maintenant définir un nouveau mot de passe')
      }
    })
  }, [])

  const handleReset = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return toast.error(error.message)
    toast.success('Mot de passe mis à jour !')
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f7ff] px-6">
      <form onSubmit={handleReset} className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl space-y-4">
        <h1 className="text-2xl font-black">Nouveau mot de passe</h1>
        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Nouveau mot de passe" className="w-full px-4 py-4 rounded-2xl border"/>
        <button className="w-full bg-[#6c47ff] text-white py-4 rounded-2xl font-black">Mettre à jour</button>
      </form>
    </div>
  )
}