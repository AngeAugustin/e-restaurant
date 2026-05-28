import type { UserRole } from "@/types";

export type GuideScope = UserRole | "complet";

export interface GuideSubsection {
  title: string;
  paragraphs?: string[];
  steps?: string[];
  tips?: string[];
}

export interface GuideSection {
  id: string;
  title: string;
  icon?: string;
  subsections: GuideSubsection[];
}

export interface RoleGuideMeta {
  role: UserRole;
  label: string;
  shortDescription: string;
  accessSummary: string[];
}

export const GUIDE_VERSION = "1.0";
export const GUIDE_LAST_UPDATED = "mai 2026";

export const COMMON_INTRO: GuideSection = {
  id: "introduction",
  title: "Introduction à la solution",
  subsections: [
    {
      title: "Connexion et sécurité",
      paragraphs: [
        "Chaque utilisateur dispose d'un compte personnel (e-mail et mot de passe). À la connexion, seules les pages autorisées pour votre rôle apparaissent dans le menu.",
        "En cas d'oubli de mot de passe, utilisez le lien « Mot de passe oublié » sur la page de connexion : un code OTP vous est envoyé par e-mail pour définir un nouveau mot de passe.",
      ],
      steps: [
        "Ouvrez l'URL de l'application et accédez à la page de connexion.",
        "Saisissez votre adresse e-mail et votre mot de passe.",
        "Cliquez sur « Se connecter » : vous êtes redirigé vers le tableau de bord.",
        "Pour vous déconnecter, cliquez sur l'icône de déconnexion en bas du menu latéral (ou confirmez dans la boîte de dialogue).",
      ],
    },
    {
      title: "Navigation générale",
      paragraphs: [
        "Sur ordinateur, le menu latéral gauche liste les modules accessibles. Sur mobile, une barre de navigation en bas affiche les raccourcis principaux.",
        "Votre nom et votre rôle sont visibles en bas du menu ; cliquez sur votre avatar pour accéder à « Mon profil » (modifier nom, téléphone, mot de passe).",
        "Le guide utilisateur (cette page) est accessible à tous les rôles depuis le menu « Guide ».",
      ],
    },
    {
      title: "Les trois rôles",
      paragraphs: [
        "Directeur : accès complet, y compris la suppression définitive des données sensibles (produits, utilisateurs, tables, etc.).",
        "Directrice : gestion opérationnelle et pilotage (catalogue, ventes, caisse, analytiques, équipe, paramètres) ; certaines suppressions sont réservées au directeur.",
        "Gérant : focus terrain — approvisionnements, ventes, caisse et tableau de bord ; pas d'accès au catalogue, aux serveuses, tables, analytiques, utilisateurs ni paramètres.",
      ],
    },
  ],
};

export const ROLE_META: Record<UserRole, RoleGuideMeta> = {
  directeur: {
    role: "directeur",
    label: "Directeur",
    shortDescription:
      "Pilotage global de l'établissement : catalogue, stocks, ventes, caisse, équipe, paramètres et suppressions sensibles.",
    accessSummary: [
      "Tableau de bord, Produits, Approvisionnements, Ventes, Caisse",
      "Serveuses, Tables, Analytiques, Utilisateurs, Paramètres, Profil, Guide",
      "Suppression des enregistrements (produits, appros, ventes annulables, sessions caisse, etc.)",
    ],
  },
  directrice: {
    role: "directrice",
    label: "Directrice",
    shortDescription:
      "Gestion quotidienne et supervision : même périmètre opérationnel que le directeur, sans certaines suppressions réservées au directeur.",
    accessSummary: [
      "Tableau de bord, Produits, Approvisionnements, Ventes, Caisse",
      "Serveuses, Tables, Analytiques, Utilisateurs, Paramètres, Profil, Guide",
      "Modification et création ; suppression limitée (ex. sessions caisse selon l'interface)",
    ],
  },
  gerant: {
    role: "gerant",
    label: "Gérant",
    shortDescription:
      "Exploitation en salle et en réserve : enregistrer les approvisionnements, prendre et clôturer les commandes, gérer la caisse.",
    accessSummary: [
      "Tableau de bord, Approvisionnements, Ventes, Caisse, Profil, Guide",
      "Pas d'accès : Produits, Serveuses, Tables, Analytiques, Utilisateurs, Paramètres",
    ],
  },
};

