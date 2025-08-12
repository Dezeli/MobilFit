from django.shortcuts import render, redirect
from .forms import AccountDeletionForm
from .models import AccountDeletionRequest

def account_deletion_view(request):
    if request.method == "POST":
        form = AccountDeletionForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data
            AccountDeletionRequest.objects.create(
                email=data["email"],
                message=data["message"]
            )
            return redirect("account_deletion_done")
    else:
        form = AccountDeletionForm()
    
    return render(request, "account_deletion.html", {"form": form})

def account_deletion_done_view(request):
    return render(request, "account_deletion_done.html")
