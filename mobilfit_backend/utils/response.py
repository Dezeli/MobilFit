def success_response(result=None, message="요청에 성공했습니다."):
    return {
        "success": True,
        "data": {
            "message": message,
            "result": result
        }
    }

def error_response(message="요청에 실패했습니다.", error_code=None):
    data = {
        "message": message
    }
    if error_code:
        data["error_code"] = error_code
    return {
        "success": False,
        "data": data
    }