const dashboardSection: GuideSection = {
  id: "dashboard",
  title: "Tableau de bord",
  subsections: [
    {
      title: "Vue d'ensemble",
      paragraphs: [
        "Le tableau de bord est la page d'accueil après connexion. Il résume l'activité du jour et l'état du stock.",
        "Quatre indicateurs clés s'affichent en haut : chiffre d'affaires du jour, nombre de ventes du jour, nombre de produits en stock faible (< 5 unités), et nombre total de produits actifs au catalogue.",
      ],
    },
    {
      title: "Graphiques et listes",
      paragraphs: [
        "Un graphique montre l'évolution du chiffre d'affaires sur les derniers jours.",
        "Un graphique en anneau présente les produits les plus vendus.",
        "Une liste des ventes récentes permet d'accéder rapidement au détail d'une commande.",
        "Les produits en stock faible sont listés pour anticiper les ruptures.",
      ],
      tips: [
        "Les données se rafraîchissent automatiquement toutes les minutes.",
        "Cliquez sur une vente récente pour ouvrir sa fiche détaillée.",
      ],
    },
  ],
};

const suppliesSection: GuideSection = {
  id: "supplies",
  title: "Approvisionnements",
  subsections: [
    {
      title: "Principe",
      paragraphs: [
        "Chaque approvisionnement enregistre une entrée de stock pour un produit : nombre de casiers (lots), taille d'un casier (6, 12, 24 unités ou taille personnalisée), prix du casier et prix de vente unitaire marché.",
        "Le stock du produit augmente automatiquement du nombre total d'unités (casiers × taille). Le coût d'achat unitaire du produit est recalculé à partir du dernier appro.",
      ],
    },
    {
      title: "Enregistrer un approvisionnement",
      paragraphs: [
        "Le gérant et la direction peuvent créer des approvisionnements. La direction peut en outre modifier ou supprimer un appro existant (suppression réservée au directeur côté API).",
      ],
      steps: [
        "Ouvrez « Approvisionnements » dans le menu.",
        "Cliquez sur « Nouvel approvisionnement ».",
        "Ajoutez une ou plusieurs lignes : choisissez le produit, la taille de casier (6 / 12 / 24 ou « Autre » pour une quantité libre), le nombre de casiers, le prix du casier et le prix de vente unitaire.",
        "Vérifiez le récapitulatif (unités totales, montant) affiché sous chaque ligne.",
        "Validez : les stocks et statistiques de la page sont mis à jour.",
      ],
      tips: [
        "Vous pouvez saisir plusieurs produits dans un même formulaire avant validation.",
        "Le prix de vente marché saisi lors de l'appro peut mettre à jour la fiche produit.",
      ],
    },
    {
      title: "Consultation et modification",
      paragraphs: [
        "Le tableau liste tous les approvisionnements avec date, produit, unités, coût total et auteur.",
        "Des cartes de synthèse affichent le nombre d'appros, les unités et le coût total sur la période affichée.",
        "La direction peut modifier un appro via l'icône crayon ; le directeur peut supprimer un appro via l'icône corbeille.",
      ],
    },
  ],
};

