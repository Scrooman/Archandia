import jwt # type: ignore
from flask import Flask, request, jsonify, render_template
from datetime import datetime, timedelta
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
from flask_login import current_user, login_required
from flask import session
import pprint
from db_utils import (
    get_task_data_from_db,
    get_rewards_for_character_from_db,
    get_manual_id_for_task_from_db,
    get_requirements_data_by_manual_id_from_db,
    update_task_status_in_db,
    update_task_start_and_active_time_in_db,
    update_task_active_time_in_db,
    is_valid_task_and_sequence,
    are_all_requirements_met_for_task,
    create_item_by_id_from_db,
    create_task_for_character_in_db
)
 

def get_character_tasks(character_id):
    print("Fetching tasks for character:", character_id)
    create_task_for_character_in_db(character_id)
    tasks = get_task_data_from_db(character_id, ['Not Started', 'In Progress', 'Completed', 'Cancelled'])
    if tasks:
        formatted_tasks = []
        for task in tasks:
            task_id = task.get("TaskId")
            tasks_rewards = get_rewards_for_character_from_db(task_id)
            formatted_rewards = []
            for reward in tasks_rewards:
                item_id = reward.get("rewardItemId")
                item_image_source = (
                    f"/static/images/items/php4img_item_{item_id}.jpg"
                    if item_id is not None else None
                )
                formatted_reward = {
                    "rewardItemId": item_id,
                    "rewardName": reward.get("rewardName"),
                    "rewardItemAmount": reward.get("rewardItemAmount"),
                    "rewardImageSource": item_image_source
                }
                formatted_rewards.append(formatted_reward)

            manual_id = get_manual_id_for_task_from_db(task_id)
            task_requirements = get_requirements_data_by_manual_id_from_db(manual_id)

            formatted_requirements = []
            for req in task_requirements:
                item_id_required = req.get("ItemIdRequired")
                item_image_source = (
                    f"/static/images/items/php4img_item_{item_id_required}.jpg"
                    if item_id_required is not None else None
                )
                formatted_requirement = {
                    "ItemIdRequired": item_id_required,
                    "ItemNameRequired": req.get("ItemNameRequired"),
                    "ItemAmountRequired": req.get("MinimumItemAmountRequired"),
                    "MinimumItemRarityRequired": req.get("MinimumItemRarityRequired"),
                    "ItemTypeRequired": req.get("ItemTypeRequired"),
                    "ItemImageSource": item_image_source
                }
                formatted_requirements.append(formatted_requirement)

            # Example mapping, adjust field names as needed
            formatted_task = {
                "id": task.get("TaskId"),
                "title": task.get("TaskName"),
                "description": task.get("TaskDescription"),
                "startingEndpoint": task.get("QuestStartingEndpoint"),
                "httpMethod": task.get("QuestStartingMethod"),
                "questAvailableTill": task.get("TaskAvailableToDateTime"),
                "questEndsAt": task.get("TaskActiveToDateTime"),
                "questStartDateTime": task.get("TaskStartDateTime"),
                "questActiveToDateTime": task.get("TaskActiveToDateTime"),
                "questCompletionDateTime": task.get("TaskCompletionDateTime"),
                "wymaganePrzedmioty": formatted_requirements,
                "reward": formatted_rewards
            }

            formatted_tasks.append(formatted_task)
        return jsonify(formatted_tasks), 200
    else:
        return jsonify({"message": "No tasks found for this character"}), 404


# Metoda do rozpoczęcia  zadania
def start_task(task_id):
    try:
        update_task_status_in_db(task_id, "In Progress")
        task_ActiveToDateTime = datetime.now() + timedelta(hours=24)
        update_task_start_and_active_time_in_db(task_id, datetime.now(), task_ActiveToDateTime)
        return jsonify({"status": "ok", "success": True, "message": "Task status updated successfully"}), 200
    except Exception as e:
        return jsonify({"status": "error", "success": False, "error": str(e)}), 500
    

# Metoda do porzucania zadania

