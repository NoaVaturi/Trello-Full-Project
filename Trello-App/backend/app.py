from flask import Flask, request, jsonify
from flask_cors import CORS
from bson import ObjectId
import jwt
from functools import wraps
from pymongo import MongoClient
import datetime
import os
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import sys


app = Flask(__name__)
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*"}}, methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"])
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'secret')

# Initialize collections as None to support test mocking
client = None
db = None
boards_collection = None
lists_collection = None
cards_collection = None
users_collection = None

# Only connect to Mongo if not in unit test mode
if os.environ.get("FLASK_ENV") != "test":
    db_name = os.environ.get('DATABASE_NAME')
    mongo_username = os.environ.get('MONGO_ROOT_USERNAME')
    mongo_password = os.environ.get('MONGO_ROOT_PASSWORD')
    mongo_auth_db = os.environ.get('MONGO_AUTH_DB', 'admin')

    mongo_uri = f"mongodb://{mongo_username}:{mongo_password}@mongodb:27017/{db_name}?authSource={mongo_auth_db}"

    if not mongo_uri or not db_name:
        print("FATAL: missing MONGO_URI or DATABASE_NAME")
        sys.exit(1)

    try:
        client = MongoClient(
            mongo_uri,
            username=mongo_username,
            password=mongo_password,
            authSource=mongo_auth_db
        )
        client.admin.command('ping')
        print("MongoDB connected successfully")
        db = client[db_name]
        boards_collection = db['boards']
        lists_collection = db['lists']
        cards_collection = db['cards']
        users_collection = db['users']
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        sys.exit(1)
else:
    print("Unit test mode detected — skipping DB connection")


# Token decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split()[1]
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = users_collection.find_one({'_id': ObjectId(data['user_id'])})
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

def populate_default_work_board(board_id, user_id):
    work_lists = {
        "Projects": [
            {"title": "Trello Clone", "githubUrl": "https://github.com/example/trello-clone"},
            {"title": "DevOps Pipeline", "githubUrl": "https://github.com/example/devops-pipeline"}
        ],
        "To Do": ["Write documentation"],
        "In Progress": ["Set up CI/CD"],
        "Done": ["Initial commit"],
        "Questions": ["Clarify backend API schema"]
    }

    # Assign positions during initial population
    for idx, (list_title, cards) in enumerate(work_lists.items()):
        list_id = lists_collection.insert_one({
            'title': list_title,
            'board_id': str(board_id),
            'position': idx # Assign position
        }).inserted_id

        if list_title == "Projects":
            for card in cards:
                # Create sub-board for each project card
                sub_board_id = boards_collection.insert_one({
                    'name': f"{card['title']} - Tasks",
                    'user_id': user_id
                }).inserted_id

                # Create default lists in the sub-board
                for sub_list_idx, sub_list_title in enumerate(["To Do", "In Progress", "Done"]):
                    lists_collection.insert_one({
                        'board_id': str(sub_board_id),
                        'title': sub_list_title,
                        'position': sub_list_idx # Assign position to sub-lists
                    })

                # Insert the project card with sub_board_id and initial progress = 0
                cards_collection.insert_one({
                    'title': card['title'],
                    'type': 'project-card',
                    'githubUrl': card['githubUrl'],
                    'list_id': str(list_id),
                    'sub_board_id': str(sub_board_id),
                    'progress': 0
                })
        else:
            for card_title in cards:
                cards_collection.insert_one({
                    'title': card_title,
                    'list_id': str(list_id)
                })

def populate_default_personal_board(board_id):
    personal_lists = {
        "To Do": ["Buy groceries", "Call mom"],
        "Grocery": ["Milk", "Bread", "Eggs"],
        "Calendar": ["Doctor appointment"],
        "Done": []
    }

    # Assign positions during initial population
    for idx, (list_title, cards) in enumerate(personal_lists.items()):
        list_id = lists_collection.insert_one({
            'title': list_title,
            'board_id': str(board_id),
            'position': idx # Assign position
        }).inserted_id

        for card_title in cards:
            cards_collection.insert_one({
                'title': card_title,
                'list_id': str(list_id)
            })                

