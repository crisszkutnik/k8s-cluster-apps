package env

import (
	"errors"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

var (
	GRPC_PORT          *string
	CREDENTIALS_BASE64 *string
	DB_URL             *string
)

func LoadEnv() {
	err := godotenv.Load()

	if err != nil {
		log.Println("no .env file is present. Skipping")
	}

	setPort()
	loadStr(&CREDENTIALS_BASE64, "CREDENTIALS_BASE64")
	loadStr(&DB_URL, "DB_URL")
}

func setPort() {
	p := os.Getenv("PORT")
	finalVal := ""

	if !strings.HasPrefix(p, ":") {
		finalVal = ":"
	}

	if len(p) >= 1 {
		finalVal += p
	} else {
		finalVal += "5000"
	}

	GRPC_PORT = &finalVal
}

func loadStr(dest **string, varName string) error {
	p := os.Getenv(varName)

	if len(p) == 0 {
		str := fmt.Sprintf("environment variable %s not found", varName)
		return errors.New(str)
	}

	*dest = &p
	return nil
}
