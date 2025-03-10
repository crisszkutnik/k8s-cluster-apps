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
	SPREADSHEET_ID     *string
	CREDENTIALS_BASE64 *string
)

func LoadEnv() {
	err := godotenv.Load()

	if err != nil {
		log.Println("no .env file is present. Skipping")
	}

	setPort()
	loadStr(&SPREADSHEET_ID, "SPREADSHEET_ID")
	loadStr(&CREDENTIALS_BASE64, "CREDENTIALS_BASE64")
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
