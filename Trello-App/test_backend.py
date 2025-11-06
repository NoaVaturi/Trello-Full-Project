import unittest
import os
from unittest.mock import patch, MagicMock

class TestAuthRoutes(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from backend.app import app
        cls.app = app.test_client()
        cls.app.testing = True

    @patch('backend.app.cards_collection')
    @patch('backend.app.lists_collection')
    @patch('backend.app.boards_collection')
    @patch('backend.app.users_collection')
    def test_signup(self, mock_users_collection, mock_boards_collection, mock_lists_collection, mock_cards_collection):
        mock_users_collection.find_one.return_value = None
        mock_users_collection.insert_one.return_value = MagicMock(inserted_id='12345')

        mock_boards_collection.insert_many.return_value = MagicMock(inserted_ids=['board1', 'board2'])

        mock_lists_collection.insert_one.return_value = MagicMock(inserted_id='list1')
        mock_lists_collection.find.return_value = []

        mock_cards_collection.insert_one.return_value = MagicMock(inserted_id='card1')
        mock_cards_collection.find.return_value = []
        mock_cards_collection.update_one.return_value = MagicMock(modified_count=1)

        payload = {"username": "testuser", "password": "testpass"}
        response = self.app.post('/signup', json=payload)

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"token", response.data)

    @patch('backend.app.users_collection')
    def test_login(self, mock_users_collection):
        from werkzeug.security import generate_password_hash
        hashed_password = generate_password_hash('testpass')
        mock_users_collection.find_one.return_value = {
            "_id": "12345",
            "username": "testuser",
            "password": hashed_password
        }

        payload = {"username": "testuser", "password": "testpass"}
        response = self.app.post('/login', json=payload)

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"token", response.data)

if __name__ == '__main__':
    unittest.main()
