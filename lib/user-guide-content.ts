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

export const GUIDE_VERSION = "2.0";
export const GUIDE_LAST_UPDATED = "août 2026";

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
        "Sur ordinateur, le menu latéral gauche liste les pages du module actif. Sur mobile, une barre de navigation en bas affiche les raccourcis principaux.",
        "En haut de l'écran, une barre de modules permet de basculer entre les grands espaces de travail : Bar, Cuisine, Comptabilité et Administration. Chaque module affiche uniquement les pages auxquelles votre rôle a accès.",
        "Votre nom et votre rôle sont visibles en bas du menu ; cliquez sur votre avatar pour accéder à « Mon profil » (modifier nom, téléphone, mot de passe).",
        "Le guide utilisateur (cette page) est accessible depuis le module Administration.",
      ],
    },
    {
      title: "Organisation en quatre modules",
      paragraphs: [
        "L'application est structurée en quatre modules indépendants mais complémentaires. Le sélecteur en haut de page vous permet de passer de l'un à l'autre sans vous déconnecter.",
      ],
      steps: [
        "Bar — activité boissons et salle : tableau de bord, produits, approvisionnements, ventes, caisse bar, serveuses, tables, analytiques.",
        "Cuisine — activité repas : commandes cuisine, caisse cuisine, menus, cuisinières, plaquettes.",
        "Comptabilité — trésorerie et personnel : situation financière, fiches de paie, dépenses générales.",
        "Administration — pilotage : utilisateurs, paramètres de l'application, guide utilisateur.",
      ],
      tips: [
        "La caisse bar et la caisse cuisine sont indépendantes : chacune a ses propres sessions.",
        "Les dépenses et la comptabilité concernent la trésorerie globale de l'établissement, pas une caisse en particulier.",
      ],
    },
    {
      title: "Les trois rôles",
      paragraphs: [
        "Directeur : accès complet sur tous les modules, y compris la suppression définitive des données sensibles (produits, utilisateurs, tables, fiches de paie, etc.).",
        "Directrice : gestion opérationnelle et pilotage sur l'ensemble des modules ; certaines suppressions sont réservées au directeur.",
        "Gérant : exploitation terrain — bar (approvisionnements, ventes, caisse bar), cuisine (commandes, caisse cuisine, menus). Pas d'accès au catalogue produits, aux autres référentiels cuisine (cuisinières, serveuses-cuisinières, plaquettes), à la comptabilité, à la paie, aux analytiques, aux utilisateurs ni aux paramètres.",
      ],
    },
  ],
};

export const ROLE_META: Record<UserRole, RoleGuideMeta> = {
  directeur: {
    role: "directeur",
    label: "Directeur",
    shortDescription:
      "Pilotage global de l'établissement sur les quatre modules : bar, cuisine, comptabilité, administration et suppressions sensibles.",
    accessSummary: [
      "Module Bar : tableau de bord, produits, approvisionnements, ventes, caisse, serveuses, tables, analytiques",
      "Module Cuisine : commandes, caisse cuisine, menus, cuisinières, plaquettes",
      "Module Comptabilité : situation financière, fiches de paie, dépenses",
      "Module Administration : utilisateurs, paramètres, guide, profil",
      "Suppression des enregistrements sensibles (produits, utilisateurs, fiches de paie, etc.)",
    ],
  },
  directrice: {
    role: "directrice",
    label: "Directrice",
    shortDescription:
      "Gestion quotidienne et supervision sur les modules bar, cuisine, comptabilité et administration ; certaines suppressions réservées au directeur.",
    accessSummary: [
      "Module Bar : tableau de bord, produits, approvisionnements, ventes, caisse, serveuses, tables, analytiques",
      "Module Cuisine : commandes, caisse cuisine, menus, cuisinières, plaquettes",
      "Module Comptabilité : situation financière, fiches de paie, dépenses",
      "Module Administration : utilisateurs, paramètres, guide, profil",
      "Modification et création ; suppressions limitées (certaines réservées au directeur)",
    ],
  },
  gerant: {
    role: "gerant",
    label: "Gérant",
    shortDescription:
      "Exploitation terrain : bar (approvisionnements, ventes, caisse) et cuisine (commandes, caisse cuisine, menus).",
    accessSummary: [
      "Module Bar : tableau de bord, approvisionnements, ventes, caisse bar",
      "Module Cuisine : commandes cuisine, caisse cuisine, menus",
      "Mon profil (avatar dans le menu latéral)",
      "Pas d'accès : produits, serveuses, tables, analytiques, cuisinières, serveuses-cuisinières, plaquettes, comptabilité, paie, dépenses, administration (utilisateurs, paramètres, guide)",
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
        "En tant que directeur, vous êtes le seul à pouvoir supprimer définitivement : utilisateurs, produits, approvisionnements, tables, serveuses, fiches de paie, fonctions salariales, et certaines sessions de caisse.",
        "Avant toute suppression, vérifiez l'impact sur l'historique (ventes liées, stocks, rapports, comptabilité).",
      ],
      tips: [
        "Privilégiez la désactivation d'un produit ou d'une cuisinière plutôt que la suppression si l'historique compte.",
        "Effectuez régulièrement un export analytique ou comptable PDF pour archivage.",
      ],
    },
  ],
};

