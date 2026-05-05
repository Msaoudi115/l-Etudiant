import secrets
import logging
import uuid
from database import db
from models import now_iso

logger = logging.getLogger(__name__)

HALLS_SEED = [
    {"id": "i", "label": "Ingénierie & Numérique", "color": "#1A237E"},
    {"id": "c", "label": "Commerce & Marketing", "color": "#E3000B"},
    {"id": "s", "label": "Santé & Universités", "color": "#6D28D9"},
    {"id": "a", "label": "Arts & Tourisme", "color": "#db2777"},
    {"id": "k", "label": "Orientation & Prépa", "color": "#047857"},
]

# Filières → hall mapping (used for D3 pertinence + recommendations)
FILIERE_TO_HALL = {
    "Ingénierie": "i",
    "Numérique": "i",
    "Commerce": "c",
    "Sciences Po": "s",
    "Santé": "s",
    "Arts": "a",
    "Droit": "s",
}

# Filières considered premium (D4 commercial value bonus)
PREMIUM_FILIERES = {"Commerce", "Ingénierie", "Sciences Po", "Numérique"}

DEMO_QR_STUDENT_ID = "demo-lucas"
DEMO_QR_BOOTHS = [
    {"school_id": "s2", "label": "Albert School booth"},
    {"school_id": "s4", "label": "EPITA booth"},
    {"school_id": "s100", "label": "Mines booth"},
]

