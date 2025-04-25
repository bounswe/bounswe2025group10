from .settings import *

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'test_db',
        'USER': 'root',
        'PASSWORD': '123456789',
        'HOST': 'backend-db-1',
        'PORT': '3306',
    }
}