const menusSection: GuideSection = {
  id: "menus",
  title: "Menus (module Cuisine)",
  subsections: [
    {
      title: "Référentiel des menus",
      paragraphs: [
        "Chaque menu représente un plat ou formule proposé en cuisine. Il comporte un nom, une photo (obligatoire), un prix de vente en FCFA et un statut actif/inactif.",
        "Seuls les menus actifs sont proposés lors de la création d'une commande cuisine.",
      ],
    },
    {
      title: "Créer et modifier un menu",
      steps: [
        "Passez dans le module Cuisine, puis ouvrez « Menus ».",
        "Cliquez sur « Nouveau menu » : renseignez le nom, téléversez la photo et indiquez le prix.",
        "Enregistrez : le menu est disponible pour les commandes.",
        "Pour modifier ou désactiver un menu existant, utilisez les actions sur la ligne correspondante.",
      ],
      tips: [
        "Une photo de qualité facilite l'identification du plat lors de la prise de commande.",
      ],
    },
  ],
};

const cooksSection: GuideSection = {
  id: "cooks",
  title: "Cuisinières (module Cuisine)",
  subsections: [
    {
      title: "Fiche cuisinière",
      paragraphs: [
        "Chaque cuisinière est identifiée par son prénom, son nom et son numéro de téléphone (obligatoire). Une photo et un mode de paiement (espèces ou mobile money) peuvent être renseignés.",
        "Le diplôme n'est pas demandé à la création : il peut être complété ultérieurement en modification de la fiche.",
      ],
    },
    {
      title: "Activer et désactiver",
      paragraphs: [
        "Une cuisinière inactive n'apparaît plus dans l'assistant de création de commande cuisine. Son historique de commandes reste consultable.",
        "Utilisez le bouton « Activer » / « Désactiver » sur la liste pour gérer son statut sans supprimer ses données.",
      ],
      steps: [
        "Module Cuisine → « Cuisinières ».",
        "« Ajouter » pour créer une nouvelle fiche (prénom, nom, téléphone, photo).",
        "Cliquez sur l'icône œil pour consulter le détail et l'historique des commandes.",
        "« Désactiver » une cuisinière qui ne travaille plus temporairement ou définitivement.",
      ],
      tips: [
        "Vérifiez qu'au moins une cuisinière active est disponible avant le service cuisine.",
      ],
    },
  ],
};

const kitchenPlatesSection: GuideSection = {
  id: "kitchen-plates",
  title: "Plaquettes (module Cuisine)",
  subsections: [
    {
      title: "Principe",
      paragraphs: [
        "Les plaquettes sont les supports physiques (plateaux) utilisés pour identifier une commande en cuisine, de la même manière que les tables pour le bar.",
        "Chaque plaquette possède un numéro unique. Une plaquette ne peut pas être associée à deux commandes en attente simultanément.",
      ],
    },
    {
      title: "Gestion",
      steps: [
        "Module Cuisine → « Plaquettes ».",
        "Créez une plaquette en saisissant son numéro.",
        "Lors d'une commande cuisine, sélectionnez la plaquette libre correspondant au service.",
      ],
    },
  ],
};

