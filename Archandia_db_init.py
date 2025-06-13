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
def create_users_table(db_path):
    """
    Function to create the 'users' table in the database.
    """
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # SQL query to create the 'users' table
        create_table_query = """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            login TEXT NOT NULL UNIQUE,
            characterId TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            updateDateTime TEXT NOT NULL DEFAULT (datetime('now')),
            updateUserTypeId INTEGER DEFAULT 1,
            insertDateTime TEXT NOT NULL DEFAULT (datetime('now')),
            insertUserTypeId INTEGER DEFAULT 1
        )
        """
        cursor.execute(create_table_query)
        conn.commit()

        print("Table 'users' created successfully.")

    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if conn:
            conn.close()


def create_characters_table(db_path):
    """
    Function to create the 'characters' table in the specified database.
    """
    try:
        connection = sqlite3.connect(db_path)
        cursor = connection.cursor()

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
            updateDateTime TEXT NOT NULL DEFAULT (datetime('now')),
            updateUserTypeId INTEGER DEFAULT 1,
            insertDateTime TEXT NOT NULL DEFAULT (datetime('now')),
            insertUserTypeId INTEGER DEFAULT 1
        )
        """
        cursor.execute(create_table_query)
        connection.commit()

        print("Table 'character_data' created successfully.")

    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if connection:
            connection.close()



# Task Tables -------------------------------------------------------------

def create_tasks_table(db_path):
    
    """
    Function to create the 'tasks' table in the specified database.
    """
    try:
        connection = sqlite3.connect(db_path)
        cursor = connection.cursor()

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
            isRewardGiven BOOLEAN NOT NULL DEFAULT 0,
            updateDateTime TEXT NOT NULL DEFAULT (datetime('now')),
            updateUserTypeId INTEGER DEFAULT 1,
            insertDateTime TEXT NOT NULL DEFAULT (datetime('now')),
            insertUserTypeId INTEGER DEFAULT 1
        )
        """
        cursor.execute(create_table_query)
        connection.commit()

        print("Table 'tasks' created successfully.")

    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if connection:
            connection.close()




def create_manuals_table(db_path):
    """
    Function to create the 'manuals' table in the specified database.
    """
    try:
        connection = sqlite3.connect(db_path)
        cursor = connection.cursor()

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
            updateDateTime TEXT NOT NULL DEFAULT (datetime('now')),
            updateUserTypeId INTEGER NOT NULL DEFAULT 1,
            insertDateTime TEXT NOT NULL DEFAULT (datetime('now')),
            insertUserTypeId INTEGER NOT NULL DEFAULT 1
        )
        """
        cursor.execute(create_table_query)
        
        
        connection.commit()

        print("Table 'manuals' created successfully.")

    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if connection:
            connection.close()


def create_blacksmiths_table(db_path):
    """
    Function to create the 'blacksmiths' table in the specified database.
    """
    try:
        connection = sqlite3.connect(db_path)
        cursor = connection.cursor()

        create_table_query = """
        CREATE TABLE IF NOT EXISTS blacksmiths (
            id TEXT PRIMARY KEY,
            manualId TEXT NOT NULL,
            blacksmithLocalization TEXT NOT NULL,        
            updateDateTime TEXT NOT NULL DEFAULT (datetime('now')),
            updateUserTypeId INTEGER NOT NULL DEFAULT 1,
            insertDateTime TEXT NOT NULL DEFAULT (datetime('now')),
            insertUserTypeId INTEGER NOT NULL DEFAULT 1
        )
        """
        cursor.execute(create_table_query)
        
        connection.commit()

        print("Table 'blacksmiths' created successfully.")

    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if connection:
            connection.close()


def create_requirements_table(db_path):
    """
    Function to create the 'requirements' table in the specified database.
    """
    try:
        connection = sqlite3.connect(db_path)
        cursor = connection.cursor()

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
            areRequirementsMet BOOLEAN NOT NULL DEFAULT 0,
            updateDateTime TEXT NOT NULL DEFAULT (datetime('now')),
            updateUserTypeId INTEGER NOT NULL DEFAULT 1,
            insertDateTime TEXT NOT NULL DEFAULT (datetime('now')),
            insertUserTypeId INTEGER NOT NULL DEFAULT 1
        )
        """
        cursor.execute(create_table_query)
        
        connection.commit()

        print("Table 'requirements' created successfully.")

    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if connection:
            connection.close()



