package main

import (
	"log"

	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database/repository"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/dollar"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/env"
	grpcserver "github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/grpcServer"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/http"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/http/category"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/http/expense"
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
	defer dbService.Close()

	sheetsService, err := sheets.NewSheetsService()
	if err != nil {
		log.Fatalf("unable to retrieve Sheets client: %v", err)
	}

	expenseValidatorService, err := validator.NewExpenseValidatorService(dbService, dollarService)
	if err != nil {
		log.Fatalf("unable to start expense validator service: %v", err)
	}

	grpcServer := grpcserver.NewGrpcServer(sheetsService, dbService, expenseValidatorService)

	// Rpositories
	categoryRepo := repository.NewCategoryRepository(dbService)
	subcategoryRepo := repository.NewSubcategoryRepository(dbService)
	paymentMethodRepo := repository.NewPaymentMethodRepository(dbService)
	recurrentExpenseRepo := repository.NewRecurrentExpenseRepository(dbService)
	expenseRepo := repository.NewExpenseRepository(dbService)

	// Services
	categoryService := category.NewCategoryService(categoryRepo)
	expenseService := expense.NewExpenseService(categoryRepo, subcategoryRepo, paymentMethodRepo, recurrentExpenseRepo, expenseRepo)

	// Controllers
	categoryController := category.NewCategoryController(categoryService)
	expenseController := expense.NewExpenseController(expenseService)

	httpServer := http.NewHttpServer(dbService, categoryController, expenseController)
	httpServer.RegisterRouter()

	go func() {
		log.Printf("starting gRPC server on port %s", *env.GRPC_PORT)
		grpcServer.Start()
	}()

	httpServer.Start()
}