def cancel_task(task_id):
    try:
        update_task_status_in_db(task_id, "Cancelled")
        update_task_active_time_in_db(task_id, datetime.now())
        return jsonify({"status": "ok", "success": True, "message": "Task status updated successfully"}), 200
    except Exception as e:
        return jsonify({"status": "error", "success": False, "error": str(e)}), 500
    
    
@login_required
def check_requirements():
    # Pobierz character_id z Flask-Login
    character_id = session.get('character_id') or getattr(current_user, 'id', None)
    if not character_id:
        return jsonify({
            "status": {
                "code": 401,
                "message": "User not authenticated"
            },
            "data": None
        }), 401

    # Pobranie danych z żądania
    data = request.json
    task_id = data.get("taskId")
    requests_sequence = data.get("requestsSequence")

    if not task_id or not requests_sequence:
        return jsonify({
            "status": {
                "code": 400,
                "message": "Missing taskId or requestsSequence in request body"
            },
            "data": None
        }), 400

    request_sequence_check = is_valid_task_and_sequence(task_id, requests_sequence)
    print("Request sequence check result:", request_sequence_check)
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        cursor.execute("SELECT taskType FROM tasks WHERE id = %s", (task_id,))
        row = cursor.fetchone()
        if row:
            task_type = row[0]
            print("Task type:", task_type)
        else:
            print(f"No task found with id {task_id}")
    finally:
        conn.close()

    # do poprawienia funckja sprwdzająca czy inventory nie jest przepełnione
    inventory_available_space_check = True #is_inventory_space_available(character_id, task_id)

    quest_rewards_items = get_rewards_for_character_from_db(task_id)
    print("Quest rewards items:", quest_rewards_items)

    if task_type == "Crafting" and request_sequence_check:
        manual_requirements_check = are_all_requirements_met_for_task(task_id)
        # testowo warunek jest zawsze spełniony
        manual_requirements_check = True
        if request_sequence_check == True and manual_requirements_check and inventory_available_space_check:
            reward_items_ids = []
            reward_items_images_source = []
            for reward in quest_rewards_items:
                print("Reward", reward)
                if reward["rewardItemId"] != "experience": # obsłużyć dodawanie exp i gold w inny sposób
                    create_item_by_id_from_db(reward["rewardItemId"], character_id, reward.get("rewardItemAmount", 1))
                    reward_items_ids.append(reward["rewardItemId"])
            for item_id in reward_items_ids:
                if item_id is not None:
                    reward_items_images_source.append(f"images/items/php4img_item_{item_id}.jpg")
                else:
                    reward_items_images_source.append(None)
            # Jeśli sekwencja jest poprawna i wymagania manualne są spełnione, zwracamy sukces
            conn = get_db_connection()
            cursor = conn.cursor()
            try:
                cursor.execute("UPDATE tasks SET taskStatus = 'Completed', taskActiveToDateTime = NOW(), taskCompletionDateTime = NOW(), isRewardGiven = True, updateDateTime = NOW() WHERE id = %s", (task_id,))
                conn.commit()
                print("Task status updated successfully.")
            except psycopg2.IntegrityError as e:
                conn.rollback()
                return jsonify({"error": "Błąd integralności bazy danych", "details": str(e)}), 500
            except Exception as e:
                print(f"Error: {e}")
            finally:
                conn.close()
            return jsonify({
                "status": {
                    "code": 200,
                    "message": "Quest completed successfully"
                },
                "data": {
                    "rewardId": reward_items_ids,
                    "rewardIdImageSource": reward_items_images_source
                }
            }), 200
        elif request_sequence_check == True and not manual_requirements_check:
            return jsonify({
                "status": {
                    "code": 400,
                    "message": "Manual requirements not met"
                },
                "data": None
            }), 400
        elif request_sequence_check == False:
            # Jeśli sekwencja nie jest poprawna, zwracamy błąd
            return jsonify({
                "status": {
                    "code": 400,
                    "message": "Invalid Requests sequence"
                },
                "data": None
            }), 400
        else:
            return jsonify({
                "status": {
                    "code": 400,
                    "message": "Invalid taskId or requestsSequence"
                },
                "data": None
            }), 400
    # należy dorobić sprawdzenie dla innych taskType