def create_methods_table(db_path):
    """
    Function to create the 'methods' table in the specified database.
    """
    try:
        connection = sqlite3.connect(db_path)
        cursor = connection.cursor()

        create_table_query = """
        CREATE TABLE IF NOT EXISTS methods (
            id SERIAL PRIMARY KEY,
            methodName TEXT NOT NULL
        )
        """
        cursor.execute(create_table_query)
        
        connection.commit()

        print("Table 'methods' created successfully.")

    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if connection:
            connection.close()


def insert_methods(db_path):
    """
    Function to insert methods into the 'methods' table.
    """
    try:
        connection = sqlite3.connect(db_path)
        cursor = connection.cursor()

        # Sample methods to insert
        methods = [
            ("login"),
            ("get_manual"),
            ("post_order"),
            ("post_item")
        ]

        # Insert methods into the table
        cursor.executemany("INSERT INTO methods (methodName) VALUES (%s)", [(method,) for method in methods])
        
        connection.commit()
        print("Methods inserted successfully.")

    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if connection:
            connection.close()


def create_rewards_table(db_path):
    """
    Function to create the 'rewards' table in the specified database.
    """
    try:
        connection = sqlite3.connect(db_path)
        cursor = connection.cursor()

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
        connection.commit()

        print("Table 'rewards' created successfully.")

    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if connection:
            connection.close()


def create_items_database_table(db_path):
    """
    Function to create the 'items_database' table in the specified database.
    """
    try:
        connection = sqlite3.connect(db_path)
        cursor = connection.cursor()

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
        connection.commit()

        print("Table 'items_database' created successfully.")

    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if connection:
            connection.close()


def create_items_table(db_path):
    """
    Function to create the 'items' table with basic columns in the specified database.
    """
    try:
        connection = sqlite3.connect(db_path)
        cursor = connection.cursor()

        create_table_query = """
        CREATE TABLE IF NOT EXISTS items (
            id SERIAL PRIMARY KEY,
            archlordItemId INTEGER NOT NULL,
            itemId TEXT,
            itemTypeKind TEXT,
            name TEXT,
            imageSource TEXT,
            characterId TEXT NOT NULL,
            stack INTEGER NULLABLE,
            updateDateTime TEXT NOT NULL DEFAULT (datetime('now')),
            updateUserTypeId INTEGER NOT NULL DEFAULT 1,
            insertDateTime TEXT NOT NULL DEFAULT (datetime('now')),
            insertUserTypeId INTEGER NOT NULL DEFAULT 1
        )
        """
        cursor.execute(create_table_query)
        connection.commit()

        print("Table 'items' created successfully.")

    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if connection:
            connection.close()


def create_craftable_items_database_table(db_path):
    """
    Function to create the 'craftable_items_database' table in the specified database.
    """
    try:
        connection = sqlite3.connect(db_path)
        cursor = connection.cursor()

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
        connection.commit()

        print("Table 'craftable_items_database' created successfully.")

    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if connection:
            connection.close()


def create_crafting_requirements_database_table(db_path):
    """
    Function to create the 'crafting_requirements_database' table in the specified database.
    """
    try:
        connection = sqlite3.connect(db_path)
        cursor = connection.cursor()

        create_table_query = """
        CREATE TABLE IF NOT EXISTS crafting_requirements_database (
            itemId TEXT NOT NULL,
            itemNeededId INTEGER NOT NULL,
            itemAmount INTEGER NOT NULL,
            updateDateTime TEXT NOT NULL DEFAULT (datetime('now')),
            updateUserTypeId INTEGER NOT NULL DEFAULT 1,
            insertDateTime TEXT NOT NULL DEFAULT (datetime('now')),
            insertUserTypeId INTEGER NOT NULL DEFAULT 1
        )
        """
        cursor.execute(create_table_query)
        connection.commit()

        print("Table 'crafting_requirements_database' created successfully.")

    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if connection:
            connection.close()



# testowe funkcje uzupełniania DB -------------------------------------------

def insert_row_to_characters_table():
    try:
        connection = sqlite3.connect("Archandia_db.db")
        cursor = connection.cursor()

        character_id = "1"

        # Insert into character_data table
        cursor.execute("""
        INSERT INTO characters (
            characterId, userId, name, race, class, lvl, currentExperiencePoints, requiredExperiencePoints, gold,
            stateId, operationId, localizationId, activeSpawnId, updateDatetime, updateUserTypeId, insertDateTime, insertUserTypeId
        ) VALUES (%s, 1, "name", "human", "knight", 1, 0, 100, 50, 1, 1, 1, NULL, datetime('now', 'localtime'), 1, datetime('now', 'localtime'), 1)
        """, (character_id,
        ))

        connection.commit()
        print("character data inserted successfully.")
    except sqlite3.Error as e:
        print(f"Database error: {e}")

    except Exception as e:
        print(f"Error: {e}")