const salesSection: GuideSection = {
  id: "sales",
  title: "Ventes",
  subsections: [
    {
      title: "Cycle de vie d'une vente",
      paragraphs: [
        "Une vente passe par les statuts « En attente » (commande ouverte) puis « Clôturée » (encaissement effectué). Une commande en attente peut être modifiée ou annulée tant qu'elle n'est pas clôturée.",
        "La clôture enregistre le montant payé, le mode de paiement (espèces, mobile money, etc.) et gère la monnaie à rendre le cas échéant.",
      ],
    },
    {
      title: "Créer une nouvelle vente (assistant en 3 étapes)",
      steps: [
        "Étape 1 — Service : choisissez la serveuse, puis une ou plusieurs tables. Vous pouvez créer une table à la volée si besoin.",
        "Étape 2 — Commande : parcourez les produits en stock, ajoutez les quantités au panier (le stock disponible limite les quantités).",
        "Étape 3 — Validation : vérifiez le récapitulatif (serveuse, tables, lignes, total) puis confirmez la création.",
        "La vente apparaît dans la liste avec le statut « En attente ».",
      ],
      tips: [
        "Seuls les produits avec stock > 0 sont proposés à la vente.",
        "Le prix appliqué est le prix de vente marché en vigueur sur la fiche produit.",
      ],
    },
    {
      title: "Modifier, clôturer, annuler",
      paragraphs: [
        "Depuis la liste des ventes : « Voir » ouvre le détail ; « Modifier » rouvre l'assistant pour une commande en attente ; « Clôturer » lance l'encaissement.",
      ],
      steps: [
        "Clôturer : saisissez le montant reçu (≥ total), choisissez le mode de paiement, indiquez si la monnaie a été rendue au client le cas échéant, puis confirmez.",
        "Annuler : disponible pour les commandes en attente — le stock réservé est libéré.",
        "Ticket : depuis le détail d'une vente clôturée, vous pouvez prévisualiser et télécharger le reçu PDF.",
      ],
    },
    {
      title: "Liste et statistiques",
      paragraphs: [
        "La page Ventes affiche le chiffre d'affaires cumulé, le total des ventes, le nombre en attente et le nombre clôturées.",
        "Le tableau est paginé ; vous pouvez changer le nombre de lignes par page.",
      ],
    },
  ],
};

const cashSection: GuideSection = {
  id: "cash",
  title: "Caisse",
  subsections: [
    {
      title: "Sessions de caisse",
      paragraphs: [
        "Une session de caisse correspond à une journée (ou période) d'exploitation. Elle démarre « En cours » avec un fond de caisse initial (espèces en caisse au début).",
        "À la clôture, la session passe en « Clôturée » : vous pouvez indiquer si le fond de caisse a été repris physiquement.",
      ],
    },
    {
      title: "Ouvrir une session",
      steps: [
        "Allez dans « Caisse ».",
        "Si aucune session n'est ouverte, cliquez sur « Ouvrir une session ».",
        "Saisissez le fond de caisse (montant en espèces au démarrage) et validez.",
        "Une seule session peut être ouverte à la fois.",
      ],
    },
    {
      title: "Clôturer, rouvrir, exporter",
      paragraphs: [
        "Sur une session ouverte : « Clôturer » termine la session. « Modifier » permet d'ajuster le fond de caisse tant que la session est ouverte.",
        "« Rouvrir » (sous conditions) réactive une session clôturée récente si aucune autre n'est ouverte.",
        "« Exporter PDF » génère un rapport de session (ventes, approvisionnements liés à la période, synthèse financière).",
        "La suppression d'une session est réservée au directeur.",
      ],
      tips: [
        "Les cartes de session affichent le total des ventes et des approvisionnements enregistrés pendant la session.",
      ],
    },
  ],
};

const productsSection: GuideSection = {
  id: "products",
  title: "Produits (catalogue)",
  subsections: [
    {
      title: "Fiche produit",
      paragraphs: [
        "Chaque produit possède un nom, une catégorie optionnelle, une image, un prix de vente marché, des informations de casier (quantité standard, prix casier) et un stock calculé à partir des approvisionnements et ventes.",
      ],
    },
    {
      title: "Créer et modifier",
      steps: [
        "Liste Produits : bouton « Nouveau produit » ou clic sur une ligne pour la fiche détail.",
        "Renseignez le nom, la catégorie, téléversez une image si besoin, définissez le prix de vente et les champs casier.",
        "Enregistrez : le produit est disponible pour les approvisionnements et les ventes.",
      ],
    },
    {
      title: "Import et export",
      paragraphs: [
        "Import Excel : téléchargez le modèle depuis l'interface, remplissez-le, prévisualisez puis validez l'import en masse (noms, prix, images URL, etc.).",
        "Export : catalogue exportable en Excel ou PDF pour archivage ou contrôle.",
      ],
      tips: [
        "Seul le directeur peut supprimer définitivement un produit du catalogue.",
        "Désactiver un produit le retire des ventes sans effacer l'historique.",
      ],
    },
  ],
};

