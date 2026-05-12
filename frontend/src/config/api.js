import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  // withCredentials est utile si ton backend utilise des cookies de session.
  // Si tu utilises uniquement des Bearer Tokens, tu peux le passer à false.
  withCredentials: true, 
});

// 1. Injecter le token intelligemment
api.interceptors.request.use((config) => {
  // CORRECTION : Supabase stocke souvent le token sous une clé complexe.
  // Si tu as un authSlice qui gère le token, il vaut mieux le récupérer via le state
  // ou s'assurer que 'token' est bien la clé utilisée lors du login.
  const token = localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Gérer les erreurs sans casser l'application
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    // CORRECTION : On ne redirige vers le login QUE si :
    // - C'est une erreur 401 (Unauthorized)
    // - Ce n'est pas une requête d'analytics (pour éviter la boucle sur un tracker)
    // - On n'est pas déjà sur la page de login
    if (
      error.response?.status === 401 && 
      !originalRequest.url.includes('/analytics') && 
      !window.location.pathname.includes('/login')
    ) {
      console.warn("Session expirée ou invalide. Redirection...");
      
      // On nettoie le token
      localStorage.removeItem('token');
      
      // Au lieu de window.location.href qui recharge toute la page, 
      // il est préférable de laisser ton ProtectedRoute gérer la redirection
      // mais pour un correctif rapide, on s'assure de ne pas boucler :
      window.location.replace('/login'); 
    }

    // Si le backend est éteint (Network Error), error.response est undefined.
    // Ton code précédent ne gérait pas ce cas, ce qui est correct ici.
    return Promise.reject(error);
  }
);

export default api;