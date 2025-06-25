from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from users.serializers import *
from utils.response import success_response, error_response
from utils.masking import mask_username
from utils.password import generate_temp_password
from rest_framework_simplejwt.views import TokenRefreshView as SimpleJWTRefreshView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from decouple import config

User = get_user_model()

class SignupView(APIView):
    def post(self, request):
        serializer = UserSignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(success_response(
                result={"username": user.username, "nickname": user.nickname},
                message="회원가입이 완료되었습니다."
            ))

        first_error_message = next(iter(serializer.errors.values()))[0]

        return Response(error_response(
            message=first_error_message,
            error_code="VALIDATION_ERROR"
        ), status=400)



class LoginView(APIView):
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            tokens = serializer.validated_data
            return Response(success_response(
                result=tokens,
                message="로그인에 성공했습니다."
            ))
        return Response(error_response(
            message="아이디 또는 비밀번호가 올바르지 않습니다.",
            error_code="LOGIN_FAILED"
        ), status=401)


class LogoutView(APIView):
    def post(self, request):
        serializer = UserLogoutSerializer(data=request.data)
        if serializer.is_valid():
            return Response(success_response(
                result=None,
                message="로그아웃 되었습니다."
            ))
        return Response(error_response(
            message="유효하지 않은 토큰입니다.",
            error_code="INVALID_TOKEN"
        ), status=400)
    

class CustomTokenRefreshView(SimpleJWTRefreshView):
    serializer_class = TokenRefreshSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data
            return Response(success_response(
                result={"access": data["access"]},
                message="토큰이 재발급되었습니다."
            ))
        except Exception:
            return Response(error_response(
                message="Refresh 토큰이 유효하지 않습니다.",
                error_code="INVALID_REFRESH_TOKEN"
            ), status=401)


class EmailVerificationSendView(APIView):
    def post(self, request):
        serializer = EmailVerificationSendSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(success_response(
                result=None,
                message="인증 코드가 이메일로 전송되었습니다."
            ))


        first_error = next(iter(serializer.errors.values()))[0]
        return Response(error_response(
            message=first_error,
            error_code="EMAIL_VERIFICATION_FAILED"
        ), status=400)

    

class EmailVerificationConfirmView(APIView):
    def post(self, request):
        serializer = EmailVerificationConfirmSerializer(data=request.data)
        if serializer.is_valid():
            return Response(success_response(
                result=None,
                message="이메일 인증이 완료되었습니다."
            ))

        first_error = next(iter(serializer.errors.values()))[0]
        return Response(error_response(
            message=first_error,
            error_code="EMAIL_VERIFICATION_FAILED"
        ), status=400)
    

class FindIDView(APIView):
    def post(self, request):
        serializer = FindIDSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            try:
                user = User.objects.get(email=email)
                masked = mask_username(user.username)
                return Response(success_response(
                    result={"masked_username": masked},
                    message="아이디를 찾았습니다."
                ))
            except User.DoesNotExist:
                return Response(error_response("해당 이메일로 가입된 사용자가 없습니다."), status=status.HTTP_404_NOT_FOUND)
        return Response(error_response("입력값이 잘못되었습니다.", error_code="INVALID_INPUT"), status=status.HTTP_400_BAD_REQUEST)



class PasswordResetRequestView(APIView):
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data["username"]
            email = serializer.validated_data["email"]
            name = serializer.validated_data["name"]
            try:
                user = User.objects.get(username=username, email=email, nickname=name)
                temp_password = generate_temp_password()
                user.set_password(temp_password)
                user.save()

                send_mail(
                    subject="[mobilfit] 임시 비밀번호 안내",
                    message=f"{name}님, 요청하신 임시 비밀번호는 다음과 같습니다:\n\n{temp_password}\n\n로그인 후 반드시 비밀번호를 변경해주세요.",
                    from_email=config("EMAIL_HOST_USER"),
                    recipient_list=[email],
                    fail_silently=False,
                )

                return Response(success_response(message="임시 비밀번호를 이메일로 전송했습니다."))
            except User.DoesNotExist:
                return Response(error_response("입력하신 정보와 일치하는 사용자가 없습니다.", error_code="USER_NOT_FOUND"), status=status.HTTP_404_NOT_FOUND)
        return Response(error_response("입력값이 유효하지 않습니다.", error_code="INVALID_INPUT"), status=status.HTTP_400_BAD_REQUEST)


class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            current_password = serializer.validated_data['current_password']
            new_password = serializer.validated_data['new_password']

            if not user.check_password(current_password):
                return Response(error_response("현재 비밀번호가 올바르지 않습니다.", error_code="WRONG_PASSWORD"), status=status.HTTP_400_BAD_REQUEST)

            user.set_password(new_password)
            user.save()
            return Response(success_response(message="비밀번호가 성공적으로 변경되었습니다."))

        return Response(error_response("입력값이 유효하지 않습니다.", error_code="INVALID_INPUT"), status=status.HTTP_400_BAD_REQUEST)



class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(success_response({
            "username": user.username,
            "email": user.email,
            "nickname": user.nickname
        }))


class MyPageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_data = user.data

        return Response(success_response(
            result={
                "nickname": user.nickname,
                "ride_score": user_data.ride_score,
                "app_usage_count": user_data.app_usage_count,
                "total_saved_money": user_data.total_saved_money,
            },
            message="마이페이지 정보 조회 성공"
        ))
