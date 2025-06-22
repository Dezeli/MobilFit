from django.urls import path
from users.views import *

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('email-verify/send/', EmailVerificationSendView.as_view(), name='email_verify_send'),
    path('email-verify/confirm/', EmailVerificationConfirmView.as_view(), name='email_verify_confirm'),
]
