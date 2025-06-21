from rest_framework.views import APIView
from rest_framework.response import Response
from users.serializers import *
from utils.response import success_response, error_response


class SignupView(APIView):
    def post(self, request):
        serializer = UserSignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(success_response(
                result={"username": user.username, "nickname": user.nickname},
                message="회원가입이 완료되었습니다."
            ))
        else:
            return Response(error_response(
                message="입력값이 유효하지 않습니다.",
                error_code="VALIDATION_ERROR",
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
