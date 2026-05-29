import { useEffect } from 'react';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export default function OnboardingGuide() {
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('tickofiesta_onboarding');
    if (hasSeenGuide) return;

    const driverObj = driver({
      showProgress: true,
      nextBtnText: 'Suivant',
      prevBtnText: 'Précédent',
      doneBtnText: 'C\'est compris !',
      steps: [
        { 
          element: '#dashboard-header', 
          popover: { title: 'Bienvenue sur votre Espace Succès', description: 'C\'est ici que tout commence. Suivez vos performances en un coup d\'œil.' } 
        },
        { 
          element: 'a[href="/dashboard/events"]', 
          popover: { title: '1. Créer un Événement', description: 'Commencez par définir votre événement. C\'est la base de toute votre activité.' } 
        },
        { 
          element: 'a[href="/dashboard/tickets"]', 
          popover: { title: '2. Ajouter des Billets', description: 'Configurez vos catégories de billets pour commencer à générer du chiffre d\'affaires.' } 
        },
        { 
          element: 'a[href="/dashboard/cagnottes"]', 
          popover: { title: '3. Lancer une Cagnotte', description: 'Besoin de fonds pour vos projets ? Centralisez les contributions ici.' } 
        },
        { 
          element: 'a[href="/dashboard/stands"]', 
          popover: { title: '4. Stands & Votes', description: 'Gérez vos exposants et boostez l\'engagement de votre public via les votes interactifs.' } 
        },
        { 
          element: '#mobile-bottom-nav',
          popover: { title: 'Navigation Rapide', description: 'Gardez tous ces outils à portée de pouce, même en déplacement !' } 
        }
      ],
      onDestroy: () => {
        localStorage.setItem('tickofiesta_onboarding', 'true');
      }
    });

    const timer = setTimeout(() => {
      driverObj.drive();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}