from django import forms

class AccountDeletionForm(forms.Form):
    email = forms.EmailField(label="이메일 주소")
    message = forms.CharField(
        label="삭제 요청 내용",
        widget=forms.Textarea(attrs={"rows": 6}),
        max_length=1000,
    )