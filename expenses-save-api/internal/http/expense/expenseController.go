package expense

import (
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/http/middleware"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
	"github.com/google/uuid"
)

type ExpenseController struct {
	expenseService *ExpenseService
}

func NewExpenseController(expenseService *ExpenseService) *ExpenseController {
	return &ExpenseController{
		expenseService: expenseService,
	}
}

func (c *ExpenseController) GetInsertInformation(ctx fiber.Ctx) error {
	userID, err := middleware.GetUserIDFromContext(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "user ID not found in context"})
	}

	withRecurrent := ctx.Query("withRecurrent", "false") == "true"

	info, err := c.expenseService.GetExpenseInsertInformation(ctx.Context(), userID, withRecurrent)
	if err != nil {
		log.Error(err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.Status(fiber.StatusOK).JSON(info)
}

func (c *ExpenseController) AddExpense(ctx fiber.Ctx) error {
	userID, err := middleware.GetUserIDFromContext(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "user ID not found in context"})
	}

	var payload ExpensePayload
	if err := ctx.Bind().Body(&payload); err != nil {
		log.Error(err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if payload.ArsAmount == 0 || payload.UsdAmount == 0 {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "ARS and USD have to be greater than 0"})
	}

	response, err := c.expenseService.AddExpense(ctx.Context(), userID, &payload)
	if err != nil {
		log.Error(err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	log.Info("Added expense")

	return ctx.Status(fiber.StatusCreated).JSON(response)
}

func (c *ExpenseController) GetExpenses(ctx fiber.Ctx) error {
	userID, err := middleware.GetUserIDFromContext(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "user ID not found in context"})
	}

	log.Info("Payload received")

	startDate := ctx.Query("startDate")
	if startDate == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "startDate query parameter is required (format: YYYY-MM-DD)"})
	}

	endDate := ctx.Query("endDate")
	if endDate == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "endDate query parameter is required (format: YYYY-MM-DD)"})
	}

	expenses, err := c.expenseService.GetExpenses(ctx.Context(), userID, startDate, endDate)
	if err != nil {
		log.Error(err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	log.Info("Query ended")
	return ctx.Status(fiber.StatusOK).JSON(expenses)
}

func (c *ExpenseController) UpdateExpense(ctx fiber.Ctx) error {
	userID, err := middleware.GetUserIDFromContext(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "user ID not found in context"})
	}

	expenseIDStr := ctx.Params("id")
	expenseID, err := uuid.Parse(expenseIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid expense ID"})
	}

	var payload ExpensePayload
	if err := ctx.Bind().Body(&payload); err != nil {
		log.Error(err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if payload.ArsAmount == 0 || payload.UsdAmount == 0 {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "ARS and USD have to be greater than 0"})
	}

	response, err := c.expenseService.UpdateExpense(ctx.Context(), userID, expenseID, &payload)
	if err != nil {
		log.Error(err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	log.Info("Updated expense")

	return ctx.Status(fiber.StatusOK).JSON(response)
}

func (c *ExpenseController) DeleteExpense(ctx fiber.Ctx) error {
	userID, err := middleware.GetUserIDFromContext(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "user ID not found in context"})
	}

	expenseIDStr := ctx.Params("id")
	expenseID, err := uuid.Parse(expenseIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid expense ID"})
	}

	err = c.expenseService.DeleteExpense(ctx.Context(), userID, expenseID)
	if err != nil {
		log.Error(err)
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	log.Info("Deleted expense")

	return ctx.Status(fiber.StatusNoContent).Send(nil)
}
