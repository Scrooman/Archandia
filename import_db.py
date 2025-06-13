import psycopg2
import csv
import os

conn = psycopg2.connect(
    dbname=os.getenv("PGDATABASE"),
    user=os.getenv("PGUSER"),
    password=os.getenv("PGPASSWORD"),
    host=os.getenv("PGHOST"),
    port=os.getenv("PGPORT", "5432")
)
cursor = conn.cursor()

def clean_row(row):
    # Zamień puste stringi na None
    return {k: (v if v != "" else None) for k, v in row.items()}

with open('items_database.csv', newline='', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    for i, row in enumerate(reader, 1):
        row = clean_row(row)
        cursor.execute("""
            INSERT INTO items_database (id, itemId, itemTypeKindId, name, imageLink, image_source, itemRarityTypeId, colorId, bound, chantraBagItem, EventItem, questLink, questName, "class", durability, fortuneGate, requiredLvl, additional_stats, description, skills, itemTypeId, weaponTypeId, armorTypeId, armorRaceTypeId, accessoryTypeId, potionTypeId, prayerStoneTypeId, elementalStoneTypeId, productionMaterialTypeId, heroicSetTypeId, stack, physicalDefense, physicalDefenceRate, waterDefence, airDefence, magicDefence, fireDefence, earthDefence, heroicDefence, blockRate, physicalAttackRate, attackSpeed, attackRange, minDamage, maxDamage, randomAbilitiesNumber, bonusHp, hpRecovered, manaRecovered, mountRunBuff)
            VALUES (%(id)s, %(itemId)s, %(itemTypeKindId)s, %(name)s, %(imageLink)s, %(image_source)s, %(itemRarityTypeId)s, %(colorId)s, %(bound)s, %(chantraBagItem)s, %(EventItem)s, %(questLink)s, %(questName)s, %(class)s, %(durability)s, %(fortuneGate)s, %(requiredLvl)s, %(additional_stats)s, %(description)s, %(skills)s, %(itemTypeId)s, %(weaponTypeId)s, %(armorTypeId)s, %(armorRaceTypeId)s, %(accessoryTypeId)s, %(potionTypeId)s, %(prayerStoneTypeId)s, %(elementalStoneTypeId)s, %(productionMaterialTypeId)s, %(heroicSetTypeId)s, %(stack)s, %(physicalDefense)s, %(physicalDefenceRate)s, %(waterDefence)s, %(airDefence)s, %(magicDefence)s, %(fireDefence)s, %(earthDefence)s, %(heroicDefence)s, %(blockRate)s, %(physicalAttackRate)s, %(attackSpeed)s, %(attackRange)s, %(minDamage)s, %(maxDamage)s, %(randomAbilitiesNumber)s, %(bonusHp)s, %(hpRecovered)s, %(manaRecovered)s, %(mountRunBuff)s)
        """, row)
        if i % 1000 == 0:
            print(f"Wstawiono {i} wierszy")
conn.commit()
conn.close()