const kitchenOrdersSection: GuideSection = {
  id: "kitchen",
  title: "Commandes cuisine (module Cuisine)",
  subsections: [
    {
      title: "Prérequis",
      paragraphs: [
        "Une session de caisse cuisine doit être ouverte avant de pouvoir créer une commande. Sans session ouverte, le bouton de création est indisponible.",
      ],
    },
    {
      title: "Créer une commande (assistant en 4 étapes)",
      steps: [
        "Étape 1 — Menus : sélectionnez un ou plusieurs menus et leurs quantités.",
        "Étape 2 — Cuisinière : choisissez la cuisinière qui prépare la commande (seules les cuisinières actives sont listées).",
        "Étape 3 — Plaquette : sélectionnez une plaquette disponible.",
        "Étape 4 — Validation : vérifiez le récapitulatif (menus, quantités, cuisinière, plaquette, total) puis confirmez.",
        "La commande est créée avec le statut « En attente ».",
      ],
    },
    {
      title: "Cycle de vie",
      paragraphs: [
        "En attente : la commande peut être modifiée (menus, quantités, cuisinière, plaquette) ou annulée.",
        "Clôturée : la commande a été encaissée (espèces ou mobile money) ; elle n'est plus modifiable.",
        "Annulée : la commande en attente a été annulée ; la plaquette est libérée.",
      ],
    },
    {
      title: "Détail, clôture et reçu",
      steps: [
        "Depuis la liste, ouvrez le détail d'une commande pour voir toutes les informations et les actions disponibles.",
        "Pour clôturer : saisissez le montant reçu (≥ total), choisissez le mode de paiement et gérez la monnaie si besoin.",
        "Une fois clôturée, vous pouvez prévisualiser et télécharger le reçu PDF depuis la fiche détail.",
      ],
      tips: [
        "Le détail d'une commande cuisine reprend la même logique que le détail d'une vente bar (actions, reçu, historique).",
      ],
    },
  ],
};

const kitchenCashSection: GuideSection = {
  id: "kitchen-cash",
  title: "Caisse cuisine (module Cuisine)",
  subsections: [
    {
      title: "Sessions indépendantes",
      paragraphs: [
        "La caisse cuisine fonctionne comme la caisse bar, mais elle ne concerne que les commandes repas. Les deux caisses sont totalement indépendantes.",
      ],
    },
    {
      title: "Ouvrir, suivre et clôturer",
      steps: [
        "Module Cuisine → « Caisse cuisine ».",
        "Si aucune session n'est ouverte, cliquez sur « Ouvrir une session » et saisissez le fond de caisse initial.",
        "Pendant la session, les commandes cuisine clôturées alimentent le suivi de la caisse.",
        "En fin de service, clôturez la session et indiquez si le fond de caisse a été repris physiquement.",
        "« Rouvrir » permet de réactiver une session clôturée récente si aucune autre n'est ouverte.",
        "« Exporter PDF » génère un rapport de session cuisine.",
      ],
      tips: [
        "Ouvrez la caisse cuisine avant de prendre la première commande repas de la journée.",
      ],
    },
  ],
};

const accountingSection: GuideSection = {
  id: "accounting",
  title: "Comptabilité (module Comptabilité)",
  subsections: [
    {
      title: "Objectif",
      paragraphs: [
        "La page Comptabilité offre une vue consolidée de la trésorerie de l'établissement : solde de départ, entrées (approvisionnements enregistrés), sorties (dépenses) et solde de fin sur la période choisie.",
        "C'est le point d'entrée du module Comptabilité pour le gérant et la direction.",
      ],
    },
    {
      title: "Onglets du module",
      paragraphs: [
        "Le menu du module Comptabilité inclut : Comptabilité (situation financière), Fonctions, Catégories, Modes de paiement, Paie et Dépenses.",
        "Fonctions est réservée à la direction ; le gérant peut consulter la situation et gérer les catégories et modes de paiement des dépenses.",
      ],
    },
    {
      title: "Fonctions — salaires de référence",
      paragraphs: [
        "Définissez le salaire associé à chaque type de personnel (serveuse, serveuse-cuisinière, cuisinière, gérant(e)) avant de créer des fiches de paie.",
        "Ce montant sert de base automatique lors de la création d'une fiche ; il n'est pas modifiable sur la fiche elle-même.",
      ],
      steps: [
        "Module Comptabilité → menu « Fonctions ».",
        "Choisissez le type de personnel et saisissez le salaire mensuel de référence.",
        "Enregistrez : le salaire sera prérempli sur les futures fiches de ce type.",
      ],
    },
    {
      title: "Catégories et modes de paiement",
      paragraphs: [
        "Les pages « Catégories » et « Modes de paiement » du menu permettent d'enrichir les listes déroulantes des dépenses (aucune catégorie fixe imposée à l'installation).",
        "Créez les libellés dont vous avez besoin avant ou pendant la saisie des dépenses.",
      ],
    },
    {
      title: "Solde à l'ouverture",
      paragraphs: [
        "Un seul solde d'ouverture est défini pour l'établissement (montant de trésorerie de référence au démarrage du suivi).",
        "La direction peut le créer ou le modifier ; le gérant peut le consulter.",
      ],
      steps: [
        "Module Comptabilité → « Comptabilité ».",
        "Cliquez sur « Solde à l'ouverture » (ou « Modifier le solde » si déjà défini).",
        "Saisissez le montant, la date de référence et une note optionnelle, puis validez.",
      ],
    },
    {
      title: "Filtres et journal",
      paragraphs: [
        "Trois modes de période sont disponibles : plage personnalisée (de telle date à telle date), mois donné, ou année complète.",
        "Le journal liste chronologiquement les mouvements : approvisionnements (entrées de stock valorisées) et dépenses (sorties de caisse).",
        "Des cartes de synthèse affichent le solde de départ, le total des entrées, le total des dépenses et le solde de fin.",
      ],
    },
    {
      title: "Export PDF",
      paragraphs: [
        "Le bouton « Exporter PDF » génère un rapport de situation comptable pour la période affichée, utile pour l'archivage ou les réunions de pilotage.",
      ],
      tips: [
        "Après chaque dépense ou approvisionnement, la situation comptable se met à jour automatiquement.",
      ],
    },
  ],
};

