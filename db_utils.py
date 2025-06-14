import jwt # type: ignore
from flask import Flask, request, jsonify, render_template
from datetime import datetime, timedelta
import sqlite3
import psycopg2
import bcrypt # type: ignore
import uuid
import base64
from flask_cors import CORS # type: ignore
from flask import session
import os
import json
import random
from Archandia_db_init import get_db_connection, init_db, generate_base64_uuid
import itertools
import pprint




def generate_item_id():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        while True:
            new_item_id = generate_base64_uuid()
            cursor.execute("SELECT 1 FROM items WHERE itemId = %s", (new_item_id,))
            row = cursor.fetchone()
            if not row:  # Jeśli UUID nie istnieje, zwracamy go
                return new_item_id
    finally:
        conn.close()


def generate_manual_id():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        while True:
            new_manual_id = generate_base64_uuid()
            cursor.execute("SELECT 1 FROM manuals WHERE id = %s", (new_manual_id,))
            row = cursor.fetchone()
            if not row:  # Jeśli UUID nie istnieje, zwracamy go
                return new_manual_id
    finally:
        conn.close()


def generate_blacksmith_id():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        while True:
            new_blacksmith_id = generate_base64_uuid()
            cursor.execute("SELECT 1 FROM blacksmiths WHERE id = %s", (new_blacksmith_id,))
            row = cursor.fetchone()
            if not row:  # Jeśli UUID nie istnieje, zwracamy go
                return new_blacksmith_id
    finally:
        conn.close()


# TASKS /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\

def get_task_data_from_db(character_id, task_status=None):
    """
    Pobiera zadania dla danego character_id i statusu (lub listy statusów).
    Jeśli task_status to None, domyślnie pobiera zadania o statusie 'Completed', 'Not Started' lub 'In Progress' .
    Jeśli task_status to lista, pobiera zadania o statusach z tej listy.
    Jeśli task_status to string, pobiera zadania o tym statusie.
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    try:
        if task_status is None:
            status_list = ['Completed', 'Not Started', 'In Progress', "Cancelled"]
        elif isinstance(task_status, str):
            status_list = [task_status]
        else:
            status_list = list(task_status)

        placeholders = ','.join('%s' for _ in status_list)
        query = f"SELECT * FROM tasks WHERE characterId = %s AND taskStatus IN ({placeholders}) AND taskAvailableToDateTime > NOW()"
        cursor.execute(query, (character_id, *status_list))
        rows = cursor.fetchall()
        tasks = []
        for row in rows:
            tasks.append({
                "TaskId": row[0],
                "CharacterId": row[1],
                "TaskType": row[2],
                "TaskStatus": row[3],
                "OrderId": row[4],
                "TaskAvailableToDateTime": row[5],
                "TaskStartDateTime": row[6],
                "TaskActiveToDateTime": row[7],
                "TaskCompletionDateTime": row[8],
                "RequiredOrderOfMethodsRequests": row[9],
                "TaskName": row[10],
                "TaskDescription": row[11],
                "QuestStartingMethod": row[12],
                "QuestStartingEndpoint": row[13],
                "IsRewardGiven": row[14],
                "UpdateDateTime": row[15],
                "UpdateUserTypeId": row[16],
                "InsertDateTime": row[17],
                "InsertUserTypeId": row[18]
            })
        print(f"Fetched {len(tasks)} tasks for character {character_id} with status {status_list}.")
        return tasks
    finally:
        conn.close()


def get_rewards_for_character_from_db(task_id):
    """
    Pobiera nagrody przypisane do danego zadania (task_id) z tabeli rewards.
    Zwraca listę słowników z polami rewardItemId i rewardItemAmount.
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        cursor.execute(
            "SELECT rewardItemId, rewardName, rewardItemAmount FROM rewards WHERE taskId = %s",
            (task_id,)
        )
        rows = cursor.fetchall()
        rewards = []
        for row in rows:
            rewards.append({
                "rewardItemId": row[0],
                "rewardName": row[1],
                "rewardItemAmount": row[2]
            })
        return rewards
    finally:
        conn.close()


