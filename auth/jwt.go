package auth

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

var (
	jwtSecretOnce sync.Once
	jwtSecretKey  []byte
)

// DefaultTokenDuration defines how long an admin token is valid (e.g. 7 days)
const DefaultTokenDuration = 7 * 24 * time.Hour

type header struct {
	Alg string `json:"alg"`
	Typ string `json:"typ"`
}

// Claims represents JWT payload data
type Claims struct {
	UserID    uint   `json:"uid"`
	Username  string `json:"usr"`
	Role      string `json:"rol"`
	ExpiresAt int64  `json:"exp"`
	IssuedAt  int64  `json:"iat"`
}

// GetJWTSecret returns the active secret key for signing JWTs
func GetJWTSecret() []byte {
	jwtSecretOnce.Do(func() {
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			secret = os.Getenv("SECRET_KEY")
		}
		if secret == "" {
			secret = os.Getenv("APP_KEY")
		}
		if secret != "" {
			jwtSecretKey = []byte(secret)
			return
		}

		// Fallback: Generate a persistent random key in memory for this server instance
		buf := make([]byte, 32)
		if _, err := rand.Read(buf); err == nil {
			jwtSecretKey = buf
		} else {
			jwtSecretKey = []byte("school-cms-secure-jwt-default-key-fallback-2026")
		}
	})
	return jwtSecretKey
}

// GenerateToken creates a signed HS256 JWT token for a user
func GenerateToken(userID uint, username, role string, duration time.Duration) (string, error) {
	if duration == 0 {
		duration = DefaultTokenDuration
	}

	now := time.Now()
	claims := Claims{
		UserID:    userID,
		Username:  username,
		Role:      role,
		IssuedAt:  now.Unix(),
		ExpiresAt: now.Add(duration).Unix(),
	}

	h := header{
		Alg: "HS256",
		Typ: "JWT",
	}

	headerJSON, err := json.Marshal(h)
	if err != nil {
		return "", fmt.Errorf("failed to encode JWT header: %w", err)
	}

	payloadJSON, err := json.Marshal(claims)
	if err != nil {
		return "", fmt.Errorf("failed to encode JWT claims: %w", err)
	}

	headerB64 := base64.RawURLEncoding.EncodeToString(headerJSON)
	payloadB64 := base64.RawURLEncoding.EncodeToString(payloadJSON)
	signingInput := headerB64 + "." + payloadB64

	mac := hmac.New(sha256.New, GetJWTSecret())
	mac.Write([]byte(signingInput))
	signature := mac.Sum(nil)
	sigB64 := base64.RawURLEncoding.EncodeToString(signature)

	return signingInput + "." + sigB64, nil
}

// ValidateToken verifies the signature and expiration of a JWT token
func ValidateToken(tokenString string) (*Claims, error) {
	tokenString = strings.TrimSpace(tokenString)
	if tokenString == "" {
		return nil, errors.New("token is empty")
	}

	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return nil, errors.New("invalid token format")
	}

	headerB64, payloadB64, sigB64 := parts[0], parts[1], parts[2]
	signingInput := headerB64 + "." + payloadB64

	expectedSig, err := base64.RawURLEncoding.DecodeString(sigB64)
	if err != nil {
		return nil, errors.New("invalid signature encoding")
	}

	mac := hmac.New(sha256.New, GetJWTSecret())
	mac.Write([]byte(signingInput))
	computedSig := mac.Sum(nil)

	if !hmac.Equal(expectedSig, computedSig) {
		return nil, errors.New("invalid token signature")
	}

	payloadJSON, err := base64.RawURLEncoding.DecodeString(payloadB64)
	if err != nil {
		return nil, errors.New("invalid payload encoding")
	}

	var claims Claims
	if err := json.Unmarshal(payloadJSON, &claims); err != nil {
		return nil, errors.New("failed to decode claims")
	}

	if claims.ExpiresAt < time.Now().Unix() {
		return nil, errors.New("token has expired")
	}

	return &claims, nil
}

// ExtractUserToken extracts JWT from X-Admin-Token or Authorization Bearer header
func ExtractUserToken(r *http.Request) string {
	if r == nil {
		return ""
	}
	token := r.Header.Get("X-Admin-Token")
	if token == "" {
		authHeader := r.Header.Get("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			token = strings.TrimPrefix(authHeader, "Bearer ")
		} else {
			token = authHeader
		}
	}
	return strings.TrimSpace(token)
}
