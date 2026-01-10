package http

import (
	"log"

	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/env"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/http/category"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/http/expense"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
)

type HttpServer struct {
	app                *fiber.App
	dbService          *database.DatabaseService
	categoryController *category.CategoryController
	expenseController  *expense.ExpenseController
}

func NewHttpServer(
	databaseService *database.DatabaseService,
	categoryController *category.CategoryController,
	expenseController *expense.ExpenseController,
) *HttpServer {
	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "Accept", "Authorization"},
	}))

	return &HttpServer{
		app:                app,
		dbService:          databaseService,
		categoryController: categoryController,
		expenseController:  expenseController,
	}
}

func (s *HttpServer) Start() {
	log.Printf("starting HTTP server in port %s", *env.HTTP_PORT)
	s.app.Listen(*env.HTTP_PORT)
}

func (s *HttpServer) RegisterRouter() {
	// categoryGroup := s.app.Group("/category")
	// categoryGroup.Get("/", s.categoryController.GetCategoriesByUserID)

	expenseGroup := s.app.Group("/expense")
	expenseGroup.Get("/", s.expenseController.GetExpenses)
	expenseGroup.Get("/insertInformation", s.expenseController.GetInsertInformation)
	expenseGroup.Post("/", s.expenseController.AddExpense)
}