const payrollSection: GuideSection = {
  id: "payroll",
  title: "Paie (module Comptabilité)",
  subsections: [
    {
      title: "Accès et objectif",
      paragraphs: [
        "La gestion des fiches de paie est réservée à la direction (directeur et directrice). Elle permet de verser et tracer les salaires des serveuses, cuisinières et gérant(e).",
      ],
    },
    {
      title: "Fonctions — salaires de référence",
      paragraphs: [
        "Les salaires de référence par type de personnel sont configurés dans le menu Comptabilité → « Fonctions » (voir la section Comptabilité du guide).",
      ],
    },
    {
      title: "Créer une fiche de paie",
      steps: [
        "Module Comptabilité → « Paie » → « Nouvelle fiche ».",
        "Choisissez le type de personnel et le bénéficiaire.",
        "Indiquez la période couverte (du … au …) et la date de paiement.",
        "Le salaire de la fonction s'affiche en lecture seule.",
        "Cochez « Ajouter un bonus » si un complément est versé : saisissez le nom et le montant de chaque bonus (vous pouvez en ajouter plusieurs).",
        "Le net versé (salaire + total des bonus) est calculé automatiquement.",
        "Ajoutez un commentaire et/ou un justificatif si besoin, puis enregistrez.",
      ],
      tips: [
        "Le salaire de base provient de Comptabilité → Fonctions : pour le modifier, mettez à jour la fonction correspondante.",
      ],
    },
    {
      title: "Aperçu, impression et modification",
      paragraphs: [
        "Chaque fiche dispose d'une page d'aperçu accessible via l'icône œil dans la liste.",
        "Le document affiche le bénéficiaire, la période, le salaire, le détail de chaque bonus et le net versé. Le mode de paiement indiqué est « En espèces ».",
        "Vous pouvez imprimer ou télécharger la fiche au format PDF depuis cette page.",
        "Pour modifier une fiche existante, cliquez sur le crayon : les bonus déjà enregistrés sont rechargés et modifiables.",
      ],
    },
    {
      title: "Suppression",
      paragraphs: [
        "La suppression définitive d'une fiche de paie est réservée au directeur.",
      ],
    },
  ],
};

const expensesSection: GuideSection = {
  id: "expenses",
  title: "Dépenses (module Comptabilité)",
  subsections: [
    {
      title: "Enregistrer une dépense",
      paragraphs: [
        "Les dépenses générales de l'établissement (électricité, entretien, courses, etc.) sont saisies ici. Elles impactent la situation comptable affichée dans Comptabilité.",
      ],
      steps: [
        "Module Comptabilité → « Dépenses ».",
        "Cliquez sur « Nouvelle dépense ».",
        "Renseignez le libellé, la catégorie, le montant, la date, le mode de paiement, un commentaire et un justificatif optionnel.",
        "Validez : la dépense apparaît dans la liste et dans le journal comptable.",
      ],
    },
    {
      title: "Catégories et modes de paiement",
      paragraphs: [
        "Les catégories et modes de paiement sont gérés dans le menu Comptabilité → « Catégories » et « Modes de paiement » (voir la section Comptabilité du guide).",
      ],
    },
    {
      title: "Consultation et droits",
      paragraphs: [
        "La liste affiche le total des dépenses et permet de filtrer, modifier ou supprimer (suppression réservée au directeur pour les dépenses).",
        "Le gérant peut créer et consulter les dépenses ; la direction peut en outre les modifier et les supprimer.",
      ],
      tips: [
        "Joignez un justificatif (photo ou PDF) pour faciliter les contrôles ultérieurs.",
      ],
    },
  ],
};

