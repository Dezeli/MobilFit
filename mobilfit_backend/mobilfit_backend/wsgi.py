import os
from decouple import config
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", config("DJANGO_SETTINGS_MODULE", default="mobilfit_backend.settings.dev"))

application = get_wsgi_application()
