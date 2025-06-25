from django.urls import path
from users.views import *

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('email-verify/send/', EmailVerificationSendView.as_view(), name='email_verify_send'),
    path('email-verify/confirm/', EmailVerificationConfirmView.as_view(), name='email_verify_confirm'),
    path("find-id/", FindIDView.as_view(), name="find-id"),
    path("reset-password/", PasswordResetRequestView.as_view(), name="reset-password"),
    path("change-password/", PasswordChangeView.as_view(), name="change-password"),
    path("me/", MeView.as_view(), name="me"),
    path('user/mypage/', MyPageView.as_view(), name='user-mypage'),
]
