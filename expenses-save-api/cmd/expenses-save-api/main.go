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
	paymentmethod "github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/http/paymentMethod"
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
	installmentExpenseRepo := repository.NewInstallmentExpenseRepository(dbService)

	// Services
	categoryService := category.NewCategoryService(categoryRepo)
	expenseService := expense.NewExpenseService(categoryRepo, subcategoryRepo, paymentMethodRepo, recurrentExpenseRepo, expenseRepo, installmentExpenseRepo, dollarService, dbService)
	paymentMethodService := paymentmethod.NewPaymentMethodService(paymentMethodRepo)

	// Controllers
	categoryController := category.NewCategoryController(categoryService)
	expenseController := expense.NewExpenseController(expenseService)
	paymentMethodController := paymentmethod.NewPaymentMethodController(paymentMethodService)

	httpServer := http.NewHttpServer(dbService, categoryController, expenseController, paymentMethodController)
	httpServer.RegisterRouter()

	go func() {
		log.Printf("starting gRPC server on port %s", *env.GRPC_PORT)
		grpcServer.Start()
	}()

	httpServer.Start()
}
