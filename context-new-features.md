Cahier des charges — Nouvelles fonctionnalités Cuisine & Paie / Dépenses

1. Contexte
L’application gère aujourd’hui le bar : produits, approvisionnements, ventes de salle (serveuses + tables), session de caisse, analytiques.
Deux modules sont demandés :
1.	Module Cuisine — prise de commandes repas (menus / cuisinières / plaquettes), avec session de caisse dédiée.
2.	Module Paie & Dépenses — suivi de la rémunération des cuisinières et serveuses, et des dépenses générales de l’entreprise.

2. Objectifs
Objectif	Description
Séparer bar et cuisine	Flux de commande cuisine distinct du flux ventes bar existant, mais coordonné par le Gérant
Traçabilité	Qui a préparé, qui a servi, quel menu, quelle plaquette, quel montant
Alignement UX	Même logique que les ventes : création → modification, désactivation,  / annulation → clôture
Caisse cuisine	Session de caisse propre au circuit cuisine
Pilotage trésorerie	Suivi paie (Superviseur, cuisinières, Gérant (e), serveuses) et dépenses de caisse


3. Périmètre
Inclus
•	Gestion des référentiels : Menus, Cuisinières, Plaquettes
•	Commandes cuisine (création, modification, désactivation, annulation, clôture)
•	Session de caisse cuisine
•	Gestion de la paie (Superviseur, cuisinières , Gérant (e) et serveuses)
•	Gestion des dépenses générales de caisse

Partie A — Module Cuisine
A.1. Pages référentielles (préalables)
A.1.1. Menus
Champ	Obligatoire	Description
Nom	Oui	Libellé du menu
Photo	Oui*	Image du menu (*à confirmer : obligatoire ou optionnelle)
Prix	Oui	Prix de vente en FCFA
Fonctions : liste, création, modification, suppression / désactivation, consultation.
A.1.2. Cuisinières
Champ	Obligatoire	Description
Nom	Oui	Nom de famille
Prénom	Oui	Prénom
Téléphone	Oui*	Contact (*à confirmer : obligatoire ou optionnel, comme les serveuses)
Diplôme		A saisir dans les paramètres
Fonctions : liste, création, modification, suppression / désactivation, historique des commandes associées (souhaitable).

A.1.3. Plaquettes
Champ	Obligatoire	Description
Numéro	Oui	Identifiant unique de la plaquette
Fonctions : liste, création, modification, suppression.
Règle proposée : une plaquette ne peut pas être associée à deux commandes en attente en même temps (équivalent « table occupée » côté bar).

A.2. Page Cuisine — Commandes
A.2.1. Parcours de création (wizard)
Prérequis : une session de caisse cuisine doit être ouverte.
Étapes proposées :
1.	Menus — sélection d’un ou plusieurs menus (+ quantités)
2.	Cuisinière — sélection de la cuisinière concernée (associer sa photo)
3.	Plaquette — sélection de la plaquette associée
4.	Validation — récapitulatif (menus, quantités, cuisinière, plaquette, total) → création de la commande en statut En attente

A.2.2. Cycle de vie d’une commande cuisine
Statut	Signification
En attente (PENDING)	Commande ouverte, modifiable / annulable
Clôturée (COMPLETED)	Payée / finalisée, non modifiable
Annulée (CANCELLED)	Annulation d’une commande en attente
A.2.3. Modification
Tant que la commande est En attente : modification possible des menus (et quantités), de la cuisinière et de la plaquette.

A.2.4. Annulation
Tant que la commande n’est pas clôturée : annulation possible (selon droits — même logique que les ventes bar : rôles direction).

A.2.5. Clôture
Même principe que les ventes bar :
•	Montant payé ≥ total de la commande
•	Mode de paiement : Espèces (CASH) ou Mobile Money
•	Gestion de la monnaie (remise immédiate ou à récupérer, avec délai rappelé sur le reçu si applicable)
•	Passage au statut Clôturée

A.2.6. Liste & détail
•	Liste des commandes cuisine (filtres / stats : CA, en attente, clôturées)
•	Fiche détail + actions (modifier / annuler / clôturer)
•	Reçu / export PDF (aligné sur les ventes bar) — à confirmer

