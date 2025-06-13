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
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from inventory import get_character_inventory, update_character_inventory
from tasks import get_character_tasks, start_task, cancel_task, check_requirements
from chests import open_chest, get_chests_list, get_chests_loot
from db_utils import (
    get_task_data_from_db,
    get_manual_id_for_task_from_db,
    get_requirements_data_by_manual_id_from_db
)



MAX_SLOTS_PER_TAB = 25
MAX_TABS = 5

"""
$env:FLASK_APP = "Archandia_backend.py"

python -m flask run
"""

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["https://archandia.vercel.app", "http://127.0.0.1:5500"])
app.secret_key = os.getenv("FLASK_SECRET_KEY", "default_secret_key")
SECRET_KEY = "key"

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'  # nazwa funkcji widoku logowania

class User(UserMixin):
    def __init__(self, id):
        self.id = id

    @staticmethod
    def get(user_id):
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT characterId FROM users WHERE characterId = %s", (user_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return User(row[0])
        return None
    
@login_manager.user_loader
def load_user(user_id):
    return User.get(user_id)


app.add_url_rule(
    '/api/character/<string:character_id>/inventory',
    view_func=get_character_inventory,
    methods=['GET']
)

app.add_url_rule(
    '/api/character/<string:character_id>/inventory/update_items',
    view_func=update_character_inventory,
    methods=['POST']
)

app.add_url_rule(
    '/api/character/<string:character_id>/tasks',
    view_func=get_character_tasks,
    methods=['GET']
)

app.add_url_rule(
    '/api/start_task/<task_id>/status',
    view_func=start_task,
    methods=['POST']
)

app.add_url_rule(
    '/api/cancel_task/<task_id>/status',
    view_func=cancel_task,
    methods=['POST']
)

app.add_url_rule(
    '/check_requirements', 
    methods=['POST'], 
    view_func=check_requirements
)

app.add_url_rule(
    '/get_chests_list',
    view_func=get_chests_list,
    methods=['GET']
)

app.add_url_rule(
    '/get_chests_loot',
    view_func=get_chests_loot,
    methods=['GET']
)

app.add_url_rule(
    '/open_chest',
    view_func=open_chest,
    methods=['POST']
)


# Inicjalizacja bazy danych przy pierwszym uruchomieniu
with app.app_context():
    init_db()



# generowanie UUID



def generate_order_id():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        while True:
            new_order_id = generate_base64_uuid()
            cursor.execute("SELECT 1 FROM tasks WHERE orderId = %s", (new_order_id,))
            row = cursor.fetchone()
            if not row:  # Jeśli UUID nie istnieje, zwracamy go
                return new_order_id
    finally:
        conn.close()




def generate_recipe_corelation_id():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        while True:
            new_recipe_corelation_id = generate_base64_uuid()
            cursor.execute("SELECT 1 FROM manuals WHERE recipeCorelationId = %s", (new_recipe_corelation_id,))
            row = cursor.fetchone()
            if not row:  # Jeśli UUID nie istnieje, zwracamy go
                return new_recipe_corelation_id
    finally:
        conn.close()



def generate_base64_uuid():
    uuid_bytes = uuid.uuid4().bytes  # UUID as bytes
    base64_uuid = base64.urlsafe_b64encode(uuid_bytes).decode('utf-8').rstrip('=')
    return base64_uuid.replace('-', '').replace('_', '')[:12]  # Remove '-' and '_'