def update_project_card_progress(sub_board_id):
    sub_lists = list(lists_collection.find({'board_id': str(sub_board_id)}))
    sub_list_ids = [str(sl['_id']) for sl in sub_lists]
    done_list_ids = [str(sl['_id']) for sl in sub_lists if sl.get('title', '').strip().lower() == 'done']
    sub_cards = list(cards_collection.find({'list_id': {'$in': sub_list_ids}}))
    total_tasks = len(sub_cards)
    done_tasks = sum(1 for sc in sub_cards if sc['list_id'] in done_list_ids)
    progress = int((done_tasks / total_tasks) * 100) if total_tasks > 0 else 0
    result = cards_collection.update_one({'sub_board_id': str(sub_board_id)}, {'$set': {'progress': progress}})
    print(f"[Progress Update] Sub-board: {sub_board_id}, Progress: {progress}%")
    return result.modified_count  

def maybe_update_project_progress(board_id):
    parent_project_card = cards_collection.find_one({'sub_board_id': str(board_id)})
    if parent_project_card:
        update_project_card_progress(parent_project_card['sub_board_id'])     

# --- Authentication Routes ---

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400

    if users_collection.find_one({'username': username}):
        return jsonify({'message': 'Username already exists'}), 409

    hashed_password = generate_password_hash(password, method='sha256')
    user_id = users_collection.insert_one({'username': username, 'password': hashed_password}).inserted_id

    boards = [
        {'title': 'Work', 'user_id': str(user_id)},
        {'title': 'Personal', 'user_id': str(user_id)}
    ]
    board_ids = boards_collection.insert_many(boards).inserted_ids
    work_board_id, personal_board_id = board_ids
    populate_default_work_board(work_board_id, str(user_id))
    populate_default_personal_board(personal_board_id)

    token = jwt.encode({
        'user_id': str(user_id),
        'exp': datetime.utcnow() + timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm="HS256")

    return jsonify({'token': token})


@app.route('/login', methods=['POST'])
def login():
    print("/login endpoint triggered")
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    print("Username from frontend:", username)
    print("Password from frontend:", password)

    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400

    user = users_collection.find_one({'username': username})
    print("User in DB:", user)
    if user:
        print("Stored hashed password:", user['password'])
        print("Password check result:", check_password_hash(user['password'], password))

    if not user or not check_password_hash(user['password'], password):
        return jsonify({'message': 'Invalid credentials'}), 401

    token = jwt.encode({
        'user_id': str(user['_id']),
        'exp': datetime.utcnow() + timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm="HS256")

    return jsonify({'token': token})

# --- Board, List, Card Management Routes ---

# Boards
@app.route('/boards', methods=['GET'])
@token_required
def get_boards(current_user):
    user_id = str(current_user['_id'])
    boards = list(boards_collection.find({'user_id': user_id}))
    filtered_boards = []

    for board in boards:
        # Filter only Work and Personal boards on main page
        if board.get('title', board.get('name', '')).strip().lower() not in ['work', 'personal']:
            continue

        board['_id'] = str(board['_id'])
        if 'name' in board:
            board['title'] = board.pop('name')

        lists = list(lists_collection.find({'board_id': board['_id']}))
        for lst in lists:
            lst['_id'] = str(lst['_id'])
            cards = list(cards_collection.find({'list_id': lst['_id']}))
            for card in cards:
                card['_id'] = str(card['_id'])
            lst['cards'] = cards
        board['lists'] = lists

        filtered_boards.append(board)

    return jsonify(filtered_boards), 200

@app.route('/boards', methods=['POST'])
@token_required
def create_board(current_user):
    data = request.get_json()
    name = data.get('name')
    if not name:
        return jsonify({'message': 'Board name is required'}), 400
    user_id = str(current_user['_id'])
    board_id = boards_collection.insert_one({'name': name, 'user_id': user_id}).inserted_id

    # Ensure default Work board population
    if name.strip().lower() in ['work', 'work board']:
        populate_default_work_board(board_id, user_id)

    return jsonify({'_id': str(board_id), 'name': name, 'user_id': user_id}), 201



@app.route('/boards/<board_id>', methods=['GET'])
@token_required
def get_board_details(current_user, board_id):
    try:
        board = boards_collection.find_one({'_id': ObjectId(board_id)})
        if not board:
            return jsonify({'message': 'Board not found'}), 404

        lists = list(lists_collection.find({'board_id': board_id}))
        list_id_map = {}
        for l in lists:
            l['_id'] = str(l['_id'])
            l['cards'] = []
            list_id_map[l['_id']] = l

        cards = list(cards_collection.find({'list_id': {'$in': list(list_id_map.keys())}}))
        for c in cards:
            c['_id'] = str(c['_id'])
            c['list_id'] = str(c['list_id'])

            if c.get('type') == 'project-card' and c.get('sub_board_id'):
                sub_board_id = c['sub_board_id']
                sub_lists = list(lists_collection.find({'board_id': sub_board_id}))
                sub_list_ids = [str(sl['_id']) for sl in sub_lists]
                done_list_ids = [str(sl['_id']) for sl in sub_lists if sl.get('title', '').strip().lower() == 'done']

                sub_cards = list(cards_collection.find({'list_id': {'$in': sub_list_ids}}))
                total_tasks = len(sub_cards)
                done_tasks = sum(1 for sc in sub_cards if str(sc.get('list_id')) in done_list_ids)

                c['progress'] = int((done_tasks / total_tasks) * 100) if total_tasks > 0 else 0

            if c.get('sub_board_id'):
                c['subBoardId'] = str(c.pop('sub_board_id'))

            if c['list_id'] in list_id_map:
                list_id_map[c['list_id']]['cards'].append(c)

        for l in lists:
            l['cards'].sort(key=lambda x: x.get('position', 0))

        board['_id'] = str(board['_id'])
        board['lists'] = lists

        return jsonify(board), 200

    except Exception as e:
        return jsonify({'message': f'Error fetching board: {str(e)}'}), 500

@app.route('/lists', methods=['GET'])
@token_required
def get_lists(current_user):
    """
    Fetch all lists for a given board, if the user owns the board.
    Example: GET /lists?board_id=xxxx
    """
    board_id = request.args.get('board_id')
    if not board_id:
        return jsonify({'message': 'Missing board_id parameter'}), 400

    # Check if the board exists and belongs to the user
    board = boards_collection.find_one({"_id": ObjectId(board_id)})

    if not board:
        return jsonify({'message': 'Board not found or unauthorized'}), 404

    lists = list(lists_collection.find({'board_id': board_id}))
    for lst in lists:
        lst['_id'] = str(lst['_id'])
    return jsonify(lists), 200

@app.route('/cards', methods=['GET'])
@token_required
def get_cards(current_user):
    list_id = request.args.get('list_id')
    if not list_id:
        return jsonify({'message': 'Missing list_id'}), 400

    cards = list(cards_collection.find({'list_id': list_id}))
    for card in cards:
        card['_id'] = str(card['_id'])
        if card.get('sub_board_id'):
            card['subBoardId'] = str(card.pop('sub_board_id'))

    return jsonify(cards), 200


# Lists
@app.route('/boards/<board_id>/lists', methods=['POST'])
@token_required
def create_list(current_user, board_id):
    """
    Create a new list within a board.
    Expects JSON: {"title": "...", "type": "regular" or "project"}
    """
    data = request.get_json()
    title = data.get('title')
    list_type = data.get('type', 'regular') # Default to 'regular'
    progress = data.get('progress', 0) # Only relevant for project type lists, default to 0

    if not title:
        return jsonify({'message': 'List title is required'}), 400

    board = boards_collection.find_one({"_id": ObjectId(board_id)})
    if not board:
        return jsonify({'message': 'Board not found or unauthorized'}), 404

    # Determine the next position for the new list
    existing_lists = lists_collection.find({'board_id': board_id}).sort('position', -1)
    # Get the highest existing position, or -1 if no lists exist, then add 1
    next_position = (existing_lists[0]['position'] + 1) if existing_lists and 'position' in existing_lists[0] else 0

    list_id = lists_collection.insert_one({
        'board_id': board_id,
        'title': title,
        'type': list_type,
        'cards': [],
        'position': next_position, # Assign the calculated position
        **( {'progress': progress} if list_type == 'project' else {} )
    }).inserted_id

    new_list_data = {
        '_id': str(list_id),
        'board_id': board_id,
        'title': title,
        'type': list_type,
        'cards': [], # No cards inserted with new list
        'position': next_position, # Include position in the response
        **( {'progress': progress} if list_type == 'project' else {} )
    }
    return jsonify(new_list_data), 201

# Cards
@app.route('/lists/<list_id>/cards', methods=['POST'])
@token_required
def create_card(current_user, list_id):
    try:
        data = request.get_json(force=True)  
        print(data)  
        title = data.get('title')
        card_type = data.get('type', 'card')
        github_url = data.get('githubUrl')
        progress = data.get('progress')
        
        if not title and card_type not in ['github-repo', 'project-card']:
            return jsonify({'message': 'Card title is required for this type'}), 400
        if card_type == 'github-repo' and not github_url:
            return jsonify({'message': 'GitHub URL is required for this card type'}), 400

        # Verify list exists and belongs to the user
        list_obj = lists_collection.find_one({'_id': ObjectId(list_id)})
        if not list_obj:
            return jsonify({'message': 'List not found'}), 404

        board = boards_collection.find_one({'_id': ObjectId(list_obj['board_id'])})
        if not board:
            return jsonify({'message': 'Unauthorized to add card to this list'}), 401

        new_card_data = {
            'list_id': str(list_id),
            'title': title,
            'type': card_type
        }

        if card_type == 'github-repo':
            new_card_data['githubUrl'] = github_url

        if card_type == 'project-card':
            new_card_data['githubUrl'] = github_url
            new_card_data['progress'] = progress if progress is not None else 0

            new_sub_board_id = boards_collection.insert_one({
                'name': f"{title} - Tasks",
                'user_id': str(current_user['_id']),
                'lists': []
            }).inserted_id

            new_card_data['sub_board_id'] = str(new_sub_board_id)

            for sub_list_idx, sub_list_title in enumerate(['To Do', 'In Progress', 'Done']):
                lists_collection.insert_one({
                    'board_id': str(new_sub_board_id),
                    'title': sub_list_title,
                    'type': 'regular',
                    'cards': [],
                    'position': sub_list_idx # Assign position to sub-lists
                })

        existing_cards = list(cards_collection.find({'list_id': str(list_id)}).sort('position', -1))
        next_position = existing_cards[0]['position'] + 1 if existing_cards and 'position' in existing_cards[0] else 0

        new_card_data['position'] = next_position        

        card_id = cards_collection.insert_one(new_card_data).inserted_id

        new_card_data['_id'] = str(card_id)
        if 'sub_board_id' in new_card_data:
            new_card_data['subBoardId'] = new_card_data.pop('sub_board_id')

        return jsonify(new_card_data), 201

    except Exception as e:
        return jsonify({'message': f'Error adding card: {str(e)}'}), 500

@app.route('/lists/reorder', methods=['PATCH'])
@token_required
def reorder_lists(current_user):
    try:
        data = request.get_json(force=True)
        reordered_list_ids = data.get('reorderedListIds')

        if not reordered_list_ids or not isinstance(reordered_list_ids, list):
            return jsonify({'message': 'reorderedListIds (list) required'}), 400

        # Optional: Validate ownership of each list to prevent unauthorized reordering
        user_board_ids = set(b['_id'] for b in boards_collection.find({}, {'_id': 1}))
        for list_id in reordered_list_ids:
            lst = lists_collection.find_one({'_id': ObjectId(list_id)})
            if not lst or ObjectId(lst['board_id']) not in user_board_ids:
                return jsonify({'message': f'Unauthorized or missing list: {list_id}'}), 403

        for idx, list_id in enumerate(reordered_list_ids):
            lists_collection.update_one({'_id': ObjectId(list_id)}, {'$set': {'position': idx}})

        return jsonify({'message': 'Lists reordered successfully'}), 200

    except Exception as e:
        return jsonify({'message': f'Error reordering lists: {str(e)}'}), 500


@app.route('/cards/<card_id>', methods=['PUT'])
@token_required
def move_card(current_user, card_id):
    data = request.get_json()
    new_list_id = data.get('new_list_id')
    to_position = data.get('to_position')

    if not new_list_id:
        return jsonify({'message': 'New list ID is required'}), 400

    card = cards_collection.find_one({'_id': ObjectId(card_id)})
    if not card:
        return jsonify({'message': 'Card not found'}), 404

    current_list = lists_collection.find_one({'_id': ObjectId(card['list_id'])})
    new_list = lists_collection.find_one({'_id': ObjectId(new_list_id)})

    if not current_list or not new_list:
        return jsonify({'message': 'List not found'}), 404

    current_board = boards_collection.find_one({'_id': ObjectId(current_list['board_id'])})
    new_board = boards_collection.find_one({'_id': ObjectId(new_list['board_id'])})

    if not current_board or not new_board:
        return jsonify({'message': 'Unauthorized'}), 401

    # Fetch cards in the target list sorted by position
    cards_in_target_list = list(cards_collection.find({'list_id': new_list_id}).sort('position', 1))

    # Ensure all cards have position fields
    for idx, c in enumerate(cards_in_target_list):
        if 'position' not in c:
            cards_collection.update_one({'_id': c['_id']}, {'$set': {'position': idx}})
            c['position'] = idx

    # Remove the card if already in the list
    cards_in_target_list = [c for c in cards_in_target_list if str(c['_id']) != card_id]

    # Insert at the correct position
    insert_position = to_position if isinstance(to_position, int) and to_position >= 0 else len(cards_in_target_list)
    insert_position = min(insert_position, len(cards_in_target_list))

    card['list_id'] = new_list_id
    cards_in_target_list.insert(insert_position, card)

    # Update all cards with correct positions
    for idx, c in enumerate(cards_in_target_list):
        cards_collection.update_one({'_id': c['_id']}, {
            '$set': {
                'position': idx,
                'list_id': new_list_id
            }
        })

   
    maybe_update_project_progress(new_board['_id'])

    return jsonify({'message': 'Card moved successfully and progress updated if applicable'}), 200

@app.route('/cards/<card_id>', methods=['PATCH'])
@token_required
def update_card(current_user, card_id):
    data = request.get_json()
    updates = {}
    if 'title' in data:
        updates['title'] = data['title']
    if 'githubUrl' in data:
        updates['githubUrl'] = data['githubUrl']
    if 'progress' in data: # Added to handle progress updates from frontend
        updates['progress'] = data['progress']
    
    if updates:
        cards_collection.update_one({'_id': ObjectId(card_id)}, {'$set': updates})
    
    # If the card being updated is a project card, recalculate its progress
    card = cards_collection.find_one({'_id': ObjectId(card_id)})
    if card and card.get('type') == 'project-card' and card.get('sub_board_id'):
        update_project_card_progress(card['sub_board_id'])

    return jsonify({'message': 'Card updated successfully'})

@app.route('/cards/<card_id>/reorder', methods=['PATCH'])
@token_required
def reorder_card(current_user, card_id):
    data = request.get_json()
    new_position = data.get('new_position')
    new_list_id = data.get('new_list_id')

    if new_position is None or not isinstance(new_position, int) or new_position < 0:
        return jsonify({'message': 'A valid new_position integer is required'}), 400

    card = cards_collection.find_one({'_id': ObjectId(card_id)})
    if not card:
        return jsonify({'message': 'Card not found'}), 404

    current_list_id = card['list_id']
    target_list_id = new_list_id if new_list_id else current_list_id

    cards_in_target_list = list(cards_collection.find({'list_id': target_list_id}).sort('position', 1))
    for idx, c in enumerate(cards_in_target_list):
        if 'position' not in c or not isinstance(c['position'], int):
            cards_collection.update_one({'_id': c['_id']}, {'$set': {'position': idx}})
            c['position'] = idx

    cards_in_target_list = [c for c in cards_in_target_list if str(c['_id']) != card_id]
    insert_position = min(new_position, len(cards_in_target_list))
    card['list_id'] = target_list_id
    cards_in_target_list.insert(insert_position, card)

    for idx, c in enumerate(cards_in_target_list):
        cards_collection.update_one({'_id': c['_id']}, {
            '$set': {
                'position': idx,
                'list_id': target_list_id
            }
        })

    # ✅ Progress update if inside sub-board of a project-card
    list_obj = lists_collection.find_one({'_id': ObjectId(target_list_id)})
    if list_obj:
        maybe_update_project_progress(list_obj['board_id'])

    return jsonify({'message': 'Card reordered and moved successfully'}), 200


# --- Health Check ---
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'Flask backend is running!'}), 200

