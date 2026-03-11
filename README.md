# placement_portal_application_v2

## Setup & Run

### Prerequisites
- Python 3.10+
- Redis Server

### Installation

```bash
# Create virtual environment
cd backend
python -m venv venv
source venv/bin/activate   # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Run the app
python app.py
```
In separate terminals (with the virtual environment activated) run:

```bash
# start a Celery worker
cd backend
celery -A tasks.celery_app worker --loglevel=info

# start the beat scheduler
celery -A tasks.celery_app beat --loglevel=info
```

Celery will connect to the same Redis instance defined by `REDIS_URL`.