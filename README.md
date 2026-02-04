## LineCheckApp

A shared restaurant inventory tracker. Managers can create inventories, add items, and share access with other users.

# Features

- User authentication (Flask sessions)

- Create inventories and share access by username

- Inventory items CRUD (create, view, update, delete)

- Access control: only inventory members can view/edit items

- Item pagination

# Tech Stack

Flask, SQLAlchemy, Flask-Migrate, Flask-Bcrypt

React (Vite), React Router

SQLite (dev)

# Setup

# Backend:

- cd server
- pip install -r requirements.txt
- flask db upgrade
- flask run -p 5555

# Frontend:

- cd client
- npm install
- npm run dev

# API Routes

# Auth:

- POST /api/signup

- POST /api/login

- DELETE /api/logout

- GET /api/check_session

# Inventories:

- GET /api/inventories

- POST /api/inventories

- POST /api/inventories/:id/members

# Items:

- GET /api/inventories/:id/items?page=1&per_page=10

- POST /api/inventories/:id/items

- PATCH /api/items/:id

- DELETE /api/items/:id

# Authorization

Users can only access inventories they belong to. Items are shared inside an inventory and can only be modified by inventory members.
