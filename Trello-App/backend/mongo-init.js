// mongo-init.js
// This script runs when the MongoDB container is first initialized with a new volume.
// It ensures the 'trello_admin' user is created in the 'admin' database with 'root' privileges,
// allowing access to all databases, including 'trello_db'.

db.getSiblingDB('admin').createUser(
  {
    user: "trello_admin",
    pwd: "mongo_root_password_trello_app", // IMPORTANT: This must match MONGO_ROOT_PASSWORD in your .env file
    roles: [ { role: "root", db: "admin" } ] // Assign 'root' role in 'admin' database for full access
  }
);


