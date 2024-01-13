import csv, json, sys
from xml.dom import minidom

fieldMap = {
    'Class': 'class',
    'Max Power': 'power',
    'Main Thrust': 'thrust',
    'Maneuver Thrust': 'mthrust',
    'Hull': 'hull',
    'Mass': 'mass',
    'Health': 'health',
    'Cost': 'value',
    'Crew Capacity': 'crew',
    'Shield Max': 'shield',
    'Regen Rate': 'regen',
    'Power Generated': 'power',
    'Repair Rate': 'regen',
    'Range': 'range',
    'Hull Dmg': 'hullDmg',
    'Shield Dmg': 'shieldDmg',
    'EM Dmg': 'emDmg',
    'Fire Rate': 'rof',
    'Cargo': 'cargo',
    'Jump Thrust': 'jump',
    'Grav Jump Fuel': 'fuel',
    'Crew Stations': 'crew',
    'Pax Slots': 'passengers',
    'Lander Thrust': 'landing',
    'Vendors': 'vendors',
    'Char Level': 'level',
    'Required Skill': 'design',
}

currentType = None
columns = []
parts = {}
for row in csv.reader(open('partlist.csv', 'r')):
    if not row[0] or row[0] == 'Part Type':
        continue
    partType = row[0]
    if partType != currentType:
        currentType = partType
        columns = row[2:]
        continue
    rawPart = dict(zip(columns, row[2:]))
    part = {}
    name = row[1]
    for rawKey, value in rawPart.items():
        if rawKey not in fieldMap:
            continue
        key = fieldMap[rawKey]
        numVal = value.replace(',', '').replace('%', '').replace('Ship Design ', '').replace('Level ', '')
        if value == '' or numVal == '0':
            continue
        elif numVal.isnumeric():
            part[key] = int(numVal)
        elif numVal.replace('.', '').isnumeric():
            part[key] = float(numVal)
        elif key == 'vendors':
            part[key] = value.split(', ')
        elif key != 'design':
            part[key] = value
    if rawPart.get('Shielded') == 'Yes':
        part['shielded'] = part['cargo']
    if 'class' in part:
        if part['class'] == 'B':
            part['piloting'] = 3
        elif part['class'] == 'C':
            part['piloting'] = 4
    storeTypes = [currentType]
    if currentType == 'Hab Module':
        habTypes = name.split(' ')[-1]
        if 'x' in habTypes:
            habTypes = habTypes.split('/')
        else:
            habTypes = ['1x1']
        storeTypes = []
        for habType in habTypes:
            habType = 'Hab %s' % habType
            storeTypes.append(habType)
    elif currentType == 'Weapon':
        storeTypes = [rawPart['Weapon Type']]
    for storeType in storeTypes:
        if storeType not in parts:
            parts[storeType] = {}
        lastWord = name.split(' ')[-1]
        if '/' in lastWord and 'x' in lastWord:
            parts[storeType][name.replace(lastWord, storeType.split(' ')[-1])] = part
        else:
            parts[storeType][name] = part

parts['Structural'] = {}
moreItems = json.load(open('more_items.json', 'r'))
for partType, addParts in moreItems.items():
    for name, part in addParts.items():
        parts[partType][name] = part

print('{')
for partType, partList in parts.items():
    if not len(partList):
        continue
    print(' "%s": {' % partType)
    items = list(partList.items())
    items.sort()
    for name, part in items:
        if name == items[-1][0]:
            print('  "%s": %s' % (name, json.dumps(part)))
        else:
            print('  "%s": %s,' % (name, json.dumps(part)))
    if partType == 'Structural':
        print(' }')
    else:
        print(' },')
print('}')
