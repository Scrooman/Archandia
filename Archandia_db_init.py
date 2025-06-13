import sqlite3
import psycopg2
import os
import random
import json
import datetime
import sqlite3
import json
import bcrypt # type: ignore
import uuid
import base64
from dotenv import load_dotenv
load_dotenv()


DATABASE_URL = 'Archandia_db.db'

def get_db_connection():
    return psycopg2.connect(
        dbname=os.getenv("PGDATABASE", "archandia"),
        user=os.getenv("PGUSER", "postgres"),
        password=os.getenv("PGPASSWORD", "yourpassword"),
        host=os.getenv("PGHOST", "localhost"),
        port=os.getenv("PGPORT", "5432")
    )





def generate_base64_uuid():
    uuid_bytes = uuid.uuid4().bytes  # UUID as bytes
    base64_uuid = base64.urlsafe_b64encode(uuid_bytes).decode('utf-8').rstrip('=')
    return base64_uuid.replace('-', '').replace('_', '')[:12]  # Remove '-' and '_'




# Character Tables-- -------------------------------------------------------------
def create_users_table(conn):
    """
    Function to create the 'users' table in the database.
    """
    try:
        cursor = conn.cursor()

        # SQL query to create the 'users' table
        create_table_query = """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            login TEXT NOT NULL UNIQUE,
            characterId TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            updateDateTime TEXT NOT NULL DEFAULT NOW(),
            updateUserTypeId INTEGER DEFAULT 1,
            insertDateTime TEXT NOT NULL DEFAULT NOW(),
            insertUserTypeId INTEGER DEFAULT 1
        )
        """
        cursor.execute(create_table_query)
        conn.commit()

        print("Table 'users' created successfully.")

    except Exception as e:
        print(f"Error: {e}")


def create_characters_table(conn):
    """
    Function to create the 'characters' table in the specified database.
    """
    try:
        
        cursor = conn.cursor()

        # SQL query to create the 'characters' table
        create_table_query = """
        CREATE TABLE IF NOT EXISTS characters (
            id TEXT PRIMARY KEY ,
            name TEXT,
            race TEXT,
            class TEXT,
            lvl INTEGER,
            currentExperiencePoints INTEGER,
            requiredExperiencePoints INTEGER,
            gold INTEGER,
            stateId INTEGER,
            operationId INTEGER,
            localizationId INTEGER,
            activeSpawnId INTEGER,
            updateDateTime TEXT NOT NULL DEFAULT NOW(),
            updateUserTypeId INTEGER DEFAULT 1,
            insertDateTime TEXT NOT NULL DEFAULT NOW(),
            insertUserTypeId INTEGER DEFAULT 1
        )
        """
        cursor.execute(create_table_query)
        conn.commit()

        print("Table 'characters' created successfully.")

    except Exception as e:
        print(f"Error: {e}")



# Task Tables -------------------------------------------------------------

def create_tasks_table(conn):
    
    """
    Function to create the 'tasks' table in the specified database.
    """
    try:
        
        cursor = conn.cursor()

        # SQL query to create the 'tasks' table
        create_table_query = """
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            characterId TEXT,
            taskType TEXT,
            taskStatus TEXT,
            orderId TEXT,
            taskAvailableToDateTime TEXT NOT NULL,
            taskStartDateTime TEXT,
            taskActiveToDateTime TEXT,
            taskCompletionDateTime TEXT,
            requiredOrderOfMethodsRequests TEXT,
            taskName TEXT,
            taskDescription TEXT,
            questStartingMethod TEXT,
            questStartingEndpoint TEXT,
            isRewardGiven BOOLEAN NOT NULL DEFAULT FALSE,
            updateDateTime TEXT NOT NULL DEFAULT NOW(),
            updateUserTypeId INTEGER DEFAULT 1,
            insertDateTime TEXT NOT NULL DEFAULT NOW(),
            insertUserTypeId INTEGER DEFAULT 1
        )
        """
        cursor.execute(create_table_query)
        conn.commit()

        print("Table 'tasks' created successfully.")

    except Exception as e:
        print(f"Error: {e}")




