package main

import (
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/crisszkutnik/k8s-cluster-apps/lambda-health-checker/internal/discord"
	"github.com/crisszkutnik/k8s-cluster-apps/lambda-health-checker/internal/env"
)

func main() {
	err := env.LoadEnv()

	if err != nil {
		log.Fatal(err)
	}

	body, err := getRequestBody()

	if err != nil {
		discord.SendFailureNotification(err)
		log.Fatal("failed to query requested service: ", err)
	}

	parsedTime, err := parseTime(body)

	if err != nil {
		discord.SendFailureNotification(err)
		log.Fatal("failed to parse retrieved time from service: ", err)
	}

	diff := time.Since(parsedTime).Abs().Seconds()

	if diff > float64(*env.MAX_DIFF_SECONDS) {
		msg := fmt.Sprintf("time difference (%.2f seconds) exceeds the allowed maximum (%d seconds)", diff, *env.MAX_DIFF_SECONDS)
		discord.SendFailureNotification(errors.New(msg))
		log.Fatal(msg)
	}

	log.Println("Service health was verified successfully")
	if env.LOG_SUCCESS {
		err = discord.SendSuccessNotification()

		if err != nil {
			log.Fatal("fatal error when trying to send Discord notification: ", err)
		}
	}

}

func getRequestBody() (string, error) {
	resp, err := http.Get(*env.PUBLIC_TARGET_URL)

	if err != nil {
		return "", err
	}

	body, err := io.ReadAll(resp.Body)

	if err != nil {
		return "", err
	}

	return string(body), nil
}

func parseTime(body string) (time.Time, error) {
	const prefix = "NOW: "

	if !strings.HasPrefix(body, prefix) {
		return time.Time{}, fmt.Errorf("invalid format: missing 'NOW: ' prefix, received %q", body)
	}

	dateStr := strings.TrimPrefix(body, prefix)
	dateStr = strings.Split(dateStr, " m=")[0]

	parsedTime, err := time.Parse("2006-01-02 15:04:05.999999999 -0700 MST", dateStr)

	if err != nil {
		return time.Time{}, err
	}

	return parsedTime, nil
}
