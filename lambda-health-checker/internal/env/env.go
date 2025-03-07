package env

import (
	"errors"
	"log"
	"os"
	"strconv"

	"github.com/hashicorp/go-multierror"
	"github.com/joho/godotenv"
)

var (
	PUBLIC_TARGET_URL   *string
	MAX_DIFF_SECONDS    *int8
	DISCORD_WEBHOOK_URL *string
	LOG_SUCCESS         bool
)

type EnvironmentLoaderFunction func() error

func LoadEnv() error {
	err := godotenv.Load()

	if err != nil {
		log.Println("No .env file is present. Skipping")
	}

	functions := []EnvironmentLoaderFunction{setPublicTargetUrl, setDiscordWebhookUrl}

	var allErrors error
	failed := false

	for _, fn := range functions {
		err := fn()

		if err != nil {
			allErrors = multierror.Append(allErrors, err)
			failed = true
		}
	}

	if failed {
		return allErrors
	}

	setMaxDiffSeconds()
	setLogSuccess()

	return nil
}

func setPublicTargetUrl() error {
	p := os.Getenv("PUBLIC_TARGET_URL")

	if len(p) == 0 {
		return errors.New("environment variable PUBLIC_TARGET_URL is not set")
	}

	PUBLIC_TARGET_URL = &p
	return nil
}

func setDiscordWebhookUrl() error {
	p := os.Getenv("DISCORD_WEBHOOK_URL")

	if len(p) == 0 {
		return errors.New("environment variable DISCORD_WEBHOOK_URL is not set")
	}

	DISCORD_WEBHOOK_URL = &p
	return nil
}

func setLogSuccess() {
	p := os.Getenv("LOG_SUCCESS")
	LOG_SUCCESS = len(p) > 0 && p == "true"
}

func setMaxDiffSeconds() {
	p := os.Getenv("MAX_DIFF_SECONDS")
	var defaultValue int8 = 5

	if len(p) == 0 {
		log.Println("MAX_DIFF_SECONDS is not set. Using default value")
		MAX_DIFF_SECONDS = &defaultValue
		return
	}

	parsedValue, err := strconv.ParseInt(p, 10, 8)

	if err != nil {
		log.Printf("Value '%s' for MAX_DIFF_SECONDS is not an integer. Using default value", p)
		MAX_DIFF_SECONDS = &defaultValue
		return
	}

	var value int8 = int8(parsedValue)
	MAX_DIFF_SECONDS = &value
}