def create_manuals_table(conn):
    """
    Function to create the 'manuals' table in the specified database.
    """
    try:
        
        cursor = conn.cursor()

        create_table_query = """
        CREATE TABLE IF NOT EXISTS manuals (
            id TEXT PRIMARY KEY,
            taskId TEXT NOT NULL,
            recipeCorelationId TEXT,
            status TEXT NOT NULL,
            itemRarity TEXT,
            itemName TEXT,
            itemType TEXT,
            itemCategory TEXT,
            activeToDateTime TEXT,
            updateDateTime TEXT NOT NULL DEFAULT NOW(),
            updateUserTypeId INTEGER NOT NULL DEFAULT 1,
            insertDateTime TEXT NOT NULL DEFAULT NOW(),
            insertUserTypeId INTEGER NOT NULL DEFAULT 1
        )
        """
        cursor.execute(create_table_query)
        
        
        conn.commit()

        print("Table 'manuals' created successfully.")

    except Exception as e:
        print(f"Error: {e}")


def create_blacksmiths_table(conn):
    """
    Function to create the 'blacksmiths' table in the specified database.
    """
    try:
        
        cursor = conn.cursor()

        create_table_query = """
        CREATE TABLE IF NOT EXISTS blacksmiths (
            id TEXT PRIMARY KEY,
            manualId TEXT NOT NULL,
            blacksmithLocalization TEXT NOT NULL,        
            updateDateTime TEXT NOT NULL DEFAULT NOW(),
            updateUserTypeId INTEGER NOT NULL DEFAULT 1,
            insertDateTime TEXT NOT NULL DEFAULT NOW(),
            insertUserTypeId INTEGER NOT NULL DEFAULT 1
        )
        """
        cursor.execute(create_table_query)
        
        conn.commit()

        print("Table 'blacksmiths' created successfully.")

    except Exception as e:
        print(f"Error: {e}")


def create_requirements_table(conn):
    """
    Function to create the 'requirements' table in the specified database.
    """
    try:
        
        cursor = conn.cursor()

        create_table_query = """
        CREATE TABLE IF NOT EXISTS requirements (
            id SERIAL PRIMARY KEY,
            manualId TEXT NOT NULL,
            itemIdRequired TEXT NOT NULL,
            itemNameRequired TEXT NOT NULL,
            minimumItemRarityRequired TEXT,
            itemTypeRequired TEXT NOT NULL,
            minimumItemAmountRequired INTEGER NOT NULL,
            itemRarityGiven TEXT,
            itemAmountGiven INTEGER,
            areRequirementsMet BOOLEAN NOT NULL DEFAULT FALSE,
            updateDateTime TEXT NOT NULL DEFAULT NOW(),
            updateUserTypeId INTEGER NOT NULL DEFAULT 1,
            insertDateTime TEXT NOT NULL DEFAULT NOW(),
            insertUserTypeId INTEGER NOT NULL DEFAULT 1
        )
        """
        cursor.execute(create_table_query)
        
        conn.commit()

        print("Table 'requirements' created successfully.")

    except Exception as e:
        print(f"Error: {e}")



def create_methods_table(conn):
    """
    Function to create the 'methods' table in the specified database.
    """
    try:
        
        cursor = conn.cursor()

        create_table_query = """
        CREATE TABLE IF NOT EXISTS methods (
            id SERIAL PRIMARY KEY,
            methodName TEXT NOT NULL
        )
        """
        cursor.execute(create_table_query)
        
        conn.commit()

        print("Table 'methods' created successfully.")

    except Exception as e:
        print(f"Error: {e}")


def insert_methods(conn):
    try:
        cursor = conn.cursor()
        methods = [
            ("login",),
            ("get_manual",),
            ("post_order",),
            ("post_item",)
        ]
        cursor.executemany("INSERT INTO methods (methodName) VALUES (%s)", methods)
        conn.commit()
        print("Methods inserted successfully.")
    except Exception as e:
        print(f"Error: {e}")


