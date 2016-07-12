import os
import re
import json
from urllib import request


alphabet = 'abcdefghijklmnopqrstuvwz'  # it seems no x or y job exists.. (xylophoniste?)
dir_path = os.path.dirname(os.path.realpath(__file__))
data_dir_path = os.path.join(dir_path, 'data')
jobs_list_dir = os.path.join(data_dir_path, 'jobs_list')
if not os.path.exists(data_dir_path):
    os.mkdir(data_dir_path)
if not os.path.exists(jobs_list_dir):
    os.mkdir(jobs_list_dir)


def find_job_and_link(raw_job):
    # two cases: direct links and indirect
    # exemples:
    # DIRECT <a href="http://www.onisep.fr/Ressources/Univers-Metier/Metiers/glaciologue">glaciologue</a>
    # INDIRECT gestionnaire réseaux(voir <a href="http://www.onisep.fr/Ressources/Univers-Metier/Metiers/administrateur-administratrice-reseaux">administrateur / administratrice réseaux</a>)

    pattern = r"<a href=\"(?P<link>.+)\">(?P<name>.+)<\/a>"
    match = re.match(pattern, raw_job)  # match only matches the beginning of the str, while search scan all str
    # print(raw_job, match)
    if match is not None:  # means it's a direct link
        # print(match.group('name'), match.group('link'))
        return match.group('name'), match.group('link')
    else:  # means it's a indirect
        return None  # I suppose we are not interested in those
        # we can parse like this:
        # pattern = r"(?P<name>.+)(voir <a href=\"(?P<link>.)\">(?P<linked_name>.+)<\/li>"
        # match = re.search(pattern, raw_job)
        # if match is None:  # unknown case!
        #     raise ValueError('Unknown case for a job: {}'.format(raw_job))


def parse_jobs(page):
    parsed_jobs = []
    raw_jobs = page.split("<ul class=\"oni_list_oddEven oni_margin_l20 oni_margin_r10\">")[1].split("</ul>")[0]
    raw_jobs = raw_jobs.replace('\t', '')

    pattern = r"<li class=\"oni_(odd|even)\">(?P<name>.+)<\/li>"
    while True:
        match = re.search(pattern, raw_jobs)
        if match is None:
            break
        job = match.group('name')
        raw_jobs = raw_jobs.split(str(job))[1:]
        if isinstance(raw_jobs, list):
            raw_jobs = str(job).join(raw_jobs)

        job = find_job_and_link(job)
        if job is not None:
            parsed_jobs.append(job)
    return parsed_jobs


def fetch_pages(first_letter):
    first_letter = first_letter.lower()
    if first_letter not in alphabet:
        raise ValueError(first_letter + ' is not a letter')

    for l in alphabet[alphabet.find(first_letter):]:
        letter_dir_path = os.path.join(jobs_list_dir, l)
        if not os.path.exists(letter_dir_path):
            os.mkdir(letter_dir_path)

        offset = 0
        while True:
            url = 'http://www.onisep.fr/recherche/metiers/{letter}/%28offset%29/{offset}'\
                .format(letter=l.upper(), offset=offset)
            print('GET '+url)
            offset += 40
            page = request.urlopen(url).read().decode('utf-8')
            file = os.path.join(letter_dir_path, str(offset) + '.html')
            with open(file, 'w') as f:
                f.write(page)

            jobs = parse_jobs(page)

            jobs_path = os.path.join(data_dir_path, 'jobs.json')
            if os.path.exists(jobs_path):
                with open(jobs_path, 'r') as f:
                    registered_jobs = json.load(f)
            else:
                registered_jobs = []
            for j in jobs:
                if list(j) not in registered_jobs:
                    print('new entry: {entry}'.format(entry=[0]))
                    print('NOW: {count} entries'.format(count=len(registered_jobs)))
                    registered_jobs.append(j)

            with open(jobs_path, 'w') as f:
                f.write(json.dumps(registered_jobs, indent=4))

            if len(jobs) == 0:
                break


if __name__ == '__main__':
    FIRST_LETTER = 'a'
    fetch_pages(FIRST_LETTER)
