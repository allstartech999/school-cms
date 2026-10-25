package db

import (
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"school-cms/models"
	"strings"
	"sync"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var (
	testDBMu   sync.Mutex
	testDBInst *gorm.DB
)

// isTestEnvironment checks if the current process is running as a Go test
func isTestEnvironment() bool {
	if os.Getenv("APP_ENV") == "test" || os.Getenv("GO_ENV") == "test" {
		return true
	}
	if flag.Lookup("test.v") != nil {
		return true
	}
	base := filepath.Base(os.Args[0])
	if strings.HasSuffix(base, ".test") || strings.HasSuffix(base, ".test.exe") || strings.Contains(os.Args[0], "/_test/") {
		return true
	}
	for _, arg := range os.Args {
		if strings.HasPrefix(arg, "-test.") {
			return true
		}
	}
	return false
}

// InitTestDB initializes an isolated in-memory SQLite database for unit & integration testing.
// It migrates schemas and seeds initial fixtures, completely isolating tests from the production database.
func InitTestDB() (*gorm.DB, error) {
	testDBMu.Lock()
	defer testDBMu.Unlock()

	// If test database is already initialized, reuse it
	if testDBInst != nil {
		DB = testDBInst
		return testDBInst, nil
	}

	// Default admin password for test fixtures to match test expectations
	if os.Getenv("ADMIN_DEFAULT_PASSWORD") == "" || os.Getenv("ADMIN_DEFAULT_PASSWORD") == "admin123" {
		_ = os.Setenv("ADMIN_DEFAULT_PASSWORD", "44012012")
	}

	// Use in-memory SQLite with shared cache for the lifetime of the test process
	database, err := gorm.Open(sqlite.Open("file:school_test_mem?mode=memory&cache=shared"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to open in-memory sqlite test db: %w", err)
	}

	sqlDB, err := database.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get sql.DB: %w", err)
	}
	sqlDB.SetMaxOpenConns(1)

	// Auto-migrate tables
	if err := database.AutoMigrate(
		&models.Post{},
		&models.Page{},
		&models.Setting{},
		&models.Media{},
		&models.User{},
		&models.AgentKey{},
		&models.Category{},
		&models.Extension{},
	); err != nil {
		return nil, fmt.Errorf("failed to migrate tables in test db: %w", err)
	}

	// Seed initial fixtures
	seedInitialData(database)

	DB = database
	testDBInst = database

	log.Println("[TEST DB] Connected to isolated In-Memory SQLite database. Production DB is safe.")
	return database, nil
}
