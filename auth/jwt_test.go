package auth

import (
	"testing"
	"time"
)

func TestJWTGenerationAndValidation(t *testing.T) {
	token, err := GenerateToken(1, "admin", "admin", 1*time.Hour)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}

	claims, err := ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken failed: %v", err)
	}

	if claims.UserID != 1 || claims.Username != "admin" || claims.Role != "admin" {
		t.Errorf("Unexpected claims: %+v", claims)
	}
}

func TestJWTExpired(t *testing.T) {
	// Generate an already expired token
	token, err := GenerateToken(2, "teacher", "teacher", -10*time.Minute)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}

	_, err = ValidateToken(token)
	if err == nil {
		t.Fatalf("Expected expired token error, got nil")
	}
}

func TestJWTTampered(t *testing.T) {
	token, err := GenerateToken(1, "admin", "admin", 1*time.Hour)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}

	// Tamper token
	tampered := token + "tampered"
	_, err = ValidateToken(tampered)
	if err == nil {
		t.Fatalf("Expected invalid signature error, got nil")
	}
}
