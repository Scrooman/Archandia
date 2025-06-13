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
from db_utils import (
    load_chests_from_json,
    load_chests_loot_from_json,
    loot_weapon_from_chest,
    loot_elemental_stone_from_chest,
    loot_combination_material_from_chest
)


# metoda do pobierania listy skrzyń
def get_chests_list():
    chests_data = load_chests_from_json()
    return jsonify(chests_data), 200


# metoda do pobierania danych łupów skrzyń
def get_chests_loot():
    chests_loot_data = load_chests_loot_from_json()
    return jsonify(chests_loot_data), 200





def open_chest():
    data = request.json
    chest_id = data.get("chest_id")
    character_id = data.get("character_id")
    if chest_id is None or character_id is None:
        return jsonify({"error": "Missing chest_id or character_id in request body"}), 400

    # sprawdzenie czy jest klucz do skrzyni
    chests_data = load_chests_from_json()
    chest_key_id = None
    for chest in chests_data:
        if str(chest.get("chestId")) == str(chest_id):
            required_keys = chest.get("requiredKeys", [])
            if required_keys and isinstance(required_keys, list):
                chest_key_id = required_keys[0].get("keyId")
            break
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute("""SELECT id, stack, itemId FROM items WHERE archlordItemId = %s AND characterId = %s""", (chest_key_id, character_id))
    row = cursor.fetchone()
    if row is None:
        return jsonify({
            "status": {
            "code": 403,
            "message": "You do not have the required key to open this chest"
            },
            "data": None
        }), 403
    # Zmniejsz liczbę kluczy o 1
    if row[1] > 0:
        cursor.execute("""UPDATE items SET stack = stack - 1 WHERE archlordItemId = %s AND characterId = %s""", (chest_key_id, character_id))
        conn.commit()
    if row[1] == 1 or row[1] is None:
        cursor.execute("""DELETE FROM items WHERE id = %s AND characterId = %s""", (row[0], character_id))
        cursor.execute("""DELETE FROM character_inventory_slots WHERE item_id = %s AND character_id = %s""", (row[2], character_id))
        conn.commit()

    drawn_items_ids = []
    drawn_items_ids.append(loot_weapon_from_chest(chest_id, character_id))
    drawn_items_ids.append(loot_elemental_stone_from_chest(chest_id, character_id))
    drawn_items_ids.append(loot_combination_material_from_chest(chest_id, character_id))
    drawn_items_images_source = []
    for item_id in drawn_items_ids:
        if item_id is not None:
            drawn_items_images_source.append(f"images/items/php4img_item_{item_id}.jpg")
        else:
            drawn_items_images_source.append(None)
    return jsonify({"lootId": drawn_items_ids,
                    "lootIdImageSource": drawn_items_images_source}), 200
