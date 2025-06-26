#!/bin/bash

python mobilfit_backend/manage.py collectstatic --noinput
python mobilfit_backend/manage.py migrate

exec gunicorn mobilfit_backend.wsgi:application \
    --chdir mobilfit_backend \
    --bind 0.0.0.0:8000 \
    --workers 3