def create_rewards_table(conn):
    """
    Function to create the 'rewards' table in the specified database.
    """
    try:
        
        cursor = conn.cursor()

        create_table_query = """
        CREATE TABLE IF NOT EXISTS rewards (
            id SERIAL PRIMARY KEY,
            taskId TEXT NOT NULL,
            rewardItemId TEXT NOT NULL,
            rewardName TEXT NOT NULL,
            rewardItemAmount INTEGER NOT NULL
        )
        """
        cursor.execute(create_table_query)
        conn.commit()

        print("Table 'rewards' created successfully.")

    except Exception as e:
        print(f"Error: {e}")


def create_items_database_table(conn):
    """
    Function to create the 'items_database' table in the specified database.
    """
    try:
        
        cursor = conn.cursor()

        create_table_query = """
        CREATE TABLE IF NOT EXISTS items_database (
            id SERIAL PRIMARY KEY,
            itemId INTEGER,
            itemTypeKindId INTEGER,
            name VARCHAR(255),
            imageLink TEXT,
            image_source TEXT,
            itemRarityTypeId VARCHAR(255),
            colorId INTEGER,
            bound INTEGER,
            chantraBagItem INTEGER,
            EventItem INTEGER,
            questLink TEXT,
            questName VARCHAR(255),
            "class" VARCHAR(255),
            durability INTEGER,
            fortuneGate VARCHAR(255),
            requiredLvl INTEGER,
            additional_stats TEXT,
            description TEXT,
            skills TEXT,
            itemTypeId INTEGER,
            weaponTypeId INTEGER,
            armorTypeId INTEGER,
            armorRaceTypeId INTEGER,
            accessoryTypeId INTEGER,
            potionTypeId INTEGER,
            prayerStoneTypeId INTEGER,
            elementalStoneTypeId INTEGER,
            productionMaterialTypeId INTEGER,
            heroicSetTypeId INTEGER,
            stack INTEGER,
            physicalDefense INTEGER,
            physicalDefenceRate INTEGER,
            waterDefence INTEGER,
            airDefence INTEGER,
            magicDefence INTEGER,
            fireDefence INTEGER,
            earthDefence INTEGER,
            heroicDefence INTEGER,
            blockRate INTEGER,
            physicalAttackRate INTEGER,
            attackSpeed INTEGER,
            attackRange INTEGER,
            minDamage INTEGER,
            maxDamage INTEGER,
            randomAbilitiesNumber INTEGER,
            bonusHp INTEGER,
            hpRecovered INTEGER,
            manaRecovered INTEGER,
            mountRunBuff INTEGER
        )
        """
        cursor.execute(create_table_query)
        conn.commit()

        print("Table 'items_database' created successfully.")

    except Exception as e:
        print(f"Error: {e}")



def create_items_table(conn):
    """
    Function to create the 'items' table with basic columns in the specified database.
    """
    try:
        
        cursor = conn.cursor()

        create_table_query = """
        CREATE TABLE IF NOT EXISTS items (
            id SERIAL PRIMARY KEY,
            archlordItemId INTEGER NOT NULL,
            itemId TEXT,
            itemTypeKind TEXT,
            name TEXT,
            imageSource TEXT,
            characterId TEXT NOT NULL,
            stack INTEGER,
            updateDateTime TEXT NOT NULL DEFAULT NOW(),
            updateUserTypeId INTEGER NOT NULL DEFAULT 1,
            insertDateTime TEXT NOT NULL DEFAULT NOW(),
            insertUserTypeId INTEGER NOT NULL DEFAULT 1
        )
        """
        cursor.execute(create_table_query)
        conn.commit()

        print("Table 'items' created successfully.")

    except Exception as e:
        print(f"Error: {e}")


def create_craftable_items_database_table(conn):
    """
    Function to create the 'craftable_items_database' table in the specified database.
    """
    try:
        
        cursor = conn.cursor()

        create_table_query = """
        CREATE TABLE IF NOT EXISTS craftable_items_database (
            id SERIAL PRIMARY KEY,
            itemId TEXT NOT NULL,
            itemName TEXT NOT NULL,
            itemTypeKindId INTEGER NOT NULL,
            itemRarityTypeId TEXT NOT NULL,
            itemCategory TEXT NOT NULL
        )
        """
        cursor.execute(create_table_query)
        conn.commit()

        print("Table 'craftable_items_database' created successfully.")
    except Exception as e:
        print(f"Error: {e}")


