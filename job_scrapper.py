import os
import json
from urllib import request
from bs4 import BeautifulSoup


dir_path = os.path.dirname(os.path.realpath(__file__))
data_dir_path = os.path.join(dir_path, 'data')
fiches_dir_path = os.path.join(data_dir_path, 'fiches')
if not os.path.exists(data_dir_path):
    os.mkdir(data_dir_path)
if not os.path.exists(fiches_dir_path):
    os.mkdir(fiches_dir_path)

    def handle_starttag(self, tag, attrs):
        if ('class', 'oni_chapo') in attrs:
            self._getting_chapo = True
        if ('class', 'oni_last') in attrs:
            self._getting_fiche = True

        if ('id', 'oni_onglet-1') in attrs:
            self._getting_onglet = True
            self._current_onglet = 1
            self.reset_onglet()
        if ('id', 'oni_onglet-2') in attrs:
            self._getting_onglet = True
            self._current_onglet = 2
            self.reset_onglet()
        if ('id', 'oni_onglet-3') in attrs:
            self._getting_onglet = True
            self._current_onglet = 3
            self.reset_onglet()
        if ('id', 'oni_onglet-4') in attrs:
            self._getting_onglet = True
            self._current_onglet = 4
            self.reset_onglet()
        if ('id', 'oni_onglet-5') in attrs:
            self._getting_onglet = True
            self._current_onglet = 5
            self.reset_onglet()
        if ('id', 'oni_onglet-6') in attrs:
            self._getting_onglet = True
            self._current_onglet = 6
            self.reset_onglet()

        if self._getting_fiche and tag == 'li':
            self._is_new_li = True

        self._current_tag.append(tag)

    def handle_endtag(self, tag):
        self._current_tag.pop(-1)
        if self._getting_fiche and tag == 'ul':
            self._getting_fiche = False
        if self._getting_fiche and self._is_new_li:
            self._is_new_li = False

    def handle_data(self, data):
        data = data.strip()
        if self._getting_chapo:
            self.chapo = data
            self._getting_chapo = False
        if self._getting_fiche:
            if self._is_new_li:
                data = data.strip(':').strip()
                self._current_fiche_li = data
            elif self._current_fiche_li is not None:
                data = data.strip(':').strip().strip(',')
                if data != '':
                    if self._current_fiche_li in self.fiche:
                        if isinstance(self.fiche[self._current_fiche_li], list):
                            self.fiche[self._current_fiche_li].append(data)
                        else:
                            self.fiche[self._current_fiche_li] = [self.fiche[self._current_fiche_li], data]
                    else:
                        self.fiche[self._current_fiche_li] = data
        if self._getting_onglet:
            if self._current_tag[-1] == 'h3':
                self.onglets[self._current_onglet][data] = {}
                self._current_onglet_paragraph = data
                self._current_onglet_subparagraph = None
            if self._current_tag[-1] == 'h5':
                self._additional_datas = data
            if self._current_tag[-1] == 'h4':
                self._current_onglet_subparagraph = data
            if self._current_tag[-1] == 'p':
                if self._additional_datas is not None:
                    data = [self._additional_datas, data]
                    self._additional_datas = None
                if self._current_onglet_paragraph is None and self._current_onglet_subparagraph:
                    self._current_onglet_paragraph = self._current_onglet_subparagraph
                    self._current_onglet_subparagraph = None
                    self.onglets[self._current_onglet][self._current_onglet_paragraph] = {}
                if self._current_onglet_subparagraph:
                    if self._current_onglet_subparagraph in self.onglets[self._current_onglet][self._current_onglet_paragraph]:
                        if isinstance(self.onglets[self._current_onglet][self._current_onglet_paragraph][self._current_onglet_subparagraph], list):
                            if isinstance(data, list):
                                self.onglets[self._current_onglet][self._current_onglet_paragraph][self._current_onglet_subparagraph] += data
                            else:
                                self.onglets[self._current_onglet][self._current_onglet_paragraph][self._current_onglet_subparagraph].append(data)
                        else:
                            self.onglets[self._current_onglet][self._current_onglet_paragraph][self._current_onglet_subparagraph] = data
                    else:
                        self.onglets[self._current_onglet][self._current_onglet_paragraph][self._current_onglet_subparagraph] = data
                else:
                    if isinstance(self.onglets[self._current_onglet][self._current_onglet_paragraph], dict):
                        self.onglets[self._current_onglet][self._current_onglet_paragraph] = [data]
                    else:
                        self.onglets[self._current_onglet][self._current_onglet_paragraph].append(data)
            if self._current_tag[-1] == 'a':
                if isinstance(self.onglets[self._current_onglet][self._current_onglet_paragraph], list):
                    self.onglets[self._current_onglet][self._current_onglet_paragraph].append(data)
                else:
                    if self._current_onglet_subparagraph in self.onglets[self._current_onglet][self._current_onglet_paragraph]:
                        if isinstance(self.onglets[self._current_onglet][self._current_onglet_paragraph][self._current_onglet_subparagraph], list):
                            self.onglets[self._current_onglet][self._current_onglet_paragraph][self._current_onglet_subparagraph].append(data)
                        else:
                            self.onglets[self._current_onglet][self._current_onglet_paragraph][self._current_onglet_subparagraph] = [data]
                    else:
                        self.onglets[self._current_onglet][self._current_onglet_paragraph][self._current_onglet_subparagraph] = [data]


