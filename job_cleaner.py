import os
import re
import json
import csv

dir_path = os.path.dirname(os.path.realpath(__file__))
data_dir_path = os.path.join(dir_path, 'data')
fiches_file = os.path.join(data_dir_path, 'fiches.json')
cleaned_fiches_file = os.path.join(data_dir_path, 'cleaned_fiches.json')
table_file = os.path.join(data_dir_path, 'table.csv')

features = ("Centre(s) d'intérêt", "Secteur(s) professionnel(s)", "Niveau d'acc\u00e8s", "Statut(s)",
            "Salaire d\u00e9butant")
secteurs_pros = ("Agriculture", "Agro-alimentaire", "Architecture - BTP", "Armée - Sécurité", "Arts du spectacle - Audiovisuel", "Audit - Conseil - Ressources humaines", "Automobile", "Banque - Assurances -  Immobilier", "Bois - Meubles - Papier - Carton", "Chimie - Plasturgie - Industrie pharmaceutique", "Commerce - Distribution", "Communication - Publicité", "Construction navale, ferroviaire et aéronautique", "Culture - Patrimoine - Artisanat d'art", "Droit - Justice", "Electronique - Electrotechnique", "Energies et extraction", "Enseignement - Formations", "Environnement", "Fonction publique", "Hôtellerie - Restauration", "Informatique", "Maintenance - Entretien", "Mécanique - Métallurgie", "Mode et industrie textile", "Presse - Edition - imprimerie", "Recherche", "Santé - Social - Bien-être", "Sport - Loisirs - Tourisme", "Télécommunications", "Transport - Logistique", "Verre - Béton - Céramique")
centres_d_interets = ("Enquêter, analyser l'information, je veux en faire mon travail", "J'ai la bosse du commerce", "J'ai le sens du contact", "J'aime bouger", "J'aime faire des expériences", "J'aime jongler avec les chiffres", "J'aime la nature", "J'aime le contact avec les enfants", "J'aime les sensations fortes", "J'aime organiser, gérer", "J'aimerais informer, communiquer", "J'aimerais travailler dehors", "Je rêve d'un métier artistique", "Je rêve de travailler à l'étranger", "Je suis branché high tech", "Je suis fort en langues", "Je veux être aux commandes", "Je veux être utile aux autres", "Je veux faire respecter la loi", "Je veux m'occuper d'animaux", "Je veux protéger la planète", "Je veux travailler de mes mains", "Le sport est ma passion", "Ma vocation est de soigner", "Réparer, bricoler, j'adore ça")


def get_unique_features(fiches):
    values = {}
    for i, (job, fiche) in enumerate(fiches.items()):
        for f in features:
            if f not in values:
                values[f] = []
            if f in fiche:
                c = fiche[f]
                if isinstance(c, str):
                    if c not in values[f]:
                        values[f].append(c)
                else:
                    for cc in c:
                        if cc not in values[f]:
                            values[f].append(cc)

    # for f, v in values.items():
    #     print("#"*100)
    #     print(f)
    #     print(len(v))
    #     for c in sorted(v):
    #         print(c)

    return values

def get_and_clean_fiches(fiches):
    filtered_fiches = {}
    for job, fiche in fiches.items():
        fiche = fiche['fiche']
        filtered_fiches[job] = fiche

    # repair features
    res = {}
    for job, fiche in filtered_fiches.items():
        res[job] = {}
        for feature, datas in fiche.items():
            cleaned_datas = []

            # repair secteur pro
            if feature == features[1]:
                datas = ' - '.join(datas)
                datas = datas.split(',')
                for d in datas:
                    if d == 'Banque - Assurances -Immobilier':
                        d = 'Banque - Assurances -  Immobilier'
                    if d == 'Construction navale':
                        d = 'Construction navale, ferroviaire et a\u00e9ronautique'
                    if d == ' ferroviaire et a\u00e9ronautique':
                        continue
                    if d == 'multisecteurs':
                        continue
                    cleaned_datas.append(d)
                    if d not in secteurs_pros:
                        raise Exception('Unknown secteur')

            # repair centres d'interet
            elif feature == features[0]:
                for d in datas:
                    if d == 'Enquêter':
                        d = 'Enquêter, analyser l\'information, je veux en faire mon travail'
                    if d == 'Réparer':
                        d = 'Réparer, bricoler, j\'adore ça'
                    if d == 'J\'aimerais informer':
                        d = 'J\'aimerais informer, communiquer'
                    if d == 'J\'aime organiser':
                        d = 'J\'aime organiser, gérer'
                    if d in ('analyser l\'information', 'je veux en faire mon travail', 'bricoler', 'j\'adore ça',
                             'communiquer', 'gérer'):
                        continue
                    cleaned_datas.append(d)
                    if d not in centres_d_interets:
                        raise Exception('Unknown centres d\'intérêt {centre}'.format(centre=d))

            # repair status
            elif feature == features[3]:
                cleaned_datas = datas.split(',')

            # repair salaire
            elif feature == features[4]:
                datas = datas.replace('\u00a0', '')
                pattern = r"(?P<salaire>[0-9]+) euros"
                match = re.match(pattern, datas)
                if match is None:
                    if 'Smic' in datas:
                        cleaned_datas = str(1466.62)
                    else:
                        pattern = r"([0-9]+)"
                        match = re.findall(pattern, datas)
                        if len(match) != 0:
                            match = list(map(lambda x: int(x), match))
                            cleaned_datas = str(sum(match)/len(match))
                        elif job == '\u00e9ducateur sportif / \u00e9ducatrice sportive':
                            cleaned_datas = str((1466.62 + 1700) / 2)  # http://www.cidj.com/article-metier/educateur-sportif-educatrice-sportive
                        else:
                            raise Exception('unknown salaire')
                else:
                    cleaned_datas = match.group('salaire')

            # rest is ok
            else:
                cleaned_datas = datas

            res[job][feature] = cleaned_datas

    values = get_unique_features(res)

    return res


def sort_jobs(jobs):
    res = [jobs[0]]
    jobs_list = sorted([line[0] for line in jobs[1:]], key=lambda x: x.replace('é', 'e'))
    for j in jobs_list:
        for line in jobs:
            if j == line[0]:
                res.append(line)
                break
    return res


def create_table(fiches):
    res = []
    cols = get_unique_features(fiches)
    columns = ['Métier']
    for f in features:
        if f == features[-1]:  # salaire
            columns.append(f)
        else:
            columns += cols[f]
    res.append(columns)

    for job, fiche in fiches.items():
        line = [job]
        for c in columns[1:]:
            if c == features[-1]:  # salaire
                if c in fiche:
                    line.append(fiche[c])
                else:
                    line.append('null')
            else:
                check = False
                for f, v in fiche.items():
                    # print(c, v)
                    if c in v:
                        check = True
                        break
                # print(check)
                if check:
                    line.append(1)
                else:
                    line.append(0)
        # print(line)
        res.append(line)
    res = sort_jobs(res)
    return res


if __name__ == '__main__':
    # recover datas
    with open(fiches_file, 'r') as f:
        fiches = json.load(f)

    res = get_and_clean_fiches(fiches)

    # save fiches
    with open(cleaned_fiches_file, 'w') as f:
        json.dump(res, f, indent=4)

    res = create_table(res)

    # save table
    with open(table_file, 'w') as f:
        writer = csv.writer(f)
        writer.writerows(res)