def create_crafting_requirements_database_table(conn):
    """
    Function to create the 'crafting_requirements_database' table in the specified database.
    """
    try:
        
        cursor = conn.cursor()

        create_table_query = """
        CREATE TABLE IF NOT EXISTS crafting_requirements_database (
            itemId TEXT NOT NULL,
            itemNeededId INTEGER NOT NULL,
            itemAmount INTEGER NOT NULL,
            updateDateTime TEXT NOT NULL DEFAULT NOW(),
            updateUserTypeId INTEGER NOT NULL DEFAULT 1,
            insertDateTime TEXT NOT NULL DEFAULT NOW(),
            insertUserTypeId INTEGER NOT NULL DEFAULT 1
        )
        """
        cursor.execute(create_table_query)
        conn.commit()

        print("Table 'crafting_requirements_database' created successfully.")
    except Exception as e:
        print(f"Error: {e}")

def create_character_inventory_slots_table(conn):
        try:
            cursor = conn.cursor()
            # SQL query to create the 'character_inventory_slots' table
            create_table_query = """
            CREATE TABLE IF NOT EXISTS character_inventory_slots (
                character_id TEXT NOT NULL,
                tab_id INTEGER NOT NULL,
                slot_index INTEGER NOT NULL,
                item_id TEXT NOT NULL UNIQUE,
                PRIMARY KEY (character_id, tab_id, slot_index),
                FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
                FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
                CHECK (tab_id >= 0 AND tab_id <= 4),
                CHECK (slot_index >= 0 AND slot_index <= 24)
            )"""
            cursor.execute(create_table_query)
            conn.commit()
            print("Table 'character_inventory_slots' created successfully.")
        except Exception as e:
            print(f"Error: {e}")

def insert_crafting_requirements_database(conn, item_id, requiredtoCraftItemId, item_amount=None):
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO crafting_requirements_database (itemId, itemNeededId, itemAmount)
            VALUES (%s, %s, %s)
        """, (item_id, requiredtoCraftItemId, item_amount))
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")
    finally:
        cursor.close()


def insert_craftable_items_database_table(conn, item_id, item_name, item_type_kind_id, item_rarity_type_id, item_category):
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO craftable_items_database (itemId, itemName, itemTypeKindId, itemRarityTypeId, itemCategory)
            VALUES (%s, %s, %s, %s, %s)
        """, (item_id, item_name, item_type_kind_id, item_rarity_type_id, item_category))
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")
    finally:
        cursor.close()


def init_db():
    conn = get_db_connection()
    try:
        create_users_table(conn)
        create_characters_table(conn)
        create_tasks_table(conn)
        create_manuals_table(conn)
        create_blacksmiths_table(conn)
        create_requirements_table(conn)
        create_methods_table(conn)
        create_rewards_table(conn)
        create_items_database_table(conn)
        create_items_table(conn)
        create_craftable_items_database_table(conn)
        create_crafting_requirements_database_table(conn)
        create_character_inventory_slots_table(conn)
        print("Wszystkie tabele utworzone w PostgreSQL.")

        insert_crafting_requirements_database(conn, 3281, 3281, 1)
        insert_crafting_requirements_database(conn, 3281, 266, 1)
        insert_crafting_requirements_database(conn, 3281, 262, 1)
        insert_crafting_requirements_database(conn, 3281, 258, 1)
        insert_crafting_requirements_database(conn, 3281, 2118, 1)
        insert_crafting_requirements_database(conn, 3281, 4802, 5000)
    
        insert_craftable_items_database_table(conn, 3281, "Advance Crossbow", "weapon", "normal_item", "Crossbow")
        print("Uzupełniono dane w tabelach PostgreSQL.")
    
    finally:
        if conn:
            conn.close()


if __name__ == '__main__':
    init_db()
    print("Baza danych zainicjalizowana.")


