package discord

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/crisszkutnik/k8s-cluster-apps/lambda-health-checker/internal/env"
)

type DiscordEmbed struct {
	Title       string `json:"title"`
	Type        string `json:"type"`
	Color       uint32 `json:"color"`
	Description string `json:"description"`
}

type WebhookMessage struct {
	Embeds []DiscordEmbed `json:"embeds"`
}

func createEmbed() *DiscordEmbed {
	return &DiscordEmbed{
		Type: "rich",
	}
}

func SendSuccessNotification() error {
	obj := WebhookMessage{}
	embed := createEmbed()
	embed.Title = "Cluster is up"
	embed.Description = "Successfully verified health of cluster"
	embed.Color = 3319890
	obj.Embeds = []DiscordEmbed{*embed}
	return sendDiscordNotification(&obj)
}

func SendFailureNotification(err error) error {
	obj := WebhookMessage{}
	embed := createEmbed()
	embed.Title = "Cluster health check failed"
	embed.Description = fmt.Sprintf("Failed to verify health of cluster. Error:\n\n%s", err)
	embed.Color = 12851995
	obj.Embeds = []DiscordEmbed{*embed}
	return sendDiscordNotification(&obj)
}

func sendDiscordNotification(content *WebhookMessage) error {
	data, err := json.Marshal(content)

	if err != nil {
		return err
	}

	resp, err := http.Post(*env.DISCORD_WEBHOOK_URL, "application/json", bytes.NewBuffer(data))

	if err != nil {
		return err
	}

	resp.Body.Close()
	return nil
}