def get_jobs_list():
    jobs_file_path = os.path.join(data_dir_path, 'jobs.json')
    with open(jobs_file_path, 'r', encoding='utf8') as f:
        return json.load(f)


def parse_job_page(name, link):
    print('GET '+link)
    page = request.urlopen(link).read().decode('utf-8')

    page = page.replace('€', 'euros')  # because encode/decode error
    page = page.replace(u"\u2019", "'")  # because encode/decode error
    page = page.replace(u"\u2026", "é")  # because encode/decode error
    page = page.replace(u"\u0153", "oe")  # because encode/decode error

    page = page.replace('\n', '')  # remove new line
    page = page.replace('  ', '')  # remove big spaces (to be more human readable)
    file = os.path.join(fiches_dir_path, name.replace('/', '-').replace(' ', '_') + '.html')
    with open(file, 'w', encoding='utf8') as f:
        f.write(page)

    soup = BeautifulSoup(page, 'html.parser')
    chapo = soup.find(name='div', attrs={'class': 'oni_chapo'}).find(name='p').get_text()

    fiche_ul = soup.find(name='ul', attrs={'class': 'oni_last'}).find_all(name='li')
    fiche = {}
    for f in fiche_ul:
        feature = f.find(name='span').get_text()
        value = f.get_text().split(feature)[1].strip()
        if 'synonymes' in feature.lower():
            value = value.split(', ')
        if 'métiers associés' in feature.lower():
            value = value.split(',')
        if 'secteur' in feature.lower():
            value = value.split(' - ')
        elif 'centre' in feature.lower():
            value = value.split(',')
        feature = feature.strip().strip(':').strip().strip(',')
        if isinstance(value, list):
            value = [v.strip() for v in value]
        fiche[feature] = value

    onglets = {}
    for o in range(1, 7):
        onglet = soup.find(name='div', attrs={'id': 'oni_onglet-' + str(o)})
        if onglet is None:
            continue
        else:
            onglet_name = onglet.h2.extract().get_text()

            content = {}
            paragraph = None
            subparagraph = None
            additional_data = None
            for element in onglet.find_all():
                if element.name == 'h3':
                    paragraph = element.get_text()
                    subparagraph = None

                elif element.name == 'h4':
                    subparagraph = element.get_text()
                    if paragraph is not None:
                        if paragraph not in content:
                            content[paragraph] = {}
                    else:
                        paragraph = subparagraph
                        content[paragraph] = {}

                elif element.name == 'h5':
                    additional_data = element.get_text()

                elif element.name in ('p', 'a'):
                    element_content = element.get_text().strip()

                    if len(element.find_all()) != 0:  # sometimes an additional <p> appear
                        continue
                    if element_content == '':
                        continue

                    if subparagraph is not None:
                        if subparagraph in content[paragraph]:
                            content[paragraph][subparagraph].append(element_content)
                        else:
                            if additional_data is not None:
                                content[paragraph][subparagraph] = [additional_data, element_content]
                                additional_data = None
                            else:
                                content[paragraph][subparagraph] = [element_content]
                    else:
                        if paragraph in content:
                            content[paragraph].append(element_content)
                        else:
                            if additional_data is not None:
                                content[paragraph] = [element_content]
                                additional_data = None
                            else:
                                content[paragraph] = [element_content]

                            # par ex, pour http://www.onisep.fr/Ressources/Univers-Metier/Metiers/accessoiriste
                            # todo: les resources utiles dans "en savoir plus" sont en liste et pas en dict
                            # todo: ul li pas parsé dans "accès au métier"

            onglets[onglet_name] = content

    return chapo, fiche, onglets


if __name__ == '__main__':
    fiches_path = os.path.join(data_dir_path, 'fiches.json')
    fail_path = os.path.join(data_dir_path, 'fails.json')
    if os.path.exists(fiches_path):
        with open(fiches_path, 'r', encoding='utf8') as f:
            JOBS_N_BEGIN = len(json.load(f))
    else:
        JOBS_N_BEGIN = 0

    jobs = get_jobs_list()
    for j, l in jobs[JOBS_N_BEGIN:]:
        if os.path.exists(fiches_path):
            with open(fiches_path, 'r', encoding='utf8') as f:
                fiches = json.load(f)
        else:
            fiches = {}
        if j not in fiches:
            try:
                chapo, fiche, onglets = parse_job_page(j, l)
            except Exception as err:
                # raise err
                print(err)
                if os.path.exists(fail_path):
                    with open(fail_path, 'r', encoding='utf8') as f:
                        fails = json.load(f)
                else:
                    fails = []
                fails.append(j)
                with open(fail_path, 'w', encoding='utf8') as f:
                    json.dump(fails, f, indent=4)
                print('fail:', j)
            else:
                fiches[j] = {'chapo': chapo, 'fiche': fiche, 'onglets': onglets}
                print('new entry: {entry}'.format(entry=j))
                print('NOW: {count} entries'.format(count=len(fiches)))

            with open(fiches_path, 'w', encoding='utf8') as f:
                f.write(json.dumps(fiches, indent=4))