const waitressesSection: GuideSection = {
  id: "waitresses",
  title: "Serveuses",
  subsections: [
    {
      title: "Gestion du personnel de salle",
      paragraphs: [
        "Les serveuses sont référencées pour attribuer chaque vente. La liste permet d'ajouter, modifier ou consulter l'historique des ventes par serveuse.",
      ],
      steps: [
        "« Serveuses » → « Ajouter » : nom, téléphone optionnel.",
        "Cliquez sur une serveuse pour voir le détail et les ventes qui lui sont rattachées.",
        "La suppression est réservée au directeur.",
      ],
    },
  ],
};

const tablesSection: GuideSection = {
  id: "tables",
  title: "Tables",
  subsections: [
    {
      title: "Plan de salle",
      paragraphs: [
        "Chaque table a un identifiant et une capacité (nombre de places). L'état « Occupée » est dérivé des ventes en attente liées à cette table.",
      ],
      steps: [
        "Créez une table avec sa capacité depuis la page Tables.",
        "Lors d'une vente, sélectionnez une ou plusieurs tables ; vous pouvez aussi en créer une depuis l'assistant vente.",
        "Suppression réservée au directeur.",
      ],
    },
  ],
};

const analyticsSection: GuideSection = {
  id: "analytics",
  title: "Analytiques",
  subsections: [
    {
      title: "Indicateurs et périodes",
      paragraphs: [
        "La page Analytiques agrège approvisionnements et ventes sur une période choisie : aujourd'hui, hier, semaine, mois, semestre, année ou plage personnalisée.",
        "Vous y voyez revenus, coûts, marges, graphiques d'évolution et classement des produits par profit.",
      ],
    },
    {
      title: "Export PDF",
      paragraphs: [
        "Le bouton d'export génère un rapport PDF complet (synthèse exécutive, tableaux des appros et ventes, profits par produit, insights automatiques).",
      ],
      tips: [
        "Utilisez ce rapport pour les réunions de pilotage ou l'archivage mensuel.",
      ],
    },
    {
      title: "Évolution des prix",
      paragraphs: [
        "Un graphique dédié montre l'évolution du prix de vente marché d'un produit sélectionné dans le temps (selon les approvisionnements enregistrés).",
      ],
    },
  ],
};

const usersSection: GuideSection = {
  id: "users",
  title: "Utilisateurs",
  subsections: [
    {
      title: "Gestion de l'équipe",
      paragraphs: [
        "Créez des comptes pour les membres de l'équipe : prénom, nom, e-mail, téléphone, adresse, rôle (directeur, directrice, gérant).",
        "Chaque personne reçoit ses identifiants et n'accède qu'aux modules de son rôle.",
      ],
      steps: [
        "Page Utilisateurs → « Nouvel utilisateur ».",
        "Renseignez les champs obligatoires et choisissez le rôle.",
        "Enregistrez ; l'utilisateur peut se connecter et modifier son mot de passe depuis son profil.",
      ],
      tips: [
        "Seul le directeur peut supprimer un compte utilisateur.",
        "Ne partagez pas les mots de passe par messagerie non sécurisée.",
      ],
    },
  ],
};

const settingsSection: GuideSection = {
  id: "settings",
  title: "Paramètres",
  subsections: [
    {
      title: "Personnalisation",
      paragraphs: [
        "Onglet Personnalisation : nom de la solution affiché dans le menu, logo (upload), couleur principale de l'interface (palette ou code hexadécimal).",
        "Les changements de couleur peuvent être prévisualisés avant enregistrement.",
      ],
    },
    {
      title: "Alertes stock faible",
      paragraphs: [
        "Onglet Alertes : définissez le seuil de stock faible (par défaut 5 unités) et une ou plusieurs adresses e-mail qui recevront les notifications.",
        "Lorsqu'un produit passe sous le seuil, un e-mail d'alerte peut être envoyé automatiquement.",
      ],
    },
  ],
};

