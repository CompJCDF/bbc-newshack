import csv

inputfile = open('data.csv', 'rU')
csv_reader = csv.DictReader(inputfile)

inputfilebis = open('candidates.csv', 'rU')
csv_readerbis = csv.DictReader(inputfilebis)

pconlist = []
idlist = []

def addToList(self, str_to_add):
    if str_to_add not in self:
        self.append(str_to_add)

for row in csv_reader:
	mpPcon = row['pcon13cd']
	pconlist.append(mpPcon)

print pconlist

for row in csv_readerbis:
	mpPcon = row['gss_code']
	mpId = row['mapit_id']
	for item in pconlist:
		if mpPcon == item:
			addToList(idlist, mpId)

for item in idlist:
	print item