def get_task_types_for_character_with_status(character_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        cursor.execute(
            "SELECT taskType FROM tasks WHERE characterId = %s AND taskStatus IN ('Not Started', 'In Progress')",
            (character_id,)
        )
        rows = cursor.fetchall()
        return [row[0] for row in rows]
    finally:
        conn.close()


def update_task_status_in_db(task_id, new_status):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE tasks SET taskStatus = %s, updateDatetime = NOW() WHERE id = %s", (new_status, task_id))
        conn.commit()
        print("Task status updated successfully.")
    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()


def update_task_start_and_active_time_in_db(task_id, task_start_time, task_active_to_time):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        # Pobierz aktualną wartość taskAvailableToDateTime
        cursor.execute("SELECT taskAvailableToDateTime FROM tasks WHERE id = %s", (task_id,))
        row = cursor.fetchone()
        if row:
            task_available_to_datetime = row[0]
            # Jeśli taskAvailableToDateTime < task_active_to_time, ustaw taskActiveToDateTime na taskAvailableToDateTime
            if task_available_to_datetime < task_active_to_time:
                task_active_to_time = task_available_to_datetime
        cursor.execute(
            "UPDATE tasks SET taskStartDateTime = %s, taskActiveToDateTime = %s, updateDatetime = NOW() WHERE id = %s",
            (task_start_time, task_active_to_time, task_id)
        )
        conn.commit()
        print("Task available time updated successfully.")
    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()


def update_task_active_time_in_db(task_id, task_active_to_time):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE tasks SET taskActiveToDateTime = %s, updateDatetime = NOW() WHERE id = %s",
            (task_active_to_time, task_id)
        )
        conn.commit()
        print("Task active time updated successfully.")
    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()


