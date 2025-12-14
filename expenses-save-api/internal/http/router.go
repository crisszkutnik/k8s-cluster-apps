package http

import (
	"log"

	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/env"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/http/expense"
	"github.com/gofiber/fiber/v3"
)

type HttpServer struct {
	app       *fiber.App
	dbService *database.DatabaseService
}

func NewHttpServer(databaseService *database.DatabaseService) *HttpServer {
	app := fiber.New()

	return &HttpServer{app: app, dbService: databaseService}
}

func (s *HttpServer) Start() {
	log.Printf("starting HTTP server in port %s", *env.HTTP_PORT)
	s.app.Listen(*env.HTTP_PORT)
}

func (s *HttpServer) RegisterRouter() {
	expenseService := expense.NewExpenseService(s.dbService)
	expenseController := expense.NewExpenseController(expenseService)

	expenseGroup := s.app.Group("/expenses")
	expenseGroup.Get("/", expenseController.GetExpenses)
}
