from rest_framework import serializers

class SearchResultSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=["address", "place"])
    name = serializers.CharField()
    address = serializers.CharField()
    x = serializers.CharField()
    y = serializers.CharField()