def generate_token(character_id):
    payload = {
        "characterId": character_id,
        "exp": datetime.utcnow() + timedelta(hours=1)  # Token ważny przez 1 godzinę
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def get_random_item_key(item_dict):
    """
    Zwraca losowy klucz wewnątrz słownika items, czyli np. 'itemTypeKindId', 'itemRarityTypeId', 'name', 'image_source'.
    Funkcja zakłada, że item_dict ma format: {itemId: {...}, ...}
    """
    if not item_dict:
        return None
    # Wybierz losowy itemId
    random_item_id = random.choice(list(item_dict.keys()))
    # Pobierz słownik dla tego itemId
    item_data = item_dict[random_item_id]
    if not isinstance(item_data, dict) or not item_data:
        return None
    # Wybierz losowy klucz z tego słownika
    return random.choice(list(item_data.keys()))

# Funkcja do weryfikacji tokenu
def verify_token(token):
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return decoded["characterId"]
    except jwt.ExpiredSignatureError:
        return None  # Token wygasł
    except jwt.InvalidTokenError:
        return None  # Token nieprawidłowy


# metody do komunikacji w ramach ekranu Quests

@app.route('/', methods=['GET'])
def index():
    return render_template('login.html')


@app.route('/index', methods=['GET'])
@login_required
def main_page():
    return render_template('index.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = request.json if request.is_json else request.form
        name = data.get("name")
        login = data.get("login")
        password = data.get("password")

        if not login or not password or not name:
            return jsonify({"error": "Missing name, login, or password"}), 400

        hashed_pw = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        conn = get_db_connection()
        cursor = conn.cursor()
        while True:
            new_character_id = generate_base64_uuid()
            cursor.execute("SELECT 1 FROM users WHERE characterId = %s", (new_character_id,))
            row = cursor.fetchone()
            if not row:  # Jeśli UUID nie istnieje, zwracamy go
                break
        try:
            cursor.execute("""
            INSERT INTO users (login, characterId, password, updateDatetime, updateUserTypeId, insertDateTime, insertUserTypeId)
            VALUES (%s, %s, %s, datetime('now', 'localtime'), 1, datetime('now', 'localtime'), 1)
            """, (login,
                new_character_id,
                hashed_pw,
            ))
            cursor.execute("""
            INSERT INTO characters (id, name, race, class, lvl, currentExperiencePoints, requiredExperiencePoints, gold, stateId, operationId, localizationId, activeSpawnId, updateDateTime, updateUserTypeId, insertDateTime, insertUserTypeId)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, datetime('now', 'localtime'), 1, datetime('now', 'localtime'), 1)
            """, (new_character_id,
                name,
                "Human",
                "Knight",
                1,
                0,
                100,
                0,
                None,
                None,
                None,
                None
            ))

            conn.commit()
        except sqlite3.IntegrityError:
            return jsonify({"error": "User already exists"}), 409
        finally:
            conn.close()

        return jsonify({"message": "User registered successfully", "characterId": new_character_id}), 201

    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.json if request.is_json else request.form
        login = data.get("login")
        password = data.get("password")

        if not login or not password:
            return jsonify({"error": "Missing login or password"}), 400

        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT characterId, password FROM users WHERE login = %s", (login,))
        row = cursor.fetchone()
        conn.close()
        print(f"Login attempt for user: {login}")
        print("ENCRYPTED PASSWORD:", row[1] if row else "No user found")
        if not row or not bcrypt.checkpw(password.encode(), row[1].encode()):
            return jsonify({"error": "Invalid login or password"}), 401

        user = User(row[0])
        login_user(user)
        session['character_id'] = row[0]
        print(f"User {row[0]} logged in successfully.")

        # Możesz przekierować lub zwrócić token/session info
        return jsonify({"message": "Logged in successfully"}), 200

    # GET: wyświetl stronę logowania
    return render_template('login.html')


@app.route('/logout')
@login_required
def logout():
    logout_user()
    session.clear()
    return jsonify({"message": "Logged out"}), 200



@app.route('/get_manual', methods=['GET'])
@login_required
def get_manual():
    # character_id pobierany z current_user
    character_id = current_user.id

    # Pobranie aktywnych zadań dla character_id
    active_tasks = get_task_data_from_db(character_id, ['Not Started', 'In Progress'])
    if not active_tasks:
        return jsonify({
            "status": {
                "code": 404,
                "message": "No active tasks found for the character"
            },
            "data": None
        }), 404

    # Przygotowanie odpowiedzi z danymi ManualId i Blacksmith
    response_data = {}
    for task in active_tasks:
        print(f"Processing task: {task.get('TaskId')}")
        manual_id = get_manual_id_for_task_from_db(task.get("TaskId"))
        if manual_id:
            print(f"Found manual_id: {manual_id} for task: {task.get('TaskId')}")
            manual_data = get_manual_data_from_db(manual_id, request.args.get('ItemCategory'), request.args.get('ItemName'))
            if manual_data:
                print(f"Found manual data: {manual_data}")
                blacksmith_data_list = get_blacksmith_data_from_db(manual_id)
                available_blacksmiths = []
                if blacksmith_data_list:
                    for blacksmith_data in blacksmith_data_list:
                        available_blacksmiths.append({
                            "blacksmithId": blacksmith_data.get("BlacksmithId"),
                            "blacksmithLocalization": blacksmith_data.get("BlacksmithLocalization")
                        })
                response_data = {
                    "manualId": manual_data.get("Id"),
                    "availableBlacksmiths": available_blacksmiths
                }
                break  # Exit the loop once a valid response is found

    if not response_data:
        return jsonify({
            "status": {
                "code": 404,
                "message": "No matching manual or blacksmith data found"
            },
            "manualData": None
        }), 404

    return jsonify({
        "status": {
            "code": 200,
            "message": "Success"
        },
        "manualData": response_data
    }), 200




@app.route('/post_order/<blacksmith_localization>', methods=['POST'])
@login_required
def post_order_with_localization(blacksmith_localization):
    # character_id pobierany z current_user
    character_id = current_user.id

    # Pobierz ManualId i BlacksmithId z parametrów URL
    manual_id = request.args.get("ManualId")
    blacksmith_id = request.args.get("BlacksmithId")

    if not manual_id or not blacksmith_id:
        return jsonify({
            "status": {
                "code": 400,
                "message": "Missing ManualId or BlacksmithId in query parameters"
            },
            "data": None
        }), 400

    # Pobranie aktywnych zadań dla character_id
    active_tasks = get_task_data_from_db(character_id, ['Not Started', 'In Progress'])
    if active_tasks:
        expected_manual_id = get_manual_id_for_task_from_db(active_tasks[0].get("TaskId"))
    else:
        return jsonify({
            "status": {
                "code": 404,
                "message": "No active tasks found for the character"
            },
            "data": None
        }), 404

    if manual_id != expected_manual_id:
        return jsonify({
            "status": {
                "code": 400,
                "message": "Invalid manualId"
            },
            "data": None
        }), 400

    blacksmith_data_list = get_blacksmith_data_from_db(manual_id)
    found = False
    for blacksmith_data in blacksmith_data_list:
        if (blacksmith_data.get("BlacksmithId") == blacksmith_id and
            blacksmith_data.get("BlacksmithLocalization", "").lower() == blacksmith_localization.lower()):
            found = True
            break

    if not found:
        return jsonify({
            "status": {
                "code": 404,
                "message": "No matching blacksmith for given localization and id"
            },
            "data": None
        }), 404
    
    task_id = active_tasks[0].get("TaskId")
    order_id = generate_order_id()

    update_order_id_in_db(task_id, order_id)

    currentDate = datetime.now()
    recipe_corelation_id = generate_recipe_corelation_id() 
    update_recipe_corelation_id_in_db(manual_id, recipe_corelation_id)

    requirements_data = get_requirements_data_by_manual_id_from_db(manual_id)

    # Przekształcenie requirements_data do słownika z kluczem itemName
    requirements_dict = {}
    for req in requirements_data:
        item_name = req.get("ItemNameRequired")
        if item_name:
            requirements_dict[item_name] = {
                "itemRarity": req.get("MinimumItemRarityRequired"),
                "itemType": req.get("ItemTypeRequired"),
                "amount": req.get("MinimumItemAmountRequired")
            }

    return jsonify({
        "status": {
            "code": 200,
            "message": "Order processed successfully"
        },
        "data": {
            "orderId": order_id,
            "recipeCorelationId": recipe_corelation_id,
            "requirements": requirements_dict
        }
    }), 200






# Funkcje do tworzenia danych w bazie danych



# funkcje pobierania danych z bazy danych




def get_manual_data_from_db(manual_id, item_category, item_name):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    try:
        cursor.execute("SELECT * FROM manuals WHERE id = %s AND itemCategory = %s AND itemName = %s", (manual_id, item_category, item_name))
        row = cursor.fetchone()
        if row:
            return {
                "Id": row[0],
                "Status": row[1],
                "ItemName": row[2],
                "ItemType": row[3],
                "ItemCategory": row[4],
                "ActiveToDate": row[5],
                "InsertDateTime": row[6]
            }
        else:
            return None
    finally:
        conn.close()


def get_blacksmith_data_from_db(manual_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    try:
        cursor.execute("SELECT * FROM blacksmiths WHERE manualId = %s", (manual_id,))
        row = cursor.fetchone()
        blacksmiths_list = []
        # Pobieranie wszystkich czarowników dla danego manualId
        while row:
            blacksmiths_list.append({
                "BlacksmithId": row[0],
                "ManualId": row[1],
                "BlacksmithLocalization": row[2],
                "InsertDateTime": row[3]
            })
            row = cursor.fetchone()
        return blacksmiths_list
    finally:
        conn.close()




def get_armor_type_kind_id_by_armor_part(armor_part):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        cursor.execute("SELECT id FROM armor_type_kinds WHERE armorPart = %s", (armor_part,))
        rows = cursor.fetchall()
        return [row[0] for row in rows]
    finally:
        conn.close()



# Funkcje aktualizacji danych w bazie danych

def update_order_id_in_db(task_id, order_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE tasks SET orderId = %s, updateDatetime = datetime('now', 'localtime') WHERE id = %s", (order_id, task_id))
        conn.commit()
        print("Order ID updated successfully.")
    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()


def update_recipe_corelation_id_in_db(manual_id, recipe_corelation_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE manuals SET recipeCorelationId = %s, updateDatetime = datetime('now', 'localtime') WHERE id = %s", (recipe_corelation_id, manual_id))
        conn.commit()
        print("Recipe corelation ID updated successfully.")
    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

"""
$env:FLASK_APP = "Archandia_backend.py"

python -m flask run
"""