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


# metody do obłsugi ekwipunku (inventory)

def get_character_inventory(character_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute("""
        SELECT cis.tab_id, cis.slot_index, i.itemId as item_id, i.name, i.itemTypeKind, i.imageSource, i.stack
        FROM character_inventory_slots cis
        JOIN items i ON cis.item_id = i.itemId
        WHERE cis.character_id = %s
        ORDER BY cis.tab_id, cis.slot_index
    """, (character_id,))
    
    items_in_slots = cursor.fetchall()
    conn.close()

    # Organizacja danych w strukturę { tab_id: [items_in_tab] }
    inventory_data = {tab_id: [] for tab_id in range(MAX_TABS)}
    for item_row in items_in_slots:
        inventory_data[item_row['tab_id']].append(dict(item_row))
        
    return jsonify(inventory_data)


# Metody dotyczące EKWIPUNKU INVENTORY

MAX_SLOTS_PER_TAB = 25
MAX_TABS = 5

def update_character_inventory(character_id):
    data = request.get_json()
    updates = data.get('updates', [])  # Lista zmian

    if not updates:
        return jsonify({"error": "Brak danych do aktualizacji"}), 400

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
            current_slots = {(row['tab_id'], row['slot_index']): row['item_id'] for row in cursor.fetchall()}
            item_to_slot = {row['item_id']: (row['tab_id'], row['slot_index']) for row in cursor.fetchall()}

            final_updates = []
            swaps = []

            for update_action in updates:
                item_id = update_action['itemId']
                target_tab_id = update_action['targetTabId']
                target_slot_index = update_action.get('targetSlotIndex')

                if item_id in processed_item_ids:
                    continue

                # Sprawdź obecne miejsce itemu
                current_place = item_to_slot.get(item_id)

                if target_slot_index is None:
                    # Szukaj pierwszego wolnego slotu
                    occupied_slots = {slot for (tab, slot), iid in current_slots.items() if tab == target_tab_id}
                    found_slot = False
                    for i in range(MAX_SLOTS_PER_TAB):
                        if i not in occupied_slots:
                            target_slot_index = i
                            found_slot = True
                            break
                    if not found_slot:
                        # Brak miejsca, nie ruszamy itemu
                        continue

                # Sprawdź czy slot docelowy jest zajęty przez inny item
                occupying_item = current_slots.get((target_tab_id, target_slot_index))
                if occupying_item and occupying_item != item_id:
                    # Zamiana miejsc
                    # Przesuń obecny item na miejsce źródłowe
                    if current_place:
                        swaps.append({
                            'item_id': occupying_item,
                            'tab_id': current_place[0],
                            'slot_index': current_place[1]
                        })
                    else:
                        # Jeśli nie ma miejsca źródłowego (np. nowy item), nie zamieniamy
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

            # Dodaj zamiany
            for swap in swaps:
                final_updates.append(swap)
                item_to_slot[swap['item_id']] = (swap['tab_id'], swap['slot_index'])
                current_slots[(swap['tab_id'], swap['slot_index'])] = swap['item_id']

            # Usuń stare pozycje tylko dla itemów, które faktycznie zmieniają miejsce
            item_ids_to_clear = [upd['item_id'] for upd in final_updates]
            if item_ids_to_clear:
                placeholders = ','.join('%s' for _ in item_ids_to_clear)
                cursor.execute(
                    f"DELETE FROM character_inventory_slots WHERE character_id = %s AND item_id IN ({placeholders})",
                    (character_id, *item_ids_to_clear)
                )

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
