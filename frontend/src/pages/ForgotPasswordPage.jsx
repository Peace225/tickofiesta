import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../config/supabaseClient'
import toast from 'react-hot-toast'
import { Mail, Smartphone, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [identifiant, setIdentifiant] = useState('')
  const [loading, setLoading] = useState(false)

  const phoneToEmail = (phone) => {
    let p = phone.trim().replace(/\s+/g, '')
    if (p.startsWith('00')) p = '+' + p.substring(2)
    if (!p.startsWith('+')) p = '+225' + p.slice(-10)
    return `${p}@tickofiesta.ci`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const id = identifiant.trim()
    const isEmail = id.includes('@')
    const email = isEmail ? id : phoneToEmail(id)

    // Les participants n'ont pas de vraie boîte mail
    if (email.endsWith('@tickofiesta.ci')) {
      setLoading(false)
      toast.error("Compte participant : réinitialisation par SMS pas encore activée. Contacte le support WhatsApp +225 07 00 00 00 00")
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://tickofiesta.vercel.app/reset-password'
      })
      if (error) throw error
      toast.success('Email envoyé ! Vérifie ta boîte mail.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f7ff] px-6">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl">
        <Link to="/login" className="flex items-center gap-2 text-sm text-slate-500 mb-6"><ArrowLeft size={16}/> Retour</Link>
        <h1 className="text-3xl font-black mb-2">Mot de passe oublié</h1>
        <p className="text-slate-500 mb-6">Organisateurs : entrez votre email. Participants : contactez le support pour l'instant.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            {identifiant.includes('@') ? <Mail size={18} className="absolute left-4 top-4 text-slate-400"/> : <Smartphone size={18} className="absolute left-4 top-4 text-slate-400"/>}
            <input 
              type="text" 
              required
              value={identifiant}
              onChange={e => setIdentifiant(e.target.value)}
              placeholder="email ou 0102030405"
              className="w-full pl-11 pr-4 py-4 rounded-2xl border border-slate-200 focus:border-[#6c47ff] outline-none"
            />
          </div>
          <button disabled={loading} className="w-full bg-[#6c47ff] text-white py-4 rounded-2xl font-black uppercase">
            {loading ? '...' : 'Envoyer le lien'}
          </button>
        </form>
      </div>
    </div>
  )
}