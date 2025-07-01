package env

import (
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

var (
	GRPC_PORT            *string
	CREDENTIALS_BASE64   *string
	DB_URL               *string
	STOCK_MARKET_API_URL *string
	EXCHANGE_RATE_TTL    *int8 // in minutes
)

func LoadEnv() {
	err := godotenv.Load()

	if err != nil {
		log.Println("no .env file is present. Skipping")
	}

	setPort()
	loadStr(&CREDENTIALS_BASE64, "CREDENTIALS_BASE64")
	loadStr(&DB_URL, "DB_URL")
	loadStr(&STOCK_MARKET_API_URL, "STOCK_MARKET_API_URL")
	loadInt8(&EXCHANGE_RATE_TTL, "EXCHANGE_RATE_TTL")
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
		log.Fatalf("environment variable %s not found", varName)
	}

	*dest = &p
	return nil
}

func loadInt8(dest **int8, varName string) error {
	p := os.Getenv(varName)

	if len(p) == 0 {
		log.Fatalf("environment variable %s not found", varName)
	}

	num, err := strconv.ParseInt(p, 10, 8)
	if err != nil {
		log.Fatalf("environment variable %s is not a valid int8: %v", varName, err)
	}

	val := int8(num)
	*dest = &val
	return nil
}