A.3. Session de caisse cuisine
Fonctionnement miroir de la caisse bar, mais dédié au circuit cuisine :
Action	Description
Ouvrir	Saisie d’un fond de caisse ; une seule session ouverte à la fois
Suivre	Synthèse des commandes cuisine clôturées sur la période de la session
Clôturer	Clôture avec confirmation de reprise du fond de caisse
Rouvrir	Rouverture de la dernière session (si aucune autre n’est ouverte ou dans le cas de l’oubli de l’enregistrement d’une commande) ; NB Prévoir jusqu’au lendemain soir la possibilité de relancer la session de la veille pour y apporter d’éventuels enregistrements.
Exporter	Rapport PDF de session (selon droits)
Règle : impossible de créer une nouvelle commande cuisine si aucune session cuisine n’est ouverte.
Important : caisse bar et caisse cuisine sont indépendantes.

A.4. Navigation proposée (Cuisine)
Page	Contenu
Menus	Référentiel menus
Cuisinières	Référentiel cuisinières
Plaquettes	Référentiel plaquettes
Cuisine	Liste + création / suivi des commandes
Caisse cuisine	Sessions de caisse cuisine
Droits d’accès : à aligner sur le modèle actuel (directeur / directrice / gérant) — à valider.

Partie B — Module Paie & Dépenses
B.1. Objectif
Suivre :
•	la paie des cuisinières et des serveuses (employés) ;
•	les dépenses générales sortant de la caisse de l’entreprise.

B.2. Gestion de la paie
B.2.1. Personnes concernées
•	Serveuses (déjà présentes dans l’application)
•	Cuisinières (nouveau référentiel cuisine)
•	Gérant (e) 
•	Superviseur
B.2.2. Génération de la paie de salaire (proposition)
1)	Référencement des professions/fonctions
2)	Paramétrage du salaire de chaque professions/fonctions
3)	Affectation de professions/fonctions aux employés (chaque employé lors de son enregistrement dans la base doit déjà indiquer son mode de paiement)
4)	Génération des salaires ou de la paie
Champ	Description
Bénéficiaire	Superviseur ou Gerant, ou Serveuse ou cuisinière
Type de personnel	Superviseur / Gérant / Serveuse / Cuisinière
Période	Ex. du … au …, ou mois concerné
Montant	Montant versé (FCFA)
Date de paiement	Date du versement
Mode de paiement	Espèces / Mobile Money (à confirmer)
Commentaire	Optionnel, Prévoir le commentaire
Justificatif	Photo / fichier (optionnel — à confirmer)  confirmé
Fonctions : liste, création, modification, suppression (selon droits), filtres par personne / période.

B.2.3. Vues utiles (proposées)
•	Historique de paie par personne/profession/fonction
•	Total versé sur une période
•	Synthèse mensuelle
B.3. Dépenses générales de caisse
B.3.1. Enregistrement d’une dépense (proposition)
Champ	Description	
Libellé / motif	Ex. électricité, courses, entretien et maintenance du site (taches de menuiserie, de soudure, de dépannage electricité, - Dépenses liées à l’achat de l’eau du forage)…	
Catégorie	Liste de catégories (à définir avec le client)	Prévoir une table afin d’en compléter à tout moment
Montant	FCFA	
Date	Date de la dépense	NB : Il peut arriver que la dépense initialement prévue soit reportée (exemple : le cas d’une maintenance à effectuer par le menuisier)
Mode de paiement	Espèces / Mobile Money/Virement	Prévoir une table afin d’en compléter à tout moment
Caisse impactée	Caisse bar / Caisse cuisine / Caisse générale (à confirmer)	
Commentaire	Optionnel	
Justificatif	Optionnel	
Fonctions : liste, création, modification, suppression (selon droits), filtres par catégorie / période / caisse.

Une caisse centrale fédérant les deux autres caisses existantes et c'est de cette caisse que doit sortir les dépenses. Cette caisse totalise le montant des autres caisses 
Pour le mode de paiment de la paie il faut juste marquer "En espèces" sur la fiche de paie téléchargeable en PDF.
Le numéro de téléphone de la cuisinière est obligatoire
La photo du menu est obligatoire.
Pour l'accès à la cuusine les mems droits d'accès sont maintenus. 
Pas de catgeorie de dépenses fixe d'abord.
Le détail d'une commande doit se présenter comme le détail d'une vente avec presque toutes les memes fonctionnalités. 