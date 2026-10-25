package db

import (
	"os"
	"testing"
)

func TestSafetyGuardDivertsToIsolatedDB(t *testing.T) {
	// Calling InitDB() during testing must NEVER connect to PostgreSQL / production host
	database, err := InitDB()
	if err != nil {
		t.Fatalf("expected InitDB() to safely initialize in-memory test database, got error: %v", err)
	}

	if database == nil {
		t.Fatal("expected non-nil database instance")
	}

	dialectorName := database.Dialector.Name()
	if dialectorName != "sqlite" {
		t.Fatalf("CRITICAL SAFETY FAILURE: expected sqlite in test mode, got dialector: %s", dialectorName)
	}

	// Verify that production DB environment variables were not used
	if os.Getenv("ALLOW_LIVE_DB_TEST") == "true" {
		t.Errorf("ALLOW_LIVE_DB_TEST should not be true by default")
	}
}
