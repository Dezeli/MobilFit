from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import *
from utils.email import *
from django.utils import timezone
from datetime import timedelta


User = get_user_model()


class UserSignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        error_messages={
            'min_length': "비밀번호는 최소 8자 이상이어야 합니다.",
            'blank': "비밀번호를 입력해주세요.",
        }
    )

    class Meta:
        model = User
        fields = ['username', 'password', 'nickname', 'email']
        extra_kwargs = {
            'username': {'validators': []},
            'email': {'validators': []},
        }

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("이미 사용 중인 아이디입니다.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("이미 가입된 이메일입니다.")
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            nickname=validated_data['nickname'],
            email=validated_data['email']
        )



class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError("아이디 또는 비밀번호가 올바르지 않습니다.")

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        UserToken.objects.create(user=user, refresh_token=refresh_token)

        return {
            'access': access_token,
            'refresh': refresh_token
        }


class UserLogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate(self, attrs):
        refresh_token = attrs.get("refresh")

        deleted, _ = UserToken.objects.filter(refresh_token=refresh_token).delete()
        if deleted == 0:
            raise serializers.ValidationError("유효하지 않은 토큰입니다.")

        return {}



class EmailVerificationSendSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("이미 가입된 이메일입니다.")
        return value

    def create(self, validated_data):
        email = validated_data['email']
        code = generate_verification_code()

        EmailVerification.objects.filter(email=email).delete()
        EmailVerification.objects.create(email=email, code=code)

        send_verification_email(email, code)

        return email

    

class EmailVerificationConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        email = attrs.get('email')
        code = attrs.get('code')

        verification = EmailVerification.objects.filter(
            email=email,
            code=code
        ).first()

        if not verification:
            raise serializers.ValidationError("코드가 일치하지 않습니다.")

        time_limit = timezone.now() - timedelta(minutes=5)
        if verification.created_at < time_limit:
            raise serializers.ValidationError("인증 코드가 만료되었습니다.")

        return attrs
    

class FindIDSerializer(serializers.Serializer):
    email = serializers.EmailField()



class PasswordResetRequestSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    name = serializers.CharField()


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
