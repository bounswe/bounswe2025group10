# Import necessary modules
from rest_framework import serializers
from rest_framework.validators import ValidationError
from rest_framework.authtoken.models import Token
from ..models import Users


class LoginSerializer(serializers.ModelSerializer):
    # Define serializer fields with validation rules
    email = serializers.EmailField(max_length=80)
    username = serializers.CharField(max_length=50)
    password = serializers.CharField(min_length = 8, write_only=True)

    class Meta:
        # Specify model and fields to be serialized
        model = Users
        fields = ['email', 'username', 'password']

    def validate(self, attrs):
        # Check if email already exists in database
        email_exists = Users.objects.filter(email=attrs['email']).exists()
        # Check if username already exists in database
        username_exists = Users.objects.filter(username=attrs['username']).exists()

        # Raise validation errors if email or username exists
        if email_exists:
            raise ValidationError("Email already exists.")
        
        elif username_exists:
            raise ValidationError("Username already exists.")

        return super().validate(attrs)
        
    def create(self, validated_data):
        user = Users.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password']
        )
        Token.objects.create(user=user)
        return user
