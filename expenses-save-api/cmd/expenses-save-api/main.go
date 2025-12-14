package main

import (
	"log"

	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/dollar"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/env"
	grpcserver "github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/grpcServer"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/http"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/sheets"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/validator"
)

func main() {
	env.LoadEnv()

	dollarService, err := dollar.NewDollarService()
	if err != nil {
		log.Fatalf("unable to start dollar service: %v", err)
	}

	dbService, err := database.NewDatabaseService()
	if err != nil {
		log.Fatalf("unable to start database service: %v", err)
	}

	sheetsService, err := sheets.NewSheetsService()
	if err != nil {
		log.Fatalf("unable to retrieve Sheets client: %v", err)
	}

	expenseValidatorService, err := validator.NewExpenseValidatorService(dbService, dollarService)
	if err != nil {
		log.Fatalf("unable to start expense validator service: %v", err)
	}

	grpcServer := grpcserver.NewGrpcServer(sheetsService, dbService, expenseValidatorService)

	httpServer := http.NewHttpServer(dbService)
	httpServer.RegisterRouter()

	go func() {
		log.Printf("starting gRPC server on port %s", *env.GRPC_PORT)
		grpcServer.Start()
	}()

	log.Printf("starting HTTP server on port %s", *env.HTTP_PORT)
	httpServer.Start()
}
