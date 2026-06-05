import { useEffect } from 'react';

export const useSeasonalTheme = () => {
  useEffect(() => {
    const now = new Date();
    const month = now.getMonth(); // 0 = Janvier, 11 = Décembre
    const day = now.getDate();

    let themeClass = '';

    // ─── PRIORITÉ 1 : ÉVÉNEMENTS COURTS & DATES PRÉCISES ────────────────────

    // Nouvel An (1er au 7 Janvier)
    if (month === 0 && day <= 7) {
      themeClass = 'theme-holiday';
    }
    // Saint-Valentin (10 au 15 Février)
    else if (month === 1 && day >= 10 && day <= 15) {
      themeClass = 'theme-valentine';
    }
    // Fête de la Musique (18 au 22 Juin)
    else if (month === 5 && day >= 18 && day <= 22) {
      themeClass = 'theme-music';
    }
    // Fête de l'Indépendance CI - 7 Août (Actif du 1er au 10 Août)
    else if (month === 7 && day <= 10) {
      themeClass = 'theme-ci';
    }
    // Halloween (25 au 31 Octobre)
    else if (month === 9 && day >= 25) {
      themeClass = 'theme-halloween';
    }
    // Black Friday (20 au 30 Novembre)
    else if (month === 10 && day >= 20) {
      themeClass = 'theme-black-friday';
    }

    // ─── PRIORITÉ 2 : THÈMES MENSUELS (Si aucun événement court n'est actif) ─
    
    if (!themeClass) {
      switch (month) {
        case 2: // Mars
        case 3: // Avril (Période de Pâques / Paquinou)
          themeClass = 'theme-paquinou'; 
          break;
        case 5: // Juin
        case 6: // Juillet (Grandes vacances / Été)
          themeClass = 'theme-summer';
          break;
        case 7: // Août (Après l'indépendance, on reste sur l'ambiance été)
          themeClass = 'theme-summer';
          break;
        case 8: // Septembre (Rentrée)
          themeClass = 'theme-rentree';
          break;
        case 11: // Décembre (Fêtes de fin d'année)
          themeClass = 'theme-holiday';
          break;
        default:
          themeClass = ''; // Laisse le thème Violet Premium par défaut
      }
    }

    // ─── GESTION DES CLASSES CSS ──────────────────────────────────────────

    const allThemes = [
      'theme-holiday', 'theme-valentine', 'theme-music', 
      'theme-ci', 'theme-halloween', 'theme-black-friday', 
      'theme-paquinou', 'theme-summer', 'theme-rentree'
    ];

    document.body.classList.remove(...allThemes);

    if (themeClass) {
      document.body.classList.add(themeClass);
    }

    return () => {
      document.body.classList.remove(...allThemes);
    };
  }, []);
};