def insert_task_data_to_db(task_data, task_type, character_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    task_id = generate_base64_uuid()
    task_available_to_date_time = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S")
    order_id = None

    try:
        cursor.execute(""" 
            INSERT INTO tasks (id, characterId, taskType, taskStatus, orderId, taskAvailableToDateTime, requiredOrderOfMethodsRequests, taskName, taskDescription, questStartingMethod, questStartingEndpoint)
            VALUES (%s, %s, %s, 'Not Started', %s, %s, %s, %s, %s, %s, %s)
        """, (task_id, character_id, task_type, order_id, task_available_to_date_time, task_data.get("requiredOrderOfMethodsRequests", "2;3;4;5"), task_data.get("questName", "Quest Name"), task_data.get("questDescription", "Quest Description"), task_data.get("questStartingMethod", "Missing Method"), task_data.get("questStartingEndpoint", "Missing Endpoint")))
        conn.commit()

        # Insert related data into the rewards table
        quest_rewards = task_data.get("questRewards", {})
        for rarity, rewards in quest_rewards.items():
            #print(f"Processing rewards for rarity {rarity}: {rewards}")
            for reward_key, reward_value in rewards.items():
                if isinstance(reward_value, dict):
                    for name, item_id in reward_value.items():
                        if name != "amount":
                            reward_name = name
                            reward_item_id = item_id
                            reward_item_amount = reward_value.get("amount", 1)
                            cursor.execute("""
                                INSERT INTO rewards (taskId, rewardItemId, rewardName, rewardItemAmount)
                                VALUES (%s, %s, %s, %s)
                            """, (task_id, reward_item_id, reward_name, reward_item_amount))
                else:
                    print(f"Processing reward item: {reward_key} with value {reward_value}")
                    cursor.execute("""
                    INSERT INTO rewards (taskId, rewardItemId, rewardName, rewardItemAmount)
                    VALUES (%s, %s, %s, %s)
                    """, (task_id, reward_key, reward_key.capitalize(), reward_value))
        conn.commit()

        print("Task created successfully.")

        if cursor:
            cursor.close()
        return task_id
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None
    finally:
        if conn:
            conn.close()


def create_task_for_character_in_db(character_id):
    """Creates a new task for the specified character in the database.
    This function checks if the character can create a new task based on certain conditions,
    then draws a random item from the craftable items database and generates a task based on RARITY of that item.

    """
    active_task_types = get_task_types_for_character_with_status(character_id)
    print("Active task types for character:", active_task_types)
    if "Crafting" not in active_task_types:
        print("Creating a new crafting task for character:", character_id)
        #dodać w tym miejscu warunki sprawdzania czy jest możliwość utworzenia zadania (czy max liczba nie przekroczona, czy jest już tego rodzaju zadanie aktywne, itp.)
        # następnie przekazać do funkji tworzącej zadanie rodzaj zadania, aby wygenerować odpowiednie zadanie

        # Losuj jeden wiersz z craftable_items_database i pobierz jego dane - na tej podstawie będzie generowane zadanie, aby wybrać odpowiednie rarity
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM craftable_items_database ORDER BY RANDOM() LIMIT 1")
        craftable_item_row = cursor.fetchone()
        craftable_item_data = []
        if craftable_item_row:
            craftable_item_data = list(craftable_item_row)
        conn.close()
        item_id = craftable_item_data[1] 
        item_rarity = craftable_item_data[4]
        item_name = craftable_item_data[2]
        item_type = craftable_item_data[3]
        item_category = craftable_item_data[5]  # Assuming this is the item category

        drawn_task_data = draw_crafting_task_data_from_quest_forms_JSON(item_rarity, item_name, item_category, json_path="quests_forms.json")
        created_task_id = insert_task_data_to_db(drawn_task_data, task_type="Crafting", character_id=character_id)
        manual_id = create_manual_for_character_in_db_and_return_id(created_task_id, item_id)
        create_blacksmith_for_manual_in_db(manual_id, drawn_task_data.get("availableTowns", {}))
        create_requirements_for_manual_in_db(manual_id, item_id)
    # elif "Adventure" in active_task_types: - tutja dodać kolejne rodzaje questów
    print("Task creation process completed for character:", character_id)
    pass


def create_manual_for_character_in_db_and_return_id(task_id, craftable_item_id):

    if not task_id:
        print("No task_id provided, cannot create manual.")
        raise ValueError("No active task found for the given character_id")
    manual_id = generate_manual_id()

    craftable_item_data = fetch_item_data_from_archlord_db(craftable_item_id)
    #print("Craftable item data:", craftable_item_data)
    if not craftable_item_data:
        print(f"No item found in items_database with id {craftable_item_id}")
        return None


    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        item_info = next(iter(craftable_item_data.values()))
        cursor.execute("""
            INSERT INTO manuals (id, taskId, recipeCorelationId, status, itemRarity, itemName, itemType, itemCategory, activeToDateTime) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            manual_id,
            task_id,
            None,
            "Active",
            item_info["itemRarityTypeId"],
            item_info["name"],
            item_info["itemTypeKindId"],
            item_info["itemCategory"],
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ))
        conn.commit()
        print("Manual created successfully.")

        return manual_id
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None
    finally:
        conn.close()


def create_requirements_for_manual_in_db(manual_id, item_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    # Pobierz wszystkie rekordy z crafting_requirements_database, gdzie itemId jest taki sam jak manual_id
    cursor.execute("""
        SELECT crd.itemNeededId, crd.itemAmount, idb.itemTypeKindId, idb.name, idb.itemRarityTypeId
        FROM crafting_requirements_database crd
        LEFT JOIN items_database idb ON crd.itemNeededId = idb.itemId
        WHERE crd.itemId = %s
    """, (item_id,))
    crafting_requirements = cursor.fetchall()
    print("Crafting requirements fetched from database:", crafting_requirements)

    # Zamień wyniki na listę słowników z polami dla każdego id z crafting_requirements_database
    requirements_from_db = []
    columns = [desc[0] for desc in cursor.description]
    for row in crafting_requirements:
        requirements_from_db.append({col: row[idx] for idx, col in enumerate(columns)})

    # Przygotuj dane do wstawienia do tabeli requirements na podstawie danych z crafting_requirements_database
    data_requirements = []
    for req in requirements_from_db:
        print("Processing requirement:", req)
        data_requirements.append((
            manual_id,
            req.get("itemNeededId"),
            req.get("name"),
            req.get("itemRarityTypeId"),
            req.get("itemTypeKindId"),
            req.get("itemAmount"),
            None,  # itemRarityGiven
            None,  # itemAmountGiven
            False      # areRequirementsMet
        ))

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.executemany("""
            INSERT INTO requirements (
            manualId, 
            itemIdRequired,
            itemNameRequired, 
            minimumItemRarityRequired, 
            itemTypeRequired, 
            minimumItemAmountRequired, 
            itemRarityGiven, 
            itemAmountGiven, 
            areRequirementsMet
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, data_requirements)
        conn.commit()
        print("Requirements created successfully.")
    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()


def create_blacksmith_for_manual_in_db(manual_id, task_localization_data):
    # task_localization_data: list of dicts with keys 'townName' and 'geographicLocalization'
    task_localization_data = [
        (generate_blacksmith_id(), manual_id, town.get("townName"))
        for town in task_localization_data if "townName" in town
    ]
    if not task_localization_data:
        print("No valid blacksmith data to insert.")
        return

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.executemany("""
            INSERT INTO blacksmiths (id, manualId, blacksmithLocalization) VALUES (%s, %s, %s)
        """, task_localization_data)
        conn.commit()
        print("Blacksmith created successfully.")
    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()


def draw_crafting_task_data_from_quest_forms_JSON(drawn_item_rarity, item_name, item_category, json_path="quests_forms.json"):
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            quests_data = json.load(f)
        # Nowa struktura: quests_data["type"]["crafting"] to lista questów
        crafting_tasks = quests_data.get("type", {}).get("crafting", [])
        if not crafting_tasks:
            print("No crafting tasks found in the JSON file.")
            return None

        # Losuj jeden task z crafting
        drawn_task = random.choice(crafting_tasks)
        drawn_task_data = dict(drawn_task)  # Kopia słownika

        # Wybierz questRewards dla drawn_item_rarity
        quest_rewards = drawn_task_data.get("questRewards", {})
        chosen_rarity_rewards = quest_rewards.get(drawn_item_rarity, {})
        if not chosen_rarity_rewards:
            return None

        # Losuj gold, experience, keys z min/max
        for reward_key in ["gold", "experience", "keys"]:
            reward_info = chosen_rarity_rewards.get(reward_key, {})
            if isinstance(reward_info, dict):
                min_val = reward_info.get("min", 0)
                max_val = reward_info.get("max", 0)
                if min_val == max_val:
                    value = min_val
                else:
                    value = random.randint(min_val, max_val)
                if reward_key == "keys" and "keyId" in reward_info or reward_key == "gold" and "rewardId" in reward_info:
                    chosen_rarity_rewards[reward_key] = {
                        reward_info["rewardName"]: reward_info["keyId"] if reward_key == "keys" else reward_info["rewardId"],
                        "amount": value
                    }
                else:
                    chosen_rarity_rewards[reward_key] = value
            else:
                chosen_rarity_rewards[reward_key] = reward_info  # fallback

        # Zamień questRewards na tylko wylosowany drawn_item_rarity
        drawn_task_data["questRewards"] = {drawn_item_rarity: chosen_rarity_rewards}


        # Losuj dwa dostępne miasta z availableTowns (teraz lista słowników)
        available_towns = drawn_task_data.get("availableTowns", [])
        if isinstance(available_towns, list) and len(available_towns) >= 2:
            drawn_task_data["availableTowns"] = random.sample(available_towns, 2)
        else:
            drawn_task_data["availableTowns"] = available_towns

        
        #print("Wygenerowane dane zadania:")
        pprint.pprint(drawn_task_data, indent=2, width=120, compact=False, sort_dicts=False)
        return drawn_task_data
    except Exception as e:
        print(f"Error drawing task data from {json_path}: {e}")
        return None


def is_valid_task_and_sequence(task_id, requests_sequence):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        cursor.execute(
            "SELECT requiredOrderOfMethodsRequests FROM tasks WHERE id = %s AND taskStatus = 'In Progress'",
            (task_id,)
        )
        row = cursor.fetchone()
        if row:
            required_sequence = row[0]
            if required_sequence == requests_sequence:
                return True
            else:
                return False
        return False
    finally:
        conn.close()


def are_all_requirements_met_for_task(task_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        # Pobierz manualId na podstawie task_id
        cursor.execute("SELECT id FROM manuals WHERE taskId = %s", (task_id,))
        manual_row = cursor.fetchone()
        if not manual_row:
            return False
        manual_id = manual_row[0]

        # Pobierz wszystkie requirements dla manualId
        cursor.execute("SELECT areRequirementsMet FROM requirements WHERE manualId = %s", (manual_id,))
        requirements = cursor.fetchall()
        if not requirements:
            return False

        # Sprawdź, czy którykolwiek areRequirementsMet == 0
        for req in requirements:
            if req[0] == 0:
                return False
        return True
    finally:
        conn.close()


def get_manual_id_for_task_from_db(task_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    try:
        cursor.execute("SELECT id FROM manuals WHERE taskId = %s", (task_id,))
        row = cursor.fetchone()
        if row:
            return row[0]
        else:
            return None
    finally:
        conn.close()


def get_requirements_data_by_manual_id_from_db(manual_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    try:
        cursor.execute("SELECT * FROM requirements WHERE manualId = %s", (manual_id,))
        row = cursor.fetchone()
        requirements_list = []
        # Pobieranie wszystkich wymagań dla danego manualId
        while row:
            requirements_list.append({
                "Id": row[0],
                "ManualId": row[1],
                "ItemIdRequired": row[2],
                "ItemNameRequired": row[3],
                "MinimumItemRarityRequired": row[4],
                "ItemTypeRequired": row[5],
                "MinimumItemAmountRequired": row[6],
                "ItemRarityGiven": row[7],
                "ItemAmountGiven": row[8],
                "AreRequirementsMet": row[9]
            })
            row = cursor.fetchone()
        return requirements_list
    finally:
        conn.close()


# ITEMS /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\

def insert_item_into_first_available_characters_inventory_slot(character_id, updates):
    from Archandia_backend import MAX_SLOTS_PER_TAB, MAX_TABS
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    try:
        with conn:
            processed_item_ids = set()
            # Pobierz aktualny stan slotów dla postaci
            cursor.execute("""
                SELECT item_id, tab_id, slot_index FROM character_inventory_slots
                WHERE character_id = %s
            """, (character_id,))
            rows = cursor.fetchall()
            current_slots = {(row['tab_id'], row['slot_index']): row['item_id'] for row in rows}
            item_to_slot = {row['item_id']: (row['tab_id'], row['slot_index']) for row in rows}

            final_updates = []

            for update_action in updates:
                item_id = update_action['itemId']
                target_tab_id = update_action['targetTabId']
                target_slot_index = update_action.get('targetSlotIndex')

                if item_id in processed_item_ids:
                    continue

                # Sprawdź obecne miejsce itemu
                current_place = item_to_slot.get(item_id)

                # Jeśli nie podano slotu, szukaj pierwszego wolnego slotu w tabie, a jeśli nie ma, to w kolejnych tabach
                if target_slot_index is None:
                    found_slot = False
                    for tab_id in range(target_tab_id, MAX_TABS):
                        occupied_slots = {slot for (tab, slot), iid in current_slots.items() if tab == tab_id}
                        for i in range(MAX_SLOTS_PER_TAB):
                            if i not in occupied_slots:
                                target_tab_id = tab_id
                                target_slot_index = i
                                found_slot = True
                                break
                        if found_slot:
                            break
                    if not found_slot:
                        # Brak miejsca w żadnym tabie, nie ruszamy itemu
                        continue

                # Aktualizuj miejsce dla itemu
                final_updates.append({
                    'item_id': item_id,
                    'tab_id': target_tab_id,
                    'slot_index': target_slot_index
                })
                processed_item_ids.add(item_id)
                # Aktualizuj mapę slotów
                if current_place:
                    del current_slots[current_place]
                current_slots[(target_tab_id, target_slot_index)] = item_id
                item_to_slot[item_id] = (target_tab_id, target_slot_index)

            # Wstaw nowe pozycje
            for final_update in final_updates:
                cursor.execute("""
                    INSERT INTO character_inventory_slots (character_id, item_id, tab_id, slot_index)
                    VALUES (%s, %s, %s, %s)
                """, (character_id, final_update['item_id'], final_update['tab_id'], final_update['slot_index']))

        return jsonify({"message": "Ekwipunek zaktualizowany pomyślnie", "applied_updates": final_updates}), 200

    except sqlite3.IntegrityError as e:
        conn.rollback()
        return jsonify({"error": "Błąd integralności bazy danych", "details": str(e)}), 500
    except Exception as e:
        conn.rollback()
        return jsonify({"error": "Wystąpił błąd serwera", "details": str(e)}), 500
    finally:
        conn.close()


def create_item_by_id_from_db(item_archlord_db_id, character_id, amount=None):
    from Archandia_backend import MAX_SLOTS_PER_TAB, MAX_TABS
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        # Sprawdź, czy przedmiot jest już w ekwipunku
        cursor.execute("SELECT COUNT(*) FROM items WHERE archlordItemId = %s AND characterId = %s", (item_archlord_db_id, character_id))
        if is_item_in_inventory := cursor.fetchone()[0] > 0:
            is_item_in_inventory = True
            cursor.execute("SELECT stack FROM items WHERE archlordItemId = %s AND characterId = %s", (item_archlord_db_id, character_id))
            item_stack = cursor.fetchone()[0]
            if item_stack == None:
                is_item_stockable = False
            else:
                is_item_stockable = True
        else:
            is_item_stockable = False
            is_item_in_inventory = False
        print(f"for Item {item_archlord_db_id} Is item in inventory: {is_item_in_inventory}, Is item stockable: {is_item_stockable}")
        if is_item_stockable == False or is_item_in_inventory == False:
            # Sprawdź liczbę slotów w character_inventory_slots dla danego character_id
            cursor.execute("SELECT COUNT(*) FROM character_inventory_slots WHERE character_id = %s", (character_id,))
            slot_count = cursor.fetchone()[0]
            if slot_count >= MAX_SLOTS_PER_TAB * MAX_TABS:
                print(f"Character {character_id} has full inventory ({slot_count} slots). Item not created.")
                return False

            cursor.execute(f"SELECT itemId, itemTypeKindId, name, image_source, stack FROM items_database WHERE itemId = %s", (item_archlord_db_id,))
            row = cursor.fetchone()
            if not row:
                print(f"No item found in items_database with id {item_archlord_db_id}")
                return None
            
            if row[4] == None:
                stack = None
            else:
                stack = amount

            # Utwórz słownik z pobranych danych
            item_data_dict = {
                "itemId": row[0],
                "itemTypeKindId": row[1],
                "name": row[2],
                "image_source": row[3],
                "stack": stack
            }


            new_item_id = generate_item_id()

            insert_query = f"INSERT INTO items (archlordItemId, itemId, itemTypeKind, name, imageSource, characterId, stack) VALUES (%s, %s, %s, %s, %s, %s, %s)"
            cursor.execute(insert_query, (item_archlord_db_id, new_item_id, item_data_dict["itemTypeKindId"], item_data_dict["name"], item_data_dict["image_source"], character_id, item_data_dict["stack"]))
            conn.commit()
            print(f"Item created in items with id {new_item_id}")
            updates = [
                {
                    "itemId": new_item_id,
                    "targetTabId": 0  # Przykładowe wartości tab_id i slot_index
                }
            ]
            insert_item_into_first_available_characters_inventory_slot(character_id, updates)
            return new_item_id
        if is_item_stockable == True:
            # Sprawdź, czy przedmiot jest już w ekwipunku
            cursor.execute("SELECT COUNT(*) FROM items WHERE archlordItemId = %s AND characterId = %s", (item_archlord_db_id, character_id))
            is_item_in_inventory = cursor.fetchone()[0] > 0
            if is_item_in_inventory:
                cursor.execute("UPDATE items SET stack = stack + %s WHERE archlordItemId = %s AND characterId = %s", (amount, item_archlord_db_id, character_id))
                conn.commit()
            else:
                # Sprawdź liczbę slotów w character_inventory_slots dla danego character_id
                cursor.execute("SELECT COUNT(*) FROM character_inventory_slots WHERE character_id = %s", (character_id,))
                slot_count = cursor.fetchone()[0]
                if slot_count >= MAX_SLOTS_PER_TAB * MAX_TABS:
                    print(f"Character {character_id} has full inventory ({slot_count} slots). Item not created.")
                    return False

                cursor.execute(f"SELECT itemId, itemTypeKindId, name, image_source, stack FROM items_database WHERE itemId = %s", (item_archlord_db_id,))
                row = cursor.fetchone()
                if not row:
                    print(f"No item found in items_database with id {item_archlord_db_id}")
                    return None
                
                if row[4] > 1:
                    stack = amount
                else:
                    stack = None

                # Utwórz słownik z pobranych danych
                item_data_dict = {
                    "itemId": row[0],
                    "itemTypeKindId": row[1],
                    "name": row[2],
                    "image_source": row[3],
                    "stack": stack
                }


                new_item_id = generate_item_id()

                insert_query = f"INSERT INTO items (archlordItemId, itemId, itemTypeKind, name, imageSource, characterId, stack) VALUES (%s, %s, %s, %s, %s, %s, %s)"
                cursor.execute(insert_query, (item_archlord_db_id, new_item_id, item_data_dict["itemTypeKindId"], item_data_dict["name"], item_data_dict["image_source"], character_id, item_data_dict["stack"]))
                conn.commit()
                print(f"Item created in items with id {new_item_id}")
                updates = [
                    {
                        "itemId": new_item_id,
                        "targetTabId": 0  # Przykładowe wartości tab_id i slot_index
                    }
                ]
                insert_item_into_first_available_characters_inventory_slot(character_id, updates)
                return new_item_id
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return None
    finally:
        conn.close()


def fetch_item_data_from_archlord_db(
    item_id_archlord_db=None,
    item_type_kind_archlord_db=None,
    item_rarity_type_kind_archlord_db=None,
    weapon_type_kind_archlord_db=None,
    armor_type_kind_archlord_db=None
):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        query = "SELECT itemId, itemTypeKindId, itemRarityTypeId, name, image_source, weaponTypeId, armorTypeId, accessoryTypeId, potionTypeId FROM items_database WHERE 1=1"
        params = []
        if item_id_archlord_db is not None:
            query += " AND itemId = %s"
            params.append(item_id_archlord_db)
        if item_type_kind_archlord_db is not None:
            query += " AND itemTypeKindId = %s"
            params.append(item_type_kind_archlord_db)
        if item_rarity_type_kind_archlord_db is not None:
            query += " AND itemRarityTypeId = %s"
            params.append(item_rarity_type_kind_archlord_db)
        if weapon_type_kind_archlord_db is not None:
            query += " AND weaponTypeId = %s"
            params.append(weapon_type_kind_archlord_db)
        if armor_type_kind_archlord_db is not None:
            query += " AND armorTypeId = %s"
            params.append(armor_type_kind_archlord_db)


        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        items = {}
        for row in rows:
            if row[1] == "weapon":
                item_category_row = 5
            elif row[1] == "armor":
                item_category_row = 6
            elif row[1] == "accessory":
                item_category_row = 7
            elif row[1] == "potion":
                item_category_row = 8
            items[row[0]] = {
                "itemTypeKindId": row[1],
                "itemRarityTypeId": row[2],
                "name": row[3],
                "image_source": row[4],
                "itemCategory": row[item_category_row]
            }
        return items
    finally:
        conn.close()



# CHESTS /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\

def load_chests_from_json(json_path="chests.json"):
    """
    Wczytuje dane skrzyń z pliku JSON i zwraca jako listę słowników (format identyczny jak w pliku JSON).
    """
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            chests_data = json.load(f)
        # Jeśli plik zawiera listę, zwróć ją bez zmian
        if isinstance(chests_data, list):
            return chests_data
        # Jeśli plik zawiera słownik, zwróć listę jego wartości
        elif isinstance(chests_data, dict):
            return list(chests_data.values())
        else:
            return []
    except Exception as e:
        print(f"Error loading chests from {json_path}: {e}")
        return []
    

def load_chests_loot_from_json(json_path="chests_loot.json"):
    """
    Wczytuje dane łupów skrzyń z pliku JSON i zwraca jako słownik (format identyczny jak w pliku JSON).
    """
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            chests_loot_data = json.load(f)
        # Jeśli plik zawiera listę, zwróć ją bez zmian
        if isinstance(chests_loot_data, list):
            return {i: item for i, item in enumerate(chests_loot_data)}
        # Jeśli plik zawiera słownik, zwróć go bez zmian
        elif isinstance(chests_loot_data, dict):
            return chests_loot_data
        else:
            return {}
    except Exception as e:
        print(f"Error loading chests loot from {json_path}: {e}")
        return {}
    

def draw_weapon_item_from_chest(chest_id):
    chests_loot = load_chests_loot_from_json()
    chest_data = chests_loot.get(str(chest_id))
    if not chest_data:
        return None

    weapon_dict = chest_data.get("lootItemsType", {}).get("weapon", {})
    if not weapon_dict:
        return None

    weapon_type = random.choice(list(weapon_dict.keys())) # DO MODYFIKACJI SYSTEM LOSOWANIA TYPU WEAPON ZE SŁOWNIKA
    loot_item_rarity_types = chest_data.get("lootItemRarityTypes")
    if isinstance(loot_item_rarity_types, list) and loot_item_rarity_types:
        loot_item_rarity_types = loot_item_rarity_types[0]
    else:
        loot_item_rarity_types = None

    return {weapon_type: loot_item_rarity_types}


def draw_weapon_item_from_items_database(weapon_type, item_rarity_type):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT itemId FROM items_database WHERE weaponTypeId = %s AND itemRarityTypeId = %s",
            (weapon_type, item_rarity_type)
        )
        rows = cursor.fetchall()
        if not rows:
            return None
        return random.choice(rows)[0] # DO MODYFIKACJI SYSTEM LOSOWANIA WEAPON Z BAZY
    finally:
        conn.close()


def draw_elemental_stone_from_chest(chest_id):
    chests_loot = load_chests_loot_from_json()
    chest_data = chests_loot.get(str(chest_id))
    if not chest_data:
        return None
    # Sprawdzenie czy skrzynia zawiera lootMiscTypes i czy zawiera elemental_stone
    elemental_stone_dict = chest_data.get("lootMiscTypes", {}).get("elemental_stone", None)
    if not elemental_stone_dict:
        return None

    elemental_stone_lvl = None
    loot_misc_types = chest_data.get("lootMiscTypes", {})
    if isinstance(loot_misc_types, dict) and "elemental_stone" in loot_misc_types:
        elemental_stone_lvl = loot_misc_types["elemental_stone"]
    else:
        elemental_stone_lvl = None

    return elemental_stone_lvl


def draw_elemental_stone_from_items_database(elemental_stone_lvl):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT itemId FROM items_database WHERE itemTypeKindId = 'elemental_stone' and requiredLvl = %s",
            (elemental_stone_lvl,)
        )
        rows = cursor.fetchall()
        if not rows:
            return None
        return random.choice(rows)[0] # DO MODYFIKACJI SYSTEM LOSOWANIA WEAPON Z BAZY
    finally:
        conn.close()


def draw_combination_material_from_chest(chest_id):
    chests_loot = load_chests_loot_from_json()
    chest_data = chests_loot.get(str(chest_id))
    if not chest_data:
        return None
    # Sprawdzenie czy skrzynia zawiera lootMiscTypes i czy zawiera combination_material
    combination_material_dict = chest_data.get("lootMiscTypes", {}).get("combination_material", None)
    if not combination_material_dict:
        return None

    combination_material = None
    loot_misc_chance = chest_data.get("lootMiscTypes", {})
    if isinstance(loot_misc_chance, dict) and "combination_material" in loot_misc_chance and loot_misc_chance["combination_material"] == 1:
        combination_material = loot_misc_chance["combination_material"]
    else:
        combination_material = None

    return combination_material


def draw_combination_material_from_items_database(combination_material):
    if combination_material is None:
        return None
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT itemId FROM items_database WHERE itemTypeKindId = 'combination_material'"
        )
        rows = cursor.fetchall()
        if not rows:
            return None
        return random.choice(rows)[0] # DO MODYFIKACJI SYSTEM LOSOWANIA WEAPON Z BAZY
    finally:
        conn.close()


def loot_weapon_from_chest(chest_id, character_id):
    weapon_loot_item_type_and_rarity = draw_weapon_item_from_chest(chest_id)
    if weapon_loot_item_type_and_rarity:
        weapon_type = list(weapon_loot_item_type_and_rarity.keys())[0]
        item_rarity_type = weapon_loot_item_type_and_rarity[weapon_type]
        print("weapon type", weapon_type)
        print("item rarity type", item_rarity_type)
        drawn_weapon_item_id = draw_weapon_item_from_items_database(weapon_type, item_rarity_type)
        print("item sample", drawn_weapon_item_id)
        create_item_by_id_from_db(drawn_weapon_item_id, character_id, amount=1)
        return drawn_weapon_item_id
    else:
        print("item sample", None)
        return None
    

def loot_elemental_stone_from_chest(chest_id, character_id):
    elemental_stone_loot_item_lvl = draw_elemental_stone_from_chest(chest_id)
    if elemental_stone_loot_item_lvl:
        print("elemental stone level", elemental_stone_loot_item_lvl)
        drawn_elemental_stone_item_id = draw_elemental_stone_from_items_database(elemental_stone_loot_item_lvl)
        print("item sample", drawn_elemental_stone_item_id)
        create_item_by_id_from_db(drawn_elemental_stone_item_id, character_id, amount=1)
        return drawn_elemental_stone_item_id
    else:
        print("item sample", None)
        return None


def loot_combination_material_from_chest(chest_id, character_id):
    combination_material_loot_item = draw_combination_material_from_chest(chest_id)
    if combination_material_loot_item:
        print("combination material level", combination_material_loot_item)
        drawn_combination_material_item_id = draw_combination_material_from_items_database(combination_material_loot_item)
        print("item sample", drawn_combination_material_item_id)
        create_item_by_id_from_db(drawn_combination_material_item_id, character_id, amount=1)
        return drawn_combination_material_item_id
    else:
        print("item sample", None)
        return None

