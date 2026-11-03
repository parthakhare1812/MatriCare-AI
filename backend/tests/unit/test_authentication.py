
from datetime import timedelta

import jwt
import pytest

from app.core.config import settings
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_password_hashing():
    password = "TestPassword@123"

    hashed_password = hash_password(password)

    assert hashed_password != password
    assert verify_password(password, hashed_password)
    assert not verify_password("WrongPassword@123", hashed_password)


def test_password_hashes_are_unique():
    password = "TestPassword@123"

    first_hash = hash_password(password)
    second_hash = hash_password(password)

    assert first_hash != second_hash
    assert verify_password(password, first_hash)
    assert verify_password(password, second_hash)


def test_create_and_decode_access_token():
    subject = "test-user-123"

    token = create_access_token(subject)
    payload = decode_access_token(token)

    assert payload["sub"] == subject
    assert "iat" in payload
    assert "exp" in payload


def test_create_access_token_with_custom_expiration():
    token = create_access_token(
        "test-user-123",
        expires_delta=timedelta(minutes=30),
    )

    payload = decode_access_token(token)

    assert payload["sub"] == "test-user-123"


@pytest.mark.parametrize("subject", ["", " ", "   "])
def test_create_access_token_rejects_empty_subject(subject):
    with pytest.raises(ValueError):
        create_access_token(subject)


@pytest.mark.parametrize(
    "expiration",
    [
        timedelta(seconds=0),
        timedelta(seconds=-10),
    ],
)
def test_create_access_token_rejects_invalid_expiration(expiration):
    with pytest.raises(ValueError):
        create_access_token(
            "test-user-123",
            expires_delta=expiration,
        )


def test_decode_access_token_rejects_expired_token():
    token = jwt.encode(
        {
            "sub": "test-user-123",
            "iat": 1000000000,
            "exp": 1000000001,
        },
        settings.SECRET_KEY,
        algorithm="HS256",
    )

    with pytest.raises(jwt.ExpiredSignatureError):
        decode_access_token(token)


def test_decode_access_token_rejects_invalid_signature():
    token = create_access_token("test-user-123")

    tampered_token = token[:-5] + "abcde"

    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(tampered_token)


def test_decode_access_token_rejects_missing_subject():
    token = jwt.encode(
        {
            "iat": 1000000000,
            "exp": 4102444800,
        },
        settings.SECRET_KEY,
        algorithm="HS256",
    )

    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(token)


def test_decode_access_token_rejects_blank_subject():
    token = jwt.encode(
        {
            "sub": " ",
            "iat": 1000000000,
            "exp": 4102444800,
        },
        settings.SECRET_KEY,
        algorithm="HS256",
    )

    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(token)