SCHOOLS_SEED = [
    # Ingénierie & Numérique (26)
    {"id": "s1",  "hall_id": "i", "name": "89 — École Supérieure du Numérique", "type": "Informatique & Numérique · Paris", "initials": "89"},
    {"id": "s2",  "hall_id": "i", "name": "Albert School / Mines Paris - PSL", "type": "Ingénieurs & Management · Paris", "initials": "AS"},
    {"id": "s100", "hall_id": "i", "name": "Mines Paris - PSL", "type": "Grande ecole d'ingenieurs - Paris", "initials": "MP"},
    {"id": "s3",  "hall_id": "i", "name": "CESI École d'Ingénieurs", "type": "École d'ingénieurs · Multi-sites", "initials": "CE"},
    {"id": "s4",  "hall_id": "i", "name": "Concours Advance (EPITA·ESME·IPSA)", "type": "Concours ingénieurs post-bac · Paris", "initials": "CA"},
    {"id": "s5",  "hall_id": "i", "name": "EEMI", "type": "Métiers du digital · Paris", "initials": "EE"},
    {"id": "s6",  "hall_id": "i", "name": "EFREI — Digital & Management", "type": "École ingénieurs numérique · Villejuif", "initials": "EF"},
    {"id": "s7",  "hall_id": "i", "name": "Efrei Panthéon-Assas Université", "type": "École ingénieurs · Villejuif", "initials": "EU"},
    {"id": "s8",  "hall_id": "i", "name": "EFRITS", "type": "École de la Tech · Paris", "initials": "ER"},
    {"id": "s9",  "hall_id": "i", "name": "EIGSI", "type": "Ingénieurs généralistes · La Rochelle", "initials": "EI"},
    {"id": "s10", "hall_id": "i", "name": "EPITECH", "type": "Informatique · Paris & Multi-sites", "initials": "ET"},
    {"id": "s11", "hall_id": "i", "name": "EPF Engineering School", "type": "École d'ingénieurs · Sceaux", "initials": "EP"},
    {"id": "s12", "hall_id": "i", "name": "ESIEA", "type": "Ingénieurs numérique · Paris", "initials": "EA"},
    {"id": "s13", "hall_id": "i", "name": "ESIGELEC", "type": "Ingénieurs généraliste · Rouen", "initials": "EG"},
    {"id": "s14", "hall_id": "i", "name": "ESITC Paris", "type": "Ingénieurs construction · Marne-la-Vallée", "initials": "EC"},
    {"id": "s15", "hall_id": "i", "name": "ESME", "type": "Ingénieurs généraliste · Paris", "initials": "SM"},
    {"id": "s16", "hall_id": "i", "name": "ESTACA — ISAE", "type": "Ingénieurs · Levallois-Perret", "initials": "EX"},
    {"id": "s17", "hall_id": "i", "name": "ESTP", "type": "Grande école ingénieurs · Cachan", "initials": "ST"},
    {"id": "s18", "hall_id": "i", "name": "Gaming Campus", "type": "Métiers du jeu vidéo · Paris", "initials": "GC"},
    {"id": "s19", "hall_id": "i", "name": "Guardia Cybersecurity School", "type": "Cybersécurité · Paris", "initials": "GU"},
    {"id": "s20", "hall_id": "i", "name": "IESF", "type": "Ingénieurs & Scientifiques de France", "initials": "IF"},
    {"id": "s21", "hall_id": "i", "name": "IIM", "type": "Numérique · Paris La Défense", "initials": "II"},
    {"id": "s22", "hall_id": "i", "name": "ISEP", "type": "Ingénieurs numérique · Paris", "initials": "IS"},
    {"id": "s23", "hall_id": "i", "name": "ISEL", "type": "École d'ingénieurs · Le Havre", "initials": "IL"},
    {"id": "s24", "hall_id": "i", "name": "SUPINFO", "type": "Informatique · Paris & Multi-sites", "initials": "SU"},
    {"id": "s25", "hall_id": "i", "name": "UniLaSalle", "type": "Ingénieurs · Rouen / Paris", "initials": "UL"},
    {"id": "s26", "hall_id": "i", "name": "École Polytechnique", "type": "Grande école · Palaiseau", "initials": "X"},

    # Commerce & Marketing (26)
    {"id": "s27", "hall_id": "c", "name": "Audencia", "type": "Grande école de commerce · Nantes", "initials": "AU"},
    {"id": "s28", "hall_id": "c", "name": "Concours Sésame", "type": "Concours écoles commerce post-bac", "initials": "CS"},
    {"id": "s29", "hall_id": "c", "name": "EDHEC Business School", "type": "Grande école · Lille / Nice", "initials": "ED"},
    {"id": "s30", "hall_id": "c", "name": "EFAP / ICART / EFJ", "type": "Communication & Journalisme · Paris", "initials": "EJ"},
    {"id": "s31", "hall_id": "c", "name": "EMLV", "type": "École de commerce · Paris La Défense", "initials": "EM"},
    {"id": "s32", "hall_id": "c", "name": "ESG Paris", "type": "École de commerce · Paris", "initials": "ES"},
    {"id": "s33", "hall_id": "c", "name": "European Business School", "type": "École de commerce · Paris", "initials": "EB"},
    {"id": "s34", "hall_id": "c", "name": "Excelia", "type": "École de commerce · La Rochelle / Tours", "initials": "EL"},
    {"id": "s35", "hall_id": "c", "name": "ICN Business School", "type": "École de commerce · Nancy", "initials": "IC"},
    {"id": "s36", "hall_id": "c", "name": "ICS Bégué", "type": "Gestion / Finance · Paris", "initials": "IB"},
    {"id": "s37", "hall_id": "c", "name": "Igensia RH", "type": "Management RH · Paris", "initials": "IG"},
    {"id": "s38", "hall_id": "c", "name": "Institut Assur Formation", "type": "Assurance & Finance · Paris", "initials": "IA"},
    {"id": "s39", "hall_id": "c", "name": "IMT Business School", "type": "École de commerce · Évry", "initials": "IM"},
    {"id": "s40", "hall_id": "c", "name": "IPAG Business School", "type": "École de commerce · Paris / Nice", "initials": "IP"},
    {"id": "s41", "hall_id": "c", "name": "ISC Paris", "type": "École de commerce · Paris", "initials": "SC"},
    {"id": "s42", "hall_id": "c", "name": "ISCOM", "type": "Communication & Publicité · Paris", "initials": "IO"},
    {"id": "s43", "hall_id": "c", "name": "ISEFAC Événementiel", "type": "Communication & Événementiel · Paris", "initials": "IE"},
    {"id": "s44", "hall_id": "c", "name": "ISEG Paris", "type": "Marketing & Communication · Paris", "initials": "IK"},
    {"id": "s45", "hall_id": "c", "name": "ISG International Business School", "type": "École de commerce · Paris", "initials": "IR"},
    {"id": "s46", "hall_id": "c", "name": "ISG Luxury Program", "type": "Commerce du luxe · Paris", "initials": "IX"},
    {"id": "s47", "hall_id": "c", "name": "ISG Sport Business Management", "type": "Sport Business · Paris", "initials": "IZ"},
    {"id": "s48", "hall_id": "c", "name": "ISTEC Business School", "type": "École de commerce · Paris", "initials": "IT"},
    {"id": "s49", "hall_id": "c", "name": "IÉSEG School of Management", "type": "Grande école · Lille / Paris", "initials": "IÉ"},
    {"id": "s50", "hall_id": "c", "name": "NEOMA Business School", "type": "Grande école · Reims / Rouen", "initials": "NE"},
    {"id": "s51", "hall_id": "c", "name": "Promotrans", "type": "Logistique & Transport · Paris", "initials": "PT"},
    {"id": "s52", "hall_id": "c", "name": "France Supply Chain", "type": "Supply Chain & Logistique · Paris", "initials": "FS"},

    # Santé & Universités (19)
    {"id": "s53", "hall_id": "s", "name": "ANEMF", "type": "Étudiants en médecine · National", "initials": "AN"},
    {"id": "s54", "hall_id": "s", "name": "Antémed Epsilon", "type": "Prépa PASS / LAS · Paris", "initials": "AE"},
    {"id": "s55", "hall_id": "s", "name": "Assoc. Étudiants en Pharmacie", "type": "Pharmacie · National", "initials": "PH"},
    {"id": "s56", "hall_id": "s", "name": "Assoc. Étudiants Sages-Femmes", "type": "Maïeutique · National", "initials": "SF"},
    {"id": "s57", "hall_id": "s", "name": "CPCM", "type": "Prépa santé PASS LAS · Paris", "initials": "CP"},
    {"id": "s58", "hall_id": "s", "name": "Diploma Santé", "type": "Santé & Paramédical · Paris", "initials": "DS"},
    {"id": "s59", "hall_id": "s", "name": "EO Paris", "type": "Ostéopathie · Paris", "initials": "EO"},
    {"id": "s60", "hall_id": "s", "name": "ESP — Psychologie Européenne", "type": "Psychologie · Paris", "initials": "PS"},
    {"id": "s61", "hall_id": "s", "name": "Faculté Médecine — Strasbourg", "type": "Médecine & Maïeutique · Strasbourg", "initials": "FM"},
    {"id": "s62", "hall_id": "s", "name": "FNEK", "type": "Kinésithérapie · National", "initials": "FK"},
    {"id": "s63", "hall_id": "s", "name": "IFEC Chiropraxie", "type": "Chiropraxie · Paris", "initials": "IF"},
    {"id": "s64", "hall_id": "s", "name": "Le Gall Conseil", "type": "Études de santé en Europe · Paris", "initials": "LG"},
    {"id": "s65", "hall_id": "s", "name": "Médisup Paris", "type": "Prépa études de santé · Paris", "initials": "MS"},
    {"id": "s66", "hall_id": "s", "name": "UNAFORIS", "type": "Social & Paramédical · Paris", "initials": "UA"},
    {"id": "s67", "hall_id": "s", "name": "Collège de Droit — Sorbonne", "type": "Université · Droit · Paris", "initials": "CD"},
    {"id": "s68", "hall_id": "s", "name": "EFLV — Pôle Léonard de Vinci", "type": "Université · Paris La Défense", "initials": "EV"},
    {"id": "s69", "hall_id": "s", "name": "IUT de Villetaneuse", "type": "IUT · Villetaneuse", "initials": "IV"},
    {"id": "s70", "hall_id": "s", "name": "ORACLE — 14 Universités IDF", "type": "Universités Île-de-France", "initials": "OR"},
    {"id": "s71", "hall_id": "s", "name": "Université Catholique de Lille", "type": "Université catholique · Lille", "initials": "UC"},

    # Arts & Tourisme (9)
    {"id": "s72", "hall_id": "a", "name": "Autograf Design", "type": "Art & Design · Paris", "initials": "AG"},
    {"id": "s73", "hall_id": "a", "name": "E-Artsup", "type": "Design & Industries créatives · Paris", "initials": "AR"},
    {"id": "s74", "hall_id": "a", "name": "EMC", "type": "Cinéma · 3D · Animation · VFX · Paris", "initials": "EC"},
    {"id": "s75", "hall_id": "a", "name": "ESDMA", "type": "Art / Design / Audiovisuel · Montpellier", "initials": "ED"},
    {"id": "s76", "hall_id": "a", "name": "Orélia School", "type": "Art & Design · Paris", "initials": "OL"},
    {"id": "s77", "hall_id": "a", "name": "EPMT", "type": "Hôtellerie · Restauration · Paris", "initials": "EP"},
    {"id": "s78", "hall_id": "a", "name": "Eugenia School", "type": "Tourisme & Hôtellerie · Paris", "initials": "EU"},
    {"id": "s79", "hall_id": "a", "name": "Ferrières Hospitality & Luxury", "type": "Hôtellerie & Luxe · Ferrières-en-Brie", "initials": "FE"},
    {"id": "s80", "hall_id": "a", "name": "Vatel", "type": "Hôtellerie & Tourisme · Paris", "initials": "VA"},

    # Orientation & Prépa (19)
    {"id": "s81", "hall_id": "k", "name": "APECITA", "type": "Orientation agricole & environnement", "initials": "AP"},
    {"id": "s82", "hall_id": "k", "name": "APEL de l'Essonne", "type": "Orientation / Parents · Essonne", "initials": "AL"},
    {"id": "s83", "hall_id": "k", "name": "Armée de Terre", "type": "Armées & Défense · National", "initials": "AT"},
    {"id": "s84", "hall_id": "k", "name": "CFA Trajectoire", "type": "Apprentissage · Île-de-France", "initials": "CT"},
    {"id": "s85", "hall_id": "k", "name": "Gendarmerie Nationale", "type": "Armées & Défense · National", "initials": "GN"},
    {"id": "s86", "hall_id": "k", "name": "Gen' Club", "type": "Vie étudiante & Orientation · Paris", "initials": "GE"},
    {"id": "s87", "hall_id": "k", "name": "Groupe Aurlom", "type": "Prépa concours & examens · Paris", "initials": "GA"},
    {"id": "s88", "hall_id": "k", "name": "Groupe Ipésup", "type": "Prépa concours · Paris", "initials": "GI"},
    {"id": "s89", "hall_id": "k", "name": "Jai20enMaths", "type": "Prépa maths · En ligne / Paris", "initials": "JM"},
    {"id": "s90", "hall_id": "k", "name": "Lycée de Cachan", "type": "Prépa concours · Cachan", "initials": "LC"},
    {"id": "s91", "hall_id": "k", "name": "Marine Nationale", "type": "Armées & Défense · National", "initials": "MN"},
    {"id": "s92", "hall_id": "k", "name": "Mission Grande École", "type": "Conseil orientation · Paris", "initials": "MG"},
    {"id": "s93", "hall_id": "k", "name": "OPCO Atlas", "type": "Formation professionnelle · Paris", "initials": "OA"},
    {"id": "s94", "hall_id": "k", "name": "Police Nationale", "type": "Armées & Défense · National", "initials": "PN"},
    {"id": "s95", "hall_id": "k", "name": "Prépa Prévision", "type": "Prépa concours · Paris", "initials": "PP"},
    {"id": "s96", "hall_id": "k", "name": "Prépa Concours Proodos", "type": "Prépa concours · Paris", "initials": "PC"},
    {"id": "s97", "hall_id": "k", "name": "Terraskola", "type": "Prépa concours · Paris", "initials": "TK"},
    {"id": "s98", "hall_id": "k", "name": "TonAvenir", "type": "Conseil en orientation · Paris", "initials": "TV"},
    {"id": "s99", "hall_id": "k", "name": "Youth ID", "type": "Vie étudiante & Orientation · Paris", "initials": "YI"},
]


