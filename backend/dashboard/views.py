from django.views.generic import TemplateView
from django.http import JsonResponse

class DashboardView(TemplateView):
    template_name = 'dashboard/index.html'

def health_check(request):
    """
    A simple health check endpoint that returns a 200 OK response.
    """
    return JsonResponse({"status": "ok"})