const cuisineWorkflowSection: GuideSection = {
  id: "cuisine-workflow",
  title: "Enchaînement type — service cuisine",
  subsections: [
    {
      title: "Avant le service",
      steps: [
        "Passez dans le module Cuisine.",
        "Ouvrez une session de caisse cuisine avec le fond de caisse réel.",
        "Vérifiez que les menus actifs et les cuisinières actives sont à jour (référentiels gérés par la direction).",
      ],
    },
    {
      title: "Pendant le service",
      steps: [
        "Créez les commandes via l'assistant (menus → cuisinière → plaquette → validation).",
        "Modifiez les commandes en attente si le client change sa commande.",
        "Clôturez chaque commande au moment du paiement.",
      ],
    },
    {
      title: "Fin de service",
      steps: [
        "Vérifiez qu'il ne reste pas de commandes en attente non voulues.",
        "Clôturez la session de caisse cuisine.",
      ],
    },
  ],
};

const paieWorkflowSection: GuideSection = {
  id: "paie-workflow",
  title: "Enchaînement type — suivi paie et dépenses",
  subsections: [
    {
      title: "Mise en place (direction)",
      steps: [
        "Définir le solde à l'ouverture dans Comptabilité.",
        "Configurer les salaires de référence dans le menu Fonctions.",
        "Créer les catégories et modes de paiement des dépenses si nécessaire.",
      ],
    },
    {
      title: "Suivi courant",
      steps: [
        "Enregistrer chaque dépense dès qu'elle est effectuée.",
        "Consulter régulièrement la Comptabilité pour suivre le solde.",
        "Émettre les fiches de paie en fin de période (salaire + bonus éventuels).",
        "Archiver les PDF des fiches de paie et des rapports comptables.",
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
    menusSection,
    cooksSection,
    kitchenPlatesSection,
    kitchenOrdersSection,
    kitchenCashSection,
    accountingSection,
    payrollSection,
    expensesSection,
    paieWorkflowSection,
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
    menusSection,
    cooksSection,
    kitchenPlatesSection,
    kitchenOrdersSection,
    kitchenCashSection,
    accountingSection,
    payrollSection,
    expensesSection,
    paieWorkflowSection,
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
            "Vous gérez le quotidien sur tous les modules : bar, cuisine, comptabilité (situation financière, fiches de paie, dépenses), administration (utilisateurs, paramètres).",
          ],
        },
        {
          title: "Restrictions",
          paragraphs: [
            "Certaines suppressions définitives sont réservées au directeur (produits, utilisateurs, tables, serveuses, fiches de paie, fonctions salariales, suppression de sessions caisse selon l'écran).",
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
    kitchenOrdersSection,
    kitchenCashSection,
    menusSection,
    profileSection,
    {
      id: "workflow",
      title: "Enchaînement type d'une journée",
      subsections: [
        {
          title: "Matin — ouverture bar",
          steps: [
            "Module Bar : consultez le tableau de bord (stocks faibles, activité).",
            "Ouvrez une session de caisse bar avec le fond de caisse réel.",
            "Enregistrez les approvisionnements du jour (livraisons reçues).",
          ],
        },
        {
          title: "Service bar",
          steps: [
            "Créez les ventes via « Nouvelle vente » (serveuse + tables + produits).",
            "Modifiez les commandes en attente si le client change sa commande.",
            "Clôturez chaque vente au moment du paiement.",
          ],
        },
        {
          title: "Service cuisine",
          steps: [
            "Passez au module Cuisine et ouvrez la caisse cuisine si ce n'est pas déjà fait.",
            "Prenez les commandes repas (menus, plaquette).",
            "Clôturez les commandes cuisine au paiement.",
          ],
        },
        {
          title: "Fin de journée",
          steps: [
            "Fermez les sessions de caisse bar et cuisine avec les montants réels.",
            "Vérifiez que toutes les ventes et commandes en attente ont été traitées.",
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