const profileSection: GuideSection = {
  id: "profile",
  title: "Mon profil",
  subsections: [
    {
      title: "Compte personnel",
      paragraphs: [
        "Accessible via votre avatar en bas du menu latéral. Vous pouvez modifier votre prénom, nom, téléphone et changer votre mot de passe (ancien mot de passe requis).",
        "L'e-mail et le rôle ne sont modifiables que par un administrateur depuis la page Utilisateurs.",
      ],
    },
  ],
};

const privilegesSection: GuideSection = {
  id: "privileges",
  title: "Droits et bonnes pratiques (Directeur)",
  subsections: [
    {
      title: "Suppressions et responsabilité",
      paragraphs: [
        "En tant que directeur, vous êtes le seul à pouvoir supprimer définitivement : utilisateurs, produits, approvisionnements, tables, serveuses, et certaines sessions de caisse.",
        "Avant toute suppression, vérifiez l'impact sur l'historique (ventes liées, stocks, rapports).",
      ],
      tips: [
        "Privilégiez la désactivation d'un produit plutôt que sa suppression si l'historique compte.",
        "Effectuez régulièrement un export analytique PDF pour archivage.",
      ],
    },
  ],
};

export const ROLE_GUIDES: Record<UserRole, GuideSection[]> = {
  directeur: [
    dashboardSection,
    productsSection,
    suppliesSection,
    salesSection,
    cashSection,
    waitressesSection,
    tablesSection,
    analyticsSection,
    usersSection,
    settingsSection,
    profileSection,
    privilegesSection,
  ],
  directrice: [
    dashboardSection,
    productsSection,
    suppliesSection,
    salesSection,
    cashSection,
    waitressesSection,
    tablesSection,
    analyticsSection,
    usersSection,
    settingsSection,
    profileSection,
    {
      id: "privileges",
      title: "Droits et limites (Directrice)",
      subsections: [
        {
          title: "Ce que vous pouvez faire",
          paragraphs: [
            "Vous gérez le quotidien : catalogue, approvisionnements, ventes, caisse, serveuses, tables, analytiques, création d'utilisateurs et paramètres de l'application.",
          ],
        },
        {
          title: "Restrictions",
          paragraphs: [
            "Certaines suppressions définitives sont réservées au directeur (produits, utilisateurs, tables, serveuses, approvisionnements, suppression de sessions caisse selon l'écran).",
            "En cas de doute, demandez validation au directeur avant de supprimer des données historiques.",
          ],
        },
      ],
    },
  ],
  gerant: [
    dashboardSection,
    suppliesSection,
    salesSection,
    cashSection,
    profileSection,
    {
      id: "workflow",
      title: "Enchaînement type d'une journée",
      subsections: [
        {
          title: "Matin — ouverture",
          steps: [
            "Connectez-vous et consultez le tableau de bord (stocks faibles, activité).",
            "Ouvrez une session de caisse avec le fond de caisse réel.",
            "Enregistrez les approvisionnements du jour (livraisons reçues).",
          ],
        },
        {
          title: "Service — ventes",
          steps: [
            "Créez les commandes via « Nouvelle vente » (serveuse + tables + produits).",
            "Modifiez les commandes en attente si le client change sa commande.",
            "Clôturez chaque vente au moment du paiement (montant, mode, monnaie).",
          ],
        },
        {
          title: "Soir — clôture",
          steps: [
            "Vérifiez qu'il ne reste pas de commandes en attente non voulues.",
            "Clôturez la session de caisse.",
            "Indiquez si le fond de caisse a été repris.",
          ],
        },
      ],
    },
  ],
};

export function getGuideSectionsForRole(role: UserRole): GuideSection[] {
  return ROLE_GUIDES[role];
}

export function getFullGuideDocument(): {
  intro: GuideSection;
  roles: Array<{ meta: RoleGuideMeta; sections: GuideSection[] }>;
} {
  return {
    intro: COMMON_INTRO,
    roles: (["directeur", "directrice", "gerant"] as UserRole[]).map((role) => ({
      meta: ROLE_META[role],
      sections: ROLE_GUIDES[role],
    })),
  };
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_META[role].label;
}