# --- Run the App ---
if __name__ == '__main__':
    # Ensure unique index for usernames
    users_collection.create_index("username", unique=True)
    app.run(debug=True, host="0.0.0.0", port=5000)

@app.route('/boards/<board_id>', methods=['PUT'])
@token_required
def update_board_structure(current_user, board_id):
    data = request.get_json()
    if not isinstance(data, list):
        return jsonify({'message': 'Invalid payload, expecting a list of lists with cards'}), 400

    board = boards_collection.find_one({"_id": ObjectId(board_id)})
    if not board:
        return jsonify({'message': 'Board not found or unauthorized'}), 404

    # Remove existing lists and their cards
    existing_lists = list(lists_collection.find({'board_id': board_id}))
    for lst in existing_lists:
        cards_collection.delete_many({'list_id': str(lst['_id'])})
    lists_collection.delete_many({'board_id': board_id})

    # Insert new lists and cards
    for list_data in data:
        new_list = {
            'board_id': board_id,
            'title': list_data.get('title', 'Untitled'),
            'type': 'regular'
        }
        list_id = lists_collection.insert_one(new_list).inserted_id

        for card in list_data.get('cards', []):
            new_card = {
                'list_id': str(list_id),
                'title': card.get('title', 'Untitled'),
                'type': 'card'
            }
            cards_collection.insert_one(new_card)

    return jsonify({'message': 'Board structure updated successfully'}), 200


