import random
from django.core.mail import send_mail

def generate_verification_code():
    return str(random.randint(100000, 999999))

def send_verification_email(email, code):
    subject = '[mobilfit] 이메일 인증 코드'
    message = f'인증 코드: {code}'
    send_mail(subject, message, None, [email])
