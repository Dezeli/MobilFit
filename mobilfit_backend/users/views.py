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
from datetime import timedelta
from django.utils.timezone import localtime
from django.utils.dateparse import parse_datetime
from django.db.models import Sum, Max, Count, F, Window
from django.db.models.functions import Rank
from .models import RideLog, Feedback


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
            "nickname": user.nickname,
            "date_joined": user.date_joined
        }))


class MyPageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_data = user.data

        # 가장 최근 라이딩 종료 시각
        latest_ride = RideLog.objects.filter(user=user).order_by('-ended_at').first()
        if latest_ride:
            delta = localtime() - latest_ride.ended_at
            if delta < timedelta(hours=24):
                hours = int(delta.total_seconds() // 3600)
                last_used_display = f"{hours}시간 전"
            else:
                days = delta.days
                last_used_display = f"{days}일 전"
        else:
            last_used_display = "기록 없음"


        return Response(success_response(
            result={
                "nickname": user.nickname,
                "ride_score": user_data.ride_score,
                "app_usage_count": user_data.app_usage_count,
                "total_saved_money": user_data.total_saved_money,
                "total_distance_km": round(user_data.total_distance_km, 2),
                "last_used_at": last_used_display
            }
        ))


class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user
        user.is_active = False
        user.save()
        return Response(success_response({"message": "계정이 비활성화되었습니다."}))
    

class UpdateUserDataView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            saved_money = int(request.data.get("saved_money", 0))
            distance_km = float(request.data.get("distance_km", 0))
            score_delta = int(request.data.get("score_delta", 0))
        except (TypeError, ValueError):
            return Response(error_response({"message": "입력값이 유효하지 않습니다."}), status=400)

        if saved_money < 0 or distance_km < 0:
            return Response(error_response({"message": "0 이상의 값이어야 합니다."}), status=400)

        user_data = request.user.data

        # ✅ 1. 점수 증가/감소, 범위 제한 (0~100)
        user_data.ride_score = max(0, min(100, user_data.ride_score + score_delta))

        # 2. 앱 사용 횟수 증가
        user_data.app_usage_count += 1

        # 3. 절약 금액, 주행 거리 증가
        user_data.total_saved_money += saved_money
        user_data.total_distance_km += distance_km

        # 4. 저장
        user_data.save()

        return Response(success_response({
            "ride_score": user_data.ride_score,
            "app_usage_count": user_data.app_usage_count,
            "total_saved_money": user_data.total_saved_money,
            "total_distance_km": user_data.total_distance_km,
            "updated_at": user_data.updated_at
        }))

    
class RideLogCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            distance_km = float(request.data.get("distance_km"))
            duration_seconds = float(request.data.get("duration_seconds"))
            started_at = parse_datetime(request.data.get("started_at"))
            ended_at = parse_datetime(request.data.get("ended_at"))
            provider = request.data.get("provider")
            saved_money = int(request.data.get("saved_money", 0))
        except (TypeError, ValueError):
            return Response(error_response({"message": "입력값이 유효하지 않습니다."}), status=400)

        if not (0 < distance_km < 500 and 0 < duration_seconds < 100000):
            return Response(error_response({"message": "이상한 주행 기록입니다."}), status=400)

        if not (started_at and ended_at):
            return Response(error_response({"message": "시작/종료 시간이 잘못되었습니다."}), status=400)


        log = RideLog.objects.create(
            user=request.user,
            distance_km=distance_km,
            duration_seconds=duration_seconds,
            started_at=started_at,
            ended_at=ended_at,
            provider=provider,
            saved_money=saved_money
        )

        return Response(success_response({
            "id": log.id,
            "distance_km": log.distance_km,
            "duration_seconds": log.duration_seconds,
            "started_at": log.started_at,
            "ended_at": log.ended_at,
        }), status=201)
    


class MyRankView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        period = request.query_params.get("period", "month")
        today = localtime()

        # 1. 기간별 로그 필터링
        if period == "today":
            logs = RideLog.objects.filter(started_at__date=today.date())
        elif period == "month":
            logs = RideLog.objects.filter(
                started_at__date__gte=today.replace(day=1).date(),
                started_at__date__lte=today.date()
            )
        elif period == "all":
            logs = RideLog.objects.all()
        else:
            return Response(error_response({"period": "today, month, all 중 하나여야 합니다."}), status=400)

        # 2. 사용자별 통계 집계
        stats = logs.values("user").annotate(
            total_distance=Sum("distance_km"),
            max_distance=Max("distance_km"),
            count_logs=Count("id"),
            total_time=Sum("duration_seconds"),
            max_time=Max("duration_seconds")
        )

        stats = list(stats)  # 리스트로 변환해 정렬 가능하게 함

        # 3. 랭킹 계산 함수 정의
        def assign_ranks(data, key, rank_key):
            sorted_data = sorted(data, key=lambda x: x[key] or 0, reverse=True)
            for idx, item in enumerate(sorted_data):
                item[rank_key] = idx + 1
            return sorted_data

        # 4. 모든 항목에 대해 랭킹 계산
        rank_fields = [
            ("total_distance", "distance_rank"),
            ("max_distance", "max_distance_rank"),
            ("count_logs", "count_rank"),
            ("total_time", "total_time_rank"),
            ("max_time", "max_time_rank"),
        ]

        for key, rank_key in rank_fields:
            stats = assign_ranks(stats, key, rank_key)

        # 5. 내 랭킹 정보 추출
        my = next((item for item in stats if item["user"] == user.id), None)

        if not my:
            return Response(success_response({
                "ranks": {},
                "grade": "브론즈",
                "message": "해당 기간에 기록이 없습니다."
            }))

        # 6. 평균 등수 → 등급 계산
        ranks = [
            my["distance_rank"],
            my["max_distance_rank"],
            my["count_rank"],
            my["total_time_rank"],
            my["max_time_rank"],
        ]
        avg_rank = sum(ranks) / len(ranks)

        if avg_rank <= 500:
            grade = "플래티넘"
        elif avg_rank <= 1000:
            grade = "골드"
        elif avg_rank <= 1500:
            grade = "실버"
        else:
            grade = "브론즈"

        # 7. 응답 반환
        return Response(success_response({
            "period": period,
            "ranks": {
                "distance": {
                    "rank": my["distance_rank"],
                    "value": my["total_distance"]
                },
                "max_distance": {
                    "rank": my["max_distance_rank"],
                    "value": my["max_distance"]
                },
                "count": {
                    "rank": my["count_rank"],
                    "value": my["count_logs"]
                },
                "total_time": {
                    "rank": my["total_time_rank"],
                    "value": my["total_time"]
                },
                "max_time": {
                    "rank": my["max_time_rank"],
                    "value": my["max_time"]
                }
            },
            "average_rank": round(avg_rank, 2),
            "grade": grade
        }))

class RankingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.query_params.get("period", "month")
        today = localtime()

        if period == "today":
            logs = RideLog.objects.filter(started_at__date=today.date())

        elif period == "month":
            logs = RideLog.objects.filter(
                started_at__date__gte=today.replace(day=1).date(),
                started_at__date__lte=today.date()
            )

        elif period == "all":
            logs = RideLog.objects.all()
        else:
            return Response(error_response({"period": "today, month, all 중 하나여야 합니다."}), status=400)

        # 사용자별 집계
        user_stats = logs.values('user__nickname').annotate(
            distance=Sum('distance_km'),
            max_distance=Max('distance_km'),
            count=Count('id'),
            total_time=Sum('duration_seconds'),
            max_time=Max('duration_seconds')
        )

        def get_top10(sorted_list, key):
            top_items = [
                {
                    "rank": i + 1,
                    "nickname": item["user__nickname"],
                    "value": round(item[key], 2) if item[key] is not None else 0
                }
                for i, item in enumerate(sorted_list[:10])
                if item[key] and item[key] > 0
            ]
            if not top_items:
                return "아직 기록이 없습니다."
            return top_items

        return Response(success_response({
            "period": period,
            "distance": get_top10(sorted(user_stats, key=lambda x: x["distance"] or 0, reverse=True), "distance"),
            "max_distance": get_top10(sorted(user_stats, key=lambda x: x["max_distance"] or 0, reverse=True), "max_distance"),
            "count": get_top10(sorted(user_stats, key=lambda x: x["count"] or 0, reverse=True), "count"),
            "total_time": get_top10(sorted(user_stats, key=lambda x: x["total_time"] or 0, reverse=True), "total_time"),
            "max_time": get_top10(sorted(user_stats, key=lambda x: x["max_time"] or 0, reverse=True), "max_time"),
        }))



class GradeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = localtime()
        logs = RideLog.objects.filter(
            started_at__date__gte=today.replace(day=1).date(),
            started_at__date__lte=today.date()
        )

        # 사용자별 집계
        aggregated = logs.values("user").annotate(
            total_distance=Sum("distance_km"),
            max_distance=Max("distance_km"),
            count_logs=Count("id"),
            total_time=Sum("duration_seconds"),
            max_time=Max("duration_seconds")
        ).annotate(
            distance_rank=Window(expression=Rank(), order_by=F("total_distance").desc()),
            max_distance_rank=Window(expression=Rank(), order_by=F("max_distance").desc()),
            count_rank=Window(expression=Rank(), order_by=F("count_logs").desc()),
            total_time_rank=Window(expression=Rank(), order_by=F("total_time").desc()),
            max_time_rank=Window(expression=Rank(), order_by=F("max_time").desc())
        )

        my = aggregated.filter(user=user.id).order_by("user").first()

        if not my:
            return Response(success_response({
                "grade": "브론즈",
                "message": "이번달 주행 기록이 없어 기본 등급이 적용됩니다."
            }))

        # 평균 순위
        ranks = [
            my["distance_rank"],
            my["max_distance_rank"],
            my["count_rank"],
            my["total_time_rank"],
            my["max_time_rank"],
        ]
        avg_rank = sum(ranks) / len(ranks)

        if avg_rank <= 500:
            grade = "플래티넘"
        elif avg_rank <= 1000:
            grade = "골드"
        elif avg_rank <= 1500:
            grade = "실버"
        else:
            grade = "브론즈"

        return Response(success_response({
            "grade": grade,
            "average_rank": round(avg_rank, 2)
        }))
    


class FeedbackView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = request.data.get("message", "").strip()

        if not message:
            return Response(error_response({"message": "피드백 내용을 입력해주세요."}), status=400)

        Feedback.objects.create(user=request.user, message=message)

        return Response(success_response({"message": "피드백이 정상적으로 접수되었습니다."}))
    

class NoticeListView(APIView):
    permission_classes = []

    def get(self, request):
        notices = Notice.objects.filter(is_active=True).order_by("-created_at")[:10]

        data = [
            {
                "title": notice.title,
                "content": notice.content,
                "created_at": notice.created_at.strftime("%Y-%m-%d %H:%M")
            }
            for notice in notices
        ]

        return Response(success_response(data))
    

class RideLogListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cutoff = localtime() - timedelta(days=14)
        logs = RideLog.objects.filter(user=request.user, started_at__gte=cutoff).order_by('-started_at')

        data = [
            {
                "distance_km": log.distance_km,
                "duration_seconds": log.duration_seconds,
                "duration_display": f"{int(log.duration_seconds // 60)}분 {int(log.duration_seconds % 60)}초",
                "saved_money": log.saved_money,
                "provider": log.provider,
                "started_at": log.started_at,
                "ended_at": log.ended_at,
                "created_at": log.created_at.strftime("%Y-%m-%d %H:%M")
            }
            for log in logs
        ]

        return Response(success_response(data))