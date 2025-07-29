from django.contrib.admin.views.decorators import staff_member_required
from django.views.static import serve
from django.conf import settings
import os

@staff_member_required(login_url='/admin/login/')
def serve_docs(request, path=''):
    if path == '' or path.endswith('/'):
        path = os.path.join(path, 'index.html')
    project_root = os.path.dirname(settings.BASE_DIR)
    doc_root = os.path.join(project_root, 'apidocs', 'site')
    return serve(request, path, document_root=doc_root)