async def seed_database():
    # Schools — re-seed if count doesn't match (handles schema updates)
    school_count = await db.schools.count_documents({})
    if school_count != len(SCHOOLS_SEED):
        await db.schools.delete_many({})
        docs = []
        for s in SCHOOLS_SEED:
            doc = {**s, "qr_token": f"STAND-{s['id'].upper()}-{secrets.token_hex(3).upper()}"}
            docs.append(doc)
        await db.schools.insert_many(docs)
        logger.info(f"Seeded {len(docs)} schools (was {school_count})")

    # Demo class
    if await db.classes.count_documents({"code": "PROF2026"}) == 0:
        await db.classes.insert_one({
            "id": str(uuid.uuid4()),
            "code": "PROF2026",
            "teacher_name": "M. Bernard",
            "school_name": "Lycée Henri-IV · Terminale S3",
            "created_at": now_iso(),
        })
        logger.info("Seeded demo class PROF2026")

    # Demo student: Lucas
    if await db.students.count_documents({"id": "demo-lucas"}) == 0:
        lucas = {
            "id": "demo-lucas",
            "serial": "SAL-2026-04721",
            "name": "Lucas Martin",
            "emoji": "🎓",
            "classe": "Terminale générale",
            "filieres": ["Ingénierie", "Numérique"],
            "formation": ["École d'ingénieurs"],
            "nat": "FRANÇAISE",
            "dob_short": "12/03/2008",
            "sex": "M",
            "lieu": "Paris (75)",
            "expire": "15/04/2031",
            "consents": {"l": True, "d": True, "c": True, "e": False},
            "class_code": "PROF2026",
            "is_demo": True,
            "is_anonymous": False,
            "scan_exposant": True,
            "email_opened": True,
            "clicked_reco": True,
            "returned_site": False,
            "created_at": now_iso(),
        }
        await db.students.insert_one(lucas)
        # Lucas's stamps with new IDs
        lucas_stamps = ["s1", "s6", "s10", "c2"]
        for sid in lucas_stamps:
            sc = await db.schools.find_one({"id": sid}, {"_id": 0})
            if not sc:
                continue
            await db.stamps.insert_one({
                "id": str(uuid.uuid4()),
                "student_id": "demo-lucas",
                "school_id": sc["id"],
                "hall_id": sc["hall_id"],
                "school_name": sc["name"],
                "time_label": f"{14 + secrets.randbelow(4)}h{str(secrets.randbelow(60)).zfill(2)}",
                "timestamp": now_iso(),
            })

    # Demo student: Théo (anonyme)
    if await db.students.count_documents({"id": "demo-theo"}) == 0:
        theo = {
            "id": "demo-theo",
            "serial": "—",
            "name": "Théo",
            "emoji": "👥",
            "classe": "—",
            "filieres": [],
            "formation": [],
            "nat": "—",
            "dob_short": "—",
            "sex": "—",
            "lieu": "—",
            "expire": "—",
            "consents": {"l": False, "d": False, "c": False, "e": False},
            "class_code": None,
            "is_demo": True,
            "is_anonymous": True,
            "created_at": now_iso(),
        }
        await db.students.insert_one(theo)

    # Second demo class for leaderboard
    if await db.classes.count_documents({"code": "PROF2026B"}) == 0:
        await db.classes.insert_one({
            "id": str(uuid.uuid4()),
            "code": "PROF2026B",
            "teacher_name": "Mme Durand",
            "school_name": "Lycée Louis-le-Grand · Terminale S1",
            "created_at": now_iso(),
        })

    # Rich seed students (for vivid analytics + leaderboard on first launch)
    fixtures = [
        # class PROF2026 (Henri-IV)
        {"id": "demo-emma", "name": "Emma Lefebvre", "emoji": "🧑‍🎓", "classe": "Terminale générale",
         "filieres": ["Commerce", "Droit"], "formation": ["Grande École", "IEP"],
         "consents": {"l": True, "d": True, "c": False, "e": True},
         "class_code": "PROF2026",
         "stamps": ["s15", "s16", "s17", "c1"],
         "scan_exposant": True, "email_opened": True, "clicked_reco": False, "returned_site": False},
        {"id": "demo-nadia", "name": "Nadia Rahmani", "emoji": "👩‍🎓", "classe": "Terminale générale",
         "filieres": ["Santé", "Sciences Po"], "formation": ["Université", "IEP"],
         "consents": {"l": True, "d": True, "c": True, "e": False},
         "class_code": "PROF2026",
         "stamps": ["s23", "s30", "c1", "c4"],
         "scan_exposant": True, "email_opened": True, "clicked_reco": True, "returned_site": False},
        {"id": "demo-hugo", "name": "Hugo Lambert", "emoji": "👨‍🎓", "classe": "Terminale générale",
         "filieres": ["Ingénierie", "Numérique"], "formation": ["École d'ingénieurs"],
         "consents": {"l": True, "d": False, "c": False, "e": False},
         "class_code": "PROF2026",
         "stamps": ["s1", "s11"],
         "scan_exposant": False, "email_opened": False, "clicked_reco": False, "returned_site": False},
        # class PROF2026B (Louis-le-Grand)
        {"id": "demo-sarah", "name": "Sarah Mercier", "emoji": "👩", "classe": "Terminale générale",
         "filieres": ["Ingénierie", "Numérique"], "formation": ["École d'ingénieurs", "Prépa CPGE"],
         "consents": {"l": True, "d": True, "c": True, "e": True},
         "class_code": "PROF2026B",
         "stamps": ["s1", "s2", "s3", "s4", "s11", "s12", "c1", "c2"],
         "scan_exposant": True, "email_opened": True, "clicked_reco": True, "returned_site": True},
        {"id": "demo-malik", "name": "Malik Benali", "emoji": "😎", "classe": "Terminale générale",
         "filieres": ["Commerce"], "formation": ["Grande École"],
         "consents": {"l": True, "d": True, "c": True, "e": False},
         "class_code": "PROF2026B",
         "stamps": ["s15", "s16", "s17", "s19", "c3"],
         "scan_exposant": True, "email_opened": True, "clicked_reco": False, "returned_site": True},
        {"id": "demo-lea", "name": "Léa Dupont", "emoji": "🤓", "classe": "Terminale générale",
         "filieres": ["Arts"], "formation": ["Université"],
         "consents": {"l": True, "d": False, "c": False, "e": False},
         "class_code": "PROF2026B",
         "stamps": ["s31"],
         "scan_exposant": False, "email_opened": False, "clicked_reco": False, "returned_site": False},
    ]

    for f in fixtures:
        if await db.students.count_documents({"id": f["id"]}) > 0:
            continue
        student_doc = {
            "id": f["id"],
            "serial": f"SAL-2026-{secrets.randbelow(90000) + 10000}",
            "name": f["name"],
            "emoji": f["emoji"],
            "classe": f["classe"],
            "filieres": f["filieres"],
            "formation": f["formation"],
            "nat": "FRANÇAISE",
            "dob_short": "—",
            "sex": "—",
            "lieu": "—",
            "expire": "15/04/2031",
            "consents": f["consents"],
            "class_code": f["class_code"],
            "is_demo": True,
            "is_anonymous": False,
            "scan_exposant": f.get("scan_exposant", False),
            "email_opened": f.get("email_opened", False),
            "clicked_reco": f.get("clicked_reco", False),
            "returned_site": f.get("returned_site", False),
            "created_at": now_iso(),
        }
        await db.students.insert_one(student_doc)
        # seed stamps
        for sid in f["stamps"]:
            sc = await db.schools.find_one({"id": sid}, {"_id": 0})
            if not sc:
                continue
            await db.stamps.insert_one({
                "id": str(uuid.uuid4()),
                "student_id": f["id"],
                "school_id": sc["id"],
                "hall_id": sc["hall_id"],
                "school_name": sc["name"],
                "time_label": f"{14 + secrets.randbelow(4)}h{str(secrets.randbelow(60)).zfill(2)}",
                "timestamp": now_iso(),
            })
