from rest_framework.views import APIView
from rest_framework.response import Response
from users.serializers import *
from utils.response import success_response, error_response
from rest_framework_simplejwt.views import TokenRefreshView as SimpleJWTRefreshView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer


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