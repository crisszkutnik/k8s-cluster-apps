package main

import (
	"log"

	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/env"
	grpcserver "github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/grpcServer"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/sheets"
)

func main() {
	env.LoadEnv()

	sheetsService, err := sheets.NewSheetsService()
	if err != nil {
		log.Fatalf("unable to retrieve Sheets client: %v", err)
	}

	grpcServer := grpcserver.NewGrpcServer(sheetsService)

	grpcServer.Start()
}