@app.route('/cards/<card_id>', methods=['DELETE'])
@token_required
def delete_card(current_user, card_id):
    try:
        card = cards_collection.find_one({'_id': ObjectId(card_id)})
        if not card:
            return jsonify({'message': 'Card not found'}), 404

        list_obj = lists_collection.find_one({'_id': ObjectId(card['list_id'])})
        if not list_obj:
            return jsonify({'message': 'List not found'}), 404

        board = boards_collection.find_one({'_id': ObjectId(list_obj['board_id'])})
        if not board:
            return jsonify({'message': 'Unauthorized'}), 401

        cards_collection.delete_one({'_id': ObjectId(card_id)})

        maybe_update_project_progress(board['_id'])

        return jsonify({'message': 'Card deleted successfully'}), 200

    except Exception as e:
        return jsonify({'message': f'Error deleting card: {str(e)}'}), 500
    
@app.route('/lists/<list_id>', methods=['DELETE'])
@token_required
def delete_list(current_user, list_id):
    try:
        list_obj = lists_collection.find_one({'_id': ObjectId(list_id)})
        if not list_obj:
            return jsonify({'message': 'List not found'}), 404

        board = boards_collection.find_one({'_id': ObjectId(list_obj['board_id'])})
        if not board:
            return jsonify({'message': 'Unauthorized'}), 401

        # Delete all cards within the list
        cards_collection.delete_many({'list_id': list_id})
        # Delete the list itself
        lists_collection.delete_one({'_id': ObjectId(list_id)})

        return jsonify({'message': 'List deleted successfully'}), 200

    except Exception as e:
        return jsonify({'message': f'Error deleting list: {str(e)}'}), 500    
    
@app.route('/lists/<list_id>', methods=['PATCH'])
@token_required
def rename_list(current_user, list_id):
    try:
        data = request.get_json()
        new_title = data.get('title')
        if not new_title:
            return jsonify({'message': 'New title is required'}), 400

        list_obj = lists_collection.find_one({'_id': ObjectId(list_id)})
        if not list_obj:
            return jsonify({'message': 'List not found'}), 404

        board = boards_collection.find_one({'_id': ObjectId(list_obj['board_id'])})
        if not board:
            return jsonify({'message': 'Unauthorized'}), 401

        lists_collection.update_one({'_id': ObjectId(list_id)}, {'$set': {'title': new_title}})
        return jsonify({'message': 'List renamed successfully'}), 200

    except Exception as e:
        return jsonify({'message': f'Error renaming list: {str(e)}'}), 500

