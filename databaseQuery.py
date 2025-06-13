import sqlite3
import psycopg2
import random
import string
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'Archandia_db.db')

def generate_random_item_id(length=12):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=length))

def insert_inventory_slots(db_path, character_id, tab_id, slot_start, slot_end):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    for slot_index in range(slot_start, slot_end + 1):
        item_id = generate_random_item_id()
        try:
            cursor.execute("""
                INSERT INTO character_inventory_slots (character_id, tab_id, slot_index, item_id)
                VALUES (%s, %s, %s, %s)
            """, (character_id, tab_id, slot_index, item_id))
        except sqlite3.IntegrityError as e:
            print(f"Error inserting slot {slot_index}: {e}")
    conn.commit()
    conn.close()

# Usage example:
#insert_inventory_slots(DB_PATH, '1', 1, 0, 24)


def insert_crafting_requirements_database(db_path, item_id, requiredtoCraftItemId, item_amount=None):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO crafting_requirements_database (itemId, itemNeededId, itemAmount)
            VALUES (%s, %s, %s)
        """, (item_id, requiredtoCraftItemId, item_amount))
    except sqlite3.IntegrityError as e:
        print(f"Error inserting crafting requirements: {e}")
    conn.commit()
    conn.close()


insert_crafting_requirements_database(DB_PATH, 3281, 3281, 1)
insert_crafting_requirements_database(DB_PATH, 3281, 266, 1)
insert_crafting_requirements_database(DB_PATH, 3281, 262, 1)
insert_crafting_requirements_database(DB_PATH, 3281, 258, 1)
insert_crafting_requirements_database(DB_PATH, 3281, 2118, 1)
insert_crafting_requirements_database(DB_PATH, 3281, 4802, 5000)



def insert_craftable_items_database_table(db_path, item_id, item_name, item_type_kind_id, item_rarity_type_id, item_category):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO craftable_items_database (itemId, itemName, itemTypeKindId, itemRarityTypeId, itemCategory)
            VALUES (%s, %s, %s, %s, %s)
        """, (item_id, item_name, item_type_kind_id, item_rarity_type_id, item_category))
    except sqlite3.IntegrityError as e:
        print(f"Error inserting craftable items: {e}")
    conn.commit()
    conn.close()

#insert_craftable_items_database_table(DB_PATH, 3281, "Advance Crossbow", "weapon", "normal_item", "Crossbow")


def update_weapon_type_kind_names(db_path):
    mapping = {
        1: "Boots",
        2: "Glove",
        3: "Hose",
        4: "Hoses",
        5: "Gloves",
        6: "Breastplate",
        7: "Boot",
        8: "Helm",
        9: "Armor",
        10: "Armour",
        11: "Helmet",
        12: "Headband",
        13: "Scabbard",
        14: "Gauntlet",
        15: "Gauntlets",
        16: "Sleeve",
        17: "Sleeves",
        18: "Shoes",
        19: "Shirt",
        20: "Hair lace",
        21: "Trousers",
        22: "Tassets",
        23: "Arm pad",
        24: "Leggings",
        25: "Armpads",
        26: "Bracer",
        27: "Bracers",
        28: "Coronet",
        29: "Culet",
        30: "Cap",
        31: "Garb",
        32: "Kilt",
        33: "Skirt",
        34: "Bracelet",
        35: "Bracelets",
        36: "Headband",
        37: "Greaves",
        38: "Greave",
        39: "Armlets",
        40: "Jacket",
        41: "Tights",
        42: "Gem boer",
        43: "Cuirass",
        44: "Jambeau",
        45: "Shield"
    }
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    for key, value in mapping.items():
        cursor.execute("""
            UPDATE items_database
            SET armorTypeId = %s
            WHERE armorTypeId = %s
        """, (value, str(key)))
    conn.commit()
    conn.close()

#update_weapon_type_kind_names(DB_PATH)
