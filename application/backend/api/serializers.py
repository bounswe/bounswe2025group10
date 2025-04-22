# Import necessary modules
from rest_framework import serializers
from rest_framework.validators import ValidationError
from rest_framework.authtoken.models import Token
from .models import User


class SignUpSerializer(serializers.ModelSerializer):
    # Define serializer fields with validation rules
    email = serializers.EmailField(max_length=80)
    username = serializers.CharField(max_length=50)
    password = serializers.CharField(min_length = 8, write_only=True)

    class Meta:
        # Specify model and fields to be serialized
        model = User
        fields = ['email', 'username', 'password']

    def validate(self, attrs):
        # Check if email already exists in database
        email_exists = User.objects.filter(email=attrs['email']).exists()
        # Check if username already exists in database
        username_exists = User.objects.filter(username=attrs['username']).exists()

        # Raise validation errors if email or username exists
        if email_exists:
            raise ValidationError("Email already exists.")
        
        elif username_exists:
            raise ValidationError("Username already exists.")

        return super().validate(attrs)
        
    def create(self, validated_data):
        # Extract password from validated data
        password = validated_data.pop('password')

        # Create user instance
        user = super().create(validated_data)

        # Create authentication token for user
        Token.objects.create(user=user)

        # Hash password and save user
        user.set_password(password)
        user.save()
        
        return user