def insert_row_to_users_table(password):

    encrypted_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    try:
        connection = sqlite3.connect("Archandia_db.db")
        cursor = connection.cursor()
        while True:
            new_character_id = generate_base64_uuid()
            cursor.execute("SELECT 1 FROM users WHERE id = %s", (new_character_id,))
            row = cursor.fetchone()
            if not row:  # Jeśli UUID nie istnieje, zwracamy go
                break
        character_id = "1"

        # Insert into character_data table
        cursor.execute("""
        INSERT INTO users (login, characterId, password, updateDatetime, updateUserTypeId, insertDateTime, insertUserTypeId)
        VALUES (%s, %s, %s, datetime('now', 'localtime'), 1, datetime('now', 'localtime'), 1)
        """, (
            new_character_id,
            encrypted_password,
        ))

        connection.commit()
        print("user data inserted successfully.")
    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")


def insert_test_data_to_db(db_path):
    try:
        connection = sqlite3.connect(db_path)
        cursor = connection.cursor()

       

        # Insert sample data into the tasks table
        task_id = generate_base64_uuid()
        sample_data_task = [
            (task_id, "1", "Crafting", "Not Started", None, "2023-10-01 00:00:00", "2;3;4;5")
        ]
        cursor.executemany(""" 
            INSERT INTO tasks (id, characterId, taskType, taskStatus, orderId, taskAvailableToDateTime, requiredOrderOfMethodsRequests
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, sample_data_task)
        connection.commit()

        # Insert related data into the rewards table
        sample_data_reward = [
            (task_id, "1a", 1),
            (task_id, "2a", 2),
            (task_id, "3a", 3)
        ]
        cursor.executemany("""
            INSERT INTO rewards (taskId, rewardItemId, rewardItemAmount)
            VALUES (%s, %s, %s)
        """, sample_data_reward)
        connection.commit()

        print("Test data inserted successfully.")

        if cursor:
            cursor.close()
    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if connection:
            connection.close()


def copy_items_database_records(source_db_path, target_db_path):
    """
    Copies all records from the 'items_database' table in the source database
    to the 'items_database' table in the target database.
    """
    try:
        # Connect to source and target databases
        source_conn = sqlite3.connect(source_db_path)
        target_conn = sqlite3.connect(target_db_path)
        source_cursor = source_conn.cursor()
        target_cursor = target_conn.cursor()

        # Fetch all records from source
        source_cursor.execute("SELECT * FROM items_database")
        records = source_cursor.fetchall()

        # Get column names dynamically
        source_cursor.execute("PRAGMA table_info(items_database)")
        columns = [info[1] for info in source_cursor.fetchall()]
        columns_str = ", ".join(columns)
        placeholders = ", ".join(["%s"] * len(columns))

        # Insert into target
        target_cursor.executemany(
            f"INSERT INTO items_database ({columns_str}) VALUES ({placeholders})",
            records
        )
        target_conn.commit()
        print(f"Copied {len(records)} records from {source_db_path} to {target_db_path}.")

    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if source_conn:
            source_conn.close()
        if target_conn:
            target_conn.close()



def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()


    # Tabela slotów ekwipunku
    cursor.execute("""
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
    )""")

       
    conn.commit()
    conn.close()



    #insert_methods(DATABASE_URL)
    create_crafting_requirements_database_table(DATABASE_URL)
    create_craftable_items_database_table(DATABASE_URL)

    create_users_table(DATABASE_URL)
    create_characters_table(DATABASE_URL)

    create_tasks_table(DATABASE_URL)
    create_manuals_table(DATABASE_URL)
    create_blacksmiths_table(DATABASE_URL)
    create_requirements_table(DATABASE_URL)

    create_methods_table(DATABASE_URL)
    insert_methods(DATABASE_URL)
    create_rewards_table(DATABASE_URL)


    create_items_database_table(DATABASE_URL)
    create_items_table(DATABASE_URL)




if __name__ == '__main__':
    init_db()
    print("Baza danych zainicjalizowana.")




#copy_items_database_records("ArchlordDatabase.db", "Archandia_db.db")
